package com.aeronnexa.controller;

import com.aeronnexa.entity.Booking;
import com.aeronnexa.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins="http://localhost:5173")
public class BookingController {
    private final BookingService service;
    public BookingController(BookingService service){this.service=service;}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateBookingRequest r){
        try {
            return ResponseEntity.ok(service.create(r.flightId(),r.passengerName(),r.passengerEmail(),r.seatNumber(),r.userId()));
        } catch (IllegalArgumentException e) {
            HttpStatus status = "Flight not found".equals(e.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(java.util.Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public Booking cancel(@PathVariable Long id){return service.cancel(id);}

    @GetMapping
    public List<Booking> byEmail(@RequestParam String email){return service.byEmail(email);}

    @GetMapping("/user/{userId}")
    public List<Booking> byUser(@PathVariable Long userId){return service.byUser(userId);}

    public record CreateBookingRequest(Long flightId,String passengerName,String passengerEmail,String seatNumber,Long userId){}
}
