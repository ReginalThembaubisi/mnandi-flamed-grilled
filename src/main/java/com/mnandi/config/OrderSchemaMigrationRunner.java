package com.mnandi.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderSchemaMigrationRunner implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(OrderSchemaMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public OrderSchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)");
            jdbcTemplate.execute(
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(255) DEFAULT 'unpaid'");
            jdbcTemplate.execute("UPDATE orders SET payment_status = 'unpaid' WHERE payment_status IS NULL");

            logger.info("Order schema migration check complete (payment_id/payment_status)");
        } catch (Exception e) {
            // Keep startup resilient; log and continue so diagnostics remain available.
            logger.warn("Order schema migration skipped/failed: {}", e.getMessage());
        }
    }
}
