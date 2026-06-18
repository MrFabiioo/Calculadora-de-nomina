import { createDateRangeController } from '../../src/ui/date-range-controller.js';

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

const assertArrayEqual = (actual, expected, message) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
        contains: (token) => classes.has(token),
        toArray: () => Array.from(classes)
    };
};

const createFakeElement = (initialValue = '') => {
    const listeners = new Map();

    return {
        value: initialValue,
        disabled: false,
        textContent: '',
        classList: createFakeClassList(),
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

const createRows = (count) => Array.from({ length: count }, (_, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, '0')}`,
    hourStart: `0${(index % 9) + 1}:00`.slice(-5),
    hourEnd: `1${(index % 9) + 1}:00`.slice(-5),
    incapacity: index % 2 === 0
}));

const createHarness = (initialRowCount, failingRowIndex = null) => {
    const rows = createRows(initialRowCount);
    let recalculations = 0;
    let clearButtonUpdates = 0;

    return {
        rows,
        getExistingRowCount: () => rows.length,
        ensureRowCount: (requiredRowCount) => {
            while (rows.length < requiredRowCount) {
                rows.push({ date: '', hourStart: '07:00', hourEnd: '15:00', incapacity: false });
            }
        },
        applyDateToRow: (rowIndex, date) => {
            if (rowIndex === failingRowIndex) {
                return false;
            }

            rows[rowIndex - 1].date = date;
            return true;
        },
        recalculate: () => {
            recalculations += 1;
        },
        updateClearButton: () => {
            clearButtonUpdates += 1;
        },
        getRecalculations: () => recalculations,
        getClearButtonUpdates: () => clearButtonUpdates
    };
};

const createControllerHarness = (initialRowCount = 1, failingRowIndex = null) => {
    const startInput = createFakeElement('');
    const endInput = createFakeElement('');
    const applyButton = createFakeElement('');
    const statusElement = createFakeElement('');
    const collaborators = createHarness(initialRowCount, failingRowIndex);

    const controller = createDateRangeController({
        elements: { startInput, endInput, applyButton, statusElement },
        collaborators
    });

    return {
        controller,
        startInput,
        endInput,
        applyButton,
        statusElement,
        collaborators
    };
};

test('controller wiring toggles button state and reflects status text', () => {
    const harness = createControllerHarness();

    harness.controller.setup();
    assert(harness.applyButton.disabled, 'Apply should start disabled');
    assertEqual(harness.statusElement.textContent, '', 'Initial empty state should not show a message');

    harness.startInput.value = '2026-05-30';
    harness.startInput.dispatch('input');

    assert(harness.applyButton.disabled, 'Partial input should keep apply disabled');
    assertEqual(harness.statusElement.textContent, 'Seleccioná fecha inicial y fecha final', 'Partial input should render validation guidance');
    assert(harness.statusElement.classList.contains('date-range-panel__status--error'), 'Partial input should render error status styling');

    harness.endInput.value = '2026-06-01';
    harness.endInput.dispatch('change');

    assert(!harness.applyButton.disabled, 'Valid input should enable apply');
    assertEqual(harness.statusElement.textContent, '', 'Valid input should clear the status text');
});

test('controller apply writes row dates through the real orchestration path', () => {
    const harness = createControllerHarness(1);
    const originalHourStart = harness.collaborators.rows[0].hourStart;
    const originalHourEnd = harness.collaborators.rows[0].hourEnd;
    const originalIncapacity = harness.collaborators.rows[0].incapacity;

    harness.controller.setup();
    harness.startInput.value = '2026-05-30';
    harness.endInput.value = '2026-06-02';
    harness.applyButton.dispatch('click');

    assertArrayEqual(
        harness.collaborators.rows.slice(0, 4).map((row) => row.date),
        ['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02'],
        'Applying a valid range should write dates in order through the orchestration path'
    );
    assertEqual(harness.collaborators.rows.length, 4, 'Applying a valid range should add missing rows');
    assertEqual(harness.collaborators.rows[0].hourStart, originalHourStart, 'Applying dates should preserve existing start hours');
    assertEqual(harness.collaborators.rows[0].hourEnd, originalHourEnd, 'Applying dates should preserve existing end hours');
    assertEqual(harness.collaborators.rows[0].incapacity, originalIncapacity, 'Applying dates should preserve existing incapacity');
    assertEqual(harness.statusElement.textContent, 'Se completaron 4 fechas desde 2026-05-30 hasta 2026-06-02.', 'Valid apply should reflect the success message into the status element');
});

test('controller reset clears range controls and state', () => {
    const harness = createControllerHarness();

    harness.controller.setup();
    harness.startInput.value = '2026-05-30';
    harness.endInput.value = '2026-06-01';
    harness.controller.syncState();

    harness.controller.reset();

    assertEqual(harness.startInput.value, '', 'Reset should clear the start input');
    assertEqual(harness.endInput.value, '', 'Reset should clear the end input');
    assert(harness.applyButton.disabled, 'Reset should disable apply again');
    assertEqual(harness.statusElement.textContent, '', 'Reset should clear the status text');
});

test('controller surfaces row application failures without false success', () => {
    const harness = createControllerHarness(2, 2);
    const beforeRows = harness.collaborators.rows.map((row) => ({ ...row }));

    harness.controller.setup();
    harness.startInput.value = '2026-05-30';
    harness.endInput.value = '2026-06-01';
    harness.applyButton.dispatch('click');

    assertEqual(harness.statusElement.textContent, 'No se pudieron completar todas las fechas del rango. Revisá las filas e intentá de nuevo.', 'Failures should render an explicit error message');
    assert(harness.statusElement.classList.contains('date-range-panel__status--error'), 'Failures should render error styling');
    assertEqual(harness.collaborators.rows[0].date, '2026-05-30', 'Rows applied before the failure may change');
    assertEqual(harness.collaborators.rows[1].date, beforeRows[1].date, 'The failing row should not be overwritten');
    assertEqual(harness.collaborators.getRecalculations(), 0, 'Failures should not recalculate');
    assertEqual(harness.collaborators.getClearButtonUpdates(), 0, 'Failures should not update the clear button');
});

if (failed > 0) {
    console.error(`\n❌ ${failed} date range controller test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} date range controller tests passed.`);
