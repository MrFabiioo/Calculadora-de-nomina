/**
 * Entry Point - Calculadora de Nómina Colombiana
 * Orchestrates la aplicación, conecta eventos con lógica de negocio
 * 
 * IMPORTANTE: Este archivo usa ES modules. Para desarrollo local,
 * usa un servidor como Live Server (VS Code) o `python -m http.server`
 * Los ES modules no funcionan con file:// en algunos navegadores por CORS
 */

import { store, getState, setState } from './src/state/store.js';
import { calcularTurno } from './src/domain/shifts.js';
import { calcularValorTurno, calcularNomina } from './src/domain/calculations.js';
import { validarNumeroPositivo } from './src/utils/validators.js';
import { formatearMoneda } from './src/utils/formatters.js';
import * as renderer from './src/ui/renderer.js';

// Elementos del DOM
let elementos = {};

/**
 * Inicializa las referencias a elementos del DOM (nuevos IDs de Fase 3)
 */
const inicializarElementos = () => {
    elementos = {
        // Tabla de turnos - NUEVOS IDs del HTML
        tbody: document.getElementById('turnos-body'),
        mostradorContador: document.getElementById('turno-contador'),
        
        // Horas extras - NUEVOS IDs (con guiones)
        horaDiurna: document.getElementById('hora-diurna'),
        horaNocturna: document.getElementById('hora-nocturna'),
        horaDiurnaFestiva: document.getElementById('hora-diurna-festiva'),
        horaNocturnaFestiva: document.getElementById('hora-nocturna-festiva'),
        
        // Deducciones - NUEVOS IDs (con guiones)
        deduccionesNomina: document.getElementById('deduccion-nomina'),
        deduccionesEMI: document.getElementById('deduccion-emi'),
        otrasDeducciones: document.getElementById('otras-deducciones'),
        
        // Resultados - NUEVOS IDs del sticky summary y section
        turnosLabel: document.getElementById('turnos-count'),
        horasLabel: document.getElementById('horas-count'),
        subsidioTransporteLabel: document.getElementById('subsidio-transporte'),
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
        botonCalcular: null, // Ya no hay botón calcular en Fase 3
        botonAñadir: document.getElementById('btn-agregar'),
        botonQuitar: document.getElementById('btn-quitar'),
        botonTema: document.getElementById('theme-toggle')
    };
};

/**
 * Lee el estado actual de los turnos desde el DOM
 * @returns {Array} - Array de turnos
 */
const obtenerTurnosDelDOM = () => {
    const filas = elementos.tbody.querySelectorAll('tr');
    const turnos = [];
    
    filas.forEach((fila, index) => {
        const i = index + 1;
        const horaInicio = document.getElementById(`hora_inicio_${i}`)?.value;
        const horaSalida = document.getElementById(`hora_salida_${i}`)?.value;
        const fecha = document.getElementById(`fecha_${i}`)?.value;
        const incapacidad = document.getElementById(`incapacidad_${i}`)?.checked;
        
        if (horaInicio && horaSalida) {
            turnos.push({
                horaInicio,
                horaSalida,
                fecha,
                incapacidad
            });
        }
    });
    
    return turnos;
};

/**
 * Lee las horas extras desde el DOM
 */
const obtenerHorasExtrasDelDOM = () => ({
    diurna: parseFloat(elementos.horaDiurna?.value) || 0,
    nocturna: parseFloat(elementos.horaNocturna?.value) || 0,
    diurnaFestiva: parseFloat(elementos.horaDiurnaFestiva?.value) || 0,
    nocturnaFestiva: parseFloat(elementos.horaNocturnaFestiva?.value) || 0
});

/**
 * Lee las deducciones desde el DOM
 */
const obtenerDeduccionesDelDOM = () => ({
    nomina: parseFloat(elementos.deduccionesNomina?.value) || 0,
    emi: parseFloat(elementos.deduccionesEMI?.value) || 0,
    otras: parseFloat(elementos.otrasDeducciones?.value) || 0
});

/**
 * Calcula la nómina completa.
 * Flujo: lee DOM → delega cálculo a calculations.js → renderiza con renderer.js → persiste en store.
 */
const calcularNominaCompleta = () => {
    const turnos = obtenerTurnosDelDOM();
    const horasExtras = obtenerHorasExtrasDelDOM();
    const deducciones = obtenerDeduccionesDelDOM();

    // Actualizar estilos de filas de descanso (responsabilidad visual que queda en index)
    turnos.forEach((turno, index) => {
        const fila = document.getElementById(`fila_${index + 1}`);
        if (turno.horaInicio === "Descanso" && turno.horaSalida === "Descanso") {
            if (fila) fila.style.opacity = "0.4";
        } else {
            if (fila) fila.style.opacity = "";
        }
    });

    // Delegar todo el cálculo a la función pura de calculations.js
    const resultados = calcularNomina({
        turnos,
        horaDiurna: horasExtras.diurna,
        horaNocturna: horasExtras.nocturna,
        horaDiurnaFestiva: horasExtras.diurnaFestiva,
        horaNocturnaFestiva: horasExtras.nocturnaFestiva,
        deduccionNomina: deducciones.nomina,
        deduccionEMI: deducciones.emi,
        otrasDeducciones: deducciones.otras
    });

    // Actualizar celdas individuales de la tabla de turnos (valor + horas por fila)
    // renderer no tiene esta granularidad, así que lo hacemos aquí
    let contadorTurnosUI = 0;
    turnos.forEach((turno, index) => {
        const i = index + 1;
        const turnoData = calcularTurno(turno.horaInicio, turno.horaSalida);

        if (turnoData && turnoData.horas > 0) {
            const valorTurno = calcularValorTurno(turnoData, turno.fecha, turno.incapacidad);

            const celdaValor = document.getElementById(`valor_${i}`);
            if (celdaValor) celdaValor.innerText = formatearMoneda(valorTurno);

            const celdaHoras = document.getElementById(`horas_${i}`);
            if (celdaHoras) celdaHoras.innerText = turnoData.horas;

            contadorTurnosUI++;
            const celdaNumero = document.getElementById(`numero_${i}`);
            if (celdaNumero) celdaNumero.innerText = contadorTurnosUI;
        } else {
            // Limpiar celdas de filas de descanso o sin turno
            const celdaValor = document.getElementById(`valor_${i}`);
            if (celdaValor) celdaValor.innerText = '';
            const celdaHoras = document.getElementById(`horas_${i}`);
            if (celdaHoras) celdaHoras.innerText = '';
            const celdaNumero = document.getElementById(`numero_${i}`);
            if (celdaNumero) celdaNumero.innerText = '';
        }
    });

    // Delegar el render de resultados al renderer
    renderer.renderizarResultados(resultados);

    // Persistir en el store: inputs del usuario + resultados calculados
    setState({
        turnos,
        horasExtras,
        deducciones,
        resultados: {
            devengadoTotal: resultados.devengadoTotal,
            totalDeducciones: resultados.totalDeducciones,
            netoPagar: resultados.netoPagar,
            subsidioTransporte: resultados.subsidioTransporte,
            saludEmpleado: resultados.saludEmpleado,
            pensionEmpleado: resultados.pensionEmpleado,
            saludEmpresa: resultados.saludEmpresa,
            pensionEmpresa: resultados.pensionEmpresa,
            cantidadTurnos: resultados.cantidadTurnos,
            cantidadHoras: resultados.cantidadHoras
        }
    });

    return resultados;
};

/**
 * Event handlers
 */

// Validación de inputs con feedback visual (TASK-22)
const setupValidaciones = () => {
    const inputs = [
        { id: 'deduccion-nomina', key: 'nomina' },
        { id: 'deduccion-emi', key: 'emi' },
        { id: 'otras-deducciones', key: 'otras' },
        { id: 'hora-diurna', key: 'diurna' },
        { id: 'hora-nocturna', key: 'nocturna' },
        { id: 'hora-diurna-festiva', key: 'diurnaFestiva' },
        { id: 'hora-nocturna-festiva', key: 'nocturnaFestiva' }
    ];
    
    inputs.forEach(({ id, key }) => {
        const input = document.getElementById(id);
        if (input) {
            // Feedback visual en tiempo real (input)
            input.addEventListener('input', () => {
                const resultado = validarNumeroPositivo(input.value);
                const errorSpan = input.parentElement?.querySelector('.input-group__error');
                
                if (!resultado.valid && input.value) {
                    input.classList.add('input-group__input--invalid');
                    input.classList.remove('input-group__input--valid');
                    if (errorSpan) errorSpan.textContent = resultado.message;
                } else if (input.value) {
                    input.classList.add('input-group__input--valid');
                    input.classList.remove('input-group__input--invalid');
                    if (errorSpan) errorSpan.textContent = '';
                } else {
                    input.classList.remove('input-group__input--valid', 'input-group__input--invalid');
                    if (errorSpan) errorSpan.textContent = '';
                }
                
                // Recalcular en tiempo real
                calcularNominaCompleta();
            });
            
            // Validación al perder foco (blur)
            input.addEventListener('blur', () => {
                const resultado = validarNumeroPositivo(input.value);
                if (!resultado.valid && input.value) {
                    alert(resultado.message);
                    input.value = '';
                    input.classList.remove('input-group__input--valid', 'input-group__input--invalid');
                    const errorSpan = input.parentElement?.querySelector('.input-group__error');
                    if (errorSpan) errorSpan.textContent = '';
                }
            });
        }
    });
};

// Botón tema - sincronizado con el store para persistencia
const setupBotonTema = () => {
    if (elementos.botonTema) {
        elementos.botonTema.addEventListener('click', () => {
            const html = document.documentElement;
            const actual = html.getAttribute('data-theme');
            const nuevo = actual === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', nuevo);
            // Persistir el tema en el store
            store.cambiarTema(nuevo);
        });
    }
};

// Botón calcular - ELIMINADO en Fase 3 (cálculo en tiempo real)
// Mantengo la función vacía para no romper referencias
const setupBotonCalcular = () => {
    // Ya no hay botón calcular - el cálculo es automático
};

// Botón agregar turno
const setupBotonAgregar = () => {
    if (elementos.botonAñadir) {
        elementos.botonAñadir.addEventListener('click', () => {
            renderer.agregarFilaTurno();
            
            // Agregar listeners a la nueva fila
            const totalFilas = elementos.tbody.children.length;
            const fechaInput = document.getElementById(`fecha_${totalFilas}`);
            const diaLabel = document.getElementById(`dia_${totalFilas}`);
            const fila = document.getElementById(`fila_${totalFilas}`);
            const horaInicio = document.getElementById(`hora_inicio_${totalFilas}`);
            const horaSalida = document.getElementById(`hora_salida_${totalFilas}`);
            
            if (fechaInput) {
                fechaInput.addEventListener('change', () => {
                    renderer.actualizarDiaYEstilo(fechaInput.value, diaLabel, fila);
                    calcularNominaCompleta();
                });
            }
            
            if (horaInicio) {
                horaInicio.addEventListener('change', () => calcularNominaCompleta());
            }
            if (horaSalida) {
                horaSalida.addEventListener('change', () => calcularNominaCompleta());
            }
            
            calcularNominaCompleta();
        });
    }
};

// Botón quitar turno
const setupBotonQuitar = () => {
    if (elementos.botonQuitar) {
        elementos.botonQuitar.addEventListener('click', () => {
            renderer.eliminarFilaTurno();
            calcularNominaCompleta();
        });
    }
};

// Event delegation para turnos dinámicos - AGREGADO input para selects
const setupEventDelegation = () => {
    if (elementos.tbody) {
        // Evento change para selects (hora inicio/salida) y date
        elementos.tbody.addEventListener('change', (e) => {
            const target = e.target;
            
            // Detectar cambio en fecha
            if (target.id && target.id.startsWith('fecha_')) {
                const indice = target.id.split('_')[1];
                const diaLabel = document.getElementById(`dia_${indice}`);
                const fila = document.getElementById(`fila_${indice}`);
                renderer.actualizarDiaYEstilo(target.value, diaLabel, fila);
                calcularNominaCompleta();
            }
            
            // Detectar cambio en hora inicio o salida
            if (target.id && (target.id.startsWith('hora_inicio_') || target.id.startsWith('hora_salida_'))) {
                calcularNominaCompleta();
            }
            
            // Detectar cambio en incapacidad
            if (target.id && target.id.startsWith('incapacidad_')) {
                calcularNominaCompleta();
            }
        });
        
        // Evento input para selects (calculo inmediato al cambiar opción)
        elementos.tbody.addEventListener('input', (e) => {
            if (e.target.tagName === 'SELECT') {
                calcularNominaCompleta();
            }
        });
    }
};

/**
 * Pre-carga los inputs del formulario con los datos guardados en el store (localStorage).
 * Se llama después de inicializar los elementos del DOM.
 */
const preCargarDesdeStore = () => {
    const estado = getState();

    // Restaurar tema
    const temaGuardado = estado.configuracion?.tema;
    if (temaGuardado) {
        document.documentElement.setAttribute('data-theme', temaGuardado);
    }

    // Restaurar inputs de horas extras
    const he = estado.horasExtras;
    if (he) {
        if (elementos.horaDiurna && he.diurna) elementos.horaDiurna.value = he.diurna;
        if (elementos.horaNocturna && he.nocturna) elementos.horaNocturna.value = he.nocturna;
        if (elementos.horaDiurnaFestiva && he.diurnaFestiva) elementos.horaDiurnaFestiva.value = he.diurnaFestiva;
        if (elementos.horaNocturnaFestiva && he.nocturnaFestiva) elementos.horaNocturnaFestiva.value = he.nocturnaFestiva;
    }

    // Restaurar inputs de deducciones
    const ded = estado.deducciones;
    if (ded) {
        if (elementos.deduccionesNomina && ded.nomina) elementos.deduccionesNomina.value = ded.nomina;
        if (elementos.deduccionesEMI && ded.emi) elementos.deduccionesEMI.value = ded.emi;
        if (elementos.otrasDeducciones && ded.otras) elementos.otrasDeducciones.value = ded.otras;
    }
};

/**
 * Inicializa la aplicación
 */
const inicializarApp = () => {
    inicializarElementos();
    renderer.inicializarElementos();

    // Pre-cargar formulario con datos persistidos en localStorage
    preCargarDesdeStore();

    setupValidaciones();
    setupBotonTema();
    setupBotonCalcular();
    setupBotonAgregar();
    setupBotonQuitar();
    setupEventDelegation();

    // Agregar primera fila vacía
    if (elementos.tbody && elementos.tbody.children.length === 0) {
        renderer.agregarFilaTurno();
    }
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarApp);

// Exportar para uso externo si es necesario
export { calcularNominaCompleta, obtenerTurnosDelDOM };