// Reportes Module
function loadReportesModule() {
    const reportesModule = document.getElementById('module-reportes');
    const users = window.getUsers ? getUsers() : [];
    const operators = users.filter(u => u.rol === 'operario');

    reportesModule.innerHTML = `
        <div class="module-header">
            <h2>Reportes y Análisis</h2>
            <p class="module-description">Visualización de estadísticas y métricas de productividad</p>
        </div>

        <div class="reportes-filters">
            <div class="form-group">
                <label>Fecha Inicio</label>
                <input type="date" id="reportFechaInicio" value="${getFirstDayOfMonth()}">
            </div>
            <div class="form-group">
                <label>Fecha Fin</label>
                <input type="date" id="reportFechaFin" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Operario</label>
                <select id="reportOperario">
                    <option value="all">Todos los operarios</option>
                    ${operators.map(op =>
        `<option value="${op.id}">${op.name} ${op.apellido || ''}</option>`
    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Cliente</label>
                <select id="reportCliente">
                    <option value="all">Todos los clientes</option>
                    ${(sampleData.customers || []).map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Proceso</label>
                <select id="reportProceso">
                    <option value="all">Todos los procesos</option>
                    ${sampleData.processes.map(proc =>
        `<option value="${proc.code}">${proc.code} - ${proc.name}</option>`
    ).join('')}
                </select>
            </div>
            <div class="form-group" style="align-self: end; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="generateReport()" style="min-width: 150px;">
                    📊 Generar Reporte
                </button>
                <button class="btn btn-success" onclick="exportToExcel()" title="Exportar a CSV/Excel">
                    📥 Excel
                </button>
                <button class="btn btn-secondary" onclick="exportToPDF()" title="Generar PDF Corporativo">
                    📄 PDF
                </button>
            </div>
        </div>

        <div class="stats-grid" id="reportSummaryCards" style="margin-bottom: var(--spacing-xl);">
            <!-- Summary cards will be injected here by generateReport -->
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <h3>Rendimiento Global</h3>
                    <p class="stat-value" id="totalRendimiento">0%</p>
                    <span class="stat-label">Promedio del periodo</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                    <h3>Total Unidades</h3>
                    <p class="stat-value" id="totalUnidades">0</p>
                    <span class="stat-label">En el periodo</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <h3>Horas Totales</h3>
                    <p class="stat-value" id="totalHoras">0h</p>
                    <span class="stat-label">Tiempo registrado</span>
                </div>
            </div>
        </div>

        <div class="reportes-charts">
            <div class="chart-card">
                <h3>📈 Producción por Día</h3>
                <canvas id="reportChartDaily"></canvas>
            </div>
            <div class="chart-card">
                <h3>👥 Producción por Operario</h3>
                <canvas id="reportChartOperators"></canvas>
            </div>
            <div class="chart-card">
                <h3>⏱️ Distribución de Tiempo</h3>
                <canvas id="reportChartTime"></canvas>
            </div>
            <div class="chart-card">
                <h3>📋 Procesos Más Utilizados</h3>
                <canvas id="reportChartProcesses"></canvas>
            </div>
        </div>

        <div class="reportes-table-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <h3>📑 Detalle de Registros</h3>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Operario</th>
                            <th>Cliente</th>
                            <th>Proceso/Motivo</th>
                            <th>Cantidad</th>
                            <th>Tiempo (hrs)</th>
                            <th>Rendimiento</th>
                        </tr>
                    </thead>
                    <tbody id="reportTableBody">
                        ${renderReportTableRows(sampleData.statistics)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Apply filters immediately to initial data
    generateReport(true);
}

function renderReportTableRows(stats) {
    if (!stats || stats.length === 0) {
        return '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No se encontraron registros para los filtros seleccionados</td></tr>';
    }

    return stats.map(stat => {
        const isNovelty = stat.type === 'novedad_total';
        const isMissing = stat.type === 'missing';

        // Performance styling
        let rendimientoBadge = '';
        if (!isNovelty && !isMissing) {
            const rend = stat.rendimiento || 0;
            let color = '#ef4444'; // Red
            if (rend >= 90) color = '#10b981'; // Green
            else if (rend >= 70) color = '#f59e0b'; // Yellow
            rendimientoBadge = `<span class="badge" style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${rend}%</span>`;
        } else {
            rendimientoBadge = '<span class="text-muted">N/A</span>';
        }

        let rowStyle = '';
        if (isNovelty) rowStyle = 'background-color: #f0f7ff;';
        if (isMissing) rowStyle = 'background-color: #fff9e6;';

        return `
            <tr style="${rowStyle}">
                <td>${formatDate(stat.date)}</td>
                <td><div style="font-weight: 500;">${stat.operator}</div></td>
                <td><span class="text-muted">${stat.customer || '-'}</span></td>
                <td>
                    ${isNovelty ?
                `<span class="badge" style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${stat.processName}</span>` :
                (isMissing ?
                    `<span class="badge" style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">FALTANTE</span>` :
                    `<span class="code-badge">${stat.process}</span> <span class="text-xs text-muted">${stat.processName.substring(0, 20)}...</span>`)
            }
                </td>
                <td><strong>${(isNovelty || isMissing) ? '-' : formatNumber(stat.quantity)}</strong></td>
                <td>${stat.timeRaw || '0:00'}</td>
                <td>${rendimientoBadge}</td>
            </tr>
        `;
    }).join('');
}



function getFirstDayOfMonth() {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
}

function getFilteredReportData() {
    if (typeof syncRegistrations === 'function') syncRegistrations();
    if (typeof updateSampleDataStats === 'function') updateSampleDataStats();

    const startInput = document.getElementById('reportFechaInicio').value;
    const endInput = document.getElementById('reportFechaFin').value;
    const opSelect = document.getElementById('reportOperario');
    const opId = opSelect ? opSelect.value : 'all';
    const client = document.getElementById('reportCliente').value;
    const proc = document.getElementById('reportProceso').value;

    console.log('🔍 Filtrando Reporte:', { start: startInput, end: endInput, opId, client, proc });

    let filtered = (sampleData.statistics || []).filter(stat => {
        const dateMatch = (!startInput || stat.date >= startInput) && (!endInput || stat.date <= endInput);
        const opMatch = opId === 'all' || Number(stat.operatorId) === Number(opId);
        const clientMatch = client === 'all' || stat.customer === client;
        const procMatch = proc === 'all' || stat.process === proc;
        return dateMatch && opMatch && clientMatch && procMatch;
    });

    // --- GAP FILLING LOGIC ---
    // If a specific operator is selected, find days with NO activity
    if (opId !== 'all' && startInput && endInput) {
        const startDate = new Date(startInput + 'T12:00:00');
        const endDate = new Date(endInput + 'T12:00:00');
        const operatorObj = (sampleData.operators || []).find(o => Number(o.id) === Number(opId));
        const operatorName = operatorObj ? operatorObj.name : 'Unknown';

        let currentDate = new Date(startDate);
        const missingDays = [];

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

            if (!isWeekend) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const hasActivity = filtered.some(s => s.date === dateStr);

                if (!hasActivity) {
                    missingDays.push({
                        date: dateStr,
                        operator: operatorName,
                        operatorId: Number(opId),
                        process: 'FALTANTE',
                        processName: 'Sin registro / Novedad',
                        customer: '-',
                        quantity: 0,
                        time: 0,
                        observations: 'Día laboral sin reportar',
                        type: 'missing'
                    });
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        filtered = [...filtered, ...missingDays].sort((a, b) => b.date.localeCompare(a.date));
    }

    console.log('✅ Filtro aplicado. Resultados found:', filtered.length);
    return filtered;
}

function generateReport(isInitial = false) {
    if (!isInitial) showToast('📊 Actualizando reporte...', 'info');

    const filtered = getFilteredReportData();
    window.lastFilteredStats = filtered;

    // Update summary metrics
    const productionRecords = filtered.filter(s => s.type === 'produccion');
    const totalUnidades = productionRecords.reduce((sum, s) => sum + s.quantity, 0);
    const totalMinutos = productionRecords.reduce((sum, s) => {
        const parts = s.timeRaw.split(':');
        return sum + (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    }, 0);
    const avgRendimiento = productionRecords.length > 0
        ? (productionRecords.reduce((sum, s) => sum + s.rendimiento, 0) / productionRecords.length).toFixed(1)
        : 0;

    document.getElementById('totalRendimiento').textContent = `${avgRendimiento}%`;
    document.getElementById('totalUnidades').textContent = formatNumber(totalUnidades);
    document.getElementById('totalHoras').textContent = `${Math.floor(totalMinutos / 60)}h ${totalMinutos % 60}m`;

    // Update table
    document.getElementById('reportTableBody').innerHTML = renderReportTableRows(filtered);

    // Update charts
    updateReportCharts(filtered);

    if (!isInitial) showToast('✅ Reporte actualizado', 'success');
}

function updateReportCharts(data) {
    // Group data for charts
    const dailyData = {};
    const opData = {};
    const timeData = {};
    const procData = {};

    data.forEach(stat => {
        // Daily
        dailyData[stat.date] = (dailyData[stat.date] || 0) + stat.quantity;
        // Operators
        opData[stat.operator] = (opData[stat.operator] || 0) + stat.quantity;
        // Time
        if (!stat.type || stat.type !== 'novedad_total') {
            const procGroup = stat.process || 'Otros';
            timeData[procGroup] = (timeData[procGroup] || 0) + stat.time;
        }
        // Processes
        procData[stat.process] = (procData[stat.process] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyData).sort();

    // Cleanup old charts if they exist on the canvas
    const dailyCanvas = document.getElementById('reportChartDaily');
    const opCanvas = document.getElementById('reportChartOperators');
    const timeCanvas = document.getElementById('reportChartTime');
    const procCanvas = document.getElementById('reportChartProcesses');

    // Destroy existing Chart instances if stored
    if (window.charts) {
        Object.values(window.charts).forEach(c => c.destroy());
    }
    window.charts = {};

    if (dailyCanvas) {
        window.charts.daily = new Chart(dailyCanvas, {
            type: 'line',
            data: {
                labels: sortedDates.map(d => formatDate(d)),
                datasets: [{
                    label: 'Unidades',
                    data: sortedDates.map(d => dailyData[d]),
                    borderColor: '#3b82f6',
                    background: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    if (opCanvas) {
        const ops = Object.keys(opData);
        window.charts.ops = new Chart(opCanvas, {
            type: 'bar',
            data: {
                labels: ops,
                datasets: [{
                    label: 'Unidades',
                    data: ops.map(o => opData[o]),
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    if (timeCanvas) {
        const times = Object.keys(timeData);
        window.charts.time = new Chart(timeCanvas, {
            type: 'doughnut',
            data: {
                labels: times,
                datasets: [{
                    data: times.map(t => timeData[t]),
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    if (procCanvas) {
        const procs = Object.keys(procData).slice(0, 10);
        window.charts.procs = new Chart(procCanvas, {
            type: 'bar',
            data: {
                labels: procs,
                datasets: [{
                    label: 'Frecuencia',
                    data: procs.map(p => procData[p]),
                    backgroundColor: '#6366f1'
                }]
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
        });
    }
}

function exportToExcel() {
    const data = getFilteredReportData();
    if (data.length === 0) {
        showToast('⚠️ No hay datos para los filtros seleccionados', 'warning');
        return;
    }

    showToast('📥 Generando Excel (CSV)...', 'info');
    // Create CSV header
    const headers = ['Fecha', 'Operario', 'Cliente', 'Proceso', 'Nombre Proceso', 'Cantidad', 'Tiempo', 'Tipo', 'Rendimiento (%)', 'Observaciones'];
    let csvContent = headers.join(',') + '\n';

    // Add rows
    data.forEach(stat => {
        const row = [
            stat.date,
            `"${stat.operator}"`,
            `"${stat.customer}"`,
            stat.process,
            `"${stat.processName}"`,
            (stat.type === 'novedad_total' || stat.type === 'missing') ? 0 : stat.quantity,
            stat.timeRaw || '0:00',
            stat.type.toUpperCase(),
            stat.rendimiento || 0,
            `"${stat.observations.replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\n';
    });

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Gadier_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✅ Archivo CSV descargado', 'success');
}

function exportToPDF() {
    const data = getFilteredReportData();
    if (data.length === 0) {
        showToast('⚠️ No hay datos para los filtros seleccionados', 'warning');
        return;
    }

    showToast('📄 Generando PDF con diseño corporativo...', 'info');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- Helper Function to Draw Template ---
    const drawTemplate = (data) => {
        // --- HEADER DESIGN (Top Left) ---
        // Red Polygon
        doc.setFillColor(153, 15, 12); // Gadier Red
        doc.triangle(0, 0, 120, 0, 100, 18, 'F');
        doc.rect(0, 0, 100, 18, 'F');

        // Black Polygon
        doc.setFillColor(0, 0, 0);
        doc.triangle(0, 4, 90, 4, 80, 14, 'F');
        doc.rect(0, 4, 80, 10, 'F');

        // Grey Stripes
        doc.setFillColor(120, 120, 120);
        for (let i = 0; i < 4; i++) {
            doc.triangle(85 + (i * 6), 16, 90 + (i * 6), 16, 88 + (i * 6), 20, 'F');
        }

        // Top Grey Line
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(1.5);
        doc.line(125, 10, pageWidth - 10, 10);

        // --- FOOTER DESIGN (Bottom Right) ---
        // Red Polygon
        doc.setFillColor(153, 15, 12);
        doc.triangle(pageWidth, pageHeight, pageWidth - 120, pageHeight, pageWidth - 100, pageHeight - 18, 'F');
        doc.rect(pageWidth - 100, pageHeight - 18, 100, 18, 'F');

        // Black Polygon
        doc.setFillColor(0, 0, 0);
        doc.triangle(pageWidth, pageHeight - 4, pageWidth - 90, pageHeight - 4, pageWidth - 80, pageHeight - 14, 'F');
        doc.rect(pageWidth - 80, pageHeight - 14, 80, 10, 'F');

        // Grey Stripes (Footer)
        doc.setFillColor(120, 120, 120);
        for (let i = 0; i < 4; i++) {
            doc.triangle(pageWidth - 85 - (i * 6), pageHeight - 16, pageWidth - 90 - (i * 6), pageHeight - 16, pageWidth - 88 - (i * 6), pageHeight - 20, 'F');
        }

        // Bottom Grey Line
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(1.5);
        doc.line(pageWidth - 125, pageHeight - 10, 10, pageHeight - 10);

        // --- TITLE & LOGO AREA ---
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('GADIER', 15, 11);
        doc.setFontSize(8);
        doc.text('SISTEMAS PROFESIONALES', 15, 15);
    };

    // Table Data preparation
    const tableBody = data.map(stat => [
        stat.date,
        stat.operator,
        stat.customer,
        stat.process,
        stat.processName,
        (stat.type === 'novedad_total' || stat.type === 'missing') ? '-' : stat.quantity,
        stat.timeRaw || '0:00',
        (stat.type === 'novedad_total' || stat.type === 'missing') ? '-' : `${stat.rendimiento}%`
    ]);

    // Generate Table with Autotable
    doc.autoTable({
        startY: 35,
        margin: { top: 35, bottom: 25 },
        head: [['Fecha', 'Operario', 'Cliente', 'Cód.', 'Proceso/Motivo', 'Cant.', 'Hrs', 'Rend.']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: [153, 15, 12],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: 'middle'
        },
        columnStyles: {
            4: { cellWidth: 60 }
        },
        didDrawPage: (data) => {
            drawTemplate(data);

            // Add Date range and generated info at the bottom of header area
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(8);
            const start = document.getElementById('reportFechaInicio')?.value || 'N/A';
            const end = document.getElementById('reportFechaFin')?.value || 'N/A';
            doc.text(`Reporte: ${start} al ${end} | Página ${data.pageNumber}`, pageWidth - 15, 28, { align: 'right' });
        },
        didParseCell: function (data) {
            // Check if we are in the 'Rend.' column (index 7) and it's a body row
            if (data.section === 'body' && data.column.index === 7) {
                const val = data.cell.text[0];
                if (val && val !== '-') {
                    const num = parseFloat(val.replace('%', ''));
                    if (num >= 90) {
                        data.cell.styles.textColor = [16, 185, 129]; // Green
                        data.cell.styles.fontStyle = 'bold';
                    } else if (num >= 70) {
                        data.cell.styles.textColor = [245, 158, 11]; // Yellow/Orange
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [239, 68, 68]; // Red
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        }
    });

    // Save
    doc.save(`Reporte_Corporativo_Gadier_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Reporte PDF descargado con diseño corporativo', 'success');
}
