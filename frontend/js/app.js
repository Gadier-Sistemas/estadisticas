// Main Application Logic
const sampleData = {
    // Sync operators with real users from auth.js
    get operators() {
        return (typeof getUsers === 'function') ? getUsers() : [];
    },
    customers: ['GADIER', 'Cliente Externo', 'Empresas Unidas', 'Servicios Especiales'],
    processes: [], // Will be loaded from API
    projects: [],  // Will be loaded from API
    registrations: [], // Will be loaded from API
};

async function syncRegistrations() {
    if (!sessionStorage.getItem('isAuthenticated')) return;

    console.log('🔄 Sincronizando registros con la API...');
    try {
        const response = await fetch(`${API_URL}/registros`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Map API properties to frontend expected names
            sampleData.registrations = data.map(reg => ({
                ...reg,
                userId: reg.user_id || reg.userId,
                codigo: reg.proceso ? (reg.proceso.codigo || reg.proceso.code) : (reg.codigo || reg.code),
                // Ensure other fields are present
                cantidad: parseInt(reg.cantidad || 0),
                tiempo: reg.tiempo || '0:00'
            }));

            updateSampleDataStats();
            console.log('✅ Registros sincronizados y mapeados:', sampleData.registrations.length);

            // Re-render current module if it depends on registrations
            const activeModule = document.querySelector('.module.active');
            if (activeModule && activeModule.id === 'module-dashboard') {
                if (typeof loadDashboardModule === 'function') loadDashboardModule();
            }
        }
    } catch (error) {
        console.error('❌ Error sincronizando registros:', error);
    }
}

async function loadInitialData() {
    if (!sessionStorage.getItem('isAuthenticated')) return;

    try {
        // Load Users
        if (typeof syncUsers === 'function') {
            await syncUsers();
        }

        // Load Processes
        const procResponse = await fetch(`${API_URL}/procesos`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            }
        });
        if (procResponse.ok) {
            sampleData.processes = await procResponse.json();
            console.log('✅ Procesos cargados:', sampleData.processes.length);
        }

        // Load Projects
        const projResponse = await fetch(`${API_URL}/proyectos`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            }
        });
        if (projResponse.ok) {
            sampleData.projects = await projResponse.json();
            console.log('✅ Proyectos cargados:', sampleData.projects.length);
        }

        // Initial sync of registrations
        await syncRegistrations();
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
    }
}

function getRegistrations() {
    const stored = localStorage.getItem('app_registrations');
    let regs = [];
    if (stored) {
        regs = JSON.parse(stored);
    } else {
        // Default initial data
        regs = [
            { id: 1, userId: 1, fecha: '2026-01-09', codigo: 'BC16', cantidad: 700, tiempo: '9:00', observaciones: 'Normal' },
            { id: 2, userId: 1, fecha: '2026-01-08', codigo: 'BC17', cantidad: 800, tiempo: '8:30', observaciones: '' },
            { id: 3, userId: 2, fecha: '2026-01-09', codigo: 'BC6', cantidad: 35, tiempo: '7:00', observaciones: '' }
        ];
        localStorage.setItem('app_registrations', JSON.stringify(regs));
    }
    return regs;
}

async function saveRegistration(regData) {
    if (!sessionStorage.getItem('isAuthenticated')) return;

    console.log('💾 Enviando registro a la API:', regData);

    try {
        const response = await fetch(`${API_URL}/registros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                user_id: regData.userId,
                proyecto_id: regData.proyecto_id,
                proceso_codigo: regData.codigo,
                fecha: regData.fecha,
                cantidad: regData.cantidad,
                tiempo: regData.tiempo,
                cliente: regData.cliente,
                observaciones: regData.observaciones,
                tipo: regData.type,
                novedad_tipo: regData.novelty ? regData.novelty.type : null
            })
        });

        if (response.ok) {
            const newReg = await response.json();
            console.log('✅ Registro guardado en API:', newReg);

            // Sincronizar para actualizar la interfaz
            await syncRegistrations();
            return newReg;
        } else {
            const error = await response.json();
            console.error('❌ Error al guardar registro:', error);
            showToast('❌ Error: ' + (error.message || 'No se pudo guardar'), 'error');
            return null;
        }
    } catch (error) {
        console.error('❌ Error de red al guardar registro:', error);
        showToast('❌ Error de conexión al guardar', 'error');
        return null;
    }
}

// Add statistics with Performance calculation
function updateSampleDataStats() {
    sampleData.statistics = sampleData.registrations.map(reg => {
        const isNovelty = reg.type === 'novedad_total';
        const operatorName = (sampleData.operators || []).find(op => parseInt(op.id) === parseInt(reg.userId))?.name || 'Unknown';

        const procCode = reg.proceso ? (reg.proceso.codigo || reg.proceso.code) : (reg.codigo || reg.code);
        const process = sampleData.processes.find(p => (p.codigo || p.code) === procCode);
        const processName = isNovelty ? (reg.novelty?.type || 'Ausencia Total') : (process?.name || 'Desconocido');

        let rendimiento = 0;
        if (!isNovelty && process && reg.tiempo) {
            // Formula: Cantidad / ((Meta / 540) * TotalMinutos)
            const parts = reg.tiempo.split(':');
            const totalMinutos = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
            const metaDiaria = process.cantidad || 0;
            const produccionEsperada = (metaDiaria / 540) * totalMinutos;

            if (produccionEsperada > 0) {
                rendimiento = (reg.cantidad / produccionEsperada) * 100;
            }
        }

        return {
            id: reg.id,
            date: reg.fecha,
            operator: operatorName,
            operatorId: parseInt(reg.userId),
            process: isNovelty ? 'NOVEDAD' : reg.codigo,
            processName: processName,
            customer: isNovelty ? '-' : (reg.cliente || 'GADIER'),
            quantity: reg.cantidad || 0,
            time: parseFloat((reg.tiempo || '0:00').replace(':', '.')) || 0,
            timeRaw: reg.tiempo || '0:00',
            observations: reg.observaciones || '',
            type: reg.type || 'produccion',
            rendimiento: parseFloat(rendimiento.toFixed(1))
        };
    });
}
updateSampleDataStats();

// Initialize App
document.addEventListener('DOMContentLoaded', function () {
    // Authentication check for Login
    if (!sessionStorage.getItem('isAuthenticated')) {
        window.location.href = 'login.html';
        return;
    }

    initAuth(); // Initialize authentication first
    initNavigation();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute

    // Load initial data from API
    loadInitialData();

    loadModules();
    renderAlerts(); // Render alerts after everything is loaded
});

// Navigation System
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Get module name
            const moduleName = this.getAttribute('data-module');

            // Check if user can access this module
            if (!canAccessModule(moduleName)) {
                showToast('❌ No tienes acceso a este módulo', 'error');
                return;
            }

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Hide all modules
            document.querySelectorAll('.module').forEach(module => {
                module.classList.remove('active');
            });

            // Show selected module
            const targetModule = document.getElementById(`module-${moduleName}`);
            if (targetModule) {
                targetModule.classList.add('active');

                // Re-render dashboard if selected to show fresh data
                if (moduleName === 'dashboard') {
                    if (typeof loadDashboardModule === 'function') loadDashboardModule();
                }

                // Prepare registration form if selected
                if (moduleName === 'registro') {
                    // Only clear if NOT coming from a calendar jump
                    if (!window.nextRegistrationDate) {
                        if (typeof clearRegistroForm === 'function') clearRegistroForm();
                    } else {
                        // If coming from calendar, ensure the date is applied even if the form was already rendered
                        const fInput = document.getElementById('fecha');
                        if (fInput) {
                            fInput.value = window.nextRegistrationDate;
                            const status = document.getElementById('fechaStatus');
                            if (status) status.textContent = '📍 Registrando para día seleccionado: ' + window.nextRegistrationDate;
                        }
                        // Note: DON'T clear window.nextRegistrationDate here yet, let the form module handle it or handle it after applying.
                        // Actually, let's clear it now since we applied it.
                        window.nextRegistrationDate = null;
                    }
                }
            }
        });
    });

    // Update UI for current role
    updateUIForRole();
}

// Update UI based on user role
function updateUIForRole() {
    const user = getCurrentUser();
    const allowedModules = getAllowedModules();

    // Hide/show navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const moduleName = item.getAttribute('data-module');
        if (!allowedModules.includes(moduleName)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });

    // Update user icon
    const userIcon = document.getElementById('userIcon');
    if (userIcon) {
        userIcon.textContent = user.rol === 'superadmin' ? '👨‍💼' : '👤';
    }

    // Render alerts
    renderAlerts();
}

// Update Date/Time Display
function updateDateTime() {
    const dateDisplay = document.getElementById('currentDate');
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateDisplay.textContent = now.toLocaleDateString('es-ES', options);
}

// Dashboard Charts
// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load Module Content (implemented in respective module files)
function loadModules() {
    loadDashboardModule();
    loadRegistroModule();
    loadProcesosModule();
    loadUsuariosModule();
    loadReportesModule();
    loadConsolidadoModule();
}

// Utility Functions
function formatNumber(num) {
    return new Intl.NumberFormat('es-ES').format(num);
}

function formatDate(dateInput) {
    if (!dateInput) return '';

    if (dateInput instanceof Date) {
        return dateInput.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const [year, month, day] = dateInput.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
}

// User Menu Toggle
function toggleUserMenu() {
    const existingMenu = document.getElementById('userMenuPanel');

    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const user = getCurrentUser();

    const menu = document.createElement('div');
    menu.id = 'userMenuPanel';
    menu.className = 'user-menu-panel';
    menu.innerHTML = `
        <div class="user-menu-header">
            <div class="user-avatar">${user.rol === 'superadmin' ? '👨‍💼' : '👤'}</div>
            <div class="user-info">
                <strong>${user.name} ${user.lastname || user.apellido || ''}</strong>
                <span class="user-role-badge role-${user.rol}">${user.rol === 'superadmin' ? 'Superadmin' : 'Operario'}</span>
            </div>
        </div>
        <div class="user-menu-body">
            <div class="user-menu-item">
                <span>📧 ${user.email}</span>
            </div>
            ${user.codigo ? `
                <div class="user-menu-item">
                    <span>🔖 ${user.codigo}</span>
                </div>
            ` : ''}
        </div>
        <div class="user-menu-footer">
            <button class="btn-logout" onclick="logout()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H5C3.34315 20 2 18.6569 2 17V7C2 5.34315 3.34315 4 5 4H10C11.6569 4 13 5.34315 13 7V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Cerrar Sesión
            </button>
        </div>
    `;

    document.body.appendChild(menu);

    // Position near user icon
    const userBtn = document.getElementById('userMenuBtn');
    const rect = userBtn.getBoundingClientRect();
    menu.style.top = (rect.bottom + 10) + 'px';
    menu.style.right = '20px';

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', closeUserMenuOnClickOutside);
    }, 100);
}

function closeUserMenuOnClickOutside(e) {
    const menu = document.getElementById('userMenuPanel');
    const btn = document.getElementById('userMenuBtn');

    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeUserMenuOnClickOutside);
    }
}

// Logout handled by auth.js

