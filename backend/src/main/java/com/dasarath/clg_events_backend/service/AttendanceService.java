package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.attendance.AttendanceEventDto;
import com.dasarath.clg_events_backend.dto.attendance.AttendanceStatusDto;
import com.dasarath.clg_events_backend.dto.registration.AttendeeDto;
import com.dasarath.clg_events_backend.entity.Registration;
import com.dasarath.clg_events_backend.enums.NotificationType;
import com.dasarath.clg_events_backend.exception.ResourceNotFoundException;
import com.dasarath.clg_events_backend.exception.UnauthorizedActionException;
import com.dasarath.clg_events_backend.repository.RegistrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);

    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public AttendanceService(
            RegistrationRepository registrationRepository,
            NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.registrationRepository = registrationRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public AttendanceStatusDto getAttendanceStatus(UUID eventId, String userId) {
        Optional<Registration> registrationOpt = registrationRepository.findByEventIdAndUserId(eventId, userId);
        if (registrationOpt.isEmpty()) {
            return new AttendanceStatusDto(false, null, false, null);
        }

        Registration registration = registrationOpt.get();
        return new AttendanceStatusDto(
                true,
                registration.getId(),
                registration.isAttended(),
                registration.getAttendedAt()
        );
    }

    @Transactional
    public AttendeeDto markAttendance(UUID registrationId, String markerUserId, boolean isSuperAdmin) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration record not found for ticket: " + registrationId));

        boolean isOrganizer = registration.getEvent().getOrganizer().getId().equals(markerUserId);
        if (!isOrganizer && !isSuperAdmin) {
            throw new UnauthorizedActionException("You are not authorized to mark attendance for this event");
        }

        if (!registration.isAttended()) {
            registration.setAttended(true);
            registration.setAttendedAt(Instant.now());
            Registration savedRegistration = registrationRepository.save(registration);

            // Send notification to attendee
            notificationService.createNotification(
                    registration.getUser(),
                    "Attendance Confirmed! ✅",
                    "Your attendance for '" + registration.getEvent().getTitle() + "' has been verified. Your certificate is now unlocked!",
                    NotificationType.REGISTRATION
            );

            // Real-time WebSocket broadcast to /topic/events/{eventId}/attendance
            UUID eventId = registration.getEvent().getId();
            String destination = "/topic/events/" + eventId + "/attendance";
            AttendanceEventDto attendanceEvent = new AttendanceEventDto(
                    eventId,
                    registration.getUser().getId(),
                    registration.getId(),
                    registration.getDisplayName(),
                    true,
                    savedRegistration.getAttendedAt()
            );

            try {
                messagingTemplate.convertAndSend(destination, attendanceEvent);
                log.info("Broadcasted real-time attendance unlock for user {} to {}", registration.getUser().getId(), destination);
            } catch (Exception e) {
                log.error("Failed to broadcast WebSocket attendance event to {}: {}", destination, e.getMessage());
            }
        }

        return new AttendeeDto(
                registration.getId(),
                registration.getUser().getId(),
                registration.getDisplayName(),
                registration.getEmail(),
                registration.isAttended(),
                registration.getAttendedAt()
        );
    }
}
