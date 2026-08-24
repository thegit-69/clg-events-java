package com.dasarath.clg_events_backend.exception;

public class DuplicateRegistrationException extends RuntimeException {
    public DuplicateRegistrationException(String message) {
        super(message);
    }
}
