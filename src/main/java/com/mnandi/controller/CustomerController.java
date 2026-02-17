package com.mnandi.controller;

import com.mnandi.model.Customer;
import com.mnandi.service.CustomerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = { "http://localhost:3000", "https://*.vercel.app" }, allowCredentials = "true")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private CustomerService customerService;

    /**
     * GET /api/customers - Get all customers (sorted by total spent desc)
     */
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        try {
            logger.info("Fetching all customers");
            List<Customer> customers = customerService.getAllCustomers();
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            logger.error("Error fetching customers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/customers/{id} - Get customer by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        try {
            logger.info("Fetching customer with ID: {}", id);
            Customer customer = customerService.getCustomerById(id);
            return ResponseEntity.ok(customer);
        } catch (RuntimeException e) {
            logger.warn("Customer not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error fetching customer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/customers/phone/{phone} - Get customer by phone number
     */
    @GetMapping("/phone/{phone}")
    public ResponseEntity<Customer> getCustomerByPhone(@PathVariable String phone) {
        try {
            logger.info("Fetching customer with phone: {}", phone);
            Customer customer = customerService.getCustomerByPhone(phone);
            return ResponseEntity.ok(customer);
        } catch (RuntimeException e) {
            logger.warn("Customer not found with phone: {}", phone);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error fetching customer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/customers/stats - Get customer statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCustomerStats() {
        try {
            logger.info("Fetching customer statistics");
            Map<String, Object> stats = customerService.getCustomerStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching customer stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
