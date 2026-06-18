import { buildDateRangeFillPlan, getDateRangeUiState } from '../utils/date-range.js';

export const buildDateRangeSuccessMessage = ({ startDate, endDate, untouchedRowCount, appliedCount }) => {
    const baseMessage = `Se completaron ${appliedCount} fechas desde ${startDate} hasta ${endDate}.`;

    if (untouchedRowCount > 0) {
        return `${baseMessage} ${untouchedRowCount} fila(s) adicional(es) no se modificaron.`;
    }

    return baseMessage;
};

export const applyDateRangeBulkFill = ({
    startDate,
    endDate,
    getExistingRowCount,
    ensureRowCount,
    applyDateToRow,
    recalculate,
    updateClearButton
}) => {
    const uiState = getDateRangeUiState(startDate, endDate);

    if (!uiState.validation.valid) {
        return {
            applied: false,
            statusMessage: uiState.statusMessage,
            statusType: uiState.statusType,
            isApplyDisabled: uiState.isApplyDisabled
        };
    }

    const existingRowCount = getExistingRowCount();
    const plan = buildDateRangeFillPlan(startDate, endDate, existingRowCount);

    ensureRowCount(plan.requiredRowCount);

    for (let index = 0; index < plan.dates.length; index += 1) {
        const applied = applyDateToRow(index + 1, plan.dates[index]);

        if (applied === false) {
            return {
                applied: false,
                plan,
                statusMessage: 'No se pudieron completar todas las fechas del rango. Revisá las filas e intentá de nuevo.',
                statusType: 'error',
                isApplyDisabled: uiState.isApplyDisabled
            };
        }
    }

    recalculate();
    updateClearButton();

    return {
        applied: true,
        plan,
        statusMessage: buildDateRangeSuccessMessage({
            startDate,
            endDate,
            untouchedRowCount: plan.untouchedRowCount,
            appliedCount: plan.dates.length
        }),
        statusType: 'success',
        isApplyDisabled: uiState.isApplyDisabled
    };
};
