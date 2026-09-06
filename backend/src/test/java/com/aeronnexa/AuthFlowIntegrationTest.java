package com.aeronnexa;

import com.aeronnexa.entity.Booking;
import com.aeronnexa.entity.Flight;
import com.aeronnexa.entity.User;
import com.aeronnexa.repository.FlightRepository;
import com.aeronnexa.service.BookingService;
import com.aeronnexa.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class AuthFlowIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private FlightRepository flightRepository;

    @Test
    void registerAndLoginShouldWork() {
        String uniqueEmail = "test-" + UUID.randomUUID() + "@example.com";

        User registered = userService.register("Test User", uniqueEmail, "Secret123!");
        User loggedIn = userService.login(uniqueEmail, "Secret123!");

        assertThat(registered.getEmail()).isEqualTo(uniqueEmail);
        assertThat(loggedIn.getEmail()).isEqualTo(uniqueEmail);
        assertThat(loggedIn.getName()).isEqualTo("Test User");
    }

    @Test
    void bookingShouldBeLinkedToCreatingUserAndRetrievableByUser() {
        String uniqueEmail = "booking-user-" + UUID.randomUUID() + "@example.com";
        User user = userService.register("Booking User", uniqueEmail, "Secret123!");

        Flight flight = flightRepository.save(new Flight(
                "AeroNexa Air",
                "AN999",
                "Mumbai",
                "Pune",
                LocalDate.now().plusDays(4),
                LocalTime.of(9, 0),
                LocalTime.of(10, 30),
                new BigDecimal("3200"),
                40,
                40
        ));

        Booking booking = bookingService.create(flight.getId(), "Booking User", uniqueEmail, "12A", user.getId());

        assertThat(booking.getUser()).isNotNull();
        assertThat(booking.getUser().getId()).isEqualTo(user.getId());
        assertThat(bookingService.byUser(user.getId())).extracting(Booking::getId).contains(booking.getId());
    }

        @Test
        void invalidRegistrationShouldBeRejected() {
        assertThatThrownBy(() -> userService.register("A", "invalid-email", "password"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Name must contain at least 2 characters");
        }

        @Test
        void duplicateEmailAndInvalidLoginShouldBeRejected() {
        String uniqueEmail = "duplicate-" + UUID.randomUUID() + "@example.com";
        userService.register("Duplicate User", uniqueEmail, "Secret123!");

        assertThatThrownBy(() -> userService.register("Another User", uniqueEmail, "Secret123!"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Email is already registered");
        assertThatThrownBy(() -> userService.login(uniqueEmail, "Wrong123!"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid email or password");
        }

        @Test
        void invalidBookingAndUnavailableFlightShouldBeRejected() {
        String uniqueEmail = "booking-validation-" + UUID.randomUUID() + "@example.com";
        User user = userService.register("Validation User", uniqueEmail, "Secret123!");

        assertThatThrownBy(() -> bookingService.create(null, "Validation User", uniqueEmail, "12A", user.getId()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Flight ID is required");

        assertThatThrownBy(() -> bookingService.create(999999L, "Validation User", uniqueEmail, "12A", user.getId()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Flight not found");

        Flight fullFlight = flightRepository.save(new Flight(
            "AeroNexa Air", "AN998", "Mumbai", "Goa", LocalDate.now().plusDays(4),
            LocalTime.of(9, 0), LocalTime.of(10, 30), new BigDecimal("3200"), 1, 0));
        assertThatThrownBy(() -> bookingService.create(fullFlight.getId(), "Validation User", uniqueEmail, "12A", user.getId()))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("No seats available");
        }
}
