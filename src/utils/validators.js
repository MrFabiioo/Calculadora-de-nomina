/**
 * Módulo de Validaciones - Funciones puras de validación
 * NO toca el DOM - retorna objetos con resultado
 */

/**
 * Valida que un valor sea un número positivo
 * @param {*} valor - Valor a validar
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarNumeroPositivo = (valor) => {
    if (valor === '' || valor === null || valor === undefined) {
        return { valid: true }; // Permitir vacío
    }
    
    const numero = parseFloat(valor);
    
    if (isNaN(numero)) {
        return { valid: false, message: 'Debe ser un número válido' };
    }
    
    if (numero < 0) {
        return { valid: false, message: 'El valor no puede ser negativo' };
    }
    
    return { valid: true };
};

/**
 * Valida que un valor sea un número entero positivo
 * @param {*} valor - Valor a validar
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarNumeroEntero = (valor) => {
    if (valor === '' || valor === null || valor === undefined) {
        return { valid: true };
    }
    
    const numero = parseFloat(valor);
    
    if (isNaN(numero)) {
        return { valid: false, message: 'Debe ser un número válido' };
    }
    
    if (numero < 0) {
        return { valid: false, message: 'El valor no puede ser negativo' };
    }
    
    if (!Number.isInteger(numero)) {
        return { valid: false, message: 'Debe ser un número entero' };
    }
    
    return { valid: true };
};

/**
 * Valida que una fecha sea válida
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarFecha = (fecha) => {
    if (!fecha) {
        return { valid: true }; // Permitir vacío
    }
    
    const fechaObj = new Date(fecha);
    
    if (isNaN(fechaObj.getTime())) {
        return { valid: false, message: 'Fecha inválida' };
    }
    
    return { valid: true };
};

/**
 * Valida rango de horas trabajadas
 * @param {number} horas - Horas a validar
 * @param {number} maximo - Máximo de horas permitidas (default 24)
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarRangoHoras = (horas, maximo = 24) => {
    if (horas === '' || horas === null || horas === undefined) {
        return { valid: true };
    }
    
    const numero = parseFloat(horas);
    
    if (isNaN(numero)) {
        return { valid: false, message: 'Debe ser un número válido' };
    }
    
    if (numero < 0) {
        return { valid: false, message: 'No puede ser negativo' };
    }
    
    if (numero > maximo) {
        return { valid: false, message: `No puede exceder ${maximo} horas` };
    }
    
    return { valid: true };
};

/**
 * Valida que un turno tenga los campos requeridos
 * @param {Object} turno - Objeto de turno
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarTurno = (turno) => {
    if (!turno) {
        return { valid: false, message: 'Turno requerido' };
    }
    
    if (!turno.horaInicio) {
        return { valid: false, message: 'Hora de inicio requerida' };
    }
    
    if (!turno.horaSalida) {
        return { valid: false, message: 'Hora de salida requerida' };
    }
    
    return { valid: true };
};

/**
 * Valida que la hora de salida sea posterior a la de inicio
 * @param {string} horaInicio - Hora de inicio
 * @param {string} horaSalida - Hora de salida
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarHorasTurno = (horaInicio, horaSalida) => {
    // Si es descanso, permitir
    if (horaInicio === 'Descanso' && horaSalida === 'Descanso') {
        return { valid: true };
    }
    
    // Si alguna es descanso y la otra no, es inválido
    if (horaInicio === 'Descanso' !== horaSalida === 'Descanso') {
        return { valid: false, message: 'Ambos deben ser descanso o ninguno' };
    }
    
    return { valid: true };
};

/**
 * Valida rango de deducciones
 * @param {number} deduccion - Valor de deducción
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validarDeduccion = (deduccion) => {
    return validarNumeroPositivo(deduccion);
};