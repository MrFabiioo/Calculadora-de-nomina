import { TARIFAS_HORA } from '../../src/domain/shifts.js';
import { liquidarTurnoPorTramos } from '../../src/domain/payroll-breakdown.js';

let testsPassed = 0;
let testsFailed = 0;

const test = (name, fn) => {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        testsFailed++;
    }
};

const assertEq = (actual, expected, message) => {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
};

const assertClose = (actual, expected, tolerance = 0.01, message = 'Value mismatch') => {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
};

const compactBreakdown = (turno) => liquidarTurnoPorTramos(turno).breakdown.map((segment) => ({
    fechaNominal: segment.fechaNominal,
    inicio: segment.inicio,
    fin: segment.fin,
    horas: segment.minutos / 60,
    categoria: segment.categoria
}));

console.log('\n--- Tests: cross-midnight festive segmentation ---');

test('Saturday 22:00 to Sunday 06:00 prices by segment date', () => {
    const result = liquidarTurnoPorTramos({ fecha: '2026-04-04', horaInicio: '22:00 Pm', horaSalida: '06:00 Am' });
    const expected = (2 * TARIFAS_HORA.nocturna) + (6 * TARIFAS_HORA.nocturnaFestiva);

    assertClose(result.total, expected, 0.01, 'Saturday-to-Sunday total should split ordinary and Sunday night');
    assertEq(JSON.stringify(compactBreakdown({ fecha: '2026-04-04', horaInicio: '22:00 Pm', horaSalida: '06:00 Am' })), JSON.stringify([
        { fechaNominal: '2026-04-04', inicio: 22, fin: 0, horas: 2, categoria: 'ordinario-noche' },
        { fechaNominal: '2026-04-05', inicio: 0, fin: 6, horas: 6, categoria: 'festivo-noche' }
    ]), 'Saturday-to-Sunday breakdown should use each segment date');
});

test('Sunday 22:00 to ordinary Monday 06:00 prices by segment date', () => {
    const result = liquidarTurnoPorTramos({ fecha: '2026-04-05', horaInicio: '22:00 Pm', horaSalida: '06:00 Am' });
    const expected = (2 * TARIFAS_HORA.nocturnaFestiva) + (6 * TARIFAS_HORA.nocturna);

    assertClose(result.total, expected, 0.01, 'Sunday-to-Monday total should split Sunday and ordinary night');
    assertEq(JSON.stringify(compactBreakdown({ fecha: '2026-04-05', horaInicio: '22:00 Pm', horaSalida: '06:00 Am' })), JSON.stringify([
        { fechaNominal: '2026-04-05', inicio: 22, fin: 24, horas: 2, categoria: 'festivo-noche' },
        { fechaNominal: '2026-04-06', inicio: 0, fin: 6, horas: 6, categoria: 'ordinario-noche' }
    ]), 'Sunday-to-Monday breakdown should use each segment date');
});

test('holiday 22:00 to ordinary next day 06:00 prices by segment date', () => {
    const result = liquidarTurnoPorTramos({ fecha: '2026-04-03', horaInicio: '22:00 Pm', horaSalida: '06:00 Am' });
    const expected = (2 * TARIFAS_HORA.nocturnaFestiva) + (6 * TARIFAS_HORA.nocturna);

    assertClose(result.total, expected, 0.01, 'holiday-to-ordinary total should split festive and ordinary night');
    assertEq(JSON.stringify(compactBreakdown({ fecha: '2026-04-03', horaInicio: '22:00 Pm', horaSalida: '06:00 Am' })), JSON.stringify([
        { fechaNominal: '2026-04-03', inicio: 22, fin: 24, horas: 2, categoria: 'festivo-noche' },
        { fechaNominal: '2026-04-04', inicio: 0, fin: 6, horas: 6, categoria: 'ordinario-noche' }
    ]), 'holiday-to-ordinary breakdown should use each segment date');
});

test('exact 00:00, 06:00 and 19:00 boundaries keep legal categories', () => {
    assertEq(JSON.stringify(compactBreakdown({ fecha: '2026-04-07', horaInicio: '12:00 Am', horaSalida: '06:00 Am' })), JSON.stringify([
        { fechaNominal: '2026-04-07', inicio: 0, fin: 6, horas: 6, categoria: 'ordinario-noche' }
    ]), '00:00-06:00 should be ordinary night');
    assertEq(JSON.stringify(compactBreakdown({ fecha: '2026-04-07', horaInicio: '06:00 Am', horaSalida: '19:00 Pm' })), JSON.stringify([
        { fechaNominal: '2026-04-07', inicio: 6, fin: 19, horas: 13, categoria: 'ordinario-dia' }
    ]), '06:00-19:00 should be ordinary day');
    assertEq(JSON.stringify(compactBreakdown({ fecha: '2026-04-07', horaInicio: '19:00 Pm', horaSalida: '00:00 Am' })), JSON.stringify([
        { fechaNominal: '2026-04-07', inicio: 19, fin: 0, horas: 5, categoria: 'ordinario-noche' }
    ]), '19:00-00:00 should be ordinary night');
});

if (testsFailed > 0) {
    console.log(`\n❌ ${testsFailed} test(s) failed. ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${testsPassed} tests passed.`);
