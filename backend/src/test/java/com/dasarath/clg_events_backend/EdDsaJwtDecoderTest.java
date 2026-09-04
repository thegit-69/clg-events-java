package com.dasarath.clg_events_backend;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.Ed25519Signer;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetKeyPair;
import com.nimbusds.jose.jwk.gen.OctetKeyPairGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.Security;
import java.util.Date;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EdDsaJwtDecoderTest {

    @Test
    void testEdDsaJwtDecoding() throws Exception {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        OctetKeyPair jwk = new OctetKeyPairGenerator(Curve.Ed25519)
                .algorithm(JWSAlgorithm.EdDSA)
                .keyID("test-key-id")
                .generate();
        OctetKeyPair publicJWK = jwk.toPublicJWK();

        JWSSigner signer = new Ed25519Signer(jwk);
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject("test-user-123")
                .claim("email", "test@example.com")
                .claim("name", "Test User")
                .expirationTime(new Date(System.currentTimeMillis() + 3600_000))
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.EdDSA).keyID("test-key-id").build(),
                claims
        );
        signedJWT.sign(signer);
        String token = signedJWT.serialize();

        JWKSet jwkSet = new JWKSet(publicJWK);
        System.out.println("Public JWK: " + publicJWK.toJSONString());
        System.out.println("Public JWK key type: " + publicJWK.getKeyType());
        System.out.println("Public JWK alg: " + publicJWK.getAlgorithm());
        System.out.println("Public JWK curve: " + publicJWK.getCurve());
        System.out.println("Public JWK use: " + publicJWK.getKeyUse());
        System.out.println("Public JWK keyID: " + publicJWK.getKeyID());

        com.nimbusds.jose.jwk.JWKMatcher matcher = com.nimbusds.jose.jwk.JWKMatcher.forJWSHeader(signedJWT.getHeader());
        System.out.println("Matcher matches key? " + matcher.matches(publicJWK));

        ImmutableJWKSet<SecurityContext> jwkSource = new ImmutableJWKSet<>(jwkSet);
        com.dasarath.clg_events_backend.security.NeonJwtDecoder decoder =
                new com.dasarath.clg_events_backend.security.NeonJwtDecoder(jwkSource, "http://localhost/jwks");

        Jwt jwt = decoder.decode(token);

        assertEquals("test-user-123", jwt.getSubject());
        assertEquals("test@example.com", jwt.getClaimAsString("email"));
        assertEquals("Test User", jwt.getClaimAsString("name"));
        System.out.println("=== NeonJwtDecoder SUCCESSFUL! Subject=" + jwt.getSubject() + " ===");
    }
}

