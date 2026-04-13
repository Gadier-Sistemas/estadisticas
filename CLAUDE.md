# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema de Estadísticas de Trabajo** for GADIER Sistemas Profesionales. Tracks daily production by operator, calculates performance (rendimiento) against a daily meta, and exports reports.

Two-tier architecture:
- **Backend**: Laravel 12 REST API (PHP 8.2) with SQLite, Sanctum auth
- **Frontend**: Vanilla JS SPA served separately (no build step), talks to the API over HTTP

---

## Running the Backend

From `backend/`:

```bash
# First-time setup
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Dev server (port 8001)
php artisan serve --port=8001

# Run tests
composer test
# Or a single test file
php artisan test --filter=TestClassName
```

## Running the Frontend

The frontend is static HTML/JS/CSS served by any HTTP server on **port 8080**. No build step needed.

```bash
# From frontend/ — use any static server, e.g.:
php -S localhost:8080
# or
npx serve . -p 8080
```

The API URL is auto-detected in `frontend/js/components/auth.js`: `http://127.0.0.1:8001/api`.

---

## Architecture

### Backend (`backend/`)

- **Auth**: Laravel Sanctum (token-based). Tokens stored in `sessionStorage` on the frontend.
- **Roles**: Two roles — `superadmin` and `operario`. The `EnsureSuperadmin` middleware (`app/Http/Middleware/EnsureSuperadmin.php`) guards write routes for procesos, proyectos, and all of usuarios.
- **Models**: `User`, `Proceso` (identified by `codigo`, e.g. "BC16"), `Registro` (production entry), `Proyecto`.
- **Rendimiento formula**: `(cantidad_real / ((meta_diaria / 540) * minutos_trabajados)) * 100`
- **CORS**: Hardcoded allowed origins in `config/cors.php` — `localhost:8080`, `127.0.0.1:8080`, `172.16.0.137:8080`. Add new network IPs here when deploying to LAN.
- **Database**: SQLite at `database/database.sqlite`. Seeded via `InitialDataSeeder` and `ProyectoSeeder`.

### Frontend (`frontend/`)

- **Entry point**: `index.html` — single page, all modules rendered in-place.
- **Navigation/global state**: `js/app.js` — holds `sampleData` (processes, projects, registrations, operators), handles `loadInitialData()` and `syncRegistrations()` on login.
- **Modules** (each in `js/components/`):
  - `auth.js` — login/logout, `syncUsers()`, defines `API_URL`
  - `dashboard.js` — charts and summary stats
  - `registro.js` — production entry form with subprocesses and time tracking
  - `procesos.js` — CRUD for process catalog (superadmin only)
  - `usuarios.js` — user management (superadmin only)
  - `consolidado.js` — Excel export of consolidated data
  - `reportes.js` — PDF and Excel report generation
  - `seguimiento.js` — tracking view
- **Utilities**: `js/utils/calculations.js` (rendimiento math), `js/components/alerts.js`
- **No module bundler** — scripts loaded via `<script>` tags in order. Global functions called across files (e.g., `getUsers()`, `loadDashboardModule()`).

### Data Flow

1. User logs in → `auth.js` POSTs `/api/login` → receives Sanctum token → stored in `sessionStorage`
2. `app.js::loadInitialData()` fetches procesos, proyectos, users from API and populates `sampleData`
3. Each module reads from `sampleData` and POSTs/PUTs/DELETEs to API as needed
4. On registration changes, `syncRegistrations()` re-fetches and re-renders the active module

---

## Key Conventions

- API routes in `backend/routes/api.php` — public: only `/login`. Everything else requires `auth:sanctum`.
- Proceso is identified by `codigo` (string, e.g. "BC16"), not integer ID — used as foreign key in `registros.proceso_codigo`.
- Frontend maps API snake_case fields to camelCase in `syncRegistrations()` (e.g., `user_id` → `userId`).
- The `registro` model's `tipo` field distinguishes normal production from `novedad` (non-worked days).
