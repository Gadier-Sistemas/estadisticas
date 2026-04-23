// Biometrico Module - Req 8: Import y cruce con estadísticas

function loadBiometricoModule() {
    const container = document.getElementById('module-biometrico');
    if (!container) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    container.innerHTML = `
        <div class="module-header">
            <h2>Biométrico</h2>
            <p class="module-description">Importe el reporte del sistema biométrico y cruce las asistencias con los registros de estadísticas.</p>
        </div>

        <div class="form-card" style="margin-bottom: var(--spacing-xl);">
            <div class="form-header">
                <h3>📥 Importar archivo biométrico</h3>
                <p class="text-xs text-muted">Debe contener la hoja "Reporte de Excepciones". Formatos: .xlsx, .xls. Máximo 10 MB.</p>
            </div>
            <form id="bioImportForm" onsubmit="submitBiometricoImport(event)" style="display: flex; gap: 1rem; align-items: end; flex-wrap: wrap;">
                <div class="form-group" style="flex: 1; min-width: 300px;">
                    <label>Archivo</label>
                    <input type="file" id="bioImportFile" accept=".xlsx,.xls" required style="width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px;">
                </div>
                <button type="submit" class="btn btn-primary" id="btnBioImport">Importar</button>
            </form>
            <div id="bioImportResult" style="display: none; margin-top: 1rem;"></div>
        </div>

        <div class="form-card">
            <div class="form-header">
                <h3>🔍 Cruce del día</h3>
                <p class="text-xs text-muted">Compara marcajes biométricos con registros de estadísticas.</p>
            </div>
            <div style="display: flex; gap: 1rem; align-items: end; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="bioFecha" value="${todayStr}" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <button class="btn btn-primary" onclick="loadBiometricoCruce()">Consultar</button>
            </div>
            <div id="bioCruceResult"></div>
        </div>
    `;

    // Auto-cargar cruce de hoy
    loadBiometricoCruce();
}

async function submitBiometricoImport(e) {
    e.preventDefault();
    const input = document.getElementById('bioImportFile');
    const resultBox = document.getElementById('bioImportResult');
    const btn = document.getElementById('btnBioImport');

    if (!input || !input.files || input.files.length === 0) {
        showToast('⚠️ Selecciona un archivo', 'warning');
        return;
    }
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
        showToast('⚠️ El archivo supera los 10 MB permitidos', 'warning');
        return;
    }

    const fd = new FormData();
    fd.append('file', file);

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⌛ Importando...';
    resultBox.style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/biometrico/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            },
            body: fd
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            resultBox.innerHTML = `
                <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 1rem; border-radius: 8px;">
                    <strong style="color: #166534;">✅ Importación completa</strong>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Nuevos: ${data.nuevos ?? 0} · Actualizados: ${data.actualizados ?? 0} · Ignorados: ${data.ignorados ?? 0} · Total válidos: ${data.total ?? 0}
                    </div>
                </div>
            `;
            resultBox.style.display = 'block';
            showToast(`✅ ${data.total ?? 0} marcajes importados`, 'success');
            loadBiometricoCruce();
        } else if (res.status === 429) {
            showToast('⚠️ Demasiadas importaciones. Intenta en un momento.', 'warning');
        } else {
            resultBox.innerHTML = `
                <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 1rem; border-radius: 8px;">
                    <strong style="color: #991b1b;">❌ ${escapeHtml(data.message || 'Error al importar')}</strong>
                </div>
            `;
            resultBox.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Error de red', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function loadBiometricoCruce() {
    const fecha = document.getElementById('bioFecha')?.value;
    const box = document.getElementById('bioCruceResult');
    if (!fecha || !box) return;

    box.innerHTML = '<p style="color: var(--text-muted);">⌛ Cargando...</p>';

    try {
        const res = await fetch(`${API_URL}/biometrico/cruce?fecha=${encodeURIComponent(fecha)}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            box.innerHTML = `<p style="color: var(--text-muted);">No se pudo cargar el cruce.</p>`;
            return;
        }

        const data = await res.json();
        const r = data.resumen || {};

        const section = (title, color, items, renderItem) => {
            if (!items || items.length === 0) return '';
            const rows = items.map(renderItem).join('');
            return `
                <div style="background: white; border: 1px solid ${color}; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 0.75rem 0; color: ${color};">${title} (${items.length})</h4>
                    <div class="table-container">
                        <table class="data-table" style="font-size: 0.85rem;">${rows}</table>
                    </div>
                </div>
            `;
        };

        const summaryCard = (label, n, color, emoji) => `
            <div style="background: white; border: 1px solid ${color}; border-radius: 8px; padding: 1rem; text-align: center;">
                <div style="font-size: 2rem;">${emoji}</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${color};">${n}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(label)}</div>
            </div>
        `;

        box.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${summaryCard('Ausencias no reportadas', r.ausencias_no_reportadas || 0, '#ef4444', '🚫')}
                ${summaryCard('Inconsistencias', r.inconsistencias || 0, '#f59e0b', '⚠️')}
                ${summaryCard('Bajo rendimiento', r.bajo_rendimiento || 0, '#dc2626', '📉')}
                ${summaryCard('Cédulas sin usuario', r.cedulas_sin_usuario || 0, '#64748b', '👤')}
            </div>

            ${section('🚫 Ausencias no reportadas (biométrico ausente sin novedad)', '#ef4444', data.ausencias_no_reportadas, item => `
                <tr>
                    <td style="padding: 0.5rem;"><strong>${escapeHtml(item.nombre || '')}</strong></td>
                    <td style="padding: 0.5rem; color: var(--text-muted);">${escapeHtml(item.cedula || '')}</td>
                </tr>
            `)}

            ${section('⚠️ Inconsistencias', '#f59e0b', data.inconsistencias, item => `
                <tr>
                    <td style="padding: 0.5rem;"><strong>${escapeHtml(item.nombre || '')}</strong></td>
                    <td style="padding: 0.5rem; color: var(--text-muted);">${escapeHtml(item.cedula || '')}</td>
                    <td style="padding: 0.5rem; font-size: 0.75rem;">${escapeHtml(item.tipo || '')}</td>
                </tr>
            `)}

            ${section('📉 Bajo rendimiento (< ' + (data.umbral_bajo_rendimiento ?? 80) + '%)', '#dc2626', data.bajo_rendimiento, item => `
                <tr>
                    <td style="padding: 0.5rem;"><strong>${escapeHtml(item.nombre || '')}</strong></td>
                    <td style="padding: 0.5rem; color: var(--text-muted);">${escapeHtml(item.cedula || '')}</td>
                    <td style="padding: 0.5rem; font-weight: 600; color: #dc2626;">${item.rendimiento}%</td>
                </tr>
            `)}

            ${section('👤 Cédulas en biométrico sin usuario asociado', '#64748b', data.cedulas_sin_usuario, item => `
                <tr>
                    <td style="padding: 0.5rem;">${escapeHtml(item.nombre_biometrico || 'Sin nombre')}</td>
                    <td style="padding: 0.5rem; color: var(--text-muted);">${escapeHtml(item.cedula || '')}</td>
                    <td style="padding: 0.5rem; font-size: 0.75rem;">${item.ausente ? '🔴 Ausente' : '🟢 Asistió'}</td>
                </tr>
            `)}

            ${(r.ausencias_no_reportadas || 0) + (r.inconsistencias || 0) + (r.bajo_rendimiento || 0) + (r.cedulas_sin_usuario || 0) === 0
                ? '<p style="text-align: center; padding: 2rem; color: var(--success-color);">✅ Todo en orden para el ' + escapeHtml(data.fecha) + '</p>'
                : ''}
        `;
    } catch (err) {
        console.error(err);
        box.innerHTML = `<p style="color: var(--text-muted);">Error de red al cargar el cruce.</p>`;
    }
}
