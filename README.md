# 📊 FocusLedger

> An open-source, containerized FinOps cloud cost reconciliation and analytics platform engineered to validate, quarantine, and aggregate cloud billing data without crashing.

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![DuckDB](https://img.shields.io/badge/Database-DuckDB-FFF000.svg?style=flat-square&logo=duckdb&logoColor=black)
![Pytest](https://img.shields.io/badge/Tests-Pytest-0A9EDC.svg?style=flat-square&logo=pytest&logoColor=white)
![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-2496ED.svg?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF.svg?style=flat-square&logo=github-actions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)

---

## 🎯 Overview

**FocusLedger** solves a critical data engineering problem in Cloud FinOps: corrupted billing reports crashing financial pipelines. By leveraging a strict Python validation engine, it intercepts cloud billing CSVs, mathematically reconciles expected totals using `Decimal` arithmetic, and surgically isolates malformed rows (e.g., bad dates or string-to-float errors) into a quarantine state. Valid data is instantly aggregated in an embedded DuckDB warehouse and visualized via a React dashboard, ensuring the analytical pipeline remains bulletproof and 100% operational.

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

**3. Run the Automated Test Suite (`pytest`):**

```bash
cd backend
uv run python -m pytest -v

```

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
          [ Core Reconciliation & Anomaly Engine ]
                               │
                               ▼
        [ React + Tailwind + Recharts + JSON Export ]

```

---

## 🛠️ Tech Stack

* **Backend API Framework:** `FastAPI` (High-performance asynchronous REST routes)
* **Validation Engine:** `Pandera` (Strict schema enforcement and data coercion)
* **Data Warehouse:** `DuckDB` (Embedded, high-speed analytical SQL queries)
* **Testing:** `Pytest`, `HTTPX` (Golden-dataset unit and API verification)
* **Frontend UI & Styling:** `React`, `Vite`, `Tailwind CSS`, `Lucide React`
* **Data Visualization:** `Recharts` (Interactive donut charts for service costs)
* **Infrastructure & CI/CD:** `Docker`, `Docker Compose`, `GitHub Actions`

---

## !Preview
<img width="1884" height="900" alt="image" src="https://github.com/user-attachments/assets/83db378b-a5c1-44c0-ae03-64faf11f746f" />

---

## 📂 Project Structure

```text
focus-ledger/
├── backend/
│   ├── core/
│   │   └── engine.py        # Decimal reconciliation math and dynamic anomaly logic
│   ├── tests/
│   │   └── test_core.py     # Golden-dataset automated Pytest suite
│   ├── main.py              # FastAPI application, routes, and DuckDB integration
│   ├── validator.py         # Pandera schema rules and quarantine engine
│   ├── Dockerfile           # Python 3.12 slim container setup
│   └── pyproject.toml       # uv dependency management
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React dashboard, dynamic threshold, and JSON export
│   │   └── index.css        # Tailwind global overrides
│   ├── postcss.config.js    # Tailwind v4 PostCSS configuration
│   ├── Dockerfile           # Multi-stage Node.js build to Nginx serving
│   └── package.json
├── data/samples/            # Synthetic good and corrupted CSV bills for testing
├── .github/workflows/ci.yml # Automated CI pipeline running Pytest + Docker builds
├── docker-compose.yml       # Network orchestration for full-stack deployment
└── LICENSE                  # MIT License

```

---

## 🚀 Key Features

* **Bulletproof Quarantine System:** When bad data hits the API (e.g., passing `"abc"` as a cost), the system surgically removes the bad rows, forces standard type coercion on the good rows, and processes the file without throwing HTTP 500 crashes.
* **Dynamic Rule-Based Anomaly Detection:** Utilizes DuckDB SQL execution and a configurable UI threshold (default `₹7,000`) to actively flag suspicious spending in real time inside a dedicated warning panel.
* **One-Click JSON Audit Report Export:** Compiles total calculated spend, anomaly counts, and flagged line items via `/api/v1/reports/export` into a downloadable `.json` audit file.
* **Automated CI/CD & Golden-Dataset Testing:** A GitHub Actions workflow runs the `pytest` suite against known golden billing datasets before verifying that all Docker images compile cleanly on every push or pull request to `main`.
* **Zero-Cost Architecture:** Designed specifically using free, open-source tooling, requiring zero AWS/GCP infrastructure or credit card registrations.

---

## ⚙️ Custom Tweaks & Architecture Decisions

* **State Isolation via Database Reset:** During testing, the DuckDB instance appended every uploaded CSV, causing anomaly logs to bleed across tests. I refactored the backend to execute a `DELETE FROM` wipe prior to insertion, ensuring the React dashboard displays a perfectly isolated, idempotent state per upload.
* **Persistent Storage Migration:** Shifted DuckDB from an in-memory (`:memory:`) configuration to a persistent `.duckdb` volume file (gitignored and generated at runtime), ensuring data survives container restarts without polluting Git history.
* **Custom UI Theming:** Overrode standard Vite boilerplate to implement a professional dark mode (`#050505` background) utilizing a signature Bright Red (`#B21318`) primary accent for a distinct portfolio aesthetic.

---

## 🛠️ System Tweaks & Troubleshooting

* **`[Errno 98] Address already in use`:** If FastAPI fails to start on port `8001` on Linux, force-kill the hanging process using `fuser -k 8001/tcp`.
* **`focusledger.duckdb: Is a directory`:** If Docker starts before the database file exists, it creates an empty folder. Run `docker compose down && rm -rf backend/focusledger.duckdb` before restarting.
* **Missing Frontend Dependencies:** If Vite throws `Failed to resolve import "axios"` or `"recharts"`, run `npm install` directly inside the `frontend/` directory to sync `node_modules`.

---

**Author:** [Braveen R](https://braveenr.linklee.in/)

*Targeting entry-level Cloud Analytics, Site Reliability Engineering, and DevOps roles.*

---

## ✌️ Wrapping Up

FocusLedger demonstrates that robust software engineering isn't just about making things work when the data is perfect—it's about building resilient systems that handle chaos gracefully. Deploy, upload, and reconcile with confidence! 🚀

See you in the terminal!
