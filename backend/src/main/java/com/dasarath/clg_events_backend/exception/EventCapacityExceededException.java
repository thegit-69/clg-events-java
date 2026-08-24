package com.dasarath.clg_events_backend.exception;

public class EventCapacityExceededException extends RuntimeException {
    public EventCapacityExceededException(String message) {
        super(message);
    }
}
