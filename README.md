##Ticket Bari – Server-side

A robust Node.js & Express.js backend for the Online Ticket Booking Platform, responsible for handling authentication, ticket management, bookings, and secure database operations.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Installation️ & Setup](#installation--setup)
- [Folder Structure](#folder-structure)
- [Contact](#contact)

---

## About the Project 

The Online Ticket Booking Platform – Server-side is the backend service that powers the ticket booking system. It provides RESTful APIs for the frontend, manages users, tickets, and bookings, and ensures secure authentication and data persistence using JWT and MongoDB.
This backend is designed to be scalable, secure, and easy to maintain.

---

## Project Overview  
Objective: To provide secure, scalable, and efficient backend services for an online ticket booking system.
Users: Works with the frontend to manage users, tickets, and booking operations.
APIs: User authentication & authorization
Ticket management (CRUD)
Booking management

---

## Key Features  

User authentication using JWT
Secure RESTful API architecture
Ticket management APIs (Create, Read, Update, Delete)
Booking system with status handling (Available / Booked / Cancelled)
MongoDB integration for persistent data storage
CORS and environment-based configuration

---

## Tech Stack  
Backend: Node.js · Express.js · MongoDB · JWT
Tools: Git · VS Code · Postman

---

## Dependencies  
List required dependencies or major libraries:

```json{
"express": "^4.x",
"mongoose": "^7.x",
"dotenv": "^16.x",
"jsonwebtoken": "^9.x",
"cors": "^2.x"
}

```

---

## Installation️ & Setup
1. Clone the repo and install dependencies:

```bash
git clone https://github.com/Nusrat-Islam/online_ticket_booking_server.git
cd online_ticket_booking_server
npm install
```

2. Set up environment variables by creating a `.env` file in the root directory:

```env
PORT=5000
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DATABASE_URL=mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.mongodb.net/onlineTicketBooking
JWT_SECRET=your_jwt_secret

```

3. Run the application:

```bash
npm run dev
```

---

## Folder Structure

```plaintext
online_ticket_booking_server/
│
├── src/
│ ├── controllers/
│ ├── routes/
│ ├── models/
│ ├── middlewares/
│ └── utils/
├── .env
├── index.js
├── package.json
└── README.md
```


---

## Contact


**Email:** [Nusrat-Islam](nishinusrat395@gmail.com)
