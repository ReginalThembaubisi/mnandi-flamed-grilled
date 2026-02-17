package com.mnandi.repository;

import com.mnandi.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByConfirmationNumber(String confirmationNumber);

    List<Order> findByStatus(String status);

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Order> findAllByOrderByCreatedAtDesc();
}
