package com.expensio.backend.communication;

public interface SmsService {
    void sendOtpSms(String recipientPhone, String otp, int validityMinutes);
}

