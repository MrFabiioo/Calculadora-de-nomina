import {
    buildDateRangeFillPlan,
    createDateRangeResetState,
    generateInclusiveDateRange,
    getDateRangeUiState
} from '../../src/utils/date-range.js';
import { validarRangoFechas } from '../../src/utils/validators.js';

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
    const serializedActual = JSON.stringify(actual);
    const serializedExpected = JSON.stringify(expected);

    if (serializedActual !== serializedExpected) {
        throw new Error(`${message}. Expected ${serializedExpected}, got ${serializedActual}`);
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

test('generateInclusiveDateRange includes both boundaries', () => {
    const range = generateInclusiveDateRange('2026-05-30', '2026-06-02');

    assertArrayEqual(range, [
        '2026-05-30',
        '2026-05-31',
        '2026-06-01',
        '2026-06-02'
    ], 'The generated range should include every day in order');
});

test('generateInclusiveDateRange handles same-day ranges', () => {
    const range = generateInclusiveDateRange('2026-06-29', '2026-06-29');

    assertArrayEqual(range, ['2026-06-29'], 'The generated range should contain one date');
});

test('validarRangoFechas rejects reversed ranges', () => {
    const result = validarRangoFechas('2026-06-29', '2026-05-30');

    assert(!result.valid, 'The reversed range should be invalid');
    assertEqual(result.message, 'La fecha inicial no puede ser posterior a la fecha final', 'The validation message should explain the order problem');
});

test('validarRangoFechas accepts valid inclusive ranges', () => {
    const result = validarRangoFechas('2026-05-30', '2026-06-29');

    assert(result.valid, 'The valid range should pass validation');
});

test('validarRangoFechas rejects empty ranges', () => {
    const result = validarRangoFechas('', '');

    assert(!result.valid, 'The empty range should be invalid');
    assertEqual(result.message, 'Seleccioná fecha inicial y fecha final', 'The empty range should guide the user to fill both boundaries');
});

test('validarRangoFechas rejects partial ranges', () => {
    const result = validarRangoFechas('2026-05-30', '');

    assert(!result.valid, 'A partial range should be invalid');
    assertEqual(result.message, 'Seleccioná fecha inicial y fecha final', 'A partial range should require both boundaries');
});

test('validarRangoFechas rejects impossible calendar dates', () => {
    const result = validarRangoFechas('2026-02-31', '2026-03-02');

    assert(!result.valid, 'Impossible calendar dates should be invalid');
    assertEqual(result.message, 'Fecha inválida', 'The invalid date should produce the invalid date message');
});

test('getDateRangeUiState hides message for fully empty state', () => {
    const uiState = getDateRangeUiState('', '');

    assert(uiState.isApplyDisabled, 'Apply should stay disabled for the empty state');
    assertEqual(uiState.statusMessage, '', 'The empty state should not render an error message');
});

test('getDateRangeUiState surfaces validation feedback for partial state', () => {
    const uiState = getDateRangeUiState('2026-05-30', '');

    assert(uiState.isApplyDisabled, 'Apply should stay disabled for partial input');
    assertEqual(uiState.statusMessage, 'Seleccioná fecha inicial y fecha final', 'The partial state should surface the validation guidance');
    assertEqual(uiState.statusType, 'error', 'The partial state should be marked as error');
});

test('buildDateRangeFillPlan keeps extra rows untouched', () => {
    const plan = buildDateRangeFillPlan('2026-05-30', '2026-06-01', 5);

    assertEqual(plan.requiredRowCount, 3, 'The plan should require one row per generated date');
    assertEqual(plan.untouchedRowCount, 2, 'The plan should report untouched extra rows instead of deleting them');
    assertArrayEqual(plan.dates, ['2026-05-30', '2026-05-31', '2026-06-01'], 'The plan should expose the inclusive dates to fill');
});

test('createDateRangeResetState clears inputs and disables apply', () => {
    const resetState = createDateRangeResetState();

    assertEqual(resetState.startDate, '', 'Reset should clear the start date');
    assertEqual(resetState.endDate, '', 'Reset should clear the end date');
    assertEqual(resetState.statusMessage, '', 'Reset should clear the status message');
    assert(resetState.isApplyDisabled, 'Reset should disable the apply button');
});

if (failed > 0) {
    console.error(`\n❌ ${failed} date range test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} date range tests passed.`);
