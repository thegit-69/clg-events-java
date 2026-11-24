package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.event.CreateEventRequest;
import com.dasarath.clg_events_backend.dto.event.DashboardStatsDto;
import com.dasarath.clg_events_backend.dto.event.EventResponseDto;
import com.dasarath.clg_events_backend.dto.event.UpdateEventRequest;
import com.dasarath.clg_events_backend.entity.Event;
import com.dasarath.clg_events_backend.entity.Registration;
import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.ApprovalStatus;
import com.dasarath.clg_events_backend.enums.EventMode;
import com.dasarath.clg_events_backend.enums.EventStatus;
import com.dasarath.clg_events_backend.enums.NotificationType;
import com.dasarath.clg_events_backend.exception.BadRequestException;
import com.dasarath.clg_events_backend.exception.ResourceNotFoundException;
import com.dasarath.clg_events_backend.exception.UnauthorizedActionException;
import com.dasarath.clg_events_backend.repository.EventRepository;
import com.dasarath.clg_events_backend.repository.RegistrationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public EventService(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            UserService userService,
            NotificationService notificationService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Page<EventResponseDto> getApprovedEvents(String search, String type, String tag, Pageable pageable) {
        String searchTerm = normalizeFilter(search);
        String typeTerm = normalizeFilter(type);
        if (typeTerm.equalsIgnoreCase("all")) {
            typeTerm = "";
        }
        String tagTerm = normalizeFilter(tag);

        Page<Event> page = eventRepository.searchApprovedEventsFiltered(
                ApprovalStatus.APPROVED,
                searchTerm,
                typeTerm,
                tagTerm,
                pageable
        );

        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public EventResponseDto getEventById(UUID eventId, String currentUserId, boolean isSuperAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        // If event is not approved, only organizer or super admin can view
        if (event.getApprovalStatus() != ApprovalStatus.APPROVED) {
            boolean isOrganizer = currentUserId != null && event.getOrganizer().getId().equals(currentUserId);
            if (!isOrganizer && !isSuperAdmin) {
                throw new UnauthorizedActionException("This event proposal is pending review and is not publicly visible.");
            }
        }

        return toDto(event);
    }

    @Transactional
    public EventResponseDto createEvent(CreateEventRequest request, String organizerId) {
        validateEventDates(request.startDate(), request.endDate(), request.registrationDeadline());

        User organizer = userService.getUserById(organizerId);

        Event event = new Event();
        event.setOrganizer(organizer);
        event.setTitle(request.title().trim());
        event.setType(request.type().trim());
        event.setMode(request.mode());
        event.setDescription(request.description().trim());
        event.setVenue(request.venue());
        String banner = request.banner();
        if (banner == null || banner.isBlank()) {
            banner = getDefaultBanner(request.type());
        }
        event.setBannerUrl(banner);
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setRegistrationDeadline(request.registrationDeadline());
        if (request.maxParticipants() != null && request.maxParticipants() > 0) {
            event.setMaxParticipants(request.maxParticipants());
        }
        if (request.tags() != null) {
            event.setTags(new HashSet<>(request.tags()));
        }

        event.setStatus(EventStatus.UPCOMING);
        event.setApprovalStatus(ApprovalStatus.PENDING);

        Event savedEvent = eventRepository.save(event);

        // Send submission confirmation notification to the organizer
        notificationService.createNotification(
                organizer,
                "Event Proposal Submitted",
                "Your event proposal '" + savedEvent.getTitle() + "' has been submitted for admin approval.",
                NotificationType.EVENT
        );

        // Let every super admin know there is something new to review
        notifySuperAdmins(
                "New Event Proposal Pending Review",
                organizerDisplayName(organizer) + " submitted '" + savedEvent.getTitle() + "' for approval.",
                NotificationType.EVENT,
                organizer.getId()
        );

        return toDto(savedEvent);
    }

    public static String getDefaultBanner(String type) {
        if (type == null) return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop";
        return switch (type.trim().toLowerCase()) {
            case "hackathon" -> "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop";
            case "cultural" -> "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop";
            case "fest" -> "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop";
            case "sports" -> "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop";
            case "technical" -> "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop";
            case "workshop" -> "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop";
            case "seminar" -> "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop";
            case "conference" -> "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop";
            default -> "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop";
        };
    }

    @Transactional
    public EventResponseDto updateEvent(UUID eventId, UpdateEventRequest request, String userId, boolean isSuperAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        boolean isOrganizer = event.getOrganizer().getId().equals(userId);
        if (!isOrganizer && !isSuperAdmin) {
            throw new UnauthorizedActionException("You are not authorized to update this event");
        }

        // Capture the previous values so we can tell registrants what changed
        String oldTitle = event.getTitle();
        String oldVenue = event.getVenue();
        EventMode oldMode = event.getMode();
        Instant oldStart = event.getStartDate();
        Instant oldEnd = event.getEndDate();
        Instant oldDeadline = event.getRegistrationDeadline();

        if (request.title() != null && !request.title().isBlank()) event.setTitle(request.title().trim());
        if (request.type() != null && !request.type().isBlank()) event.setType(request.type().trim());
        if (request.mode() != null) event.setMode(request.mode());
        if (request.description() != null && !request.description().isBlank()) event.setDescription(request.description().trim());
        if (request.venue() != null) event.setVenue(request.venue());
        if (request.banner() != null) event.setBannerUrl(request.banner());
        if (request.startDate() != null) event.setStartDate(request.startDate());
        if (request.endDate() != null) event.setEndDate(request.endDate());
        if (request.registrationDeadline() != null) event.setRegistrationDeadline(request.registrationDeadline());
        if (request.maxParticipants() != null && request.maxParticipants() > 0) event.setMaxParticipants(request.maxParticipants());
        if (request.tags() != null) event.setTags(new HashSet<>(request.tags()));

        // Validate the effective schedule after applying the patch
        validateEventDates(event.getStartDate(), event.getEndDate(), event.getRegistrationDeadline());

        boolean startChanged = !Objects.equals(oldStart, event.getStartDate());
        boolean deadlineChanged = !Objects.equals(oldDeadline, event.getRegistrationDeadline());

        // A rescheduled event should be reminded about again
        if (startChanged) {
            event.setStartReminderSent(false);
        }
        if (deadlineChanged) {
            event.setDeadlineReminderSent(false);
        }

        boolean detailsChanged = startChanged
                || deadlineChanged
                || !Objects.equals(oldEnd, event.getEndDate())
                || !Objects.equals(oldTitle, event.getTitle())
                || !Objects.equals(oldVenue, event.getVenue())
                || oldMode != event.getMode();

        Event updatedEvent = eventRepository.save(event);

        if (detailsChanged) {
            notifyRegistrants(
                    updatedEvent,
                    "Event Updated: " + updatedEvent.getTitle(),
                    "The details for '" + updatedEvent.getTitle() + "' have changed. Please review the latest schedule, venue, and registration deadline.",
                    NotificationType.EVENT
            );
        }

        return toDto(updatedEvent);
    }

    @Transactional
    public void deleteEvent(UUID eventId, String userId, boolean isSuperAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        boolean isOrganizer = event.getOrganizer().getId().equals(userId);
        if (!isOrganizer && !isSuperAdmin) {
            throw new UnauthorizedActionException("You are not authorized to delete this event");
        }

        String eventTitle = event.getTitle();
        List<Registration> registrations = registrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId);

        eventRepository.delete(event);

        // Tell everyone who registered that the event is gone
        registrations.forEach(registration ->
                notificationService.createNotification(
                        registration.getUser(),
                        "Event Cancelled: " + eventTitle,
                        "'" + eventTitle + "' has been cancelled and removed by the organizer.",
                        NotificationType.EVENT
                )
        );
    }

    @Transactional
    public EventResponseDto resubmitEvent(UUID eventId, String userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (!event.getOrganizer().getId().equals(userId)) {
            throw new UnauthorizedActionException("You are not authorized to resubmit this event");
        }

        if (event.getApprovalStatus() != ApprovalStatus.REJECTED) {
            throw new BadRequestException("Only rejected events can be resubmitted for review");
        }

        event.setApprovalStatus(ApprovalStatus.PENDING);
        event.setRejectionReason(null);
        event.setReviewedBy(null);
        event.setReviewedAt(null);

        Event savedEvent = eventRepository.save(event);

        notificationService.createNotification(
                event.getOrganizer(),
                "Event Proposal Resubmitted",
                "Your event proposal '" + savedEvent.getTitle() + "' has been resubmitted for admin approval.",
                NotificationType.EVENT
        );

        notifySuperAdmins(
                "Event Proposal Resubmitted",
                organizerDisplayName(event.getOrganizer()) + " resubmitted '" + savedEvent.getTitle() + "' for approval.",
                NotificationType.EVENT,
                event.getOrganizer().getId()
        );

        return toDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public List<EventResponseDto> getMyProposals(String organizerId) {
        return eventRepository.findByOrganizerIdOrderByCreatedAtDesc(organizerId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(String organizerId) {
        long totalEvents = eventRepository.countByOrganizerId(organizerId);
        long totalRegistrations = registrationRepository.countTotalRegistrationsForOrganizer(organizerId);
        long pendingEvents = eventRepository.countByOrganizerIdAndApprovalStatus(organizerId, ApprovalStatus.PENDING);
        long approvedEvents = eventRepository.countByOrganizerIdAndApprovalStatus(organizerId, ApprovalStatus.APPROVED);

        return new DashboardStatsDto(totalEvents, totalRegistrations, pendingEvents, approvedEvents);
    }

    /**
     * Derive the status clients should see from the event's dates instead of
     * relying on a stored flag that is never advanced. Cancellation remains an
     * explicit organizer/admin decision and is preserved.
     */
    private EventStatus computeEffectiveStatus(Event event) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventStatus.CANCELLED;
        }

        Instant now = Instant.now();
        Instant start = event.getStartDate();
        Instant end = event.getEndDate();

        if (end != null && now.isAfter(end)) {
            return EventStatus.COMPLETED;
        }
        if (start != null && !now.isBefore(start)) {
            return EventStatus.OPEN;
        }
        return EventStatus.UPCOMING;
    }

    private void validateEventDates(Instant start, Instant end, Instant deadline) {
        if (start == null) {
            throw new BadRequestException("Start date is required");
        }
        if (end == null) {
            throw new BadRequestException("End date is required");
        }
        if (!end.isAfter(start)) {
            throw new BadRequestException("End date must be after the start date");
        }
        if (deadline != null && deadline.isAfter(start)) {
            throw new BadRequestException("Registration deadline must be on or before the event start date");
        }
    }

    private void notifySuperAdmins(String title, String message, NotificationType type, String excludeUserId) {
        userService.getSuperAdmins().stream()
                .filter(admin -> excludeUserId == null || !admin.getId().equals(excludeUserId))
                .forEach(admin -> notificationService.createNotification(admin, title, message, type));
    }

    private void notifyRegistrants(Event event, String title, String message, NotificationType type) {
        registrationRepository.findByEventIdOrderByRegisteredAtDesc(event.getId())
                .forEach(registration -> notificationService.createNotification(
                        registration.getUser(),
                        title,
                        message,
                        type
                ));
    }

    private String organizerDisplayName(User organizer) {
        String name = organizer.getDisplayName();
        if (name == null || name.isBlank()) {
            name = organizer.getEmail();
        }
        return name;
    }

    private String normalizeFilter(String value) {
        return (value == null || value.isBlank()) ? "" : value.trim();
    }

    public EventResponseDto toDto(Event event) {
        long registeredCount = registrationRepository.countByEventId(event.getId());
        String organizerName = event.getOrganizer().getDisplayName();
        if (organizerName == null || organizerName.isBlank()) {
            organizerName = event.getOrganizer().getEmail();
        }

        String bannerUrl = event.getBannerUrl();
        if (bannerUrl == null || bannerUrl.isBlank()) {
            bannerUrl = getDefaultBanner(event.getType());
        }

        return new EventResponseDto(
                event.getId(),
                event.getTitle(),
                event.getType(),
                event.getMode(),
                event.getDescription(),
                event.getVenue(),
                bannerUrl,
                bannerUrl,
                event.getStartDate(),
                event.getEndDate(),
                event.getRegistrationDeadline(),
                event.getMaxParticipants(),
                registeredCount,
                computeEffectiveStatus(event),
                event.getApprovalStatus(),
                organizerName,
                event.getOrganizer().getId(),
                event.getRejectionReason(),
                event.getTags(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
