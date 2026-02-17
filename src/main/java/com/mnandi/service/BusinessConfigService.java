package com.mnandi.service;

import com.mnandi.model.BusinessConfig;
import com.mnandi.repository.BusinessConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class BusinessConfigService {

    private static final Logger logger = LoggerFactory.getLogger(BusinessConfigService.class);
    private static final String CONFIG_ID = "current";

    @Autowired
    private BusinessConfigRepository configRepository;

    @javax.annotation.PostConstruct
    public void init() {
        getConfig(); // Ensure default config exists on startup
    }

    /**
     * Get the current business configuration.
     * Creates a default "Open" config if none exists.
     */
    public BusinessConfig getConfig() {
        return configRepository.findById(CONFIG_ID)
                .orElseGet(() -> {
                    logger.info("No business config found, creating default (OPEN)");
                    BusinessConfig defaultConfig = new BusinessConfig(
                            CONFIG_ID,
                            true, // Default to open
                            "We are open!",
                            LocalDateTime.now(),
                            "system");
                    return configRepository.save(defaultConfig);
                });
    }

    /**
     * Update business status (open/closed)
     */
    @Transactional
    public BusinessConfig updateStatus(boolean isOpen, String message, String updatedBy) {
        BusinessConfig config = getConfig();
        config.setOpen(isOpen);
        config.setMessage(message);
        config.setUpdatedAt(LocalDateTime.now());
        config.setUpdatedBy(updatedBy);

        logger.info("Updated business status to: {} (by {})", isOpen ? "OPEN" : "CLOSED", updatedBy);
        return configRepository.save(config);
    }
}
