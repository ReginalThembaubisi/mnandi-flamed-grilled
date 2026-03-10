package com.mnandi.controller;

import com.mnandi.model.Order;
import com.mnandi.repository.OrderRepository;
import com.mnandi.service.PayFastService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payfast")
@CrossOrigin(origins = { "http://localhost:3000", "https://*.vercel.app" }, allowCredentials = "true")
public class PayFastController {

    private static final Logger logger = LoggerFactory.getLogger(PayFastController.class);

    @Autowired
    private PayFastService payFastService;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * GET /api/payfast/initiate/{orderId}
     *
     * Returns the PayFast URL and signed form parameters so the browser
     * can auto-submit to the PayFast hosted payment page.
     */
    @GetMapping("/initiate/{orderId}")
    public ResponseEntity<Map<String, Object>> initiatePayment(@PathVariable Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            Map<String, String> formData = payFastService.buildPaymentData(order);
            String paymentUrl = payFastService.getPaymentUrl();

            logger.info("Initiating PayFast payment for order {}", order.getConfirmationNumber());

            return ResponseEntity.ok(Map.of(
                    "paymentUrl", paymentUrl,
                    "formData", formData));
        } catch (RuntimeException e) {
            logger.warn("Order not found when initiating payment: {}", orderId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error initiating PayFast payment: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * POST /api/payfast/notify
     *
     * PayFast ITN (Instant Transaction Notification) callback.
     * Called by PayFast servers after a payment — NOT by the browser.
     * Verifies the signature and marks the order as paid.
     */
    @PostMapping("/notify")
    public ResponseEntity<String> handleItn(@RequestParam Map<String, String> params) {
        logger.info("Received PayFast ITN callback with {} params", params.size());

        boolean valid = payFastService.verifyItn(params);
        if (!valid) {
            logger.warn("ITN rejected — invalid signature or status");
            return ResponseEntity.badRequest().body("INVALID");
        }

        String mPaymentId = params.get("m_payment_id");
        String pfPaymentId = params.get("pf_payment_id");

        if (mPaymentId == null) {
            logger.warn("ITN missing m_payment_id");
            return ResponseEntity.badRequest().body("MISSING_ID");
        }

        try {
            Long orderId = Long.parseLong(mPaymentId);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            order.setPaymentStatus("paid");
            order.setPaymentId(pfPaymentId);
            orderRepository.save(order);

            logger.info("✅ Order {} marked as PAID (PayFast ID: {})",
                    order.getConfirmationNumber(), pfPaymentId);
            return ResponseEntity.ok("OK");

        } catch (NumberFormatException e) {
            logger.error("Invalid m_payment_id: {}", mPaymentId);
            return ResponseEntity.badRequest().body("INVALID_ID");
        } catch (Exception e) {
            logger.error("Error processing ITN: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("ERROR");
        }
    }
}
