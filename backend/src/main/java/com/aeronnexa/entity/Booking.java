package com.aeronnexa.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="bookings")
public class Booking {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false, fetch=FetchType.EAGER)
    @JoinColumn(name="flight_id", nullable=false)
    private Flight flight;

    @ManyToOne(optional=false, fetch=FetchType.EAGER)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false) private String passengerName;
    @Column(nullable=false) private String passengerEmail;
    @Column(nullable=false) private String seatNumber;
    @Column(nullable=false) private String status;
    @Column(nullable=false) private LocalDateTime bookedAt;

    public Booking(){}

    public Long getId(){return id;}
    public Flight getFlight(){return flight;}
    public User getUser(){return user;}
    public String getPassengerName(){return passengerName;}
    public String getPassengerEmail(){return passengerEmail;}
    public String getSeatNumber(){return seatNumber;}
    public String getStatus(){return status;}
    public LocalDateTime getBookedAt(){return bookedAt;}

    public void setId(Long v){id=v;}
    public void setFlight(Flight v){flight=v;}
    public void setUser(User v){user=v;}
    public void setPassengerName(String v){passengerName=v;}
    public void setPassengerEmail(String v){passengerEmail=v;}
    public void setSeatNumber(String v){seatNumber=v;}
    public void setStatus(String v){status=v;}
    public void setBookedAt(LocalDateTime v){bookedAt=v;}
}
