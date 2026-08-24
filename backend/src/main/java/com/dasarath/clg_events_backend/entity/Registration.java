package com.dasarath.clg_events_backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "registrations", uniqueConstraints = {
    @UniqueConstraint(name = "uq_event_user", columnNames = {"event_id", "user_id"})
})
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "display_name", length = 255, nullable = false)
    private String displayName;

    @Column(name = "email", length = 255, nullable = false)
    private String email;

    @Column(name = "attended", nullable = false)
    private boolean attended = false;

    @Column(name = "attended_at")
    private Instant attendedAt;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt = Instant.now();

    public Registration() {}

    public Registration(Event event, User user, String displayName, String email) {
        this.event = event;
        this.user = user;
        this.displayName = displayName;
        this.email = email;
        this.attended = false;
        this.registeredAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (registeredAt == null) registeredAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isAttended() { return attended; }
    public void setAttended(boolean attended) { this.attended = attended; }

    public Instant getAttendedAt() { return attendedAt; }
    public void setAttendedAt(Instant attendedAt) { this.attendedAt = attendedAt; }

    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Registration that = (Registration) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
