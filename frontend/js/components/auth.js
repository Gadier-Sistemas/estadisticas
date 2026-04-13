const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal 
    ? 'http://127.0.0.1:8001/api' 
    : 'https://api-estadisticas.gadier.cloud/api';

// Mock current user (will be replaced with real backend authentication)
let currentUser = {
    id: 1,
    name: 'Operario',
    apellido: 'GADIER',
    username: 'operario',
    rol: 'operario', // 'operario' or 'superadmin'
    codigo: 'OP001',
    activo: true
};

/**
 * Obtiene el usuario autenticado actualmente desde el SessionStorage.
 * @returns {Object|null} El objeto de usuario o null si no está autenticado.
 */
function getCurrentUser() {
    // Check sessionStorage first
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        return currentUser;
    }

    // Default to null (Require Login)
    return null;
}

/**
 * Establece el usuario actual en la sesión y lo persiste en LocalStorage.
 * @param {Object} user - El objeto de usuario a establecer.
 */
function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    // Also persist to localStorage for "Kiosk" effect across reloads
    localStorage.setItem('currentUser', JSON.stringify(user));
}



/**
 * Check if user has specific role
 */
function hasRole(role) {
    const user = getCurrentUser();
    return user.rol === role;
}

/**
 * Check if user is superadmin
 */
function isSuperadmin() {
    // Check purely based on role string
    return getCurrentUser().rol === 'superadmin';
}

/**
 * Check if user is operario
 */
function isOperario() {
    return getCurrentUser().rol === 'operario';
}

/**
 * Check if user can access a specific module
 */
function canAccessModule(moduleName) {
    const user = getCurrentUser();

    // Superadmin can access everything
    if (user.rol === 'superadmin') {
        return true;
    }

    // Operario can now access usuarios too
    if (user.rol === 'operario') {
        return ['dashboard', 'registro', 'usuarios'].includes(moduleName);
    }

    return false;
}

/**
 * Get allowed modules for current user
 */
function getAllowedModules() {
    const user = getCurrentUser();

    if (user.rol === 'superadmin') {
        return ['dashboard', 'registro', 'procesos', 'usuarios', 'reportes', 'consolidado', 'seguimiento'];
    }

    if (user.rol === 'operario') {
        // Add usuarios to the list
        return ['dashboard', 'registro', 'usuarios'];
    }

    return [];
}

/**
 * Get all registered users from API
 */
async function syncUsers() {
    if (!sessionStorage.getItem('isAuthenticated')) return;

    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            window.usuariosData = await response.json();
            console.log('✅ Usuarios sincronizados:', window.usuariosData.length);
        }
    } catch (error) {
        console.error('❌ Error sincronizando usuarios:', error);
    }
}

function getUsers() {
    return window.usuariosData || [];
}



/**
 * Realiza la autenticación contra la API de Laravel.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña.
 * @returns {Promise<Object>} Resultado de la operación {success, user, error}.
 */
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar token y datos del usuario
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('authToken', data.access_token);

            // Adaptar formato de usuario para compatibilidad con el front actual
            const user = {
                id: data.user.id,
                name: data.user.name,
                apellido: data.user.lastname || '',
                username: data.user.username,
                rol: data.user.rol,
                codigo: data.user.codigo,
                activo: true
            };

            setCurrentUser(user);
            return { success: true, user: user };
        } else {
            return { success: false, error: data.message || 'Credenciales inválidas' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Error de conexión con el servidor' };
    }
}



/**
 * Cierra la sesión del usuario actual, revoca el token en el backend y limpia el STORAGE.
 * @returns {Promise<void>}
 */
async function logout() {
    const token = sessionStorage.getItem('authToken');

    if (token) {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (e) {
            console.warn('Error reporting logout to server:', e);
        }
    }

    sessionStorage.clear();
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'login.html';
}

/**
 * Switch user (for testing purposes)
 */
function switchToOperario() {
    const operario = {
        id: 1,
        name: 'Operario',
        apellido: 'GADIER',
        email: 'operario@gadier.com',
        rol: 'operario',
        codigo: 'OP001',
        activo: true
    };
    setCurrentUser(operario);
    showToast('👤 Cambiado a rol: Operario', 'info');
}

function switchToSuperadmin() {
    const admin = {
        id: 2,
        name: 'Admin',
        apellido: 'Sistema',
        email: 'admin@gadier.com',
        rol: 'superadmin',
        codigo: 'ADM001',
        activo: true
    };
    setCurrentUser(admin);
    showToast('👨‍💼 Cambiado a rol: Superadmin', 'info');
}

/**
 * Initialize authentication module
 */
function initAuth() {
    // Check if session exists
    const user = getCurrentUser();

    if (user) {
        // Start inactivity timer if logged in
        initInactivityTimer();
    }
    console.log('Usuario actual:', user);

    // Expose functions globally
    window.getUsers = getUsers;
    window.getCurrentUser = getCurrentUser;
    window.isOperario = isOperario;
    window.isSuperadmin = isSuperadmin;
    window.logout = logout;
    window.login = login;
    window.syncUsers = syncUsers;

    // Expose reset function for testing/recovery
    window.resetUsers = function () {
        localStorage.removeItem('app_users');
        getUsers(); // Reloads defaults
        showToast('🔄 Datos de usuario restablecidos', 'success');
        setTimeout(() => location.reload(), 1000);
    };

    // Update UI based on role
    updateUIForRole();
}

/**
 * Inactivity Timer (5 minutes)
 */
function initInactivityTimer() {
    let inactivityTimeout;
    const timeoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

    function resetTimer() {
        if (inactivityTimeout) {
            clearTimeout(inactivityTimeout);
        }

        inactivityTimeout = setTimeout(() => {
            console.log("Inactividad detectada. Cerrando sesión...");
            if (window.logout) {
                window.logout();
            } else {
                // Fallback if app.js is not loaded or logout not global
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }, timeoutDuration);
    }

    // List of interaction events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Add listeners
    events.forEach(name => {
        document.addEventListener(name, resetTimer, true);
    });

    // Initial start
    resetTimer();
}

