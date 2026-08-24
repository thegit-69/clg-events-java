package com.dasarath.clg_events_backend.security;

import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.Role;
import com.dasarath.clg_events_backend.service.UserService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class NeonJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserService userService;

    public NeonJwtAuthenticationConverter(UserService userService) {
        this.userService = userService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // Automatically sync/provision user in Postgres database
        User user = userService.syncUserFromJwt(jwt);

        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
        authorities.add(new SimpleGrantedAuthority("ROLE_ORGANIZER"));

        if (user.getRole() == Role.SUPER_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
        }

        String principalClaimName = jwt.getSubject() != null ? jwt.getSubject() : user.getId();
        return new JwtAuthenticationToken(jwt, authorities, principalClaimName);
    }
}
