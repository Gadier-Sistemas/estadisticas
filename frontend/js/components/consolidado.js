/**
 * Inicializa el módulo de consolidado, configurando el HTML base y cargando los datos iniciales.
 */
function loadConsolidadoModule() {
    const consolidadoModule = document.getElementById('module-consolidado');

    consolidadoModule.innerHTML = `
        <div class="module-header">
            <h2>Consolidado de Rendimiento</h2>
            <p class="module-description">Análisis de rendimiento Real vs Esperado — Basado en la fórmula de 540 minutos</p>
        </div>

        <div class="form-card" style="margin-bottom: var(--spacing-2xl); background: #f8fafc; border: 1px dashed var(--primary-color);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; align-items: flex-end;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-secondary);">Seleccionar Operario</label>
                    <select id="consolidadoOperario" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                        <option value="">Filtro Global (Todos)</option>
                        ${(window.getUsers ? getUsers() : []).filter(u => u.rol === 'operario').map(op => 
                            `<option value="${op.id}">${op.name} ${op.apellido || ''}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-secondary);">Fecha de Análisis</label>
                    <input type="date" id="consolidadoFecha" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div>
                    <button class="btn btn-primary" onclick="generateConsolidado()" style="width: 100%; padding: 0.75rem; justify-content: center;">
                        📊 Calcular Rendimiento
                    </button>
                </div>
            </div>
        </div>

        <div id="rendimientoStats" class="stats-grid" style="margin-bottom: var(--spacing-2xl);">
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <h3>Cargando...</h3>
                    <p class="stat-value">—</p>
                </div>
            </div>
        </div>

        <div id="rendimientoResumen" class="form-card" style="margin-bottom: var(--spacing-2xl);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <h3>📋 Resumen por Proceso (Real vs Esperado)</h3>
                <button class="btn btn-success" onclick="exportConsolidadoExcel()">
                    📥 Exportar
                </button>
            </div>
            <div class="table-container">
                <p style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Presiona "Analizar Rendimiento" para cargar los datos
                </p>
            </div>
        </div>

        <div id="rendimientoDetalle" class="form-card">
            <h3>📝 Detalle por Registro</h3>
            <div class="table-container">
                <p style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Presiona "Analizar Rendimiento" para cargar los datos
                </p>
            </div>
        </div>
    `;

    // Carga automática al abrir el módulo
    generateConsolidado();
}

/**
 * Genera el análisis consolidado de rendimiento consultando la API.
 * Aplica la fórmula BI: Rendimiento = Cantidad / ((Meta / 540) * Minutos)
 * @async
 * @returns {Promise<void>}
 */
async function generateConsolidado() {
    const fecha = document.getElementById('consolidadoFecha')?.value || new Date().toISOString().split('T')[0];
    const opSelect = document.getElementById('consolidadoOperario');
    const userId = opSelect ? opSelect.value : '';

    showToast('📊 Calculando rendimiento...', 'info');

    try {
        let url = `${API_URL}/dashboard/rendimiento?fecha=${fecha}`;
        if (userId) {
            url += `&user_id=${userId}`;
        }

        const token = sessionStorage.getItem('authToken');
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al obtener datos de rendimiento');

        const data = await response.json();
        window.currentConsolidadoData = data; // Guardamos para exportar

        renderRendimientoStats(data);
        renderResumenTable(data.resumen);
        renderDetalleTable(data.detalle);

        showToast(`✅ Rendimiento calculado: ${data.total_registros} registros analizados`, 'success');

    } catch (error) {
        console.error('Error en consolidado:', error);
        showToast('⚠️ No hay registros para esta fecha o hubo un error', 'warning');
    }
}

/**
 * Renderiza las tarjetas KPI de rendimiento (Global, Producción Real vs Esperada).
 * @param {Object} data - Datos devueltos por la API de rendimiento.
 */
function renderRendimientoStats(data) {
    const statsContainer = document.getElementById('rendimientoStats');
    if (!statsContainer) return;

    const totalRegistros = data.total_registros || 0;
    const resumen = data.resumen || [];

    // Calcular promedios generales
    const totalRealizado = resumen.reduce((acc, r) => acc + r.produccion_realizada, 0);
    const totalEsperado = resumen.reduce((acc, r) => acc + r.produccion_esperada, 0);
    const rendimientoGlobal = totalEsperado > 0 ? ((totalRealizado / totalEsperado) * 100).toFixed(1) : 0;
    const semaforoColor = rendimientoGlobal >= 90 ? '#10b981' : (rendimientoGlobal >= 70 ? '#f59e0b' : '#ef4444');
    const semaforoIcon = rendimientoGlobal >= 90 ? '🟢' : (rendimientoGlobal >= 70 ? '🟡' : '🔴');

    statsContainer.innerHTML = `
        <div class="stat-card" style="border-left: 4px solid ${semaforoColor};">
            <div class="stat-icon">${semaforoIcon}</div>
            <div class="stat-content">
                <h3>Rendimiento Global</h3>
                <p class="stat-value" style="color: ${semaforoColor};">${rendimientoGlobal}%</p>
                <span class="stat-label">Meta: ≥ 90%</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
                <h3>Producción Real</h3>
                <p class="stat-value">${formatNumber(totalRealizado)}</p>
                <span class="stat-label">Unidades procesadas</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <h3>Producción Esperada</h3>
                <p class="stat-value">${formatNumber(Math.round(totalEsperado))}</p>
                <span class="stat-label">Según metas y tiempo</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
                <h3>Total Registros</h3>
                <p class="stat-value">${totalRegistros}</p>
                <span class="stat-label">${data.fecha}</span>
            </div>
        </div>
    `;
}

/**
 * Renderiza la tabla de resumen por proceso (replica la hoja "Resumen" del Excel).
 */
function renderResumenTable(resumen) {
    const container = document.getElementById('rendimientoResumen');
    if (!container || !resumen) return;

    const rows = resumen.map(r => {
        const semaforoIcon = r.semaforo === 'verde' ? '🟢' : (r.semaforo === 'amarillo' ? '🟡' : '🔴');
        const semaforoColor = r.semaforo === 'verde' ? '#10b981' : (r.semaforo === 'amarillo' ? '#f59e0b' : '#ef4444');

        return `
            <tr>
                <td><strong>${r.proceso}</strong></td>
                <td>${r.unidad}</td>
                <td><strong>${formatNumber(r.produccion_realizada)}</strong></td>
                <td>${formatNumber(Math.round(r.produccion_esperada))}</td>
                <td>
                    <span style="color: ${semaforoColor}; font-weight: 700;">
                        ${semaforoIcon} ${r.rendimiento}%
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div class="progress-bar-mini">
                            <div class="progress-fill-mini" style="width: ${Math.min(r.rendimiento, 100)}%; background: ${semaforoColor};"></div>
                        </div>
                        <span style="color: ${r.rendimiento_faltante > 0 ? '#ef4444' : '#10b981'};">
                            ${r.rendimiento_faltante > 0 ? '-' + r.rendimiento_faltante + '%' : '✓'}
                        </span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
            <h3 style="margin: 0; color: var(--primary-color);">📋 Resumen Acumulado por Proceso</h3>
            <button class="btn btn-success" onclick="exportConsolidadoExcel()" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                📥 Exportar Excel
            </button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Proceso</th>
                        <th>Unidad</th>
                        <th>Producción Real</th>
                        <th>Producción Esperada</th>
                        <th>% Rendimiento</th>
                        <th>Faltante</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length > 0 ? rows : '<tr><td colspan="6" style="text-align:center; padding:2rem;">Sin registros para esta fecha</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renderiza la tabla de detalle por registro individual.
 */
function renderDetalleTable(detalle) {
    const container = document.getElementById('rendimientoDetalle');
    if (!container || !detalle) return;

    const rows = detalle.map(d => {
        const semaforoIcon = d.semaforo === 'verde' ? '🟢' : (d.semaforo === 'amarillo' ? '🟡' : '🔴');
        const semaforoColor = d.semaforo === 'verde' ? '#10b981' : (d.semaforo === 'amarillo' ? '#f59e0b' : '#ef4444');

        return `
            <tr>
                <td>${d.operario}</td>
                <td><span class="code-badge">${d.proceso_codigo}</span></td>
                <td>${d.proceso_nombre}</td>
                <td>${d.proyecto}</td>
                <td><strong>${formatNumber(d.cantidad)}</strong> ${d.unidad}</td>
                <td>${d.tiempo} (${d.minutos_trabajados} min)</td>
                <td>${formatNumber(Math.round(d.produccion_esperada))}</td>
                <td style="color: ${semaforoColor}; font-weight: 700;">${semaforoIcon} ${d.rendimiento_porcentaje}%</td>
                <td>${d.observaciones || '—'}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
            <h3 style="margin: 0; color: var(--primary-color);">📝 Detalle de Productividad por Registro</h3>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Operario</th>
                        <th>Código</th>
                        <th>Proceso</th>
                        <th>Proyecto</th>
                        <th>Cantidad</th>
                        <th>Tiempo</th>
                        <th>Esperado</th>
                        <th>Rendimiento</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length > 0 ? rows : '<tr><td colspan="9" style="text-align:center; padding:2rem;">Sin registros para esta fecha</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Exportación a Excel (placeholder — se implementará con SheetJS).
 */
function exportConsolidadoExcel() {
    if (!window.currentConsolidadoData || !window.currentConsolidadoData.detalle || window.currentConsolidadoData.detalle.length === 0) {
        showToast('⚠️ No hay datos para exportar', 'warning');
        return;
    }

    showToast('📥 Generando Exportable CSV...', 'info');
    
    const headers = ['Operario', 'Codigo', 'Proceso', 'Proyecto', 'Cantidad', 'Unidad_Medida', 'Tiempo', 'Minutos', 'Produccion_Esperada', 'Rendimiento_Pct', 'Semaforo', 'Observaciones'];
    let csvContent = headers.join(',') + '\\n';

    window.currentConsolidadoData.detalle.forEach(d => {
        const row = [
            `"${d.operario || ''}"`,
            d.proceso_codigo || '',
            `"${d.proceso_nombre || ''}"`,
            `"${d.proyecto || ''}"`,
            d.cantidad || 0,
            d.unidad || '',
            d.tiempo || '0:00',
            d.minutos_trabajados || 0,
            d.produccion_esperada || 0,
            d.rendimiento_porcentaje || 0,
            d.semaforo || '',
            `"${(d.observaciones || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Consolidado_Gadier_${window.currentConsolidadoData.fecha}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✅ Archivo CSV descargado', 'success');
}
