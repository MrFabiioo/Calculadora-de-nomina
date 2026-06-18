import { applyDateRangeBulkFill, buildDateRangeSuccessMessage } from '../../src/ui/date-range-bulk-fill.js';

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

const createRows = (count) => Array.from({ length: count }, (_, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, '0')}`,
    hourStart: `0${(index % 9) + 1}:00`.slice(-5),
    hourEnd: `1${(index % 9) + 1}:00`.slice(-5),
    incapacity: index % 2 === 0
}));

const createHarness = (initialRowCount) => {
    const rows = createRows(initialRowCount);
    let recalculations = 0;
    let clearButtonUpdates = 0;

    return {
        rows,
        getExistingRowCount: () => rows.length,
        ensureRowCount: (requiredRowCount) => {
            while (rows.length < requiredRowCount) {
                rows.push({
                    date: '',
                    hourStart: '07:00',
                    hourEnd: '15:00',
                    incapacity: false
                });
            }
        },
        applyDateToRow: (rowIndex, date) => {
            rows[rowIndex - 1].date = date;
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

test('applyDateRangeBulkFill applies inclusive dates in order and adds missing rows', () => {
    const harness = createHarness(1);

    const originalHourStart = harness.rows[0].hourStart;
    const originalHourEnd = harness.rows[0].hourEnd;
    const originalIncapacity = harness.rows[0].incapacity;

    const result = applyDateRangeBulkFill({
        startDate: '2026-05-30',
        endDate: '2026-06-02',
        ...harness
    });

    assert(result.applied, 'The valid range should be applied');
    assertEqual(harness.rows.length, 4, 'Missing rows should be added to match the inclusive range length');
    assertArrayEqual(
        harness.rows.slice(0, 4).map((row) => row.date),
        ['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02'],
        'Inclusive dates should be applied in order'
    );
    assertEqual(harness.rows[0].hourStart, originalHourStart, 'Existing start hour should be preserved');
    assertEqual(harness.rows[0].hourEnd, originalHourEnd, 'Existing end hour should be preserved');
    assertEqual(harness.rows[0].incapacity, originalIncapacity, 'Existing incapacity should be preserved');
    assertEqual(harness.getRecalculations(), 1, 'The flow should recalculate once after applying the range');
    assertEqual(harness.getClearButtonUpdates(), 1, 'The flow should update the clear button once after applying the range');
});

test('applyDateRangeBulkFill leaves extra rows untouched beyond the planned range', () => {
    const harness = createHarness(5);
    const untouchedRowsBefore = harness.rows.slice(3).map((row) => ({ ...row }));

    const result = applyDateRangeBulkFill({
        startDate: '2026-05-30',
        endDate: '2026-06-01',
        ...harness
    });

    assert(result.applied, 'The valid range should be applied');
    assertEqual(result.plan.untouchedRowCount, 2, 'The plan should report untouched extra rows');
    assertArrayEqual(
        harness.rows.slice(3).map((row) => row.date),
        untouchedRowsBefore.map((row) => row.date),
        'Extra rows should keep their original dates'
    );
    assertArrayEqual(
        harness.rows.slice(3).map((row) => row.hourStart),
        untouchedRowsBefore.map((row) => row.hourStart),
        'Extra rows should keep their original start hours'
    );
    assertArrayEqual(
        harness.rows.slice(3).map((row) => row.hourEnd),
        untouchedRowsBefore.map((row) => row.hourEnd),
        'Extra rows should keep their original end hours'
    );
    assertArrayEqual(
        harness.rows.slice(3).map((row) => row.incapacity),
        untouchedRowsBefore.map((row) => row.incapacity),
        'Extra rows should keep their original incapacity values'
    );
    assertEqual(
        result.statusMessage,
        'Se completaron 3 fechas desde 2026-05-30 hasta 2026-06-01. 2 fila(s) adicional(es) no se modificaron.',
        'Success output should explain that extra rows were left untouched'
    );
});

test('applyDateRangeBulkFill reports the simple success message when no extra rows exist', () => {
    const harness = createHarness(3);

    const result = applyDateRangeBulkFill({
        startDate: '2026-05-30',
        endDate: '2026-06-01',
        ...harness
    });

    assertEqual(result.statusType, 'success', 'The valid apply result should be a success');
    assertEqual(
        result.statusMessage,
        'Se completaron 3 fechas desde 2026-05-30 hasta 2026-06-01.',
        'Success output should match the visible message contract'
    );
});

test('applyDateRangeBulkFill does not apply changes for invalid input', () => {
    const harness = createHarness(2);
    const beforeRows = harness.rows.map((row) => ({ ...row }));

    const result = applyDateRangeBulkFill({
        startDate: '2026-06-29',
        endDate: '2026-05-30',
        ...harness
    });

    assert(!result.applied, 'Invalid input should not apply changes');
    assertEqual(result.statusType, 'error', 'Invalid input should return an error state');
    assertEqual(result.statusMessage, 'La fecha inicial no puede ser posterior a la fecha final', 'Invalid input should surface the validation message');
    assertArrayEqual(harness.rows, beforeRows, 'Rows should remain unchanged after invalid input');
    assertEqual(harness.getRecalculations(), 0, 'Invalid input should not recalculate');
    assertEqual(harness.getClearButtonUpdates(), 0, 'Invalid input should not update the clear button');
});

test('applyDateRangeBulkFill does not report success when a row application fails', () => {
    const harness = createHarness(2);
    const beforeSecondRow = { ...harness.rows[1] };

    harness.applyDateToRow = (rowIndex, date) => {
        if (rowIndex === 2) {
            return false;
        }

        harness.rows[rowIndex - 1].date = date;
        return true;
    };

    const result = applyDateRangeBulkFill({
        startDate: '2026-05-30',
        endDate: '2026-06-01',
        ...harness
    });

    assert(!result.applied, 'A row application failure should not report success');
    assertEqual(result.statusType, 'error', 'A row application failure should return an error state');
    assertEqual(result.statusMessage, 'No se pudieron completar todas las fechas del rango. Revisá las filas e intentá de nuevo.', 'A row application failure should surface the failure message');
    assertEqual(harness.rows[0].date, '2026-05-30', 'Rows before the failure may still be updated');
    assertEqual(harness.rows[1].date, beforeSecondRow.date, 'The failing row should remain unchanged');
    assertEqual(harness.getRecalculations(), 0, 'A row application failure should not recalculate');
    assertEqual(harness.getClearButtonUpdates(), 0, 'A row application failure should not update the clear button');
});

test('buildDateRangeSuccessMessage formats both success variants', () => {
    const simpleMessage = buildDateRangeSuccessMessage({
        startDate: '2026-05-30',
        endDate: '2026-06-01',
        untouchedRowCount: 0,
        appliedCount: 3
    });

    const untouchedMessage = buildDateRangeSuccessMessage({
        startDate: '2026-05-30',
        endDate: '2026-06-01',
        untouchedRowCount: 2,
        appliedCount: 3
    });

    assertEqual(simpleMessage, 'Se completaron 3 fechas desde 2026-05-30 hasta 2026-06-01.', 'The simple success message should match the visible contract');
    assertEqual(untouchedMessage, 'Se completaron 3 fechas desde 2026-05-30 hasta 2026-06-01. 2 fila(s) adicional(es) no se modificaron.', 'The untouched success message should match the visible contract');
});

if (failed > 0) {
    console.error(`\n❌ ${failed} date range bulk-fill test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} date range bulk-fill tests passed.`);
