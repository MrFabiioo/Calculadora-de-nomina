/**
 * Módulo de segmentos - Normalización, segmentación y clasificación de turnos
 * 
 * Pipeline determinístico:
 * normalizeShiftInput -> segmentShift -> classifySegment
 */

import { toLocalDate, esFestivo as esFestivoHelper, esDomingo as esDomingoHelper } from './holidays.js';
import { 
    parseHora, 
    cruzaMedianoche, 
    normalizarHora,
    esFranquiciaDiurna,
    horaDecimalToDate 
} from './shifts.js';

/**
 * Normaliza la entrada de un turno para el motor segmentado
 * @param {Object} input - Datos del turno
 * @param {string} input.fecha - Fecha en formato YYYY-MM-DD
 * @param {string} input.horaInicio - Hora de inicio (ej: "14:00 Pm")
 * @param {string} input.horaSalida - Hora de salida (ej: "22:00 Pm")
 * @param {boolean} input.incapacidad - Si tiene incapacidad
 * @returns {Object} - Turno normalizado
 */
export const normalizeShiftInput = (input) => {
    const { fecha, horaInicio, horaSalida, incapacidad = false } = input;
    
    // Detectar descanso
    const esDescanso = (horaInicio === 'Descanso' || horaSalida === 'Descanso');
    
    // Parsear horas
    const inicioDecimal = parseHora(horaInicio);
    const finDecimal = parseHora(horaSalida);
    
    // Convertir fecha a Date
    const fechaBase = toLocalDate(fecha);
    
    // Detectar cruce de medianoche
    const cruza = inicioDecimal !== null && finDecimal !== null && cruzaMedianoche(inicioDecimal, finDecimal);
    
    return {
        fechaBase,
        fechaString: fecha,
        horaInicio: inicioDecimal,
        horaSalida: finDecimal,
        incapacidad,
        esDescanso,
        cruzaMedianoche: cruza,
        // Para turnos que cruzan medianoche, la fecha nominal de salida es el día siguiente
        fechaSalida: cruza ? toLocalDate(sumarDias(fecha, 1)) : fechaBase
    };
};

/**
 * Suma un día a una fecha
 * @param {string} fechaString - Fecha YYYY-MM-DD
 * @param {number} dias - Días a sumar
 * @returns {string} - Nueva fecha YYYY-MM-DD
 */
const sumarDias = (fechaString, dias) => {
    const fecha = new Date(fechaString + "T00:00:00");
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
};

/**
 * Segmenta un turno según los límites configurados
 * @param {Object} normalized - Turno normalizado de normalizeShiftInput()
 * @param {string[]} boundaries - Límites de corte ['midnight'] por defecto
 * @returns {Array} - Array de segmentos {inicio, fin, minutos, fechaNominal}
 */
export const segmentShift = (normalized, boundaries = ['midnight']) => {
    const { 
        fechaBase, 
        horaInicio, 
        horaSalida, 
        esDescanso,
        fechaSalida,
        cruzaMedianoche 
    } = normalized;
    
    // Si es descanso, retornar array vacío
    if (esDescanso) {
        return [];
    }
    
    // Si horas inválidas, retornar vacío
    if (horaInicio === null || horaSalida === null) {
        return [];
    }
    
    // Normalizar para turnos overnight
    const finEffective = horaSalida <= horaInicio ? horaSalida + 24 : horaSalida;
    
    // Determinar límites de segmentación
    const limites = getSegmentLimits(boundaries, horaInicio, finEffective);
    
    // Generar segmentos
    const segmentos = [];
    
    for (let i = 0; i < limites.length - 1; i++) {
        const limiteInicio = limites[i];
        const limiteFin = limites[i + 1];
        
        // El segmento va de limiteInicio a limiteFin
        const inicio = Math.max(horaInicio, limiteInicio);
        const fin = Math.min(finEffective, limiteFin);
        
        if (fin > inicio) {
            // Determinar fecha nominal basada en la hora de inicio del segmento
            const horaSegmento = inicio;
            let fechaNominal;
            
            // Si la hora es >= 24, significa que es del día siguiente
            if (horaSegmento >= 24) {
                fechaNominal = fechaSalida;
            } else {
                // Si el turno cruza medianoche y el segmento empieza antes que la hora de inicio del turno
                // (es decir, el segmento pertenece al día siguiente) → usar fechaSalida
                // En cualquier otro caso → usar fechaBase
                fechaNominal = (cruzaMedianoche && horaSegmento < horaInicio) ? fechaSalida : fechaBase;
            }
            
            // Ajustar horas para Date (si > 24, restar 24)
            const horaInicioAjustada = horaSegmento >= 24 ? horaSegmento - 24 : horaSegmento;
            const horaFinAjustada = fin >= 24 ? fin - 24 : fin;
            
            segmentos.push({
                inicio: horaInicioAjustada,
                fin: horaFinAjustada,
                minutos: (fin - inicio) * 60,
                fechaNominal: typeof fechaNominal === 'string' ? fechaNominal : fechaNominal.toISOString().split('T')[0]
            });
        }
    }
    
    return segmentos;
};

/**
 * Obtiene los límites de segmentación
 * @param {string[]} boundaries - Lista de boundaries
 * @param {number} horaInicio - Hora de inicio
 * @param {number} horaFinEffective - Hora de fin efectiva (ajustada si cruza)
 * @returns {number[]} - Límites ordenados
 */
const getSegmentLimits = (boundaries, horaInicio, horaFinEffective) => {
    const limites = new Set();
    
    // Siempre incluir inicio y fin del turno
    limites.add(horaInicio);
    limites.add(horaFinEffective);
    
    // Agregar límites configurados que estén dentro del turno
    boundaries.forEach(boundary => {
        let hora;
        switch (boundary) {
            case 'midnight':
                // Para turnos que cruzan medianoche (finEffective > 24), usar 24
                // Para turnos normales, usar 0 (equivalente a 24)
                hora = horaFinEffective > 24 ? 24 : 0;
                break;
            case '06:00':
            case 'mañana':
                hora = 6;
                break;
            case '19:00':
            case 'tarde':
                hora = 19;
                break;
            default:
                return;
        }
        
        // Solo agregar si está dentro del rango del turno
        // Usar >= y <= para incluir turnos que cruzan medianoche
        // Por ejemplo: 22:00-06:00 con finEffective=30 debe incluir midnight (24)
        if (hora >= horaInicio && hora <= horaFinEffective) {
            limites.add(hora);
        }
    });
    
    return Array.from(limites).sort((a, b) => a - b);
};

/**
 * Clasifica un segmento según su fecha/hora real
 * @param {Object} segment - Segmento de segmentShift()
 * @returns {Object} - Clasificación {esFestivo, esDomingo, esNocturno, categoria}
 */
export const classifySegment = (segment) => {
    const { inicio, fechaNominal } = segment;
    
    // Usar helpers de holidays.js para fecha real
    const esFestivo = esFestivoHelper(fechaNominal);
    const esDom = esDomingoHelper(fechaNominal);
    
    // Determinar si es nocturno (fuera de [6, 19))
    const esNocturno = !esFranquiciaDiurna(inicio);
    
    // Determinar categoría
    let categoria;
    if (esFestivo || esDom) {
        categoria = esNocturno ? 'festivo-noche' : 'festivo-dia';
    } else {
        categoria = esNocturno ? 'ordinario-noche' : 'ordinario-dia';
    }
    
    return {
        esFestivo: esFestivo || esDom, // DOMINGO cuenta como festivo para tarifas
        esDomingo: esDom,
        esNocturno,
        categoria
    };
};

/**
 * Pipeline completo: normaliza, segmenta y clasifica un turno
 * @param {Object} input - Datos crudos del turno
 * @param {string[]} boundaries - Límites de segmentación
 * @returns {Object} - Resultado con segmentos clasificados
 */
export const processShift = (input, boundaries = ['midnight']) => {
    const normalized = normalizeShiftInput(input);
    const segmentos = segmentShift(normalized, boundaries);
    
    const segmentosClasificados = segmentos.map(segment => ({
        ...segment,
        ...classifySegment(segment)
    }));
    
    return {
        normalized,
        segmentos: segmentosClasificados
    };
};