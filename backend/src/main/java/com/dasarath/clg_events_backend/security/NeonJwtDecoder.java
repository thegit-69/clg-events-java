package com.dasarath.clg_events_backend.security;

import com.nimbusds.jose.crypto.ECDSAVerifier;
import com.nimbusds.jose.crypto.Ed25519Verifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.security.Security;
import java.time.Instant;
import java.util.*;

/**
 * Custom JwtDecoder that supports EdDSA (Ed25519) tokens issued by Neon Auth (Better Auth),
 * as well as standard RSA and EC tokens.
 *
 * Spring Security's default NimbusJwtDecoder does not support EdDSA algorithms out of the box.
 * This decoder uses Nimbus's RemoteJWKSet for key discovery and Ed25519Verifier for cryptographic validation.
 */
@Component
public class NeonJwtDecoder implements JwtDecoder {

    private static final Logger log = LoggerFactory.getLogger(NeonJwtDecoder.class);

    private final JWKSource<SecurityContext> jwkSource;
    private final String jwkSetUri;

    static {
        // Ensure BouncyCastle provider is registered for elliptic curve and Ed25519 crypto
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Autowired
    public NeonJwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:https://ep-billowing-bread-azc1ckap.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json}")
            String jwkSetUri
    ) {
        this.jwkSetUri = jwkSetUri;
        try {
            log.info("Configuring NeonJwtDecoder with JWKS endpoint: {}", jwkSetUri);
            this.jwkSource = new RemoteJWKSet<>(new URI(jwkSetUri).toURL());
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to initialize RemoteJWKSet for URI: " + jwkSetUri, e);
        }
    }

    // Constructor for testing with arbitrary JWKSource
    public NeonJwtDecoder(JWKSource<SecurityContext> jwkSource, String jwkSetUri) {
        this.jwkSource = jwkSource;
        this.jwkSetUri = jwkSetUri;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 1. Select matching key from JWKS by KeyID or match all
            String keyId = signedJWT.getHeader().getKeyID();
            JWKMatcher.Builder matcherBuilder = new JWKMatcher.Builder();
            if (keyId != null && !keyId.isBlank()) {
                matcherBuilder.keyID(keyId);
            }

            JWKSelector selector = new JWKSelector(matcherBuilder.build());
            List<JWK> matches = jwkSource.get(selector, null);

            if (matches == null || matches.isEmpty()) {
                throw new BadJwtException("No matching key found in JWKS for kid: " + keyId);
            }

            boolean verified = false;
            Exception lastVerifyException = null;

            for (JWK key : matches) {
                try {
                    if (key instanceof OctetKeyPair okp) {
                        Ed25519Verifier verifier = new Ed25519Verifier(okp.toPublicJWK());
                        if (signedJWT.verify(verifier)) {
                            verified = true;
                            break;
                        }
                    } else if (key instanceof RSAKey rsaKey) {
                        RSASSAVerifier verifier = new RSASSAVerifier(rsaKey.toRSAPublicKey());
                        if (signedJWT.verify(verifier)) {
                            verified = true;
                            break;
                        }
                    } else if (key instanceof ECKey ecKey) {
                        ECDSAVerifier verifier = new ECDSAVerifier(ecKey.toECPublicKey());
                        if (signedJWT.verify(verifier)) {
                            verified = true;
                            break;
                        }
                    }
                } catch (Exception ex) {
                    lastVerifyException = ex;
                }
            }

            if (!verified) {
                String reason = lastVerifyException != null ? lastVerifyException.getMessage() : "signature mismatch";
                throw new BadJwtException("JWT signature verification failed: " + reason);
            }

            // 2. Validate expiration timestamp
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
            Date exp = claimsSet.getExpirationTime();
            if (exp != null && new Date().after(exp)) {
                throw new BadJwtException("JWT expired at " + exp);
            }

            // 3. Construct Spring Security Jwt object
            Map<String, Object> headers = new LinkedHashMap<>(signedJWT.getHeader().toJSONObject());
            Map<String, Object> claims = new LinkedHashMap<>(claimsSet.getClaims());

            Instant issuedAt = claimsSet.getIssueTime() != null
                    ? claimsSet.getIssueTime().toInstant()
                    : Instant.now();

            Instant expiresAt = exp != null
                    ? exp.toInstant()
                    : Instant.now().plusSeconds(3600);

            return new Jwt(token, issuedAt, expiresAt, headers, claims);
        } catch (JwtException e) {
            throw e;
        } catch (Exception e) {
            throw new BadJwtException("Failed to decode and verify JWT: " + e.getMessage(), e);
        }
    }
}
