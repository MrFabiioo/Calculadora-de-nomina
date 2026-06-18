import { TARIFAS_HORA } from '../../src/domain/shifts.js';
import { applyFestiveExtraPremiums } from '../../src/domain/festive-extra-premiums.js';
import { liquidarTurnoPorTramos, aggregateShiftBreakdown } from '../../src/domain/payroll-breakdown.js';
import { calcularNomina } from '../../src/domain/calculations.js';
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

const buildSegment = ({ categoria, inicio, fin, fechaNominal = '2026-01-01' }) => ({
    categoria,
    inicio,
    fin,
    fechaNominal,
    minutos: (fin - inicio) * 60
});

console.log('\n--- Tests: festive extra premiums ---');

test('keeps exactly 8 festive hours as base only', () => {
    const result = applyFestiveExtraPremiums([
        buildSegment({ categoria: 'festivo-dia', inicio: 8, fin: 16 })
    ]);

    assertEq(result.length, 1, 'should keep a single segment');
    assertEq(result[0].categoria, 'festivo-dia', 'should keep base festive category');
    assertEq(result[0].minutos, 480, 'should keep all 8 hours as base');
});

test('reclassifies festive daytime overflow after 8 hours', () => {
    const result = applyFestiveExtraPremiums([
        buildSegment({ categoria: 'festivo-dia', inicio: 8, fin: 18 })
    ]);

    assertEq(result.length, 2, 'should split threshold-crossing segment');
    assertEq(result[0].categoria, 'festivo-dia', 'should keep first part as base');
    assertEq(result[1].categoria, 'festivo-dia-extra', 'should retag overflow as festive extra day');
    assertEq(result[0].minutos, 480, 'should keep first 8 hours as base');
    assertEq(result[1].minutos, 120, 'should move last 2 hours into extra');
});

test('reclassifies nighttime festive overflow chronologically', () => {
    const result = applyFestiveExtraPremiums([
        buildSegment({ categoria: 'festivo-dia', inicio: 14, fin: 19 }),
        buildSegment({ categoria: 'festivo-noche', inicio: 19, fin: 23 })
    ]);

    assertEq(result.length, 4, 'should split the festive span at day/night and threshold boundaries');
    assertEq(result[0].minutos, 300, 'should keep first 5 daytime hours');
    assertEq(result[1].categoria, 'festivo-dia', 'should keep the next 2 hours as festive day');
    assertEq(result[1].minutos, 120, 'should keep 2 more daytime base hours before night starts');
    assertEq(result[2].categoria, 'festivo-noche', 'should keep threshold-reaching night hour as base');
    assertEq(result[2].minutos, 60, 'should keep 1 night hour as base before overflow');
    assertEq(result[3].categoria, 'festivo-noche-extra', 'should classify final hour as festive night extra');
    assertEq(result[3].minutos, 60, 'should leave 1 overflow hour');
});

test('splits a segment exactly at the threshold boundary', () => {
    const result = applyFestiveExtraPremiums([
        buildSegment({ categoria: 'festivo-dia', inicio: 8, fin: 15 }),
        buildSegment({ categoria: 'festivo-dia', inicio: 15, fin: 17 })
    ]);

    assertEq(result.length, 3, 'should split only the crossing segment');
    assertEq(result[1].minutos, 60, 'should keep 1 hour as base on crossing segment');
    assertEq(result[2].categoria, 'festivo-dia-extra', 'should retag the remainder as extra');
    assertEq(result[2].minutos, 60, 'should leave 1 extra hour after threshold');
});

test('resets festive accumulation when fechaNominal changes across days', () => {
    const result = applyFestiveExtraPremiums([
        buildSegment({ categoria: 'festivo-dia', inicio: 8, fin: 18, fechaNominal: '2026-01-01' }),
        buildSegment({ categoria: 'festivo-dia', inicio: 8, fin: 18, fechaNominal: '2026-01-02' })
    ]);

    assertEq(result.length, 4, 'should split both days independently at the daily threshold');
    assertEq(result[0].categoria, 'festivo-dia', 'should keep day one base festive hours');
    assertEq(result[1].categoria, 'festivo-dia-extra', 'should classify day one overflow as festive extra');
    assertEq(result[2].categoria, 'festivo-dia', 'should reset the counter for day two base festive hours');
    assertEq(result[3].categoria, 'festivo-dia-extra', 'should classify only day two overflow as festive extra');
    assertEq(result[2].minutos, 480, 'should restore 8 base festive hours on the new nominal date');
    assertEq(result[3].minutos, 120, 'should keep only the day two overflow as extra');
});

console.log('\n--- Tests: evidence scenarios ---');

test('Maria Jose scenario keeps triweekly premium isolated', () => {
    const liquidacion = liquidarTurnoPorTramos({
        fecha: '2026-01-04',
        horaInicio: '8:00 Am',
        horaSalida: '20:00 Pm'
    });
    const breakdownAgregado = aggregateShiftBreakdown([{ breakdown: liquidacion.breakdown }]);

    assertClose(
        liquidacion.breakdown
            .filter(seg => seg.categoria === 'festivo-dia')
            .reduce((sum, seg) => sum + (seg.minutos / 60), 0),
        8,
        0.01,
        'should keep 8 base festive day hours'
    );
    assertClose(
        liquidacion.breakdown
            .filter(seg => seg.categoria === 'festivo-dia-extra')
            .reduce((sum, seg) => sum + (seg.minutos / 60), 0),
        4,
        0.01,
        'should add 4 festive day extra hours'
    );
    assertClose(breakdownAgregado.festivo.horasDia, 8, 0.01, 'should keep 8 base festive day hours');
    assertClose(breakdownAgregado.festivoExtra.horasDia, 4, 0.01, 'should expose 4 festive extra day hours');
    assertClose(breakdownAgregado.festivoExtra.valor, 4 * TARIFAS_HORA.festivaExtraDiurna, 0.01, 'should price festive extra day correctly');

    const nomina = calcularNomina({ turnos: [{ fecha: '2026-01-04', horaInicio: '8:00 Am', horaSalida: '20:00 Pm' }] });
    assertClose(nomina.premiumTriweeklyTotal, 0, 0.01, 'should not interfere with triweekly premium');
});

test('Claudia scenario keeps exact 8 festive hours without extras', () => {
    const nomina = calcularNomina({
        turnos: [{ fecha: '2026-01-01', horaInicio: '8:00 Am', horaSalida: '16:00 Pm' }]
    });

    assertClose(nomina.festiveExtraSummary.dayHours, 0, 0.01, 'should keep zero extra day hours');
    assertClose(nomina.festiveExtraSummary.nightHours, 0, 0.01, 'should keep zero extra night hours');
    assertClose(nomina.festiveExtraSummary.totalValue, 0, 0.01, 'should keep zero festive extra value');
});

console.log('\n--- Tests: payroll/export integration ---');

test('calcularNomina exposes festive extra summary and export reconciles', () => {
    const resultados = calcularNomina({
        turnos: [{ fecha: '2026-01-04', horaInicio: '8:00 Am', horaSalida: '20:00 Pm' }]
    });

    assertClose(resultados.festiveExtraSummary.dayHours, 4, 0.01, 'should expose festive extra day hours');
    assertClose(resultados.festiveExtraSummary.totalValue, 4 * TARIFAS_HORA.festivaExtraDiurna, 0.01, 'should expose festive extra total');

    const lineItems = buildExportSummaryLineItems(resultados);
    const festiveExtraItem = lineItems.find(item => item.label === 'Festivo Extra');
    assertEq(Boolean(festiveExtraItem), true, 'should include festive extra summary line item');
    assertClose(festiveExtraItem.value, resultados.festiveExtraSummary.totalValue, 0.01, 'should preserve festive extra summary value');
    assertClose(
        lineItems.reduce((sum, item) => sum + item.value, 0),
        resultados.devengadoTotal,
        0.01,
        'should reconcile summary line items with devengado total without double counting festive extra'
    );

    const sheet = buildPayrollSheetContent({
        turnos: [],
        deducciones: {},
        resultados,
        turnosLiquidados: resultados.turnosLiquidados,
        breakdownAgregado: aggregateShiftBreakdown(resultados.turnosLiquidados.map(item => item.liquidacion)),
        fechaGeneracion: new Date('2026-01-20T00:00:00Z')
    });

    assertEq(Boolean(sheet.find(row => row[0] === 'Festivo extra')), true, 'should render festive extra breakdown row');
    assertEq(Boolean(sheet.find(row => row[0] === 'Festivo Extra')), true, 'should render festive extra summary row');
    assertEq(
        sheet.find(row => row[0] === 'Subtotal Turnos Base')?.[1],
        formatearMoneda(resultados.baseTurnosSinPremio - resultados.festiveExtraSummary.totalValue),
        'should export the base subtotal without festive extra double counting'
    );
});

if (testsFailed > 0) {
    console.log(`\n❌ ${testsFailed} test(s) failed. ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${testsPassed} festive extra tests passed.`);
