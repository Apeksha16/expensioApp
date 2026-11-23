package com.expensio.backend.common.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PhoneNormalizationServiceTest {

    private PhoneNormalizationService service;

    @BeforeEach
    void setUp() {
        service = new PhoneNormalizationService();
    }

    @Test
    @DisplayName("Should normalize 10-digit Indian phone number to E.164")
    void testNormalizeIndianNumber() {
        String result = service.normalizeToE164("9876543210", "IN");
        assertEquals("+919876543210", result);
    }

    @Test
    @DisplayName("Should preserve existing international dialing code")
    void testPreserveInternationalCode() {
        String result = service.normalizeToE164("+14155552671", "US");
        assertEquals("+14155552671", result);
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException on invalid phone number")
    void testInvalidNumber() {
        assertThrows(IllegalArgumentException.class, () -> service.normalizeToE164("12345", "IN"));
    }

    @Test
    @DisplayName("Should validate phone numbers correctly")
    void testIsValid() {
        assertTrue(service.isValid("9876543210", "IN"));
        assertFalse(service.isValid("invalid", "IN"));
    }
}

