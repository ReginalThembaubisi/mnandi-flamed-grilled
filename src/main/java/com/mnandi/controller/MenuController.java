package com.mnandi.controller;

import com.mnandi.model.MenuItem;
import com.mnandi.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" }, allowCredentials = "true")
public class MenuController {

    @Autowired
    private MenuService menuService;

    /**
     * GET /api/menu - Fetch all menu items from Database (Public)
     */
    @GetMapping
    public ResponseEntity<List<MenuItem>> getMenu() {
        return ResponseEntity.ok(menuService.getAllMenuItems());
    }

    /**
     * GET /api/menu/public - Fetch only available menu items
     */
    @GetMapping("/public")
    public ResponseEntity<List<MenuItem>> getPublicMenu() {
        return ResponseEntity.ok(menuService.getAvailableMenuItems());
    }

    /**
     * GET /api/menu/{id} - Get single menu item
     */
    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getMenuItem(@PathVariable Long id) {
        return menuService.getMenuItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/menu - Create a new menu item
     */
    @PostMapping
    public ResponseEntity<MenuItem> createMenuItem(@RequestBody MenuItem menuItem) {
        return ResponseEntity.ok(menuService.saveMenuItem(menuItem));
    }

    /**
     * PUT /api/menu/{id} - Update a menu item
     */
    @PutMapping("/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem menuItemDetails) {
        Optional<MenuItem> menuItem = menuService.getMenuItemById(id);

        if (menuItem.isPresent()) {
            MenuItem existingItem = menuItem.get();
            existingItem.setName(menuItemDetails.getName());
            existingItem.setPrice(menuItemDetails.getPrice());
            existingItem.setDescription(menuItemDetails.getDescription());
            existingItem.setCategory(menuItemDetails.getCategory());
            existingItem.setImageUrl(menuItemDetails.getImageUrl());
            existingItem.setAvailable(menuItemDetails.getAvailable());
            existingItem.setBadge(menuItemDetails.getBadge());

            final MenuItem updatedItem = menuService.saveMenuItem(existingItem);
            return ResponseEntity.ok(updatedItem);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/menu/{id} - Delete a menu item
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        if (menuService.getMenuItemById(id).isPresent()) {
            menuService.deleteMenuItem(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * POST /api/menu/upload - Upload an image
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String filename = menuService.saveImage(file);

        // Construct the URL to access the file
        // This assumes that /uploads/** serves from the upload directory
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(filename)
                .toUriString();

        Map<String, String> response = new HashMap<>();
        response.put("url", fileDownloadUri);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/menu/health - Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Mnandi Backend (DB Mode)");
        health.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(health);
    }

    /**
     * DELETE /api/menu/cleanup - Remove duplicate menu items
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupDuplicates() {
        int deletedCount = menuService.cleanupDuplicates();
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cleanup successful");
        response.put("deletedCount", deletedCount);
        return ResponseEntity.ok(response);
    }
}
