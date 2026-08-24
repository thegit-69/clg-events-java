package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.registration.AttendeeDto;
import com.dasarath.clg_events_backend.dto.registration.RegisterRequest;
import com.dasarath.clg_events_backend.dto.registration.TicketDto;
import com.dasarath.clg_events_backend.entity.Event;
import com.dasarath.clg_events_backend.entity.Registration;
import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.ApprovalStatus;
import com.dasarath.clg_events_backend.enums.EventStatus;
import com.dasarath.clg_events_backend.enums.NotificationType;
import com.dasarath.clg_events_backend.exception.BadRequestException;
import com.dasarath.clg_events_backend.exception.DuplicateRegistrationException;
import com.dasarath.clg_events_backend.exception.EventCapacityExceededException;
import com.dasarath.clg_events_backend.exception.ResourceNotFoundException;
import com.dasarath.clg_events_backend.exception.UnauthorizedActionException;
import com.dasarath.clg_events_backend.repository.EventRepository;
import com.dasarath.clg_events_backend.repository.RegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final EventService eventService;
    private final NotificationService notificationService;

    public RegistrationService(
            RegistrationRepository registrationRepository,
            EventRepository eventRepository,
            UserService userService,
            EventService eventService,
            NotificationService notificationService
    ) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.eventService = eventService;
        this.notificationService = notificationService;
    }

    @Transactional
    public TicketDto registerForEvent(UUID eventId, RegisterRequest request, String userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (event.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new BadRequestException("Cannot register for an unapproved event");
        }

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("Registrations are closed for this event");
        }

        if (event.getRegistrationDeadline() != null && Instant.now().isAfter(event.getRegistrationDeadline())) {
            throw new BadRequestException("The registration deadline for this event has passed");
        }

        // Capacity check
        long currentCount = registrationRepository.countByEventId(eventId);
        if (currentCount >= event.getMaxParticipants()) {
            throw new EventCapacityExceededException("This event has reached its maximum capacity of " + event.getMaxParticipants() + " attendees");
        }

        // Duplicate check
        if (registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new DuplicateRegistrationException("You are already registered for this event");
        }

        User user = userService.getUserById(userId);

        String displayName = request != null && request.displayName() != null && !request.displayName().isBlank()
                ? request.displayName().trim()
                : (user.getDisplayName() != null ? user.getDisplayName() : user.getEmail());

        String email = request != null && request.email() != null && !request.email().isBlank()
                ? request.email().trim()
                : user.getEmail();

        Registration registration = new Registration(event, user, displayName, email);
        Registration savedRegistration = registrationRepository.save(registration);

        // Confirmation notification
        notificationService.createNotification(
                user,
                "Registration Confirmed! 🎟️",
                "You have successfully registered for '" + event.getTitle() + "'. Your digital ticket is ready in My Passes.",
                NotificationType.REGISTRATION
        );

        return toTicketDto(savedRegistration);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getMyTickets(String userId) {
        return registrationRepository.findByUserIdOrderByRegisteredAtDesc(userId)
                .stream()
                .map(this::toTicketDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendeeDto> getEventAttendees(UUID eventId, String userId, boolean isSuperAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        boolean isOrganizer = event.getOrganizer().getId().equals(userId);
        if (!isOrganizer && !isSuperAdmin) {
            throw new UnauthorizedActionException("You are not authorized to view attendee rosters for this event");
        }

        return registrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId)
                .stream()
                .map(r -> new AttendeeDto(
                        r.getId(),
                        r.getUser().getId(),
                        r.getDisplayName(),
                        r.getEmail(),
                        r.isAttended(),
                        r.getAttendedAt()
                ))
                .toList();
    }

    @Transactional
    public void cancelRegistration(UUID registrationId, String userId, boolean isSuperAdmin) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + registrationId));

        boolean isOwner = registration.getUser().getId().equals(userId);
        if (!isOwner && !isSuperAdmin) {
            throw new UnauthorizedActionException("You are not authorized to cancel this registration");
        }

        registrationRepository.delete(registration);
    }

    public TicketDto toTicketDto(Registration registration) {
        return new TicketDto(
                registration.getId(),
                registration.getEvent().getId(),
                registration.getUser().getId(),
                registration.getDisplayName(),
                registration.getEmail(),
                registration.isAttended(),
                registration.getAttendedAt(),
                registration.getRegisteredAt(),
                eventService.toDto(registration.getEvent())
        );
    }
}
