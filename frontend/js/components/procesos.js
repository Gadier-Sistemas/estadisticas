// Procesos Module Content
function loadProcesosModule() {
    const procesosModule = document.getElementById('module-procesos');

    procesosModule.innerHTML = `
        <div class="module-header">
            <h2>Gestión de Procesos</h2>
            <p class="module-description">Administración de códigos de proceso y subprocesos</p>
        </div>

        <div class="procesos-header-actions" style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
            <input type="text" class="search-box" id="processSearch" placeholder="🔍 Buscar proceso..." style="flex: 1; min-width: 200px;">
            <div class="filter-tabs" style="display: flex; gap: 0.5rem;">
                <button class="filter-tab active" data-filter="all">Todos (${sampleData.processes.length})</button>
                <button class="filter-tab" data-filter="CUSTODIA">Custodia (${sampleData.processes.filter(p => (p.categoria || p.category) === 'CUSTODIA').length})</button>
                <button class="filter-tab" data-filter="OPERATIVO">Operativo (${sampleData.processes.filter(p => (p.categoria || p.category) === 'OPERATIVO').length})</button>
            </div>
            ${(window.getCurrentUser && window.getCurrentUser().rol === 'superadmin') ? `
            <div style="display: flex; gap: 0.75rem; margin-left: auto;">
                <button class="btn btn-secondary" onclick="showProjectsModal()">🏷️ Proyectos</button>
                <button class="btn btn-primary" onclick="showProcessModal()">➕ Crear Proceso</button>
            </div>
            ` : ''}
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
                    <p class="stat-value">${sampleData.processes.filter(p => (p.categoria || p.category) === 'CUSTODIA').length}</p>
                    <span class="stat-label">Procesos</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚙️</div>
                <div class="stat-content">
                    <h3>Operativo</h3>
                    <p class="stat-value">${sampleData.processes.filter(p => (p.categoria || p.category) === 'OPERATIVO').length}</p>
                    <span class="stat-label">Procesos</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <h3>Unidades</h3>
                    <p class="stat-value">${new Set(sampleData.processes.map(p => p.unidad_medida || p.unit)).size}</p>
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
        : sampleData.processes.filter(p => (p.categoria || p.category) === filter);

    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
            (p.codigo || p.code || '').toLowerCase().includes(searchTerm) ||
            (p.nombre || p.name || '').toLowerCase().includes(searchTerm) ||
            (p.unidad_medida || p.unit || '').toLowerCase().includes(searchTerm)
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
        <tr data-code="${proc.codigo || proc.code}">
            <td>
                <span class="code-badge">${proc.codigo || proc.code}</span>
            </td>
            <td>
                <strong>${proc.nombre || proc.name}</strong>
                <div class="text-xs text-muted" style="margin-top: 0.25rem;">
                    ${(proc.subprocesos || proc.subprocesses) ? (Array.isArray(proc.subprocesos || proc.subprocesses) ? (proc.subprocesos || proc.subprocesses).join(' • ') : (proc.subprocesos || proc.subprocesses)) : 'Sin subprocesos'}
                </div>
            </td>
            <td class="text-muted">${proc.unidad_medida || proc.unit || '-'}</td>
            <td>
                <strong style="color: var(--primary); font-weight: 600;">${proc.cantidad_meta || proc.cantidad || 0}</strong> <span class="text-xs text-muted">/ día</span>
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="viewProcessDetail('${proc.codigo || proc.code}')" title="Ver detalles" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">👁️ Ver</button>
                    ${(window.getCurrentUser && window.getCurrentUser().rol === 'superadmin') ? `<button class="btn btn-primary" onclick="editProcess('${proc.codigo || proc.code}')" title="Editar" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">✏️ Editar</button>` : ''}
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
    const process = sampleData.processes.find(p => p.code === code || p.codigo === code);
    if (!process) return;

    const modalId = 'process-detail-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px);';

    let subprocesos = process.subprocesses || process.subprocesos || [];
    if (typeof subprocesos === 'string') subprocesos = JSON.parse(subprocesos);

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0; color: var(--text-color);">${process.codigo || process.code} - ${process.nombre || process.name}</h3>
                    <p style="margin: 0; margin-top: 5px; color: var(--text-muted); font-size: 0.85em;">Categoría: ${process.category || process.categoria}</p>
                </div>
                <button class="btn-icon" onclick="document.getElementById('${modalId}').remove()" style="font-size: 1.5rem;">×</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Unidad de Medida</div>
                    <div style="font-size: 1.125rem; font-weight: 600; color: #0f172a; margin-top: 0.25rem;">${process.unidad_medida || process.unit || 'N/A'}</div>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Meta Diaria</div>
                    <div style="font-size: 1.125rem; font-weight: 600; color: var(--primary-color); margin-top: 0.25rem;">${process.cantidad_meta || process.cantidad || 0}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9em; color: var(--text-color);">Subprocesos Asignados</h4>
                ${subprocesos && subprocesos.length > 0 ? 
                    `<ul style="margin: 0; padding-left: 1.5rem; color: var(--text-muted); font-size: 0.9em;">
                        ${subprocesos.map(s => `<li>${s}</li>`).join('')}
                    </ul>` : 
                    `<p style="margin: 0; color: var(--text-muted); font-size: 0.9em; font-style: italic;">No tiene subprocesos definidos</p>`
                }
            </div>
            
            <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cerrar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function showProcessModal(code = null) {
    let process = null;
    if (code) {
        process = sampleData.processes.find(p => p.code === code || p.codigo === code);
    }

    const modalId = 'process-form-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px);';

    let subprocesosStr = '';
    if (process) {
        let subs = process.subprocesses || process.subprocesos || [];
        if (typeof subs === 'string') subs = JSON.parse(subs);
        subprocesosStr = Array.isArray(subs) ? subs.join('\\n') : '';
    }

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">${process ? '✏️ Editar Proceso' : '➕ Nuevo Proceso'}</h3>
                <button class="btn-icon" onclick="document.getElementById('${modalId}').remove()" style="font-size: 1.5rem;">×</button>
            </div>
            
            <form id="processForm" onsubmit="saveProcess(event, ${process ? process.id : 'null'})">
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Código</label>
                        <input type="text" id="procCode" required value="${process ? (process.codigo || process.code) : ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;" ${process ? 'readonly' : ''}>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre</label>
                        <input type="text" id="procName" required value="${process ? (process.nombre || process.name) : ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Categoría</label>
                        <select id="procCat" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="OPERATIVO" ${process && (process.categoria === 'OPERATIVO' || process.category === 'OPERATIVO') ? 'selected' : ''}>OPERATIVO</option>
                            <option value="CUSTODIA" ${process && (process.categoria === 'CUSTODIA' || process.category === 'CUSTODIA') ? 'selected' : ''}>CUSTODIA</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Unidad M.</label>
                        <input type="text" id="procUnit" required value="${process ? (process.unidad_medida || process.unit) : ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Cantidad Meta Diaria</label>
                    <input type="number" id="procMeta" required min="1" value="${process ? (process.cantidad_meta || process.cantidad) : ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                        Subprocesos <span style="font-weight: normal; font-size: 0.8em; color: #888;">(Uno por línea)</span>
                    </label>
                    <textarea id="procSubs" rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">${subprocesosStr}</textarea>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #eee; padding-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="btnSaveProcess">Guardar Proceso</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

function editProcess(code) {
    showProcessModal(code);
}

async function saveProcess(e, processId) {
    e.preventDefault();
    const btnParams = document.getElementById('btnSaveProcess');
    const originalText = btnParams.innerHTML;
    btnParams.disabled = true;
    btnParams.innerHTML = 'Guardando...';

    const payload = {
        codigo: document.getElementById('procCode').value,
        nombre: document.getElementById('procName').value,
        categoria: document.getElementById('procCat').value,
        unidad_medida: document.getElementById('procUnit').value,
        cantidad_meta: document.getElementById('procMeta').value,
        subprocesos: document.getElementById('procSubs').value.split('\\n').map(s => s.trim()).filter(s => s !== '')
    };

    try {
        const url = processId ? `${API_URL}/procesos/${processId}` : `${API_URL}/procesos`;
        const method = processId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('✅ Proceso guardado correctamente', 'success');
            document.getElementById('process-form-modal').remove();
            
            // Reload processes and UI
            if (typeof loadInitialData === 'function') {
                await loadInitialData();
            }
            if (typeof loadProcesosModule === 'function') {
                loadProcesosModule();
            }
        } else {
            const err = await res.json();
            showToast('❌ Error: ' + (err.message || 'No se pudo guardar'), 'error');
        }
    } catch (err) {
        showToast('❌ Error de red al guardar proceso', 'error');
        console.error(err);
    } finally {
        btnParams.disabled = false;
        btnParams.innerHTML = originalText;
    }
}

// Project Management
function showProjectsModal() {
    const modalId = 'projects-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px);';

    const projectsList = (sampleData.projects || []).map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid #eee; border-radius: 6px; margin-bottom: 0.5rem; background: #fff;">
            <div>
                <strong style="color: var(--text-primary);">${p.nombre}</strong> <span class="text-muted text-xs" style="margin-left: 0.5rem;">(${p.cliente || 'Sin cliente'})</span>
            </div>
            <button class="btn-icon-small" onclick="deleteProject(${p.id})" title="Eliminar" style="color: #ef4444; background: #fee2e2; border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.8rem; border: none; cursor: pointer;">🗑️</button>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; color: var(--text-primary);">🏷️ Gestión de Proyectos / Clientes</h3>
                <button class="btn-icon" onclick="document.getElementById('${modalId}').remove()" style="font-size: 1.5rem;">×</button>
            </div>
            
            <form id="projectForm" onsubmit="saveProject(event)" style="margin-bottom: 2rem; background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px dashed var(--primary-color);">
                <h4 style="margin-top: 0; margin-bottom: 1rem; color: var(--primary-color); font-size: 0.95rem;">➕ Añadir Nuevo Proyecto</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.80rem; color: var(--text-secondary);">Nombre del Proyecto</label>
                        <input type="text" id="newProjName" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.80rem; color: var(--text-secondary);">Cliente / Entidad</label>
                        <input type="text" id="newProjClient" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                    </div>
                </div>
                <div style="text-align: right;">
                    <button type="submit" class="btn btn-primary" id="btnSaveProject" style="font-size: 0.85rem; padding: 0.5rem 1rem;">Guardar Proyecto</button>
                </div>
            </form>

            <div>
                <h4 style="margin-top: 0; margin-bottom: 1rem; color: var(--text-primary); font-size: 0.95rem;">Proyectos Actuales</h4>
                <div style="max-height: 250px; overflow-y: auto; padding-right: 0.5rem;">
                    ${projectsList || '<p class="text-muted text-sm text-center" style="padding: 1rem;">No hay proyectos registrados en el sistema.</p>'}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function saveProject(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveProject');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Guardando...';

    const payload = {
        nombre: document.getElementById('newProjName').value,
        cliente: document.getElementById('newProjClient').value
    };

    try {
        const res = await fetch(`${API_URL}/proyectos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('✅ Proyecto añadido', 'success');
            if (typeof loadInitialData === 'function') await loadInitialData();
            showProjectsModal(); // Refresh the modal with new data
        } else {
            const err = await res.json();
            showToast('❌ Error: ' + (err.message || 'Error al añadir'), 'error');
        }
    } catch (err) {
        showToast('❌ Error de red al guardar', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function deleteProject(id) {
    if(!confirm("¿Está seguro de eliminar este proyecto y sus asociaciones?")) return;
    
    try {
        const res = await fetch(`${API_URL}/proyectos/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            }
        });
        
        if (res.ok) {
            showToast('🗑️ Proyecto eliminado', 'success');
            if (typeof loadInitialData === 'function') await loadInitialData();
            showProjectsModal(); // Refresh UI
        } else {
            showToast('❌ Error al eliminar', 'error');
        }
    } catch (err) {
        showToast('❌ Error de red al eliminar', 'error');
    }
}
