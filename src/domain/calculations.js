/**
 * Módulo de cálculos - Funciones puras para el cálculo de nómina
 * NO toca el DOM - solo lógica de negocio
 */

import { TARIFAS_HORA, TURNOS } from './shifts.js';
import { esFestivo, esDomingo, esNormalAFestivo, esFestivoANormal } from './holidays.js';

// Constantes para deducciones
const TARIFA_SALUD_EMPLEADO = 0.04; // 4%
const TARIFA_SALUD_EMPRESA = 0.085;  // 8.5%
const TARIFA_PENSION_EMPLEADO = 0.04; // 4%
const TARIFA_PENSION_EMPRESA = 0.12;  // 12%
const SUBSIDIO_TRANSPORTE_MAXIMO = 200000;
const LIMITE_SUBSIDIO = 2847000;

/**
 * Calcula el valor de un turno según el tipo de día
 * @param {Object} turnoData - Datos del turno (valor, domingo, festivo, etc.)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {boolean} tieneIncapacidad - Si tiene incapacidad
 * @returns {number} - Valor calculado del turno
 */
export const calcularValorTurno = (turnoData, fecha, tieneIncapacidad = false) => {
    if (!turnoData) return 0;
    
    let valor;
    
    if (esDomingo(fecha) && esFestivo(fecha)) {
        valor = turnoData.festivo;
    } else if (esDomingo(fecha)) {
        valor = turnoData.domingo;
    } else if (esNormalAFestivo(fecha)) {
        valor = turnoData.normalFestivo;
    } else if (esFestivoANormal(fecha)) {
        valor = turnoData.domingo;
    } else if (esFestivo(fecha)) {
        valor = turnoData.festivo;
    } else {
        valor = turnoData.valor;
    }
    
    // Aplicar descuento por incapacidad
    if (tieneIncapacidad) {
        valor *= 0.6666;
    }
    
    return valor;
};

/**
 * Calcula el valor de horas extras
 * @param {number} horasDiurnas - Horas extras diurnas
 * @param {number} horasNocturnas - Horas extras nocturnas
 * @param {number} horasDiurnasFestivas - Horas extras diurnas festivas
 * @param {number} horasNocturnasFestivas - Horas extras nocturnas festivas
 * @returns {number} - Total de horas extras
 */
export const calcularHorasExtras = (
    horasDiurnas = 0,
    horasNocturnas = 0,
    horasDiurnasFestivas = 0,
    horasNocturnasFestivas = 0
) => {
    const total = 
        (horasDiurnas || 0) * TARIFAS_HORA.diurna +
        (horasNocturnas || 0) * TARIFAS_HORA.nocturna +
        (horasDiurnasFestivas || 0) * TARIFAS_HORA.diurnaFestiva +
        (horasNocturnasFestivas || 0) * TARIFAS_HORA.nocturnaFestiva;
    
    return total;
};

/**
 * Calcula el subsidy de transporte
 * @param {number} devengadoTotal - Total devengado sin subsidio
 * @param {number} cantidadTurnos - Cantidad de turnos trabajados
 * @returns {number} - Valor del subsidio
 */
export const calcularSubsidioTransporte = (devengadoTotal, cantidadTurnos) => {
    // Si el devengado supera el límite, no aplica subsidio
    if (devengadoTotal >= LIMITE_SUBSIDIO) {
        return 0;
    }
    
    // Calcular diario: 200000 / 30 días
    const diario = SUBSIDIO_TRANSPORTE_MAXIMO / 30;
    
    // Calcular selon turnos (máximo 30 días)
    const diasSubsidio = Math.min(cantidadTurnos, 30);
    
    return diario * diasSubsidio;
};

/**
 * Calcula las deducciones de salud y pensión
 * @param {number} base - Base para cálculo (devengado)
 * @returns {Object} - Objeto con saludEmpleado, pensionEmpleado, saludEmpresa, pensionEmpresa
 */
export const calcularDeducciones = (base) => {
    return {
        saludEmpleado: base * TARIFA_SALUD_EMPLEADO,
        pensionEmpleado: base * TARIFA_PENSION_EMPLEADO,
        saludEmpresa: base * TARIFA_SALUD_EMPRESA,
        pensionEmpresa: base * TARIFA_PENSION_EMPRESA
    };
};

/**
 * Calcula el total de deducciones
 * @param {Object} deducciones - Deducciones del empleado
 * @param {Object} saludPension - Deducciones de salud y pensión
 * @returns {number} - Total deducciones
 */
export const calcularTotalDeducciones = (deducciones, saludPension) => {
    return (
        (deducciones.nomina || 0) +
        (deducciones.emi || 0) +
        (deducciones.otras || 0) +
        saludPension.saludEmpleado +
        saludPension.pensionEmpleado
    );
};

/**
 * Calcula la nómina completa
 * @param {Object} input - Datos de entrada de la nómina
 * @returns {Object} - Resultado completo de la nómina
 */
export const calcularNomina = (input) => {
    const {
        turnos = [],
        horaDiurna = 0,
        horaNocturna = 0,
        horaDiurnaFestiva = 0,
        horaNocturnaFestiva = 0,
        deduccionNomina = 0,
        deduccionEMI = 0,
        otrasDeducciones = 0
    } = input;
    
    // Calcular turnos
    let totalTurnos = 0;
    let totalHoras = 0;
    let contadorTurnosReales = 0;
    
    turnos.forEach(turno => {
        const { horaInicio, horaSalida, fecha, incapacidad } = turno;
        
        // Ignorar descanso
        if (horaInicio === "Descanso" && horaSalida === "Descanso") {
            totalTurnos += 0;
            return;
        }
        
        // Buscar el turno en el mapa
        const key = `${horaInicio}-${horaSalida}`;
        const turnoData = TURNOS[key];
        
        if (turnoData) {
            const valorTurno = calcularValorTurno(turnoData, fecha, incapacidad);
            totalTurnos += valorTurno;
            totalHoras += turnoData.horas;
            contadorTurnosReales++;
        }
    });
    
    // Calcular horas extras
    const totalHorasExtras = calcularHorasExtras(
        horaDiurna,
        horaNocturna,
        horaDiurnaFestiva,
        horaNocturnaFestiva
    );
    
    // Devengado sin subsidio
    const devengadoSinSubsidio = totalTurnos + totalHorasExtras;
    
    // Calcular subsidio
    const subsidioTransporte = calcularSubsidioTransporte(devengadoSinSubsidio, contadorTurnosReales);
    
    // Devengado total con subsidio
    const devengadoTotal = devengadoSinSubsidio + subsidioTransporte;
    
    // Calcular deducciones de salud y pensión
    const deduccionesSaludPension = calcularDeducciones(devengadoTotal);
    
    // Calcular deducciones adicionales
    const deduccionesAdicionales = {
        nomina: deduccionNomina,
        emi: deduccionEMI,
        otras: otrasDeducciones
    };
    
    // Total deducciones
    const totalDeducciones = calcularTotalDeducciones(deduccionesAdicionales, deduccionesSaludPension);
    
    // Neto a pagar
    const netoPagar = devengadoTotal - totalDeducciones;
    
    return {
        // Totales
        devengadoTotal,
        totalDeducciones,
        netoPagar,
        
        // Componentes
        totalTurnos,
        totalHorasExtras,
        subsidioTransporte,
        
        // Salud y pensión
        saludEmpleado: deduccionesSaludPension.saludEmpleado,
        pensionEmpleado: deduccionesSaludPension.pensionEmpleado,
        saludEmpresa: deduccionesSaludPension.saludEmpresa,
        pensionEmpresa: deduccionesSaludPension.pensionEmpresa,
        
        // Contadores
        cantidadTurnos: contadorTurnosReales,
        cantidadHoras: totalHoras
    };
};

/**
 * Versión simplificada que toma el estado directamente del store
 * y calcula el resultado
 * @param {Object} state - Estado de la aplicación
 * @returns {Object} - Resultados calculados
 */
export const calcularDesdeEstado = (state) => {
    const turnos = state.turnos || [];
    const horasExtras = state.horasExtras || {};
    const deducciones = state.deducciones || {};
    
    return calcularNomina({
        turnos,
        horaDiurna: horasExtras.diurna || 0,
        horaNocturna: horasExtras.nocturna || 0,
        horaDiurnaFestiva: horasExtras.diurnaFestiva || 0,
        horaNocturnaFestiva: horasExtras.nocturnaFestiva || 0,
        deduccionNomina: deducciones.nomina || 0,
        deduccionEMI: deducciones.emi || 0,
        otrasDeducciones: deducciones.otras || 0
    });
};