// Dashboard Module - Chart instance tracking
let dashboardChartInstances = {};

function destroyDashboardCharts() {
    Object.values(dashboardChartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    dashboardChartInstances = {};
}

function loadDashboardModule() {
    destroyDashboardCharts();
    const dashboardModule = document.getElementById('module-dashboard');

    const currentUser = getCurrentUser() || {};
    const userRole = (currentUser.rol || '').toLowerCase();
    const isOperator = userRole === 'operario';

    if (isOperator) {
        loadOperatorDashboard(currentUser);
    } else {
        loadAdminDashboard();
    }
}

/**
 * Carga el dashboard específico para un operario (o para un admin viendo a un operario).
 * @param {Object} operario - El objeto del usuario operario a mostrar.
 */
function loadOperatorDashboard(user) {
    const dashboardModule = document.getElementById('module-dashboard');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    dashboardModule.innerHTML = `
        <div class="module-header">
            <h2>📅 Mi Historial de Reportes</h2>
            <p class="module-description">Seguimiento de reportes diarios - ${user.nombre || 'Operario'}</p>
        </div>

        <div class="calendar-container">
            <div class="calendar-header">
                <button class="btn-icon" id="prevMonth" onclick="changeMonth(-1)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <h3 id="calendarMonthYear"></h3>
                <button class="btn-icon" id="nextMonth" onclick="changeMonth(1)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>

            <div class="calendar-stats">
                <div class="calendar-stat-item">
                    <span class="stat-indicator success">✓</span>
                    <span id="reportedDays">0</span> días con reporte
                </div>
                <div class="calendar-stat-item">
                    <span class="stat-indicator warning">⚠</span>
                    <span id="missingDays">0</span> días sin reporte
                </div>
            </div>

            <div class="calendar-grid" id="calendarGrid"></div>

            <div class="calendar-legend">
                <div class="legend-item">
                    <span class="legend-dot success">✓</span>
                    <span>Reporte subido</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot warning">⚠</span>
                    <span>Falta reporte</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot future">•</span>
                    <span>Día futuro</span>
                </div>
            </div>
        </div>
    `;

    // Initialize calendar with current month
    window.currentCalendarMonth = currentMonth;
    window.currentCalendarYear = currentYear;
    window.viewingUserId = user.id; // Store globally who we are looking at

    // Sync data first to ensure we have terbaru
    if (typeof syncRegistrations === 'function') syncRegistrations();

    renderCalendar(currentMonth, currentYear, user.id);
}

function renderCalendar(month, year, operarioId) {
    // Re-sync here too just to be absolutely safe
    if (typeof syncRegistrations === 'function') syncRegistrations();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Update header
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Build calendar grid
    let calendarHTML = '';

    // Day headers
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="calendar-day empty"></div>`;
    }

    // Calendar days
    let reportedCount = 0;
    let missingCount = 0;

    const targets = JSON.parse(localStorage.getItem('app_daily_targets') || '{}');

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = formatDateISO(date);
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;

        // Get reports for this specific date
        const reportsForDate = sampleData.registrations.filter(r =>
            (parseInt(r.userId) === parseInt(operarioId)) && r.fecha == dateString
        );
        const count = reportsForDate.length;

        const targetForDate = targets[`${operarioId}_${dateString}`] || 1;
        const hasReachedTarget = count >= targetForDate;
        const hasAnyReport = count > 0;

        // Novelty Check: Strictly BLUE if ALL records are 'novedad_total'
        const isPureNovelty = hasAnyReport && reportsForDate.every(r => r.type === 'novedad_total');
        // Mixed or Production: Check (Green)
        // If mixed, it counts as production/success usually, but maybe show an info indicator? 
        // User said: "pero en el calendario si solo se lleno algo en novedad... aparecera en color azul".
        // Use Green for everything else if target met or count > 0?
        // Let's stick to Green if production exists.

        let dayClass = 'calendar-day';
        let indicator = '';

        if (isToday) dayClass += ' today';

        if (isFuture) {
            dayClass += ' future';
            indicator = '<span class="day-indicator future">•</span>';
        } else if (isPureNovelty) {
            dayClass += ' novelty'; // Need to define this CSS
            indicator = '<span class="day-indicator info" style="color: #3b82f6;">ℹ</span>';
            reportedCount++; // Count as reported? Yes, justified absence.
        } else if (hasReachedTarget) {
            dayClass += ' success';
            indicator = '<span class="day-indicator success">✓</span>';
            reportedCount++;
        } else if (hasAnyReport) {
            dayClass += ' warning-partial';
            indicator = `<span class="day-indicator warning" title="${count}/${targetForDate} completed">⏳</span>`;
            missingCount++;
        } else {
            dayClass += ' warning';
            indicator = '<span class="day-indicator warning">⚠</span>';
            missingCount++;
        }

        calendarHTML += `
            <div class="${dayClass}" onclick="showDayDetail(${operarioId}, '${dateString}')" style="cursor: pointer; ${isPureNovelty ? 'background-color: #eff6ff; border-color: #3b82f6;' : ''}">
                <span class="day-number" style="${isPureNovelty ? 'color: #1e40af;' : ''}">${day}</span>
                ${indicator}
            </div>
        `;
    }

    document.getElementById('calendarGrid').innerHTML = calendarHTML;
    document.getElementById('reportedDays').textContent = reportedCount;
    document.getElementById('missingDays').textContent = missingCount;
}

function changeMonth(direction) {
    window.currentCalendarMonth += direction;

    if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
    } else if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
    }

    const viewingId = window.viewingUserId;
    renderCalendar(window.currentCalendarMonth, window.currentCalendarYear, viewingId);
}

function hasReportOnDate(operarioId, dateString) {
    return sampleData.registrations.some(r =>
        r.userId === operarioId && r.fecha === dateString
    );
}

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Carga el dashboard principal para administradores, calculando estadísticas globales.
 */
function loadAdminDashboard() {
    const dashboardModule = document.getElementById('module-dashboard');
    const users = window.getUsers ? getUsers() : [];
    const operators = users.filter(u => u.rol === 'operario');
    const regs = sampleData.registrations; // Already linked to storage in app.js

    // Calculate generic stats
    const totalOperators = operators.length;
    const activeOperators = operators.filter(u => u.activo).length;
    const today = new Date().toISOString().split('T')[0];
    const todayRegs = regs.filter(r => r.fecha === today).length;

    // Build Operator Stats Table Rows
    const operatorRows = operators.map(op => {
        const opRegs = regs.filter(r => r.userId === op.id);
        const lastReg = opRegs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        const lastDate = lastReg ? formatDate(lastReg.fecha) : 'Sin registros';
        const totalUnits = opRegs.reduce((acc, r) => acc + parseInt(r.cantidad || 0), 0);

        return `
            <tr>
                <td>
                    <div class="user-info-cell" style="display: flex; align-items: center; gap: 1rem;">
                        <div class="user-avatar-small" style="background: #1e293b; color: white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">${getInitials(op.name, op.apellido)}</div>
                        <div>
                            <div class="font-medium" style="color: var(--text-primary); font-weight: 600;">${op.name} ${op.apellido || ''}</div>
                            <div class="text-xs" style="color: var(--text-secondary);">${op.email || 'Sin correo asignado'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${op.activo ? 'badge-primary' : 'badge-secondary'}">${op.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td><span style="font-weight: 500;">${opRegs.length}</span> registros</td>
                <td><span style="font-weight: 600; color: #b91c1c;">${formatNumber(totalUnits)}</span></td>
                <td style="color: var(--text-secondary); font-size: 0.9em;">${lastDate}</td>
                <td>
                    <button class="btn btn-secondary" onclick="viewOperatorStats(${op.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">📊 Ver Historial</button>
                </td>
            </tr>
        `;
    }).join('');

    dashboardModule.innerHTML = `
        <div class="module-header">
            <h2>Dashboard de Estadísticas</h2>
            <p class="module-description">Resumen general de productividad y métricas</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>Operarios</h3>
                    <div class="stat-value">${activeOperators} / ${totalOperators}</div>
                    <p class="stat-label">Activos / Total</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>Registros Hoy</h3>
                    <div class="stat-value">${todayRegs}</div>
                    <p class="stat-label">${formatDate(new Date())}</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>Horas Trabajadas</h3>
                    <div class="stat-value">${getTotalHours()}</div>
                    <p class="stat-label">Global esta semana</p>
                </div>
            </div>

            <div class="stat-card" id="rendimientoCard" style="border-left: 4px solid #6b7280;">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <h3>Rendimiento Hoy</h3>
                    <div class="stat-value">—</div>
                    <p class="stat-label">Cargando...</p>
                </div>
            </div>
        </div>

        <!-- Operators List -->
        <div class="form-card" style="margin-top: 2rem;">
            <div class="form-header">
                <h3>👥 Rendimiento por Operario</h3>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Operario</th>
                            <th>Estado</th>
                            <th>Registros</th>
                            <th>Total Unidades</th>
                            <th>Última Actividad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${operatorRows}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="charts-grid" style="margin-top: 2rem;">
            <div class="chart-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Producción Semanal (Registro Real)</h3>
                    <span class="badge" style="background: #fee2e2; color: #991b1b;">Unidades Reales</span>
                </div>
                <canvas id="dashboardWeeklyChart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Top Procesos</h3>
                <canvas id="dashboardProcessesChart"></canvas>
            </div>
        </div>
    `;

    // Una sola petición para charts y rendimiento
    setTimeout(async () => {
        const token = sessionStorage.getItem('authToken');
        let stats = null;
        try {
            const response = await fetch(`${API_URL}/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) stats = await response.json();
        } catch (e) {
            console.error('Error cargando stats del dashboard:', e);
        }
        initDashboardCharts(stats);
        updateRendimientoCard(stats);
    }, 100);
}

/**
 * Consulta la API para obtener el rendimiento global del día y actualiza la UI.
 * @async
 * @returns {Promise<void>}
 */
function updateRendimientoCard(stats) {
    const card = document.getElementById('rendimientoCard');
    if (!card) return;

    const rend = (stats && stats.rendimiento_hoy) ? stats.rendimiento_hoy : { porcentaje: 0, semaforo: 'gris', total_registros: 0 };
    const colors = { verde: '#10b981', amarillo: '#f59e0b', rojo: '#ef4444', gris: '#6b7280' };
    const icons  = { verde: '🟢', amarillo: '🟡', rojo: '🔴', gris: '⏳' };
    const color  = colors[rend.semaforo] || colors.gris;
    const icon   = icons[rend.semaforo]  || icons.gris;

    card.style.borderLeft = `4px solid ${color}`;
    card.innerHTML = `
        <div class="stat-icon">${icon}</div>
        <div class="stat-content">
            <h3>Rendimiento Hoy</h3>
            <div class="stat-value" style="color: ${color};">${rend.porcentaje}%</div>
            <p class="stat-label">${rend.total_registros} registros analizados</p>
        </div>
    `;
}

/**
 * Cambia la vista para ver las estadísticas detalladas de un operario específico.
 * @param {number|string} userId - ID del usuario a visualizar.
 */
function viewOperatorStats(userId) {
    const users = window.getUsers ? getUsers() : [];
    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
        showToast('❌ No se encontró el operario', 'error');
        return;
    }

    // Load the operator dashboard view but for the admin
    loadOperatorDashboard(user);

    // Modify the header to show a back button and that we are viewing someone else
    const header = document.querySelector('.module-header');
    if (header) {
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button class="btn btn-secondary" onclick="loadAdminDashboard()" style="padding: 0.5rem 1rem;">⬅ Volver al Resumen</button>
                <div>
                    <h2 style="margin: 0;">📅 Historial: ${user.name} ${user.apellido || ''}</h2>
                    <p class="module-description" style="margin: 0;">Vista de administrador - Monitoreo de actividad</p>
                </div>
            </div>
        `;
    }
}

// Helper needed here if not imported
function getInitials(name, apellido) {
    const n = name ? name.charAt(0) : '';
    const a = apellido ? apellido.charAt(0) : '';
    return (n + a).toUpperCase();
}

function getTodayRegistrations() {
    const today = new Date().toISOString().split('T')[0];
    return sampleData.registrations.filter(r => r.fecha === today).length;
}

function getTotalHours() {
    return sampleData.registrations.reduce((total, reg) => {
        const [hours, minutes] = reg.tiempo.split(':');
        return total + parseInt(hours) + (parseInt(minutes) / 60);
    }, 0).toFixed(0);
}

function initDashboardCharts(stats) {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const chartColors = [
        'rgba(153, 15, 12, 0.9)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)'
    ];

    let weeklyLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let weeklyData = [0, 0, 0, 0, 0, 0];
    let proyectoLabels = [];
    let proyectoData = [];

    if (stats) {
        if (stats.produccion_semanal && stats.produccion_semanal.length) {
            weeklyLabels = stats.produccion_semanal.map(item => {
                const d = new Date(item.date + 'T00:00:00');
                return dayNames[d.getDay()];
            });
            weeklyData = stats.produccion_semanal.map(item => item.total);
        }

        if (stats.produccion_por_proyecto && stats.produccion_por_proyecto.length) {
            proyectoLabels = stats.produccion_por_proyecto.map(p => p.nombre);
            proyectoData = stats.produccion_por_proyecto.map(p => p.total);
        }
    }

    // Weekly Production Chart
    const weeklyCtx = document.getElementById('dashboardWeeklyChart');
    if (weeklyCtx) {
        const existingWeekly = Chart.getChart(weeklyCtx);
        if (existingWeekly) existingWeekly.destroy();
        dashboardChartInstances.weekly = new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: weeklyLabels,
                datasets: [{
                    label: 'Producción Real (Unidades)',
                    data: weeklyData,
                    backgroundColor: 'rgba(153, 15, 12, 0.8)',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#616161' } },
                    x: { grid: { display: false }, ticks: { color: '#616161' } }
                }
            }
        });
    }

    // Top Proyectos Chart
    const processesCtx = document.getElementById('dashboardProcessesChart');
    if (processesCtx) {
        const existingProcesses = Chart.getChart(processesCtx);
        if (existingProcesses) existingProcesses.destroy();
        dashboardChartInstances.processes = new Chart(processesCtx, {
            type: 'doughnut',
            data: {
                labels: proyectoLabels.length ? proyectoLabels : ['Sin datos'],
                datasets: [{
                    data: proyectoData.length ? proyectoData : [1],
                    backgroundColor: chartColors.slice(0, Math.max(proyectoData.length, 1)),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#616161', padding: 15, font: { size: 12 } } }
                },
                cutout: '65%'
            }
        });
    }
}
function showDayDetail(userId, dateString) {
    const regs = sampleData.registrations.filter(r => (parseInt(r.userId) === parseInt(userId)) && r.fecha == dateString);

    const modalId = 'day-detail-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px);';

    const formattedDate = formatDate(dateString);

    let tableContent = '';
    if (regs.length === 0) {
        tableContent = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                <h4>No tienes registros para este día</h4>
                <p>Haz clic en el botón de abajo para empezar a registrar tu trabajo.</p>
                <button class="btn btn-primary" onclick="window.nextRegistrationDate = '${dateString}'; const fInput = document.getElementById('fecha'); if(fInput) fInput.value = '${dateString}'; document.getElementById('day-detail-modal').remove(); document.querySelector('[data-module=\\'registro\\']').click();" style="margin-top: 1.5rem;">
                    ➕ Ir a Registrar
                </button>
            </div>
        `;
    } else {
        tableContent = `
            <div class="table-container" style="border-radius: 8px; border: 1px solid #eee;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Proceso</th>
                            <th>Subproceso</th>
                            <th>Cantidad</th>
                            <th>Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regs.map(r => {
            const proc = sampleData.processes.find(p => p.code === r.codigo);
            const isNovelty = r.type === 'novedad_total';

            // Build subproceso cell content
            let subprocesoContent = r.subproceso || '-';
            if (r.subprocesos_detalle && r.subprocesos_detalle.length > 0) {
                const details = r.subprocesos_detalle.map(d =>
                    `<div style="display: flex; justify-content: space-between; font-size: 0.85em;"><span>${d.name}</span> <span style="font-weight: 600;">${d.cantidad}</span></div>`
                ).join('');
                subprocesoContent = `<div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="font-weight: 500; margin-bottom: 2px;">Múltiples:</div>
                    ${details}
                </div>`;
            }

            return `
                            <tr style="${isNovelty ? 'background-color: #f0f7ff;' : ''}">
                                <td><span style="font-weight: 500;">${r.cliente || 'GADIER'}</span></td>
                                <td>
                                    ${isNovelty ?
                    `<span class="badge" style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${r.novelty?.type || 'Novedad'}</span>` :
                    `<span class="code-badge">${r.codigo}</span>`
                }
                                </td>
                                <td class="text-muted">${isNovelty ? (r.observaciones || '-') : subprocesoContent}</td>
                                <td>${isNovelty ? '-' : formatNumber(r.cantidad)}</td>
                                <td><span class="time-badge">${r.tiempo || '0:00'}</span></td>
                            </tr>
                        `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 16px; width: 95%; max-width: 800px; max-height: 80vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f0f0; margin-bottom: 1.5rem; padding-bottom: 1rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    📅 Resumen del Día: <span style="color: var(--primary-color);">${formattedDate}</span>
                </h3>
                <button class="btn-icon" onclick="document.getElementById('${modalId}').remove()" style="font-size: 1.5rem;">×</button>
            </div>
            
            ${tableContent}

            <div class="modal-footer" style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cerrar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}
