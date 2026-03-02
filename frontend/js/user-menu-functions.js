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
                <strong>${user.name} ${user.apellido}</strong>
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
            <button class="btn btn-sm" onclick="logout()" style="background: #990F0C; color: white; width: 100%;">
                🚪 Cerrar Sesión
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

// Logout function
function logout() {
    // Clear all session data
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = 'login.html';
}
