package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.registration.AttendeeDto;
import com.dasarath.clg_events_backend.dto.registration.RegistrationEventDto;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RegistrationService {

    private static final Logger log = LoggerFactory.getLogger(RegistrationService.class);

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final EventService eventService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public RegistrationService(
            RegistrationRepository registrationRepository,
            EventRepository eventRepository,
            UserService userService,
            EventService eventService,
            NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.eventService = eventService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
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

        if (event.getStartDate() != null && !Instant.now().isBefore(event.getStartDate())) {
            throw new BadRequestException("Registration is closed because the event has already started");
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
        publishRegistrationCreatedAfterCommit(eventId);

        // Confirmation notification
        notificationService.createNotification(
                user,
                "Registration Confirmed! 🎟️",
                "You have successfully registered for '" + event.getTitle() + "'. Your digital ticket is ready in My Passes.",
                NotificationType.REGISTRATION
        );

        // Let the organizer know someone registered (and whether the event is now full)
        User organizer = event.getOrganizer();
        if (!organizer.getId().equals(user.getId())) {
            long newCount = currentCount + 1;
            boolean isFull = newCount >= event.getMaxParticipants();
            String title = isFull ? "Event Full: " + event.getTitle() : "New Registration";
            String message = isFull
                    ? displayName + " just registered and '" + event.getTitle() + "' is now full ("
                        + newCount + "/" + event.getMaxParticipants() + ")."
                    : displayName + " registered for '" + event.getTitle() + "' ("
                        + newCount + "/" + event.getMaxParticipants() + " spots filled).";

            notificationService.createNotification(
                    organizer,
                    title,
                    message,
                    NotificationType.REGISTRATION
            );
        }

        return toTicketDto(savedRegistration);
    }

    private void publishRegistrationCreatedAfterCommit(UUID eventId) {
        String destination = "/topic/events/" + eventId + "/registrations";
        Runnable publish = () -> {
            try {
                messagingTemplate.convertAndSend(destination, new RegistrationEventDto(eventId));
            } catch (Exception e) {
                log.error("Failed to broadcast registration update to {}: {}", destination, e.getMessage());
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
        } else {
            publish.run();
        }
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

        Event event = registration.getEvent();
        User registrant = registration.getUser();
        User organizer = event.getOrganizer();
        String eventTitle = event.getTitle();
        String displayName = registration.getDisplayName();

        registrationRepository.delete(registration);

        // Notify the organizer that a spot opened up
        if (!organizer.getId().equals(registrant.getId())) {
            notificationService.createNotification(
                    organizer,
                    "Registration Cancelled",
                    displayName + " cancelled their registration for '" + eventTitle + "'.",
                    NotificationType.REGISTRATION
            );
        }

        // Confirm the cancellation to the registrant
        boolean cancelledBySelf = registrant.getId().equals(userId);
        notificationService.createNotification(
                registrant,
                "Registration Cancelled",
                cancelledBySelf
                        ? "Your registration for '" + eventTitle + "' has been cancelled."
                        : "Your registration for '" + eventTitle + "' was cancelled by the organizer.",
                NotificationType.REGISTRATION
        );
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
