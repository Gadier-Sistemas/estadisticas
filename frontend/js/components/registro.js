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
            <div style="margin-top: 0.75rem; display: inline-flex; background: #f1f5f9; padding: 0.25rem; border-radius: 8px; gap: 0.25rem;">
                <button type="button" id="btnModoFormulario" onclick="setRegistroMode('form')" style="padding: 0.4rem 0.9rem; border: none; border-radius: 6px; background: var(--primary-color); color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer;">📝 Formulario</button>
                <button type="button" id="btnModoTabla" onclick="setRegistroMode('table')" style="padding: 0.4rem 0.9rem; border: none; border-radius: 6px; background: transparent; color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; cursor: pointer;">📋 Tabla múltiple</button>
            </div>
        </div>

        <div class="registro-container">
            <div class="registro-form-section">
                <div class="form-card" id="modoFormularioContainer">
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



                        <!-- Common Fields (Always visible) -->
                        <div class="form-group full-width" style="display: none;">
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

                        <div class="form-group">
                            <label for="fecha" style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Fecha</span>
                                <span id="fechaStatus" style="font-size: 0.75rem; color: var(--secondary-color); font-weight: 600;"></span>
                            </label>
                            <input type="date" id="fecha" required style="font-weight: 600; border: 2px solid var(--primary-color);">
                        </div>

                        <!-- Production Fields (Wrapped for toggling) -->
                        <div id="productionFields" style="display: contents;">
                            <div class="form-group full-width">
                                <label for="proyecto">Proyecto / Cliente</label>
                                <select id="proyecto" required onchange="handleProjectChange(this.value)">
                                    <option value="">Seleccionar proyecto...</option>
                                    ${(sampleData.projects || []).map(p => `
                                        <option value="${p.id}">${escapeHtml(p.nombre)} (${escapeHtml(p.cliente || '')})</option>
                                    `).join('')}
                                </select>
                                <input type="hidden" id="cliente" value="">
                            </div>

                            <div class="form-group">
                                <label for="codigo">Proceso</label>
                                <select id="codigo" required onchange="calculatePerformance()">
                                    <option value="">Seleccionar proceso...</option>
                                    ${sampleData.processes.map(proc => {
                                        const code = proc.codigo || proc.code || '';
                                        const name = proc.nombre || proc.name || '';
                                        return `<option value="${escapeHtml(code)}">${escapeHtml(code)} - ${escapeHtml(name)}</option>`;
                                    }).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="cantidad">Cantidad Total</label>
                                <input type="number" id="cantidad" min="1" placeholder="0" required oninput="calculatePerformance()">
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
                                <div id="durationDisplay" style="margin-top: 0.25rem; font-weight: 600; color: var(--secondary-color); font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.25rem; display: none;">
                                    <div>Total: <span id="calculatedTime">0h 0m</span></div>
                                    <!-- Badge de rendimiento inyectado aquí -->
                                </div>
                                <input type="hidden" id="tiempoCalculado" value="00:00">
                            </div>

                            <div class="form-group full-width" style="background: #fef9c3; border: 1px dashed #eab308; border-radius: 8px; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem;">
                                <input type="checkbox" id="mediaJornadaToggle" onchange="calculatePerformance()" style="width: 18px; height: 18px;">
                                <div>
                                    <label for="mediaJornadaToggle" style="font-weight: 600; color: #854d0e; cursor: pointer;">Media jornada (270 min)</label>
                                    <p class="text-xs text-muted" style="margin: 0;">Márquelo si trabajó solo media jornada. El rendimiento se calcula contra 270 min en lugar de 540.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Observaciones (siempre visible) -->
                        <div class="form-group full-width">
                            <label for="observaciones">Observaciones</label>
                            <textarea id="observaciones" rows="3" placeholder="Notas adicionales (opcional)"></textarea>
                        </div>

                        <!-- Novelty / Support Section (Collapse toggle) -->
                        <div class="form-group full-width" style="border-top: 2px dashed #e2e8f0; padding-top: 1.5rem; margin-top: 1rem;">

                            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Novedades y Ausencias</h4>

                            <!-- Full Absence Toggle moved here -->
                            <div style="margin-bottom: 1rem; padding: 1rem; background: #fff1f2; border: 1px solid #fda4af; border-radius: 8px; display: flex; align-items: center; gap: 1rem;">
                                <input type="checkbox" id="fullAbsenceToggle" onchange="toggleFullNoveltyMode(this.checked)" style="width: 20px; height: 20px;">
                                <div>
                                    <label for="fullAbsenceToggle" style="font-weight: 700; color: #be123c; cursor: pointer;">Día No Laborado (Incapacidad Total, Licencia, etc.)</label>
                                    <p class="text-xs text-muted" style="margin: 0;">Marque esta casilla si no hubo producción hoy.</p>
                                </div>
                            </div>

                            <div id="noveltyContent" style="display: none; margin-top: 1rem;">
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

                <div class="form-card" id="modoTablaContainer" style="display: none;">
                    <div class="form-header">
                        <h3>📋 Registro Tabla Múltiple</h3>
                        <p class="text-xs text-muted">Registra varias actividades del día de una sola vez. Máximo 50 filas por envío.</p>
                    </div>

                    <div style="margin-bottom: 1rem; padding: 0.75rem 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
                        <label style="font-weight: 600; color: var(--primary-color); display: block; margin-bottom: 0.25rem;">Fecha</label>
                        <input type="date" id="tablaFecha" style="padding: 0.4rem; border: 1px solid #ddd; border-radius: 6px;">
                        <span id="tablaFechaStatus" style="margin-left: 0.75rem; font-size: 0.8rem; color: var(--text-secondary);"></span>
                    </div>

                    <div class="table-container" style="max-height: 500px; overflow-y: auto;">
                        <table class="data-table" id="multiActivityTable">
                            <thead>
                                <tr>
                                    <th style="min-width: 180px;">Proyecto</th>
                                    <th style="min-width: 180px;">Proceso</th>
                                    <th style="width: 100px;">Cantidad</th>
                                    <th style="width: 120px;">Hora inicio</th>
                                    <th style="width: 120px;">Hora fin</th>
                                    <th style="width: 80px;" title="Media jornada">½ J.</th>
                                    <th style="width: 50px;"></th>
                                </tr>
                            </thead>
                            <tbody id="multiActivityTableBody">
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                        <button type="button" class="btn btn-secondary" onclick="addTableRow()">➕ Agregar fila</button>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="btn btn-secondary" onclick="clearTableRows()">🗑️ Limpiar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarBatch" onclick="saveBatchRegistrations()">💾 Guardar todas</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="registro-reference-section">
                <div class="form-card">
                    <div class="form-header">
                        <h3>📋 Mis Registros de Hoy</h3>
                        <p class="text-xs text-muted">Actividades reportadas en la jornada actual</p>
                    </div>
                    
                    <div class="table-container">
                        <table class="data-table" id="todayRegistrationsTable">
                            <thead>
                                <tr>
                                    <th>Proceso / Detalle</th>
                                    <th>Ctd.</th>
                                    <th>Tiempo</th>
                                </tr>
                            </thead>
                            <tbody id="todayRegistrationsBody">
                                <!-- Loads dynamically via renderTodayRegistrations() -->
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 1.5rem; text-align: center;">
                        <button class="btn btn-secondary" onclick="document.querySelector('[data-module=\\'dashboard\\']').click()">📊 Ver Mi Historial Completo</button>
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
        const isSuperadmin = user && user.rol === 'superadmin';
        const dateToUse = (isSuperadmin && window.nextRegistrationDate) ? window.nextRegistrationDate : todayStr;
        fInput.value = dateToUse;

        // Operario solo puede registrar el día actual (Req 7); superadmin puede libre
        if (!isSuperadmin) {
            fInput.min = todayStr;
            fInput.max = todayStr;
            fInput.readOnly = true;
        }

        // Show status if it's a past date (solo aplica a superadmin)
        const status = document.getElementById('fechaStatus');
        if (status && isSuperadmin && window.nextRegistrationDate && window.nextRegistrationDate !== todayStr) {
            status.textContent = '📍 Registrando para día seleccionado: ' + window.nextRegistrationDate;
        }

        window.nextRegistrationDate = null; // Consume
    }

    loadCurrentTarget();
    renderTodayRegistrations();
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
        // Mostrar novedades
        document.getElementById('noveltyContent').style.display = 'block';
    } else {
        prodFields.style.display = 'contents';
        // Restore required
        prodInputs.forEach(input => {
            if (input.getAttribute('data-was-required') === 'true') {
                input.setAttribute('required', 'true');
            }
        });

        document.getElementById('noveltyType').removeAttribute('required');
        // Ocultar novedades
        document.getElementById('noveltyContent').style.display = 'none';
        // Limpiar seleccion de Novedad
        document.getElementById('noveltyType').value = "";
    }
}

async function handleRegistroSubmit() {
    // 1. Common Fields
    const user = getCurrentUser();
    const isOperario = user && user.rol === 'operario';
    const operarioId = isOperario ? user.id : document.getElementById('operario').value;
    const proyectoId = document.getElementById('proyecto')?.value;
    const fecha = document.getElementById('fecha').value;
    const observaciones = document.getElementById('observaciones').value;
    const isFullAbsence = document.getElementById('fullAbsenceToggle')?.checked;

    if (!operarioId) {
        showToast('❌ Error: No se pudo identificar al operario', 'error');
        return;
    }



    const noveltyTypeElement = document.getElementById('noveltyType');
    const noveltyType = noveltyTypeElement ? noveltyTypeElement.value : null;
    const fileInput = document.getElementById('noveltyFile');
    const fileName = (fileInput && fileInput.files.length > 0) ? fileInput.files[0].name : null;

    const isMediaJornada = document.getElementById('mediaJornadaToggle')?.checked === true;

    let formData = {
        userId: parseInt(operarioId),
        proyecto_id: proyectoId ? parseInt(proyectoId) : null,
        fecha: fecha,
        observaciones: observaciones,
        cliente: document.getElementById('cliente').value,
        media_jornada: isMediaJornada
    };

    if (isFullAbsence) {
        // Validate Novelty
        if (!noveltyType) {
            showToast('⚠️ Debe seleccionar el Tipo de Novedad', 'warning');
            return;
        }

        Object.assign(formData, {
            cliente: 'NOVEDAD',
            codigo: 'NOV',
            cantidad: 0,
            tiempo: '0:00',
            type: 'novedad_total',
            novelty: {
                type: noveltyType,
                file: fileName
            }
        });

    } else {
        const processCode = document.getElementById('codigo').value;
        const cantidad = parseInt(document.getElementById('cantidad').value);

        Object.assign(formData, {
            codigo: processCode,
            cantidad: cantidad,
            tiempo: document.getElementById('tiempoCalculado').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaFin: document.getElementById('horaFin').value,
            type: 'produccion',
            novelty: noveltyType ? { type: noveltyType, file: fileName } : null
        });
    }

    if (window.saveRegistration) {
        const result = await saveRegistration(formData);
        if (result) {
            showToast('✅ Registro guardado exitosamente', 'success');
            clearRegistroForm();
            renderTodayRegistrations();
            if (typeof renderAlerts === 'function') renderAlerts();
        }
    } else {
        console.error('saveRegistration function not found');
    }
}

function handleProjectChange(projectId) {
    const project = sampleData.projects.find(p => parseInt(p.id) === parseInt(projectId));
    if (project) {
        const clienteInput = document.getElementById('cliente');
        if (clienteInput) clienteInput.value = project.cliente;
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

    const durationDisplay = document.getElementById('durationDisplay');
    const hiddenTime = document.getElementById('tiempoCalculado');
    if (durationDisplay) durationDisplay.style.display = 'none';
    if (hiddenTime) hiddenTime.value = '00:00';

    loadCurrentTarget();
}

function calculateDuration() {
    const inicio = document.getElementById('horaInicio');
    const fin = document.getElementById('horaFin');
    const display = document.getElementById('durationDisplay');
    const calculatedSpan = document.getElementById('calculatedTime');
    const hiddenInput = document.getElementById('tiempoCalculado');

    if (!inicio.value || !fin.value) {
        if (display) display.style.display = 'none';
        return;
    }

    const [h1, m1] = inicio.value.split(':').map(Number);
    const [h2, m2] = fin.value.split(':').map(Number);

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
    if (display) display.style.display = 'flex';
    
    calculatePerformance(); // Calcular rendimiento cuando cambia tiempo
}

function calculatePerformance() {
    const processCode = document.getElementById('codigo')?.value;
    const cantidadInput = document.getElementById('cantidad')?.value;
    const hiddenTime = document.getElementById('tiempoCalculado')?.value;
    const display = document.getElementById('durationDisplay');

    // Remove any existing badge
    const existingBadge = document.getElementById('perfBadge');
    if (existingBadge) existingBadge.remove();

    if (!processCode || !cantidadInput || !hiddenTime || hiddenTime === '00:00' || !display) return;

    const process = sampleData.processes.find(p => (p.codigo || p.code) === processCode);
    if (!process) return;

    const [h, m] = hiddenTime.split(':').map(Number);
    const totalMinutes = (h * 60) + m;

    if (totalMinutes <= 0) return;

    // Fórmula: Cantidad / ((Meta / jornadaMin) * TotalMinutos)
    // jornadaMin = 270 si media jornada, 540 jornada completa
    const metaDiaria = process.meta_diaria || process.cantidad || 0;
    if (metaDiaria <= 0) return; // Si no hay meta, no calculamos

    const isMediaJornada = document.getElementById('mediaJornadaToggle')?.checked === true;
    const jornadaMin = isMediaJornada ? 270 : 540;
    const produccionEsperada = (metaDiaria / jornadaMin) * totalMinutes;

    if (produccionEsperada > 0) {
        const rendimiento = (parseInt(cantidadInput) / produccionEsperada) * 100;
        let color = '#ef4444'; // red
        let label = 'Bajo';
        let emoji = '🔴';
        
        if (rendimiento >= 95) {
            color = '#10b981'; // green
            label = 'Óptimo';
            emoji = '🟢';
        } else if (rendimiento >= 80) {
            color = '#f59e0b'; // yellow
            label = 'Riesgo';
            emoji = '🟡';
        }

        const badgeHtml = `<div id="perfBadge" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; border: 1px solid ${color}; background: ${color}10; color: ${color}; font-weight: 600; width: fit-content; margin-top: 0.25rem;">
            ${emoji} Rendimiento: ${rendimiento.toFixed(1)}% (${label})
        </div>`;
        
        display.insertAdjacentHTML('beforeend', badgeHtml);
    }
}

function renderTodayRegistrations() {
    const todayBody = document.getElementById('todayRegistrationsBody');
    if (!todayBody) return;

    const user = getCurrentUser();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const regs = sampleData.registrations.filter(r => 
        (r.userId == user.id || r.user_id == user.id) && r.fecha === todayStr
    );

    if (regs.length === 0) {
        todayBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">Aún no has registrado actividades hoy</td></tr>`;
        return;
    }

    const tipoNovedad = r => r.tipo === 'novedad_total' || r.type === 'novedad_total' || r.type === 'novelty';

    todayBody.innerHTML = regs.map(r => {
        const isNovelty = tipoNovedad(r);
        const procName = isNovelty
            ? (r.novedad_tipo || r.novelty?.type || 'Novedad')
            : (r.codigo || '-');

        const obs = (r.observaciones || '').trim();
        const detailStr = isNovelty
            ? (obs || 'Día completo')
            : (obs || 'Sin observaciones');

        const cantidad = parseInt(r.cantidad || 0);
        const tiempo = r.tiempo || '0:00';
        const mediaBadge = (r.media_jornada === true || r.media_jornada === 1)
            ? '<span style="display: inline-block; background: #fef9c3; color: #854d0e; font-size: 0.65rem; padding: 1px 6px; border-radius: 8px; margin-left: 4px; border: 1px solid #eab308;">½ jornada</span>'
            : '';

        return `
            <tr style="font-size: 0.85rem; ${isNovelty ? 'background-color: #f0fdf4;' : ''}">
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(procName)}${mediaBadge}</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(detailStr)}">${escapeHtml(detailStr)}</div>
                </td>
                <td style="font-weight: 500;">${isNovelty ? 'N/A' : cantidad}</td>
                <td style="color: var(--text-secondary);"><span class="badge ${isNovelty ? 'badge-primary' : 'badge-secondary'}" style="font-size: 0.7rem;">${escapeHtml(tiempo)}</span></td>
            </tr>
        `;
    }).join('');
}

// --- Modo Tabla (Req 3) ---

const MULTI_MAX_ROWS = 50;
let multiRowCounter = 0;

function setRegistroMode(mode) {
    const formContainer = document.getElementById('modoFormularioContainer');
    const tableContainer = document.getElementById('modoTablaContainer');
    const btnForm = document.getElementById('btnModoFormulario');
    const btnTable = document.getElementById('btnModoTabla');

    if (!formContainer || !tableContainer) return;

    const active = 'background: var(--primary-color); color: white;';
    const inactive = 'background: transparent; color: var(--text-secondary);';

    if (mode === 'table') {
        formContainer.style.display = 'none';
        tableContainer.style.display = '';
        btnForm.style.cssText = btnForm.style.cssText.replace(active, '') + inactive;
        btnTable.style.cssText = btnTable.style.cssText.replace(inactive, '') + active;

        initMultiActivityTable();
    } else {
        formContainer.style.display = '';
        tableContainer.style.display = 'none';
        btnForm.style.cssText = btnForm.style.cssText.replace(inactive, '') + active;
        btnTable.style.cssText = btnTable.style.cssText.replace(active, '') + inactive;
    }
}

function initMultiActivityTable() {
    const user = getCurrentUser();
    const isSuperadmin = user && user.rol === 'superadmin';
    const fechaInput = document.getElementById('tablaFecha');
    const status = document.getElementById('tablaFechaStatus');
    if (!fechaInput) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    fechaInput.value = todayStr;

    if (!isSuperadmin) {
        fechaInput.min = todayStr;
        fechaInput.max = todayStr;
        fechaInput.readOnly = true;
        if (status) status.textContent = 'Solo día actual';
    } else {
        fechaInput.min = '';
        fechaInput.max = '';
        fechaInput.readOnly = false;
        if (status) status.textContent = '(Superadmin: puede seleccionar cualquier fecha)';
    }

    const tbody = document.getElementById('multiActivityTableBody');
    if (tbody && tbody.children.length === 0) {
        addTableRow();
    }
}

function projectOptionsHtml() {
    const projects = sampleData.projects || [];
    return '<option value="">Seleccionar...</option>' + projects.map(p =>
        `<option value="${p.id}">${escapeHtml(p.nombre)} (${escapeHtml(p.cliente || '')})</option>`
    ).join('');
}

function processOptionsHtml() {
    const procs = sampleData.processes || [];
    return '<option value="">Seleccionar...</option>' + procs.map(p => {
        const code = p.codigo || p.code;
        const name = p.nombre || p.name || '';
        return `<option value="${escapeHtml(code)}">${escapeHtml(code)} - ${escapeHtml(name)}</option>`;
    }).join('');
}

function addTableRow() {
    const tbody = document.getElementById('multiActivityTableBody');
    if (!tbody) return;
    if (tbody.children.length >= MULTI_MAX_ROWS) {
        showToast(`⚠️ Máximo ${MULTI_MAX_ROWS} filas por envío`, 'warning');
        return;
    }

    multiRowCounter += 1;
    const id = `mrow-${multiRowCounter}`;
    const tr = document.createElement('tr');
    tr.id = id;
    tr.innerHTML = `
        <td><select class="multi-proyecto" style="width: 100%; padding: 0.3rem;">${projectOptionsHtml()}</select></td>
        <td><select class="multi-proceso" style="width: 100%; padding: 0.3rem;">${processOptionsHtml()}</select></td>
        <td><input type="number" class="multi-cantidad" min="1" placeholder="0" style="width: 100%; padding: 0.3rem;"></td>
        <td><input type="time" class="multi-hora-inicio" style="width: 100%; padding: 0.3rem;"></td>
        <td><input type="time" class="multi-hora-fin" style="width: 100%; padding: 0.3rem;"></td>
        <td style="text-align: center;"><input type="checkbox" class="multi-media-jornada"></td>
        <td style="text-align: center;"><button type="button" class="btn-icon text-danger" onclick="removeTableRow('${id}')" style="background: #fee2e2; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">✕</button></td>
    `;
    tbody.appendChild(tr);
}

function removeTableRow(id) {
    const row = document.getElementById(id);
    if (row) row.remove();
}

function clearTableRows() {
    const tbody = document.getElementById('multiActivityTableBody');
    if (tbody) tbody.innerHTML = '';
    addTableRow();
}

function collectMultiRows() {
    const rows = document.querySelectorAll('#multiActivityTableBody tr');
    const result = [];
    const errores = [];

    rows.forEach((tr, idx) => {
        const proyectoId = tr.querySelector('.multi-proyecto').value;
        const procesoCodigo = tr.querySelector('.multi-proceso').value;
        const cantidad = tr.querySelector('.multi-cantidad').value;
        const horaInicio = tr.querySelector('.multi-hora-inicio').value;
        const horaFin = tr.querySelector('.multi-hora-fin').value;
        const mediaJornada = tr.querySelector('.multi-media-jornada').checked;

        if (!proyectoId || !procesoCodigo || !cantidad || !horaInicio || !horaFin) {
            errores.push(`Fila ${idx + 1}: faltan datos obligatorios`);
            return;
        }

        const [h1, m1] = horaInicio.split(':').map(Number);
        const [h2, m2] = horaFin.split(':').map(Number);
        const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);

        if (totalMin <= 0) {
            errores.push(`Fila ${idx + 1}: hora fin debe ser posterior a hora inicio`);
            return;
        }

        const qty = parseInt(cantidad);
        if (isNaN(qty) || qty < 1) {
            errores.push(`Fila ${idx + 1}: cantidad debe ser al menos 1`);
            return;
        }

        const hours = Math.floor(totalMin / 60);
        const mins = totalMin % 60;
        const tiempo = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

        const project = (sampleData.projects || []).find(p => parseInt(p.id) === parseInt(proyectoId));

        result.push({
            proyecto_id: parseInt(proyectoId),
            proceso_codigo: procesoCodigo,
            cantidad: qty,
            tiempo: tiempo,
            media_jornada: mediaJornada,
            cliente: project ? project.cliente : null,
            tipo: 'produccion',
        });
    });

    return { rows: result, errores };
}

async function saveBatchRegistrations() {
    const btn = document.getElementById('btnGuardarBatch');
    const fechaInput = document.getElementById('tablaFecha');
    if (!fechaInput || !fechaInput.value) {
        showToast('⚠️ Selecciona una fecha', 'warning');
        return;
    }

    const { rows, errores } = collectMultiRows();

    if (errores.length > 0) {
        showToast(`⚠️ ${errores[0]}`, 'warning');
        return;
    }

    if (rows.length === 0) {
        showToast('⚠️ Agrega al menos una fila', 'warning');
        return;
    }

    const payload = {
        registros: rows.map(r => ({ ...r, fecha: fechaInput.value })),
    };

    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⌛ Guardando...';
    }

    try {
        const res = await fetch(`${API_URL}/registros/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 201) {
            const data = await res.json();
            showToast(`✅ ${data.total} registros guardados`, 'success');
            clearTableRows();
            if (typeof syncRegistrations === 'function') await syncRegistrations();
            renderTodayRegistrations();
            if (typeof renderAlerts === 'function') renderAlerts();
        } else if (res.status === 422) {
            const data = await res.json();
            if (data.errores && Array.isArray(data.errores) && data.errores.length > 0) {
                const primero = data.errores[0];
                const msg = primero.mensajes ? primero.mensajes[0] : 'Validación fallida';
                showToast(`❌ Fila ${(primero.index ?? 0) + 1}: ${msg}`, 'error');
            } else {
                showToast('❌ ' + (data.message || 'Validación fallida'), 'error');
            }
        } else if (res.status === 429) {
            showToast('⚠️ Demasiadas solicitudes. Intenta en un momento.', 'warning');
        } else {
            showToast('❌ Error del servidor', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Error de red al guardar', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}
