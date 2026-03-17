// Usuarios/Operarios Module Content
function loadUsuariosModule() {
    const usuariosModule = document.getElementById('module-usuarios');
    const currentUser = window.getCurrentUser();
    const isSuperadmin = currentUser.rol === 'superadmin';

    // If superadmin, show full management
    if (isSuperadmin) {
        renderAdminUserTable(usuariosModule);
    } else {
        // If operario, show "Switch User" Kiosk View
        renderUserSwitcher(usuariosModule);
    }
}

// --- ADMIN VIEW (Full CRUD) ---
function renderAdminUserTable(container) {
    container.innerHTML = `
        <div class="module-header">
            <div>
                <h2>Gestión de Usuarios</h2>
                <p class="module-description">Administración de operarios y usuarios del sistema</p>
            </div>
            <button class="btn btn-secondary" onclick="renderUserSwitcher(document.getElementById('module-usuarios'))" style="margin-left: auto;">
                🔄 Cambiar Usuario
            </button>
        </div>

        <div class="usuarios-container">
            <!-- User Form Section -->
            <div class="usuarios-form-section">
                <div class="form-card">
                    <div class="form-header">
                        <h3 id="formTitle">👤 Nuevo Usuario</h3>
                    </div>
                    
                    <form id="usuarioForm" class="form-grid">
                        <input type="hidden" id="usuarioId" value="">
                        
                        <div class="form-group">
                            <label for="usuarioNombre">Nombre</label>
                            <input type="text" id="usuarioNombre" placeholder="Ej: Juan" required>
                        </div>

                        <div class="form-group">
                            <label for="usuarioApellido">Apellido</label>
                            <input type="text" id="usuarioApellido" placeholder="Ej: Pérez" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="usuarioEmail">Nombre de Usuario</label>
                            <input type="text" id="usuarioEmail" placeholder="Ej: jperalez" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="usuarioCedula">Documento de Identidad</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <select id="usuarioTipoDocumento" style="width: 80px; flex-shrink: 0;" required>
                                    <option value="CC">CC</option>
                                    <option value="CE">CE</option>
                                    <option value="TI">TI</option>
                                    <option value="PA">PA</option>
                                </select>
                                <input type="text" id="usuarioCedula" placeholder="Número de documento" required style="flex-grow: 1;">
                            </div>
                        </div>
                        
                        <!-- Password Field (New) -->
                        <div class="form-group">
                            <label for="usuarioPassword">Contraseña</label>
                            <div class="password-input-wrapper">
                                <input type="text" id="usuarioPassword" placeholder="Contraseña de acceso" required>
                                <button type="button" class="btn-icon-small" onclick="generarPassword()" title="Generar Contraseña">
                                    🎲
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="usuarioRol">Rol</label>
                            <select id="usuarioRol" required>
                                <option value="operario">Operario</option>
                                <option value="superadmin">Administrador</option>
                            </select>
                        </div>
                        
                        <!-- Generated Credentials Display -->
                        <div id="newCredentialsDisplay" class="form-group full-width" style="display: none;">
                            <div class="credentials-box">
                                <strong>🔐 Nuevas Credenciales:</strong>
                                <p>Usuario: <span id="displayEmail"></span></p>
                                <p>Password: <span id="displayPassword"></span></p>
                                <small>⚠️ Copie esta contraseña, no se podrá ver después.</small>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label class="checkbox-label">
                                <input type="checkbox" id="usuarioActivo" checked>
                                <span>Usuario Activo</span>
                            </label>
                        </div>

                        <div class="form-actions full-width">
                            <button type="button" class="btn btn-secondary" onclick="cancelarUsuarioForm()">
                                ✕ Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                💾 <span id="btnSubmitText">Guardar Usuario</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Quick Stats -->
                <div class="usuarios-stats">
                    <div class="stat-mini">
                        <span class="stat-mini-value" id="totalUsuarios">0</span>
                        <span class="stat-mini-label">Total Usuarios</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-value" id="usuariosActivos">0</span>
                        <span class="stat-mini-label">Activos</span>
                    </div>
                </div>
            </div>

            <!-- Users List Section -->
            <div class="usuarios-list-section">
                <div class="form-card">
                    <div class="usuarios-list-header">
                        <h3>📋 Lista de Usuarios</h3>
                        <div class="usuarios-list-actions">
                            <input type="text" class="search-box" id="usuariosSearch" placeholder="🔍 Buscar usuario...">
                            <button class="btn btn-primary" onclick="nuevoUsuario()">
                                ➕ Nuevo Usuario
                            </button>
                        </div>
                    </div>
                    
                    <div class="usuarios-grid" id="usuariosGrid">
                        ${renderUsuariosGrid()}
                    </div>
                </div>
            </div>
        </div>
    `;

    initUsuariosHandlers();
    updateUsuariosStats();
}

// --- KIOSK VIEW (Switch User) ---
function renderUserSwitcher(container) {
    const users = window.getUsers ? getUsers() : [];
    const currentUser = window.getCurrentUser();
    const isAdmin = currentUser && currentUser.rol === 'superadmin';

    // Filter out inactive users and map them
    const activeUsers = users.filter(u => u.activo);

    container.innerHTML = `
        <div class="module-header">
            <div style="flex: 1;">
                <h2>Cambiar de Usuario</h2>
                <p class="module-description">Seleccione un usuario e ingrese la contraseña para acceder.</p>
            </div>
            ${isAdmin ? `
                <button class="btn btn-secondary" onclick="renderAdminUserTable(document.getElementById('module-usuarios'))">
                    🔙 Volver a Gestión
                </button>
            ` : ''}
        </div>

        <div class="user-grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; padding: 1rem;">
            ${activeUsers.map(user => `
                <div class="user-card-kiosk" onclick="promptUserSwitch(${user.id}, '${user.name} ${user.apellido}')" 
                     style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); cursor: pointer; transition: all 0.2s; text-align: center; border: 2px solid transparent; display: flex; flex-direction: column; align-items: center;">
                    <div class="user-avatar-large" style="width: 80px; height: 80px; background: 
                        ${user.rol === 'superadmin' ? 'var(--secondary-color)' : 'var(--primary-color)'}; 
                        color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 1rem;">
                        ${getInitials(user.name, user.apellido)}
                    </div>
                    <h3 style="margin: 0; color: var(--text-color); font-size: 1.25rem;">${user.name}</h3>
                    <div style="color: var(--text-muted); font-size: 1rem; margin-top: 0.25rem;">${user.apellido || ''}</div>
                    <div style="margin-top: 0.75rem;">
                        <span class="role-badge role-${user.rol}" style="font-size: 0.85rem; padding: 0.25rem 0.75rem;">
                            ${user.rol === 'superadmin' ? 'Administrador' : 'Operario'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add CSS for hover execution
    if (!document.getElementById('kiosk-styles')) {
        const style = document.createElement('style');
        style.id = 'kiosk-styles';
        style.innerHTML = `
            .user-card-kiosk:hover {
                transform: translateY(-5px);
                border-color: var(--primary-color) !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }
}

// --- SWITCH USER LOGIC ---
function promptUserSwitch(userId, userName) {
    const modalId = 'password-modal';
    let modal = document.getElementById(modalId);

    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    // Use inline styles to ensure visibility
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div class="modal-header" style="justify-content: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">🔐 Acceso: ${userName}</h3>
            </div>
            <div class="modal-body">
                <p class="text-muted" style="margin-bottom: 1.5rem;">Por favor ingrese su contraseña</p>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <input type="password" id="switch-password" class="form-control" placeholder="Contraseña" style="width: 100%; padding: 0.75rem; text-align: center; font-size: 1.2rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                <div id="switch-error" style="display: none; color: #dc3545; margin-bottom: 1rem; font-size: 0.9rem;"></div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()" style="padding: 0.5rem 1.5rem;">Cancelar</button>
                <button class="btn btn-primary" onclick="confirmSwitchUser(${userId})" style="padding: 0.5rem 1.5rem;">Ingresar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-focus logic
    setTimeout(() => {
        const input = document.getElementById('switch-password');
        if (input) {
            input.focus();
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') confirmSwitchUser(userId);
            });
        }
    }, 100);
}

async function confirmSwitchUser(userId) {
    const passwordInput = document.getElementById('switch-password');
    const errorDiv = document.getElementById('switch-error');
    const password = passwordInput.value;

    if (!password) {
        if (errorDiv) {
            errorDiv.textContent = 'Ingrese la contraseña';
            errorDiv.style.display = 'block';
        }
        return;
    }

    const users = window.getUsers();
    const user = users.find(u => u.id === userId);

    if (window.login && user) {
        const result = await window.login(user.username, password);

        if (result.success) {
            // Success
            showToast(`✅ Bienvenido, ${result.user.name}`, 'success');

            const modal = document.getElementById('password-modal');
            if (modal) modal.remove();

            // Reload to apply dashboard context
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            // Error
            if (errorDiv) {
                errorDiv.textContent = 'Contraseña incorrecta';
                errorDiv.style.display = 'block';
            }
            passwordInput.value = '';
            passwordInput.focus();
        }
    } else {
        console.error("Login function not found or user not found in auth.js");
    }
}


function renderUsuariosGrid() {
    // Get users directly from auth.js storage
    const users = getUsers();
    window.usuariosData = users; // Keep reference for filtering

    if (!users || users.length === 0) {
        return '<div class="no-results">No hay usuarios registrados</div>';
    }

    return users.map(user => `
        <div class="usuario-card ${!user.activo ? 'usuario-inactive' : ''}" data-user-id="${user.id}">
            <div class="usuario-card-header">
                <div class="usuario-avatar">
                    ${getInitials(user.name, user.apellido)}
                </div>
                <div class="usuario-info">
                    <h4>${user.name} ${user.apellido}</h4>
                    <span class="usuario-rol-badge rol-${user.rol}">${capitalizeFirst(user.rol === 'superadmin' ? 'Administrador' : user.rol)}</span>
                </div>
                <div class="usuario-status">
                    <span class="status-badge ${user.activo ? 'status-active' : 'status-inactive'}">
                        ${user.activo ? '● Activo' : '○ Inactivo'}
                    </span>
                </div>
            </div>
            
            <div class="usuario-card-body">
                <div class="usuario-detail">
                    <span class="usuario-detail-icon">🆔</span>
                    <span class="usuario-detail-text"><strong>${user.tipoDocumento || 'CC'} ${user.cedula || user.codigo || 'N/A'}</strong></span>
                </div>
                <div class="usuario-detail">
                    <span class="usuario-detail-icon">👤</span>
                    <span class="usuario-detail-text">${user.username || 'Sin usuario'}</span>
                </div>
            </div>
            
            <div class="usuario-card-footer">
                <button class="btn-icon-small" onclick="editarUsuario(${user.id})" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon-small" onclick="toggleUsuarioStatus(${user.id})" title="${user.activo ? 'Desactivar' : 'Activar'}">
                    ${user.activo ? '🔒' : '🔓'}
                </button>
                ${user.rol !== 'superadmin' ? `
                <button class="btn-icon-small btn-danger" onclick="eliminarUsuario(${user.id})" title="Eliminar">
                    🗑️
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getInitials(name, apellido) {
    const n = name ? name.charAt(0) : '';
    const a = apellido ? apellido.charAt(0) : '';
    return (n + a).toUpperCase();
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generarPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('usuarioPassword').value = password;
    return password;
}

function initUsuariosHandlers() {
    // Form submission
    const form = document.getElementById('usuarioForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarUsuario();
    });

    // Search functionality
    const searchBox = document.getElementById('usuariosSearch');
    searchBox.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const allUsers = getUsers();

        const filteredUsers = allUsers.filter(user =>
            (user.name || '').toLowerCase().includes(searchTerm) ||
            (user.apellido || '').toLowerCase().includes(searchTerm) ||
            (user.cedula || '').toLowerCase().includes(searchTerm) ||
            (user.username && user.username.toLowerCase().includes(searchTerm))
        );

        // Re-render grid with local filtered data (mocking the render function behavior)
        const grid = document.getElementById('usuariosGrid');
        if (filteredUsers.length === 0) {
            grid.innerHTML = '<div class="no-results">No se encontraron usuarios</div>';
        } else {
            grid.innerHTML = filteredUsers.map(user => `
                <div class="usuario-card ${!user.activo ? 'usuario-inactive' : ''}" data-user-id="${user.id}">
                    <div class="usuario-card-header">
                        <div class="usuario-avatar">
                            ${getInitials(user.name, user.apellido)}
                        </div>
                        <div class="usuario-info">
                            <h4>${user.name} ${user.apellido}</h4>
                            <span class="usuario-rol-badge rol-${user.rol}">${capitalizeFirst(user.rol === 'superadmin' ? 'Administrador' : user.rol)}</span>
                        </div>
                        <div class="usuario-status">
                            <span class="status-badge ${user.activo ? 'status-active' : 'status-inactive'}">
                                ${user.activo ? '● Activo' : '○ Inactivo'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="usuario-card-body">
                         <div class="usuario-detail">
                            <span class="usuario-detail-icon">🆔</span>
                            <span class="usuario-detail-text"><strong>${user.tipoDocumento || 'CC'} ${user.cedula || user.codigo || 'N/A'}</strong></span>
                        </div>
                        <div class="usuario-detail">
                            <span class="usuario-detail-icon">👤</span>
                            <span class="usuario-detail-text">${user.username || 'Sin usuario'}</span>
                        </div>
                    </div>
                    
                    <div class="usuario-card-footer">
                        <button class="btn-icon-small" onclick="editarUsuario(${user.id})" title="Editar">✏️</button>
                        <button class="btn-icon-small" onclick="toggleUsuarioStatus(${user.id})" title="${user.activo ? 'Desactivar' : 'Activar'}">
                            ${user.activo ? '🔒' : '🔓'}
                        </button>
                    </div>
                </div>
            `).join('');
        }
    });

    // Validate Cedula input (Numbers only)
    const cedulaInput = document.getElementById('usuarioCedula');
    if (cedulaInput) {
        cedulaInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
}

function nuevoUsuario() {
    // Clear form
    document.getElementById('usuarioForm').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('formTitle').textContent = '👤 Nuevo Usuario';
    document.getElementById('btnSubmitText').textContent = 'Guardar Usuario';
    document.getElementById('usuarioActivo').checked = true;
    document.getElementById('newCredentialsDisplay').style.display = 'none';

    // Default document type
    document.getElementById('usuarioTipoDocumento').value = 'CC';

    // Default password generation
    generarPassword();

    // Scroll to form
    document.querySelector('.usuarios-form-section').scrollIntoView({ behavior: 'smooth' });
}

async function guardarUsuario() {
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('usuarioNombre').value.trim();
    const apellido = document.getElementById('usuarioApellido').value.trim();
    const cedula = document.getElementById('usuarioCedula').value.trim();
    const tipoDocumento = document.getElementById('usuarioTipoDocumento').value;
    const username = document.getElementById('usuarioEmail').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const activo = document.getElementById('usuarioActivo').checked;

    // --- Validation ---
    if (!nombre || !apellido || !cedula || !username) { // password is not strictly required on update if it's empty
        showToast('⚠️ Por favor complete todos los campos obligatorios', 'warning');
        return;
    }

    if (!id && !password) {
        showToast('⚠️ La contraseña es obligatoria para nuevos usuarios', 'warning');
        return;
    }

    if (!/^\d+$/.test(cedula)) {
        showToast('⚠️ La cédula debe contener solo números', 'warning');
        return;
    }

    if (cedula.length < 5 || cedula.length > 15) {
        showToast('⚠️ La longitud del documento no es válida', 'warning');
        return;
    }
    // ------------------

    const userData = {
        name: nombre,
        apellido: apellido,
        cedula: cedula,
        tipoDocumento: tipoDocumento,
        username: username,
        rol: rol,
        activo: activo,
        codigo: id ? undefined : (rol === 'superadmin' ? 'ADM' + Math.floor(Math.random() * 1000) : 'OP' + Math.floor(Math.random() * 1000))
    };
    
    if (password) {
        userData.password = password;
    }

    let result = { success: false };
    const btnSubmit = document.querySelector('#usuarioForm button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '⏳ Guardando...';
    btnSubmit.disabled = true;

    try {
        const token = sessionStorage.getItem('authToken');
        
        if (id) {
            // Update existing
            const response = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            if (response.ok) {
                result = { success: true };
                showToast('✅ Usuario actualizado exitosamente', 'success');
            } else {
                result = { success: false, error: data.message || 'Error al actualizar' };
            }
        } else {
            // Create new
            const response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            if (response.ok) {
                result = { success: true };
                showToast('✅ Usuario creado exitosamente', 'success');

                // Show new credentials
                document.getElementById('displayEmail').textContent = username;
                document.getElementById('displayPassword').textContent = password;
                document.getElementById('newCredentialsDisplay').style.display = 'block';
            } else {
                result = { success: false, error: data.message || 'Error al crear' };
            }
        }
    } catch (error) {
        result = { success: false, error: 'Error de conexión' };
    }

    btnSubmit.innerHTML = originalText;
    btnSubmit.disabled = false;

    if (result.success) {
        await window.syncUsers(); // Refresh data from backend
        // Update grid and stats
        document.getElementById('usuariosGrid').innerHTML = renderUsuariosGrid();
        updateUsuariosStats();

        if (id) {
            cancelarUsuarioForm();
        }
    } else {
        showToast('❌ ' + result.error, 'error');
    }
}

// Helper Validation Function
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function editarUsuario(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    // Fill form with user data
    document.getElementById('usuarioId').value = user.id;
    document.getElementById('usuarioNombre').value = user.name;
    document.getElementById('usuarioApellido').value = user.apellido;
    document.getElementById('usuarioCedula').value = user.cedula || user.codigo || ''; // Fallback to code if cedula missing
    document.getElementById('usuarioTipoDocumento').value = user.tipoDocumento || 'CC';
    document.getElementById('usuarioEmail').value = user.username || '';
    document.getElementById('usuarioPassword').value = user.password || '';
    document.getElementById('usuarioRol').value = user.rol;
    document.getElementById('usuarioActivo').checked = user.activo;

    document.getElementById('newCredentialsDisplay').style.display = 'none';
    document.getElementById('formTitle').textContent = '✏️ Editar Usuario';
    document.getElementById('btnSubmitText').textContent = 'Actualizar Usuario';

    document.querySelector('.usuarios-form-section').scrollIntoView({ behavior: 'smooth' });
}

async function toggleUsuarioStatus(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ activo: !user.activo })
        });

        if (response.ok) {
            await window.syncUsers();
            document.getElementById('usuariosGrid').innerHTML = renderUsuariosGrid();
            updateUsuariosStats();
            showToast(`${!user.activo ? '✅ Usuario activado' : '🔒 Usuario desactivado'}`, 'info');
        } else {
            showToast('❌ Error al cambiar estado', 'error');
        }
    } catch (e) {
        showToast('❌ Error de conexión', 'error');
    }
}

async function eliminarUsuario(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    if (confirm(`¿Estás seguro de que deseas eliminar a ${user.name} ${user.apellido}?`)) {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await window.syncUsers();
                document.getElementById('usuariosGrid').innerHTML = renderUsuariosGrid();
                updateUsuariosStats();
                showToast('🗑️ Usuario eliminado', 'success');
            } else {
                const data = await response.json();
                showToast('❌ ' + (data.message || 'Error al eliminar'), 'error');
            }
        } catch (e) {
            showToast('❌ Error de conexión', 'error');
        }
    }
}

function cancelarUsuarioForm() {
    document.getElementById('usuarioForm').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('formTitle').textContent = '👤 Nuevo Usuario';
    document.getElementById('btnSubmitText').textContent = 'Guardar Usuario';
    document.getElementById('usuarioActivo').checked = true;
    const credsDisplay = document.getElementById('newCredentialsDisplay');
    if (credsDisplay) credsDisplay.style.display = 'none';
}

function updateUsuariosStats() {
    const users = getUsers(); // Use authenticated storage
    const total = users.length;
    const activos = users.filter(u => u.activo).length;
    const inactivos = total - activos;

    const totalEl = document.getElementById('totalUsuarios');
    const activosEl = document.getElementById('usuariosActivos');

    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;

    // Update all stat mini values if they exist in the current view
    const statMinis = document.querySelectorAll('.stat-mini-value');
    if (statMinis.length >= 2) {
        statMinis[0].textContent = total;
        statMinis[1].textContent = activos;
    }
}
