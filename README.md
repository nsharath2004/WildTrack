# WildTrack – Wildlife Conservation and Management System
**PES University – 5th Semester B.Tech CSE | Database Management Systems Mini-Project**

---

## 📌 Project Overview
**WildTrack** is an enterprise-grade full-stack wildlife conservation information architecture designed for India's national parks, wildlife sanctuaries, and tiger reserves.

The system addresses ecological conservation challenges by centralizing:
- Species taxonomy and IUCN Red List classification
- Individual animal biometric registration and telemetry RFID tagging
- Protected area demarcation and biome zoning
- GPS wildlife sightings and behavioral tracking
- Threat monitoring with automated database triggers
- Investigation incident dossiers and resolution workflows
- Veterinary surgical, medical, and clinical logs
- Conservation programs, funding sources, and budgets
- Citizen science volunteer assignments
- Natural language ChromaDB vector semantic search for SOPs and guidelines

---

## 🛠 Technology Stack
- **Database:** MySQL 8.0 (12 domain tables + 2 audit tables in 3rd Normal Form)
- **Vector Database:** ChromaDB (Dense semantic vector embeddings & cosine similarity)
- **Backend:** Python Flask (14 Blueprint REST APIs, JWT authentication, RBAC)
- **Frontend (Primary):** Next.js 14, TypeScript, Tailwind CSS, Lucide React (15 pages)
- **Frontend (Standalone Distribution):** HTML5, React 18, Bootstrap 5, Chart.js (Direct double-click browser launch)
- **Security:** Cryptographic `scrypt` password hashing + HMAC-SHA256 JWT tokens

---

## 👥 Role-Based Access Control (RBAC)
The system enforces strict role-based authorization across backend middleware decorators (`@token_required`, `@roles_required`) and frontend navigation:

| Role | Default Username | Default Password | Permissions & System Scope |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full administrative control, user provisioning, database audits |
| **Researcher** | `researcher` | `research123` | Wildlife telemetry observations, scientific research projects, field studies |
| **Forest Officer**| `officer` | `officer123` | Threat logging, incident dispatch, veterinary records, patrol rosters |

---

## 🚀 Quick Start Guide

### 1. Database Setup
1. Open MySQL Workbench or terminal:
   ```bash
   mysql -u root -p
   ```
2. Run the database scripts in order:
   ```sql
   source database/schema.sql;
   source database/sample_data.sql;
   source database/views.sql;
   source database/procedures.sql;
   source database/triggers.sql;
   ```

### 2. Backend Configuration & Startup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Verify credentials in `.env`:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=Mysql@123
   MYSQL_DATABASE=wildlife_management
   MYSQL_PORT=3306
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
   *Server starts at `http://127.0.0.1:5000` with 14 registered REST blueprints.*

### 3. Frontend Startup

#### Option A: Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option B: Instant Standalone Frontend (No Node installation needed)
Double-click `frontend/index.html` in file explorer or open directly in Microsoft Edge / Chrome.

---

## 🧪 Running Automated Tests
Execute the integration test suite:
```bash
python tests/test_api.py
```
This automatically verifies:
- Health checks
- 401 Unauthorized blocking
- JWT creation and validation
- 403 Forbidden role restrictions
- ChromaDB vector search with cosine similarity scoring
- Vector document retrieval

---

## 📑 Academic Documentation & Diagrams
All evaluation assets are generated in `docs/`:
- **ER Diagram:** `docs/ER_Diagram.png`
- **Relational Schema:** `docs/Relational_Schema.png`
- **Project Report (PDF):** `docs/Project_Report.pdf`
- **Project Report (Word):** `docs/Project_Report.docx`
- **Advanced SQL Queries:** `database/dbms_queries.sql`
