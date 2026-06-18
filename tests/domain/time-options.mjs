import { TURNOS_INICIO, TURNOS_SALIDA, parseHora, calcularTurno } from '../../src/domain/shifts.js';

let passed = 0;
let failed = 0;

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

const assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
        throw new Error(`${message}. Expected ${expected}, got ${actual}`);
    }
};

const assertIncludes = (collection, value, message) => {
    if (!collection.includes(value)) {
        throw new Error(`${message}. Missing value: ${value}`);
    }
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

test('time options preserve special UX entries', () => {
    assertEqual(TURNOS_INICIO[0], 'Selecciona un horario', 'start options should keep placeholder');
    assertEqual(TURNOS_INICIO[1], 'Descanso', 'start options should keep descanso');
    assertEqual(TURNOS_SALIDA[0], 'Selecciona un horario', 'end options should keep placeholder');
    assertEqual(TURNOS_SALIDA[1], 'Descanso', 'end options should keep descanso');
});

test('time options include every half hour across the full schedule', () => {
    assertEqual(TURNOS_INICIO.length, 50, 'start options should include 48 half-hour slots plus special entries');
    assertEqual(TURNOS_SALIDA.length, 50, 'end options should include 48 half-hour slots plus special entries');
    assertEqual(TURNOS_INICIO[2], '00:30 Am', 'first generated start option should cover overnight half hour');
    assertEqual(TURNOS_INICIO[3], '1:00 Am', 'options should continue in 30-minute order');
    assertEqual(TURNOS_INICIO[4], '1:30 Am', 'options should continue in 30-minute order');
    assertIncludes(TURNOS_INICIO, '12:30 m', 'start options should include noon half hour');
    assertIncludes(TURNOS_INICIO, '20:30 Pm', 'start options should include evening half hour');
    assertIncludes(TURNOS_SALIDA, '23:30 Pm', 'end options should include late-night half hour');
    assertEqual(TURNOS_SALIDA[TURNOS_SALIDA.length - 1], '24:00 Pm', 'last end option should preserve 24:00');
});

test('parseHora supports newly generated overnight labels', () => {
    assertEqual(parseHora('00:30 Am'), 0.5, '00:30 should parse as half past midnight');
    assertEqual(parseHora('1:30 Am'), 1.5, '1:30 should parse correctly');
    assertEqual(parseHora('12:30 m'), 12.5, '12:30 m should parse correctly');
    assertEqual(parseHora('20:30 Pm'), 20.5, '20:30 should parse correctly');
    assertEqual(parseHora('24:00 Pm'), 24, '24:00 should parse as end of day');
    assertEqual(parseHora('24:30 Pm'), null, '24:30 should remain invalid');
});

test('calcularTurno keeps overnight half-hour calculations intact', () => {
    const turno = calcularTurno('23:30 Pm', '00:30 Am');

    assert(turno !== null, 'overnight half-hour turn should be calculable');
    assertEqual(turno.horas, 1, '23:30 to 00:30 should total one hour');
    assert(turno.valor > 0, 'overnight half-hour turn should keep a positive payroll value');
});

console.log('\n========================================');
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log('========================================');

if (failed > 0) {
    process.exit(1);
}

console.log('\n🎉 Time option tests passed!');
