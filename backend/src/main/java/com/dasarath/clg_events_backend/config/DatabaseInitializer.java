package com.dasarath.clg_events_backend.config;

import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.Role;
import com.dasarath.clg_events_backend.repository.EventRepository;
import com.dasarath.clg_events_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DatabaseInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final String superAdminEmail;

    public DatabaseInitializer(
            UserRepository userRepository,
            EventRepository eventRepository,
            @Value("${app.admin.super-admin-email:cdasarath2006@gmail.com}") String superAdminEmail
    ) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.superAdminEmail = superAdminEmail != null ? superAdminEmail.trim() : "cdasarath2006@gmail.com";
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Initializing database: Ensuring Super Admin RBAC configuration...");

        // 1. Ensure Super Admin user exists with SUPER_ADMIN role
        userRepository.findByEmail(superAdminEmail).ifPresentOrElse(
                user -> {
                    if (user.getRole() != Role.SUPER_ADMIN) {
                        user.setRole(Role.SUPER_ADMIN);
                        userRepository.save(user);
                        log.info("Updated existing user {} to SUPER_ADMIN", superAdminEmail);
                    }
                },
                () -> {
                    User admin = new User(
                            "usr_admin_" + System.currentTimeMillis(),
                            superAdminEmail,
                            "Dasarath C (Admin)",
                            "https://api.dicebear.com/7.x/bottts/svg?seed=" + superAdminEmail,
                            Role.SUPER_ADMIN
                    );
                    userRepository.save(admin);
                    log.info("Provisioned initial Super Admin account for {}", superAdminEmail);
                }
        );

        // 2. Remove mock organizer accounts if present from previous runs
        String[] mockOrganizerEmails = {
                "acm@srmist.edu.in",
                "gdg@srmist.edu.in",
                "cultural@srmist.edu.in",
                "robotics@srmist.edu.in",
                "sports@srmist.edu.in"
        };
        for (String email : mockOrganizerEmails) {
            userRepository.findByEmail(email).ifPresent(u -> {
                try {
                    userRepository.delete(u);
                    log.info("Removed mock user: {}", email);
                } catch (Exception ignored) {}
            });
        }

        log.info("Database initialized cleanly. Total active events in DB: {}", eventRepository.count());
    }
}
