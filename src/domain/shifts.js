/**
 * Módulo de turnos - Datos de turnos y tarifas
 * Cálculo dinámico según Art. 15 CST:
 * - Diurno: 6:00 AM a 7:00 PM (horas 6 a 19)
 * - Nocturno: 7:00 PM a 6:00 AM (horas 19 a 24 + 0 a 6)
 */

// ============================================
// CONSTANTES - Límites de franquicia horaria
// ============================================

/**
 * Límites de franquicias horarias (Art. 15 CST)
 * - Diurno: [06:00, 19:00)
 * - Nocturno: [19:00, 06:00)
 */
export const FRANQUICIA_DIURNA_INICIO = 6;   // 06:00
export const FRANQUICIA_DIURNA_FIN = 19;     // 19:00
export const FRANQUICIA_NOCTURNA_INICIO = 19; // 19:00
export const FRANQUICIA_NOCTURNA_FIN = 6;    // 06:00

//boundaries configurables para segmentación
export const BOUNDARIES = {
    MIDNIGHT: 'midnight',
    MAÑANA: '06:00',
    TARDE: '19:00'
};

// ============================================
// TARIFAS
// ============================================

// Tarifas por hora
export const TARIFAS_HORA = {
    diurna: 12210,
    nocturna: 16483.5,
    diurnaFestiva: 21978,
    nocturnaFestiva: 26251.6666667
};

// Valor media hora
export const MEDIA_HORA = {
    diurna: TARIFAS_HORA.diurna / 2,
    nocturna: TARIFAS_HORA.nocturna / 2,
    diurnaFestiva: TARIFAS_HORA.diurnaFestiva / 2,
    nocturnaFestiva: TARIFAS_HORA.nocturnaFestiva / 2
};

/**
 * Convierte un string de hora del formato de la app a número decimal.
 * Formatos soportados: "5:00 Am", "5:30 Am", "12:00 m", "13:00 Pm", "24:00 Pm", "Descanso"
 * @param {string} horaStr
 * @returns {number|null} - Hora decimal (ej: 5.5) o null si es "Descanso" / inválido
 */
export const parseHora = (horaStr) => {
    if (!horaStr || horaStr === 'Descanso' || horaStr === 'Selecciona un horario') return null;

    // Extraer la parte "HH:MM" antes del espacio
    const partes = horaStr.trim().split(' ');
    const horaminuto = partes[0]; // "HH:MM"
    const [hStr, mStr] = horaminuto.split(':');

    const hora = parseInt(hStr, 10);
    const minutos = parseInt(mStr, 10);

    return hora + (minutos === 30 ? 0.5 : 0);
};

/**
 * Calcula cuántas horas de un turno son diurnas y cuántas nocturnas,
 * iterando en incrementos de media hora (Art. 15 CST).
 * Diurno: [6, 19) — Nocturno: [0, 6) ∪ [19, 24)
 * @param {number} inicio - Hora de inicio decimal
 * @param {number} fin - Hora de fin decimal
 * @returns {{ diurnas: number, nocturnas: number, totalHoras: number }}
 */
export const calcularHorasDiurnasNocturnas = (inicio, fin) => {
    if (fin <= inicio) fin += 24; // turno overnight

    let diurnas = 0;
    let nocturnas = 0;

    for (let h = inicio; h < fin; h += 0.5) {
        const hNorm = h % 24; // normalizar para turnos que cruzan medianoche
        if (hNorm >= 6 && hNorm < 19) {
            diurnas += 0.5;
        } else {
            nocturnas += 0.5;
        }
    }

    return { diurnas, nocturnas, totalHoras: fin - inicio };
};

/**
 * Calcula el objeto turnoData para un par de horas dado.
 * Reemplaza el lookup estático en TURNOS.
 * @param {string} horaInicioStr - Ej: "14:00 Pm"
 * @param {string} horaSalidaStr - Ej: "22:00 Pm"
 * @returns {{ valor, domingo, festivo, normalFestivo, horas }|null}
 */
export const calcularTurno = (horaInicioStr, horaSalidaStr) => {
    if (horaInicioStr === 'Descanso' || horaSalidaStr === 'Descanso') {
        return { valor: 0, domingo: 0, festivo: 0, normalFestivo: 0, horas: 0 };
    }

    const inicio = parseHora(horaInicioStr);
    const fin = parseHora(horaSalidaStr);

    if (inicio === null || fin === null) return null;

    const { diurnas, nocturnas, totalHoras } = calcularHorasDiurnasNocturnas(inicio, fin);

    return {
        valor: diurnas * TARIFAS_HORA.diurna + nocturnas * TARIFAS_HORA.nocturna,
        domingo: diurnas * TARIFAS_HORA.diurnaFestiva + nocturnas * TARIFAS_HORA.nocturnaFestiva,
        festivo: diurnas * TARIFAS_HORA.diurnaFestiva + nocturnas * TARIFAS_HORA.nocturnaFestiva,
        // normalFestivo: mismo valor base, la diferencia la aplica holidays.js
        normalFestivo: diurnas * TARIFAS_HORA.diurna + nocturnas * TARIFAS_HORA.nocturna,
        horas: totalHoras,
    };
};

// Lista de turnos para select
export const TURNOS_INICIO = [
    "Selecciona un horario", "Descanso", "5:00 Am", "5:30 Am", "6:00 Am", "7:00 Am", 
    "8:00 Am", "9:00 Am", "10:00 Am", "12:00 m", "13:00 Pm", "13:30 Pm", 
    "14:00 Pm", "15:00 Pm", "16:00 Pm", "17:00 Pm", "18:00 Pm", "19:00 Pm", 
    "21:00 Pm", "22:00 Pm", "23:00 Pm", "24:00 Pm"
];

export const TURNOS_SALIDA = [
    "Selecciona un horario", "Descanso", "5:00 Am", "5:30 Am", "6:00 Am", "7:00 Am", 
    "8:00 Am", "9:00 Am", "10:00 Am", "12:00 m", "13:00 Pm", "13:30 Pm", 
    "14:00 Pm", "15:00 Pm", "16:00 Pm", "17:00 Pm", "18:00 Pm", "19:00 Pm", 
    "20:00 Pm", "21:00 Pm", "21:30 Pm", "22:00 Pm", "23:00 Pm", "24:00 Pm"
];

// ============================================
// HELPERS REUTILIZABLES PARA MOTOR NUEVO
// ============================================

/**
 * Determina si un turno cruza la medianoche
 * @param {number} horaInicio - Hora de inicio en formato decimal
 * @param {number} horaFin - Hora de fin en formato decimal
 * @returns {boolean} - true si cruza medianoche
 */
export const cruzaMedianoche = (horaInicio, horaFin) => {
    return horaFin <= horaInicio;
};

/**
 * Normaliza hora para turnos que cruzan medianoche
 * @param {number} hora - Hora decimal
 * @returns {number} - Hora normalizada (0-24)
 */
export const normalizarHora = (hora) => hora % 24;

/**
 * Verifica si una hora está dentro de la franquicia diurna
 * @param {number} hora - Hora decimal a verificar
 * @returns {boolean} - true si está en horario diurno [6, 19)
 */
export const esFranquiciaDiurna = (hora) => {
    const h = normalizarHora(hora);
    return h >= FRANQUICIA_DIURNA_INICIO && h < FRANQUICIA_DIURNA_FIN;
};

/**
 * Verifica si una hora está dentro de la franquicia nocturna
 * @param {number} hora - Hora decimal a verificar
 * @returns {boolean} - true si está en horario nocturno
 */
export const esFranquiciaNocturna = (hora) => {
    return !esFranquiciaDiurna(hora);
};

/**
 * Obtiene los límites de segmentación configurables
 * @param {string[]} boundaries - Lista de boundaries ['midnight', '06:00', '19:00']
 * @returns {number[]} - Límites en horas decimales
 */
export const getSegmentBoundaries = (boundaries = ['midnight']) => {
    const limites = [];
    
    if (boundaries.includes(BOUNDARIES.MIDNIGHT)) {
        limites.push(0); // medianoche
    }
    if (boundaries.includes(BOUNDARIES.MAÑANA)) {
        limites.push(6); // 06:00
    }
    if (boundaries.includes(BOUNDARIES.TARDE)) {
        limites.push(19); // 19:00
    }
    
    // Siempre incluir el límite final (24 o el fin del turno)
    return [...limites].sort((a, b) => a - b);
};

/**
 * Convierte hora decimal a objeto Date
 * @param {Date} fechaBase - Fecha base
 * @param {number} horaDecimal - Hora en formato decimal
 * @returns {Date} - Date con hora ajustada
 */
export const horaDecimalToDate = (fechaBase, horaDecimal) => {
    const fecha = new Date(fechaBase);
    const horas = Math.floor(horaDecimal);
    const minutos = (horaDecimal - horas) * 60;
    
    fecha.setHours(horas, minutos, 0, 0);
    return fecha;
};

/**
 * Convierte Date a hora decimal
 * @param {Date} date - Objeto Date
 * @returns {number} - Hora en formato decimal
 */
export const dateToHoraDecimal = (date) => {
    return date.getHours() + (date.getMinutes() / 60);
};