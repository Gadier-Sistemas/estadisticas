# Manual Técnico: Sistema de Estadísticas de Trabajo (GADIER)

Guía técnica del software de Estadísticas de Trabajo para GADIER Sistemas Profesionales. Cubre arquitectura, instalación local, despliegue en producción (Dokploy), endpoints REST, seguridad y mantenimiento.

---

## 1. Resumen funcional

Aplicación web para registrar la producción diaria de operarios, calcular rendimiento contra metas y generar reportes consolidados.

**Características**:
- Registro individual por proceso/subproceso.
- **Registro por tabla múltiple** (hasta 50 actividades en un envío).
- **Media jornada** por registro (divisor 270 en lugar de 540 min).
- Cálculo automático de rendimiento (fórmula Excel GADIER).
- Gestión de novedades (incapacidades, permisos, etc.) — solo visibles a su dueño y a superadmin.
- **Bloqueo de edición fuera del día actual** para operarios (superadmin exento).
- Dashboard con estadísticas por rol.
- Reportes PDF/Excel filtrables.
- **Importación de catálogo de procesos desde Excel/CSV** (superadmin).
- **Integración con biométrico**: importa reporte estándar y cruza asistencia con registros de estadística.
- Sistema de roles (`superadmin`, `operario`).

---

## 2. Stack y requisitos

| Componente | Versión/herramienta |
|---|---|
| Backend | Laravel 12 + PHP 8.2 |
| Base de datos | **MySQL 8.x** (producción y desarrollo) |
| Auth | Laravel Sanctum (Bearer tokens) |
| Parser Excel | `phpoffice/phpspreadsheet ^5.7` |
| Frontend | HTML + Vanilla JS (sin build step) |
| Puerto backend | 8001 |
| Puerto frontend (dev) | 8080 |

**Requisitos para desarrollo local**:
- PHP 8.2+ con extensiones: `pdo_mysql`, `openssl`, `mbstring`, `xml`, `zip`, `fileinfo`, `bcmath`.
- MySQL 8.x (se administra con MySQL Workbench).
- Composer 2.x.
- Navegador moderno (Chrome, Edge, Firefox).

---

## 3. Instalación local

### Backend

**Setup inicial** (solo la primera vez):

Previo: tener MySQL corriendo localmente y la base `db_estadisticas_gadier` creada:

```sql
CREATE DATABASE db_estadisticas_gadier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Luego, desde la raíz del proyecto:

```bash
cd backend
composer install
cp .env.example .env
# Ajustar DB_HOST, DB_USERNAME, DB_PASSWORD en .env si difieren
php artisan key:generate
php artisan migrate --seed
```

**Comando para correr el servidor** (cada vez que trabajes):

```bash
cd backend
php artisan serve --port=8001
```

Deja esta terminal abierta. El API queda en `http://localhost:8001/api`.

### Frontend

**Comando para correr el servidor** (cada vez que trabajes):

```bash
cd frontend
php -S localhost:8080
```

En otra terminal. Abre `http://localhost:8080` en el navegador.

> **Importante:** necesitas **dos terminales abiertas en paralelo** — una corriendo el backend (`php artisan serve --port=8001`) y otra el frontend (`php -S localhost:8080`). Si cierras cualquiera, la app deja de funcionar.

### Variables de entorno clave (`.env`)

```
APP_ENV=local
APP_DEBUG=true
APP_KEY=<generado>
APP_URL=http://localhost:8001

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_estadisticas_gadier
DB_USERNAME=root
DB_PASSWORD=<tu_password>

FRONTEND_URL=http://localhost:8080
SANCTUM_STATEFUL_DOMAINS=localhost:8080
```

---

## 4. Arquitectura

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── BiometricoController.php    ← Req 8
│   │   │   ├── DashboardController.php
│   │   │   ├── ProcesoController.php        ← Req 4 (método import)
│   │   │   ├── ProyectoController.php
│   │   │   ├── RegistroController.php       ← Req 3 (método batch), Req 7
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   └── EnsureSuperadmin.php
│   │   └── Requests/ (FormRequests)
│   └── Models/ (User, Proceso, Proyecto, Registro, BiometricoRegistro)
├── database/
│   ├── migrations/
│   └── factories/
├── routes/api.php
├── tests/Feature/ (44 tests)
└── nixpacks.toml  ← deploy automático

frontend/
├── index.html         ← app principal (SPA)
├── login.html
├── manual.html        ← manual de usuario
└── js/
    ├── app.js          ← orquestador (incluye interceptor global 401 → redirige a login)
    ├── utils/calculations.js  (incluye escapeHtml)
    └── components/
        ├── auth.js          (API_URL, login/logout)
        ├── dashboard.js     (charts con datos reales de /dashboard/stats)
        ├── registro.js      ← Req 3, 5, 7
        ├── procesos.js      ← Req 4 (modal importar)
        ├── usuarios.js
        ├── reportes.js
        ├── consolidado.js
        ├── seguimiento.js
        ├── biometrico.js    ← Req 8 (nuevo módulo)
        └── alerts.js
```

---

## 5. Modelo de datos

### Tablas principales

| Tabla | Notas |
|---|---|
| `users` | `name, lastname, username, email, password (hashed), codigo, rol (operario\|superadmin), activo, cedula, tipo_documento` |
| `procesos` | PK `codigo` (string). Campos: `nombre, categoria (OPERATIVO\|CUSTODIA), unidad, meta_diaria, meta_hora, meta_minuto, tipo_proceso, servicio, descripcion_actividad` |
| `proyectos` | `id, nombre, cliente, descripcion, activo` |
| `registros` | `id, user_id, proceso_codigo, proyecto_id, fecha, cliente, cantidad, tiempo (HH:MM), media_jornada (bool), observaciones, tipo (produccion\|novedad_total), novedad_tipo` |
| `biometrico_registros` | `cedula, fecha, nombre_biometrico, hora_entrada, hora_salida, retardo_min, salida_temprano_min, falta_min, minutos_trabajados, ausente` · UNIQUE(cedula, fecha) |
| `personal_access_tokens` | tabla de Sanctum |

### Convenciones

- **FK de proceso**: se usa `proceso_codigo` (string) en lugar de id entero.
- **Cédula**: en `users.cedula` y `biometrico_registros.cedula` — string (preserva ceros).
- **Fecha**: formato `Y-m-d`. Cálculos con zona horaria **America/Bogota** explícita (servidor en UTC).
- **Mapeo snake_case → camelCase**: `syncRegistrations()` en `app.js` mapea campos API al frontend (ej. `user_id` → `userId`).

---

## 6. Endpoints REST

Base: `/api`. Todas bajo `auth:sanctum` excepto `/login`.

### Auth
| Método | Ruta | Middleware | Rate limit |
|---|---|---|---|
| POST | `/login` | — | 10/min |
| POST | `/logout` | auth | — |
| GET | `/user` | auth | — |

### Registros
| Método | Ruta | Middleware | Rate limit |
|---|---|---|---|
| GET | `/registros` | auth | — |
| POST | `/registros` | auth | 60/min |
| **POST** | **`/registros/batch`** | **auth** | **30/min** ← Req 3 |
| PUT | `/registros/{id}` | auth | 60/min |
| DELETE | `/registros/{id}` | auth+superadmin | 30/min |

### Procesos
| Método | Ruta | Middleware | Rate limit |
|---|---|---|---|
| GET | `/procesos` | auth | — |
| GET | `/procesos/{codigo}` | auth | — |
| POST / PUT / DELETE | `/procesos[/{codigo}]` | auth+superadmin | 30/min |
| **POST** | **`/procesos/import`** | **auth+superadmin** | **5/min** ← Req 4 |

### Proyectos
Similar a procesos. CRUD con superadmin+throttle.

### Dashboard
| Método | Ruta | Middleware |
|---|---|---|
| GET | `/dashboard/stats` | auth |
| GET | `/dashboard/rendimiento` | auth |

### Biométrico (Req 8)
| Método | Ruta | Middleware | Rate limit |
|---|---|---|---|
| **POST** | **`/biometrico/import`** | **auth+superadmin** | **5/min** |
| **GET** | **`/biometrico/cruce?fecha=Y-m-d`** | **auth+superadmin** | **60/min** |

### Usuarios
| Método | Ruta | Middleware |
|---|---|---|
| CRUD completo | `/usuarios` | auth+superadmin, throttle 30/min |

---

## 7. Funcionalidades nuevas (Req 3, 4, 5, 7, 8)

### 7.1 Req 7 — Bloqueo de fecha (operarios)

Operario solo puede crear/editar registros del día actual. Superadmin exento.

- Backend: validación en `RegistroStoreRequest::withValidator()` y `RegistroUpdateRequest::withValidator()` usando `Carbon::now('America/Bogota')`.
- Frontend: input `fecha` con `min=max=today` y `readOnly` para operarios en [registro.js](backend/../frontend/js/components/registro.js).
- Tests: [RegistroFechaBloqueoTest.php](backend/tests/Feature/RegistroFechaBloqueoTest.php).

### 7.2 Req 5 — Media jornada

Checkbox por registro. Cuando está marcado, la fórmula usa 270 minutos en lugar de 540.

- Migración: `add_media_jornada_to_registros_table`.
- Backend: `Registro::$fillable` + cast boolean, reglas de FormRequest.
- Frontend: checkbox en `registro.js`; `calculatePerformance()` usa divisor dinámico; badge "½ jornada" en tabla de "Mis Registros de Hoy".
- Tests: [RegistroMediaJornadaTest.php](backend/tests/Feature/RegistroMediaJornadaTest.php).

### 7.3 Req 3 — Tabla múltiple

Permite registrar hasta 50 actividades del día en una sola operación.

- Endpoint: `POST /api/registros/batch` con validación por fila y transacción atómica (all-or-nothing).
- Frontend: toggle "Formulario ↔ Tabla múltiple" en el módulo Registro. Grid editable con: proyecto, proceso, cantidad, hora inicio, hora fin, ½ jornada.
- Tests: [RegistroBatchTest.php](backend/tests/Feature/RegistroBatchTest.php).

### 7.4 Req 4 — Importar Excel de procesos

Superadmin puede cargar catálogo masivo de procesos.

- Endpoint: `POST /api/procesos/import` con phpspreadsheet en modo `setReadDataOnly(true)` (no evalúa fórmulas).
- Formato: xlsx/xls/csv, max 5 MB. Headers obligatorios: `codigo, nombre, categoria, unidad, meta_diaria`. Opcionales: `tipo_proceso, servicio, descripcion_actividad`.
- Frontend: modal "Importar Excel" en módulo Procesos con botón "Descargar plantilla" (genera CSV con BOM UTF-8).
- Metas derivadas: `meta_hora = meta_diaria / 9`, `meta_minuto = meta_diaria / 540`.
- Tests: [ProcesoImportTest.php](backend/tests/Feature/ProcesoImportTest.php).

### 7.5 Req 8 — Biométrico + cruce

Superadmin importa el reporte estándar del biométrico y obtiene el cruce con los registros de estadística.

**Formato de archivo esperado** (generado por el software del biométrico):
- `.xlsx` o `.xls`, max 10 MB.
- Puede contener múltiples hojas (Turnos, Estadístico, Asistencia, Excepciones, una por ID, etc.).
- El sistema busca la hoja cuyo nombre contiene "excepcion" y procesa solo esa.
- **Columnas esperadas en "Reporte de Excepciones"** (filas 1-4 = títulos, datos desde fila 5):

  | Col | Header | Tipo |
  |---|---|---|
  | A | ID (cédula) | int |
  | B | Nombre | string |
  | C | Departamento | string |
  | D | Fecha | Y-m-d |
  | E | Primer Horario — Entrada | HH:MM |
  | F | Primer Horario — Salida | HH:MM |
  | G | Segundo Horario — Entrada | HH:MM |
  | H | Segundo Horario — Salida | HH:MM |
  | I | Retardos (Min) | int |
  | J | Salida Temprano (Min) | int |
  | K | **Falta (Min)** | int (540 = ausencia total) |
  | L | Total (Min) | int |

**Cruce** (`GET /biometrico/cruce?fecha=Y-m-d`) devuelve 4 listas:
1. **Ausencias no reportadas**: biométrico marca ausencia (`falta=540`) pero el operario no registró novedad.
2. **Inconsistencias**: producción registrada pero ausente en biométrico, o viceversa.
3. **Bajo rendimiento**: operarios con rendimiento < 80%.
4. **Cédulas sin usuario**: marcajes del biométrico que no coinciden con ningún `users.cedula`.

- Tests: [BiometricoTest.php](backend/tests/Feature/BiometricoTest.php).

---

## 8. Cálculo de rendimiento

$$\text{Rendimiento (\%)} = \frac{\text{Cantidad Real}}{\text{Producción Esperada}} \times 100$$

$$\text{Producción Esperada} = \frac{\text{Meta Diaria}}{\text{Jornada en min}} \times \text{Minutos Trabajados}$$

- Jornada = **540 minutos** (9 h) por defecto.
- Jornada = **270 minutos** (4.5 h) si `media_jornada = true`.

**Semáforo**:
- Verde: ≥ 90% (≥ 95% en algunos cálculos)
- Amarillo: 70–89%
- Rojo: < 70%

---

## 9. Seguridad

### Checklist aplicado
- `composer audit` → 0 CVEs.
- Passwords: `Hash::make` + cast `'hashed'` + `$hidden` en modelo.
- SQL: solo Eloquent / query builder. `DB::raw` únicamente con strings constantes.
- Mass assignment: todos los modelos con `$fillable`.
- Autenticación: Laravel Sanctum (Bearer tokens).
- Autorización: middleware `EnsureSuperadmin` en operaciones sensibles.
- Scope de datos: operarios solo ven sus propios registros (7 tests).
- CORS: orígenes explícitos (no wildcards) vía `FRONTEND_URL`.
- CSRF: N/A (API Bearer, `supports_credentials: false`).
- Rate limits: login 10/min, imports 5/min, batch 30/min, registros 60/min.
- Upload: validación MIME real + extensión + tamaño (5–10 MB).
- Excel: `setReadDataOnly(true)` previene evaluación de fórmulas maliciosas.
- XSS: `escapeHtml()` aplicado en inputs de usuario (observaciones, nombres de proyectos/procesos en options y detalles).
- Logs: sin PII. Solo `user_id + acción + conteo`.
- Interceptor global 401 en `frontend/js/app.js`: ante token expirado/inválido limpia `sessionStorage` y redirige a `login.html`.
- Validación de inputs en `DashboardController::getRendimiento` (`fecha` formato `Y-m-d`, `user_id` exists).
- Respuestas API homogéneas en `ProyectoController` y `UserController` (POST/PUT devuelven el modelo directo, no envuelto).

---

## 10. Testing

Suite completa con **44 tests** / 94 assertions.

```bash
cd backend
php artisan test
```

Desglose por feature:
- `RegistroFechaBloqueoTest` (6) — Req 7
- `RegistroMediaJornadaTest` (3) — Req 5
- `NovedadScopeTest` (7) — Req 6 y scope general
- `RegistroBatchTest` (7) — Req 3
- `ProcesoImportTest` (8) — Req 4
- `BiometricoTest` (11) — Req 8
- `ExampleTest` (2) — smoke tests

DB de testing: SQLite `:memory:` (config en `phpunit.xml`). Se usa **solo** para pruebas automatizadas por performance — la aplicación real corre sobre MySQL. Las migraciones son agnósticas del motor, por eso funcionan en ambos.

---

## 11. Deploy en producción (Dokploy)

### Archivo `backend/nixpacks.toml`

```toml
[phases.build]
cmds = ['composer install --no-dev --optimize-autoloader']

[start]
cmd = 'php artisan config:clear && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8001}'
```

Al arrancar el contenedor: migra DB automáticamente, cachea config y rutas, levanta server.

### Variables de entorno en el panel Dokploy (backend)

```
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:<generar con "php artisan key:generate --show">
APP_URL=https://api-estadisticas.gadier.cloud

DB_CONNECTION=mysql
DB_HOST=<host-mysql-dokploy>
DB_PORT=3306
DB_DATABASE=db_estadisticas_gadier
DB_USERNAME=<usuario>
DB_PASSWORD=<password-fuerte>

FRONTEND_URL=https://estadisticas.gadier.cloud
SANCTUM_STATEFUL_DOMAINS=estadisticas.gadier.cloud

LOG_CHANNEL=stack
LOG_LEVEL=warning
```

### MySQL en Dokploy ⚠️

Antes de redeploy:
- Asegurar que exista un servicio MySQL en Dokploy (o un MySQL externo accesible) con la base `db_estadisticas_gadier` creada.
- El usuario de conexión debe tener permisos `ALL PRIVILEGES` sobre esa base.
- `DB_HOST` debe apuntar al nombre del servicio MySQL dentro de la red de Dokploy (ej. `mysql`, `db-estadisticas`), no a `127.0.0.1`.
- La persistencia la maneja MySQL con su propio volumen — NO hay que montar volumen para SQLite.

### Límite de upload

Traefik (frente al contenedor) debe permitir al menos 10 MB (`client_max_body_size 10m` o equivalente) para que los imports biométricos pasen.

### Frontend

Deploy estático del contenido de `frontend/` en `https://estadisticas.gadier.cloud`. El archivo `frontend/js/components/auth.js` detecta `localhost` vs producción automáticamente y ajusta `API_URL`.

### Redeploy automático

Con Dokploy conectado al repositorio: cada `git push` a la rama configurada dispara rebuild.

---

## 12. Mantenimiento

### Backups
- **MySQL**: usar `mysqldump` desde el host o desde MySQL Workbench (`Server > Data Export`). Programar backups automáticos según política de la empresa.
- Alternativa: usar módulo Reportes para exportar a Excel como copia adicional de registros.

### Solución de problemas
- **App crashea al arrancar**: revisar `APP_KEY` en el `.env` del contenedor, y que `DB_HOST`/credenciales MySQL sean alcanzables desde el contenedor.
- **Error "Connection refused" en MySQL**: `DB_HOST` apunta a un servicio no disponible. En Dokploy debe ser el nombre del contenedor MySQL dentro de la red interna.
- **"No autorizado"**: verificar que el usuario esté `activo = true`.
- **CORS bloqueado**: `FRONTEND_URL` debe coincidir con el dominio que usa el navegador.
- **Import biométrico 422 "hoja no encontrada"**: el archivo debe incluir la hoja "Reporte de Excepciones".
- **Rate limit 429**: son los throttles; esperar 1 minuto. Se puede ajustar en `routes/api.php`.

### Logs
Ruta: `backend/storage/logs/laravel.log`. En Dokploy se leen desde el panel del contenedor.

---

*Manual generado para GADIER Sistemas Profesionales — última actualización: 2026-04-23*
