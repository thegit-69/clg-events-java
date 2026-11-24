package com.dasarath.clg_events_backend.repository;

import com.dasarath.clg_events_backend.entity.User;
import com.dasarath.clg_events_backend.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE users SET id = :newId WHERE id = :oldId", nativeQuery = true)
    void updateUserId(@Param("oldId") String oldId, @Param("newId") String newId);
}
