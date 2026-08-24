package com.dasarath.clg_events_backend.repository;

import com.dasarath.clg_events_backend.entity.Event;
import com.dasarath.clg_events_backend.enums.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    // Approved events pagination & sorting
    Page<Event> findByApprovalStatus(ApprovalStatus approvalStatus, Pageable pageable);

    // Filter by type & approval
    Page<Event> findByApprovalStatusAndTypeIgnoreCase(ApprovalStatus approvalStatus, String type, Pageable pageable);

    // Search by title or tag (approved events)
    @Query("""
        SELECT DISTINCT e FROM Event e
        LEFT JOIN e.tags t
        WHERE e.approvalStatus = 'APPROVED'
        AND (
            LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.venue) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(t) LIKE LOWER(CONCAT('%', :query, '%'))
        )
    """)
    Page<Event> searchApprovedEvents(@Param("query") String query, Pageable pageable);

    // Search by title or tag AND filter by type
    @Query("""
        SELECT DISTINCT e FROM Event e
        LEFT JOIN e.tags t
        WHERE e.approvalStatus = 'APPROVED'
        AND LOWER(e.type) = LOWER(:type)
        AND (
            LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.venue) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(t) LIKE LOWER(CONCAT('%', :query, '%'))
        )
    """)
    Page<Event> searchApprovedEventsWithType(@Param("query") String query, @Param("type") String type, Pageable pageable);

    // Organizer's proposals
    List<Event> findByOrganizerIdOrderByCreatedAtDesc(String organizerId);

    // Admin pending events
    List<Event> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);

    // Count events for dashboard stats
    long countByOrganizerId(String organizerId);
    long countByOrganizerIdAndApprovalStatus(String organizerId, ApprovalStatus approvalStatus);
}
