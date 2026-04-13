.# Manual Técnico: Sistema de Estadísticas de Trabajo (GADIER)

Este manual está diseñado para proporcionar una guía paso a paso sobre el funcionamiento, instalación y administración del software de Estadísticas de Trabajo. Está orientado tanto a usuarios administradores como a personas con conocimientos técnicos básicos que deseen entender la arquitectura del sistema.

---

## 1. Introducción
El **Sistema de Estadísticas de Trabajo** es una aplicación web diseñada para la empresa **GADIER Sistemas Profesionales**. Su objetivo principal es permitir el registro diario de la producción de los operarios, calcular su rendimiento basado en metas preestablecidas y generar informes consolidados para la toma de decisiones.

### Características Principales:
- Registro de producción por procesos y subprocesos.
- Cálculo automático de rendimiento porcentual.
- Gestión de novedades (incapacidades, permisos, etc.).
- Panel de control (Dashboard) con gráficas interactivas.
- Generación de reportes en formato PDF y Excel.
- Sistema de roles (Superadmin y Operario).

---

## 2. Requisitos e Instalación

### Requisitos Previos:
1. **PHP 8.2+** instalado y disponible en el PATH.
2. **MySQL** corriendo localmente (administrar con **MySQL Workbench**).
3. **Composer** instalado globalmente.
4. **Navegador Moderno**: Google Chrome, Microsoft Edge o Mozilla Firefox.

### Pasos para la Instalación:

#### Base de Datos
1. Abre **MySQL Workbench** y conéctate a tu instancia local.
2. La base de datos `db_estadisticas_gadier` debe existir. Si no existe, créala:
   ```sql
   CREATE DATABASE db_estadisticas_gadier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Verifica que las credenciales en `backend/.env` coincidan con las tuyas:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=db_estadisticas_gadier
   DB_USERNAME=root
   DB_PASSWORD=123456
   ```

#### Backend (API Laravel)
Desde la carpeta `backend/`:
```bash
composer install
php artisan migrate --seed   # crea tablas y datos iniciales
php artisan serve --port=8001
```
La API queda disponible en `http://localhost:8001/api`.

#### Frontend
Desde la carpeta `frontend/`, servir con cualquier servidor HTTP estático en el puerto **8080**:
```bash
php -S localhost:8080
```
Acceder en el navegador: `http://localhost:8080`

---

## 3. Acceso y Seguridad

### Inicio de Sesión:
Al entrar por primera vez, verás la pantalla de login. El sistema cuenta con dos usuarios creados por defecto para pruebas:

| Usuario | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | Superadmin | Acceso total a todos los módulos. |
| `operario1` | `123456` | Operario | Acceso a Registro, Dashboard y Usuarios (limitado). |

### Seguridad:
- **Cierre de Sesión por Inactividad**: El sistema cerrará la sesión automáticamente después de **5 minutos** de inactividad para proteger la información.
- **Persistencia**: Los datos se guardan en la base de datos MySQL. El navegador solo almacena el token de sesión de forma temporal.

---

## 4. Guía de Módulos (Manual de Uso)

### 📊 Módulo: Dashboard
Es la pantalla principal. Muestra:
- **Resumen Global**: Total de registros, cantidad procesada y promedio de rendimiento.
- **Gráficas**: Distribución de trabajo por proceso y tendencias de rendimiento diario.

### 📝 Módulo: Registro
Aquí es donde los operarios ingresan su trabajo diario.
1. **Meta del Día**: Define cuántos procesos diferentes esperas registrar hoy.
2. **Datos**: Selecciona el cliente, el proceso y la fecha.
3. **Subprocesos**: Algunos procesos requieren desglosar la cantidad por subprocesos. El sistema sumará automáticamente las cantidades.
4. **Tiempo**: Ingresa la hora de inicio y fin. El sistema calculará la duración total.
5. **Novedades**: Si no hubo producción (por ejemplo, una incapacidad), marca la casilla "Día No Laborado" y adjunta el soporte si es necesario.

### 👥 Módulo: Usuarios
Permite gestionar quién utiliza la aplicación.
- **Crear Usuario**: Define nombre, usuario, contraseña y rol.
- **Estado**: Puedes activar o desactivar usuarios sin eliminarlos, impidiendo que inicien sesión.

### ⚙️ Módulo: Procesos
Configuración técnica del catálogo de servicios.
- Cada proceso tiene un **Código** (ej. BC16), una **Meta Diaria** (producción esperada en 9 horas) y una **Unidad de Medida** (Imágenes, Unidades, etc.).

### 📄 Módulo: Reportes
Permite filtrar la información por fechas y exportarla:
- **Descargar PDF**: Genera un documento formal con tabla de registros.
- **Exportar Excel**: Descarga los datos en formato de hoja de cálculo para análisis profundo.

---

## 5. Detalles Técnicos Clave

### El Cálculo del Rendimiento
El software utiliza una fórmula matemática para determinar qué tan eficiente fue un operario en un registro específico:

$$Rendimiento (\%) = \frac{Cantidad Real}{Producción Esperada}$$

Donde la **Producción Esperada** se calcula así:
*   `Producción Esperada = (Meta Diaria / 540 minutos) * Minutos Trabajados`
*   *(Nota: 540 minutos equivalen a 9 horas laborales)*.

### Estructura de Archivos (Para Desarrolladores)
- `index.html`: Estructura principal de la app.
- `app.js`: Lógica de navegación y sincronización global.
- `/modules`: Contiene scripts independientes para cada funcionalidad (`auth.js`, `registro.js`, `reportes.js`, etc.).
- `styles.css`: Estilos visuales modernos.

---

## 6. Mantenimiento y Soporte

### ¿Cómo respaldar la información?
Los datos residen en MySQL. Realiza backups periódicos desde MySQL Workbench (`Server > Data Export`) o usa el módulo de **Reportes** para exportar a Excel como copia adicional.

### Solución de Problemas Comunes:
- **No carga la página**: Verifica que el backend esté corriendo (`php artisan serve --port=8001`) y el frontend en el puerto 8080.
- **Error de "Acceso Denegado"**: Asegúrate de que el usuario esté marcado como "Activo" en el módulo de Usuarios.
- **Error de conexión a la BD**: Verifica que MySQL esté corriendo y que las credenciales en `backend/.env` sean correctas.
- **Error CORS**: Si accedes desde otra IP en la red, agrega esa IP a `backend/config/cors.php` en `allowed_origins`.

---
*Manual generado para GADIER Sistemas Profesionales - 2026*
