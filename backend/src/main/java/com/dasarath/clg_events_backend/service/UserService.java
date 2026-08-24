package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.auth.UserProfileDto;
import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.Role;
import com.dasarath.clg_events_backend.repository.UserRepository;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final String superAdminEmail;

    public UserService(
            UserRepository userRepository,
            @Value("${app.admin.super-admin-email:cdasarath2006@gmail.com}") String superAdminEmail
    ) {
        this.userRepository = userRepository;
        this.superAdminEmail = superAdminEmail != null ? superAdminEmail.trim() : "cdasarath2006@gmail.com";
    }

    /**
     * Synchronize / Provision user entity from verified Neon Auth JWT token
     */
    @Transactional
    public User syncUserFromJwt(Jwt jwt) {
        String userId = jwt.getSubject();
        if (userId == null) {
            userId = jwt.getClaimAsString("id");
        }

        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String image = jwt.getClaimAsString("image");

        if (email == null) {
            email = "user_" + userId + "@example.com";
        }

        Role role = isSuperAdminEmail(email) ? Role.SUPER_ADMIN : Role.STUDENT;

        Optional<User> existingUserOpt = userRepository.findById(userId);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            user.setEmail(email);
            if (name != null && !name.isBlank()) {
                user.setDisplayName(name);
            }
            if (image != null && !image.isBlank()) {
                user.setPhotoUrl(image);
            }
            if (isSuperAdminEmail(email)) {
                user.setRole(Role.SUPER_ADMIN);
            }
            user.setUpdatedAt(Instant.now());
        } else {
            // Also check if user exists by email with different ID
            Optional<User> userByEmailOpt = userRepository.findByEmail(email);
            if (userByEmailOpt.isPresent()) {
                user = userByEmailOpt.get();
                user.setId(userId);
                if (name != null && !name.isBlank()) {
                    user.setDisplayName(name);
                }
                if (image != null && !image.isBlank()) {
                    user.setPhotoUrl(image);
                }
                if (isSuperAdminEmail(email)) {
                    user.setRole(Role.SUPER_ADMIN);
                }
                user.setUpdatedAt(Instant.now());
            } else {
                user = new User(userId, email, name, image, role);
            }
        }

        return userRepository.save(user);
    }

    @Transactional
    public User getUserById(String id) {
        return userRepository.findById(id).orElseGet(() -> {
            String email = SecurityUtils.getCurrentUserEmail();
            if (email == null || email.isBlank()) {
                email = id + "@campus.edu";
            }
            return getOrCreateUser(id, email, email.split("@")[0], null);
        });
    }

    @Transactional
    public User getOrCreateUser(String id, String email, String name, String image) {
        return userRepository.findById(id).orElseGet(() -> {
            String resolvedEmail = (email != null && !email.isBlank()) ? email : (id + "@campus.edu");
            return userRepository.findByEmail(resolvedEmail).orElseGet(() -> {
                Role role = isSuperAdminEmail(resolvedEmail) ? Role.SUPER_ADMIN : Role.STUDENT;
                User newUser = new User(
                        id,
                        resolvedEmail,
                        (name != null && !name.isBlank()) ? name : resolvedEmail.split("@")[0],
                        image,
                        role
                );
                return userRepository.save(newUser);
            });
        });
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            String id = "usr_" + System.currentTimeMillis();
            return getOrCreateUser(id, email, email.split("@")[0], null);
        });
    }

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(String userId) {
        User user = getUserById(userId);
        return toProfileDto(user);
    }

    public boolean isSuperAdminEmail(String email) {
        if (email == null || superAdminEmail.isBlank()) return false;
        return email.equalsIgnoreCase(superAdminEmail);
    }

    public UserProfileDto toProfileDto(User user) {
        return new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPhotoUrl(),
                user.getRole()
        );
    }
}
