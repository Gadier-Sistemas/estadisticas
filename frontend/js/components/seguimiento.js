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

function renderAdminCalendar() {
    // Re-implement simplified calendar logic or adapt dashboard.js renderCalendar
    // For now, let's create a basic view
    const calendarEl = document.getElementById('adminCalendar');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    calendarEl.innerHTML = `
        <div style="text-align: right; margin-bottom: 1rem;">
            <strong>${today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</strong>
        </div>
        <div class="calendar-grid">
            ${generateCalendarDays(year, month, currentTrackingId)}
        </div>
    `;
}

function generateCalendarDays(year, month, userId) {
    // Need access to registrations
    const regs = window.sampleData.registrations.filter(r => parseInt(r.userId) === parseInt(userId));

    // Logic similar to dashboard but returning HTML string
    // Simplified for plan: Just placeholders
    return `<div style="padding: 2rem; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 12px;">
        Aquí se cargará el calendario del usuario ${userId} usando la misma lógica visual.
    </div>`;
}
