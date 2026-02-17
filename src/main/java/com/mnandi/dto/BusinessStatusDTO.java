package com.mnandi.dto;

public class BusinessStatusDTO {
    private String day;
    private Boolean open;
    private String openingTime;
    private String closingTime;

    public BusinessStatusDTO() {
    }

    public BusinessStatusDTO(String day, Boolean open, String openingTime, String closingTime) {
        this.day = day;
        this.open = open;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public Boolean getOpen() {
        return open;
    }

    public void setOpen(Boolean open) {
        this.open = open;
    }

    public String getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(String openingTime) {
        this.openingTime = openingTime;
    }

    public String getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(String closingTime) {
        this.closingTime = closingTime;
    }
}
