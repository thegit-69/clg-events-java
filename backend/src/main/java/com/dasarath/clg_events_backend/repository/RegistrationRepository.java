package com.dasarath.clg_events_backend.repository;

import com.dasarath.clg_events_backend.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, UUID> {

    boolean existsByEventIdAndUserId(UUID eventId, String userId);

    Optional<Registration> findByEventIdAndUserId(UUID eventId, String userId);

    List<Registration> findByUserIdOrderByRegisteredAtDesc(String userId);

    List<Registration> findByEventIdOrderByRegisteredAtDesc(UUID eventId);

    long countByEventId(UUID eventId);

    @Query("SELECT COUNT(r) FROM Registration r WHERE r.event.organizer.id = :organizerId")
    long countTotalRegistrationsForOrganizer(@Param("organizerId") String organizerId);
}
