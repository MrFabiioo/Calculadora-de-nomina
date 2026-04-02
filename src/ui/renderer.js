/**
 * Módulo de Renderizado - Manipulación del DOM
 * NO calcula nada - solo renderiza lo que el store le dice
 */

import { formatearMoneda, obtenerNombreDia } from '../utils/formatters.js';
import { TURNOS, TURNOS_INICIO, TURNOS_SALIDA } from '../domain/shifts.js';
import { esFestivo, esDomingo } from '../domain/holidays.js';

// Elementos del DOM (cacheados)
let elementos = {};

/**
 * Inicializa las referencias a elementos del DOM
 */
export const inicializarElementos = () => {
    elementos = {
        // Tabla de turnos
        tbody: document.getElementById('cuerpo_tabla'),
        mostradorContador: document.getElementById('mostrador_contador'),
        
        // Horas extras
        horaDiurna: document.getElementById('hora_diurna'),
        horaNocturna: document.getElementById('hora_nocturna'),
        horaDiurnaFestiva: document.getElementById('hora_diurna_festiva'),
        horaNocturnaFestiva: document.getElementById('hora_nocturna_festiva'),
        
        // Deducciones
        deduccionesNomina: document.getElementById('deducciones_nomina'),
        deduccionesEMI: document.getElementById('deducciones_emi_familiares'),
        otrasDeducciones: document.getElementById('otras_deducciones'),
        
        // Resultados
        turnosLabel: document.getElementById('turnos_label'),
        horasLabel: document.getElementById('horas_label'),
        subsidioTransporteLabel: document.getElementById('subsidio_transporte_label'),
        totalDevengado: document.getElementById('total_devengado'),
        totalDeducciones: document.getElementById('tota_deducciones'),
        netoAPagar: document.getElementById('neto_a_pagar'),
        
        // Salud y pensión
        valorSaludEmpleado: document.getElementById('valor_salud_empleado_label'),
        valorPensionEmpleado: document.getElementById('valor_pension_empleado_label'),
        valorSaludEmpresa: document.getElementById('valor_salud_empresa_label'),
        valorPensionEmpresa: document.getElementById('valor_pension_empresa_label'),
        totalEmpleado: document.getElementById('total_empleado_label'),
        totalEmpresa: document.getElementById('total_empresa_label'),
        
        // Botones
        botonCalcular: document.getElementById('calcular'),
        botonAñadir: document.getElementById('añadir'),
        botonQuitar: document.getElementById('quitar'),
        botonTema: document.getElementById('btn_cambio_tema')
    };
};

/**
 * Renderiza una fila de turno
 * @param {number} indice - Índice de la fila
 * @returns {string} - HTML de la fila
 */
export const renderizarFilaTurno = (indice) => {
    return `
        <tr id='fila_${indice}'>
            <td>
                <label id='dia_${indice}' class='cajas' type='text'></label>
            </td>
            <td>
                <input id='fecha_${indice}' class='cajas' type='date'>
            </td>
            <td class='list-1'>
                <select id='hora_inicio_${indice}' class='opciones'>
                    ${TURNOS_INICIO.map(hora => `<option class='opciones'>${hora}</option>`).join('')}
                </select>
            </td>
            <td class='list-1'>
                <select id='hora_salida_${indice}' class='opciones'>
                    ${TURNOS_SALIDA.map(hora => `<option class='opciones'>${hora}</option>`).join('')}
                </select>
            </td>
            <td id='valor_${indice}' class='Valor'></td>
            <td id='horas_${indice}' class='Horas'></td>
            <td id='numero_${indice}' class='numero'></td>
            <td>
                <input id='incapacidad_${indice}' type='checkbox' value='incapacidad'>
            </td>
        </tr>
    `;
};

/**
 * Agrega una nueva fila de turno al DOM
 * @returns {number} - Índice de la nueva fila
 */
export const agregarFilaTurno = () => {
    const totalFilas = elementos.tbody.querySelectorAll('tr').length + 1;
    elementos.tbody.insertAdjacentHTML("beforeend", renderizarFilaTurno(totalFilas));
    
    // Asignar eventos a la nueva fila
    const fechaInput = document.getElementById(`fecha_${totalFilas}`);
    const diaLabel = document.getElementById(`dia_${totalFilas}`);
    const fila = document.getElementById(`fila_${totalFilas}`);
    
    fechaInput.addEventListener('change', () => {
        actualizarDiaYEstilo(fechaInput.value, diaLabel, fila);
    });
    
    actualizarContador();
    return totalFilas;
};

/**
 * Elimina la última fila de turno
 */
export const eliminarFilaTurno = () => {
    const filas = elementos.tbody.querySelectorAll('tr');
    if (filas.length > 0) {
        elementos.tbody.removeChild(filas[filas.length - 1]);
        actualizarContador();
    }
};

/**
 * Actualiza el contador de turnos
 */
export const actualizarContador = () => {
    elementos.mostradorContador.innerText = elementos.tbody.children.length;
};

/**
 * Actualiza el día de la semana y el estilo de la fila
 */
export const actualizarDiaYEstilo = (fecha, labelDia, fila) => {
    if (fecha) {
        const nombreDia = obtenerNombreDia(fecha);
        labelDia.innerText = nombreDia;
        
        const esDiaEspecial = nombreDia === "Domingo" || esFestivo(fecha);
        
        if (fila) {
            if (esDiaEspecial) {
                fila.style.boxShadow = "10px 5px 10px 5px rgba(0, 0, 0, 0.7)";
                fila.style.transform = "scale(1.04)";
            } else {
                fila.style.boxShadow = "";
                fila.style.transform = "";
            }
        }
    } else {
        labelDia.innerText = "";
        if (fila) {
            fila.style.boxShadow = "";
            fila.style.transform = "";
        }
    }
};

/**
 * Actualiza un valor en la tabla
 */
export const actualizarCeldaTurno = (indice, tipo, valor) => {
    const celda = document.getElementById(`${tipo}_${indice}`);
    if (celda) {
        celda.innerText = valor;
    }
};

/**
 * Renderiza los resultados de la nómina
 * @param {Object} resultados - Resultados calculados
 */
export const renderizarResultados = (resultados) => {
    if (!resultados) return;
    
    // Actualizar contadores
    if (elementos.turnosLabel) {
        elementos.turnosLabel.innerText = resultados.cantidadTurnos || 0;
    }
    if (elementos.horasLabel) {
        elementos.horasLabel.innerText = resultados.cantidadHoras || 0;
    }
    
    // Subsidio de transporte
    if (elementos.subsidioTransporteLabel) {
        elementos.subsidioTransporteLabel.innerText = formatearMoneda(resultados.subsidioTransporte);
    }
    
    // Total devengado
    if (elementos.totalDevengado) {
        elementos.totalDevengado.innerText = formatearMoneda(resultados.devengadoTotal);
    }
    
    // Total deducciones
    if (elementos.totalDeducciones) {
        elementos.totalDeducciones.innerText = formatearMoneda(resultados.totalDeducciones);
    }
    
    // Neto a pagar
    if (elementos.netoAPagar) {
        elementos.netoAPagar.innerText = formatearMoneda(resultados.netoPagar);
    }
    
    // Salud y pensión empleado
    if (elementos.valorSaludEmpleado) {
        elementos.valorSaludEmpleado.innerText = formatearMoneda(resultados.saludEmpleado);
    }
    if (elementos.valorPensionEmpleado) {
        elementos.valorPensionEmpleado.innerText = formatearMoneda(resultados.pensionEmpleado);
    }
    
    // Total empleado
    if (elementos.totalEmpleado) {
        const total = (resultados.saludEmpleado || 0) + (resultados.pensionEmpleado || 0);
        elementos.totalEmpleado.innerText = formatearMoneda(total);
    }
    
    // Salud y pensión empresa
    if (elementos.valorSaludEmpresa) {
        elementos.valorSaludEmpresa.innerText = formatearMoneda(resultados.saludEmpresa);
    }
    if (elementos.valorPensionEmpresa) {
        elementos.valorPensionEmpresa.innerText = formatearMoneda(resultados.pensionEmpresa);
    }
    
    // Total empresa
    if (elementos.totalEmpresa) {
        const total = (resultados.saludEmpresa || 0) + (resultados.pensionEmpresa || 0);
        elementos.totalEmpresa.innerText = formatearMoneda(total);
    }
};

/**
 * Muestra un error en un campo
 */
export const mostrarErrorInput = (inputId, mensaje) => {
    const input = document.getElementById(inputId);
    if (input) {
        input.style.borderColor = 'red';
        input.style.borderWidth = '2px';
        // Guardar el mensaje para mostrarlo
        input.setAttribute('data-error', mensaje);
    }
};

/**
 * Limpia el error de un input
 */
export const limpiarErrorInput = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
        input.style.borderColor = '';
        input.style.borderWidth = '';
        input.removeAttribute('data-error');
    }
};

/**
 * Alterna el tema dark/light
 */
export const alternarTema = () => {
    document.body.classList.toggle('dark-theme');
};

/**
 * Limpia todos los turnos del DOM
 */
export const limpiarTurnos = () => {
    elementos.tbody.innerHTML = '';
    actualizarContador();
};

/**
 * Obtiene los valores actuales de horas extras desde el DOM
 */
export const obtenerHorasExtrasDOM = () => {
    return {
        diurna: parseFloat(elementos.horaDiurna?.value) || 0,
        nocturna: parseFloat(elementos.horaNocturna?.value) || 0,
        diurnaFestiva: parseFloat(elementos.horaDiurnaFestiva?.value) || 0,
        nocturnaFestiva: parseFloat(elementos.horaNocturnaFestiva?.value) || 0
    };
};

/**
 * Obtiene los valores actuales de deducciones desde el DOM
 */
export const obtenerDeduccionesDOM = () => {
    return {
        nomina: parseFloat(elementos.deduccionesNomina?.value) || 0,
        emi: parseFloat(elementos.deduccionesEMI?.value) || 0,
        otras: parseFloat(elementos.otrasDeducciones?.value) || 0
    };
};