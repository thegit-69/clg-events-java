package com.dasarath.clg_events_backend.exception;

public class UnauthorizedActionException extends RuntimeException {
    public UnauthorizedActionException(String message) {
        super(message);
    }
}
