package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.auth.UserProfileDto;
import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.Role;
import com.dasarath.clg_events_backend.exception.ResourceNotFoundException;
import com.dasarath.clg_events_backend.repository.UserRepository;
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
            @Value("${app.admin.super-admin-email:admin@example.com}") String superAdminEmail
    ) {
        this.userRepository = userRepository;
        this.superAdminEmail = superAdminEmail != null ? superAdminEmail.trim() : "";
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

    @Transactional(readOnly = true)
    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
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
