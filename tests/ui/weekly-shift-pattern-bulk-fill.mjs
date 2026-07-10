import { applyWeeklyShiftPattern, buildWeeklyShiftPatternMessage } from '../../src/ui/weekly-shift-pattern-bulk-fill.js';
import { getWeekdayKeyFromDate, getWeeklyShiftPatternUiState } from '../../src/utils/weekly-shift-pattern.js';

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

const createHarness = () => {
    const rows = [
        { date: '2026-07-06', hourStart: 'Selecciona un horario', hourEnd: 'Selecciona un horario', incapacity: false },
        { date: '2026-07-07', hourStart: 'Selecciona un horario', hourEnd: 'Selecciona un horario', incapacity: true },
        { date: '', hourStart: 'Selecciona un horario', hourEnd: 'Selecciona un horario', incapacity: false },
        { date: '2026-07-12', hourStart: '09:00 Am', hourEnd: '17:00 Pm', incapacity: false }
    ];
    let recalculations = 0;
    let clearButtonUpdates = 0;

    return {
        rows,
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
        },
        getRecalculations: () => recalculations,
        getClearButtonUpdates: () => clearButtonUpdates
    };
};

test('getWeekdayKeyFromDate normalizes accented weekday names', () => {
    assertEqual(getWeekdayKeyFromDate('2026-07-08'), 'miercoles', 'Wednesday should normalize accents');
    assertEqual(getWeekdayKeyFromDate('2026-07-12'), 'domingo', 'Sunday should resolve correctly');
});

test('getWeeklyShiftPatternUiState validates partial and descanso mismatch input', () => {
    const partial = getWeeklyShiftPatternUiState({
        lunes: { startTime: '6:00 Am', endTime: 'Selecciona un horario' }
    });
    const restMismatch = getWeeklyShiftPatternUiState({
        martes: { startTime: 'Descanso', endTime: '6:00 Am' }
    });

    assertEqual(partial.statusType, 'error', 'Partial configuration should be invalid');
    assertEqual(restMismatch.statusType, 'error', 'Mixed descanso configuration should be invalid');
});

test('applyWeeklyShiftPattern updates only dated rows with configured weekdays', () => {
    const harness = createHarness();
    const originalSundayRow = { ...harness.rows[3] };
    const originalIncapacity = harness.rows[1].incapacity;

    const result = applyWeeklyShiftPattern({
        patternByDay: {
            lunes: { startTime: '6:00 Am', endTime: '14:00 Pm' },
            martes: { startTime: '14:00 Pm', endTime: '22:00 Pm' }
        },
        ...harness
    });

    assert(result.applied, 'Configured weekdays should be applied');
    assertArrayEqual(
        harness.rows.slice(0, 2).map((row) => [row.hourStart, row.hourEnd]),
        [['6:00 Am', '14:00 Pm'], ['14:00 Pm', '22:00 Pm']],
        'Matching weekdays should receive the configured hours'
    );
    assertEqual(harness.rows[1].incapacity, originalIncapacity, 'Applying hours should preserve incapacity');
    assertEqual(harness.rows[2].hourStart, 'Selecciona un horario', 'Rows without dates should stay untouched');
    assertEqual(harness.rows[3].hourStart, originalSundayRow.hourStart, 'Rows without configured weekday should stay untouched');
    assertEqual(result.rowsWithoutDate, 1, 'Rows without dates should be counted');
    assertEqual(result.rowsWithoutPattern, 1, 'Rows without configured pattern should be counted');
    assertEqual(harness.getRecalculations(), 1, 'Applying the pattern should recalculate once');
    assertEqual(harness.getClearButtonUpdates(), 1, 'Applying the pattern should update clear button state once');
});

test('applyWeeklyShiftPattern allows descanso and surfaces informational skips', () => {
    const harness = createHarness();

    const result = applyWeeklyShiftPattern({
        patternByDay: {
            domingo: { startTime: 'Descanso', endTime: 'Descanso' }
        },
        ...harness
    });

    assert(result.applied, 'Descanso should be accepted as a valid weekly pattern');
    assertEqual(harness.rows[3].hourStart, 'Descanso', 'Sunday rows should receive descanso');
    assertEqual(
        result.statusMessage,
        'Se aplicó la secuencia semanal en 1 fila(s). 1 fila(s) sin fecha y 2 fila(s) sin secuencia configurada quedaron igual.',
        'Status output should report applied and skipped rows'
    );
});

test('applyWeeklyShiftPattern does not recalculate when no row can be updated', () => {
    const harness = createHarness();

    const result = applyWeeklyShiftPattern({
        patternByDay: {
            jueves: { startTime: '7:00 Am', endTime: '15:00 Pm' }
        },
        ...harness
    });

    assert(!result.applied, 'No matching weekday should leave the operation without applied rows');
    assertEqual(harness.getRecalculations(), 0, 'No applied rows should avoid recalculation');
    assertEqual(harness.getClearButtonUpdates(), 0, 'No applied rows should avoid clear button updates');
});

test('buildWeeklyShiftPatternMessage formats empty and applied variants', () => {
    assertEqual(
        buildWeeklyShiftPatternMessage({ appliedCount: 0, rowsWithoutDate: 2, rowsWithoutPattern: 1 }),
        'No se actualizaron filas. 2 fila(s) sin fecha y 1 fila(s) sin secuencia configurada quedaron igual.',
        'Empty apply message should explain skipped rows'
    );
    assertEqual(
        buildWeeklyShiftPatternMessage({ appliedCount: 3, rowsWithoutDate: 0, rowsWithoutPattern: 0 }),
        'Se aplicó la secuencia semanal en 3 fila(s).',
        'Applied message should stay concise when nothing is skipped'
    );
});

if (failed > 0) {
    console.error(`\n❌ ${failed} weekly shift bulk-fill test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} weekly shift bulk-fill tests passed.`);
