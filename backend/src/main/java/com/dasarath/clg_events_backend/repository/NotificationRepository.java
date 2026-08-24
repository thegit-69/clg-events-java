package com.dasarath.clg_events_backend.repository;

import com.dasarath.clg_events_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndIsReadFalse(String userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId")
    void markAllAsReadForUser(@Param("userId") String userId);
}
