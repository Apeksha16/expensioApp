package com.expensio.backend.communication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@Primary
@ConditionalOnProperty(name = "app.twilio.account-sid")
public class TwilioSmsService implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsService.class);

    private final String accountSid;
    private final String authToken;
    private final String fromPhoneNumber;
    private final RestClient restClient;

    public TwilioSmsService(
            @Value("${app.twilio.account-sid:}") String accountSid,
            @Value("${app.twilio.auth-token:}") String authToken,
            @Value("${app.twilio.phone-number:}") String fromPhoneNumber) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromPhoneNumber = fromPhoneNumber;
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    @Override
    public void sendOtpSms(String recipientPhone, String otp, int validityMinutes) {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            log.warn("Twilio credentials not configured. SMS not sent to: {}", recipientPhone);
            return;
        }

        String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
        String messageBody = "Your Expensio verification code is: " + otp + ". Valid for " + validityMinutes + " minutes.";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("To", recipientPhone);
        if (fromPhoneNumber != null && fromPhoneNumber.startsWith("MG")) {
            formData.add("MessagingServiceSid", fromPhoneNumber);
        } else if (fromPhoneNumber != null && !fromPhoneNumber.isBlank()) {
            formData.add("From", fromPhoneNumber);
        }
        formData.add("Body", messageBody);

        String authHeader = "Basic " + Base64.getEncoder().encodeToString(
                (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8)
        );

        try {
            String response = restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            log.info("Successfully dispatched Twilio SMS to {}. Response: {}", recipientPhone, response);
        } catch (Exception ex) {
            log.error("Failed to send Twilio SMS to {}: {}", recipientPhone, ex.getMessage(), ex);
            // Non-blocking fallback: do not crash user flow, log clearly
        }
    }
}

