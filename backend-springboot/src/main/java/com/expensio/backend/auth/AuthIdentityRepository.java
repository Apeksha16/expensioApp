package com.expensio.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, UUID> {

    Optional<AuthIdentity> findByProviderAndProviderSubject(String provider, String providerSubject);

    List<AuthIdentity> findByUserId(UUID userId);

    boolean existsByProviderAndProviderSubject(String provider, String providerSubject);
}
