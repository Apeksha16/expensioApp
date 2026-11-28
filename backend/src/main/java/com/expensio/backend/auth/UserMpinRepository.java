package com.expensio.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserMpinRepository extends JpaRepository<UserMpin, UUID> {
}
