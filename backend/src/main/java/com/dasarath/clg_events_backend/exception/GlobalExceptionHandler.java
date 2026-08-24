package com.dasarath.clg_events_backend.exception;

import com.dasarath.clg_events_backend.dto.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = ErrorResponse.of(
            HttpStatus.NOT_FOUND.value(),
            HttpStatus.NOT_FOUND.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DuplicateRegistrationException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateRegistration(DuplicateRegistrationException ex, HttpServletRequest request) {
        ErrorResponse error = ErrorResponse.of(
            HttpStatus.CONFLICT.value(),
            HttpStatus.CONFLICT.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(EventCapacityExceededException.class)
    public ResponseEntity<ErrorResponse> handleEventCapacityExceeded(EventCapacityExceededException ex, HttpServletRequest request) {
        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "EVENT_FULL",
            ex.getMessage(),
            request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedAction(UnauthorizedActionException ex, HttpServletRequest request) {
        ErrorResponse error = ErrorResponse.of(
            HttpStatus.FORBIDDEN.value(),
            HttpStatus.FORBIDDEN.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse error = ErrorResponse.validation(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed",
            "One or more fields failed validation",
            request.getRequestURI(),
            errors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        ErrorResponse error = ErrorResponse.of(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
            ex.getMessage() != null ? ex.getMessage() : "An unexpected server error occurred",
            request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
