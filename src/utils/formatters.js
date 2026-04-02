/**
 * Módulo de Formateo - Funciones para formatear datos
 * Usa Intl.NumberFormat para moneda colombiana
 */

import { DIAS_SEMANA, toLocalDate } from '../domain/holidays.js';

/**
 * Formatea un número como moneda colombiana
 * @param {number} valor - Valor a formatear
 * @returns {string} - Valor formateado (ej: "$1.234.567")
 */
export const formatearMoneda = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '$0';
    }
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
};

/**
 * Formatea un número con separador de miles
 * @param {number} valor - Valor a formatear
 * @returns {string} - Valor formateado (ej: "1.234.567")
 */
export const formatearNumero = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0';
    }
    
    return new Intl.NumberFormat('es-CO').format(valor);
};

/**
 * Formatea una fecha
 * @param {string|Date} fecha - Fecha a formatear
 * @param {string} locale - Locale (default 'es-CO')
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fecha, locale = 'es-CO') => {
    if (!fecha) return '';
    
    // Usar toLocalDate si es string para evitar timezone issues
    const fechaObj = fecha instanceof Date ? fecha : (fecha.includes('T') ? new Date(fecha) : toLocalDate(fecha));
    
    if (isNaN(fechaObj.getTime())) {
        return '';
    }
    
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(fechaObj);
};

/**
 * Obtiene el nombre del día de la semana
 * @param {Date|string} fecha - Fecha
 * @returns {string} - Nombre del día
 */
export const obtenerNombreDia = (fecha) => {
    if (!fecha) return '';
    
    // Usar toLocalDate si es string para evitar timezone issues
    const fechaObj = fecha instanceof Date ? fecha : toLocalDate(fecha);
    
    if (isNaN(fechaObj.getTime())) {
        return '';
    }
    
    return DIAS_SEMANA[fechaObj.getDay()];
};

/**
 * Formatea un porcentaje
 * @param {number} valor - Valor decimal (0.04 = 4%)
 * @returns {string} - Porcentaje formateado (ej: "4%")
 */
export const formatearPorcentaje = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0%';
    }
    
    return `${(valor * 100).toFixed(1)}%`;
};

/**
 * Formatea una hora en formato 12h
 * @param {string} hora - Hora en formato 24h (ej: "14:00")
 * @returns {string} - Hora formateada
 */
export const formatearHora = (hora) => {
    if (!hora) return '';
    
    // Si ya tiene formato AM/PM, devolver tal cual
    if (hora.includes('Am') || hora.includes('Pm')) {
        return hora;
    }
    
    // Convertir de 24h a 12h
    const [horas, minutos] = hora.split(':');
    const horaNum = parseInt(horas, 10);
    const ampm = horaNum >= 12 ? 'Pm' : 'Am';
    const hora12 = horaNum % 12 || 12;
    
    return `${hora12}:${minutos} ${ampm}`;
};

/**
 * Convierte valor de input a número
 * @param {string} valor - Valor del input
 * @returns {number} - Número o 0 si es inválido
 */
export const parseInputNumero = (valor) => {
    if (valor === '' || valor === null || valor === undefined) {
        return 0;
    }
    
    const numero = parseFloat(valor.replace(/,/g, '.'));
    return isNaN(numero) ? 0 : numero;
};

/**
 * Capitaliza la primera letra de un string
 * @param {string} texto - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

/**
 * Trunca un texto a una longitud máxima
 * @param {string} texto - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado con "..." si es necesario
 */
export const truncarTexto = (texto, maxLength = 50) => {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength - 3) + '...';
};