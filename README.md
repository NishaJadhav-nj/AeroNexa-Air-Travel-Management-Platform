# AeroNexa ✈️
### Flight Booking & Management System

A full-stack flight booking application built with Java, Spring Boot, Spring Data JPA, MySQL, REST APIs and a responsive React frontend.

## Tech Stack
- Java 17
- Spring Boot 3.5.x
- Spring Data JPA / Hibernate
- MySQL 8
- REST API
- React + Vite
- CSS3
- Razorpay Checkout (test-mode integration boundary)

## Core Features
- Flight search by source, destination and date
- Flight listing with seat availability
- User registration and login
- Booking workflow
- Passenger details
- Booking cancellation
- Booking history
- Admin flight management
- REST APIs
- MySQL persistence
- Razorpay payment checkout
- Responsive, classy aviation-themed UI

## Project Structure
```text
AeroNexa/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/aeronnexa/
│       ├── AeroNexaApplication.java
│       ├── controller/
│       ├── dto/
│       ├── entity/
│       ├── repository/
│       └── service/
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── database/
│   └── schema.sql
└── .gitignore
```

## Requirements
Install:
1. JDK 17+
2. MySQL 8+
3. Node.js 20+
4. Git
5. Maven (or use the Maven wrapper/IDE Maven integration)

## Database Setup
Create the database:
```sql
CREATE DATABASE aeronnexa;
```
Then configure `backend/src/main/resources/application.properties`.

Default:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/aeronnexa
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

Hibernate creates/updates tables automatically.

## Run Backend
```bash
cd backend
mvn spring-boot:run
```
Backend:
`http://localhost:8080`

## Run Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend:
`http://localhost:5173`

## API Examples

### Search flights
```http
GET /api/flights/search?source=Mumbai&destination=Delhi&date=2026-09-10
```

### List flights
```http
GET /api/flights
```

### Create booking
```http
POST /api/bookings
Content-Type: application/json

{
  "flightId": 1,
  "passengerName": "Nisha Jadhav",
  "passengerEmail": "nisha@example.com",
  "seatNumber": "12A"
}
```

### Cancel booking
```http
PUT /api/bookings/{id}/cancel
```

### Create Razorpay order
```http
POST /api/payments/order
Content-Type: application/json

{
  "amount": 4999
}
```

## Payment Integration
The backend exposes a Razorpay order endpoint and the frontend contains the checkout integration boundary. Add your Razorpay **test** key ID and secret to environment/application configuration before enabling real test checkout.




