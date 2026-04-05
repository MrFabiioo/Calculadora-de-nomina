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
import { calcularNomina } from './src/domain/calculations.js';
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
 * 
 * MEJORADO: Ahora usa el pipeline segmentado si está habilitado, propagando turnosLiquidados[]
 * al renderer para mostrar breakdown por fila sin recalcular reglas de negocio.
 */
const calcularNominaCompleta = () => {
    const turnos = obtenerTurnosDelDOM();
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

    // ============================================
    // Calcular nómina con pipeline segmentado
    // ============================================
    const resultados = calcularNomina({
        turnos,
        deduccionNomina: deducciones.nomina,
        deduccionEMI: deducciones.emi,
        otrasDeducciones: deducciones.otras
    });

    // ============================================
    // Actualizar celdas individuales de la tabla de turnos (Task 5.1)
    // AHORA: usar breakdown del resultado segmentado en lugar de recalcular
    // ============================================
    const turnosLiquidados = resultados.turnosLiquidados || [];
    
    turnos.forEach((turno, index) => {
        const i = index + 1;
        
        // Buscar el breakdown correspondiente en turnosLiquidados
        const liquido = turnosLiquidados.find(t => 
            t.turno.horaInicio === turno.horaInicio && 
            t.turno.horaSalida === turno.horaSalida &&
            t.turno.fecha === turno.fecha
        );
        
        if (liquido && liquido.liquidacion && liquido.liquidacion.total > 0) {
            // Usar valores del breakdown segmentado (más preciso)
            const { total, horas } = liquido.liquidacion;

            const celdaValor = document.getElementById(`valor_${i}`);
            if (celdaValor) celdaValor.innerText = formatearMoneda(total);

            const celdaHoras = document.getElementById(`horas_${i}`);
            if (celdaHoras) celdaHoras.innerText = horas;
            
            // Guardar breakdown en la fila para posible detalle futuro (Task 5.2)
            const fila = document.getElementById(`fila_${i}`);
            if (fila) {
                fila.dataset.breakdown = JSON.stringify(liquido.liquidacion.breakdown);
            }

            // Actualizar contador
            const contadorUI = index + 1;
            const celdaNumero = document.getElementById(`numero_${i}`);
            if (celdaNumero) celdaNumero.innerText = contadorUI;
        } else {
            // Limpiar celdas de filas de descanso o sin turno
            
            const celdaValor = document.getElementById(`valor_${i}`);
            if (celdaValor) celdaValor.innerText = '';
            const celdaHoras = document.getElementById(`horas_${i}`);
            if (celdaHoras) celdaHoras.innerText = '';
            const celdaNumero = document.getElementById(`numero_${i}`);
            if (celdaNumero) celdaNumero.innerText = '';
            
            // Limpiar dataset
            const fila = document.getElementById(`fila_${i}`);
            if (fila) delete fila.dataset.breakdown;
        }
    });

    // Delegar el render de resultados al renderer (totales)
    renderer.renderizarResultados(resultados);

    // Persistir en el store: inputs del usuario + resultados calculados + breakdown por turno
    setState({
        turnos,
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
        },
        // Guardar breakdown para auditoría (Task 5.1)
        turnosLiquidados: turnosLiquidados
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
        { id: 'otras-deducciones', key: 'otras' }
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