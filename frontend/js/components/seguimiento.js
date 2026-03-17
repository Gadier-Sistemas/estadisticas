function loadSeguimientoModule() {
    const moduleContainer = document.getElementById('module-seguimiento');

    moduleContainer.innerHTML = `
        <div class="module-header">
            <h2>🔎 Seguimiento de Personal</h2>
            <p class="module-description">Control de asistencia y novedades por funcionario</p>
        </div>

        <div style="display: grid; grid-template-columns: 250px 1fr; gap: 1.5rem; height: calc(100vh - 200px);">
            <!-- Sidebar: User List -->
            <div class="card" style="padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <input type="text" id="searchOperario" placeholder="Buscar funcionario..." 
                           style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div id="operatorsList" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- List populated dynamically -->
                </div>
            </div>

            <!-- Main: Calendar & Details -->
            <div class="card" style="padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column;">
                <div id="seguimientoEmptyState" style="text-align: center; margin-top: 3rem; color: #94a3b8;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <h3>Selecciona un funcionario</h3>
                    <p>Elige un usuario de la lista para ver su calendario y novedades.</p>
                </div>
                
                <div id="seguimientoContent" style="display: none;">
                    <div class="user-profile-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
                        <div class="user-avatar-large" style="width: 64px; height: 64px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">
                            JD
                        </div>
                        <div>
                            <h3 id="selectedUserName" style="margin: 0; color: var(--primary-color);">Juan Doe</h3>
                            <p id="selectedUserCode" style="margin: 0; color: var(--text-muted);">OP001</p>
                        </div>
                    </div>

                    <div class="calendar-wrapper" id="adminCalendar" style="flex: 1;">
                        <!-- Reusing calendar styles but with admin logic -->
                    </div>
                </div>
            </div>
        </div>
    `;

    loadOperatorsList();

    // Search Handler
    document.getElementById('searchOperario').addEventListener('input', (e) => {
        loadOperatorsList(e.target.value);
    });
}

function loadOperatorsList(filter = '') {
    const list = document.getElementById('operatorsList');
    const users = window.getUsers ? window.getUsers() : []; // From auth.js
    const operators = users.filter(u => u.rol === 'operario');

    const filtered = filter
        ? operators.filter(op => op.name.toLowerCase().includes(filter.toLowerCase()) || op.apellido.toLowerCase().includes(filter.toLowerCase()))
        : operators;

    list.innerHTML = filtered.map(op => `
        <button class="operator-item-btn" onclick="selectOperatorForTracking(${op.id})" style="
            display: flex; align-items: center; gap: 0.75rem; 
            width: 100%; padding: 0.75rem; border: none; background: transparent; 
            cursor: pointer; text-align: left; border-radius: 8px; transition: all 0.2s;
        ">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #64748b; font-weight: 600;">
                ${op.name.charAt(0)}${op.apellido ? op.apellido.charAt(0) : ''}
            </div>
            <div>
                <div style="font-weight: 500; color: var(--text-color);">${op.name} ${op.apellido || ''}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${op.username}</div>
            </div>
        </button>
    `).join('');
}

// Store currently selected ID
let currentTrackingId = null;

function selectOperatorForTracking(userId) {
    currentTrackingId = userId;
    const users = window.getUsers();
    const user = users.find(u => u.id === userId);

    document.getElementById('seguimientoEmptyState').style.display = 'none';
    document.getElementById('seguimientoContent').style.display = 'block';

    document.getElementById('selectedUserName').textContent = `${user.name} ${user.apellido || ''}`;
    document.getElementById('selectedUserCode').textContent = user.username;

    // Highlight selected in sidebar
    document.querySelectorAll('.operator-item-btn').forEach(btn => {
        btn.style.background = 'transparent';
    });
    // This simple highlight logic might need DOM ref if we want perfect persistence, but clicking works

    renderAdminCalendar();
}

let seguimientoMonth = new Date().getMonth();
let seguimientoYear = new Date().getFullYear();

function renderAdminCalendar() {
    const calendarEl = document.getElementById('adminCalendar');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    calendarEl.innerHTML = `
        <div class="calendar-container" style="padding: 0;">
            <div class="calendar-header" style="justify-content: flex-end; gap: 1rem; margin-bottom: 1rem;">
                <button class="btn-icon" onclick="changeSeguimientoMonth(-1)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <h3 style="margin: 0;">${monthNames[seguimientoMonth]} ${seguimientoYear}</h3>
                <button class="btn-icon" onclick="changeSeguimientoMonth(1)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="calendar-grid">
                ${generateCalendarDays(seguimientoYear, seguimientoMonth, currentTrackingId)}
            </div>
             <div class="calendar-legend" style="margin-top: 1rem;">
                <div class="legend-item"><span class="legend-dot success">✓</span><span>Reporte subido</span></div>
                <div class="legend-item"><span class="legend-dot warning">⚠</span><span>Falta reporte</span></div>
                <div class="legend-item"><span class="legend-dot" style="background: #3b82f6;">ℹ</span><span>Novedad Total</span></div>
            </div>
        </div>
    `;
}

function changeSeguimientoMonth(direction) {
    seguimientoMonth += direction;
    if (seguimientoMonth > 11) {
        seguimientoMonth = 0;
        seguimientoYear++;
    } else if (seguimientoMonth < 0) {
        seguimientoMonth = 11;
        seguimientoYear--;
    }
    renderAdminCalendar();
}

function generateCalendarDays(year, month, userId) {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let html = '';

    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    const targets = JSON.parse(localStorage.getItem('app_daily_targets') || '{}');

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;

        const reportsForDate = window.sampleData.registrations.filter(r =>
            parseInt(r.userId) === parseInt(userId) && r.fecha === dateString
        );
        const count = reportsForDate.length;

        const targetForDate = targets[`${userId}_${dateString}`] || 1;
        const hasReachedTarget = count >= targetForDate;
        const hasAnyReport = count > 0;
        const isPureNovelty = hasAnyReport && reportsForDate.every(r => r.type === 'novedad_total' || r.tipo === 'novedad_total');

        let dayClass = 'calendar-day';
        let indicator = '';

        if (isToday) dayClass += ' today';

        if (isFuture) {
            dayClass += ' future';
            indicator = '<span class="day-indicator future">•</span>';
        } else if (isPureNovelty) {
            dayClass += ' novelty';
            indicator = '<span class="day-indicator info" style="color: #3b82f6;">ℹ</span>';
        } else if (hasReachedTarget) {
            dayClass += ' success';
            indicator = '<span class="day-indicator success">✓</span>';
        } else if (hasAnyReport) {
            dayClass += ' warning-partial';
            indicator = `<span class="day-indicator warning" title="${count}/${targetForDate} completed">⏳</span>`;
        } else {
            dayClass += ' warning';
            indicator = '<span class="day-indicator warning">⚠</span>';
        }

        html += `
            <div class="${dayClass}" onclick="if(typeof showDayDetail === 'function') showDayDetail(${userId}, '${dateString}')" style="cursor: pointer; ${isPureNovelty ? 'background-color: #eff6ff; border-color: #3b82f6;' : ''}">
                <span class="day-number" style="${isPureNovelty ? 'color: #1e40af;' : ''}">${day}</span>
                ${indicator}
            </div>
        `;
    }
    return html;
}

