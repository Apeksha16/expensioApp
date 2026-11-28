package com.expensio.backend.common.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import org.springframework.stereotype.Service;

@Service
public class PhoneNormalizationService {

    private final PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();

    /**
     * Normalizes a phone number to standard international E.164 format (e.g. +919876543210).
     * Defaults to region "IN" if no international dialing prefix is present.
     */
    public String normalizeToE164(String rawPhone, String defaultRegion) {
        if (rawPhone == null || rawPhone.isBlank()) {
            throw new IllegalArgumentException("Phone number must not be null or blank");
        }
        String region = (defaultRegion != null && !defaultRegion.isBlank()) ? defaultRegion.toUpperCase() : "IN";
        try {
            PhoneNumber parsedNumber = phoneUtil.parse(rawPhone.trim(), region);
            if (!phoneUtil.isValidNumber(parsedNumber)) {
                throw new IllegalArgumentException("Invalid phone number: " + rawPhone);
            }
            return phoneUtil.format(parsedNumber, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException e) {
            throw new IllegalArgumentException("Cannot parse phone number: " + rawPhone + " (" + e.getMessage() + ")", e);
        }
    }

    public boolean isValid(String rawPhone, String defaultRegion) {
        try {
            normalizeToE164(rawPhone, defaultRegion);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

