// Procesos Module Content
function loadProcesosModule() {
    const procesosModule = document.getElementById('module-procesos');

    procesosModule.innerHTML = `
        <div class="module-header">
            <h2>Gestión de Procesos</h2>
            <p class="module-description">Administración de códigos de proceso y subprocesos</p>
        </div>

        <div class="procesos-header-actions">
            <input type="text" class="search-box" id="processSearch" placeholder="🔍 Buscar proceso...">
            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all">Todos (${sampleData.processes.length})</button>
                <button class="filter-tab" data-filter="CUSTODIA">Custodia (${sampleData.processes.filter(p => p.category === 'CUSTODIA').length})</button>
                <button class="filter-tab" data-filter="OPERATIVO">Operativo (${sampleData.processes.filter(p => p.category === 'OPERATIVO').length})</button>
            </div>
        </div>

        <div class="form-card" style="margin-top: var(--spacing-xl);">
            <div class="table-container">
                <table class="data-table" id="processesTable">
                    <thead>
                        <tr>
                            <th style="width: 100px;">Código</th>
                            <th>Subproceso</th>
                            <th style="width: 200px;">Unidad de Medida</th>
                            <th style="width: 120px;">Cantidad Meta</th>
                            <th style="width: 100px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="processesTableBody">
                        ${renderProcessesTableRows('all')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="stats-grid" style="margin-top: var(--spacing-2xl);">
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                    <h3>Total Procesos</h3>
                    <p class="stat-value">${sampleData.processes.length}</p>
                    <span class="stat-label">Codificados</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏢</div>
                <div class="stat-content">
                    <h3>Custodia</h3>
                    <p class="stat-value">${sampleData.processes.filter(p => p.category === 'CUSTODIA').length}</p>
                    <span class="stat-label">Procesos</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚙️</div>
                <div class="stat-content">
                    <h3>Operativo</h3>
                    <p class="stat-value">${sampleData.processes.filter(p => p.category === 'OPERATIVO').length}</p>
                    <span class="stat-label">Procesos</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <h3>Unidades</h3>
                    <p class="stat-value">${new Set(sampleData.processes.map(p => p.unit)).size}</p>
                    <span class="stat-label">Tipos diferentes</span>
                </div>
            </div>
        </div>
    `;

    initProcesosHandlers();
}

function renderProcessesTableRows(filter = 'all', searchTerm = '') {
    let filtered = filter === 'all'
        ? sampleData.processes
        : sampleData.processes.filter(p => p.category === filter);

    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
            p.code.toLowerCase().includes(searchTerm) ||
            p.name.toLowerCase().includes(searchTerm) ||
            p.unit.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        return `
            <tr>
                <td colspan="5" style="text-align: center; padding: var(--spacing-2xl); color: var(--text-muted);">
                    No se encontraron procesos
                </td>
            </tr>
        `;
    }

    return filtered.map(proc => `
        <tr data-code="${proc.code}">
            <td>
                <span class="code-badge">${proc.code}</span>
            </td>
            <td>
                <strong>${proc.name}</strong>
                <div class="text-xs text-muted" style="margin-top: 0.25rem;">
                    ${proc.subprocesses ? proc.subprocesses.join(' • ') : 'Sin subprocesos'}
                </div>
            </td>
            <td class="text-muted">${proc.unit}</td>
            <td>
                <strong style="color: var(--primary);">${proc.cantidad || 0}</strong> <span class="text-muted">/ día</span>
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon-small" onclick="viewProcessDetail('${proc.code}')" title="Ver detalles">
                        👁️
                    </button>
                    <button class="btn-icon-small" onclick="editProcess('${proc.code}')" title="Editar">
                        ✏️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function initProcesosHandlers() {
    // Search functionality
    const searchBox = document.getElementById('processSearch');
    searchBox.addEventListener('input', function () {
        const searchTerm = this.value;
        const activeFilter = document.querySelector('.filter-tab.active').getAttribute('data-filter');
        const tbody = document.getElementById('processesTableBody');
        tbody.innerHTML = renderProcessesTableRows(activeFilter, searchTerm);
    });

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            const searchTerm = document.getElementById('processSearch').value;
            const tbody = document.getElementById('processesTableBody');
            tbody.innerHTML = renderProcessesTableRows(filter, searchTerm);
        });
    });
}

function viewProcessDetail(code) {
    const process = sampleData.processes.find(p => p.code === code);
    if (process) {
        showToast(`📋 ${process.code}: ${process.name}`, 'info');
        // In real app, would open a modal with full details
    }
}

function editProcess(code) {
    const process = sampleData.processes.find(p => p.code === code);
    if (process) {
        showToast(`✏️ Editar: ${process.code}`, 'info');
        // In real app, would open edit modal
    }
}
