/**
 * Entry Point - Calculadora de Nómina Colombiana
 * Orchestrates la aplicación, conecta eventos con lógica de negocio
 * 
 * IMPORTANTE: Este archivo usa ES modules. Para desarrollo local,
 * usa un servidor como Live Server (VS Code) o `python -m http.server`
 * Los ES modules no funcionan con file:// en algunos navegadores por CORS
 */

import { store, getState, setState, subscribe } from './src/state/store.js';
import { TURNOS } from './src/domain/shifts.js';
import { esFestivo, esDomingo, esNormalAFestivo, esFestivoANormal } from './src/domain/holidays.js';
import { calcularValorTurno, calcularHorasExtras, calcularDeducciones, calcularNomina } from './src/domain/calculations.js';
import { validarNumeroPositivo } from './src/utils/validators.js';
import { formatearMoneda } from './src/utils/formatters.js';
import * as renderer from './src/ui/renderer.js';

// Elementos del DOM
let elementos = {};

/**
 * Inicializa las referencias a elementos del DOM
 */
const inicializarElementos = () => {
    elementos = {
        tbody: document.getElementById('cuerpo_tabla'),
        mostradorContador: document.getElementById('mostrador_contador'),
        horaDiurna: document.getElementById('hora_diurna'),
        horaNocturna: document.getElementById('hora_nocturna'),
        horaDiurnaFestiva: document.getElementById('hora_diurna_festiva'),
        horaNocturnaFestiva: document.getElementById('hora_nocturna_festiva'),
        deduccionesNomina: document.getElementById('deducciones_nomina'),
        deduccionesEMI: document.getElementById('deducciones_emi_familiares'),
        otrasDeducciones: document.getElementById('otras_deducciones'),
        turnosLabel: document.getElementById('turnos_label'),
        horasLabel: document.getElementById('horas_label'),
        subsidioTransporteLabel: document.getElementById('subsidio_transporte_label'),
        totalDevengado: document.getElementById('total_devengado'),
        totalDeducciones: document.getElementById('tota_deducciones'),
        netoAPagar: document.getElementById('neto_a_pagar'),
        valorSaludEmpleado: document.getElementById('valor_salud_empleado_label'),
        valorPensionEmpleado: document.getElementById('valor_pension_empleado_label'),
        valorSaludEmpresa: document.getElementById('valor_salud_empresa_label'),
        valorPensionEmpresa: document.getElementById('valor_pension_empresa_label'),
        totalEmpleado: document.getElementById('total_empleado_label'),
        totalEmpresa: document.getElementById('total_empresa_label'),
        botonCalcular: document.getElementById('calcular'),
        botonAñadir: document.getElementById('añadir'),
        botonQuitar: document.getElementById('quitar'),
        botonTema: document.getElementById('btn_cambio_tema')
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
 * Calcula la nómina completa
 * Este método híbrido mantiene la lógica original para compatibilidad
 * pero usa las funciones puras del módulo domain
 */
const calcularNominaCompleta = () => {
    const turnos = obtenerTurnosDelDOM();
    const horasExtras = obtenerHorasExtrasDelDOM();
    const deducciones = obtenerDeduccionesDelDOM();
    
    let sumaTurnos = 0;
    let sumaHoras = 0;
    let contadorTurnos = 0;
    
    // Calcular turnos uno por uno (lógica original)
    turnos.forEach((turno, index) => {
        const i = index + 1;
        const key = `${turno.horaInicio}-${turno.horaSalida}`;
        const fila = document.getElementById(`fila_${i}`);
        
        if (turno.horaInicio === "Descanso" && turno.horaSalida === "Descanso") {
            if (fila) fila.style.opacity = "0.4";
        }
        
        const turnoData = TURNOS[key];
        
        if (turnoData) {
            let valorTurno = calcularValorTurno(turnoData, turno.fecha, turno.incapacidad);
            
            // Mostrar valor en la tabla
            const celdaValor = document.getElementById(`valor_${i}`);
            if (celdaValor) {
                celdaValor.innerText = formatearMoneda(valorTurno);
            }
            
            sumaTurnos += valorTurno;
            
            // Horas trabajadas
            const celdaHoras = document.getElementById(`horas_${i}`);
            if (celdaHoras) {
                celdaHoras.innerText = turnoData.horas;
            }
            sumaHoras += turnoData.horas;
            
            // Contador de turnos
            if (!(turno.horaInicio === "Descanso" && turno.horaSalida === "Descanso")) {
                contadorTurnos++;
                const celdaNumero = document.getElementById(`numero_${i}`);
                if (celdaNumero) {
                    celdaNumero.innerText = contadorTurnos;
                }
            }
        }
    });
    
    // Agregar horas extras
    let sumaHorasExtras = 0;
    if (horasExtras.diurna) sumaHorasExtras += horasExtras.diurna * 11509.90;
    if (horasExtras.nocturna) sumaHorasExtras += horasExtras.nocturna * 15538.42;
    if (horasExtras.diurnaFestiva) sumaHorasExtras += horasExtras.diurnaFestiva * 20717.82;
    if (horasExtras.nocturnaFestiva) sumaHorasExtras += horasExtras.nocturnaFestiva * 24737.29;
    
    const devengadoSinSubsidio = sumaTurnos + sumaHorasExtras;
    
    // Subsidio de transporte
    let subsidioTransporte = 0;
    if (devengadoSinSubsidio < 2847000) {
        if (contadorTurnos > 30) {
            subsidioTransporte = 200000;
        } else {
            const diario = 200000 / 30;
            subsidioTransporte = diario * contadorTurnos;
        }
    }
    
    if (elementos.subsidioTransporteLabel) {
        elementos.subsidioTransporteLabel.innerText = formatearMoneda(subsidioTransporte);
    }
    
    // Actualizar contadores
    if (elementos.turnosLabel) elementos.turnosLabel.innerText = contadorTurnos;
    if (elementos.horasLabel) elementos.horasLabel.innerText = sumaHoras;
    
    // Deducciones de salud y pensión
    const devengadoTotal = devengadoSinSubsidio + subsidioTransporte;
    const deduccionesSP = calcularDeducciones(devengadoTotal);
    
    const montoDeducciones = 
        deducciones.nomina + 
        deducciones.emi + 
        deducciones.otras + 
        deduccionesSP.saludEmpleado + 
        deduccionesSP.pensionEmpleado;
    
    // Actualizar UI
    if (elementos.totalDeducciones) {
        elementos.totalDeducciones.innerText = formatearMoneda(montoDeducciones);
    }
    if (elementos.totalEmpresa) {
        elementos.totalEmpresa.innerText = formatearMoneda(deduccionesSP.saludEmpresa + deduccionesSP.pensionEmpresa);
    }
    if (elementos.valorPensionEmpresa) {
        elementos.valorPensionEmpresa.innerText = formatearMoneda(deduccionesSP.pensionEmpresa);
    }
    if (elementos.valorSaludEmpresa) {
        elementos.valorSaludEmpresa.innerText = formatearMoneda(deduccionesSP.saludEmpresa);
    }
    if (elementos.totalEmpleado) {
        elementos.totalEmpleado.innerText = formatearMoneda(deduccionesSP.saludEmpleado + deduccionesSP.pensionEmpleado);
    }
    if (elementos.valorPensionEmpleado) {
        elementos.valorPensionEmpleado.innerText = formatearMoneda(deduccionesSP.pensionEmpleado);
    }
    if (elementos.valorSaludEmpleado) {
        elementos.valorSaludEmpleado.innerText = formatearMoneda(deduccionesSP.saludEmpleado);
    }
    
    // Neto a pagar
    const netoPagar = devengadoTotal - montoDeducciones;
    if (elementos.netoAPagar) {
        elementos.netoAPagar.innerText = formatearMoneda(netoPagar);
    }
    if (elementos.totalDevengado) {
        elementos.totalDevengado.innerText = formatearMoneda(devengadoTotal);
    }
    
    return {
        devengadoTotal,
        totalDeducciones: montoDeducciones,
        netoPagar,
        cantidadTurnos: contadorTurnos,
        cantidadHoras: sumaHoras,
        ...deduccionesSP
    };
};

/**
 * Event handlers
 */

// Validación de inputs (blur)
const setupValidaciones = () => {
    const inputs = [
        { id: 'deducciones_nomina', key: 'nomina' },
        { id: 'deducciones_emi_familiares', key: 'emi' },
        { id: 'otras_deducciones', key: 'otras' },
        { id: 'hora_diurna', key: 'diurna' },
        { id: 'hora_nocturna', key: 'nocturna' },
        { id: 'hora_diurna_festiva', key: 'diurnaFestiva' },
        { id: 'hora_nocturna_festiva', key: 'nocturnaFestiva' }
    ];
    
    inputs.forEach(({ id, key }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', () => {
                const resultado = validarNumeroPositivo(input.value);
                if (!resultado.valid && input.value) {
                    alert(resultado.message);
                    input.value = '';
                }
            });
            
            // Recalcular en tiempo real
            input.addEventListener('input', () => {
                calcularNominaCompleta();
            });
        }
    });
};

// Botón tema
const setupBotonTema = () => {
    if (elementos.botonTema) {
        elementos.botonTema.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
        });
    }
};

// Botón calcular
const setupBotonCalcular = () => {
    if (elementos.botonCalcular) {
        elementos.botonCalcular.addEventListener('click', calcularNominaCompleta);
    }
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

// Event delegation para turnos dinámicos
const setupEventDelegation = () => {
    if (elementos.tbody) {
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
    }
};

/**
 * Inicializa la aplicación
 */
const inicializarApp = () => {
    inicializarElementos();
    renderer.inicializarElementos();
    
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
    
    console.log('Calculadora de nómina inicializada');
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarApp);

// Exportar para uso externo si es necesario
export { calcularNominaCompleta, obtenerTurnosDelDOM };