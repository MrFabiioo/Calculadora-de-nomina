import { TARIFAS_HORA } from '../../src/domain/shifts.js';
import { calculateTriweeklyPremiums, DEFAULT_TRIWEEKLY_CONFIG } from '../../src/domain/triweekly-premiums.js';
import { calcularNomina, calcularSubsidioTransporte, calcularDeducciones, calcularTotalDeducciones } from '../../src/domain/calculations.js';
import { buildExportSummaryLineItems, buildPayrollSheetContent } from '../../src/utils/exporter.js';
import { formatearMoneda } from '../../src/utils/formatters.js';

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
    turno: {
        fecha,
        horaInicio: '06:00 Am',
        horaSalida: '14:00 Pm'
    },
    liquidacion: {
        total: 0,
        horas: breakdown.reduce((sum, segment) => sum + (segment.minutos / 60), 0),
        breakdown
    }
});

console.log('\n--- Tests: triweekly premiums ---');

test('groups dates into dynamic 7-day periods by default', () => {
    const result = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-01-05',
                breakdown: [buildSegment({ fechaNominal: '2026-01-05', categoria: 'ordinario-dia', horas: 8 })]
            })
        ]
    });

    assertEq(result.periods.length, 1, 'should create one period');
    assertEq(result.periods[0].startDate, '2026-01-05', 'should use first worked date as dynamic period start');
    assertEq(result.periods[0].endDate, '2026-01-11', 'should use 7-day period end');
});

test('resolves thresholds before and after schedule transition', () => {
    const preReduction = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-06-30',
                breakdown: [buildSegment({ fechaNominal: '2026-06-30', categoria: 'ordinario-dia', horas: 8 })]
            })
        ]
    });

    const transitionDay = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-07-15',
                breakdown: [buildSegment({ fechaNominal: '2026-07-15', categoria: 'ordinario-dia', horas: 8 })]
            })
        ]
    });

    const periodEndingOnTransitionDay = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-07-09',
                breakdown: [buildSegment({ fechaNominal: '2026-07-09', categoria: 'ordinario-dia', horas: 8 })]
            })
        ]
    });

    const customThreshold = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-07-16',
                breakdown: [buildSegment({ fechaNominal: '2026-07-16', categoria: 'ordinario-dia', horas: 8 })]
            })
        ],
        config: {
            ...DEFAULT_TRIWEEKLY_CONFIG,
            thresholds: [
                { effectiveUntil: '2026-07-14', maxOrdinaryHours: 44 },
                { effectiveFrom: '2026-07-15', maxOrdinaryHours: 40 }
            ]
        }
    });

    assertEq(preReduction.periods[0].threshold, 44, 'should use 44 hours before transition');
    assertEq(transitionDay.periods[0].threshold, 42, 'should use 42 hours on the transition date');
    assertEq(periodEndingOnTransitionDay.periods[0].endDate, '2026-07-15', 'fixture should end on the transition date');
    assertEq(periodEndingOnTransitionDay.periods[0].threshold, 42, 'periods ending on the transition date should use 42 hours');
    assertEq(customThreshold.periods[0].threshold, 40, 'should support custom transition threshold');
});

test('returns no premium when ordinary hours stay within threshold', () => {
    const result = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-01-05',
                breakdown: [buildSegment({ fechaNominal: '2026-01-05', categoria: 'ordinario-dia', horas: 44 })]
            })
        ]
    });

    assertEq(result.premiumValue, 0, 'should not add premium');
    assertEq(result.summary.excessHours, 0, 'should report no excess');
});

test('calculates daytime-only excess at 25%', () => {
    const result = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-01-05',
                breakdown: [buildSegment({ fechaNominal: '2026-01-05', categoria: 'ordinario-dia', horas: 50 })]
            })
        ]
    });

    assertEq(result.periods[0].dayExcessHours, 6, 'should allocate 6 excess day hours');
    assertEq(result.periods[0].nightExcessHours, 0, 'should allocate no excess night hours');
    assertClose(result.premiumValue, 6 * TARIFAS_HORA.diurna * 0.25, 0.01, 'should calculate 25% day premium');
});

test('allocates mixed excess from latest ordinary segments first', () => {
    const result = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-01-10',
                breakdown: [buildSegment({ fechaNominal: '2026-01-10', categoria: 'ordinario-dia', horas: 40, inicio: 6 })]
            }),
            buildShift({
                fecha: '2026-01-14',
                breakdown: [buildSegment({ fechaNominal: '2026-01-14', categoria: 'ordinario-dia', horas: 6, inicio: 8 })]
            }),
            buildShift({
                fecha: '2026-01-16',
                breakdown: [buildSegment({ fechaNominal: '2026-01-16', categoria: 'ordinario-noche', horas: 6, inicio: 20 })]
            })
        ]
    });

    assertEq(result.periods[0].excessHours, 8, 'should detect 8 excess hours');
    assertEq(result.periods[0].dayExcessHours, 2, 'should allocate latest day hours after latest night hours');
    assertEq(result.periods[0].nightExcessHours, 6, 'should allocate latest night segment first');

    const expected = (2 * TARIFAS_HORA.diurna * 0.25) + (6 * TARIFAS_HORA.diurna * 0.75);
    assertClose(result.premiumValue, expected, 0.01, 'should mix day and night premium values');
});

test('calculates EXC NOC premium from base day rate at 75%', () => {
    const result = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-01-05',
                breakdown: [buildSegment({ fechaNominal: '2026-01-05', categoria: 'ordinario-noche', horas: 50, inicio: 20 })]
            })
        ]
    });

    const expected = 6 * TARIFAS_HORA.diurna * 0.75;
    assertEq(result.periods[0].nightExcessHours, 6, 'should allocate night excess hours');
    assertClose(result.premiumValue, expected, 0.01, 'EXC NOC should use day base rate, not nocturnal rate');
});

test('returns empty summary for zero-shift input', () => {
    const result = calculateTriweeklyPremiums({ turnosLiquidados: [] });

    assertEq(result.periods.length, 0, 'should not create periods');
    assertEq(result.summary.periodsCount, 0, 'should not count periods');
    assertEq(result.premiumValue, 0, 'should return zero premium');
});

test('default EXC metadata documents experimental weekly ordinary-only model', () => {
    const result = calculateTriweeklyPremiums({ turnosLiquidados: [] });

    assertEq(result.diagnostics.status, 'experimental', 'default model should be explicitly experimental');
    assertEq(result.diagnostics.modelLabel, 'EXC estimado (experimental)', 'default model should use estimated EXC label');
    assertEq(result.diagnostics.periodDays, 7, 'default model should use weekly blocks');
    assertEq(result.diagnostics.allocationStrategy, 'latest-ordinary-segments-first', 'default model should document latest-segment allocation');
    assertEq(result.diagnostics.includedCategories.join(','), 'ordinario-dia,ordinario-noche', 'default model should include only ordinary categories');
});

test('exposes an audit-friendly premium summary contract', () => {
    const result = calculateTriweeklyPremiums({
        turnosLiquidados: [
            buildShift({
                fecha: '2026-01-05',
                breakdown: [buildSegment({ fechaNominal: '2026-01-05', categoria: 'ordinario-dia', horas: 50 })]
            })
        ]
    });

    assertEq(typeof result.summary.ordinaryHours, 'number', 'ordinaryHours should be numeric');
    assertEq(typeof result.summary.excessHours, 'number', 'excessHours should be numeric');
    assertEq(typeof result.summary.dayPremiumValue, 'number', 'dayPremiumValue should be numeric');
    assertEq(typeof result.summary.nightPremiumValue, 'number', 'nightPremiumValue should be numeric');
    assertEq(typeof result.summary.premiumValue, 'number', 'premiumValue should be numeric');
    assertEq(result.diagnostics.status, 'experimental', 'diagnostics should label the EXC model as experimental');
    assertEq(result.diagnostics.periodDays, 7, 'diagnostics should expose default weekly block size');
    assertEq(result.diagnostics.anchorDate, '2026-01-05', 'diagnostics should expose the actual anchor date used');
    assertEq(result.diagnostics.allocationStrategy, 'latest-ordinary-segments-first', 'diagnostics should expose allocation strategy');
    assertEq(result.diagnostics.includedCategories.join(','), 'ordinario-dia,ordinario-noche', 'diagnostics should expose ordinary-only categories');
});

console.log('\n--- Tests: payroll integration ---');

test('calcularNomina keeps experimental EXC diagnostic-only by default', () => {
    const turnos = [
        { fecha: '2026-01-05', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-06', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-07', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-08', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-09', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-10', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' }
    ];

    const result = calcularNomina({
        turnos,
        triweeklyConfig: {
            anchorDate: '2025-12-28',
            thresholds: [{ effectiveFrom: '2025-12-28', maxOrdinaryHours: 40 }]
        },
        deduccionNomina: 10000,
        deduccionEMI: 5000,
        otrasDeducciones: 2000
    });

    const expectedPremium = 8 * TARIFAS_HORA.diurna * 0.25;
    const expectedTotalTurnos = result.baseTurnosSinPremio;
    const expectedSubsidy = calcularSubsidioTransporte(expectedTotalTurnos, 6);
    const expectedBaseDeducciones = expectedTotalTurnos;
    const expectedDeducciones = calcularDeducciones(expectedBaseDeducciones);
    const expectedTotalDeducciones = calcularTotalDeducciones(
        { nomina: 10000, emi: 5000, otras: 2000 },
        expectedDeducciones
    );
    const expectedDevengadoTotal = expectedTotalTurnos + expectedSubsidy;
    const expectedNeto = expectedDevengadoTotal - expectedTotalDeducciones;

    assertClose(result.premiumTriweeklyTotal, expectedPremium, 0.01, 'should expose premium total');
    assertEq(result.premiumTriweeklyIncluded, false, 'experimental EXC should be excluded from payable totals by default');
    assertClose(result.totalTurnos, expectedTotalTurnos, 0.01, 'should not include experimental EXC in totalTurnos by default');
    assertClose(result.subsidioTransporte, expectedSubsidy, 0.01, 'should evaluate subsidy without diagnostic EXC by default');
    assertClose(result.baseDeducciones, expectedBaseDeducciones, 0.01, 'should use payable base without diagnostic EXC by default');
    assertClose(result.totalDeducciones, expectedTotalDeducciones, 0.01, 'should recompute deductions after premium');
    assertClose(result.devengadoTotal, expectedDevengadoTotal, 0.01, 'should recompute earned total after premium');
    assertClose(result.netoPagar, expectedNeto, 0.01, 'should recompute net after premium');
    assertEq(result.premiumTriweeklySummary.periods.length, 1, 'should attach detailed premium periods');
});

test('calcularNomina preserves explicit opt-in to include triweekly EXC in payable totals', () => {
    const turnos = [
        { fecha: '2026-01-05', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-06', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-07', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-08', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-09', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
        { fecha: '2026-01-10', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' }
    ];

    const result = calcularNomina({
        turnos,
        triweeklyConfig: {
            anchorDate: '2025-12-28',
            includeInPayable: true,
            thresholds: [{ effectiveFrom: '2025-12-28', maxOrdinaryHours: 40 }]
        }
    });

    const expectedPremium = 8 * TARIFAS_HORA.diurna * 0.25;

    assertEq(result.premiumTriweeklyIncluded, true, 'explicit opt-in should be preserved');
    assertClose(result.totalTurnos, result.baseTurnosSinPremio + expectedPremium, 0.01, 'explicit opt-in should include EXC in totalTurnos');
    assertClose(result.baseDeducciones, result.totalTurnos, 0.01, 'explicit opt-in should include EXC in deductions base');
});

console.log('\n--- Tests: export reconciliation ---');

test('export summary line items exclude diagnostic triweekly premium by default and reconcile with devengadoTotal', () => {
    const lineItems = buildExportSummaryLineItems({
        baseTurnosSinPremio: 100000,
        premiumTriweeklyTotal: 25000,
        subsidioTransporte: 12000,
        devengadoTotal: 112000,
        premiumTriweeklyIncluded: false
    });

    assertEq(lineItems.length, 2, 'should emit base and subsidy payable line items');
    assertEq(lineItems.some((item) => item.label.includes('EXC')), false, 'diagnostic EXC should not be a payable summary line item by default');
    assertEq(
        lineItems.reduce((sum, item) => sum + item.value, 0),
        112000,
        'should reconcile exported summary line items with devengadoTotal'
    );
});

test('export summary line items include payable triweekly EXC when explicitly opted in and reconcile with devengadoTotal', () => {
    const result = calcularNomina({
        turnos: [
            { fecha: '2026-01-05', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-06', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-07', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-08', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-09', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-10', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' }
        ],
        triweeklyConfig: {
            anchorDate: '2025-12-28',
            includeInPayable: true,
            thresholds: [{ effectiveFrom: '2025-12-28', maxOrdinaryHours: 40 }]
        }
    });

    const lineItems = buildExportSummaryLineItems(result);
    const excLineItem = lineItems.find((item) => item.label.includes('EXC'));

    assertEq(result.premiumTriweeklyIncluded, true, 'fixture should exercise the payable EXC opt-in path');
    assertEq(Boolean(excLineItem), true, 'payable EXC should be exported as a summary line item');
    assertClose(excLineItem.value, result.premiumTriweeklyTotal, 0.01, 'payable EXC line item should use the calculated premium');
    assertClose(
        lineItems.reduce((sum, item) => sum + item.value, 0),
        result.devengadoTotal,
        0.01,
        'payable summary line items should reconcile with devengadoTotal'
    );
});

test('payroll sheet content renders premium summary rows when premiums exist', () => {
    const sheet = buildPayrollSheetContent({
        turnos: [],
        deducciones: {},
        resultados: {
            cantidadTurnos: 1,
            cantidadHoras: 8,
            diasDescanso: 0,
            baseTurnosSinPremio: 100000,
            premiumTriweeklyTotal: 25000,
            premiumTriweeklyIncluded: false,
            totalTurnos: 100000,
            subsidioTransporte: 12000,
            devengadoTotal: 112000,
            totalDeducciones: 0,
            netoPagar: 112000,
            premiumTriweeklySummary: {
                periodsCount: 1,
                ordinaryHours: 140,
                excessHours: 8,
                dayExcessHours: 8,
                nightExcessHours: 0,
                dayPremiumValue: 25000,
                nightPremiumValue: 0,
                premiumValue: 25000
            },
            ptsExcessExperimentalTotal: 18420,
            ptsExcessExperimentalSummary: {
                periodsCount: 1,
                ordinaryHours: 104,
                thresholdHours: 44,
                excessHours: 60,
                dayExcessHours: 60,
                nightExcessHours: 0,
                dayPremiumValue: 18420,
                nightPremiumValue: 0,
                premiumValue: 18420
            },
            ptsExcessExperimentalPeriods: [{ code: 'PTS8' }]
        },
        turnosLiquidados: [],
        breakdownAgregado: {
            ordinario: { horasDia: 8, horasNoche: 0, valor: 100000 },
            festivo: { horasDia: 0, horasNoche: 0, valor: 0 },
            total: { horas: 8, valor: 100000 }
        },
        fechaGeneracion: new Date('2026-01-20T00:00:00Z')
    });

    const premiumRow = sheet.find((row) => row[0] === 'TOTAL EXC ESTIMADO DIAGNÓSTICO');
    const ptsDiagnosticRow = sheet.find((row) => row[0] === 'TOTAL EXC PTS DIAGNÓSTICO');
    const breakdownPremiumRow = sheet.find((row) => row[0] === 'EXC estimado diagnóstico (no incluido)' && row.length === 5);
    const totalEarnedRow = sheet.find((row) => row[0] === 'TOTAL DEVENGADO');
    const netPayRow = sheet.find((row) => row[0] === 'SALARIO NETO A PAGAR');

    assertEq(Boolean(premiumRow), true, 'should render premium row in summary section');
    assertEq(Boolean(ptsDiagnosticRow), true, 'should render persisted PTS diagnostic summary rows');
    assertEq(Boolean(breakdownPremiumRow), true, 'should render premium row in breakdown section');
    assertEq(Boolean(totalEarnedRow), true, 'should keep earned total row for reconciliation');
    assertEq(totalEarnedRow[1], netPayRow[1], 'fixture with zero deductions should reconcile earned total and net pay');
});

test('payroll sheet content exports explicitly included triweekly EXC as payable and reconciles totals', () => {
    const result = calcularNomina({
        turnos: [
            { fecha: '2026-01-05', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-06', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-07', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-08', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-09', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' },
            { fecha: '2026-01-10', horaInicio: '06:00 Am', horaSalida: '14:00 Pm' }
        ],
        triweeklyConfig: {
            anchorDate: '2025-12-28',
            includeInPayable: true,
            thresholds: [{ effectiveFrom: '2025-12-28', maxOrdinaryHours: 40 }]
        }
    });

    const sheet = buildPayrollSheetContent({
        turnos: [],
        deducciones: {},
        resultados: result,
        turnosLiquidados: result.turnosLiquidados,
        breakdownAgregado: {
            ordinario: { horasDia: 48, horasNoche: 0, valor: result.baseTurnosSinPremio },
            festivo: { horasDia: 0, horasNoche: 0, valor: 0 },
            total: { horas: 48, valor: result.baseTurnosSinPremio }
        },
        fechaGeneracion: new Date('2026-01-20T00:00:00Z')
    });

    const exportedExcLineItem = sheet.find((row) => row[0] === 'EXC estimado (experimental)' && row.length === 2);
    const includedPremiumSummaryRow = sheet.find((row) => row[0] === 'TOTAL EXC ESTIMADO INCLUIDO');
    const diagnosticPremiumSummaryRow = sheet.find((row) => row[0] === 'TOTAL EXC ESTIMADO DIAGNÓSTICO');
    const includedBreakdownRow = sheet.find((row) => row[0] === 'EXC estimado (experimental)' && row.length === 5);
    const diagnosticBreakdownRow = sheet.find((row) => row[0] === 'EXC estimado diagnóstico (no incluido)');
    const totalWithExcRow = sheet.find((row) => row[0] === 'TOTAL + EXC estimado');
    const totalEarnedRow = sheet.find((row) => row[0] === 'TOTAL DEVENGADO');
    const netPayRow = sheet.find((row) => row[0] === 'SALARIO NETO A PAGAR');

    assertEq(result.premiumTriweeklyIncluded, true, 'fixture should exercise the payable EXC opt-in path');
    assertEq(Boolean(exportedExcLineItem), true, 'summary section should export EXC as a payable line item');
    assertEq(exportedExcLineItem[1], formatearMoneda(result.premiumTriweeklyTotal), 'summary EXC line should export the premium value');
    assertEq(Boolean(includedPremiumSummaryRow), true, 'premium summary should label opted-in EXC as included');
    assertEq(Boolean(diagnosticPremiumSummaryRow), false, 'premium summary should not label opted-in EXC as diagnostic-only');
    assertEq(Boolean(includedBreakdownRow), true, 'breakdown section should label opted-in EXC as payable');
    assertEq(Boolean(diagnosticBreakdownRow), false, 'breakdown section should not label opted-in EXC as no incluido');
    assertEq(totalWithExcRow[4], formatearMoneda(result.totalTurnos), 'breakdown total with EXC should reconcile with totalTurnos');
    assertEq(totalEarnedRow[1], formatearMoneda(result.devengadoTotal), 'earned total should export devengadoTotal');
    assertEq(netPayRow[1], formatearMoneda(result.netoPagar), 'net pay should export netoPagar');
});

if (testsFailed > 0) {
    console.log(`\n❌ ${testsFailed} test(s) failed. ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${testsPassed} tests passed.`);
