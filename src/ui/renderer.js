/**
 * Módulo de Renderizado - Manipulación del DOM
 * NO calcula nada - solo renderiza lo que el store le dice
 * 
 * ACTUALIZADO para Fase 3: Nuevos IDs del HTML semántico
 * ACTUALIZADO para Fase 5: Soporte para breakdown por tramo en dataset de fila
 */

import { formatearMoneda, obtenerNombreDia } from '../utils/formatters.js';
import { TURNOS_INICIO, TURNOS_SALIDA } from '../domain/shifts.js';
import { esFestivo, esDomingo } from '../domain/holidays.js';

// Elementos del DOM (cacheados)
let elementos = {};

/**
 * Inicializa las referencias a elementos del DOM (nuevos IDs de Fase 3)
 */
export const inicializarElementos = () => {
    elementos = {
        // Tabla de turnos - NUEVOS IDs
        tbody: document.getElementById('turnos-body'),
        mostradorContador: document.getElementById('turno-contador'),
        emptyState: document.getElementById('empty-state'),
        
        // Deducciones - NUEVOS IDs (con guiones)
        deduccionesNomina: document.getElementById('deduccion-nomina'),
        deduccionesEMI: document.getElementById('deduccion-emi'),
        otrasDeducciones: document.getElementById('otras-deducciones'),
        
        // Resultados - NUEVOS IDs
        turnosLabel: document.getElementById('turnos-count'),
        horasLabel: document.getElementById('horas-count'),
        subsidioTransporteLabel: document.getElementById('subsidio-transporte'),
        subsidioTransportePanel: document.getElementById('subsidio-transporte-panel'),
        totalDevengado: document.getElementById('total-devengado'),
        totalDeducciones: document.getElementById('total-deducciones'),
        netoAPagar: document.getElementById('neto-a-pagar'),
        
        // Salud y pensión - NUEVOS IDs de la tabla
        valorSaludEmpleado: document.getElementById('salud-empleado'),
        valorPensionEmpleado: document.getElementById('pension-empleado'),
        valorSaludEmpresa: document.getElementById('salud-empresa'),
        valorPensionEmpresa: document.getElementById('pension-empresa'),
        totalEmpleado: document.getElementById('total-empleado'),
        totalEmpresa: document.getElementById('total-empresa'),
        
        // Botones - NUEVOS IDs
        botonCalcular: null,
        botonAñadir: document.getElementById('btn-agregar'),
        botonQuitar: document.getElementById('btn-quitar'),
        botonTema: document.getElementById('theme-toggle')
    };
};

/**
 * Renderiza una fila de turno
 * @param {number} indice - Índice de la fila
 * @returns {string} - HTML de la fila
 */
export const renderizarFilaTurno = (indice) => {
    return `
        <tr id='fila_${indice}' class='turno-row'>
            <td data-label='Día'>
                <label id='dia_${indice}' class='cajas'></label>
            </td>
            <td data-label='Fecha'>
                <input id='fecha_${indice}' class='cajas' type='date'>
            </td>
            <td class='list-1' data-label='Inicio'>
                <select id='hora_inicio_${indice}' class='opciones'>
                    ${TURNOS_INICIO.map(hora => `<option class='opciones'>${hora}</option>`).join('')}
                </select>
            </td>
            <td class='list-1' data-label='Salida'>
                <select id='hora_salida_${indice}' class='opciones'>
                    ${TURNOS_SALIDA.map(hora => `<option class='opciones'>${hora}</option>`).join('')}
                </select>
            </td>
            <td id='valor_${indice}' class='Valor' data-label='Valor'></td>
            <td id='horas_${indice}' class='Horas' data-label='Horas'></td>
            <td id='numero_${indice}' class='numero' data-label='#'></td>
            <td data-label='Inc.'>
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
    
    // Gestionar estado vacío con clase para animación suave
    if (elementos.emptyState) {
        if (elementos.tbody.children.length === 0) {
            elementos.emptyState.classList.remove('hidden');
        } else {
            elementos.emptyState.classList.add('hidden');
        }
    }
};

/**
 * Actualiza el día de la semana y el estilo de la fila
 * 
 * MEJORADO (Task 5.2): Ahora usa el breakdown del dataset de la fila para determinar
 * el tipo de turno. Esto alinea la UI con el motor segmentado - si un tramo es festivo,
 * la fila se muestra como festiva.
 */
export const actualizarDiaYEstilo = (fecha, labelDia, fila) => {
    if (fecha) {
        const nombreDia = obtenerNombreDia(fecha);
        
        // ============================================
        // Task 5.2: Intentar leer breakdown del dataset de la fila
        // ============================================
        let esDom = false;
        let esFest = false;
        
        if (fila && fila.dataset.breakdown) {
            try {
                const breakdown = JSON.parse(fila.dataset.breakdown);
                // Analizar segmentos para determinar tipo de turno
                // Si CUALQUIER segmento es festivo/domingo, el turno se marca como tal
                breakdown.forEach(seg => {
                    if (seg.categoria?.includes('festivo')) {
                        esFest = true;
                    }
                    if (seg.categoria?.includes('festivo') && seg.categoria?.includes('noche')) {
                        esDom = true; // Domingo también cuenta como festivo
                    }
                });
            } catch (e) {
                // Fallback si no se puede parsear
                esDom = esDomingo(fecha);
                esFest = esFestivo(fecha);
            }
        } else {
            // Fallback legacy: usar fecha directamente
            esDom = esDomingo(fecha);
            esFest = esFestivo(fecha);
        }
        
        // Determinar tipo de turno para el borde interno
        const tipoTurno = esDom && esFest ? 'domingo-festivo' 
                        : esDom ? 'domingo' 
                        : esFest ? 'festivo' 
                        : '';
        
        if (fila) {
            // Limpiar clases anteriores
            fila.classList.remove('turno--domingo', 'turno--festivo', 'turno--domingo-festivo');
            
            // Aplicar clases semánticas para el borde lateral (en la fila)
            if (esDom && esFest) {
                fila.classList.add('turno--domingo-festivo');
            } else if (esDom) {
                fila.classList.add('turno--domingo');
            } else if (esFest) {
                fila.classList.add('turno--festivo');
            }
            
            // Ahora actualizar la celda del día con estructura vertical interna
            const celdaDia = fila.querySelector('td:first-child');
            if (celdaDia) {
                // Limpiar clases de estado anteriores en la celda
                celdaDia.classList.remove('turno-dia--domingo', 'turno-dia--festivo', 'turno-dia--domingo-festivo');
                
                if (tipoTurno) {
                    // Agregar clase de estado para el borde interno
                    celdaDia.classList.add(`turno-dia--${tipoTurno}`);
                    
                    // Crear estructura: contenedor día con nombre + subtítulo
                    labelDia.innerHTML = `
                        <span class="turno-dia__nombre">${nombreDia}</span>
                        <span class="turno-dia__estado turno-dia__estado--${tipoTurno}">${esDom && esFest ? 'Domingo + Festivo' : esDom ? 'Domingo' : 'Festivo'}</span>
                    `;
                } else {
                    // Solo día normal, sin subtítulo
                    labelDia.innerHTML = `<span class="turno-dia__nombre">${nombreDia}</span>`;
                }
            } else {
                labelDia.innerText = nombreDia;
            }
        } else {
            labelDia.innerText = nombreDia;
        }
    } else {
        labelDia.innerText = "";
        if (fila) {
            fila.classList.remove('turno--domingo', 'turno--festivo', 'turno--domingo-festivo');
            const celdaDia = fila.querySelector('td:first-child');
            if (celdaDia) {
                celdaDia.classList.remove('turno-dia--domingo', 'turno-dia--festivo', 'turno-dia--domingo-festivo');
            }
        }
    }
};

/**
 * Obtiene el detalle de breakdown por tramos de una fila (para posibles tooltips/modal)
 * @param {number} indice - Índice de la fila
 * @returns {Array|null} - Array de segmentos o null si no hay breakdown
 */
export const obtenerBreakdownFila = (indice) => {
    const fila = document.getElementById(`fila_${indice}`);
    if (fila && fila.dataset.breakdown) {
        try {
            return JSON.parse(fila.dataset.breakdown);
        } catch (e) {
            return null;
        }
    }
    return null;
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
    if (elementos.subsidioTransportePanel) {
        elementos.subsidioTransportePanel.innerText = formatearMoneda(resultados.subsidioTransporte);
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
 * Alterna el tema dark/light usando data-theme
 */
export const alternarTema = () => {
    const html = document.documentElement;
    const actual = html.getAttribute('data-theme');
    const nuevo = actual === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', nuevo);
};

/**
 * Limpia todos los turnos del DOM
 */
export const limpiarTurnos = () => {
    elementos.tbody.innerHTML = '';
    actualizarContador();
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