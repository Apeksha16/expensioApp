package com.expensio.backend.communication;

public interface EmailService {
    void sendOtpEmail(String recipientEmail, String otp, int validityMinutes);
    void sendPasswordResetEmail(String recipientEmail, String resetToken, int validityMinutes);
    void sendSecurityAlert(String recipientEmail, String subject, String message);
}

