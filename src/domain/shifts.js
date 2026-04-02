/**
 * Módulo de turnos - Datos de turnos y tarifas
 * Cálculo dinámico según Art. 15 CST:
 * - Diurno: 6:00 AM a 7:00 PM (horas 6 a 19)
 * - Nocturno: 7:00 PM a 6:00 AM (horas 19 a 24 + 0 a 6)
 */

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