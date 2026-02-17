package com.mnandi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MnandiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MnandiApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    org.springframework.boot.CommandLineRunner init(com.mnandi.repository.UserRepository userRepository,
            @org.springframework.beans.factory.annotation.Value("${mnandi.admin.initial-password}") String initialPassword,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println("checking users...");
            userRepository.findAll()
                    .forEach(u -> System.out.println("USER: " + u.getUsername() + " / " + u.getPassword()));

            if (userRepository.count() == 0) {
                System.out.println("No users found. Creating admin...");
                com.mnandi.model.User admin = new com.mnandi.model.User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode(initialPassword));
                admin.setRole("ADMIN");
                userRepository.save(admin);
                System.out.println("Admin created manually.");
            }
        };
    }
}
