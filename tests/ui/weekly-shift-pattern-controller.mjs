import { createWeeklyShiftPatternController } from '../../src/ui/weekly-shift-pattern-controller.js';

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
        throw new Error(`${message}. Expected ${expected}, got ${actual}`);
    }
};

const test = (name, fn) => {
    try {
        fn();
        passed += 1;
        console.log(`✅ ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
    }
};

const createFakeClassList = () => {
    const classes = new Set();

    return {
        add: (...tokens) => tokens.forEach((token) => classes.add(token)),
        remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
        contains: (token) => classes.has(token)
    };
};

const createFakeSelect = (initialValue = 'Selecciona un horario') => {
    const listeners = new Map();

    return {
        value: initialValue,
        dataset: {},
        addEventListener: (eventName, handler) => {
            if (!listeners.has(eventName)) {
                listeners.set(eventName, []);
            }

            listeners.get(eventName).push(handler);
        },
        dispatch: (eventName) => {
            (listeners.get(eventName) || []).forEach((handler) => handler({ target: null }));
        }
    };
};

const createRoot = () => {
    const buttonListeners = new Map();
    const applyButton = {
        disabled: false,
        addEventListener: (eventName, handler) => {
            if (!buttonListeners.has(eventName)) {
                buttonListeners.set(eventName, []);
            }

            buttonListeners.get(eventName).push(handler);
        },
        dispatch: (eventName) => {
            (buttonListeners.get(eventName) || []).forEach((handler) => handler({ target: null }));
        }
    };
    const statusElement = {
        textContent: '',
        classList: createFakeClassList()
    };

    const selects = new Map();
    ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach((dayKey) => {
        selects.set(`#weekly-shift-start-${dayKey}`, createFakeSelect());
        selects.set(`#weekly-shift-end-${dayKey}`, createFakeSelect());
    });

    return {
        innerHTML: '',
        querySelector: (selector) => {
            if (selector === '#btn-apply-weekly-shift-pattern') {
                return applyButton;
            }

            if (selector === '#weekly-shift-pattern-status') {
                return statusElement;
            }

            return selects.get(selector) || null;
        },
        querySelectorAll: (selector) => {
            if (selector === 'select[data-day-key]') {
                return Array.from(selects.values());
            }

            return [];
        },
        applyButton,
        statusElement,
        selects
    };
};

const createHarness = () => {
    const root = createRoot();
    const rows = [
        { date: '2026-07-06', hourStart: 'Selecciona un horario', hourEnd: 'Selecciona un horario' },
        { date: '2026-07-07', hourStart: 'Selecciona un horario', hourEnd: 'Selecciona un horario' }
    ];
    let recalculations = 0;
    let clearButtonUpdates = 0;

    const controller = createWeeklyShiftPatternController({
        elements: { root },
        collaborators: {
            getExistingRowCount: () => rows.length,
            getRowDate: (rowIndex) => rows[rowIndex - 1].date,
            applyHoursToRow: (rowIndex, startTime, endTime) => {
                rows[rowIndex - 1].hourStart = startTime;
                rows[rowIndex - 1].hourEnd = endTime;
                return true;
            },
            recalculate: () => {
                recalculations += 1;
            },
            updateClearButton: () => {
                clearButtonUpdates += 1;
            }
        }
    });

    return {
        root,
        rows,
        controller,
        getRecalculations: () => recalculations,
        getClearButtonUpdates: () => clearButtonUpdates
    };
};

test('controller setup renders the panel and keeps apply disabled without configuration', () => {
    const harness = createHarness();

    harness.controller.setup();

    assert(harness.root.innerHTML.includes('Aplicar secuencia'), 'Setup should render the weekly sequence panel');
    assert(harness.root.applyButton.disabled, 'Apply should start disabled');
    assertEqual(harness.root.statusElement.textContent, 'Configurá al menos un día para aplicar la secuencia.', 'Initial guidance should be visible');
});

test('controller sync enables apply once a weekday is configured', () => {
    const harness = createHarness();
    harness.controller.setup();

    harness.root.selects.get('#weekly-shift-start-lunes').value = '6:00 Am';
    harness.root.selects.get('#weekly-shift-end-lunes').value = '14:00 Pm';
    harness.controller.syncState();

    assert(!harness.root.applyButton.disabled, 'Complete weekday configuration should enable apply');
    assertEqual(harness.root.statusElement.textContent, '', 'Valid state should clear the status message');
});

test('controller apply writes row hours through the orchestration path', () => {
    const harness = createHarness();
    harness.controller.setup();

    harness.root.selects.get('#weekly-shift-start-lunes').value = '6:00 Am';
    harness.root.selects.get('#weekly-shift-end-lunes').value = '14:00 Pm';
    harness.root.selects.get('#weekly-shift-start-martes').value = '14:00 Pm';
    harness.root.selects.get('#weekly-shift-end-martes').value = '22:00 Pm';
    harness.root.applyButton.dispatch('click');

    assertEqual(harness.rows[0].hourStart, '6:00 Am', 'Monday row should receive configured start time');
    assertEqual(harness.rows[1].hourEnd, '22:00 Pm', 'Tuesday row should receive configured end time');
    assertEqual(harness.root.statusElement.textContent, 'Se aplicó la secuencia semanal en 2 fila(s).', 'Success message should render after apply');
    assertEqual(harness.getRecalculations(), 1, 'Apply should recalculate once');
    assertEqual(harness.getClearButtonUpdates(), 1, 'Apply should update clear button once');
});

test('controller reset clears weekday selections and restores disabled apply', () => {
    const harness = createHarness();
    harness.controller.setup();

    harness.root.selects.get('#weekly-shift-start-domingo').value = 'Descanso';
    harness.root.selects.get('#weekly-shift-end-domingo').value = 'Descanso';
    harness.controller.syncState();
    harness.controller.reset();

    assertEqual(harness.root.selects.get('#weekly-shift-start-domingo').value, 'Selecciona un horario', 'Reset should clear start selections');
    assert(harness.root.applyButton.disabled, 'Reset should disable apply again');
});

if (failed > 0) {
    console.error(`\n❌ ${failed} weekly shift controller test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} weekly shift controller tests passed.`);
