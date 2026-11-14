package com.expensio.backend.communication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
public class DevCommunicationService implements EmailService, SmsService {

    private static final Logger log = LoggerFactory.getLogger(DevCommunicationService.class);

    @Override
    public void sendOtpEmail(String recipientEmail, String otp, int validityMinutes) {
        log.info("📧 [Dev Email Service] To: {}, Subject: Expensio Verification OTP, Code: [{}], Valid for {} minutes",
                recipientEmail, otp, validityMinutes);
    }

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String resetToken, int validityMinutes) {
        log.info("📧 [Dev Email Service] To: {}, Subject: Expensio Password Reset, Reset Token: [{}], Valid for {} minutes",
                recipientEmail, resetToken, validityMinutes);
    }

    @Override
    public void sendSecurityAlert(String recipientEmail, String subject, String message) {
        log.info("📧 [Dev Email Service Alert] To: {}, Subject: {}, Message: {}",
                recipientEmail, subject, message);
    }

    @Override
    public void sendOtpSms(String recipientPhone, String otp, int validityMinutes) {
        log.info("📱 [Dev SMS Gateway] To: {}, Expensio verification OTP is: [{}]. Valid for {} minutes.",
                recipientPhone, otp, validityMinutes);
    }
}

