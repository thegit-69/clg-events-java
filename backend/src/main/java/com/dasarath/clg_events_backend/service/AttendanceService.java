package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.dto.attendance.AttendanceStatusDto;
import com.dasarath.clg_events_backend.dto.registration.AttendeeDto;
import com.dasarath.clg_events_backend.entity.Registration;
import com.dasarath.clg_events_backend.enums.NotificationType;
import com.dasarath.clg_events_backend.exception.ResourceNotFoundException;
import com.dasarath.clg_events_backend.exception.UnauthorizedActionException;
import com.dasarath.clg_events_backend.repository.RegistrationRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AttendanceService {

    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher applicationEventPublisher;

    public AttendanceService(
            RegistrationRepository registrationRepository,
            NotificationService notificationService,
            ApplicationEventPublisher applicationEventPublisher
    ) {
        this.registrationRepository = registrationRepository;
        this.notificationService = notificationService;
        this.applicationEventPublisher = applicationEventPublisher;
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
            registrationRepository.save(registration);

            // Send notification to attendee
            notificationService.createNotification(
                    registration.getUser(),
                    "Attendance Confirmed! ✅",
                    "Your attendance for '" + registration.getEvent().getTitle() + "' has been verified. Your certificate is now unlocked!",
                    NotificationType.REGISTRATION
            );
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
