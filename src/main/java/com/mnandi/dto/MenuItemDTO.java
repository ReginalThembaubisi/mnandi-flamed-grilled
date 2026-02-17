package com.mnandi.dto;

public class MenuItemDTO {
    private String name;
    private Double price;
    private Boolean available;
    private String imageUrl;
    private String description;
    private String category;

    public MenuItemDTO() {
    }

    public MenuItemDTO(String name, Double price, Boolean available, String imageUrl, String description,
            String category) {
        this.name = name;
        this.price = price;
        this.available = available;
        this.imageUrl = imageUrl;
        this.description = description;
        this.category = category;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
