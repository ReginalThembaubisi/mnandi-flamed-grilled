package com.mnandi.service;

import com.mnandi.model.MenuItem;
import com.mnandi.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MenuService {

    private final Path uploadLocation;

    @Autowired
    private MenuItemRepository menuItemRepository;

    public MenuService() {
        this.uploadLocation = Paths.get("uploads");
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public List<MenuItem> getAllMenuItems() {
        return menuItemRepository.findAll();
    }

    public List<MenuItem> getAvailableMenuItems() {
        return menuItemRepository.findByAvailableTrue();
    }

    public Optional<MenuItem> getMenuItemById(Long id) {
        return menuItemRepository.findById(id);
    }

    public MenuItem saveMenuItem(MenuItem menuItem) {
        return menuItemRepository.save(menuItem);
    }

    public void deleteMenuItem(Long id) {
        menuItemRepository.deleteById(id);
    }

    public String saveImage(MultipartFile file) {
        String filename = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file " + filename);
            }
            if (filename.contains("..")) {
                throw new RuntimeException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }

            // Generate unique filename to avoid conflicts
            String uniqueFilename = UUID.randomUUID().toString() + "_" + filename;

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, this.uploadLocation.resolve(uniqueFilename),
                        StandardCopyOption.REPLACE_EXISTING);
            }

            return uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + filename, e);
        }
    }

    public int cleanupDuplicates() {
        List<MenuItem> allItems = menuItemRepository.findAll();
        int deletedCount = 0;

        // Group by name (case-insensitive)
        // We use a simple approach: sort by ID desc, then keep first encounter of each
        // name
        for (int i = 0; i < allItems.size(); i++) {
            MenuItem current = allItems.get(i);

            // Check if this name exists in any other item
            for (int j = i + 1; j < allItems.size(); j++) {
                MenuItem other = allItems.get(j);

                if (current.getName().trim().equalsIgnoreCase(other.getName().trim())) {
                    // Duplicate found!
                    // We want to keep the one with higher ID (newer) and delete the older one
                    // But since we're just iterating, let's delete the 'other' one if it has lower
                    // ID,
                    // or 'current' if it has lower ID.

                    if (current.getId() > other.getId()) {
                        menuItemRepository.deleteById(other.getId());
                        allItems.remove(j);
                        j--; // adjust index
                        deletedCount++;
                    } else {
                        menuItemRepository.deleteById(current.getId());
                        allItems.remove(i);
                        i--; // adjust index
                        deletedCount++;
                        break; // current is gone, stop checking against it
                    }
                }
            }
        }
        return deletedCount;
    }
}
