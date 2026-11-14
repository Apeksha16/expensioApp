package com.expensio.backend.username;

import com.expensio.backend.profile.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class UsernameGeneratorServiceTest {

    private final Set<String> existingUsernames = new HashSet<>();
    private UsernameGeneratorService generatorService;

    @BeforeEach
    void setUp() {
        existingUsernames.clear();

        UserProfileRepository repoStub = (UserProfileRepository) Proxy.newProxyInstance(
                UserProfileRepository.class.getClassLoader(),
                new Class<?>[]{UserProfileRepository.class},
                (proxy, method, args) -> {
                    if ("existsByUsernameIgnoreCase".equals(method.getName())) {
                        String un = (String) args[0];
                        return existingUsernames.contains(un.toLowerCase());
                    }
                    return null;
                }
        );

        generatorService = new UsernameGeneratorService(repoStub);
    }

    @Test
    @DisplayName("Candidate 1: generates first name when available")
    void generateUsername_FirstChoice() {
        String username = generatorService.generateUsername("Alan", "Doe");
        assertThat(username).isEqualTo("alan");
    }

    @Test
    @DisplayName("Candidate 2: generates first+last when first is taken")
    void generateUsername_SecondChoice() {
        existingUsernames.add("alan");
        String username = generatorService.generateUsername("Alan", "Doe");
        assertThat(username).isEqualTo("alandoe");
    }

    @Test
    @DisplayName("Candidate 3: generates last+first when first and first+last are taken")
    void generateUsername_ThirdChoice() {
        existingUsernames.add("alan");
        existingUsernames.add("alandoe");
        String username = generatorService.generateUsername("Alan", "Doe");
        assertThat(username).isEqualTo("doealan");
    }

    @Test
    @DisplayName("Candidate 4: generates first1..first9 when previous are taken")
    void generateUsername_NumberedChoice() {
        existingUsernames.add("alan");
        existingUsernames.add("alandoe");
        existingUsernames.add("doealan");
        String username = generatorService.generateUsername("Alan", "Doe");
        assertThat(username).isEqualTo("alan1");
    }

    @Test
    @DisplayName("Reserved keywords are blocked from being assigned")
    void isAvailable_BlocksReservedUsernames() {
        assertThat(generatorService.isAvailable("admin")).isFalse();
        assertThat(generatorService.isAvailable("root")).isFalse();
        assertThat(generatorService.isAvailable("system")).isFalse();
        assertThat(generatorService.isAvailable("expensio")).isFalse();
        assertThat(generatorService.isAvailable("support")).isFalse();
    }

    @Test
    @DisplayName("Normalization strips special characters, uppercase, and spaces")
    void normalize_StripsSpecialCharacters() {
        assertThat(generatorService.normalize(" Alan-J. ")).isEqualTo("alanj");
        assertThat(generatorService.normalize("Doe@123")).isEqualTo("doe123");
    }
}

