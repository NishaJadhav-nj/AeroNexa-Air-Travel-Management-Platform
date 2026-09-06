package com.aeronnexa.service;

import com.aeronnexa.entity.Flight;
import com.aeronnexa.repository.FlightRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class FlightService {
    private final FlightRepository repository;
    public FlightService(FlightRepository repository){this.repository=repository;}

    public List<Flight> all(){return repository.findAll();}
    public List<Flight> search(String source,String destination,LocalDate date){
        if (source == null || source.trim().isEmpty()) throw new IllegalArgumentException("Source is required");
        if (destination == null || destination.trim().isEmpty()) throw new IllegalArgumentException("Destination is required");
        if (date == null) throw new IllegalArgumentException("Please select a travel date");
        if (source.trim().equalsIgnoreCase(destination.trim())) {
            throw new IllegalArgumentException("Source and destination cannot be the same");
        }
        if (date.isBefore(LocalDate.now())) throw new IllegalArgumentException("Please select a valid travel date");
        return repository.findBySourceIgnoreCaseAndDestinationIgnoreCaseAndTravelDate(source,destination,date);
    }
    public Flight save(Flight f){return repository.save(f);}
}
