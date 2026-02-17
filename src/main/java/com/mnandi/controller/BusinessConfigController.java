package com.mnandi.controller;

import com.mnandi.model.BusinessConfig;
import com.mnandi.service.BusinessConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = { "http://localhost:3000", "https://*.vercel.app" }, allowCredentials = "true")
public class BusinessConfigController {

    private static final Logger logger = LoggerFactory.getLogger(BusinessConfigController.class);

    @Autowired
    private BusinessConfigService configService;

    /**
     * GET /api/config/status - Get current business status
     */
    @GetMapping("/status")
    public ResponseEntity<BusinessConfig> getStatus() {
        try {
            BusinessConfig config = configService.getConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            logger.error("Error fetching business status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/config/status - Update business status
     */
    @PostMapping("/status")
    public ResponseEntity<BusinessConfig> updateStatus(@RequestBody Map<String, Object> updateRequest) {
        try {
            Boolean isOpen = (Boolean) updateRequest.get("isOpen");
            String message = (String) updateRequest.get("message");
            String updatedBy = (String) updateRequest.getOrDefault("updatedBy", "admin");

            if (isOpen == null) {
                return ResponseEntity.badRequest().build();
            }

            BusinessConfig updatedConfig = configService.updateStatus(isOpen, message, updatedBy);
            return ResponseEntity.ok(updatedConfig);
        } catch (Exception e) {
            logger.error("Error updating business status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
