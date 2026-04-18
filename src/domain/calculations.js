/**
 * Módulo de cálculos - Funciones puras para el cálculo de nómina
 * NO toca el DOM - solo lógica de negocio
 */

import { TARIFAS_HORA } from './shifts.js';
import { liquidarTurnoPorTramos } from './payroll-breakdown.js';

// Constantes para deducciones
// 66.67% según normativa laboral colombiana (Art. 227 CST): incapacidad se paga a 2/3 del salario
const DESCUENTO_INCAPACIDAD = 2 / 3;
const TARIFA_SALUD_EMPLEADO = 0.04; // 4%
const TARIFA_SALUD_EMPRESA = 0.085;  // 8.5%
const TARIFA_PENSION_EMPLEADO = 0.04; // 4%
const TARIFA_PENSION_EMPRESA = 0.12;  // 12%
const SUBSIDIO_TRANSPORTE_MAXIMO = 249095;
const LIMITE_SUBSIDIO = 1750905*2; // Si el devengado supera este límite, no aplica subsidy

/**
 * Calcula el subsidy de transporte
 * @param {number} devengadoTotal - Total devengado sin subsidy
 * @param {number} cantidadTurnos - Cantidad de turnos trabajados
 * @returns {number} - Valor del subsidy
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
        deduccionNomina = 0,
        deduccionEMI = 0,
        otrasDeducciones = 0
    } = input;
    
    // Calcular turnos con pipeline segmentado
    let totalTurnos = 0;
    let totalHoras = 0;
    let contadorTurnosReales = 0;
    let diasDescanso = 0;
    let turnosLiquidados = [];
    
    const turnosLiquidadosRaw = [];
    
    turnos.forEach(turno => {
        const { horaInicio, horaSalida } = turno;
        
        // Contar días de descanso
        if (horaInicio === "Descanso" && horaSalida === "Descanso") {
            diasDescanso++;
            return;
        }
        
        // Ignorar descanso
        if (horaInicio === "Descanso" && horaSalida === "Descanso") {
            return;
        }
        
        // Usar pipeline segmentado (usa defaults de payroll-breakdown.js)
        const resultado = liquidarTurnoPorTramos(turno);
        
        if (resultado) {
            // Agregar al total
            totalTurnos += resultado.total;
            totalHoras += resultado.horas;
            contadorTurnosReales++;
            
            // Guardar breakdown para auditoría/UI
            turnosLiquidadosRaw.push({
                turno: { ...turno },
                liquidacion: resultado
            });
        }
    });
    
    // Guardar turnos liquidados
    turnosLiquidados = turnosLiquidadosRaw;
    
    // Calcular subsidio — los días de descanso también cuentan para el auxilio
    const subsidioTransporte = calcularSubsidioTransporte(totalTurnos, contadorTurnosReales + diasDescanso);
    
    // Devengado total con subsidio (para nómina del empleado)
    const devengadoTotal = totalTurnos + subsidioTransporte;
    
    // Base para deducciones de seguridad social: NO incluye subsidio de transporte
    // Según normativa colombiana, el auxilio de transporte NO es salario para efectos de SS
    const baseDeducciones = totalTurnos;
    
    // Calcular deducciones de salud y pensión sobre la base correcta
    const deduccionesSaludPension = calcularDeducciones(baseDeducciones);
    
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
    
    const resultado = {
        // Totales
        devengadoTotal,
        totalDeducciones,
        netoPagar,
        
        // Componentes
        totalTurnos,
        subsidioTransporte,
        
        // Salud y pensión
        saludEmpleado: deduccionesSaludPension.saludEmpleado,
        pensionEmpleado: deduccionesSaludPension.pensionEmpleado,
        saludEmpresa: deduccionesSaludPension.saludEmpresa,
        pensionEmpresa: deduccionesSaludPension.pensionEmpresa,
        
        // Contadores
        cantidadTurnos: contadorTurnosReales,
        cantidadHoras: totalHoras,
        diasDescanso
    };
    
    // Agregar turnosLiquidados para auditoría/UI
    if (turnosLiquidados.length > 0) {
        resultado.turnosLiquidados = turnosLiquidados;
    }
    
    return resultado;
};