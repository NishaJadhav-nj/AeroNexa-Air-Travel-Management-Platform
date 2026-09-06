package com.aeronnexa.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins="http://localhost:5173")
public class PaymentController {
    @Value("${razorpay.key.id}") private String keyId;

    @PostMapping("/order")
    public Map<String,Object> createOrder(@RequestBody Map<String,Object> body){
        Number amount=(Number)body.getOrDefault("amount",0);
        // Demo/test order boundary. Replace this method with Razorpay Orders API
        // using the official Razorpay Java SDK when real test checkout is enabled.
        return Map.of(
            "orderId","order_demo_"+UUID.randomUUID(),
            "amount",amount,
            "currency","INR",
            "keyId",keyId,
            "status","CREATED"
        );
    }
}
