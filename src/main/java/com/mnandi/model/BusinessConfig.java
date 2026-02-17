package com.mnandi.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "business_config")
public class BusinessConfig {

    @Id
    private String id; // Fixed ID "current"

    private boolean isOpen;
    private String message;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public BusinessConfig() {
    }

    public BusinessConfig(String id, boolean isOpen, String message, LocalDateTime updatedAt, String updatedBy) {
        this.id = id;
        this.isOpen = isOpen;
        this.message = message;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isOpen")
    public boolean isOpen() {
        return isOpen;
    }

    public void setOpen(boolean open) {
        isOpen = open;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
