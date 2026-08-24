package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.admin.ReviewEventRequest;
import com.dasarath.clg_events_backend.dto.event.EventResponseDto;
import com.dasarath.clg_events_backend.entity.Event;
import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.ApprovalStatus;
import com.dasarath.clg_events_backend.enums.EventStatus;
import com.dasarath.clg_events_backend.enums.NotificationType;
import com.dasarath.clg_events_backend.exception.BadRequestException;
import com.dasarath.clg_events_backend.exception.ResourceNotFoundException;
import com.dasarath.clg_events_backend.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final EventRepository eventRepository;
    private final UserService userService;
    private final EventService eventService;
    private final NotificationService notificationService;

    public AdminService(
            EventRepository eventRepository,
            UserService userService,
            EventService eventService,
            NotificationService notificationService
    ) {
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.eventService = eventService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<EventResponseDto> getPendingEvents() {
        return eventRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.PENDING)
                .stream()
                .map(eventService::toDto)
                .toList();
    }

    @Transactional
    public EventResponseDto reviewEvent(UUID eventId, ReviewEventRequest request, String adminId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        User adminUser = userService.getUserById(adminId);

        if (request.status() == ApprovalStatus.REJECTED) {
            if (request.rejectionReason() == null || request.rejectionReason().trim().isEmpty()) {
                throw new BadRequestException("Rejection reason is required when rejecting an event");
            }
            event.setApprovalStatus(ApprovalStatus.REJECTED);
            event.setRejectionReason(request.rejectionReason().trim());
        } else if (request.status() == ApprovalStatus.APPROVED) {
            event.setApprovalStatus(ApprovalStatus.APPROVED);
            event.setStatus(EventStatus.OPEN);
            event.setRejectionReason(null);
        } else {
            throw new BadRequestException("Invalid approval status review action");
        }

        event.setReviewedBy(adminUser);
        event.setReviewedAt(Instant.now());

        Event savedEvent = eventRepository.save(event);

        // Send notification to event organizer
        if (savedEvent.getApprovalStatus() == ApprovalStatus.APPROVED) {
            notificationService.createNotification(
                    savedEvent.getOrganizer(),
                    "Event Proposal Approved! 🎉",
                    "Congratulations! Your event proposal '" + savedEvent.getTitle() + "' has been approved and published.",
                    NotificationType.APPROVAL
            );
        } else {
            notificationService.createNotification(
                    savedEvent.getOrganizer(),
                    "Event Proposal Rejected",
                    "Your event proposal '" + savedEvent.getTitle() + "' was rejected. Reason: " + savedEvent.getRejectionReason(),
                    NotificationType.APPROVAL
            );
        }

        return eventService.toDto(savedEvent);
    }
}
