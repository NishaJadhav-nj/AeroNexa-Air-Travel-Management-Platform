package com.aeronnexa.repository;

import com.aeronnexa.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface FlightRepository extends JpaRepository<Flight,Long> {
    List<Flight> findBySourceIgnoreCaseAndDestinationIgnoreCaseAndTravelDate(
        String source, String destination, LocalDate travelDate);
}
