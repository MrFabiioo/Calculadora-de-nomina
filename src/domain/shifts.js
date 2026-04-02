/**
 * Módulo de turnos - Datos de turnos y tarifas
 * Valores de referencia: hora diurna $11,509.90, nocturna $15,538.42
 */

// Tarifas por hora
export const TARIFAS_HORA = {
    diurna: 11509.90,
    nocturna: 15538.42,
    diurnaFestiva: 20717.82,
    nocturnaFestiva: 24737.29
};

// Valor media hora
export const MEDIA_HORA = {
    diurna: TARIFAS_HORA.diurna / 2,
    nocturna: TARIFAS_HORA.nocturna / 2,
    diurnaFestiva: TARIFAS_HORA.diurnaFestiva / 2,
    nocturnaFestiva: TARIFAS_HORA.nocturnaFestiva / 2
};

// Mapa de turnos con sus valores
export const TURNOS = {
    "Descanso-Descanso": { valor: 0, horas: 0, domingo: 0, festivo: 0, normalFestivo: 0 },
    "5:00 Am-13:00 Pm": { valor: TARIFAS_HORA.diurna * 7 + TARIFAS_HORA.nocturna, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 7 + TARIFAS_HORA.nocturnaFestiva, festivo: TARIFAS_HORA.diurnaFestiva * 7 + TARIFAS_HORA.nocturnaFestiva, normalFestivo: TARIFAS_HORA.diurna * 7 + TARIFAS_HORA.nocturna },
    "5:30 Am-13:30 Pm": { valor: TARIFAS_HORA.diurna * 7 + MEDIA_HORA.diurna + MEDIA_HORA.nocturna, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 7 + MEDIA_HORA.diurnaFestiva + MEDIA_HORA.nocturnaFestiva, festivo: TARIFAS_HORA.diurnaFestiva * 7 + MEDIA_HORA.diurnaFestiva + MEDIA_HORA.nocturnaFestiva, normalFestivo: TARIFAS_HORA.diurna * 7 + MEDIA_HORA.diurna + MEDIA_HORA.nocturna },
    "6:00 Am-12:00 m": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "6:00 Am-13:00 Pm": { valor: TARIFAS_HORA.diurna * 7, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 7, festivo: TARIFAS_HORA.diurnaFestiva * 7, normalFestivo: TARIFAS_HORA.diurna * 7 },
    "6:00 Am-14:00 Pm": { valor: TARIFAS_HORA.diurna * 8, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 8, festivo: TARIFAS_HORA.diurnaFestiva * 8, normalFestivo: TARIFAS_HORA.diurna * 8 },
    "7:00 Am-13:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "7:00 Am-15:00 Pm": { valor: TARIFAS_HORA.diurna * 8, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 8, festivo: TARIFAS_HORA.diurnaFestiva * 8, normalFestivo: TARIFAS_HORA.diurna * 8 },
    "8:00 Am-14:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "8:00 Am-15:00 Pm": { valor: TARIFAS_HORA.diurna * 7, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 7, festivo: TARIFAS_HORA.diurnaFestiva * 7, normalFestivo: TARIFAS_HORA.diurna * 7 },
    "8:00 Am-16:00 Pm": { valor: TARIFAS_HORA.diurna * 8, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 8, festivo: TARIFAS_HORA.diurnaFestiva * 8, normalFestivo: TARIFAS_HORA.diurna * 8 },
    "9:00 Am-16:00 Pm": { valor: TARIFAS_HORA.diurna * 7, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 7, festivo: TARIFAS_HORA.diurnaFestiva * 7, normalFestivo: TARIFAS_HORA.diurna * 7 },
    "10:00 Am-16:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "10:00 Am-17:00 Pm": { valor: TARIFAS_HORA.diurna * 7, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 7, festivo: TARIFAS_HORA.diurnaFestiva * 7, normalFestivo: TARIFAS_HORA.diurna * 7 },
    "12:00 m-18:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "13:00 Pm-19:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "13:00 Pm-21:00 Pm": { valor: TARIFAS_HORA.diurna * 8, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 8, festivo: TARIFAS_HORA.diurnaFestiva * 8, normalFestivo: TARIFAS_HORA.diurna * 8 },
    "13:30 Pm-21:30 Pm": { valor: TARIFAS_HORA.diurna * 7 + MEDIA_HORA.diurna + MEDIA_HORA.nocturna, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 7 + MEDIA_HORA.diurnaFestiva + MEDIA_HORA.nocturnaFestiva, festivo: TARIFAS_HORA.diurnaFestiva * 7 + MEDIA_HORA.diurnaFestiva + MEDIA_HORA.nocturnaFestiva, normalFestivo: TARIFAS_HORA.diurna * 7 + MEDIA_HORA.diurna + MEDIA_HORA.nocturna },
    "14:00 Pm-20:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "14:00 Pm-22:00 Pm": { valor: TARIFAS_HORA.diurna * 7 + TARIFAS_HORA.nocturna, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 7 + TARIFAS_HORA.nocturnaFestiva, festivo: TARIFAS_HORA.diurnaFestiva * 7 + TARIFAS_HORA.nocturnaFestiva, normalFestivo: TARIFAS_HORA.diurna * 7 + TARIFAS_HORA.nocturna },
    "14:00 Pm-21:00 Pm": { valor: TARIFAS_HORA.diurna * 7, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 7, festivo: TARIFAS_HORA.diurnaFestiva * 7, normalFestivo: TARIFAS_HORA.diurna * 7 },
    "15:00 Pm-21:00 Pm": { valor: TARIFAS_HORA.diurna * 6, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 6, festivo: TARIFAS_HORA.diurnaFestiva * 6, normalFestivo: TARIFAS_HORA.diurna * 6 },
    "15:00 Pm-22:00 Pm": { valor: TARIFAS_HORA.diurna * 6 + TARIFAS_HORA.nocturna, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 6 + TARIFAS_HORA.nocturnaFestiva, festivo: TARIFAS_HORA.diurnaFestiva * 6 + TARIFAS_HORA.nocturnaFestiva, normalFestivo: TARIFAS_HORA.diurna * 6 + TARIFAS_HORA.nocturna },
    "15:00 Pm-23:00 Pm": { valor: TARIFAS_HORA.diurna * 6 + TARIFAS_HORA.nocturna * 2, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 6 + TARIFAS_HORA.nocturnaFestiva * 2, festivo: TARIFAS_HORA.diurnaFestiva * 6 + TARIFAS_HORA.nocturnaFestiva * 2, normalFestivo: TARIFAS_HORA.diurna * 6 + TARIFAS_HORA.nocturna * 2 },
    "16:00 Pm-22:00 Pm": { valor: TARIFAS_HORA.diurna * 5 + TARIFAS_HORA.nocturna, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 5 + TARIFAS_HORA.nocturnaFestiva, festivo: TARIFAS_HORA.diurnaFestiva * 5 + TARIFAS_HORA.nocturnaFestiva, normalFestivo: TARIFAS_HORA.diurna * 5 + TARIFAS_HORA.nocturna },
    "16:00 Pm-23:00 Pm": { valor: TARIFAS_HORA.diurna * 5 + TARIFAS_HORA.nocturna * 2, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 5 + TARIFAS_HORA.nocturnaFestiva * 2, festivo: TARIFAS_HORA.diurnaFestiva * 5 + TARIFAS_HORA.nocturnaFestiva * 2, normalFestivo: TARIFAS_HORA.diurna * 5 + TARIFAS_HORA.nocturna * 2 },
    "16:00 Pm-24:00 Pm": { valor: TARIFAS_HORA.diurna * 5 + TARIFAS_HORA.nocturna * 3, horas: 8, domingo: TARIFAS_HORA.diurnaFestiva * 5 + TARIFAS_HORA.nocturnaFestiva * 3, festivo: TARIFAS_HORA.diurnaFestiva * 5 + TARIFAS_HORA.nocturnaFestiva * 3, normalFestivo: TARIFAS_HORA.diurna * 5 + TARIFAS_HORA.nocturna * 3 },
    "17:00 Pm-23:00 Pm": { valor: TARIFAS_HORA.diurna * 4 + TARIFAS_HORA.nocturna * 2, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 4 + TARIFAS_HORA.nocturnaFestiva * 2, festivo: TARIFAS_HORA.diurnaFestiva * 4 + TARIFAS_HORA.nocturnaFestiva * 2, normalFestivo: TARIFAS_HORA.diurna * 4 + TARIFAS_HORA.nocturna * 2 },
    "17:00 Pm-24:00 Pm": { valor: TARIFAS_HORA.diurna * 4 + TARIFAS_HORA.nocturna * 3, horas: 7, domingo: TARIFAS_HORA.diurnaFestiva * 4 + TARIFAS_HORA.nocturnaFestiva * 3, festivo: TARIFAS_HORA.diurnaFestiva * 4 + TARIFAS_HORA.nocturnaFestiva * 3, normalFestivo: TARIFAS_HORA.diurna * 4 + TARIFAS_HORA.nocturna * 3 },
    "18:00 Pm-24:00 Pm": { valor: TARIFAS_HORA.diurna * 3 + TARIFAS_HORA.nocturna * 3, horas: 6, domingo: TARIFAS_HORA.diurnaFestiva * 3 + TARIFAS_HORA.nocturnaFestiva * 3, festivo: TARIFAS_HORA.diurnaFestiva * 3 + TARIFAS_HORA.nocturnaFestiva * 3, normalFestivo: TARIFAS_HORA.diurna * 3 + TARIFAS_HORA.nocturna * 3 },
    "22:00 Pm-6:00 Am": { valor: TARIFAS_HORA.nocturna * 8, horas: 8, domingo: TARIFAS_HORA.nocturnaFestiva * 8, festivo: TARIFAS_HORA.nocturnaFestiva * 8, normalFestivo: TARIFAS_HORA.nocturnaFestiva * 6 + TARIFAS_HORA.nocturna * 2 },
    "23:00 Pm-5:00 Am": { valor: TARIFAS_HORA.nocturna * 6, horas: 6, domingo: TARIFAS_HORA.nocturnaFestiva * 6, festivo: TARIFAS_HORA.nocturnaFestiva * 6, normalFestivo: TARIFAS_HORA.nocturnaFestiva * 5 + TARIFAS_HORA.nocturna }
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