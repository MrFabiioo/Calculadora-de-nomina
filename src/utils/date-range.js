import { toLocalDate } from '../domain/holidays.js';
import { validarRangoFechas } from './validators.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const formatDateAsISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const generateInclusiveDateRange = (startDate, endDate) => {
    const start = toLocalDate(startDate);
    const end = toLocalDate(endDate);
    const dates = [];

    for (let currentTime = start.getTime(); currentTime <= end.getTime(); currentTime += DAY_IN_MS) {
        dates.push(formatDateAsISO(new Date(currentTime)));
    }

    return dates;
};

export const getDateRangeUiState = (startDate, endDate) => {
    const validation = validarRangoFechas(startDate, endDate);
    const hasAnyInput = Boolean(startDate || endDate);

    return {
        validation,
        isApplyDisabled: !validation.valid,
        statusMessage: validation.valid || !hasAnyInput ? '' : validation.message,
        statusType: validation.valid ? 'info' : 'error'
    };
};

export const buildDateRangeFillPlan = (startDate, endDate, existingRowCount = 0) => {
    const dates = generateInclusiveDateRange(startDate, endDate);

    return {
        dates,
        requiredRowCount: dates.length,
        untouchedRowCount: Math.max(existingRowCount - dates.length, 0)
    };
};

export const createDateRangeResetState = () => ({
    startDate: '',
    endDate: '',
    ...getDateRangeUiState('', '')
});

export { formatDateAsISO };
