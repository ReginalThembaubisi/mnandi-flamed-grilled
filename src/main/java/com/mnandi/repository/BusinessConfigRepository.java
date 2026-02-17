package com.mnandi.repository;

import com.mnandi.model.BusinessConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessConfigRepository extends JpaRepository<BusinessConfig, String> {
}
