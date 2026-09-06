package com.aeronnexa.service;

import com.aeronnexa.entity.User;
import com.aeronnexa.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class UserService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern STRONG_PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$");

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    public User register(String name, String email, String password) {
        String cleanName = trimToNull(name);
        String cleanEmail = trimToNull(email);
        String cleanPassword = trimToNull(password);

        if (cleanName == null) throw new IllegalArgumentException("Name is required");
        if (cleanName.length() < 2) throw new IllegalArgumentException("Name must contain at least 2 characters");
        if (cleanEmail == null) throw new IllegalArgumentException("Email is required");
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) throw new IllegalArgumentException("Please enter a valid email");
        if (cleanPassword == null) throw new IllegalArgumentException("Password is required");
        if (cleanPassword.length() < 8) throw new IllegalArgumentException("Password must be at least 8 characters");
        if (!STRONG_PASSWORD_PATTERN.matcher(cleanPassword).matches()) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter, lowercase letter, number and special character");
        }

        String normalizedEmail = cleanEmail.toLowerCase(Locale.ROOT);
        if (users.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("Email is already registered");
        }

        User user = new User();
        user.setName(cleanName.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(hashPassword(cleanPassword));
        user.setCreatedAt(LocalDateTime.now());
        return users.save(user);
    }

    public User login(String email, String password) {
        String cleanEmail = trimToNull(email);
        String cleanPassword = trimToNull(password);

        if (cleanEmail == null) throw new IllegalArgumentException("Email is required");
        if (cleanPassword == null) throw new IllegalArgumentException("Password is required");

        User user = users.findByEmail(cleanEmail.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!hashPassword(cleanPassword).equals(user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return user;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String hashPassword(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to hash password", e);
        }
    }
}
