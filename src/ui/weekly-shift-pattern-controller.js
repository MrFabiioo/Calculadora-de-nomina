import { TURNOS_INICIO, TURNOS_SALIDA } from '../domain/shifts.js';
import { WEEKDAY_ORDER, getWeeklyShiftPatternUiState } from '../utils/weekly-shift-pattern.js';
import { applyWeeklyShiftPattern } from './weekly-shift-pattern-bulk-fill.js';
import { renderStatus } from './date-range-controller.js';

const buildOptionsMarkup = (options) => options
    .map((option) => `<option class="opciones">${option}</option>`)
    .join('');

const buildDayMarkup = ({ key, label }) => `
    <div class="weekly-shift-pattern-panel__day">
        <span class="weekly-shift-pattern-panel__day-label">${label}</span>
        <div class="weekly-shift-pattern-panel__day-fields">
            <div class="input-group">
                <label for="weekly-shift-start-${key}" class="input-group__label">Inicio</label>
                <select id="weekly-shift-start-${key}" class="opciones" data-day-key="${key}" data-field="startTime">
                    ${buildOptionsMarkup(TURNOS_INICIO)}
                </select>
            </div>
            <div class="input-group">
                <label for="weekly-shift-end-${key}" class="input-group__label">Salida</label>
                <select id="weekly-shift-end-${key}" class="opciones" data-day-key="${key}" data-field="endTime">
                    ${buildOptionsMarkup(TURNOS_SALIDA)}
                </select>
            </div>
        </div>
    </div>
`;

const renderPanelMarkup = () => `
    <div class="date-range-panel weekly-shift-pattern-panel" aria-labelledby="weekly-shift-pattern-title">
        <div class="date-range-panel__header">
            <h3 id="weekly-shift-pattern-title" class="date-range-panel__title">Completar horas por secuencia semanal</h3>
            <p class="date-range-panel__description">Definí inicio y salida para cada día. Solo se completan las horas de filas que ya tienen fecha.</p>
        </div>
        <div class="weekly-shift-pattern-panel__controls">
            <div class="weekly-shift-pattern-panel__grid">
                ${WEEKDAY_ORDER.map(buildDayMarkup).join('')}
            </div>
            <div class="weekly-shift-pattern-panel__actions">
                <button id="btn-apply-weekly-shift-pattern" class="btn btn--secondary weekly-shift-pattern-panel__button" disabled>
                    Aplicar secuencia
                </button>
                <p id="weekly-shift-pattern-status" class="date-range-panel__status" role="status" aria-live="polite"></p>
            </div>
        </div>
    </div>
`;

const getPatternFromInputs = (root) => WEEKDAY_ORDER.reduce((patternByDay, { key }) => {
    patternByDay[key] = {
        startTime: root.querySelector(`#weekly-shift-start-${key}`)?.value || '',
        endTime: root.querySelector(`#weekly-shift-end-${key}`)?.value || ''
    };
    return patternByDay;
}, {});

const getInitialSelectValue = () => TURNOS_INICIO[0] || 'Selecciona un horario';

export const createWeeklyShiftPatternController = ({ elements, collaborators }) => {
    const { root } = elements;
    let applyButton = null;
    let statusElement = null;
    let selects = [];

    const cacheElements = () => {
        applyButton = root?.querySelector('#btn-apply-weekly-shift-pattern') || null;
        statusElement = root?.querySelector('#weekly-shift-pattern-status') || null;
        selects = root ? Array.from(root.querySelectorAll('select[data-day-key]')) : [];
    };

    const syncState = () => {
        const patternByDay = getPatternFromInputs(root);
        const uiState = getWeeklyShiftPatternUiState(patternByDay);

        if (applyButton) {
            applyButton.disabled = uiState.isApplyDisabled;
        }

        renderStatus(statusElement, uiState.statusMessage, uiState.statusType);
        return uiState;
    };

    const apply = () => {
        const result = applyWeeklyShiftPattern({
            patternByDay: getPatternFromInputs(root),
            ...collaborators
        });

        if (applyButton) {
            applyButton.disabled = result.isApplyDisabled;
        }

        renderStatus(statusElement, result.statusMessage, result.statusType);
        return result;
    };

    const reset = () => {
        selects.forEach((select) => {
            select.value = getInitialSelectValue();
        });

        return syncState();
    };

    const setup = () => {
        if (!root) {
            return;
        }

        root.innerHTML = renderPanelMarkup();
        cacheElements();

        selects.forEach((select) => {
            select.addEventListener('input', syncState);
            select.addEventListener('change', syncState);
        });

        applyButton?.addEventListener('click', apply);
        syncState();
    };

    return {
        apply,
        reset,
        setup,
        syncState
    };
};
