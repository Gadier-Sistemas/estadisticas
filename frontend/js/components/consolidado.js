// Consolidado Module
function loadConsolidadoModule() {
    const consolidadoModule = document.getElementById('module-consolidado');

    consolidadoModule.innerHTML = `
        <div class="module-header">
            <h2>Consolidado General</h2>
            <p class="module-description">Resumen consolidado de estadísticas por periodo</p>
        </div>

        <div class="reportes-filters">
            <div class="form-group">
                <label>Periodo</label>
                <select id="consolidadoPeriodo">
                    <option value="week">Esta Semana</option>
                    <option value="month" selected>Este Mes</option>
                    <option value="quarter">Este Trimestre</option>
                    <option value="year">Este Año</option>
                    <option value="custom">Personalizado</option>
                </select>
            </div>
            <div class="form-group">
                <label>Agrupar Por</label>
                <select id="consolidadoGroup">
                    <option value="operator">Operario</option>
                    <option value="process" selected>Proceso</option>
                    <option value="date">Fecha</option>
                </select>
            </div>
            <div class="form-group" style="align-self: end;">
                <button class="btn btn-primary" onclick="generateConsolidado()">
                    📑 Generar Consolidado
                </button>
            </div>
        </div>

        <div class="stats-grid" style="margin-bottom: var(--spacing-2xl);">
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                    <h3>Total Unidades</h3>
                    <p class="stat-value">3,240</p>
                    <span class="stat-label">+12% vs mes anterior</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <h3>Total Horas</h3>
                    <p class="stat-value">384</p>
                    <span class="stat-label">160 horas/semana</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <h3>Productividad</h3>
                    <p class="stat-value">8.4</p>
                    <span class="stat-label">Unidades/hora promedio</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <h3>Eficiencia</h3>
                    <p class="stat-value">92%</p>
                    <span class="stat-label">Meta: 85%</span>
                </div>
            </div>
        </div>

        <div class="charts-grid" style="margin-bottom: var(--spacing-2xl);">
            <div class="chart-card">
                <h3>📊 Consolidado por Categoría</h3>
                <canvas id="consolidadoChartCategory"></canvas>
            </div>
            <div class="chart-card">
                <h3>📈 Tendencia Mensual</h3>
                <canvas id="consolidadoChartTrend"></canvas>
            </div>
        </div>

        <div class="form-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <h3>📋 Tabla Consolidada</h3>
                <div class="export-buttons">
                    <button class="btn btn-success" onclick="exportConsolidadoExcel()">
                        📥 Exportar Consolidado
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Proceso</th>
                            <th>Código</th>
                            <th>Total Registros</th>
                            <th>Total Unidades</th>
                            <th>Total Horas</th>
                            <th>Productividad</th>
                            <th>% del Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderConsolidadoTable()}
                    </tbody>
                    <tfoot>
                        <tr style="background: var(--surface); font-weight: 700;">
                            <td colspan="2">TOTAL</td>
                            <td>${sampleData.statistics.length}</td>
                            <td>3,240</td>
                            <td>384h</td>
                            <td>8.4 /hr</td>
                            <td>100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;

    initConsolidadoCharts();
}

function renderConsolidadoTable() {
    // Group sample data by process
    const processGroups = {};

    sampleData.processes.slice(0, 8).forEach((proc, index) => {
        const registros = Math.floor(Math.random() * 20) + 5;
        const unidades = Math.floor(Math.random() * 500) + 100;
        const horas = Math.floor(Math.random() * 50) + 10;
        const productivity = (unidades / horas).toFixed(2);
        const percentage = ((unidades / 3240) * 100).toFixed(1);

        processGroups[proc.code] = {
            name: proc.name,
            registros,
            unidades,
            horas,
            productivity,
            percentage
        };
    });

    return Object.entries(processGroups).map(([code, data]) => `
        <tr>
            <td>${data.name}</td>
            <td><span class="code-badge">${code}</span></td>
            <td>${data.registros}</td>
            <td><strong>${formatNumber(data.unidades)}</strong></td>
            <td>${data.horas}h</td>
            <td><span class="productivity-badge">${data.productivity} /hr</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${data.percentage}%;"></div>
                    </div>
                    <span>${data.percentage}%</span>
                </div>
            </td>
        </tr>
    `).join('');
}

function initConsolidadoCharts() {
    setTimeout(() => {
        // Category Chart
        const categoryCtx = document.getElementById('consolidadoChartCategory');
        if (categoryCtx) {
            new Chart(categoryCtx, {
                type: 'bar',
                data: {
                    labels: ['Custodia', 'Operativo'],
                    datasets: [{
                        label: 'Unidades Procesadas',
                        data: [1240, 2000],
                        backgroundColor: [
                            'rgba(74, 172, 254, 0.8)',
                            'rgba(245, 87, 108, 0.8)'
                        ],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#b4b4d4' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#b4b4d4' }
                        }
                    }
                }
            });
        }

        // Trend Chart
        const trendCtx = document.getElementById('consolidadoChartTrend');
        if (trendCtx) {
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                    datasets: [{
                        label: 'Productividad',
                        data: [7.8, 8.1, 8.4, 8.7],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#b4b4d4' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#b4b4d4' }
                        }
                    }
                }
            });
        }
    }, 100);
}

function generateConsolidado() {
    showToast('📑 Generando consolidado...', 'info');
    setTimeout(() => {
        showToast('✅ Consolidado generado', 'success');
    }, 800);
}

function exportConsolidadoExcel() {
    showToast('📥 Exportando consolidado...', 'info');
    setTimeout(() => {
        showToast('✅ Consolidado exportado a Excel', 'success');
    }, 1000);
}
