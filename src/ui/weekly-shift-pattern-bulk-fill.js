import {
    buildWeeklyShiftAssignments,
    getWeekdayKeyFromDate,
    getWeeklyShiftPatternUiState
} from '../utils/weekly-shift-pattern.js';

const formatSkippedParts = ({ rowsWithoutDate, rowsWithoutPattern }) => {
    const parts = [];

    if (rowsWithoutDate > 0) {
        parts.push(`${rowsWithoutDate} fila(s) sin fecha`);
    }

    if (rowsWithoutPattern > 0) {
        parts.push(`${rowsWithoutPattern} fila(s) sin secuencia configurada`);
    }

    return parts;
};

export const buildWeeklyShiftPatternMessage = ({ appliedCount, rowsWithoutDate, rowsWithoutPattern }) => {
    const skippedParts = formatSkippedParts({ rowsWithoutDate, rowsWithoutPattern });

    if (appliedCount === 0) {
        if (skippedParts.length === 0) {
            return 'No hubo filas para actualizar.';
        }

        return `No se actualizaron filas. ${skippedParts.join(' y ')} quedaron igual.`;
    }

    const appliedMessage = `Se aplicó la secuencia semanal en ${appliedCount} fila(s).`;

    if (skippedParts.length === 0) {
        return appliedMessage;
    }

    return `${appliedMessage} ${skippedParts.join(' y ')} quedaron igual.`;
};

export const applyWeeklyShiftPattern = ({
    patternByDay,
    getExistingRowCount,
    getRowDate,
    applyHoursToRow,
    recalculate,
    updateClearButton
}) => {
    const uiState = getWeeklyShiftPatternUiState(patternByDay);

    if (!uiState.validation.valid) {
        return {
            applied: false,
            statusMessage: uiState.statusMessage,
            statusType: uiState.statusType,
            isApplyDisabled: uiState.isApplyDisabled
        };
    }

    const assignments = buildWeeklyShiftAssignments(patternByDay);
    const existingRowCount = getExistingRowCount();
    let appliedCount = 0;
    let rowsWithoutDate = 0;
    let rowsWithoutPattern = 0;

    for (let rowIndex = 1; rowIndex <= existingRowCount; rowIndex += 1) {
        const rowDate = getRowDate(rowIndex);

        if (!rowDate) {
            rowsWithoutDate += 1;
            continue;
        }

        const weekdayKey = getWeekdayKeyFromDate(rowDate);
        const assignment = assignments[weekdayKey];

        if (!assignment) {
            rowsWithoutPattern += 1;
            continue;
        }

        const applied = applyHoursToRow(rowIndex, assignment.startTime, assignment.endTime);

        if (applied === false) {
            return {
                applied: false,
                statusMessage: 'No se pudo aplicar la secuencia en todas las filas. Revisá la tabla e intentá de nuevo.',
                statusType: 'error',
                isApplyDisabled: uiState.isApplyDisabled
            };
        }

        appliedCount += 1;
    }

    if (appliedCount > 0) {
        recalculate();
        updateClearButton();
    }

    return {
        applied: appliedCount > 0,
        appliedCount,
        rowsWithoutDate,
        rowsWithoutPattern,
        statusMessage: buildWeeklyShiftPatternMessage({
            appliedCount,
            rowsWithoutDate,
            rowsWithoutPattern
        }),
        statusType: appliedCount > 0 ? 'success' : 'info',
        isApplyDisabled: uiState.isApplyDisabled
    };
};
