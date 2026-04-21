// Calculation Utilities Module - Excel Formula Implementation
// Based on formulas extracted from Excel file

/**
 * Escape user-controlled text before injecting into innerHTML or HTML attributes.
 * Cubre <, >, &, ", ' para prevenir XSS y romper atributos.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Get week number from date (ISO 8601 standard)
 * Excel: =NUM.DE.SEMANA(fecha)
 */
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Get Spanish day name from date
 * Excel: =TEXTO(fecha;"dddd")
 */
function getDayName(date) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const d = new Date(date);
    return days[d.getDay()];
}

/**
 * Parse time string "hh:mm" to hours and minutes
 * Excel: =HORA(tiempo) and =MINUTO(tiempo)
 */
function parseTime(timeString) {
    if (!timeString) return { hours: 0, minutes: 0 };

    const parts = timeString.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;

    return { hours, minutes };
}

/**
 * Calculate total minutes from hours and minutes
 * Excel: =($N6*60)+$O6
 */
function calculateTotalMinutes(hours, minutes) {
    return (hours * 60) + minutes;
}

/**
 * Producción Diaria = Cantidad Meta
 * Excel: =D3
 */
function calculateProduccionDiaria(cantidadMeta) {
    return cantidadMeta;
}

/**
 * Producción Por Hora = Producción Diaria / 9 horas
 * Excel: =SI(C3="";"";E3/9)
 */
function calculateProduccionPorHora(produccionDiaria) {
    if (!produccionDiaria) return 0;
    return produccionDiaria / 9;
}

/**
 * Producción Estándar Por Minuto = Producción Diaria / 540 min (9h × 60min)
 * Excel: =SI(C3="";"";E3/(60*9))
 */
function calculateProduccionStdPorMinuto(produccionDiaria) {
    if (!produccionDiaria) return 0;
    return produccionDiaria / 540; // 9 hours × 60 minutes
}

/**
 * Producción Semanal = Producción Diaria × 5 días
 * Excel: =+$E6*5
 */
function calculateProduccionSemanal(produccionDiaria) {
    if (!produccionDiaria) return 0;
    return produccionDiaria * 5;
}

/**
 * Producción Esperada = Producción Std/Min × Total Minutos trabajados
 * Excel: =SI($Q6="";";+$G6*$P6)
 */
function calculateProduccionEsperada(stdPorMinuto, totalMinutos) {
    if (!stdPorMinuto || !totalMinutos) return 0;
    return stdPorMinuto * totalMinutos;
}

/**
 * % Rendimiento = Cantidad Real / Producción Esperada
 * Excel: =SI($Q6="";";$L6/$Q6)
 */
function calculateRendimiento(cantidadReal, produccionEsperada) {
    if (!produccionEsperada || produccionEsperada === 0) return 0;
    return cantidadReal / produccionEsperada;
}

/**
 * Master calculation function - calculates all metrics at once
 * @param {Object} proceso - Process object from sampleData
 * @param {number} cantidadReal - Actual quantity produced
 * @param {string} tiempo - Time in "hh:mm" format
 * @param {string} fecha - Date in "YYYY-MM-DD" format
 * @returns {Object} All calculated metrics
 */
function calculateAllMetrics(proceso, cantidadReal, tiempo, fecha) {
    // Parse time
    const { hours, minutes } = parseTime(tiempo);
    const totalMinutos = calculateTotalMinutes(hours, minutes);

    // Get base values from process
    const cantidadMeta = proceso.cantidad || 0;

    // Calculate all metrics following Excel formulas
    const produccionDiaria = calculateProduccionDiaria(cantidadMeta);
    const produccionPorHora = calculateProduccionPorHora(produccionDiaria);
    const produccionStdPorMinuto = calculateProduccionStdPorMinuto(produccionDiaria);
    const produccionSemanal = calculateProduccionSemanal(produccionDiaria);

    // Calculate expected production based on time worked
    const produccionEsperada = calculateProduccionEsperada(produccionStdPorMinuto, totalMinutos);

    // Calculate performance
    const rendimiento = calculateRendimiento(cantidadReal, produccionEsperada);

    // Date calculations
    const semana = getWeekNumber(fecha);
    const dia = getDayName(fecha);

    return {
        // Process info
        proceso: proceso.name,
        cantidadMeta,

        // Production standards
        produccionDiaria,
        produccionPorHora: parseFloat(produccionPorHora.toFixed(2)),
        produccionStdPorMinuto: parseFloat(produccionStdPorMinuto.toFixed(2)),
        produccionSemanal,

        // Date info
        semana,
        dia,

        // Time breakdown
        horas: hours,
        minutos: minutes,
        totalMinutos,

        // Performance
        produccionEsperada: parseFloat(produccionEsperada.toFixed(2)),
        rendimiento: parseFloat((rendimiento * 100).toFixed(1)), // Convert to percentage
        rendimientoDecimal: parseFloat(rendimiento.toFixed(4))
    };
}

/**
 * Format rendimiento with color coding
 */
function getRendimientoStatus(rendimiento) {
    if (rendimiento >= 100) {
        return { status: 'excellent', label: '✅ Excelente', color: 'success' };
    } else if (rendimiento >= 90) {
        return { status: 'good', label: '👍 Bueno', color: 'info' };
    } else if (rendimiento >= 70) {
        return { status: 'acceptable', label: '⚠️ Aceptable', color: 'warning' };
    } else {
        return { status: 'poor', label: '❌ Bajo', color: 'danger' };
    }
}

/**
 * Validate tiempo format "hh:mm"
 */
function isValidTimeFormat(timeString) {
    if (!timeString) return false;
    const regex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(timeString);
}

/**
 * Format time for display
 */
function formatTime(hours, minutes) {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    return `${h}:${m}`;
}
