// Daily Registration Alert System

/**
 * Get all registrations for a specific user
 */
function getUserRegistrations(userId) {
    // This would come from backend/database
    // For now, return mock data from sampleData.statistics filtered by user
    if (typeof sampleData !== 'undefined' && sampleData.registrations) {
        return sampleData.registrations.filter(r => r.userId === userId);
    }
    return [];
}

/**
 * Check if user has registration for a specific date
 */
function hasRegistrationForDate(userId, date) {
    const registrations = getUserRegistrations(userId);
    return registrations.some(r => r.fecha === date);
}

/**
 * Get missing registration dates for a user
 * Checks last 30 days
 */
function getMissingRegistrationDates(userId) {
    const missing = [];
    const today = new Date();
    const currentUser = getCurrentUser();

    // Only check for operarios
    if (currentUser.rol !== 'operario' && userId !== currentUser.id) {
        return missing;
    }

    // Check last 30 days (excluding weekends and today)
    for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
        }

        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        if (!hasRegistrationForDate(userId, dateString)) {
            missing.push({
                date: dateString,
                dayName: getDayName(dateString),
                daysAgo: i
            });
        }
    }

    return missing.sort((a, b) => b.daysAgo - a.daysAgo); // Most recent first
}

/**
 * Get consecutive missing days (from yesterday backwards)
 */
function getConsecutiveMissingDays(userId) {
    const missing = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        // Skip weekends
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
        }

        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        if (!hasRegistrationForDate(userId, dateString)) {
            missing.push({
                date: dateString,
                dayName: getDayName(dateString),
                daysAgo: i
            });
        } else {
            // Stop counting when we find a filled day
            break;
        }
    }

    return missing;
}

/**
 * Generate alerts for a user based on missing registrations and daily targets
 */
function getUserAlerts(userId) {
    const consecutiveMissing = getConsecutiveMissingDays(userId);
    const alerts = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Check Daily Target for Today
    const registrations = getUserRegistrations(userId);
    const todayRegs = registrations.filter(r => r.fecha === today);
    const targets = JSON.parse(localStorage.getItem('app_daily_targets') || '{}');
    const targetCount = targets[`${userId}_${today}`] || 1;

    if (todayRegs.length > 0 && todayRegs.length < targetCount) {
        alerts.push({
            id: `alert-${userId}-target-incomplete`,
            type: 'warning',
            severity: 'warning',
            target: 'user',
            title: '⚠️ Registros Incompletos',
            message: `Has guardado <strong>${todayRegs.length} de los ${targetCount}</strong> procesos realizados hoy.`,
            daysCount: 0,
            action: {
                label: 'Agregar Registro',
                onClick: `fillMissingDay('${today}')`
            }
        });
    }

    if (consecutiveMissing.length === 0) {
        return alerts;
    }

    // 2. Missing Days Alerts (1 day)
    if (consecutiveMissing.length === 1) {
        alerts.push({
            id: `alert-${userId}-1day`,
            type: 'warning',
            severity: 'warning',
            target: 'user',
            title: '⚠️ Registro Pendiente',
            message: `No llenaste el registro del día <strong>${formatDate(consecutiveMissing[0].date)}</strong> (${consecutiveMissing[0].dayName}).`,
            missingDates: consecutiveMissing,
            daysCount: 1,
            action: {
                label: 'Llenar Ahora',
                onClick: `fillMissingDay('${consecutiveMissing[0].date}')`
            }
        });
    }

    // 3. Critical Alerts (2+ days)
    if (consecutiveMissing.length >= 2) {
        const user = getUserById(userId);

        alerts.push({
            id: `alert-${userId}-critical`,
            type: 'critical',
            severity: 'critical',
            target: 'user',
            title: '🚨 Registros Pendientes',
            message: `Tienes <strong>${consecutiveMissing.length} días</strong> sin llenar el registro. Por favor, completa tus registros pendientes.`,
            missingDates: consecutiveMissing,
            daysCount: consecutiveMissing.length,
            action: {
                label: 'Ver Faltantes',
                onClick: 'showMissingDaysModal()'
            }
        });

        // Alert for superadmin
        alerts.push({
            id: `alert-superadmin-${userId}`,
            type: 'superadmin-critical',
            severity: 'critical',
            target: 'superadmin',
            userId: userId,
            userName: user ? `${user.name} ${user.apellido}` : 'Usuario',
            userCode: user ? user.codigo : '-',
            title: '🚨 Operario sin Registro',
            message: `<strong>${user ? `${user.name} ${user.apellido}` : 'Operario'}</strong> no ha llenado el registro por <strong>${consecutiveMissing.length} días</strong> consecutivos.`,
            missingDates: consecutiveMissing,
            daysCount: consecutiveMissing.length
        });
    }

    return alerts;
}

/**
 * Get all alerts for superadmin (from all operarios)
 */
function getSuperadminAlerts() {
    const alerts = [];

    // Get all operarios
    const operarios = window.usuariosData ?
        window.usuariosData.filter(u => u.rol === 'operario' && u.activo) :
        sampleData.operators.map((op, i) => ({ id: i + 1, ...op, rol: 'operario' }));

    operarios.forEach(operario => {
        const userAlerts = getUserAlerts(operario.id);
        const superadminAlerts = userAlerts.filter(a => a.target === 'superadmin');
        alerts.push(...superadminAlerts);
    });

    return alerts.sort((a, b) => b.daysCount - a.daysCount); // Most severe first
}

/**
 * Get alerts for current user
 */
function getCurrentUserAlerts() {
    const user = getCurrentUser();

    if (!user) return [];

    if (user.rol === 'superadmin') {
        return getSuperadminAlerts();
    }

    if (user.rol === 'operario') {
        const userAlerts = getUserAlerts(user.id);
        return userAlerts.filter(a => a.target === 'user');
    }

    return [];
}

/**
 * Render alerts in UI
 */
function renderAlerts() {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    const alerts = getCurrentUserAlerts();

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '';
        return;
    }

    // Show alert badge
    alertsContainer.innerHTML = `
        <div class="alert-badge" onclick="toggleAlertsPanel()">
            <span class="alert-icon">🔔</span>
            <span class="alert-count">${alerts.length}</span>
        </div>
    `;
}

/**
 * Toggle alerts panel
 */
function toggleAlertsPanel() {
    const existingPanel = document.getElementById('alertsPanel');

    if (existingPanel) {
        existingPanel.remove();
        return;
    }

    const alerts = getCurrentUserAlerts();

    const panel = document.createElement('div');
    panel.id = 'alertsPanel';
    panel.className = 'alerts-panel';
    panel.innerHTML = `
        <div class="alerts-panel-header">
            <h3>🔔 Notificaciones</h3>
            <button class="btn-icon-small" onclick="toggleAlertsPanel()">✕</button>
        </div>
        <div class="alerts-panel-body">
            ${alerts.map(alert => `
                <div class="alert alert-${alert.severity}">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    ${alert.action ? `
                        <button class="btn btn-sm" onclick="${alert.action.onClick}">
                            ${alert.action.label}
                        </button>
                    ` : ''}
                    ${alert.missingDates && alert.missingDates.length > 0 ? `
                        <div class="alert-dates">
                            ${alert.missingDates.slice(0, 3).map(d => `
                                <span class="missing-date-badge">${formatDate(d.date)}</span>
                            `).join('')}
                            ${alert.missingDates.length > 3 ? `
                                <span class="text-muted">+${alert.missingDates.length - 3} más</span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(panel);

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', closeAlertsOnClickOutside);
    }, 100);
}

function closeAlertsOnClickOutside(e) {
    const panel = document.getElementById('alertsPanel');
    const badge = document.querySelector('.alert-badge');

    if (panel && !panel.contains(e.target) && !badge.contains(e.target)) {
        panel.remove();
        document.removeEventListener('click', closeAlertsOnClickOutside);
    }
}

/**
 * Helper to get user by ID
 */
function getUserById(id) {
    if (window.usuariosData) {
        return window.usuariosData.find(u => u.id === id);
    }
    return sampleData.operators.find(u => u.id === id);
}

/**
 * Fill missing day (navigate to registro with date pre-filled)
 */
function fillMissingDay(date) {
    // Navigate to registro
    document.querySelector('[data-module="registro"]').click();

    // Pre-fill date
    setTimeout(() => {
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) {
            fechaInput.value = date;
            fechaInput.dispatchEvent(new Event('change'));
        }
        toggleAlertsPanel(); // Close panel
    }, 100);
}

/**
 * Show modal with all missing days
 */
function showMissingDaysModal() {
    const user = getCurrentUser();
    const allMissing = getMissingRegistrationDates(user.id);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>📅 Días Faltantes</h3>
                <button class="btn-icon-small" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <p>Tienes <strong>${allMissing.length} registros pendientes</strong>:</p>
                <div class="missing-days-list">
                    ${allMissing.map(d => `
                        <div class="missing-day-item">
                            <span>${formatDate(d.date)} - ${d.dayName}</span>
                            <button class="btn btn-sm" onclick="fillMissingDay('${d.date}'); this.closest('.modal-overlay').remove();">
                                Llenar
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    toggleAlertsPanel(); // Close alerts panel
}
