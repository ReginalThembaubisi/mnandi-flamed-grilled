package com.mnandi.service;

import com.mnandi.model.Customer;
import com.mnandi.model.Order;
import com.mnandi.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    @Autowired
    private CustomerRepository customerRepository;

    /**
     * Creates a new customer or updates an existing one based on order details
     */
    public Customer createOrUpdateCustomer(Order order) {
        try {
            Optional<Customer> existingCustomer = customerRepository.findByPhone(order.getCustomerPhone());

            if (existingCustomer.isPresent()) {
                // Update existing customer
                Customer customer = existingCustomer.get();
                customer.setName(order.getCustomerName());
                customer.setRoom(order.getCustomerRoom());
                customer.setResidence(order.getCustomerResidence());
                customer.setTotalSpent(customer.getTotalSpent() + order.getTotal());
                customer.setOrderCount(customer.getOrderCount() + 1);
                customer.setLastOrderDate(LocalDateTime.now());

                logger.info("Updated existing customer: {}", customer.getPhone());
                return customerRepository.save(customer);
            } else {
                // Create new customer
                Customer newCustomer = new Customer();
                newCustomer.setName(order.getCustomerName());
                newCustomer.setPhone(order.getCustomerPhone());
                newCustomer.setRoom(order.getCustomerRoom());
                newCustomer.setResidence(order.getCustomerResidence());
                newCustomer.setTotalSpent(order.getTotal());
                newCustomer.setOrderCount(1);
                newCustomer.setFirstOrderDate(LocalDateTime.now());
                newCustomer.setLastOrderDate(LocalDateTime.now());

                logger.info("Created new customer: {}", newCustomer.getPhone());
                return customerRepository.save(newCustomer);
            }
        } catch (Exception e) {
            logger.error("Error creating/updating customer: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process customer: " + e.getMessage());
        }
    }

    /**
     * Get all customers sorted by total spent (descending)
     */
    public List<Customer> getAllCustomers() {
        return customerRepository.findAllByOrderByTotalSpentDesc();
    }

    /**
     * Get customer by ID
     */
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));
    }

    /**
     * Get customer by phone number
     */
    public Customer getCustomerByPhone(String phone) {
        return customerRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Customer not found with phone: " + phone));
    }

    /**
     * Get customer statistics
     */
    public Map<String, Object> getCustomerStats() {
        List<Customer> allCustomers = customerRepository.findAll();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", allCustomers.size());

        double totalRevenue = allCustomers.stream()
                .mapToDouble(Customer::getTotalSpent)
                .sum();
        stats.put("totalRevenue", totalRevenue);

        int totalOrders = allCustomers.stream()
                .mapToInt(Customer::getOrderCount)
                .sum();
        stats.put("totalOrders", totalOrders);

        double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        stats.put("averageOrderValue", Math.round(avgOrderValue * 100.0) / 100.0);

        logger.info("Generated customer statistics: {} customers, R{} revenue",
                allCustomers.size(), totalRevenue);

        return stats;
    }
}
