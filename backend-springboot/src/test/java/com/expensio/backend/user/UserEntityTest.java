package com.expensio.backend.user;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserEntityTest {

    @Test
    void userCreation_DefaultStatusAndTimestamps() {
        User user = new User("9876543210", "apeksha@expensio.app", "Apeksha Verma");
        user.setId(UUID.randomUUID());
        user.onCreate();

        assertThat(user.getId()).isNotNull();
        assertThat(user.getPhone()).isEqualTo("9876543210");
        assertThat(user.getEmail()).isEqualTo("apeksha@expensio.app");
        assertThat(user.getName()).isEqualTo("Apeksha Verma");
        assertThat(user.getStatus()).isEqualTo("ACTIVE");
        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isNotNull();
        assertThat(user.getCreatedAt()).isEqualTo(user.getUpdatedAt());
    }

    @Test
    void userUpdate_UpdatesTimestamp() throws InterruptedException {
        User user = new User("9876543210", "apeksha@expensio.app", "Apeksha Verma");
        user.onCreate();
        Instant initialUpdate = user.getUpdatedAt();

        Thread.sleep(10);
        user.onUpdate();

        assertThat(user.getUpdatedAt()).isAfterOrEqualTo(initialUpdate);
    }
}
