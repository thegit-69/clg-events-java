package com.dasarath.clg_events_backend.security;

import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.Role;
import com.dasarath.clg_events_backend.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class UserHeaderAuthenticationFilter extends OncePerRequestFilter {

    private final UserService userService;

    public UserHeaderAuthenticationFilter(UserService userService) {
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Only process if not already authenticated by JWT
        if (SecurityContextHolder.getContext().getAuthentication() == null ||
                "anonymousUser".equals(SecurityContextHolder.getContext().getAuthentication().getPrincipal())) {

            String userEmail = request.getHeader("X-User-Email");
            String userId = request.getHeader("X-User-Id");
            String userName = request.getHeader("X-User-Name");

            if (userEmail != null && !userEmail.isBlank()) {
                String effectiveId = (userId != null && !userId.isBlank())
                        ? userId
                        : "usr_" + userEmail.replaceAll("[^a-zA-Z0-9]", "_");

                User user = userService.getOrCreateUser(effectiveId, userEmail.trim(), userName, null);

                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
                authorities.add(new SimpleGrantedAuthority("ROLE_ORGANIZER"));

                if (userService.isSuperAdminEmail(userEmail) || user.getRole() == Role.SUPER_ADMIN) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user.getId(), null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
