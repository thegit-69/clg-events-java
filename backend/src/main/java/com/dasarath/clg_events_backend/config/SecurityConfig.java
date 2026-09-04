package com.dasarath.clg_events_backend.config;

import com.dasarath.clg_events_backend.dto.common.ErrorResponse;
import com.dasarath.clg_events_backend.security.NeonJwtAuthenticationConverter;
import com.dasarath.clg_events_backend.security.NeonJwtDecoder;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final NeonJwtDecoder neonJwtDecoder;
    private final NeonJwtAuthenticationConverter neonJwtAuthenticationConverter;
    private final List<String> allowedOrigins;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SecurityConfig(
            NeonJwtDecoder neonJwtDecoder,
            NeonJwtAuthenticationConverter neonJwtAuthenticationConverter,
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:5174}") String allowedOriginsStr
    ) {
        this.neonJwtDecoder = neonJwtDecoder;
        this.neonJwtAuthenticationConverter = neonJwtAuthenticationConverter;
        this.allowedOrigins = Arrays.stream(allowedOriginsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ── JWT Resource Server ──────────────────────────────────────────────────
                // Spring Boot auto-fetches Neon Auth's public keys from /.well-known/jwks.json.
                // The custom NeonJwtDecoder supports EdDSA (Ed25519) algorithm used by Neon Auth (Better Auth).
                // The NeonJwtAuthenticationConverter validates the token and syncs the user to DB.
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(neonJwtDecoder)
                                .jwtAuthenticationConverter(neonJwtAuthenticationConverter)
                        )
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ErrorResponse error = ErrorResponse.of(
                                     HttpStatus.UNAUTHORIZED.value(),
                                     HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                                     "Authentication required. Please sign in to continue.",
                                     request.getRequestURI()
                            );
                            try {
                                response.getOutputStream().write(objectMapper.writeValueAsBytes(error));
                            } catch (Exception ignored) {}
                        })
                )

                .authorizeHttpRequests(auth -> auth
                        // Public system endpoints
                        .requestMatchers("/", "/api/v1", "/api/v1/health").permitAll()
                        .requestMatchers("/ws-events/**", "/ws-events").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // Organizer endpoints under /api/v1/events require authentication
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/my-proposals", "/api/v1/events/dashboard-stats").authenticated()

                        // Public event discovery and details
                        .requestMatchers(HttpMethod.GET, "/api/v1/events", "/api/v1/events/*").permitAll()

                        // Super Admin only endpoints
                        .requestMatchers("/api/v1/admin/**").hasRole("SUPER_ADMIN")

                        // All other API endpoints require a valid Neon Auth JWT
                        .requestMatchers("/api/v1/**").authenticated()
                        .anyRequest().permitAll()
                )

                .exceptionHandling(exceptions -> exceptions
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ErrorResponse error = ErrorResponse.of(
                                    HttpStatus.FORBIDDEN.value(),
                                    HttpStatus.FORBIDDEN.getReasonPhrase(),
                                    "Access denied: Insufficient permissions to perform this action.",
                                    request.getRequestURI()
                            );
                            try {
                                response.getOutputStream().write(objectMapper.writeValueAsBytes(error));
                            } catch (Exception ignored) {}
                        })
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "X-Requested-With",
                "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
