package com.aeronnexa.service;

import com.aeronnexa.entity.Booking;
import com.aeronnexa.entity.Flight;
import com.aeronnexa.entity.User;
import com.aeronnexa.repository.BookingRepository;
import com.aeronnexa.repository.FlightRepository;
import com.aeronnexa.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class BookingService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final BookingRepository bookings;
    private final FlightRepository flights;
    private final UserRepository users;

    public BookingService(BookingRepository bookings, FlightRepository flights, UserRepository users){
        this.bookings=bookings; this.flights=flights; this.users=users;
    }

    @Transactional
    public Booking create(Long flightId,String name,String email,String seat){
        return create(flightId, name, email, seat, null);
    }

    @Transactional
    public Booking create(Long flightId,String name,String email,String seat,Long userId){
        if (flightId == null) throw new IllegalArgumentException("Flight ID is required");
        if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Passenger name is required");
        if (email == null || email.trim().isEmpty()) throw new IllegalArgumentException("Passenger email is required");
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) throw new IllegalArgumentException("Please enter a valid passenger email");
        if (seat == null || seat.trim().isEmpty()) throw new IllegalArgumentException("Seat number is required");

        Flight flight=flights.findById(flightId)
            .orElseThrow(()->new IllegalArgumentException("Flight not found"));
        if(flight.getAvailableSeats()==null || flight.getAvailableSeats()<=0) throw new IllegalStateException("No seats available");

        User user = resolveUser(email, userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found for booking");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.equals(user.getEmail())) {
            throw new IllegalArgumentException("Booking email does not match the logged-in user");
        }

        flight.setAvailableSeats(flight.getAvailableSeats()-1);
        flights.save(flight);

        Booking b=new Booking();
        b.setFlight(flight);
        b.setUser(user);
        b.setPassengerName(name.trim());
        b.setPassengerEmail(normalizedEmail);
        b.setSeatNumber(seat.trim());
        b.setStatus("CONFIRMED");
        b.setBookedAt(LocalDateTime.now());
        return bookings.save(b);
    }

    @Transactional
    public Booking cancel(Long id){
        Booking b=bookings.findById(id)
            .orElseThrow(()->new IllegalArgumentException("Booking not found"));
        if("CANCELLED".equals(b.getStatus())) return b;
        Flight f=b.getFlight();
        f.setAvailableSeats(Math.min(f.getTotalSeats(), f.getAvailableSeats()+1));
        flights.save(f);
        b.setStatus("CANCELLED");
        return bookings.save(b);
    }

    public List<Booking> byEmail(String email){return bookings.findByPassengerEmailOrderByBookedAtDesc(email);}

    public List<Booking> byUser(Long userId){
        if (userId == null) throw new IllegalArgumentException("User ID is required");
        return bookings.findByUserIdOrderByBookedAtDesc(userId);
    }

    private User resolveUser(String email, Long userId) {
        if (userId != null) {
            return users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return users.findByEmail(normalizedEmail).orElse(null);
    }
}
