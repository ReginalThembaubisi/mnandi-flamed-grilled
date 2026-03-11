package com.mnandi.service;

import com.mnandi.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PayFastService {

    private static final Logger logger = LoggerFactory.getLogger(PayFastService.class);

    @Value("${payfast.merchant-id}")
    private String merchantId;

    @Value("${payfast.merchant-key}")
    private String merchantKey;

    @Value("${payfast.passphrase:}")
    private String passphrase;

    @Value("${payfast.sandbox:true}")
    private boolean sandbox;

    @Value("${payfast.return-url}")
    private String returnUrl;

    @Value("${payfast.cancel-url}")
    private String cancelUrl;

    @Value("${payfast.notify-url}")
    private String notifyUrl;

    /**
     * Returns the PayFast payment URL (sandbox or live).
     */
    public String getPaymentUrl() {
        return sandbox
                ? "https://sandbox.payfast.co.za/eng/process"
                : "https://www.payfast.co.za/eng/process";
    }

    /**
     * Builds the ordered map of PayFast parameters for the payment form.
     * The map is insertion-ordered (LinkedHashMap) as signature depends on order.
     */
    public Map<String, String> buildPaymentData(Order order) {
        // Round total to 2 decimal places as required by PayFast
        String amount = new BigDecimal(order.getTotal())
                .setScale(2, RoundingMode.HALF_UP)
                .toPlainString();

        Map<String, String> data = new LinkedHashMap<>();
        data.put("merchant_id", cleanValue(merchantId));
        data.put("merchant_key", cleanValue(merchantKey));
        data.put("return_url", cleanValue(returnUrl) + "?order_id=" + order.getId()
                + "&confirmation=" + order.getConfirmationNumber());
        data.put("cancel_url", cleanValue(cancelUrl) + "?order_id=" + order.getId());
        data.put("notify_url", cleanValue(notifyUrl));

        // Buyer info
        String[] nameParts = order.getCustomerName().trim().split(" ", 2);
        data.put("name_first", cleanAscii(nameParts[0]));
        data.put("name_last", cleanAscii(nameParts.length > 1 ? nameParts[1] : "-"));

        // Order info
        data.put("m_payment_id", String.valueOf(order.getId()));
        data.put("amount", amount);
        data.put("item_name", cleanAscii("Mnandi Order " + order.getConfirmationNumber()));
        data.put("item_description", cleanAscii("Food order - " + order.getCustomerResidence()
                + " Room " + order.getCustomerRoom()));

        // Generate and append signature
        String signature = generateSignature(data, passphrase.isBlank() ? null : passphrase);
        data.put("signature", signature);

        logger.info("Built PayFast payment data for order {} (amount: R{})",
                order.getConfirmationNumber(), amount);
        return data;
    }

    /**
     * Generates an MD5 signature from the parameter map.
     * PayFast signature algorithm: URL-encode each value, join as key=value&…,
     * optionally append passphrase, then MD5 hash.
     */
    public String generateSignature(Map<String, String> data, String passphrase) {
        // Build the query string from all fields EXCEPT "signature"
        String paramString = data.entrySet().stream()
                .filter(e -> !e.getKey().equals("signature"))
                .filter(e -> e.getValue() != null && !e.getValue().trim().isEmpty())
                .map(e -> e.getKey() + "=" + encodeUrl(e.getValue()))
                .collect(Collectors.joining("&"));

        if (passphrase != null && !passphrase.isBlank()) {
            paramString += "&passphrase=" + encodeUrl(passphrase);
        }

        return md5(paramString);
    }

    /**
     * Verifies an ITN (Instant Transaction Notification) callback from PayFast.
     * Returns true if the signature matches and payment_status is COMPLETE.
     */
    public boolean verifyItn(Map<String, String> params) {
        try {
            String receivedSignature = params.get("signature");
            if (receivedSignature == null) {
                logger.warn("ITN verification failed: no signature");
                return false;
            }

            // Rebuild map without signature for verification
            Map<String, String> verifyData = new LinkedHashMap<>(params);
            verifyData.remove("signature");

            String expectedSignature = generateSignature(verifyData,
                    passphrase.isBlank() ? null : passphrase);

            if (!expectedSignature.equalsIgnoreCase(receivedSignature)) {
                logger.warn("ITN signature mismatch. Expected: {}, Received: {}",
                        expectedSignature, receivedSignature);
                return false;
            }

            String paymentStatus = params.get("payment_status");
            boolean complete = "COMPLETE".equalsIgnoreCase(paymentStatus);
            logger.info("ITN verification result: {} (payment_status={})", complete, paymentStatus);
            return complete;

        } catch (Exception e) {
            logger.error("Error verifying ITN: {}", e.getMessage(), e);
            return false;
        }
    }

    // ---- helpers ----

    private String encodeUrl(String value) {
        if (value == null)
            return "";
        try {
            // PayFast signatures are based on standard form-url-encoding.
            // Keep '+' for spaces to match PayFast signature calculation.
            return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("MD5 hashing failed", e);
        }
    }

    private String cleanValue(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private String cleanAscii(String value) {
        String clean = cleanValue(value);
        // Avoid hidden unicode differences between signer/browser/gateway.
        return clean.replaceAll("[^\\x20-\\x7E]", "");
    }
}
