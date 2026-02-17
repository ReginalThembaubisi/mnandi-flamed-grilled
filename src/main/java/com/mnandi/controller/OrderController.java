package com.mnandi.controller;

import com.mnandi.model.Order;
import com.mnandi.service.OrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = { "http://localhost:3000", "https://*.vercel.app" }, allowCredentials = "true")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    /**
     * POST /api/orders - Create new order
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody Order order) {
        try {
            logger.info("Creating new order for customer: {}", order.getCustomerName());
            Order createdOrder = orderService.createOrder(order);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
        } catch (Exception e) {
            logger.error("Error creating order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/orders - Get all orders (newest first)
     */
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        try {
            logger.info("Fetching all orders");
            List<Order> orders = orderService.getAllOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Error fetching orders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/orders/{confirmationNumber} - Track order by confirmation number
     */
    @GetMapping("/{confirmationNumber}")
    public ResponseEntity<Order> getOrderByConfirmationNumber(@PathVariable String confirmationNumber) {
        try {
            logger.info("Fetching order with confirmation number: {}", confirmationNumber);
            Order order = orderService.getOrderByConfirmationNumber(confirmationNumber);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            logger.warn("Order not found: {}", confirmationNumber);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error fetching order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PATCH /api/orders/{id}/status - Update order status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        try {
            String newStatus = statusUpdate.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            logger.info("Updating order {} status to: {}", id, newStatus);
            Order updatedOrder = orderService.updateOrderStatus(id, newStatus);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            logger.warn("Order not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error updating order status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/orders/status/{status} - Filter orders by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable String status) {
        try {
            logger.info("Fetching orders with status: {}", status);
            List<Order> orders = orderService.getOrdersByStatus(status);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Error fetching orders by status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/orders/today - Get today's orders
     */
    @GetMapping("/today")
    public ResponseEntity<List<Order>> getTodayOrders() {
        try {
            logger.info("Fetching today's orders");
            List<Order> orders = orderService.getTodayOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Error fetching today's orders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/orders/stats - Get order statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        try {
            logger.info("Fetching order statistics");
            Map<String, Object> stats = orderService.getOrderStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching order stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * DELETE /api/orders - Delete all orders
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAllOrders() {
        try {
            logger.warn("Deleting ALL orders");
            orderService.deleteAllOrders();
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting all orders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
