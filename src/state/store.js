/**
 * Módulo de Estado - Store reactivo con patrón pub/sub
 * Gestiona el estado de la aplicación y notifica a los suscriptores
 */

// Estado inicial
const estadoInicial = {
    turnos: [],
    horasExtras: {
        diurna: 0,
        nocturna: 0,
        diurnaFestiva: 0,
        nocturnasFestiva: 0
    },
    deducciones: {
        nomina: 0,
        emi: 0,
        otras: 0
    },
    resultados: {
        devengadoTotal: 0,
        totalDeducciones: 0,
        netoPagar: 0,
        subsidioTransporte: 0,
        saludEmpleado: 0,
        pensionEmpleado: 0,
        saludEmpresa: 0,
        pensionEmpresa: 0,
        cantidadTurnos: 0,
        cantidadHoras: 0
    },
    configuracion: {
        tema: 'light'
    }
};

class Store {
    constructor() {
        this.estado = { ...estadoInicial };
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
        this.estado = { ...estadoInicial };
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
     * Actualiza las horas extras
     * @param {Object} horasExtras - Nuevo objeto de horas extras
     */
    actualizarHorasExtras(horasExtras) {
        this.setState({ horasExtras });
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

// Exportar funciones helper para uso externo
export const getState = () => store.getState();
export const setState = (nuevoEstado) => store.setState(nuevoEstado);
export const subscribe = (callback) => store.subscribe(callback);