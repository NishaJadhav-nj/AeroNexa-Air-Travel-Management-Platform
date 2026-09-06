package com.aeronnexa.config;

import com.aeronnexa.entity.Flight;
import com.aeronnexa.repository.FlightRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seed(FlightRepository repo){
        return args -> {
            if(repo.count()==0){
                LocalDate d=LocalDate.now().plusDays(7);
                repo.save(new Flight("AeroNexa Air","AN101","Mumbai","Delhi",d,
                    LocalTime.of(8,30),LocalTime.of(10,45),new BigDecimal("5499"),180,180));
                repo.save(new Flight("AeroNexa Air","AN202","Mumbai","Bengaluru",d,
                    LocalTime.of(12,15),LocalTime.of(14,5),new BigDecimal("4299"),180,180));
                repo.save(new Flight("Skyline Air","SL303","Delhi","Mumbai",d,
                    LocalTime.of(17,20),LocalTime.of(19,35),new BigDecimal("5999"),180,180));
            }
        };
    }
}
