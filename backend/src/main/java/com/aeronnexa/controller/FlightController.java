package com.aeronnexa.controller;

import com.aeronnexa.entity.Flight;
import com.aeronnexa.service.FlightService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins="http://localhost:5173")
public class FlightController {
    private final FlightService service;
    public FlightController(FlightService service){this.service=service;}

    @GetMapping public List<Flight> all(){return service.all();}

    @GetMapping("/search")
    public List<Flight> search(@RequestParam(required=false) String source,@RequestParam(required=false) String destination,
                               @RequestParam(required=false) LocalDate date){
        try {
            return service.search(source,destination,date);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping public Flight create(@RequestBody Flight flight){return service.save(flight);}
}
