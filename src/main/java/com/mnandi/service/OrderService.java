package com.mnandi.service;

import com.mnandi.model.Order;
import com.mnandi.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerService customerService;

    /**
     * Create a new order and update customer information
     */
    @Transactional
    public Order createOrder(Order order) {
        try {
            // Save order (confirmation number will be auto-generated)
            Order savedOrder = orderRepository.save(order);
            logger.info("Created order with confirmation number: {}", savedOrder.getConfirmationNumber());

            // Create or update customer
            customerService.createOrUpdateCustomer(savedOrder);

            return savedOrder;
        } catch (Exception e) {
            logger.error("Error creating order: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create order: " + e.getMessage());
        }
    }

    /**
     * Get all orders sorted by newest first
     */
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get order by confirmation number
     */
    public Order getOrderByConfirmationNumber(String confirmationNumber) {
        return orderRepository.findByConfirmationNumber(confirmationNumber)
                .orElseThrow(
                        () -> new RuntimeException("Order not found with confirmation number: " + confirmationNumber));
    }

    /**
     * Update order status
     */
    @Transactional
    public Order updateOrderStatus(Long id, String status) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));

            order.setStatus(status);
            Order updatedOrder = orderRepository.save(order);

            logger.info("Updated order {} status to: {}", id, status);
            return updatedOrder;
        } catch (Exception e) {
            logger.error("Error updating order status: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update order status: " + e.getMessage());
        }
    }

    /**
     * Get orders by status
     */
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    /**
     * Get today's orders
     */
    public List<Order> getTodayOrders() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    /**
     * Get order statistics
     */
    public Map<String, Object> getOrderStats() {
        List<Order> allOrders = orderRepository.findAll();
        List<Order> todayOrders = getTodayOrders();
        List<Order> pendingOrders = orderRepository.findByStatus("pending");

        Map<String, Object> stats = new HashMap<>();

        // Total counts
        stats.put("totalOrders", allOrders.size());
        stats.put("todayOrders", todayOrders.size());
        stats.put("pendingOrders", pendingOrders.size());

        // Revenue calculations
        double totalRevenue = allOrders.stream()
                .mapToDouble(Order::getTotal)
                .sum();
        stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);

        double todayRevenue = todayOrders.stream()
                .mapToDouble(Order::getTotal)
                .sum();
        stats.put("todayRevenue", Math.round(todayRevenue * 100.0) / 100.0);

        // Average order value
        double avgOrderValue = allOrders.isEmpty() ? 0 : totalRevenue / allOrders.size();
        stats.put("averageOrderValue", Math.round(avgOrderValue * 100.0) / 100.0);

        // Status breakdown
        Map<String, Long> statusCount = new HashMap<>();
        statusCount.put("pending", (long) orderRepository.findByStatus("pending").size());
        statusCount.put("preparing", (long) orderRepository.findByStatus("preparing").size());
        statusCount.put("ready", (long) orderRepository.findByStatus("ready").size());
        statusCount.put("completed", (long) orderRepository.findByStatus("completed").size());
        stats.put("statusBreakdown", statusCount);

        logger.info("Generated order statistics: {} total orders, R{} revenue",
                allOrders.size(), totalRevenue);

        return stats;
    }

    /**
     * Delete all orders
     */
    @Transactional
    public void deleteAllOrders() {
        orderRepository.deleteAll();
        logger.info("Deleted all orders");
    }
}
