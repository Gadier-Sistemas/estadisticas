// Registro Module Content

// Initial Target Load
function loadCurrentTarget() {
    const user = getCurrentUser();

    // Use local date to match the form input value
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const targetInput = document.getElementById('metaProcesos');
    const container = document.querySelector('.target-container');

    if (container) {
        const targets = JSON.parse(localStorage.getItem('app_daily_targets') || '{}');
        // We must check if the key was saved with ISO string or local date. 
        // Previously saveDailyTarget also used toISOString(). We should probably fix that too to be consistent.
        // But for reading registrations, we definitely need the local date.

        // Let's check both keys just in case, or standardize.
        // For now, let's stick to modifying the logic to be consistent with the form date.

        const userDateKey = `${user.id}_${today}`;
        let savedTarget = targets[userDateKey];

        // Fallback: check if it was saved with ISO string if different (for backward compatibility during today)
        if (!savedTarget) {
            const isoDate = new Date().toISOString().split('T')[0];
            savedTarget = targets[`${user.id}_${isoDate}`];
        }

        // Use sampleData.registrations (synced with API) instead of localStorage
        const regs = sampleData.registrations.filter(r =>
            parseInt(r.userId || r.user_id) === parseInt(user.id) &&
            r.fecha === today
        );

        const count = regs.length;

        if (savedTarget) {
            const remaining = savedTarget - count;

            // Logic: 
            // - Lock and show progress ONLY if we have started (count > 0) AND are not finished (count < target).
            // - If count == 0, show Input (start of day).
            // - If count >= target, show Input (goal met, allow extension).

            const showProgress = count > 0 && count < savedTarget;

            if (showProgress) {
                const statusHtml = `
                    <div style="flex: 1;">
                        <label style="font-weight: 700; color: var(--primary-color); display: block; margin-bottom: 0.25rem;">Meta: ${savedTarget} Procesos</label>
                        <p class="text-sm font-medium" style="margin: 0; color: var(--secondary-color);">Faltan registrar: <strong>${remaining}</strong></p>
                        <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 8px;">
                            <div style="width: ${(count / savedTarget) * 100}%; background: var(--primary-color); height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    <div style="text-align: center;">
                         <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${count}/${savedTarget}</span>
                    </div>
                `;
                container.style.border = '1px solid var(--primary-color)';
                container.style.background = '#eff6ff';

                container.innerHTML = `
                    <div style="font-size: 2rem;">📊</div>
                    ${statusHtml}
                    <!-- Hidden input to maintain logic -->
                    <input type="hidden" id="metaProcesos" value="${savedTarget}">
                `;
            } else {
                // Default Input View (Start or Completed)
                // If completed (count >= savedTarget), add a visual cue
                const isGoalMet = count > 0 && count >= savedTarget;
                const badge = isGoalMet
                    ? `<span style="display: inline-block; background: #dcfce7; color: #166534; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; margin-left: 8px; border: 1px solid #bbf7d0;">✅ ¡Meta Alcanzada!</span>`
                    : '';

                container.innerHTML = `
                    <div style="font-size: 2rem;">${isGoalMet ? '🏆' : '🎯'}</div>
                    <div style="flex: 1;">
                        <label for="metaProcesos" style="font-weight: 700; color: var(--primary-color); display: block; margin-bottom: 0.25rem;">
                            Procesos realizados hoy ${badge}
                        </label>
                        <p class="text-xs text-muted" style="margin: 0;">${isGoalMet ? 'Puedes aumentar la meta si realizaste más.' : '¿Cuántos procesos diferentes completaste el día de hoy?'}</p>
                    </div>
                    <input type="number" id="metaProcesos" min="1" value="${savedTarget}" style="width: 80px; text-align: center; font-size: 1.25rem; font-weight: 700; border: 1px solid var(--primary-color); border-radius: 8px; padding: 0.25rem;" onchange="saveDailyTarget(this.value)">
                `;
                container.style.border = isGoalMet ? '1px solid var(--success-color)' : '1px dashed var(--primary-color)';
                container.style.background = isGoalMet ? '#f0fdf4' : '#f8fafc';
            }
        } else {
            // Default View (Input enabled)
            container.innerHTML = `
                <div style="font-size: 2rem;">🎯</div>
                <div style="flex: 1;">
                    <label for="metaProcesos" style="font-weight: 700; color: var(--primary-color); display: block; margin-bottom: 0.25rem;">Procesos realizados hoy</label>
                    <p class="text-xs text-muted" style="margin: 0;">¿Cuántos procesos diferentes completaste el día de hoy?</p>
                </div>
                <input type="number" id="metaProcesos" min="1" value="1" style="width: 80px; text-align: center; font-size: 1.25rem; font-weight: 700; border: 1px solid var(--primary-color); border-radius: 8px; padding: 0.25rem;" onchange="saveDailyTarget(this.value)">
            `;
            container.style.border = '1px dashed var(--primary-color)';
            container.style.background = '#f8fafc';
        }
    }
}

function saveDailyTarget(value) {
    const user = getCurrentUser();
    // Use local date for storage key
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const targets = JSON.parse(localStorage.getItem('app_daily_targets') || '{}');
    const userDateKey = `${user.id}_${today}`;

    targets[userDateKey] = parseInt(value) || 1;
    localStorage.setItem('app_daily_targets', JSON.stringify(targets));

    if (typeof renderAlerts === 'function') renderAlerts();
    showToast('🎯 Meta diaria actualizada', 'success');
}

function loadRegistroModule() {
    const registroModule = document.getElementById('module-registro');
    const user = getCurrentUser();
    const isOperario = user.rol === 'operario';
    let operators = window.getUsers ? getUsers() : sampleData.operators;

    registroModule.innerHTML = `
        <div class="module-header">
            <h2>Registro de Estadística</h2>
            <p class="module-description">Captura de datos de trabajo por operario</p>
        </div>

        <div class="registro-container">
            <div class="registro-form-section">
                <div class="form-card">
                    <div class="form-header">
                        <h3>📝 Nueva Estadística</h3>
                    </div>
                    
                    <form id="registroForm" class="form-grid">
                        <!-- Daily Process Target -->
                        <div class="target-container" style="grid-column: 1 / -1; background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px dashed var(--primary-color); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.5rem;">
                            <div style="font-size: 2rem;">🎯</div>
                            <div style="flex: 1;">
                                <label for="metaProcesos" style="font-weight: 700; color: var(--primary-color); display: block; margin-bottom: 0.25rem;">Procesos realizados hoy</label>
                                <p class="text-xs text-muted" style="margin: 0;">¿Cuántos procesos diferentes completaste el día de hoy?</p>
                            </div>
                            <input type="number" id="metaProcesos" min="1" value="1" style="width: 80px; text-align: center; font-size: 1.25rem; font-weight: 700; border: 1px solid var(--primary-color); border-radius: 8px; padding: 0.25rem;" onchange="saveDailyTarget(this.value)">
                        </div>

                        <!-- Full Absence Toggle -->
                        <div style="grid-column: 1 / -1; margin-bottom: 1rem; padding: 1rem; background: #fff1f2; border: 1px solid #fda4af; border-radius: 8px; display: flex; align-items: center; gap: 1rem;">
                            <input type="checkbox" id="fullAbsenceToggle" onchange="toggleFullNoveltyMode(this.checked)" style="width: 20px; height: 20px;">
                            <div>
                                <label for="fullAbsenceToggle" style="font-weight: 700; color: #be123c; cursor: pointer;">Día No Laborado (Incapacidad Total, Licencia, etc.)</label>
                                <p class="text-xs text-muted" style="margin: 0;">Marque esta casilla si no hubo producción hoy.</p>
                            </div>
                        </div>

                        <!-- Common Fields (Always visible) -->
                        <div class="form-group full-width">
                            <label for="operario">Nombre y Apellido</label>
                            <select id="operario" required ${isOperario ? 'disabled' : ''}>
                                ${!isOperario ? '<option value="">Seleccionar operario...</option>' : ''}
                                ${operators.map(op =>
        `<option value="${op.id}" ${op.id === user.id ? 'selected' : ''}>
                                        ${op.name} ${op.apellido || ''}
                                    </option>`
    ).join('')}
                            </select>
                            ${isOperario ? `<input type="hidden" id="operarioHidden" value="${user.id}">` : ''}
                        </div>

                        <div class="form-group full-width">
                            <label for="fecha" style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Fecha</span>
                                <span id="fechaStatus" style="font-size: 0.75rem; color: var(--secondary-color); font-weight: 600;"></span>
                            </label>
                            <input type="date" id="fecha" required style="font-weight: 600; border: 2px solid var(--primary-color);">
                        </div>

                        <!-- Production Fields (Wrapped for toggling) -->
                        <div id="productionFields" style="display: contents;">
                            <div class="form-group full-width">
                                <label for="cliente">Cliente</label>
                                <input type="text" id="cliente" list="clientesList" placeholder="Escriba o seleccione un cliente..." required>
                                <datalist id="clientesList">
                                    ${(sampleData.customers || []).map(c => `<option value="${c}">`).join('')}
                                </datalist>
                            </div>

                            <div class="form-group">
                                <label for="codigo">Proceso</label>
                                <select id="codigo" required onchange="handleProcessChange(this.value)">
                                    <option value="">Seleccionar proceso...</option>
                                    ${sampleData.processes.map(proc =>
        `<option value="${proc.code}">${proc.code} - ${proc.name}</option>`
    ).join('')}
                                </select>
                            </div>

                            <!-- Subprocesses Section -->
                            <div class="form-group full-width" id="subprocessGroup" style="display: none; background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <label style="color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem; display: block;">Subprocesos</label>
                                
                                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                                    <select id="subprocesoSelector" style="flex: 1;">
                                        <option value="">Seleccionar subproceso...</option>
                                    </select>
                                    <button type="button" class="btn btn-secondary" onclick="addSubprocessRow()" style="white-space: nowrap;">
                                        ➕ Agregar
                                    </button>
                                </div>

                                <div id="subprocessList" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <!-- Added subprocesses will appear here -->
                                </div>
                                <p id="subprocessError" class="text-xs text-danger" style="display: none; margin-top: 0.5rem;">Debe agregar al menos un subproceso.</p>
                            </div>

                            <div class="form-group">
                                <label for="cantidad">Cantidad Total</label>
                                <input type="number" id="cantidad" min="1" placeholder="0" required>
                                <p class="text-xs text-muted" id="cantidadHelp">Suma total de unidades.</p>
                            </div>

                            <div class="form-group">
                                <label>Rango de Tiempo (Total)</label>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <div style="flex: 1;">
                                        <input type="time" id="horaInicio" required onchange="calculateDuration()">
                                    </div>
                                    <span style="color: var(--text-muted);">➜</span>
                                    <div style="flex: 1;">
                                        <input type="time" id="horaFin" required onchange="calculateDuration()">
                                    </div>
                                </div>
                                <div id="durationDisplay" style="margin-top: 0.25rem; font-weight: 600; color: var(--secondary-color); font-size: 0.85rem; display: none;">
                                    Total: <span id="calculatedTime">0h 0m</span>
                                </div>
                                <input type="hidden" id="tiempoCalculado" value="00:00">
                            </div>
                        </div>

                        <!-- Novelty / Support Section (Always visible but logic changes) -->
                        <div class="form-group full-width" style="border-top: 2px dashed #eee; padding-top: 1.5rem; margin-top: 1rem;">
                            <div style="margin-bottom: 1rem;">
                                <h4 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    📄 Reportar Novedad / Soporte
                                    <span class="text-xs text-muted" style="font-weight: 400;">(Opcional si hay producción)</span>
                                </h4>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label for="noveltyType">Tipo de Novedad</label>
                                    <select id="noveltyType">
                                        <option value="">Ninguna / Seleccionar...</option>
                                        <option value="Incapacidad">Incapacidad Médica</option>
                                        <option value="Cita Médica">Cita Médica</option>
                                        <option value="Permiso">Permiso Personal</option>
                                        <option value="Vacaciones">Vacaciones</option>
                                        <option value="Licencia">Licencia</option>
                                        <option value="Falta Justificada">Falta Justificada</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="noveltyFile">Adjuntar Archivo</label>
                                    <input type="file" id="noveltyFile" accept=".pdf,.png,.jpg,.jpeg">
                                    <p class="text-xs text-muted">PDF o Imagen (Máx. 5MB)</p>
                                </div>
                            </div>
                             <div class="form-group full-width">
                                <label for="observaciones">Observaciones</label>
                                <textarea id="observaciones" rows="3" placeholder="Notas adicionales (opcional)"></textarea>
                            </div>
                        </div>

                        <div class="form-actions full-width">
                            <button type="button" class="btn btn-secondary" onclick="clearRegistroForm()">
                                🗑️ Limpiar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                💾 Guardar Registro
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="registro-reference-section">
                <div class="reference-card">
                    <div class="reference-header">
                        <h3>📋 Tabla de Procesos</h3>
                        <div class="filter-tabs">
                            <button class="filter-tab active" data-filter="all">Todos</button>
                            <button class="filter-tab" data-filter="CUSTODIA">Custodia</button>
                            <button class="filter-tab" data-filter="OPERATIVO">Operativo</button>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="data-table" id="processReferenceTable">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Subproceso</th>
                                    <th>Unidad</th>
                                </tr>
                            </thead>
                            <tbody id="processTableBody">
                                ${renderProcessTable('all')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize form handlers
    initRegistroFormHandlers();

    // Set initial date securely
    const fInput = document.getElementById('fecha');
    if (fInput) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const dateToUse = window.nextRegistrationDate || todayStr;
        fInput.value = dateToUse;

        // Show status if it's a past date
        const status = document.getElementById('fechaStatus');
        if (status && window.nextRegistrationDate && window.nextRegistrationDate !== todayStr) {
            status.textContent = '📍 Registrando para día seleccionado: ' + window.nextRegistrationDate;
        }

        window.nextRegistrationDate = null; // Consume
    }

    loadCurrentTarget();
}

function renderProcessTable(filter = 'all') {
    const filtered = filter === 'all'
        ? sampleData.processes
        : sampleData.processes.filter(p => p.category === filter);

    return filtered.map(proc => `
        <tr>
            <td><span class="code-badge">${proc.codigo || proc.code}</span></td>
            <td>
                <strong>${proc.nombre || proc.name}</strong>
                <div class="text-xs text-muted" style="margin-top: 0.25rem;">
                    ${proc.subprocesos ? (Array.isArray(proc.subprocesos) ? proc.subprocesos.join(' • ') : proc.subprocesos) : 'Sin subprocesos'}
                </div>
            </td>
            <td class="text-muted">${proc.unidad || proc.unit}</td>
        </tr>
    `).join('');
}

function initRegistroFormHandlers() {
    const form = document.getElementById('registroForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '⌛ Guardando...';

            await handleRegistroSubmit();

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    }

    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            const tbody = document.getElementById('processTableBody');
            if (tbody) tbody.innerHTML = renderProcessTable(filter);
        });
    });
}

// --- Handler Functions ---

// Toggle Full Novelty Mode
function toggleFullNoveltyMode(checked) {
    const prodFields = document.getElementById('productionFields');
    const prodInputs = document.querySelectorAll('#productionFields input, #productionFields select');

    if (checked) {
        prodFields.style.display = 'none';
        // Remove required from production fields
        prodInputs.forEach(input => {
            if (input.hasAttribute('required')) {
                input.setAttribute('data-was-required', 'true');
                input.removeAttribute('required');
            }
        });

        // Make Novelty type required
        document.getElementById('noveltyType').setAttribute('required', 'true');
    } else {
        prodFields.style.display = 'contents';
        // Restore required
        prodInputs.forEach(input => {
            if (input.getAttribute('data-was-required') === 'true') {
                input.setAttribute('required', 'true');
            }
        });

        document.getElementById('noveltyType').removeAttribute('required');
    }
}

let activeSubprocesses = [];

function handleProcessChange(processCode) {
    const subGroup = document.getElementById('subprocessGroup');
    const subSelector = document.getElementById('subprocesoSelector');
    const cantidadInput = document.getElementById('cantidad');
    const cantidadHelp = document.getElementById('cantidadHelp');

    // Reset list
    activeSubprocesses = [];
    document.getElementById('subprocessList').innerHTML = '';

    if (!processCode) {
        subGroup.style.display = 'none';
        cantidadInput.readOnly = false;
        cantidadInput.value = '';
        cantidadHelp.textContent = 'Suma total de unidades.';
        return;
    }

    const process = sampleData.processes.find(p => (p.codigo || p.code) === processCode);

    if (process && process.subprocesses && process.subprocesses.length > 0) {
        // Show subprocess section
        subSelector.innerHTML = '<option value="">Seleccionar subproceso...</option>' +
            process.subprocesses.map(s => `<option value="${s}">${s}</option>`).join('');
        subGroup.style.display = 'block';

        // Lock total quantity (calculated from subprocesses)
        cantidadInput.value = 0;
        cantidadInput.readOnly = true;
        cantidadInput.placeholder = "Agregue subprocesos...";
        cantidadHelp.textContent = "Calculado automáticamente de los subprocesos.";
    } else {
        // Hide subprocess section, normal quantity input
        subGroup.style.display = 'none';
        cantidadInput.readOnly = false;
        cantidadInput.placeholder = "Ej: 450";
        cantidadHelp.textContent = "Cantidad total.";
    }
}

function addSubprocessRow() {
    const selector = document.getElementById('subprocesoSelector');
    const name = selector.value;

    if (!name) return;

    // Check availability
    if (activeSubprocesses.some(s => s.name === name)) {
        showToast('⚠️ Este subproceso ya ha sido agregado', 'warning');
        return;
    }

    const id = Date.now().toString(); // Simple ID for DOM removal
    activeSubprocesses.push({ id, name, qty: 0 });

    // Add DOM element
    const list = document.getElementById('subprocessList');
    const div = document.createElement('div');
    div.id = `sub-row-${id}`;
    div.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; background: #fff; padding: 0.5rem; border-radius: 6px; border: 1px solid #eee;';
    div.innerHTML = `
        <div style="flex: 2; font-weight: 500;">${name}</div>
        <div style="flex: 1;">
            <input type="number" min="1" placeholder="Cant." class="sub-qty" 
                   onchange="updateSubprocessQty('${id}', this.value)" 
                   style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <button type="button" class="btn-icon text-danger" onclick="removeSubprocessRow('${id}')">✕</button>
    `;
    list.appendChild(div);

    // Reset selector
    selector.value = '';

    // Hide error if present
    document.getElementById('subprocessError').style.display = 'none';
}

function updateSubprocessQty(id, value) {
    const item = activeSubprocesses.find(s => s.id === id);
    if (item) {
        item.qty = parseInt(value) || 0;
        updateTotalQuantity();
    }
}

function removeSubprocessRow(id) {
    activeSubprocesses = activeSubprocesses.filter(s => s.id !== id);
    const row = document.getElementById(`sub-row-${id}`);
    if (row) row.remove();
    updateTotalQuantity();
}

function updateTotalQuantity() {
    const total = activeSubprocesses.reduce((acc, curr) => acc + curr.qty, 0);
    document.getElementById('cantidad').value = total;
}

async function handleRegistroSubmit() {
    // 1. Identify Operator reliably
    const user = getCurrentUser();
    const isOperario = user && user.rol === 'operario';

    let operarioId = null;
    if (isOperario) {
        operarioId = user.id; // Use ID from session directly
    } else {
        const operarioSelect = document.getElementById('operario');
        operarioId = operarioSelect ? operarioSelect.value : null;
    }

    const fullAbsenceToggle = document.getElementById('fullAbsenceToggle');
    const isFullAbsence = fullAbsenceToggle ? fullAbsenceToggle.checked : false;
    const selectedFecha = document.getElementById('fecha') ? document.getElementById('fecha').value : 'No hay campo fecha';

    console.log('🚀 Iniciando GUARDADO de registro:');
    console.log('👤 Usuario Sesión:', user?.name, '(ID:', user?.id, 'Rol:', user?.rol, ')');
    console.log('🆔 Operario ID Identificado para el registro:', operarioId);
    console.log('📅 Fecha seleccionada:', selectedFecha);
    console.log('🚫 ¿Es ausencia total?:', isFullAbsence);

    const noveltyTypeElement = document.getElementById('noveltyType');
    const noveltyType = noveltyTypeElement ? noveltyTypeElement.value : null;
    const fileInput = document.getElementById('noveltyFile');
    const fileName = (fileInput && fileInput.files.length > 0) ? fileInput.files[0].name : null;

    if (!operarioId) {
        console.error('❌ Error Crítico: No se encontró operarioId. User:', user);
        showToast('❌ Error: No se pudo identificar al operario', 'error');
        return;
    }

    let formData = {};

    if (isFullAbsence) {
        // Validate Novelty
        if (!noveltyType) {
            showToast('⚠️ Debe seleccionar el Tipo de Novedad', 'warning');
            return;
        }

        // For full absence, we use "NOVEDAD" or similar as client/code placeholder if strictly needed by UI, 
        // but type='novedad_total' should handle logic.
        formData = {
            userId: parseInt(operarioId),
            fecha: document.getElementById('fecha').value,
            cliente: 'NOVEDAD',
            codigo: 'NOV',
            subproceso: '-',
            cantidad: 0,
            tiempo: '0:00',
            observaciones: document.getElementById('observaciones').value,
            type: 'novedad_total',
            novelty: {
                type: noveltyType,
                file: fileName
            }
        };

    } else {
        // Normal Production Logic
        const processCode = document.getElementById('codigo').value;
        const isSubprocessActive = document.getElementById('subprocessGroup').style.display !== 'none';

        // Validate Subprocesses
        if (isSubprocessActive) {
            if (activeSubprocesses.length === 0) {
                document.getElementById('subprocessError').style.display = 'block';
                showToast('⚠️ Debe agregar al menos un subproceso', 'warning');
                return;
            }
            if (activeSubprocesses.some(s => s.qty <= 0)) {
                showToast('⚠️ Todos los subprocesos deben tener cantidad mayor a 0', 'warning');
                return;
            }
        }

        const cantidad = parseInt(document.getElementById('cantidad').value);

        let subprocesoStr = "";
        let subprocesosDetalle = [];

        if (isSubprocessActive) {
            subprocesoStr = activeSubprocesses.length === 1 ? activeSubprocesses[0].name : "Múltiples";
            subprocesosDetalle = activeSubprocesses.map(s => ({ name: s.name, cantidad: s.qty }));
        } else {
            subprocesoStr = "-";
        }

        formData = {
            userId: parseInt(operarioId),
            fecha: document.getElementById('fecha').value,
            cliente: document.getElementById('cliente').value,
            codigo: processCode,
            subproceso: subprocesoStr,
            subprocesos_detalle: subprocesosDetalle,
            cantidad: cantidad,
            tiempo: document.getElementById('tiempoCalculado').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaFin: document.getElementById('horaFin').value,
            observaciones: document.getElementById('observaciones').value,
            type: 'production',
            novelty: noveltyType ? { type: noveltyType, file: fileName } : null
        };
    }

    console.log('📝 Preparando envío de datos:', formData);

    if (window.saveRegistration) {
        const result = await saveRegistration(formData);
        if (result) {
            showToast('✅ Registro guardado exitosamente', 'success');
            clearRegistroForm();
            if (typeof renderAlerts === 'function') renderAlerts();
        }
    } else {
        console.error('saveRegistration function not found');
    }
}

function clearRegistroForm() {
    const form = document.getElementById('registroForm');
    if (form) form.reset();

    // Reset Toggle
    toggleFullNoveltyMode(false);
    const toggle = document.getElementById('fullAbsenceToggle');
    if (toggle) toggle.checked = false;

    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = localDate;
        const status = document.getElementById('fechaStatus');
        if (status) status.textContent = '';
    }

    // Reset subprocess vars/ui
    activeSubprocesses = [];
    const subList = document.getElementById('subprocessList');
    if (subList) subList.innerHTML = '';
    const subGroup = document.getElementById('subprocessGroup');
    if (subGroup) subGroup.style.display = 'none';

    const cantInput = document.getElementById('cantidad');
    if (cantInput) {
        cantInput.readOnly = false;
        cantInput.placeholder = "0";
    }

    const durationDisplay = document.getElementById('durationDisplay');
    const hiddenTime = document.getElementById('tiempoCalculado');
    if (durationDisplay) durationDisplay.style.display = 'none';
    if (hiddenTime) hiddenTime.value = '00:00';

    loadCurrentTarget();
}

function calculateDuration() {
    const inicio = document.getElementById('horaInicio').value;
    const fin = document.getElementById('horaFin').value;
    const display = document.getElementById('durationDisplay');
    const calculatedSpan = document.getElementById('calculatedTime');
    const hiddenInput = document.getElementById('tiempoCalculado');

    if (!inicio || !fin) {
        if (display) display.style.display = 'none';
        return;
    }

    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);

    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

    if (totalMinutes < 0) {
        showToast('⚠️ La hora final debe ser posterior a la inicial', 'warning');
        if (display) display.style.display = 'none';
        return;
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const timeFormatted = `${hours}h ${mins}m`;
    if (calculatedSpan) calculatedSpan.textContent = timeFormatted;
    if (hiddenInput) hiddenInput.value = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    if (display) display.style.display = 'block';
}

function addSubprocessRow() {
    const selector = document.getElementById('subprocesoSelector');
    const subName = selector.value;
    if (!subName) return;

    if (activeSubprocesses.some(s => s.name === subName)) {
        showToast('⚠️ Este subproceso ya fue agregado', 'warning');
        return;
    }

    const id = Date.now();
    activeSubprocesses.push({ id, name: subName, qty: 0 });
    renderSubprocessList();
    selector.value = '';
}

function removeSubprocessRow(id) {
    activeSubprocesses = activeSubprocesses.filter(s => s.id !== id);
    renderSubprocessList();
    updateTotalQuantity();
}

function updateSubprocessQty(id, qty) {
    const sub = activeSubprocesses.find(s => s.id === id);
    if (sub) {
        sub.qty = parseInt(qty) || 0;
        updateTotalQuantity();
    }
}

function renderSubprocessList() {
    const list = document.getElementById('subprocessList');
    list.innerHTML = activeSubprocesses.map(s => `
        <div class="subprocess-row" style="display: flex; align-items: center; gap: 0.5rem; background: white; padding: 0.5rem; border-radius: 6px; border: 1px solid #e5e7eb;">
            <span style="flex: 1; font-weight: 500;">${s.name}</span>
            <input type="number" min="1" value="${s.qty || ''}" placeholder="Cantidad" 
                onchange="updateSubprocessQty(${s.id}, this.value)" 
                style="width: 80px; padding: 0.25rem;">
            <button type="button" class="btn-icon" onclick="removeSubprocessRow(${s.id})" style="color: #ef4444;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    `).join('');

    document.getElementById('subprocessError').style.display = 'none';
}

function updateTotalQuantity() {
    const total = activeSubprocesses.reduce((acc, curr) => acc + curr.qty, 0);
    document.getElementById('cantidad').value = total;
}
