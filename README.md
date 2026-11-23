# CampusEvents (clg-events)

> A modern, full-stack, Devfolio-style College Event Management Platform designed to streamline event discovery, registrations, ticket generation, QR code attendance tracking, and administrative review with real-time push notifications.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Environment Configuration](#-environment-configuration)
  - [Backend Environment Variables](#backend-env-backendenv)
  - [Frontend Environment Variables](#frontend-env-frontendenv)
- [Local Development Setup](#-local-development-setup)
  - [1. Backend Setup (Spring Boot)](#1-backend-setup-spring-boot)
  - [2. Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
- [Docker Setup & Commands](#-docker-setup--commands)
  - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
  - [Method 2: Standalone Docker Commands](#method-2-standalone-docker-commands)
    - [Running the Backend Container](#running-the-backend-container)
    - [Running the Frontend Container](#running-the-frontend-container)
    - [Connecting Containers via a Docker Bridge Network](#connecting-containers-via-a-docker-bridge-network)
  - [Helpful Docker Commands](#helpful-docker-commands)
- [Deploying Backend to Render](#-deploying-backend-to-render)
  - [Render Settings Checklist](#render-settings-checklist)
  - [Environment Variables to Set in Render](#environment-variables-to-set-in-render)
- [API Documentation & Endpoints](#-api-documentation--endpoints)
  - [Interactive Swagger UI](#interactive-swagger-ui)
  - [Key API Endpoints](#key-api-endpoints)
- [Database & Migrations](#-database--migrations)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Overview

**CampusEvents** bridges the gap between campus event organizers and attendees. It provides a seamless portal for students to discover upcoming hackathons, workshops, and fests, register with a single click, and receive digital tickets equipped with unique QR codes. Organizers get a dashboard with live metrics and an in-app QR code scanner for check-ins, while Super Admins can moderate submissions to maintain event quality.

---

## ✨ Key Features

- **🎓 Attendee / Student Experience**:
  - Discover approved campus events with keyword search, categories, and date filters.
  - One-click registration for hackathons, workshops, conferences, and competitions.
  - Digital ticket generation with embedded QR codes and one-click PDF export (`html2pdf.js`).
  - View ticket history and registration status in **My Tickets**.

- **🛠️ Organizer Dashboard**:
  - Create and submit new events with rich metadata, registration limits, venue, and deadlines.
  - Manage existing events, monitor real-time registration counts, and check capacity.
  - Integrated in-browser QR Code Scanner (`html5-qrcode`) for fast ticket verification and attendance tracking.

- **👑 Super Admin Review**:
  - Dedicated admin portal for reviewing pending event submissions.
  - Approve or reject events with instant status updates and organizer notification.

- **⚡ Real-Time Notifications**:
  - WebSocket messaging via STOMP / SockJS for instant toast notifications when events are approved, registrations are confirmed, or attendance is marked.
  - Automatic polling fallback if the WebSocket connection is interrupted.

- **🔐 Robust Authentication & Security**:
  - Powered by **Neon Auth (Managed Better Auth)** with OAuth2 Resource Server integration.
  - Asymmetric cryptographic JWT verification via **EdDSA (Ed25519)** using **Google Tink** and **BouncyCastle** in Spring Boot.
  - Role-based authorization across Student, Organizer, and Super Admin roles.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with Vite 6
- **Styling**: Tailwind CSS, PostCSS, Framer Motion
- **State Management**: Zustand
- **Routing**: React Router DOM (v6)
- **Authentication**: `@better-auth/react` with `jwtClient` plugin
- **HTTP Client**: Axios with Bearer token interceptor
- **Real-Time Communication**: `@stomp/stompjs` & `sockjs-client`
- **QR & Export Utilities**: `qrcode.react`, `html5-qrcode`, `html2pdf.js`

### Backend
- **Framework**: Spring Boot 4.1.1 (Java 21)
- **Security**: Spring Security 6, OAuth2 Resource Server, Nimbus JOSE+JWT
- **Cryptography**: Google Tink & BouncyCastle for EdDSA / Ed25519 token validation
- **Persistence**: Spring Data JPA (Hibernate)
- **Database Migrations**: Flyway (Flyway Core & PostgreSQL extension)
- **Messaging**: Spring WebSocket (STOMP Broker)
- **API Documentation**: Springdoc OpenAPI / Swagger UI

### Infrastructure & Database
- **Primary Database**: Neon PostgreSQL (Serverless Postgres) or local PostgreSQL instance
- **Containerization**: Multi-stage Dockerfiles (`eclipse-temurin:21` and `node:20-alpine` + `nginx:alpine`), Docker Compose

---

## 📁 Project Directory Structure

```text
clg_events/
├── backend/
│   ├── .mvn/                        # Maven wrapper configuration
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/dasarath/clg_events_backend/
│   │   │   │   ├── config/          # CORS, WebSocket, Security configurations
│   │   │   │   ├── controller/      # REST API Controllers (Events, Admin, Attendance, etc.)
│   │   │   │   ├── dto/             # Data Transfer Objects (Requests & Responses)
│   │   │   │   ├── entity/          # JPA Entities (Event, User, Registration, etc.)
│   │   │   │   ├── enums/           # EventStatus, Role, TicketStatus enums
│   │   │   │   ├── exception/       # Global exception handling & custom errors
│   │   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   │   ├── security/        # NeonJwtDecoder, SecurityUtils, Auth filters
│   │   │   │   └── service/         # Business logic layer
│   │   │   └── resources/
│   │   │       ├── db/migration/    # Flyway SQL migration scripts (V1 - V4)
│   │   │       └── application.yaml # Spring Boot configuration
│   ├── .env.example                 # Backend environment variable template
│   ├── Dockerfile                   # Multi-stage Java 21 build Dockerfile
│   └── pom.xml                      # Maven project descriptor
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Images and graphics
│   │   ├── components/              # Shared UI components (Modals, Nav, Layout)
│   │   ├── pages/                   # Views (Home, Events, Dashboard, Tickets, Attendance)
│   │   ├── services/                # Axios API instance, authService, websocket
│   │   ├── store/                   # Zustand stores (auth, events, notifications)
│   │   ├── App.jsx                  # Main application routes and auth listener
│   │   └── main.jsx                 # Application entrypoint
│   ├── .env.example                 # Frontend environment variable template
│   ├── Dockerfile                   # Multi-stage React + Nginx build Dockerfile
│   ├── nginx.conf                   # Nginx reverse proxy & SPA configuration
│   ├── package.json                 # Node.js dependencies and scripts
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── vite.config.js               # Vite bundler configuration
├── docker-compose.yml               # Multi-container orchestration
└── README.md                        # Project documentation
```

---

## ⚙️ Prerequisites

Before getting started, make sure you have the following installed on your machine:

- **Java Development Kit (JDK)**: Version 21 or higher ([Eclipse Temurin Recommended](https://adoptium.net/))
- **Node.js**: Version 18.x or 20.x ([Node.js Official Site](https://nodejs.org/))
- **Package Manager**: `npm` (comes with Node.js) or `pnpm` / `yarn`
- **Docker & Docker Compose**: Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Linux)
- **Database**: A [Neon](https://neon.tech/) PostgreSQL cloud database (or local PostgreSQL 15+)

---

## 🔐 Environment Configuration

### Backend Environment (`backend/.env`)

1. Copy the example file:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Update the values with your actual database and authentication credentials:

```env
# 1. Neon PostgreSQL Database Credentials
DATABASE_URL=jdbc:postgresql://<your-neon-host>.neon.tech/<dbname>?sslmode=require
DATABASE_USERNAME=<your_database_user>
DATABASE_PASSWORD=<your_database_password>

# 2. Neon Auth (Managed Better Auth) Base URL
# Found in Neon Console -> Project -> Auth
NEON_AUTH_BASE_URL=https://<your-neon-auth-host>.neon.tech/neondb/auth

# 3. Super Admin Email (Granted full admin rights across all events)
SUPER_ADMIN_EMAIL=your_email@example.com

# 4. Server Port & CORS
PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
```

### Frontend Environment (`frontend/.env`)

1. Copy the example file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. Set the API and auth endpoints:

```env
# Backend REST API endpoint
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Backend WebSocket STOMP endpoint
VITE_WS_BASE_URL=http://localhost:8080/ws-events

# Neon Auth Base URL (must match the backend provider URL)
VITE_NEON_AUTH_URL=https://<your-neon-auth-host>.neon.tech/neondb/auth

# Super Admin email for client-side role matching
VITE_SUPER_ADMIN_EMAIL=your_email@example.com
```

---

## 💻 Local Development Setup

### 1. Backend Setup (Spring Boot)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Ensure you have created the `.env` file from `.env.example` as described above.
3. Build the application and download all dependencies:
   - On **Linux / macOS**:
     ```bash
     ./mvnw clean install -DskipTests
     ```
   - On **Windows (PowerShell / CMD)**:
     ```powershell
     .\mvnw.cmd clean install -DskipTests
     ```
4. Run the Spring Boot application:
   - On **Linux / macOS**:
     ```bash
     ./mvnw spring-boot:run
     ```
   - On **Windows**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
5. Verify the backend is running by opening:
   - Health check: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
   - Swagger documentation: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### 2. Frontend Setup (React + Vite)

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Ensure you have created the `.env` file from `.env.example`.
3. Install project dependencies:
   ```bash
   npm install
   ```
4. Start the Vite local development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   - Local UI: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Setup & Commands

You can run the entire platform with **Docker Compose** or run backend and frontend containers individually.

### Method 1: Docker Compose (Recommended)

Docker Compose starts both the Spring Boot backend and the React Nginx frontend in coordinated bridge containers.

1. Ensure `backend/.env` is configured with your database and auth credentials.
2. From the root directory (`clg_events`), build images and spin up the containers:
   ```bash
   docker compose up --build -d
   ```
3. Check the status of running containers:
   ```bash
   docker compose ps
   ```
4. Follow container logs:
   ```bash
   # Follow all services
   docker compose logs -f

   # Follow backend logs only
   docker compose logs -f backend

   # Follow frontend logs only
   docker compose logs -f frontend
   ```
5. Access the applications:
   - **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8080](http://localhost:8080)
   - **Swagger Docs**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
6. Stop and remove containers:
   ```bash
   docker compose down
   ```

---

### Method 2: Standalone Docker Commands

If you prefer building and running each container manually:

#### Connecting Containers via a Docker Bridge Network

Create a shared network so containers can resolve each other by container name:
```bash
docker network create clg-network
```

#### Running the Backend Container

1. Build the backend Docker image:
   ```bash
   docker build -t clg-events-backend ./backend
   ```
2. Run the backend container:
   ```bash
   docker run -d \
     --name clg-events-backend \
     --network clg-network \
     -p 8080:8080 \
     --env-file ./backend/.env \
     clg-events-backend
   ```
3. Test backend health:
   ```bash
   curl http://localhost:8080/api/v1/health
   ```

#### Running the Frontend Container

1. Build the frontend Docker image (pass build arguments if custom endpoints are needed):
   ```bash
   docker build -t clg-events-frontend \
     --build-arg VITE_API_BASE_URL=http://localhost:8080/api/v1 \
     --build-arg VITE_WS_BASE_URL=http://localhost:8080/ws-events \
     ./frontend
   ```
2. Run the frontend container:
   ```bash
   docker run -d \
     --name clg-events-frontend \
     --network clg-network \
     -p 5173:80 \
     clg-events-frontend
   ```
3. Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

### Helpful Docker Commands

| Action | Command |
| :--- | :--- |
| **Stop all containers** | `docker compose stop` |
| **Restart backend service** | `docker compose restart backend` |
| **Rebuild without cache** | `docker compose build --no-cache` |
| **Inspect container shell** | `docker exec -it clg-events-backend sh` |
| **View container resource usage** | `docker stats` |
| **Clean unused images and volumes** | `docker system prune -f` |

---

## 🚀 Deploying Backend to Render

This backend is containerized and ready for 1-click or manual deployment on [Render](https://render.com) as a **Web Service**.

### Render Settings Checklist

When creating a new **Web Service** on Render from your Git repository:

| Setting | Value | Why it matters |
| :--- | :--- | :--- |
| **Name** | `clg-events-backend` | Your service name (will get `https://<name>.onrender.com`) |
| **Language / Runtime** | `Docker` | Render builds using your `backend/Dockerfile` |
| **Root Directory** | `backend` | **CRITICAL**: Monorepo subfolder. Points Render directly to `backend` |
| **Dockerfile Path** | `Dockerfile` | Relative to the `backend` Root Directory |
| **Docker Context** | `.` | Relative to `backend` |
| **Instance Type** | Free or Starter | Free gives 512 MB RAM (the Dockerfile is tuned with `-XX:MaxRAMPercentage=75.0` to avoid OOM) |
| **Health Check Path** | `/api/v1/health` | Render pings this before switching live traffic |

> [!TIP]
> Alternatively, you can use the included `render.yaml` Blueprint by navigating to **Blueprints > New Blueprint Instance** in the Render console.

### Environment Variables to Set in Render

In Render Dashboard under **Environment > Environment Variables**, add the following keys:

| Environment Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | `jdbc:postgresql://<neon-host>:5432/neondb?sslmode=require`<br>*(Must begin with `jdbc:postgresql://`)* |
| `DATABASE_USERNAME` | **Yes** | `neondb_owner` |
| `DATABASE_PASSWORD` | **Yes** | `<your-database-password>` |
| `NEON_AUTH_BASE_URL` | **Yes** | `https://<your-neon-auth-host>.neon.tech/neondb/auth`<br>*(Used by `NeonJwtDecoder` for JWKS public key verification)* |
| `SUPER_ADMIN_EMAIL` | **Yes** | `your_email@example.com` |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://your-frontend.vercel.app,http://localhost:5173`<br>*(Comma-separated. NO trailing slashes, NO wildcards `*`)* |

*(Note: `PORT` is automatically provided by Render at runtime; Spring Boot binds to it dynamically).*

---

## 📖 API Documentation & Endpoints

### Interactive Swagger UI
When the backend is running, complete interactive OpenAPI documentation is accessible at:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Key API Endpoints

| Category | HTTP Method | Endpoint | Description | Access |
| :--- | :---: | :--- | :--- | :--- |
| **Health** | `GET` | `/api/v1/health` | Service status, version, and endpoints overview | Public |
| **Events** | `GET` | `/api/v1/events` | Browse approved events with pagination & filtering | Public |
| **Events** | `GET` | `/api/v1/events/{id}` | Get event details by UUID | Public |
| **Events** | `POST` | `/api/v1/events` | Create a new event draft / submission | Authenticated |
| **Events** | `PUT` | `/api/v1/events/{id}` | Update event details | Organizer / Admin |
| **Events** | `DELETE`| `/api/v1/events/{id}` | Cancel/delete an event | Organizer / Admin |
| **Registrations** | `POST` | `/api/v1/registrations` | Register for an event & issue ticket | Authenticated |
| **Registrations** | `GET` | `/api/v1/registrations/my` | Retrieve logged-in user's tickets | Authenticated |
| **Registrations** | `DELETE`| `/api/v1/registrations/{id}`| Cancel an active registration | Authenticated |
| **Attendance** | `POST` | `/api/v1/attendance/mark` | Verify & check-in attendee via QR ticket hash | Organizer / Admin |
| **Attendance** | `GET` | `/api/v1/attendance/{eventId}` | Get live attendance list for an event | Organizer / Admin |
| **Admin** | `GET` | `/api/v1/admin/events/pending` | Fetch events waiting for review | Super Admin |
| **Admin** | `POST` | `/api/v1/admin/events/{id}/approve` | Approve event for public display | Super Admin |
| **Admin** | `POST` | `/api/v1/admin/events/{id}/reject` | Reject event with feedback note | Super Admin |
| **Notifications** | `GET` | `/api/v1/notifications` | Fetch unread notifications | Authenticated |
| **WebSocket** | `WS` | `/ws-events` | STOMP endpoint for real-time notification pushes | Authenticated |

---

## 🗄️ Database & Migrations

Database schema versioning is managed through **Flyway**. When the backend starts up, Flyway scans `src/main/resources/db/migration/` and automatically applies pending migration scripts:

- `V1__initial_schema.sql`: Creates core tables (`users`, `events`, `registrations`, `attendance`, `notifications`) and indexes.
- `V2__seed_initial_data.sql`: Seeds default event categories and initial demo entries.
- `V3__cascade_user_foreign_keys.sql`: Adds cascading deletion policies for user reference integrity.
- `V4__fix_super_admin_user_id.sql`: Harmonizes Neon Auth user UUID formatting and ensures super admin user record consistency.

> [!NOTE]
> When using Neon PostgreSQL, ensure the connection string has `sslmode=require` appended to the URL (e.g., `jdbc:postgresql://<host>/neondb?sslmode=require`).

---

## ❓ Troubleshooting & FAQs

### 1. `Ed25519 / EdDSA signature verification failed`
- **Cause**: Neon Auth uses the modern EdDSA (Ed25519) asymmetric signing algorithm. Standard Nimbus setups fail without specialized providers.
- **Solution**: The backend includes **Google Tink** and **BouncyCastle** providers configured inside `NeonJwtDecoder.java`. Ensure `NEON_AUTH_BASE_URL` in `backend/.env` points to your active Neon Auth instance so the JWKS public keys can be fetched.

### 2. CORS Errors in the Browser
- **Cause**: The frontend origin is not present in `CORS_ALLOWED_ORIGINS`.
- **Solution**: In `backend/.env`, set:
  ```env
  CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
  ```
  Restart the backend after updating.

### 3. Flyway Migration Checksum Mismatch
- **Cause**: Modifying a migration script after it has already run on the database.
- **Solution**: If using a local or test database, drop and recreate the schema, or run:
  ```bash
  ./mvnw flyway:repair
  ```

### 4. Port Conflict on `8080` or `5173`
- If port `8080` or `5173` is occupied by another process:
  - Backend: Change `PORT=8081` in `backend/.env` and adjust `VITE_API_BASE_URL` in `frontend/.env`.
  - Frontend: Change Vite port using `npm run dev -- --port 5174` or update port mappings in `docker-compose.yml`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
