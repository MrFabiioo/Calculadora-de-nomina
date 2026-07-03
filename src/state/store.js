/**
 * Módulo de Estado - Store reactivo con patrón pub/sub
 * Gestiona el estado de la aplicación y notifica a los suscriptores
 * Persiste el estado en localStorage
 */

import { DEFAULT_TRIWEEKLY_CONFIG, DEFAULT_TRIWEEKLY_METADATA } from '../domain/triweekly-premiums.js';
import { DEFAULT_PTS_EXCESS_METADATA } from '../domain/pts-excess-premiums.js';

// Constantes de persistencia
const STORAGE_KEY = 'calculadora-nomina-state';
const DEBOUNCE_DELAY = 300;

const resultadosIniciales = {
    devengadoTotal: 0,
    totalDeducciones: 0,
    netoPagar: 0,
    subsidioTransporte: 0,
    saludEmpleado: 0,
    pensionEmpleado: 0,
    saludEmpresa: 0,
    pensionEmpresa: 0,
    cantidadTurnos: 0,
    cantidadHoras: 0,
    totalTurnos: 0,
    diasDescanso: 0,
    premiumTriweeklyTotal: 0,
    baseTurnosSinPremio: 0,
    baseDeducciones: 0,
    premiumTriweeklySummary: {
        periodsCount: 0,
        ordinaryHours: 0,
        excessHours: 0,
        dayExcessHours: 0,
        nightExcessHours: 0,
        dayPremiumValue: 0,
        nightPremiumValue: 0,
        premiumValue: 0,
        diagnostics: { ...DEFAULT_TRIWEEKLY_METADATA },
        periods: []
    },
    ptsExcessExperimentalTotal: 0,
    ptsExcessExperimentalSummary: {
        periodsCount: 0,
        ordinaryHours: 0,
        thresholdHours: 0,
        excessHours: 0,
        dayExcessHours: 0,
        nightExcessHours: 0,
        dayPremiumValue: 0,
        nightPremiumValue: 0,
        premiumValue: 0,
        diagnostics: { ...DEFAULT_PTS_EXCESS_METADATA },
        periods: []
    },
    ptsExcessExperimentalPeriods: [],
    festiveExtraSummary: {
        dayHours: 0,
        nightHours: 0,
        totalHours: 0,
        dayValue: 0,
        nightValue: 0,
        totalValue: 0
    }
};

const configuracionInicial = {
    tema: 'light',
    triweekly: { ...DEFAULT_TRIWEEKLY_CONFIG }
};

const isLegacyTriweeklyConfig = (triweekly = {}) => {
    const thresholds = triweekly.thresholds || [];

    return triweekly.anchorDate === '2025-12-28'
        && !('periodDays' in triweekly)
        && thresholds.length === 2
        && thresholds[0]?.maxOrdinaryHours === 132
        && thresholds[1]?.maxOrdinaryHours === 126;
};

const normalizeTriweeklyConfig = (triweekly = {}) => {
    if (isLegacyTriweeklyConfig(triweekly)) {
        return { ...DEFAULT_TRIWEEKLY_CONFIG };
    }

    return {
        ...DEFAULT_TRIWEEKLY_CONFIG,
        ...triweekly,
        thresholds: Array.isArray(triweekly.thresholds) && triweekly.thresholds.length > 0
            ? triweekly.thresholds
            : DEFAULT_TRIWEEKLY_CONFIG.thresholds
    };
};

const crearEstadoInicial = () => ({
    turnos: [],
    deducciones: {
        nomina: 0,
        emi: 0,
        otras: 0
    },
    resultados: structuredClone(resultadosIniciales),
    configuracion: structuredClone(configuracionInicial),
    turnosLiquidados: []
});

// Estado inicial
const estadoInicial = crearEstadoInicial();

/**
 * Guarda el estado en localStorage
 * @param {Object} estado - Estado a guardar
 */
const guardarEnStorage = (estado) => {
    try {
        const datosPersistir = {
            turnos: estado.turnos,
            deducciones: estado.deducciones,
            configuracion: estado.configuracion
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datosPersistir));
    } catch (error) {
        console.warn('No se pudo guardar en localStorage:', error.message);
    }
};

/**
 * Carga el estado desde localStorage
 * @returns {Object} - Estado cargado o estado inicial
 */
const cargarDesdeStorage = () => {
    try {
        const datos = localStorage.getItem(STORAGE_KEY);
        if (datos) {
            const parsed = JSON.parse(datos);
            // Validar que tenga la estructura esperada
            if (parsed.turnos && parsed.deducciones && parsed.configuracion) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn('No se pudo cargar desde localStorage:', error.message);
    }
    return null;
};

// Debounce timer
let debounceTimer = null;

/**
 * Programa el guardado con debounce
 * @param {Object} estado - Estado a guardar
 */
const programarGuardado = (estado) => {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
        guardarEnStorage(estado);
    }, DEBOUNCE_DELAY);
};

class Store {
    constructor() {
        // Cargar estado desde localStorage si existe
        const estadoGuardado = cargarDesdeStorage();
        const baseState = crearEstadoInicial();
        this.estado = estadoGuardado
            ? {
                ...baseState,
                ...estadoGuardado,
                resultados: {
                    ...baseState.resultados,
                    ...(estadoGuardado.resultados || {})
                },
                configuracion: {
                    ...baseState.configuracion,
                    ...(estadoGuardado.configuracion || {}),
                    triweekly: normalizeTriweeklyConfig(estadoGuardado.configuracion?.triweekly || {})
                },
                turnosLiquidados: estadoGuardado.turnosLiquidados || []
            }
            : baseState;
        this.suscriptores = [];
    }

    /**
     * Obtiene el estado actual
     * @returns {Object} - Copia del estado actual
     */
    getState() {
        return { ...this.estado };
    }

    /**
     * Actualiza el estado parcialmente
     * @param {Object} nuevoEstado - Estado parcial a fusionar
     */
    setState(nuevoEstado) {
        this.estado = {
            ...this.estado,
            ...nuevoEstado
        };
        
        // Notificar a todos los suscriptores
        this.notificarSuscriptores();
        
        // Persistir en localStorage con debounce
        programarGuardado(this.estado);
    }

    /**
     * Suscribe un callback para recibir notificaciones de cambios
     * @param {Function} callback - Función a ejecutar cuando cambie el estado
     * @returns {Function} - Función para cancelar la suscripción
     */
    subscribe(callback) {
        this.suscriptores.push(callback);
        
        // Retornar función para desuscribirse
        return () => {
            const indice = this.suscriptores.indexOf(callback);
            if (indice > -1) {
                this.suscriptores.splice(indice, 1);
            }
        };
    }

    /**
     * Notifica a todos los suscriptores con el estado actual
     */
    notificarSuscriptores() {
        const estadoActual = this.getState();
        this.suscriptores.forEach(callback => {
            callback(estadoActual);
        });
    }

    /**
     * Reinicia el estado a su valor inicial
     */
    resetState() {
        this.estado = crearEstadoInicial();
        this.notificarSuscriptores();
    }

    /**
     * Agrega un turno
     * @param {Object} turno - Turno a agregar
     */
    agregarTurno(turno) {
        const turnos = [...this.estado.turnos, turno];
        this.setState({ turnos });
    }

    /**
     * Elimina un turno por índice
     * @param {number} indice - Índice del turno a eliminar
     */
    eliminarTurno(indice) {
        const turnos = this.estado.turnos.filter((_, i) => i !== indice);
        this.setState({ turnos });
    }

    /**
     * Actualiza un turno existente
     * @param {number} indice - Índice del turno
     * @param {Object} turnoActualizado - Turno actualizado
     */
    actualizarTurno(indice, turnoActualizado) {
        const turnos = [...this.estado.turnos];
        turnos[indice] = turnoActualizado;
        this.setState({ turnos });
    }

    /**
     * Actualiza las deducciones
     * @param {Object} deducciones - Nuevo objeto de deducciones
     */
    actualizarDeducciones(deducciones) {
        this.setState({ deducciones });
    }

    /**
     * Actualiza los resultados calculados
     * @param {Object} resultados - Resultados calculados
     */
    actualizarResultados(resultados) {
        this.setState({ resultados });
    }

    /**
     * Cambia el tema
     * @param {string} tema - 'light' o 'dark'
     */
    cambiarTema(tema) {
        this.setState({
            configuracion: {
                ...this.estado.configuracion,
                tema
            }
        });
    }
}

// Exportar instancia única del store
export const store = new Store();
export { resultadosIniciales, configuracionInicial, estadoInicial };

// Exportar funciones helper para uso externo
export const getState = () => store.getState();
export const setState = (nuevoEstado) => store.setState(nuevoEstado);
export const subscribe = (callback) => store.subscribe(callback);
