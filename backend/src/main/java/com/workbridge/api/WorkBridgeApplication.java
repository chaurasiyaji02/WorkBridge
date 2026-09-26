package com.workbridge.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class WorkBridgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkBridgeApplication.class, args);
    }
}