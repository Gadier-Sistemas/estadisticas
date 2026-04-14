# CLAUDE.md

## Project Overview
Sistema de Estadísticas de Trabajo para GADIER. Registra producción diaria por operario, calcula rendimiento contra meta y exporta reportes.

- **Backend**: Laravel 12 REST API (PHP 8.2), SQLite, Sanctum auth — corre en puerto **8001**
- **Frontend**: Vanilla JS SPA, sin build step — corre en puerto **8080**

## Key Conventions

- **Rendimiento formula**: `(cantidad_real / ((meta_diaria / 540) * minutos_trabajados)) * 100`
- **Proceso FK**: identificado por `codigo` (string, e.g. "BC16"), no por ID entero — usado como FK en `registros.proceso_codigo`
- **snake_case → camelCase**: `syncRegistrations()` en `app.js` mapea campos de la API al frontend (e.g. `user_id` → `userId`)
- **Roles**: `superadmin` y `operario`. Middleware `EnsureSuperadmin` guarda rutas de procesos, proyectos y usuarios
- **CORS**: orígenes permitidos en `config/cors.php`. Al desplegar en LAN, agregar la IP de red ahí
- **`tipo` en registros**: distingue producción normal de `novedad` (días no trabajados)
- **Auth token**: Sanctum, guardado en `sessionStorage` del browser (no localStorage)
