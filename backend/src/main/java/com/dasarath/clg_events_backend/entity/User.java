package com.dasarath.clg_events_backend.entity;

import com.dasarath.clg_events_backend.enums.Role;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "photo_url", length = 1024)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 50, nullable = false)
    private Role role = Role.STUDENT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public User() {}

    public User(String id, String email, String displayName, String photoUrl, Role role) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.photoUrl = photoUrl;
        this.role = role != null ? role : Role.STUDENT;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (role == null) role = Role.STUDENT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
