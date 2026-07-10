import { DIAS_SEMANA, toLocalDate } from '../domain/holidays.js';

export const WEEKDAY_ORDER = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
];

const EMPTY_VALUE = 'Selecciona un horario';
const REST_VALUE = 'Descanso';

const normalizeWeekdayKey = (value = '') => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const isEmptySelection = (value) => !value || value === EMPTY_VALUE;

const validateDayPattern = ({ startTime, endTime }) => {
    const hasStartTime = !isEmptySelection(startTime);
    const hasEndTime = !isEmptySelection(endTime);

    if (!hasStartTime && !hasEndTime) {
        return { configured: false, valid: true };
    }

    if (hasStartTime !== hasEndTime) {
        return { configured: true, valid: false, reason: 'partial' };
    }

    if ((startTime === REST_VALUE) !== (endTime === REST_VALUE)) {
        return { configured: true, valid: false, reason: 'rest-mismatch' };
    }

    return { configured: true, valid: true };
};

export const getWeeklyShiftPatternUiState = (patternByDay = {}) => {
    let configuredDayCount = 0;
    let hasPartialDay = false;
    let hasRestMismatch = false;

    WEEKDAY_ORDER.forEach(({ key }) => {
        const validation = validateDayPattern(patternByDay[key] || {});

        if (validation.configured) {
            configuredDayCount += 1;
        }

        if (!validation.valid && validation.reason === 'partial') {
            hasPartialDay = true;
        }

        if (!validation.valid && validation.reason === 'rest-mismatch') {
            hasRestMismatch = true;
        }
    });

    if (hasPartialDay) {
        return {
            validation: { valid: false, reason: 'partial' },
            statusMessage: 'Completá inicio y salida para cada día que quieras usar.',
            statusType: 'error',
            isApplyDisabled: true,
            configuredDayCount
        };
    }

    if (hasRestMismatch) {
        return {
            validation: { valid: false, reason: 'rest-mismatch' },
            statusMessage: 'Si marcás Descanso, usalo tanto en inicio como en salida.',
            statusType: 'error',
            isApplyDisabled: true,
            configuredDayCount
        };
    }

    if (configuredDayCount === 0) {
        return {
            validation: { valid: false, reason: 'empty' },
            statusMessage: 'Configurá al menos un día para aplicar la secuencia.',
            statusType: 'info',
            isApplyDisabled: true,
            configuredDayCount
        };
    }

    return {
        validation: { valid: true },
        statusMessage: '',
        statusType: 'info',
        isApplyDisabled: false,
        configuredDayCount
    };
};

export const buildWeeklyShiftAssignments = (patternByDay = {}) => {
    return WEEKDAY_ORDER.reduce((assignments, { key }) => {
        const dayPattern = patternByDay[key] || {};
        const validation = validateDayPattern(dayPattern);

        if (validation.valid && validation.configured) {
            assignments[key] = {
                startTime: dayPattern.startTime,
                endTime: dayPattern.endTime
            };
        }

        return assignments;
    }, {});
};

export const getWeekdayKeyFromDate = (dateInput) => {
    if (!dateInput) {
        return '';
    }

    const date = dateInput instanceof Date ? dateInput : toLocalDate(dateInput);

    if (!date || Number.isNaN(date.getTime())) {
        return '';
    }

    return normalizeWeekdayKey(DIAS_SEMANA[date.getDay()] || '');
};
