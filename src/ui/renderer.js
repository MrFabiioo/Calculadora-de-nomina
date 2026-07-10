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

const SEGMENT_ROW_CONFIG = {
    ordDiu: { prefix: 'segment-ord-diu', category: 'ordinario-dia' },
    ordNoc: { prefix: 'segment-ord-noc', category: 'ordinario-noche' },
    fesDiu: { prefix: 'segment-fes-diu', category: 'festivo-dia' },
    fesNoc: { prefix: 'segment-fes-noc', category: 'festivo-noche' },
    ordDiuExc: { prefix: 'segment-ord-diu-exc' },
    ordNocExc: { prefix: 'segment-ord-noc-exc' },
    fesDiuExc: { prefix: 'segment-fes-diu-exc' },
    fesNocExc: { prefix: 'segment-fes-noc-exc' }
};

const formatearHora = (valor) => `${(valor || 0).toFixed(2)} h`;

const actualizarTexto = (elemento, valor) => {
    if (elemento) {
        elemento.innerText = valor;
    }
};

const crearSegmentoVacio = () => ({ horas: 0, valor: 0 });

const agregarSegmentosTurnos = (turnosLiquidados = []) => {
    const acumulado = {
        'ordinario-dia': crearSegmentoVacio(),
        'ordinario-noche': crearSegmentoVacio(),
        'festivo-dia': crearSegmentoVacio(),
        'festivo-noche': crearSegmentoVacio()
    };

    turnosLiquidados.forEach((item) => {
        item?.liquidacion?.breakdown?.forEach((segmento) => {
            const categoria = segmento?.categoria;

            if (!acumulado[categoria]) {
                return;
            }

            acumulado[categoria].horas += (segmento.minutos || 0) / 60;
            acumulado[categoria].valor += segmento.valor || 0;
        });
    });

    return acumulado;
};

const actualizarFilaConcepto = (fila, valores = {}) => {
    if (!fila) {
        return;
    }

    const valorMoneda = (campo) => Object.hasOwn(valores, campo) ? formatearMoneda(valores[campo] || 0) : '';

    actualizarTexto(fila.devengado, valorMoneda('devengado'));
    actualizarTexto(fila.deduccion, valorMoneda('deduccion'));
    actualizarTexto(fila.base, valorMoneda('base'));
    actualizarTexto(fila.saldo, valorMoneda('saldo'));
    actualizarTexto(
        fila.horas,
        Object.hasOwn(valores, 'horasTexto')
            ? valores.horasTexto
            : Object.hasOwn(valores, 'horas')
                ? formatearHora(valores.horas || 0)
                : ''
    );
};

/**
 * Inicializa las referencias a elementos del DOM (nuevos IDs de Fase 3)
 */
export const inicializarElementos = () => {
    const segmentos = Object.fromEntries(
        Object.entries(SEGMENT_ROW_CONFIG).map(([clave, config]) => ([
            clave,
            {
                devengado: document.getElementById(`${config.prefix}-devengado`),
                deduccion: document.getElementById(`${config.prefix}-deduccion`),
                base: document.getElementById(`${config.prefix}-base`),
                saldo: document.getElementById(`${config.prefix}-saldo`),
                horas: document.getElementById(`${config.prefix}-horas`)
            }
        ]))
    );

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
        segmentos,
        subsidioTransporteLabel: document.getElementById('subsidio-transporte'),
        subsidioTransportePanel: document.getElementById('subsidio-transporte-panel'),
        subsidioTransporteDeduccion: document.getElementById('subsidio-transporte-deduccion'),
        subsidioTransporteHours: document.getElementById('subsidio-transporte-hours'),
        ptsExcessDiagnosticTotal: document.getElementById('pts-excess-diagnostic-total'),
        ptsExcessDiagnosticHours: document.getElementById('pts-excess-diagnostic-hours'),
        ptsExcessDiagnosticThreshold: document.getElementById('pts-excess-diagnostic-threshold'),
        ptsExcessDiagnosticPeriods: document.getElementById('pts-excess-diagnostic-periods'),
        totalDevengado: document.getElementById('total-devengado'),
        totalDeducciones: document.getElementById('total-deducciones'),
        netoAPagar: document.getElementById('neto-a-pagar'),
        payslipTotalDevengado: document.getElementById('payslip-total-devengado'),
        payslipTotalDeducciones: document.getElementById('payslip-total-deducciones'),
        payslipNetoAPagar: document.getElementById('payslip-neto-a-pagar'),
        payslipSaldoACargo: document.getElementById('payslip-saldo-a-cargo'),
        saldoACargo: document.getElementById('saldo-a-cargo'),
        payslipSubsidyBase: document.getElementById('payslip-subsidy-base'),
        payslipSubsidyBalance: document.getElementById('payslip-subsidy-balance'),
        payslipSaludDeduction: document.getElementById('payslip-salud-deduction'),
        payslipSaludBase: document.getElementById('payslip-salud-base'),
        payslipSaludBalance: document.getElementById('payslip-salud-balance'),
        payslipPensionDeduction: document.getElementById('payslip-pension-deduction'),
        payslipPensionBase: document.getElementById('payslip-pension-base'),
        payslipPensionBalance: document.getElementById('payslip-pension-balance'),
        payslipDeduccionNomina: document.getElementById('payslip-deduccion-nomina'),
        payslipDeduccionNominaBalance: document.getElementById('payslip-deduccion-nomina-balance'),
        payslipDeduccionEmi: document.getElementById('payslip-deduccion-emi'),
        payslipDeduccionEmiBalance: document.getElementById('payslip-deduccion-emi-balance'),
        payslipOtrasDeducciones: document.getElementById('payslip-otras-deducciones'),
        payslipOtrasDeduccionesBalance: document.getElementById('payslip-otras-deducciones-balance'),
        
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

export const obtenerCantidadFilasTurno = () => {
    return elementos.tbody?.querySelectorAll('tr').length || 0;
};

export const asegurarCantidadFilasTurno = (cantidadObjetivo) => {
    while (obtenerCantidadFilasTurno() < cantidadObjetivo) {
        agregarFilaTurno();
    }

    return obtenerCantidadFilasTurno();
};

export const aplicarFechaEnFila = (indice, fecha) => {
    const fechaInput = document.getElementById(`fecha_${indice}`);
    const diaLabel = document.getElementById(`dia_${indice}`);
    const fila = document.getElementById(`fila_${indice}`);

    if (!fechaInput || !diaLabel || !fila) {
        return false;
    }

    fechaInput.value = fecha;
    actualizarDiaYEstilo(fecha, diaLabel, fila);
    return true;
};

export const obtenerFechaEnFila = (indice) => {
    return document.getElementById(`fecha_${indice}`)?.value || '';
};

export const aplicarHorasEnFila = (indice, horaInicio, horaSalida) => {
    const horaInicioSelect = document.getElementById(`hora_inicio_${indice}`);
    const horaSalidaSelect = document.getElementById(`hora_salida_${indice}`);

    if (!horaInicioSelect || !horaSalidaSelect) {
        return false;
    }

    horaInicioSelect.value = horaInicio;
    horaSalidaSelect.value = horaSalida;
    return true;
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

    const deduccionesActuales = obtenerDeduccionesDOM();
    const baseDeducciones = resultados.baseDeducciones || 0;
    const totalDevengado = resultados.devengadoTotal || 0;
    const totalDeducciones = resultados.totalDeducciones || 0;
    const netoPagar = resultados.netoPagar || 0;
    const segmentosBase = agregarSegmentosTurnos(resultados.turnosLiquidados);
    const festivoExtra = resultados.festiveExtraSummary || {};
    const resumenExc = resultados.premiumTriweeklySummary || {};
    
    // Actualizar contadores
    actualizarTexto(elementos.turnosLabel, resultados.cantidadTurnos || 0);
    actualizarTexto(elementos.horasLabel, resultados.cantidadHoras || 0);

    actualizarFilaConcepto(elementos.segmentos.ordDiu, {
        devengado: segmentosBase['ordinario-dia'].valor,
        horas: segmentosBase['ordinario-dia'].horas
    });
    actualizarFilaConcepto(elementos.segmentos.ordNoc, {
        devengado: segmentosBase['ordinario-noche'].valor,
        horas: segmentosBase['ordinario-noche'].horas
    });
    actualizarFilaConcepto(elementos.segmentos.fesDiu, {
        devengado: segmentosBase['festivo-dia'].valor,
        horas: segmentosBase['festivo-dia'].horas
    });
    actualizarFilaConcepto(elementos.segmentos.fesNoc, {
        devengado: segmentosBase['festivo-noche'].valor,
        horas: segmentosBase['festivo-noche'].horas
    });
    actualizarFilaConcepto(elementos.segmentos.ordDiuExc, {
        devengado: resumenExc.dayPremiumValue || 0,
        horas: resumenExc.dayExcessHours || 0
    });
    actualizarFilaConcepto(elementos.segmentos.ordNocExc, {
        devengado: resumenExc.nightPremiumValue || 0,
        horas: resumenExc.nightExcessHours || 0
    });
    actualizarFilaConcepto(elementos.segmentos.fesDiuExc, {
        devengado: festivoExtra.dayValue || 0,
        horas: festivoExtra.dayHours || 0
    });
    actualizarFilaConcepto(elementos.segmentos.fesNocExc, {
        devengado: festivoExtra.nightValue || 0,
        horas: festivoExtra.nightHours || 0
    });
    
    // Subsidio de transporte
    actualizarTexto(elementos.subsidioTransporteLabel, formatearMoneda(resultados.subsidioTransporte));
    actualizarTexto(elementos.subsidioTransportePanel, formatearMoneda(resultados.subsidioTransporte));
    actualizarTexto(elementos.subsidioTransporteDeduccion, '');
    actualizarTexto(elementos.subsidioTransporteHours, '');
    actualizarTexto(elementos.payslipSubsidyBase, formatearMoneda(resultados.subsidioTransporte || 0));
    actualizarTexto(elementos.payslipSubsidyBalance, '');

    actualizarTexto(elementos.ptsExcessDiagnosticTotal, formatearMoneda(resultados.ptsExcessExperimentalTotal || 0));
    actualizarTexto(elementos.ptsExcessDiagnosticHours, formatearHora(resultados.ptsExcessExperimentalSummary?.excessHours || 0));
    actualizarTexto(elementos.ptsExcessDiagnosticThreshold, formatearHora(resultados.ptsExcessExperimentalSummary?.thresholdHours || 0));
    actualizarTexto(elementos.ptsExcessDiagnosticPeriods, resultados.ptsExcessExperimentalSummary?.periodsCount || 0);
    
    // Total devengado
    actualizarTexto(elementos.totalDevengado, formatearMoneda(totalDevengado));
    actualizarTexto(elementos.payslipTotalDevengado, formatearMoneda(totalDevengado));
    
    // Total deducciones
    actualizarTexto(elementos.totalDeducciones, formatearMoneda(totalDeducciones));
    actualizarTexto(elementos.payslipTotalDeducciones, formatearMoneda(totalDeducciones));
    
    // Neto a pagar
    actualizarTexto(elementos.netoAPagar, formatearMoneda(netoPagar));
    actualizarTexto(elementos.payslipNetoAPagar, formatearMoneda(netoPagar));
    actualizarTexto(elementos.saldoACargo, formatearMoneda(0));
    actualizarTexto(elementos.payslipSaldoACargo, formatearMoneda(0));
    
    // Salud y pensión empleado
    actualizarTexto(elementos.valorSaludEmpleado, formatearMoneda(resultados.saludEmpleado));
    actualizarTexto(elementos.valorPensionEmpleado, formatearMoneda(resultados.pensionEmpleado));
    actualizarTexto(elementos.payslipSaludDeduction, formatearMoneda(resultados.saludEmpleado || 0));
    actualizarTexto(elementos.payslipSaludBase, formatearMoneda(baseDeducciones));
    actualizarTexto(elementos.payslipSaludBalance, '');
    actualizarTexto(elementos.payslipPensionDeduction, formatearMoneda(resultados.pensionEmpleado || 0));
    actualizarTexto(elementos.payslipPensionBase, formatearMoneda(baseDeducciones));
    actualizarTexto(elementos.payslipPensionBalance, '');
    actualizarTexto(elementos.payslipDeduccionNomina, formatearMoneda(deduccionesActuales.nomina || 0));
    actualizarTexto(elementos.payslipDeduccionNominaBalance, '');
    actualizarTexto(elementos.payslipDeduccionEmi, formatearMoneda(deduccionesActuales.emi || 0));
    actualizarTexto(elementos.payslipDeduccionEmiBalance, '');
    actualizarTexto(elementos.payslipOtrasDeducciones, formatearMoneda(deduccionesActuales.otras || 0));
    actualizarTexto(elementos.payslipOtrasDeduccionesBalance, '');
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
