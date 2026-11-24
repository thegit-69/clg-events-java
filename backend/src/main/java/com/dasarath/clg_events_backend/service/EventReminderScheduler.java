package com.dasarath.clg_events_backend.service;

import com.dasarath.clg_events_backend.entity.Event;
import com.dasarath.clg_events_backend.entity.Registration;
import com.dasarath.clg_events_backend.enums.NotificationType;
import com.dasarath.clg_events_backend.repository.EventRepository;
import com.dasarath.clg_events_backend.repository.RegistrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Sends one-off reminder notifications before an event starts and before its
 * registration deadline. The {@code startReminderSent} and
 * {@code deadlineReminderSent} flags make each reminder idempotent, even if the
 * scheduler runs frequently or the app restarts.
 */
@Service
public class EventReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventReminderScheduler.class);
    private static final Duration REMINDER_WINDOW = Duration.ofHours(24);

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;

    public EventReminderScheduler(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            NotificationService notificationService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 60 * 1000)
    @Transactional
    public void sendUpcomingReminders() {
        Instant now = Instant.now();
        Instant windowEnd = now.plus(REMINDER_WINDOW);

        List<Event> startingSoon = eventRepository.findEventsNeedingStartReminder(now, windowEnd);
        for (Event event : startingSoon) {
            notifyRegistrants(
                    event,
                    "Event Reminder: " + event.getTitle(),
                    "'" + event.getTitle() + "' starts in less than 24 hours. Get ready and check your ticket!"
            );
            event.setStartReminderSent(true);
            eventRepository.save(event);
        }

        List<Event> deadlinesSoon = eventRepository.findEventsNeedingDeadlineReminder(now, windowEnd);
        for (Event event : deadlinesSoon) {
            notifyRegistrants(
                    event,
                    "Registration Closing Soon: " + event.getTitle(),
                    "Registration for '" + event.getTitle() + "' closes in less than 24 hours. Register now if you have not already."
            );
            event.setDeadlineReminderSent(true);
            eventRepository.save(event);
        }

        if (!startingSoon.isEmpty() || !deadlinesSoon.isEmpty()) {
            log.info("Reminder scheduler processed {} start and {} deadline reminders",
                    startingSoon.size(), deadlinesSoon.size());
        }
    }

    private void notifyRegistrants(Event event, String title, String message) {
        List<Registration> registrations = registrationRepository.findByEventIdOrderByRegisteredAtDesc(event.getId());
        for (Registration registration : registrations) {
            notificationService.createNotification(
                    registration.getUser(),
                    title,
                    message,
                    NotificationType.REMINDER
            );
        }
    }
}
