package com.aeronnexa.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name="flights")
public class Flight {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String airline;
    @Column(nullable=false) private String flightNumber;
    @Column(nullable=false) private String source;
    @Column(nullable=false) private String destination;
    @Column(nullable=false) private LocalDate travelDate;
    @Column(nullable=false) private LocalTime departureTime;
    @Column(nullable=false) private LocalTime arrivalTime;
    @Column(nullable=false, precision=10, scale=2) private BigDecimal price;
    @Column(nullable=false) private Integer totalSeats;
    @Column(nullable=false) private Integer availableSeats;

    public Flight() {}

    public Flight(String airline,String flightNumber,String source,String destination,
                  LocalDate travelDate,LocalTime departureTime,LocalTime arrivalTime,
                  BigDecimal price,Integer totalSeats,Integer availableSeats) {
        this.airline=airline; this.flightNumber=flightNumber; this.source=source;
        this.destination=destination; this.travelDate=travelDate; this.departureTime=departureTime;
        this.arrivalTime=arrivalTime; this.price=price; this.totalSeats=totalSeats;
        this.availableSeats=availableSeats;
    }

    public Long getId(){return id;}
    public String getAirline(){return airline;}
    public String getFlightNumber(){return flightNumber;}
    public String getSource(){return source;}
    public String getDestination(){return destination;}
    public LocalDate getTravelDate(){return travelDate;}
    public LocalTime getDepartureTime(){return departureTime;}
    public LocalTime getArrivalTime(){return arrivalTime;}
    public BigDecimal getPrice(){return price;}
    public Integer getTotalSeats(){return totalSeats;}
    public Integer getAvailableSeats(){return availableSeats;}

    public void setId(Long id){this.id=id;}
    public void setAirline(String v){this.airline=v;}
    public void setFlightNumber(String v){this.flightNumber=v;}
    public void setSource(String v){this.source=v;}
    public void setDestination(String v){this.destination=v;}
    public void setTravelDate(LocalDate v){this.travelDate=v;}
    public void setDepartureTime(LocalTime v){this.departureTime=v;}
    public void setArrivalTime(LocalTime v){this.arrivalTime=v;}
    public void setPrice(BigDecimal v){this.price=v;}
    public void setTotalSeats(Integer v){this.totalSeats=v;}
    public void setAvailableSeats(Integer v){this.availableSeats=v;}
}
