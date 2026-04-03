/**
 * Módulo de desglose de nómina - Liquidación de turnos por tramos
 * 
 * Contrato de salida:
 * - liquidarTurnoPorTramos(): Calcula valor de un turno usando segmentos
 * - aggregateShiftBreakdown(): Agrega breakdown por categorías
 */

import { TARIFAS_HORA, MEDIA_HORA } from './shifts.js';
import { processShift } from './segments.js';

// ============================================
// MAPA DE TARIFAS POR CATEGORÍA
// ============================================

const TARIFAS_POR_CATEGORIA = {
    'ordinario-dia': TARIFAS_HORA.diurna,
    'ordinario-noche': TARIFAS_HORA.nocturna,
    'festivo-dia': TARIFAS_HORA.diurnaFestiva,
    'festivo-noche': TARIFAS_HORA.nocturnaFestiva
};

// ============================================
// LIQUIDACIÓN DE UN TURNO
// ============================================

/**
 * Liquida un turno usando el pipeline segmentado
 * @param {Object} turno - Datos crudos del turno {fecha, horaInicio, horaSalida, incapacidad}
 * @param {string[]} boundaries - Límites de segmentación
 * @returns {Object} - Breakdown completo {total, horas, breakdown: [{inicio, fin, minutos, categoria, tarifa, valor}]}
 */
export const liquidarTurnoPorTramos = (turno, boundaries = ['midnight']) => {
    const { horaInicio, horaSalida, incapacidad = false } = turno;
    
    // Detectar descanso
    if (horaInicio === 'Descanso' || horaSalida === 'Descanso') {
        return {
            total: 0,
            horas: 0,
            breakdown: [],
            incapacidad: false
        };
    }
    
    // Usar pipeline de segments.js
    const result = processShift(turno, boundaries);
    const { segmentos } = result;
    
    // Calcular breakdown por segmento
    const breakdown = segmentos.map(segment => {
        const { minutos, categoria } = segment;
        const horas = minutos / 60;
        const tarifa = TARIFAS_POR_CATEGORIA[categoria] || TARIFAS_HORA.diurna;
        const valor = horas * tarifa;
        
        return {
            inicio: segment.inicio,
            fin: segment.fin,
            fechaNominal: segment.fechaNominal,
            minutos,
            categoria,
            tarifa,
            valor
        };
    });
    
    // Aplicar descuento por incapacidad si aplica
    const totalBruto = breakdown.reduce((sum, seg) => sum + seg.valor, 0);
    const totalHoras = breakdown.reduce((sum, seg) => sum + (seg.minutos / 60), 0);
    
    let total = totalBruto;
    if (incapacidad) {
        // 66.67% según Art. 227 CST
        total = totalBruto * (2 / 3);
        // Ajustar valores de breakdown
        breakdown.forEach(seg => {
            seg.valor = seg.valor * (2 / 3);
        });
    }
    
    return {
        total,
        horas: totalHoras,
        breakdown,
        incapacidad
    };
};

/**
 * Agrega breakdown de múltiples turnos por categoría
 * @param {Array} turnosLiquidados - Array de resultados de liquidarTurnoPorTramos()
 * @returns {Object} - Agregado por categoría {ordinario: {horas, valor}, festivo: {horas, valor}, ...}
 */
export const aggregateShiftBreakdown = (turnosLiquidados) => {
    const resultado = {
        ordinario: { horasDia: 0, horasNoche: 0, valor: 0 },
        festivo: { horasDia: 0, horasNoche: 0, valor: 0 },
        total: { horas: 0, valor: 0 }
    };
    
    turnosLiquidados.forEach(turno => {
        if (!turno.breakdown) return;
        
        turno.breakdown.forEach(seg => {
            if (seg.categoria === 'ordinario-dia') {
                resultado.ordinario.horasDia += seg.minutos / 60;
                resultado.ordinario.valor += seg.valor;
            } else if (seg.categoria === 'ordinario-noche') {
                resultado.ordinario.horasNoche += seg.minutos / 60;
                resultado.ordinario.valor += seg.valor;
            } else if (seg.categoria === 'festivo-dia') {
                resultado.festivo.horasDia += seg.minutos / 60;
                resultado.festivo.valor += seg.valor;
            } else if (seg.categoria === 'festivo-noche') {
                resultado.festivo.horasNoche += seg.minutos / 60;
                resultado.festivo.valor += seg.valor;
            }
        });
    });
    
    // Calcular totales
    resultado.total.horas = resultado.ordinario.horasDia + resultado.ordinario.horasNoche +
                           resultado.festivo.horasDia + resultado.festivo.horasNoche;
    resultado.total.valor = resultado.ordinario.valor + resultado.festivo.valor;
    
    return resultado;
};

/**
 * Convierte el resultado de aggregateShiftBreakdown al formato legacy
 * para compatibilidad con UI existente
 * @param {Object} agregado - Resultado de aggregateShiftBreakdown
 * @returns {Object} - Formato legacy {totalTurnos, totalHoras, horasDiurnas, horasNocturnas, etc.}
 */
export const convertirAgregadoALegacy = (agregado) => {
    return {
        totalTurnos: agregado.total.valor,
        totalHoras: agregado.total.horas,
        horasDiurnas: agregado.ordinario.horasDia + agregado.festivo.horasDia,
        horasNocturnas: agregado.ordinario.horasNoche + agregado.festivo.horasNoche,
        horasDiurnasFestivas: agregado.festivo.horasDia,
        horasNocturnasFestivas: agregado.festivo.horasNoche,
        valorOrdinario: agregado.ordinario.valor,
        valorFestivo: agregado.festivo.valor
    };
};

/**
 * Liquida un turno (compatibilidad con legacy)
 * @param {Object} turno - Datos del turno
 * @returns {Object} - Datos para calcularValorTurno legacy
 */
export const liquidarTurnoLegacyCompat = (turno) => {
    const { horaInicio, horaSalida } = turno;
    
    if (horaInicio === 'Descanso' || horaSalida === 'Descanso') {
        return { valor: 0, domingo: 0, festivo: 0, normalFestivo: 0, horas: 0 };
    }
    
    const resultado = liquidarTurnoPorTramos(turno, ['midnight']);
    
    // Calcular valores por tipo de día
    let ordinario = 0;
    let festivo = 0;
    
    resultado.breakdown.forEach(seg => {
        if (seg.categoria === 'ordinario-dia' || seg.categoria === 'ordinario-noche') {
            ordinario += seg.valor;
        } else {
            festivo += seg.valor;
        }
    });
    
    // Para legacy, domingo usa misma tarifa que festivo
    return {
        valor: ordinario,
        domingo: festivo,
        festivo: festivo,
        normalFestivo: ordinario, // puente festivo usa tarifa ordinario
        horas: resultado.horas
    };
};