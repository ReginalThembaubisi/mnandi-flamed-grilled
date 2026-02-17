package com.mnandi.service;

import com.mnandi.dto.BusinessStatusDTO;
import com.mnandi.dto.MenuItemDTO;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleSheetsService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleSheetsService.class);

    @Value("${google.sheets.menu.url}")
    private String menuUrl;

    @Value("${google.sheets.sides.url}")
    private String sidesUrl;

    @Value("${google.sheets.business.url}")
    private String businessUrl;

    /**
     * Fetches menu items from both Menu and Sides Google Sheets
     */
    public List<MenuItemDTO> fetchMenuItems() {
        List<MenuItemDTO> allItems = new ArrayList<>();

        try {
            // Fetch main menu items
            List<MenuItemDTO> menuItems = fetchMenuFromUrl(menuUrl, "Menu");
            allItems.addAll(menuItems);

            // Fetch sides
            List<MenuItemDTO> sidesItems = fetchMenuFromUrl(sidesUrl, "Sides");
            allItems.addAll(sidesItems);

            logger.info("Successfully fetched {} total menu items", allItems.size());
        } catch (Exception e) {
            logger.error("Error fetching menu items: {}", e.getMessage(), e);
        }

        return allItems;
    }

    /**
     * Fetches menu items from a specific Google Sheets URL
     */
    private List<MenuItemDTO> fetchMenuFromUrl(String sheetUrl, String category) {
        List<MenuItemDTO> items = new ArrayList<>();

        try {
            logger.info("Fetching {} items from Google Sheets...", category);

            URL url = new URL(sheetUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int responseCode = connection.getResponseCode();
            if (responseCode != 200) {
                logger.error("Failed to fetch {} sheet. HTTP Response Code: {}", category, responseCode);
                return items;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            CSVParser csvParser = new CSVParser(reader,
                    CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim());

            for (CSVRecord record : csvParser) {
                try {
                    MenuItemDTO item = new MenuItemDTO();

                    // Try multiple column name variations for better compatibility
                    if (category.equals("Menu")) {
                        item.setName(getValueWithVariations(record,
                                new String[] { "item", "name", "item name", "product", "menu item" }, ""));
                        item.setPrice(parseDouble(
                                getValueWithVariations(record, new String[] { "price", "cost", "amount" }, "0")));
                        item.setAvailable(parseBoolean(getValueWithVariations(record,
                                new String[] { "available", "in stock", "active", "enabled", "status" }, "TRUE")));
                        item.setImageUrl(getValueWithVariations(record,
                                new String[] { "img", "image", "image url", "imageurl", "photo", "picture" }, ""));
                        item.setDescription(getValueWithVariations(record,
                                new String[] { "description", "desc", "details", "info" }, ""));
                        item.setCategory("Main Items");
                    } else if (category.equals("Sides")) {
                        item.setName(getValueWithVariations(record,
                                new String[] { "side name", "name", "side", "item" }, ""));
                        item.setPrice(parseDouble(
                                getValueWithVariations(record, new String[] { "price", "cost", "amount" }, "0")));
                        item.setAvailable(parseBoolean(getValueWithVariations(record,
                                new String[] { "available", "in stock", "active", "enabled" }, "TRUE")));
                        item.setImageUrl(""); // Sides don't have images
                        item.setDescription("");
                        item.setCategory("Sides");
                    }

                    // Skip items with empty names
                    if (item.getName() != null && !item.getName().trim().isEmpty()) {
                        items.add(item);
                        logger.debug("Added item: {} - R{}", item.getName(), item.getPrice());
                    }
                } catch (Exception e) {
                    logger.warn("Error parsing record: {}", e.getMessage());
                }
            }

            csvParser.close();
            reader.close();
            connection.disconnect();

            logger.info("Successfully fetched {} {} items", items.size(), category);

        } catch (Exception e) {
            logger.error("Error fetching {} from Google Sheets: {}", category, e.getMessage(), e);
        }

        return items;
    }

    /**
     * Fetches business hours/status from Google Sheets
     */
    public List<BusinessStatusDTO> fetchBusinessStatus() {
        List<BusinessStatusDTO> statusList = new ArrayList<>();

        try {
            logger.info("Fetching business hours from Google Sheets...");

            URL url = new URL(businessUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int responseCode = connection.getResponseCode();
            if (responseCode != 200) {
                logger.warn("Business hours sheet not available. HTTP Response Code: {}", responseCode);
                return getDefaultBusinessHours();
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            CSVParser csvParser = new CSVParser(reader,
                    CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim());

            for (CSVRecord record : csvParser) {
                try {
                    BusinessStatusDTO status = new BusinessStatusDTO();
                    status.setDay(getValueOrDefault(record, "day", ""));
                    status.setOpen(parseBoolean(getValueOrDefault(record, "open", "TRUE")));
                    status.setOpeningTime(getValueOrDefault(record, "openingtime", "09:00"));
                    status.setClosingTime(getValueOrDefault(record, "closingtime", "21:00"));

                    statusList.add(status);
                } catch (Exception e) {
                    logger.warn("Error parsing business status record: {}", e.getMessage());
                }
            }

            csvParser.close();
            reader.close();
            connection.disconnect();

            logger.info("Successfully fetched business hours for {} days", statusList.size());

        } catch (Exception e) {
            logger.warn("Business hours not available, returning defaults: {}", e.getMessage());
            return getDefaultBusinessHours();
        }

        return statusList.isEmpty() ? getDefaultBusinessHours() : statusList;
    }

    /**
     * Returns default business hours if Google Sheet is not available
     */
    private List<BusinessStatusDTO> getDefaultBusinessHours() {
        List<BusinessStatusDTO> defaults = new ArrayList<>();
        String[] days = { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };

        for (String day : days) {
            defaults.add(new BusinessStatusDTO(day, true, "09:00", "21:00"));
        }

        return defaults;
    }

    /**
     * Helper method to safely get value from CSV record
     */
    private String getValueOrDefault(CSVRecord record, String columnName, String defaultValue) {
        try {
            if (record.isMapped(columnName)) {
                String value = record.get(columnName);
                return (value != null && !value.trim().isEmpty()) ? value.trim() : defaultValue;
            }
        } catch (Exception e) {
            logger.debug("Column '{}' not found, using default", columnName);
        }
        return defaultValue;
    }

    /**
     * Helper method to try multiple column name variations
     */
    private String getValueWithVariations(CSVRecord record, String[] columnNames, String defaultValue) {
        for (String columnName : columnNames) {
            try {
                if (record.isMapped(columnName)) {
                    String value = record.get(columnName);
                    if (value != null && !value.trim().isEmpty()) {
                        logger.debug("Found column '{}' with value: {}", columnName, value);
                        return value.trim();
                    }
                }
            } catch (Exception e) {
                // Try next variation
            }
        }
        logger.debug("None of the column variations {} found, using default: {}", String.join(", ", columnNames),
                defaultValue);
        return defaultValue;
    }

    /**
     * Helper method to parse double values
     */
    private Double parseDouble(String value) {
        try {
            // Remove currency symbols and whitespace
            value = value.replaceAll("[R\\s,]", "").trim();
            return Double.parseDouble(value);
        } catch (Exception e) {
            logger.warn("Error parsing double value '{}', defaulting to 0.0", value);
            return 0.0;
        }
    }

    /**
     * Helper method to parse boolean values (handles checkboxes)
     */
    private Boolean parseBoolean(String value) {
        if (value == null || value.trim().isEmpty()) {
            return true;
        }
        value = value.trim().toLowerCase();
        return value.equals("true") || value.equals("yes") || value.equals("1") || value.equals("✓")
                || value.equals("☑");
    }
}
