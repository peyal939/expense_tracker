# Smart Expense Tracker (Backend Blueprint)

Backend-first design for an expense tracker built with **Django + Django REST Framework (DRF)** and **SQLite** (local, small-scale). Optional AI features (Ollama) are explicitly deferred and designed as an add-on.

## Quickstart (Backend + Frontend)

### 1) Create venv + install deps
From the repo root (PowerShell):
- `python -m venv .venv`
- `./.venv/Scripts/python -m pip install -U pip`
- `./.venv/Scripts/python -m pip install -r requirements.txt`

### 2) Prepare DB + roles
- `./.venv/Scripts/python manage.py migrate`
- `./.venv/Scripts/python manage.py seed_roles`
- `./.venv/Scripts/python manage.py createsuperuser`

### 3) Run backend
- `./.venv/Scripts/python manage.py runserver 8000`

### 4) Run frontend
In a second terminal:
- `cd frontend`
- `python -m http.server 5173`

### (Optional) Run both together
- `./.venv/Scripts/python manage.py run_dev`

Open:
- `http://127.0.0.1:5173/`

Login uses:
- API base: `http://127.0.0.1:8000/api/v1`
- Username/password: your Django user

## Goals (MVP)
- Add/view/edit/delete expenses
- Categories (predefined + custom)
- Monthly budgets (overall + per-category)
- Basic analytics (totals, category breakdown, trends)
- Export (CSV/JSON)

## Non-goals (for now)
- Multi-device sync, multi-tenant orgs
- Complex accounting features (double-entry, invoicing)
- AI features (Ollama) — planned as a later module

---
## Tech Stack
- **Backend API**: Python 3.11+, Django 5.x, Django REST Framework (DRF), Django ORM
- **Database**: SQLite (development + limited personal usage)
- **Frontend (separate app)**: HTML/CSS/JavaScript (vanilla)
	- UI: **Tailwind CSS** (simple utility-first styling)
	- Charts: **Chart.js**
	- API calls: **Fetch API** (keep dependencies minimal)
- **Auth** (when you’re ready): **JWT** via `djangorestframework-simplejwt`
- (Optional later) **Ollama** on a local machine, called via HTTP from the API

Why these picks:
- Tailwind + vanilla JS keeps the frontend lightweight and fast to iterate.
- Fetch is enough for DRF APIs (Axios is fine too, but not required).
- JWT is a good fit for a separate frontend calling a REST API.

---

## Authentication Plan (Phase 2)
If you start single-user/no-auth for speed, keep the API structure compatible with auth later.

Recommended: JWT (`djangorestframework-simplejwt`). Typical endpoints:
- `POST /api/v1/auth/token/` → get access/refresh
- `POST /api/v1/auth/token/refresh/` → refresh access

Alternative: DRF Token Auth
- Simpler, but less flexible for “frontend + API” separation than JWT in the long run.

---

## RBAC (Roles)
This project uses Django **Groups** as roles.

Default roles:
- `Admin`
- `User`

Create roles:
- `python manage.py seed_roles`

Assign roles:
- Django Admin → Users → select user → set `Groups`

Notes:
- API endpoints are authenticated-by-default (see `REST_FRAMEWORK` settings).
- Upcoming feature endpoints will use role-based permissions and (later) owner-scoping.

---

## High-Level Architecture
Recommended for your scope: a **single Django monolith API**.

Apps/modules:
- `expenses`: expense CRUD, receipts/attachments, tags
- `categories`: default categories + user-defined categories
- `budgets`: monthly budgets + thresholds + rollover rules
- `reports`: aggregated read-only endpoints
- (later) `ai`: categorization suggestions, anomaly detection, forecasting

Suggested separation:
- **Models** = source of truth for constraints
- **Services** = business rules (budget calculations, rollovers, edit-window checks)
- **Serializers** = validation + I/O formatting
- **ViewSets** = REST endpoints

---

## Core Workflow (User Journey)
### Daily
1. **Add Expense** → user submits amount, description, date (+ optional fields) → API validates → DB save
2. **View Expenses** → paginated list + filters (date range, category, tag, amount range)
3. **Check Budget** → returns remaining budget + status (ok/warn/exceeded)
4. **Analyze Spending** → charts-ready aggregates (daily totals, category totals, trends)

### Periodic
1. **Set Monthly Budgets** → per category and/or overall budget for a month
2. **Review Reports** → monthly/yearly summaries
3. **Export Data** → CSV/JSON

---

## Business Rules (MVP)
### Expense Management
Required:
- `amount` (decimal, > 0)
- `date` (ISO date)
- `description` (non-empty)

Optional:
- `category`
- `payment_method`
- `tags`
- `receipt_photo`

Edit/delete time window:
- Configurable setting, e.g. `EXPENSE_EDIT_WINDOW_HOURS = 72`
- After the window, edits/deletes are blocked (or require an admin override if you add auth later)

### Categories
- Seed system defaults: Food, Transport, Utilities, Entertainment, Healthcare, Shopping, etc.
- Allow custom categories
- Optional display props: `icon`, `color_token` (store a design-token value, not raw hex)

### Budgets
- Budget period = **calendar month** (e.g. 2026-01)
- Budget types:
	- Overall monthly budget
	- Per-category monthly budget
- Threshold alerts:
	- Warn at 80% (configurable)
	- Exceeded at 100%
- Rollover (optional rule, can be MVP or phase-2): unused budget carries forward

### Calculations / Reports
- Totals: daily / weekly / monthly / yearly
- Category breakdown: amounts + percentages
- Averages: per day/week/month
- Trend: current month vs previous month (delta + percent change)

---

## Data Model (Proposed)
Assuming a single-user MVP first. If you add auth later, add a `user_id` FK to all user-owned entities.

### `Category`
- `id` (uuid/int)
- `name` (unique)
- `is_system` (bool)
- `icon` (string, optional)
- `color_token` (string, optional) — avoid hard-coded colors
- `created_at`, `updated_at`

### `Tag` (optional MVP)
- `id`
- `name` (unique)

### `Expense`
- `id`
- `amount` (Decimal)
- `currency` (string, default e.g. `INR` or `USD`)
- `date` (date)
- `description` (text)
- `category_id` (FK nullable)
- `payment_method` (enum/string: cash/card/upi/bank/etc, optional)
- `notes` (text optional)
- `merchant` (string optional)
- `tags` (M2M optional)
- `receipt` (file/image optional)
- `created_at`, `updated_at`

### `Budget`
- `id`
- `month` (date stored as first day of month, e.g. 2026-01-01)
- `scope` (enum: `overall` or `category`)
- `category_id` (FK nullable; required if scope=category)
- `amount` (Decimal)
- `rollover_enabled` (bool)
- `warn_threshold` (decimal 0..1, default 0.8)
- `created_at`, `updated_at`

### `BudgetLedger` (phase-2)
Only needed if rollover becomes complex; tracks carry-forward amounts by month/category.

---

## REST API (Proposed)
Base: `/api/v1/`

### Expenses
- `GET /expenses/` (list)
	- Filters: `start_date`, `end_date`, `category_id`, `tag`, `min_amount`, `max_amount`, `search`
- `POST /expenses/` (create)
- `GET /expenses/{id}/` (retrieve)
- `PATCH /expenses/{id}/` (partial update; enforce edit window)
- `DELETE /expenses/{id}/` (enforce delete window)

### Categories
- `GET /categories/`
- `POST /categories/` (custom categories)
- `PATCH /categories/{id}/`
- `DELETE /categories/{id}/` (prevent deleting system categories; block if referenced unless you support reassignment)

### Budgets
- `GET /budgets/?month=2026-01-01`
- `POST /budgets/` (create/update by unique constraint: month+scope+category)
- `GET /budgets/status/?month=2026-01-01`
	- returns spent, remaining, percent_used, status (ok/warn/exceeded)

### Reports (read-only)
- `GET /reports/summary/?start=2026-01-01&end=2026-01-31`
	- totals, by-category totals, averages
- `GET /reports/trends/?month=2026-01-01`
	- current vs previous month totals + deltas
- `GET /reports/timeseries/?start=...&end=...&bucket=daily|weekly`

### Export
- `GET /export/expenses.csv?start=...&end=...`
- `GET /export/backup.json`

---

## Validation & Constraints
- Use `Decimal` everywhere for money; avoid float.
- Enforce `amount > 0`.
- Enforce `description` non-empty.
- Create an index on `Expense.date`, `Expense.category_id`, and maybe `(date, category_id)` for filtering.
- For budgets, enforce uniqueness: `(month, scope, category_id)`.

---

## AI (Future / Optional with Ollama)
Design it as **non-blocking suggestions** so the app works without AI.

Integration approach:
- `ai` app exposes internal services like:
	- `suggest_category(description) -> {category_id, confidence, rationale}`
	- `detect_anomaly(expense) -> {flagged, reason}`
	- `forecast_month_end(month) -> {predicted_total, predicted_by_category}`
- The API calls Ollama over HTTP on LAN/local machine.
- Always handle timeouts and fall back gracefully.

Minimal AI endpoints (later):
- `POST /ai/categorize/` with `description` → suggested category
- `GET /ai/insights/?month=...` → unusual spend + simple tips

Current status:
- Endpoints exist under `/api/v1/ai/` but return “disabled” responses until `AI_ENABLED=True` is implemented with an Ollama provider.

---

## Suggested Build Order
1. Models + migrations (Expense/Category/Budget)
2. CRUD endpoints for expenses + filters
3. Budget status endpoint + thresholds
4. Reports endpoints
5. Export
6. (Later) AI module + optional endpoints

---

## Clarifying choices (decide early)
These affect your schema/API slightly:
1. **Single-user or auth from day 1?** (JWT/session)
2. **Multi-currency needed?** If not, keep a single currency.
3. **Edit/delete window behavior:** hard block vs “soft delete + admin restore”.

If you want, I can scaffold the Django + DRF project in this repo next (apps, models, serializers, viewsets, urls, and SQLite settings) following this blueprint.
