package com.expensio.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class ExpensioBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ExpensioBackendApplication.class, args);
	}

}
