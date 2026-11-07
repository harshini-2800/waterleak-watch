# 💧 WaterLeak Watch

> **Community Water Leak Reporting & Resolution Tracking Platform**  
> *A production-grade MERN platform featuring automated proximity incident clustering and strict time-to-resolution SLA engines.*

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-2dsphere-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/R3F-3D%20Hero-black?logo=three.js)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📸 Key Application Screenshots

| 3D Hero & Live Incident Telemetry | Interactive Leak Map & Clusters |
| :---: | :---: |
| ![Home Page](./screenshots/home.png) | ![Interactive Map](./screenshots/map.png) |

| 6-Step Multi-Step Citizen Reporting Wizard | Resolution Analytics & SLA Trends |
| :---: | :---: |
| ![Report Wizard](./screenshots/report.png) | ![Analytics](./screenshots/analytics.png) |

| Public Tracking & Timeline Journey | Before / After Photo Inspection |
| :---: | :---: |
| ![Public Tracker](./screenshots/track.png) | ![Incident Detail](./screenshots/incident-detail.png) |

---

## 🌟 Key Algorithmic Differentiators

### 1. Repeated-Report Detection & Spatial Clustering (`$geoNear`)
* **The Problem**: When a major water pipe bursts, dozens of citizens independently file separate reports for the exact same corner, overwhelming dispatchers with duplicate jobs.
* **The Solution**: Every submission triggers an indexed MongoDB `2dsphere` query within a 50-meter radius (`$geoNear`). If an active incident is detected, citizens receive an immediate **"Similar active leak nearby"** alert and can join the cluster.
* **Dynamic Escalation**: Each additional report increments the cluster count, escalates severity to the highest observed severity, re-calculates the incident priority score (`(severity * 10) + (reports * 5) + (upvotes * 3) + age`), and notifies assigned repair teams in real-time via Socket.io.

### 2. Time-to-Resolution & Enforced SLA Engine
* **Strict Finite State Machine**: Statuses transition unidirectionally through `Reported` ➔ `Verified` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`. Invalid shortcut jumps (e.g. `reported` directly to `resolved`) are strictly blocked server-side with HTTP 400.
* **Severity-Based Deadlines**:
  * 🔴 **Critical Burst**: 24 Hours SLA
  * 🟠 **High Severity**: 48 Hours SLA
  * 🟡 **Medium Leak**: 5 Days (120 Hours) SLA
  * 🟢 **Low / Hydrant**: 10 Days (240 Hours) SLA
* **Live SLA Badges**: Dynamically flags incidents as `On Track` (Cyan), `At Risk` (Amber, within final 25% of window), or `Breached` (Red pulsating glow) with real-time countdown tickers.
* **Interactive Before/After Slider**: When repair crews complete a job, they snap and upload an "After" resolution photo, allowing citizens and admins to wipe between the original burst and the repaired pipe.

---

## 🏗️ Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        UI["Tailwind CSS + Glassmorphism UI"]
        Hero3D["React Three Fiber (3D Liquid Droplet)"]
        Wizard["6-Step Report Wizard + Draft Autosave"]
        LeafletMap["Leaflet + OpenStreetMap (Heatmap)"]
        Slider["Before / After Photo Slider"]
        SocketC["Socket.io Client Listener"]
    end

    subgraph Server["Backend REST API (Node.js + Express)"]
        AuthMiddleware["JWT Auth + httpOnly Cookies"]
        RateLimit["Rate Limiting & Helmet"]
        UploadHandler["Multer + Sharp EXIF Stripper"]
        ProximityService["Spatial Cluster Engine ($geoNear 50m)"]
        SlaEngine["SLA & Finite State Transition Engine"]
        SocketS["Socket.io Server Broadcast"]
    end

    subgraph Data["Database Layer"]
        MongoLocal["MongoDB / In-Memory Fallback"]
        SphereIdx["2dsphere Geospatial Index"]
    end

    UI --> AuthMiddleware
    Wizard --> ProximityService
    Wizard --> UploadHandler
    ProximityService --> SphereIdx
    SphereIdx --> MongoLocal
    SlaEngine --> MongoLocal
    SlaEngine --> SocketS
    SocketS -. Real-time updates .-> SocketC
```

---

## 🗄️ Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ REPORT : submits
    USER ||--o{ INCIDENT : "assigned as crew"
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : triggers
    INCIDENT ||--|{ REPORT : clusters
    INCIDENT ||--o{ TIMELINE_EVENT : logs
    INCIDENT ||--o{ UPVOTE : collects

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        string role "citizen | crew | admin"
        string assignedWard
        boolean isActive
    }

    INCIDENT {
        ObjectId _id PK
        string incidentNumber UK
        string title
        Point location "2dsphere"
        string area
        string severity "low | medium | high | critical"
        string status "reported | verified | assigned | in_progress | resolved"
        int reportCount
        int priorityScore
        ObjectId assignedCrew FK
        date deadline
        string slaState "on_track | at_risk | breached"
        int totalResolutionMinutes
    }

    REPORT {
        ObjectId _id PK
        string trackingId UK
        ObjectId incidentId FK
        Point location "2dsphere"
        string severity
        string leakType
        string description
        array photos
        string deviceFingerprint
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipient FK
        string title
        string message
        string type
        boolean isRead
    }

    AUDIT_LOG {
        ObjectId _id PK
        string action
        ObjectId performedBy FK
        string targetEntity
        ObjectId targetId
        object details
    }
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js v18+ (tested on Node v20 & v24)
- npm v9+

> **Zero-Config Database**: The backend includes an automatic **in-memory MongoDB fallback** (`mongodb-memory-server`). If you do not have a local MongoDB instance running, the platform seamlessly boots an in-memory database and auto-seeds it on the very first start!

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/waterleak-watch.git
cd waterleak-watch

# Install root, server, and client dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Environment Configuration
Copy `.env.example` files:
```bash
# Server env
cp server/.env.example server/.env

# Client env
cp client/.env.example client/.env
```

### 3. Database Seeding
To populate the database with **127 realistic reports across 35 incident clusters** (with SLA timelines and sample photos):
```bash
npm run seed
```

### 4. Running the Application
Run both backend API (`:5000`) and frontend Vite client (`:5173`) concurrently:
```bash
npm run dev
```

Open your browser to:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions & Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@waterleakwatch.org` | `AdminPass123!` | Full control: assign jobs to crew, merge duplicate clusters, export CSV, view audit logs. |
| **Repair Crew** | `crew@waterleakwatch.org` | `CrewPass123!` | Mobile work queue: Google Maps navigation, advance status to In Progress / Resolved, upload after photos. |
| **Repair Crew 2** | `crew2@waterleakwatch.org` | `CrewPass123!` | Second field team covering Ward 2. |
| **Citizen** | `citizen@waterleakwatch.org` | `CitizenPass123!` | Submit reports, view personal activity dashboard, confirm repeat leaks. |

*(Anonymous reporting without login is also fully supported!)*

---

## 🧪 Automated Testing

### Backend Unit & Integration Tests (Jest + Supertest)
Covers authentication, report creation, `$geoNear` 50m proximity clustering, and finite state transition enforcement:
```bash
npm run test:server
```

### Frontend Component Tests (Vitest + Testing Library)
Covers SLA badge states, countdown formatting, and visual components:
```bash
npm run test:client
```

---

## 🐳 Docker Containerization

Run the entire stack (MongoDB container, Express REST API, and Nginx-powered React client) with Docker Compose:
```bash
docker-compose up --build
```
- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- MongoDB: `localhost:27017`

---

## 🔮 Future Improvements
1. **Satellite AI Verification**: Integrate Copernicus / Sentinel-2 multispectral imagery to detect standing surface water puddles automatically.
2. **Citizen SMS Alerts via Twilio**: Send automated SMS dispatch updates to citizens who filed without an email.
3. **Smart Meter (AMI) Ingestion**: Ingest telemetry from municipal smart water meters to detect nocturnal pressure drops.
4. **Offline Mobile Queue**: Background sync queue for PWA workers in underground basements with poor cellular signal.

