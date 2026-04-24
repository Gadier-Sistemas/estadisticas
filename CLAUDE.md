# CLAUDE.md

## Project Overview
Sistema de Estadísticas de Trabajo para GADIER. Registra producción diaria por operario, calcula rendimiento contra meta y exporta reportes. Incluye módulo de cruce con biométrico para detectar ausencias no reportadas.

- **Backend**: Laravel 12 REST API (PHP 8.2), **MySQL 8.x**, Sanctum auth — corre en puerto **8001**
- **Frontend**: Vanilla JS SPA, sin build step — corre en puerto **8080**
- **Tests**: 44 tests / 94 assertions con `php artisan test` (usa SQLite `:memory:` solo para testing)

## Comandos esenciales

**Setup inicial backend (una sola vez):**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

**Correr servicios (dos terminales en paralelo):**
```bash
# Terminal 1 — backend
cd backend && php artisan serve --port=8001

# Terminal 2 — frontend
cd frontend && php -S localhost:8080
```

## Key Conventions

- **Rendimiento formula**: `(cantidad_real / ((meta_diaria / jornada_min) * minutos_trabajados)) * 100`
  - `jornada_min` = 540 (jornada completa) o 270 (si `media_jornada = true`)
- **Proceso FK**: identificado por `codigo` (string, e.g. "BC16"), no por ID entero — usado como FK en `registros.proceso_codigo`
- **snake_case → camelCase**: `syncRegistrations()` en `app.js` mapea campos de la API al frontend (e.g. `user_id` → `userId`)
- **Roles**: `superadmin` y `operario`. Middleware `EnsureSuperadmin` guarda procesos, proyectos, usuarios y biométrico
- **CORS**: orígenes permitidos en `config/cors.php`. Al desplegar en LAN, agregar la IP de red ahí
- **`tipo` en registros**: distingue producción normal (`produccion`) de novedades (`novedad_total` con `novedad_tipo`)
- **Auth token**: Sanctum Bearer, guardado en `sessionStorage` del browser (no localStorage)
- **Bloqueo de fecha**: operarios solo pueden crear/editar registros del día actual (validado en `RegistroStoreRequest`/`RegistroUpdateRequest` con `Carbon::now('America/Bogota')`). Superadmin exento.
- **Cédula**: string en `users.cedula` y `biometrico_registros.cedula` (preserva ceros). Es la clave de cruce con biométrico.

## Módulos Frontend

Cada módulo es un script independiente en `frontend/js/components/` cargado por `index.html`:

| Módulo | Acceso | Notas |
|---|---|---|
| `dashboard.js` | todos | Charts consumen `/api/dashboard/stats` (datos reales) |
| `registro.js` | todos | Form individual + tabla múltiple (hasta 50 filas, atómico) |
| `procesos.js` | superadmin | CRUD + import Excel/CSV (`POST /procesos/import`) |
| `usuarios.js` | superadmin (admin), operario (kiosk) | |
| `reportes.js` | todos | Filtros + export PDF/Excel |
| `consolidado.js` | todos | KPIs y rendimiento detallado |
| `seguimiento.js` | superadmin | Calendario por operario, integrado en nav (no estaba antes) |
| `biometrico.js` | superadmin | Import StandardReport + cruce de asistencia |

## Endpoints clave (rate limits)

- `POST /login` → 10/min
- `POST /registros` → 60/min
- `POST /registros/batch` → 30/min (tabla múltiple)
- `POST /procesos/import` → 5/min (superadmin)
- `POST /biometrico/import` → 5/min (superadmin)

## Notas de seguridad ya aplicadas

- Hash::make + cast `'hashed'` en `User`
- `escapeHtml()` en inputs de usuario (en `frontend/js/utils/calculations.js`)
- Phpspreadsheet con `setReadDataOnly(true)` en imports
- Rate limiting en endpoints sensibles
- Interceptor global de 401 en `app.js`: limpia sesión y redirige a `login.html` si el token expira
- Operarios solo ven sus propios registros (scope aplicado en `RegistroController::index`)

## Documentación adicional

- [manual_tecnico.md](manual_tecnico.md) — guía técnica completa (instalación, deploy Dokploy, endpoints, schema)
- [frontend/manual.html](frontend/manual.html) — manual de usuario (accesible desde la app)
