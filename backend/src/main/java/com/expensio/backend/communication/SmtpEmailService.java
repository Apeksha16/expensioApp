package com.expensio.backend.communication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Primary
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromEmail;

    public SmtpEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.username:}") String fromEmail) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromEmail = fromEmail;
    }

    @Override
    public void sendOtpEmail(String recipientEmail, String otp, int validityMinutes) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || fromEmail == null || fromEmail.isBlank()) {
            log.info("📧 [Dev Email Fallback] To: {}, OTP: [{}], Valid: {}m (SMTP not configured)", recipientEmail, otp, validityMinutes);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("Expensio - Verification Code");
            message.setText("Your Expensio verification code is: " + otp + "\n\nThis code is valid for " + validityMinutes + " minutes. Do not share this code with anyone.");
            mailSender.send(message);
            log.info("Sent verification email to {}", recipientEmail);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {}: {}", recipientEmail, ex.getMessage());
        }
    }

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String resetToken, int validityMinutes) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || fromEmail == null || fromEmail.isBlank()) {
            log.info("📧 [Dev Email Fallback] To: {}, Reset Token: [{}], Valid: {}m (SMTP not configured)", recipientEmail, resetToken, validityMinutes);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("Expensio - Password Reset Request");
            message.setText("A password reset was requested for your Expensio account.\n\nUse this reset token: " + resetToken + "\n\nThis token is valid for " + validityMinutes + " minutes. If you did not request this, please secure your account immediately.");
            mailSender.send(message);
            log.info("Sent password reset email to {}", recipientEmail);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}: {}", recipientEmail, ex.getMessage());
        }
    }

    @Override
    public void sendSecurityAlert(String recipientEmail, String subject, String messageContent) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || fromEmail == null || fromEmail.isBlank()) {
            log.info("📧 [Dev Email Alert Fallback] To: {}, Subject: {}, Message: {}", recipientEmail, subject, messageContent);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("Expensio Security Alert: " + subject);
            message.setText(messageContent);
            mailSender.send(message);
            log.info("Sent security alert email to {}", recipientEmail);
        } catch (Exception ex) {
            log.error("Failed to send security alert email to {}: {}", recipientEmail, ex.getMessage());
        }
    }
}

