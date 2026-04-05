/**
 * Módulo de Exportación a Excel
 * Usa SheetJS (xlsx) para generar archivos .xlsx del lado del cliente
 * 
 * Diseño aprobado: UNA sola hoja "Nomina" con bloques:
 * 1. Encabezado del reporte
 * 2. Resumen general
 * 3. Deducciones
 * 4. Detalle por turno
 * 5. Desglose por tramo
 */

import { getState } from '../state/store.js';
import { formatearMoneda, formatearFecha, obtenerNombreDia } from './formatters.js';
import { aggregateShiftBreakdown } from '../domain/payroll-breakdown.js';

// SheetJS se carga globalmente desde CDN (window.XLSX)

/**
 * Genera el nombre del archivo con fecha
 * @returns {string} - Nombre del archivo (ej: nomina-2026-04-04.xlsx)
 */
const generarNombreArchivo = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `nomina-${anio}-${mes}-${dia}.xlsx`;
};

/**
 * Obtiene los datos del estado actual para exportar
 * @returns {Object} - Datos completos para el reporte
 */
const obtenerDatosReporte = () => {
    const estado = getState();
    
    const { turnos = [], deducciones = {}, resultados = {}, turnosLiquidados = [] } = estado;
    
    // Calcular breakdown agregado por tramo
    // El store guarda { turno, liquidacion } pero aggregateShiftBreakdown espera { breakdown }
    // Necesitamos transformar al formato esperado
    const turnosParaAgregar = turnosLiquidados.map(item => item.liquidacion);
    const breakdownAgregado = aggregateShiftBreakdown(turnosParaAgregar);
    
    return {
        turnos,
        deducciones,
        resultados,
        turnosLiquidados,
        breakdownAgregado,
        fechaGeneracion: new Date()
    };
};

/**
 * Construye el contenido de la hoja única de nómina
 * @returns {Array} - Array de arrays con datos paraSheetJS
 */
const construirContenidoHoja = () => {
    const datos = obtenerDatosReporte();
    const { turnos, deducciones, resultados, turnosLiquidados, breakdownAgregado, fechaGeneracion } = datos;
    
    const hoja = [];
    
    // ============================================
    // BLOQUE 1: ENCABEZADO DEL REPORTE
    // ============================================
    hoja.push(['💰 REPORTE DE NÓMINA']);  // A1
    hoja.push(['Fecha de Generación:', formatearFecha(fechaGeneracion)]);  // A2
    hoja.push([]);  // Fila vacía
    
    // ============================================
    // BLOQUE 2: RESUMEN GENERAL
    // ============================================
    hoja.push(['📊 RESUMEN GENERAL']);  // A4
    hoja.push(['Concepto', 'Valor']);
    hoja.push(['Turnos Trabajados', resultados.cantidadTurnos || 0]);
    hoja.push(['Horas Totales', resultados.cantidadHoras || 0]);
    hoja.push(['Días de Descanso', resultados.diasDescanso || 0]);
    hoja.push(['Subtotal Turnos', formatearMoneda(resultados.totalTurnos || 0)]);
    hoja.push(['Subsidio Transporte', formatearMoneda(resultados.subsidioTransporte || 0)]);
    hoja.push(['TOTAL DEVENGADO', formatearMoneda(resultados.devengadoTotal || 0)]);
    hoja.push(['Deducciones', formatearMoneda(resultados.totalDeducciones || 0)]);
    hoja.push(['SALARIO NETO A PAGAR', formatearMoneda(resultados.netoPagar || 0)]);
    hoja.push([]);  // Fila vacía
    
    // ============================================
    // BLOQUE 3: DEDUCCIONES
    // ============================================
    hoja.push(['📉 DEDUCCIONES']);  // A15
    hoja.push(['Tipo', 'Valor']);
    hoja.push(['Deducción por Nómina', formatearMoneda(deducciones.nomina || 0)]);
    hoja.push(['EMI Familiares', formatearMoneda(deducciones.emi || 0)]);
    hoja.push(['Otras Deducciones', formatearMoneda(deducciones.otras || 0)]);
    hoja.push(['Salud (Empleado)', formatearMoneda(resultados.saludEmpleado || 0)]);
    hoja.push(['Pensión (Empleado)', formatearMoneda(resultados.pensionEmpleado || 0)]);
    hoja.push(['TOTAL DEDUCCIONES', formatearMoneda(resultados.totalDeducciones || 0)]);
    hoja.push([]);  // Fila vacía
    
    // ============================================
    // BLOQUE 4: DETALLE POR TURNO
    // ============================================
    hoja.push(['📅 DETALLE POR TURNO']);  // A24
    // Encabezados de la tabla
    hoja.push(['#', 'Día', 'Fecha', 'Inicio', 'Salida', 'Horas', 'Valor', 'Incap.']);
    
    // Filas de turnos
    let numeroTurno = 0;
    turnosLiquidados.forEach((item, indice) => {
        const { turno, liquidacion } = item;
        
        // Ignorar si es descanso
        if (turno.horaInicio === 'Descanso' && turno.horaSalida === 'Descanso') {
            return;
        }
        
        numeroTurno++;
        const nombreDia = turno.fecha ? obtenerNombreDia(turno.fecha) : '';
        
        hoja.push([
            numeroTurno,
            nombreDia,
            turno.fecha || '',
            turno.horaInicio || '',
            turno.horaSalida || '',
            liquidacion.horas || 0,
            formatearMoneda(liquidacion.total || 0),
            liquidacion.incapacidad ? 'Sí' : 'No'
        ]);
    });
    hoja.push([]);  // Fila vacía
    
    // ============================================
    // BLOQUE 5: DESGLOSE POR TRAMO
    // ============================================
    hoja.push(['📈 DESGLOSE POR TRAMO']);  // Después de tabla de turnos
    hoja.push(['Categoría', 'Horas Diurnas', 'Horas Nocturnas', 'Total Horas', 'Valor']);
    
    // Ordinario
    const ordHorasDia = breakdownAgregado.ordinario.horasDia;
    const ordHorasNoche = breakdownAgregado.ordinario.horasNoche;
    const ordTotalHoras = ordHorasDia + ordHorasNoche;
    const ordValor = breakdownAgregado.ordinario.valor;
    
    hoja.push([
        'Ordinario',
        ordHorasDia.toFixed(2),
        ordHorasNoche.toFixed(2),
        ordTotalHoras.toFixed(2),
        formatearMoneda(ordValor)
    ]);
    
    // Festivo
    const festHorasDia = breakdownAgregado.festivo.horasDia;
    const festHorasNoche = breakdownAgregado.festivo.horasNoche;
    const festTotalHoras = festHorasDia + festHorasNoche;
    const festValor = breakdownAgregado.festivo.valor;
    
    hoja.push([
        'Festivo',
        festHorasDia.toFixed(2),
        festHorasNoche.toFixed(2),
        festTotalHoras.toFixed(2),
        formatearMoneda(festValor)
    ]);
    
    // TOTAL
    const totalHoras = breakdownAgregado.total.horas;
    const totalValor = breakdownAgregado.total.valor;
    
    hoja.push([
        'TOTAL',
        '',
        '',
        totalHoras.toFixed(2),
        formatearMoneda(totalValor)
    ]);
    
    return hoja;
};

/**
 * Aplica formato a la hoja de trabajo
 * @param {Object} ws - Worksheet de SheetJS
 */
const aplicarFormato = (ws) => {
    if (!ws) return;
    
    const XLSX = window.XLSX;
    if (!XLSX) return;
    
    // Obtener rango
    const rango = XLSX.utils.decode_range(ws['!ref']);
    
    // Anchos de columnas (en caracteres)
    ws['!cols'] = [
        { wch: 25 },  // A: Categorías
        { wch: 15 },  // B: Valores/ Horas
        { wch: 15 },  // C: 
        { wch: 12 },  // D: 
        { wch: 12 },  // E: 
        { wch: 10 },  // F: 
        { wch: 15 },  // G: 
        { wch: 10 }   // H: 
    ];
    
    // Estilos usando Excel padrão (sin hojas de estilo por CDN)
    // Los encabezados ya tienen emoji para identificar visualmente
};

/**
 * Exporta la nómina a un archivo Excel
 * @returns {boolean} - true siexportación fue exitosa
 */
export const exportarExcel = () => {
    const XLSX = window.XLSX;
    if (!XLSX) {
        console.error('SheetJS no está cargado');
        alert('Error: La librería de exportación no está disponible');
        return false;
    }
    
    try {
        // Construir contenido
        const contenido = construirContenidoHoja();
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // Crear hoja con el contenido
        const ws = XLSX.utils.aoa_to_sheet(contenido);
        
        // Aplicar formato
        aplicarFormato(ws);
        
        // Agregar hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Nomina');
        
        // Generar y descargar archivo
        const nombreArchivo = generarNombreArchivo();
        XLSX.writeFile(wb, nombreArchivo);
        
        console.log(`✅ Excel exportado: ${nombreArchivo}`);
        return true;
        
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        alert('Error al generar el archivo Excel');
        return false;
    }
};

/**
 * Verifica si SheetJS está disponible
 * @returns {boolean}
 */
export const estaDisponiblExportacion = () => {
    return typeof window.XLSX !== 'undefined';
};
