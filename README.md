# 📊 FocusLedger

> An open-source, containerized FinOps cloud cost reconciliation and analytics platform engineered to validate, quarantine, and aggregate cloud billing data without crashing.

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![DuckDB](https://img.shields.io/badge/Database-DuckDB-FFF000.svg?style=flat-square&logo=duckdb&logoColor=black)
![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-2496ED.svg?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF.svg?style=flat-square&logo=github-actions&logoColor=white)

---

## 🎯 Overview

**FocusLedger** solves a critical data engineering problem in Cloud FinOps: corrupted billing reports crashing financial pipelines. By leveraging a strict Python validation engine, it intercepts cloud billing CSVs, mathematical reconciles expected totals, and surgically isolates malformed rows (e.g., bad dates or string-to-float errors) into a quarantine state. Valid data is instantly aggregated in an embedded DuckDB warehouse and visualized via a React dashboard, ensuring the analytical pipeline remains bulletproof and 100% operational. 

---

## 💻 Development Environment

This project was natively engineered and tested in the following environment:

- **Operating System:** Arch Linux (Wayland / Hyprland)
- **Terminal Environment:** `sunraku` (ZSH / Foot)
- **Core Languages:** Python 3.14, Node.js 26
- **Package Management:** `uv` (Backend), `npm` (Frontend)
- **Theme Palette:** Custom Deep Black (`#050505`) with Bright Red Accent (`#B21318`)

---

## 🚀 Installation & Execution

FocusLedger is built as a cloud-native monorepo and can be executed via Docker or spun up locally for active development.

### Production Execution (Docker Orchestration)

The entire full-stack architecture is containerized. To spin it up instantly:

```bash
git clone [https://github.com/Braveen811/focus-ledger.git](https://github.com/Braveen811/focus-ledger.git)
cd focus-ledger

# Build and start the backend (FastAPI) and frontend (Nginx) containers
docker compose up --build

```

* **Frontend Dashboard:** `http://localhost:8080`
* **Backend API & Swagger Docs:** `http://localhost:8001/docs`

### Local Development Setup

If you want to modify the source code natively:

**1. Start the Backend:**

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8001

```

**2. Start the Frontend:**

```bash
cd frontend
npm install
npm run dev

```

---

## 🚀 Running with Docker (Production Mode)

To run the full stack (FastAPI backend, DuckDB persistent store, and Nginx-served React frontend) using Docker containers:

1. **Clone the repository:**
```bash
git clone [https://github.com/braveen-r/focus-ledger.git](https://github.com/braveen-r/focus-ledger.git)
cd focus-ledger

```

2. **Build and start the services using Docker Compose:**
```bash
docker compose up -d --build

```


3. **If updating or rebuilding just the frontend with Tailwind v4 PostCSS integration:**
```bash
docker compose build --no-cache frontend
docker compose up -d frontend

```


4. **Access the application:**
* Frontend UI: `http://localhost:8080`
* FastAPI Backend API & Docs: `http://localhost:8001/docs`

---

## 🏗️ System Architecture

```text
[ Cloud Billing CSV ] ──────┐
                            ▼
                    [ FastAPI Endpoint ]
                            │
                            ▼
                  [ Pandera Validation Engine ]
                     /                     \
             (Valid Rows)             (Corrupted Rows)
                   │                         │
                   ▼                         ▼
   [ DuckDB (focusledger.duckdb) ]     [ Quarantine State ]
                   │                         │
                   └───────────┬─────────────┘
                               ▼
            [ React + Tailwind + Recharts Dashboard ]

```

---

## 🛠️ Tech Stack

* **Backend API Framework:** `FastAPI` (High-performance asynchronous REST routes)
* **Validation Engine:** `Pandera` (Strict schema enforcement and data coercion)
* **Data Warehouse:** `DuckDB` (Embedded, high-speed analytical SQL queries)
* **Frontend UI & Styling:** `React`, `Vite`, `Tailwind CSS`, `Lucide React`
* **Data Visualization:** `Recharts` (Interactive donut charts for service costs)
* **Infrastructure & CI/CD:** `Docker`, `Docker Compose`, `GitHub Actions`

---

## 📂 Project Structure

```text
focus-ledger/
├── backend/
│   ├── main.py              # FastAPI application, routes, and DuckDB logic
│   ├── validator.py         # Pandera schema rules and quarantine engine
│   ├── focusledger.duckdb   # Persistent embedded database file
│   ├── Dockerfile           # Python 3.12 slim container setup
│   └── pyproject.toml       # uv dependency management
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React dashboard layout and Axios API calls
│   │   └── index.css        # Tailwind global overrides
│   ├── tailwind.config.js   # Custom #B21318 theme configuration
│   ├── Dockerfile           # Multi-stage Node.js build to Nginx serving
│   └── package.json
├── data/samples/            # Synthetic good and corrupted CSV bills for testing
├── .github/workflows/ci.yml # Automated CI pipeline verifying Docker builds
└── docker-compose.yml       # Network orchestration for full-stack deployment

```

---

## 🚀 Key Features

* **Bulletproof Quarantine System:** When bad data hits the API (e.g., passing `"abc"` as a cost), the system surgically removes the bad rows, forces standard type coercion on the good rows, and processes the file without throwing HTTP 500 crashes.
* **Rule-Based Anomaly Detection:** Utilizes DuckDB SQL execution to actively flag suspicious spending (e.g., individual records exceeding ₹7,000) and displays them in a dedicated warning panel.
* **Automated CI/CD Pipeline:** A GitHub Actions workflow automatically verifies that the Docker images compile successfully on every push or pull request to the `main` branch.
* **Zero-Cost Architecture:** Designed specifically using free, open-source tooling, requiring zero AWS/GCP infrastructure or credit card registrations.

---

## ⚙️ Custom Tweaks & Architecture Decisions

* **State Isolation via Database Reset:** During testing, the DuckDB instance appended every uploaded CSV, causing anomaly logs to bleed across tests. I refactored the backend to execute a `DELETE FROM` wipe prior to insertion, ensuring the React dashboard displays a perfectly isolated, idempotent state per upload.
* **Persistent Storage Migration:** Shifted DuckDB from an in-memory (`:memory:`) configuration to a persistent `.duckdb` volume file mapped through `docker-compose.yml`, ensuring data survives container restarts.
* **Custom UI Theming:** Overrode standard Vite boilerplate to implement a professional dark mode (`#050505` background) utilizing a signature Bright Red (`#B21318`) primary accent for a distinct portfolio aesthetic.

---

## 🛠️ System Tweaks & Troubleshooting

* **`[Errno 98] Address already in use`:** If FastAPI fails to start on port 8000/8001 on Linux, force-kill the hanging process using `fuser -k 8001/tcp`.
* **Missing Frontend Dependencies:** If Vite throws `Failed to resolve import "axios"` or `"recharts"`, run `npm install axios recharts` directly inside the `frontend/` directory to sync `node_modules`.

---

**Author:** [Braveen R](https://braveenr.linklee.in/)

*Targeting entry-level Cloud Analytics, Site Reliability Engineering, and DevOps roles.*

---

## ✌️ Wrapping Up

FocusLedger demonstrates that robust software engineering isn't just about making things work when the data is perfect—it's about building resilient systems that handle chaos gracefully. Deploy, upload, and reconcile with confidence! 🚀

See you in the terminal!
