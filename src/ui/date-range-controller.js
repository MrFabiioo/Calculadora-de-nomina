import { createDateRangeResetState, getDateRangeUiState } from '../utils/date-range.js';
import { applyDateRangeBulkFill } from './date-range-bulk-fill.js';

const STATUS_CLASSES = [
    'date-range-panel__status--error',
    'date-range-panel__status--success',
    'date-range-panel__status--info'
];

const renderStatus = (statusElement, message = '', type = 'info') => {
    if (!statusElement) {
        return;
    }

    statusElement.textContent = message;
    statusElement.classList.remove(...STATUS_CLASSES);

    if (message) {
        statusElement.classList.add(`date-range-panel__status--${type}`);
    }
};

export const createDateRangeController = ({
    elements,
    collaborators
}) => {
    const {
        startInput,
        endInput,
        applyButton,
        statusElement
    } = elements;

    const syncState = () => {
        const uiState = getDateRangeUiState(startInput?.value || '', endInput?.value || '');

        if (applyButton) {
            applyButton.disabled = uiState.isApplyDisabled;
        }

        renderStatus(statusElement, uiState.statusMessage, uiState.statusType);
        return uiState;
    };

    const apply = () => {
        const result = applyDateRangeBulkFill({
            startDate: startInput?.value || '',
            endDate: endInput?.value || '',
            ...collaborators
        });

        if (applyButton) {
            applyButton.disabled = result.isApplyDisabled;
        }

        renderStatus(statusElement, result.statusMessage, result.statusType);
        return result;
    };

    const reset = () => {
        const resetState = createDateRangeResetState();

        if (startInput) {
            startInput.value = resetState.startDate;
        }

        if (endInput) {
            endInput.value = resetState.endDate;
        }

        if (applyButton) {
            applyButton.disabled = resetState.isApplyDisabled;
        }

        renderStatus(statusElement, resetState.statusMessage, resetState.statusType);
        return resetState;
    };

    const setup = () => {
        if (!startInput || !endInput || !applyButton) {
            return;
        }

        const onInput = () => {
            syncState();
        };

        startInput.addEventListener('input', onInput);
        endInput.addEventListener('input', onInput);
        startInput.addEventListener('change', onInput);
        endInput.addEventListener('change', onInput);
        applyButton.addEventListener('click', apply);

        syncState();
    };

    return {
        apply,
        reset,
        setup,
        syncState
    };
};

export { renderStatus };
