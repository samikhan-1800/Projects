# Event Management System

The Event Management System is a web-based application designed to manage events efficiently. It provides separate portals for **Admin**, **Organizer**, and **User**, allowing controlled access and smooth handling of event creation, approval, booking, and reporting. The system aims to simplify event management by automating key processes.

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Features](#system-features)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation Guide](#installation-guide)
- [Running the Application](#running-the-application)
- [Automated Testing](#automated-testing)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)

---

## Project Overview

This project provides an online platform where organizers can create events, users can view and book events, and admins can manage and approve events. The system ensures secure access, proper workflow, and reliable data handling through a role-based structure.

---

## System Features

- User registration and login  
- Role-based access control  
- Event creation and management  
- Admin approval of events  
- Event booking and payment handling  
- Booking status tracking  
- Reports and analytics for admin  

---

## User Roles

**Admin**  
Manages the overall system, approves or rejects events, and views reports.

**Organizer**  
Creates and manages events, views bookings, and confirms or rejects bookings.

**User**  
Registers, views approved events, books events, makes payments, and tracks booking status.

---

## Technology Stack

- Frontend: HTML, CSS, JavaScript  
- Backend: Node.js  
- Database: SQL Server / MySQL  
- IDE: Visual Studio Code  
- Version Control: Git and GitHub  
- Testing: Manual Testing and GitHub Actions (Automated Testing)

---

## System Architecture

The system follows a client-server architecture. The frontend interacts with the backend through HTTP requests, while the backend handles business logic and database operations. Role-based authentication ensures secure access to system features.

---

## Installation Guide

1. Install Node.js on your system  
2. Install SQL Server or MySQL and create the database  
3. Clone the repository from GitHub  
4. Open the project in Visual Studio Code  
5. Configure database connection settings  

---

## Running the Application

1. Open terminal in the project directory  
2. Install dependencies using  
   ```
   npm install
   ```
3. Start the server using  
   ```
   npm start
   ```
4. Open a web browser and access the application using localhost  

---

## Automated Testing

Automated testing is enabled using **GitHub Actions**. Test cases are executed automatically whenever code is pushed to the main branch. This ensures continuous integration and early detection of errors. Jest is used as the testing framework.

---

## Project Structure

```
Event-Management-System/
│── backend/
│── frontend/
│── database/
│── tests/
│── .github/workflows/
│── package.json
│── README.md
```

---

## Future Enhancements

- Integration of online payment gateways  
- Mobile application development  
- Real-time notifications  
- Advanced analytics and dashboards  
- Enhanced security features  

---

## Contributors

- Sami  
- Mustafa  
- Ahmer  
- Naveed  

---

## License

This project is developed for academic purposes as part of a Final Year Project.
