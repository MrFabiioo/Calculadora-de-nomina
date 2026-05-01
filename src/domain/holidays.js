/**
 * Módulo de festivos - Fechas festivas colombianas
 */

// Festivos oficiales de Colombia 2024-2026
// ÚNICA FUENTE DE VERDAD para calendarios
export const FESTIVOS = [
    // 2024
    "2024-01-01", "2024-01-06", "2024-03-24", "2024-03-28", "2024-03-29",
    "2024-05-01", "2024-06-02", "2024-06-03", "2024-07-01", "2024-07-20",
    "2024-08-07", "2024-08-19", "2024-10-14", "2024-11-04", "2024-11-11",
    "2024-12-08", "2024-12-25",
    // 2025
    "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-13", "2025-04-14",
    "2025-04-17", "2025-04-18", "2025-05-01", "2025-06-02", "2025-06-23",
    "2025-07-20", "2025-08-07", "2025-08-18", "2025-10-13", "2025-11-03",
    "2025-11-17", "2025-12-08", "2025-12-25",
    // 2026
    "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
"2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
"2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
"2026-11-16", "2026-12-08", "2026-12-25"
];

// Días de la semana
export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * Convierte un string YYYY-MM-DD a Date en hora local (sin timezone issues)
 * Importante: new Date("2026-04-01") interpreta como UTC, causando errores de día
 * Solución: añadir hora local "T00:00:00" fuerza interpretación en timezone del usuario
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {Date} - Objeto Date en hora local
 */
export const toLocalDate = (fechaString) => {
    if (!fechaString) return null;
    // Forzar hora local para evitar timezone issues
    return new Date(fechaString + "T00:00:00");
};

/**
 * Verifica si una fecha es festiva
 * @param {string|Date} fecha - Fecha a verificar
 * @returns {boolean} - true si es festivo
 */
export const esFestivo = (fecha) => {
    let fechaString;
    if (fecha instanceof Date) {
        fechaString = fecha.toISOString().split('T')[0];
    } else {
        // Usar toLocalDate para evitar timezone issues
        fechaString = toLocalDate(fecha).toISOString().split('T')[0];
    }
    return FESTIVOS.includes(fechaString);
};

/**
 * Verifica si una fecha es domingo
 * @param {string|Date} fecha - Fecha a verificar
 * @returns {boolean} - true si es domingo
 */
export const esDomingo = (fecha) => {
    let diaSemana;
    if (fecha instanceof Date) {
        diaSemana = fecha.getDay();
    } else {
        // Usar toLocalDate para evitar timezone issues
        diaSemana = toLocalDate(fecha).getDay();
    }
    return diaSemana === 0;
};

/**
 * Obtiene el nombre del día de la semana
 * @param {Date} fecha - Instancia de Date
 * @returns {string} - Nombre del día
 */
export const obtenerNombreDia = (fecha) => DIAS_SEMANA[fecha.getDay()];