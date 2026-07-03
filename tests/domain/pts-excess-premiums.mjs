import { TARIFAS_HORA } from '../../src/domain/shifts.js';
import { liquidarTurnoPorTramos } from '../../src/domain/payroll-breakdown.js';
import { calculatePtsExcessPremiums } from '../../src/domain/pts-excess-premiums.js';
import { PTS_CALENDAR_2026 } from '../../src/domain/pts-calendar.js';
import { calcularNomina } from '../../src/domain/calculations.js';

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

const buildSegment = ({ fechaNominal, categoria, horas, inicio = 6 }) => ({
    fechaNominal,
    categoria,
    minutos: horas * 60,
    inicio,
    fin: inicio + horas,
    valor: 0,
    tarifa: categoria === 'ordinario-noche' ? TARIFAS_HORA.nocturna : TARIFAS_HORA.diurna
});

const buildShift = ({ fecha, breakdown }) => ({
    turno: { fecha, horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
    liquidacion: {
        total: 0,
        horas: breakdown.reduce((sum, segment) => sum + (segment.minutos / 60), 0),
        breakdown
    }
});

const liquidateTurns = (turnos) => turnos.map((turno) => ({
    turno,
    liquidacion: liquidarTurnoPorTramos(turno)
}));

console.log('\n--- Tests: PTS excess premiums ---');

test('official 2026 PTS calendar uses validated 21-day PTS6-PTS9 windows', () => {
    const expectedRanges = [
        ['PTS6', '2026-04-12', '2026-05-02'],
        ['PTS7', '2026-05-03', '2026-05-23'],
        ['PTS8', '2026-05-24', '2026-06-13'],
        ['PTS9', '2026-06-14', '2026-07-04']
    ];

    expectedRanges.forEach(([code, startDate, endDate]) => {
        const pts = PTS_CALENDAR_2026.find((period) => period.code === code);

        assertEq(pts.startDate, startDate, `${code} start date should match official calendar`);
        assertEq(pts.endDate, endDate, `${code} end date should match official calendar`);
    });
});

test('María José synthetic PTS8 fixture yields 22h excess split as 19 day and 3 night', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-30' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-01',
                breakdown: [buildSegment({ fechaNominal: '2026-06-01', categoria: 'ordinario-dia', horas: 88, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-06-12',
                breakdown: [buildSegment({ fechaNominal: '2026-06-12', categoria: 'ordinario-dia', horas: 16, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-06-13',
                breakdown: [
                    buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-dia', horas: 3, inicio: 8 }),
                    buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-noche', horas: 3, inicio: 20 })
                ]
            })
        ]
    });

    const pts8 = result.periods.find((period) => period.code === 'PTS8');

    assertEq(pts8.liquidatedDays, 14, 'PTS8 liquidated range should include 14 days');
    assertEq(pts8.thresholdHours, 88, 'PTS8 threshold should be two full weeks at 44h');
    assertEq(pts8.ordinaryHours, 110, 'PTS8 ordinary hours should match fixture');
    assertEq(pts8.excessHours, 22, 'PTS8 excess should be 22 hours');
    assertEq(pts8.dayExcessHours, 19, 'latest allocation should leave 19 day excess hours');
    assertEq(pts8.nightExcessHours, 3, 'latest allocation should allocate 3 night excess hours');
});

test('María José synthetic PTS8 fixture with exact June payroll uses 13-day official intersection', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-06-01', endDate: '2026-06-30' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-01',
                breakdown: [buildSegment({ fechaNominal: '2026-06-01', categoria: 'ordinario-dia', horas: 88, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-06-12',
                breakdown: [buildSegment({ fechaNominal: '2026-06-12', categoria: 'ordinario-dia', horas: 16, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-06-13',
                breakdown: [
                    buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-dia', horas: 3, inicio: 8 }),
                    buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-noche', horas: 3, inicio: 20 })
                ]
            })
        ]
    });

    const pts8 = result.periods.find((period) => period.code === 'PTS8');

    assertEq(pts8.ptsStartDate, '2026-05-24', 'PTS8 should keep official start date');
    assertEq(pts8.ptsEndDate, '2026-06-13', 'PTS8 should keep official end date');
    assertEq(pts8.liquidatedStartDate, '2026-06-01', 'exact June payroll should start the liquidated PTS8 range on June 1');
    assertEq(pts8.liquidatedEndDate, '2026-06-13', 'exact June payroll should end the liquidated PTS8 range on PTS8 end');
    assertEq(pts8.liquidatedDays, 13, 'exact June payroll should intersect PTS8 for 13 days');
    assertEq(pts8.fullLiquidatedWeeks, 1, '13 liquidated days should only count one full week');
    assertEq(pts8.thresholdHours, 44, '13 liquidated days should use a 44h threshold');
    assertEq(pts8.excessHours, 66, 'diagnostic should expose the overproduction implied by a Jun1-Jun30 payroll period');
});

test('calcularNomina honors explicit exact June payroll period for PTS diagnostics', () => {
    const turnos = [
        '2026-05-31',
        '2026-06-01',
        '2026-06-02',
        '2026-06-03',
        '2026-06-04',
        '2026-06-05',
        '2026-06-06',
        '2026-06-07',
        '2026-06-08',
        '2026-06-09',
        '2026-06-10',
        '2026-06-11',
        '2026-06-12',
        '2026-06-13'
    ].map((fecha) => ({ fecha, horaInicio: '06:00 Am', horaSalida: '14:00 Pm' }));

    const result = calcularNomina({
        turnos,
        payrollPeriod: { startDate: '2026-06-01', endDate: '2026-06-30' }
    });
    const pts8 = result.ptsExcessExperimentalPeriods.find((period) => period.code === 'PTS8');

    assertEq(result.ptsExcessExperimentalSummary.diagnostics.payrollPeriod.source, 'input', 'calcularNomina should pass explicit payrollPeriod into PTS diagnostics');
    assertEq(pts8.liquidatedStartDate, '2026-06-01', 'exact June payroll should not derive May 31 from loaded shifts');
    assertEq(pts8.liquidatedEndDate, '2026-06-13', 'exact June payroll should intersect PTS8 through its official end');
    assertEq(pts8.liquidatedDays, 13, 'exact June payroll should evaluate only 13 days of PTS8');
    assertEq(pts8.thresholdHours, 44, '13 liquidated days should use a one-week threshold in calcularNomina');
});

test('María José synthetic PTS8 fixture can derive a 14-day liquidated range from loaded shifts including May 31', () => {
    const result = calculatePtsExcessPremiums({
        turnosLiquidados: [
            buildShift({ fecha: '2026-05-31', breakdown: [] }),
            buildShift({
                fecha: '2026-06-01',
                breakdown: [buildSegment({ fechaNominal: '2026-06-01', categoria: 'ordinario-dia', horas: 88, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-06-12',
                breakdown: [buildSegment({ fechaNominal: '2026-06-12', categoria: 'ordinario-dia', horas: 16, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-06-13',
                breakdown: [
                    buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-dia', horas: 3, inicio: 8 }),
                    buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-noche', horas: 3, inicio: 20 })
                ]
            })
        ]
    });

    const pts8 = result.periods.find((period) => period.code === 'PTS8');

    assertEq(result.diagnostics.payrollPeriod.source, 'derived-from-liquidated-shifts', 'omitted payrollPeriod should derive the liquidated range from loaded shifts');
    assertEq(pts8.liquidatedStartDate, '2026-05-31', 'loaded May 31 shift should extend the derived liquidated PTS8 range');
    assertEq(pts8.liquidatedDays, 14, 'May31-Jun13 should provide two full liquidated weeks');
    assertEq(pts8.thresholdHours, 88, '14 liquidated days should use an 88h threshold');
    assertEq(pts8.excessHours, 22, 'derived May31-Jun13 range should reproduce the 22h diagnostic fixture');
});

test('Paola-style PTS fixture below 88h does not create a false positive', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-13' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-05',
                breakdown: [buildSegment({ fechaNominal: '2026-06-05', categoria: 'ordinario-dia', horas: 85 })]
            })
        ]
    });

    assertEq(result.summary.excessHours, 0, '85 ordinary hours should stay within the 88h PTS8 threshold');
    assertEq(result.premiumValue, 0, 'no premium should be emitted');
});

test('Bernal-style PTS fixture below 88h does not create a false positive', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-13' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-05',
                breakdown: [buildSegment({ fechaNominal: '2026-06-05', categoria: 'ordinario-dia', horas: 72 })]
            })
        ]
    });

    assertEq(result.summary.excessHours, 0, '72 ordinary hours should stay within the 88h PTS8 threshold');
    assertEq(result.premiumValue, 0, 'no premium should be emitted');
});

test('Luna-style PTS fixture below 88h does not create a false positive', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-13' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-05',
                breakdown: [buildSegment({ fechaNominal: '2026-06-05', categoria: 'ordinario-dia', horas: 80 })]
            })
        ]
    });

    assertEq(result.summary.excessHours, 0, '80 ordinary hours should stay within the 88h PTS8 threshold');
    assertEq(result.premiumValue, 0, 'no premium should be emitted');
});

test('festive and festive-extra categories are ignored by the PTS excess model', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-13' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-05',
                breakdown: [
                    buildSegment({ fechaNominal: '2026-06-05', categoria: 'ordinario-dia', horas: 80 }),
                    buildSegment({ fechaNominal: '2026-06-06', categoria: 'festivo-dia', horas: 20 }),
                    buildSegment({ fechaNominal: '2026-06-07', categoria: 'festivo-noche-extra', horas: 20 })
                ]
            })
        ]
    });

    assertEq(result.summary.ordinaryHours, 80, 'only ordinary segments should count');
    assertEq(result.summary.excessHours, 0, 'ignored festive hours should not create excess');
});

test('EXC NOC pricing uses base day rate at 75%', () => {
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-13' },
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-13',
                breakdown: [buildSegment({ fechaNominal: '2026-06-13', categoria: 'ordinario-noche', horas: 100, inicio: 20 })]
            })
        ]
    });

    const expected = 12 * TARIFAS_HORA.diurna * 0.75;

    assertEq(result.summary.nightExcessHours, 12, '100h night ordinary over 88h should allocate 12h night excess');
    assertClose(result.premiumValue, expected, 0.01, 'EXC NOC should use the day base rate, not the nocturnal rate');
});

test('Michelle June fixture is diagnostic and does not force-match the visible 1h EXC DIU payslip', () => {
    const regularTurns = [
        ['2026-05-30', '08:00 Am', '15:00 Pm'],
        ['2026-05-31', '14:00 Pm', '22:00 Pm'],
        ['2026-06-01', '06:00 Am', '14:00 Pm'],
        ['2026-06-02', '14:00 Pm', '22:00 Pm'],
        ['2026-06-03', '06:00 Am', '12:00 m'],
        ['2026-06-04', 'Descanso', 'Descanso'],
        ['2026-06-05', '15:00 Pm', '21:00 Pm'],
        ['2026-06-06', '08:00 Am', '15:00 Pm'],
        ['2026-06-07', '13:00 Pm', '21:00 Pm'],
        ['2026-06-08', 'Descanso', 'Descanso'],
        ['2026-06-09', '14:00 Pm', '22:00 Pm'],
        ['2026-06-10', '15:00 Pm', '21:00 Pm'],
        ['2026-06-11', '14:00 Pm', '22:00 Pm'],
        ['2026-06-12', '15:00 Pm', '21:00 Pm'],
        ['2026-06-13', '08:00 Am', '15:00 Pm'],
        ['2026-06-14', '15:00 Pm', '21:00 Pm'],
        ['2026-06-15', 'Descanso', 'Descanso'],
        ['2026-06-16', '14:00 Pm', '22:00 Pm'],
        ['2026-06-17', '07:00 Am', '13:00 Pm'],
        ['2026-06-18', '14:00 Pm', '22:00 Pm'],
        ['2026-06-19', '15:00 Pm', '21:00 Pm'],
        ['2026-06-20', '08:00 Am', '15:00 Pm'],
        ['2026-06-21', '15:00 Pm', '21:00 Pm'],
        ['2026-06-22', 'Descanso', 'Descanso'],
        ['2026-06-23', '14:00 Pm', '22:00 Pm'],
        ['2026-06-24', '06:00 Am', '12:00 m'],
        ['2026-06-25', '14:00 Pm', '22:00 Pm'],
        ['2026-06-26', '15:00 Pm', '21:00 Pm'],
        ['2026-06-27', '08:00 Am', '15:00 Pm'],
        ['2026-06-28', '05:00 Am', '13:00 Pm'],
        ['2026-06-29', 'Descanso', 'Descanso']
    ].map(([fecha, horaInicio, horaSalida]) => ({ fecha, horaInicio, horaSalida }));
    const extraTurns = [
        ['2026-06-08', '15:00 Pm', '23:00 Pm'],
        ['2026-06-12', '07:00 Am', '15:00 Pm'],
        ['2026-06-15', '08:00 Am', '15:00 Pm']
    ].map(([fecha, horaInicio, horaSalida]) => ({ fecha, horaInicio, horaSalida }));
    const result = calculatePtsExcessPremiums({
        payrollPeriod: { startDate: '2026-05-31', endDate: '2026-06-30' },
        turnosLiquidados: liquidateTurns([...regularTurns, ...extraTurns])
    });

    assertEq(result.summary.diagnostics.status, 'experimental', 'Michelle comparison should remain labeled diagnostic');
    assertEq(result.summary.excessHours, 0, 'current diagnostic output should be documented for Michelle');
    assertEq(result.summary.dayExcessHours, 0, 'current diagnostic day split should be documented for Michelle');
    assertEq(result.summary.nightExcessHours, 0, 'current diagnostic night split should be documented for Michelle');
});

if (testsFailed > 0) {
    console.log(`\n❌ ${testsFailed} test(s) failed. ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${testsPassed} tests passed.`);
