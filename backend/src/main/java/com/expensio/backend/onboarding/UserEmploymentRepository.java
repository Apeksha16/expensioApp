package com.expensio.backend.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserEmploymentRepository extends JpaRepository<UserEmployment, UUID> {
}

