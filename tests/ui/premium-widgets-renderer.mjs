import { readFileSync } from 'node:fs';

const createFakeElement = () => ({
    innerText: '',
    textContent: '',
    value: ''
});

const elementIds = [
    'turnos-count',
    'horas-count',
    'subsidio-transporte',
    'subsidio-transporte-panel',
    'subsidio-transporte-deduccion',
    'subsidio-transporte-hours',
    'pts-excess-diagnostic-total',
    'pts-excess-diagnostic-hours',
    'pts-excess-diagnostic-threshold',
    'pts-excess-diagnostic-periods',
    'total-devengado',
    'total-deducciones',
    'neto-a-pagar',
    'payslip-total-devengado',
    'payslip-total-deducciones',
    'payslip-neto-a-pagar',
    'payslip-saldo-a-cargo',
    'payslip-subsidy-base',
    'payslip-subsidy-balance',
    'payslip-salud-deduction',
    'payslip-salud-base',
    'payslip-salud-balance',
    'payslip-pension-deduction',
    'payslip-pension-base',
    'payslip-pension-balance',
    'payslip-deduccion-nomina',
    'payslip-deduccion-nomina-balance',
    'payslip-deduccion-emi',
    'payslip-deduccion-emi-balance',
    'payslip-otras-deducciones',
    'payslip-otras-deducciones-balance',
    'turnos-body',
    'turno-contador',
    'empty-state',
    'deduccion-nomina',
    'deduccion-emi',
    'otras-deducciones',
    'btn-agregar',
    'btn-quitar',
    'theme-toggle',
    'segment-ord-diu-devengado',
    'segment-ord-diu-deduccion',
    'segment-ord-diu-base',
    'segment-ord-diu-saldo',
    'segment-ord-diu-horas',
    'segment-ord-noc-devengado',
    'segment-ord-noc-deduccion',
    'segment-ord-noc-base',
    'segment-ord-noc-saldo',
    'segment-ord-noc-horas',
    'segment-fes-diu-devengado',
    'segment-fes-diu-deduccion',
    'segment-fes-diu-base',
    'segment-fes-diu-saldo',
    'segment-fes-diu-horas',
    'segment-fes-noc-devengado',
    'segment-fes-noc-deduccion',
    'segment-fes-noc-base',
    'segment-fes-noc-saldo',
    'segment-fes-noc-horas',
    'segment-ord-diu-exc-devengado',
    'segment-ord-diu-exc-label',
    'segment-ord-diu-exc-deduccion',
    'segment-ord-diu-exc-base',
    'segment-ord-diu-exc-saldo',
    'segment-ord-diu-exc-horas',
    'segment-ord-noc-exc-devengado',
    'segment-ord-noc-exc-label',
    'segment-ord-noc-exc-deduccion',
    'segment-ord-noc-exc-base',
    'segment-ord-noc-exc-saldo',
    'segment-ord-noc-exc-horas',
    'segment-fes-diu-exc-devengado',
    'segment-fes-diu-exc-deduccion',
    'segment-fes-diu-exc-base',
    'segment-fes-diu-exc-saldo',
    'segment-fes-diu-exc-horas',
    'segment-fes-noc-exc-devengado',
    'segment-fes-noc-exc-deduccion',
    'segment-fes-noc-exc-base',
    'segment-fes-noc-exc-saldo',
    'segment-fes-noc-exc-horas'
];

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

const assertIncludes = (text, expected, message) => {
    if (!text.includes(expected)) {
        throw new Error(`${message}. Missing ${expected}`);
    }
};

const buildDocument = () => {
    const elements = Object.fromEntries(elementIds.map((id) => [id, createFakeElement()]));
    elements['turnos-body'].querySelectorAll = () => [];
    elements['turnos-body'].children = [];

    return {
        elements,
        document: {
            getElementById: (id) => elements[id] || null
        }
    };
};

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

const renderer = await import('../../src/ui/renderer.js');
const { formatearMoneda } = await import('../../src/utils/formatters.js');
const { resultadosIniciales } = await import('../../src/state/store.js');

test('index.html keeps the visible payslip table contract', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');
    const requiredText = [
        'Concepto',
        'Devengados',
        'Deducciones',
        'Base',
        'Saldo',
        'Nro. Horas',
        'HORA ORD.DIU.PARAMEDICO',
        'HORA ORD.NOC.PARAMEDICO',
        'HORA FES.DIU.PARAMEDICO',
        'HORA FES.NOC.PARAMEDICO',
        'HORA EXC.DIU DIAGNÓSTICO',
        'HORA EXC.NOC DIAGNÓSTICO',
        'HORA FES.DIU EXTRA',
        'HORA FES.NOC EXTRA',
        'Subsidio de transporte',
        'Total Devengados',
        'Total Deducciones',
        'Saldo a Cargo',
        'Neto a Pagar',
        'payslip-totals-grid'
    ];

    requiredText.forEach((text) => {
        assertIncludes(html, text, 'Payslip table should keep required visible text');
    });

    elementIds
        .filter((id) => id.startsWith('segment-') || id.startsWith('payslip-') || id.startsWith('subsidio-transporte'))
        .forEach((id) => {
            assertIncludes(html, `id="${id}"`, 'Payslip table should expose renderer id in real markup');
        });

    assertIncludes(html, '<td colspan="6">', 'Footer totals should occupy the full payslip table width');
    assertIncludes(css, '.payslip-totals-grid', 'Footer totals should use the dedicated totals grid');
    assertIncludes(css, 'grid-template-columns: repeat(4, minmax(150px, 1fr));', 'Footer totals should render as four horizontal columns');
});

test('renderizarResultados keeps zero-value EXC rows visible', () => {
    const { document, elements } = buildDocument();
    globalThis.document = document;

    renderer.inicializarElementos();
    renderer.renderizarResultados(structuredClone(resultadosIniciales));

    assertEqual(elements['segment-ord-diu-exc-devengado'].innerText, formatearMoneda(0), 'Ordinary day EXC row should stay at zero');
    assertEqual(elements['segment-ord-noc-exc-devengado'].innerText, formatearMoneda(0), 'Ordinary night EXC row should stay at zero');
    assertEqual(elements['segment-fes-diu-exc-devengado'].innerText, formatearMoneda(0), 'Festive day extra row should stay at zero');
    assertEqual(elements['segment-fes-noc-exc-devengado'].innerText, formatearMoneda(0), 'Festive night extra row should stay at zero');
    assertEqual(elements['segment-ord-diu-exc-horas'].innerText, '0.00 h', 'Ordinary day EXC hours should stay at zero');
    assertEqual(elements['segment-ord-diu-exc-label'].innerText, 'HORA EXC.DIU DIAGNÓSTICO', 'Default day EXC label should stay diagnostic-only');
    assertEqual(elements['segment-ord-noc-exc-label'].innerText, 'HORA EXC.NOC DIAGNÓSTICO', 'Default night EXC label should stay diagnostic-only');
});

test('renderizarResultados changes EXC labels when triweekly premium is included', () => {
    const { document, elements } = buildDocument();
    globalThis.document = document;

    renderer.inicializarElementos();
    renderer.renderizarResultados({
        ...structuredClone(resultadosIniciales),
        premiumTriweeklyIncluded: true
    });

    assertEqual(elements['segment-ord-diu-exc-label'].innerText, 'HORA EXC.DIU INCLUIDA', 'Included day EXC label should not say diagnostic-only');
    assertEqual(elements['segment-ord-noc-exc-label'].innerText, 'HORA EXC.NOC INCLUIDA', 'Included night EXC label should not say diagnostic-only');
});

test('renderizarResultados aggregates segment rows from result breakdown', () => {
    const { document, elements } = buildDocument();
    globalThis.document = document;

    renderer.inicializarElementos();
    renderer.renderizarResultados({
        ...structuredClone(resultadosIniciales),
        turnosLiquidados: [
            {
                liquidacion: {
                    breakdown: [
                        { categoria: 'ordinario-dia', minutos: 480, valor: 100000 },
                        { categoria: 'ordinario-noche', minutos: 120, valor: 40000 },
                        { categoria: 'festivo-dia', minutos: 180, valor: 90000 },
                        { categoria: 'festivo-noche', minutos: 60, valor: 35000 }
                    ]
                }
            },
            {
                liquidacion: {
                    breakdown: [
                        { categoria: 'ordinario-dia', minutos: 120, valor: 25000 },
                        { categoria: 'festivo-noche', minutos: 120, valor: 70000 }
                    ]
                }
            }
        ],
        premiumTriweeklySummary: {
            ...structuredClone(resultadosIniciales.premiumTriweeklySummary),
            dayExcessHours: 3,
            nightExcessHours: 2,
            dayPremiumValue: 27000,
            nightPremiumValue: 22000
        },
        festiveExtraSummary: {
            ...structuredClone(resultadosIniciales.festiveExtraSummary),
            dayHours: 4,
            nightHours: 1.5,
            dayValue: 97680,
            nightValue: 50120,
            totalHours: 5.5,
            totalValue: 147800
        }
    });

    assertEqual(elements['segment-ord-diu-devengado'].innerText, formatearMoneda(125000), 'Ordinary day row should aggregate value');
    assertEqual(elements['segment-ord-diu-deduccion'].innerText, '', 'Ordinary day deduction cell should stay blank');
    assertEqual(elements['segment-ord-diu-base'].innerText, '', 'Ordinary day base cell should stay blank');
    assertEqual(elements['segment-ord-diu-saldo'].innerText, '', 'Ordinary day balance cell should stay blank');
    assertEqual(elements['segment-ord-diu-horas'].innerText, '10.00 h', 'Ordinary day row should aggregate hours');
    assertEqual(elements['segment-fes-noc-devengado'].innerText, formatearMoneda(105000), 'Festive night row should aggregate value');
    assertEqual(elements['segment-ord-diu-exc-devengado'].innerText, formatearMoneda(27000), 'Ordinary day EXC row should use premium value');
    assertEqual(elements['segment-ord-noc-exc-horas'].innerText, '2.00 h', 'Ordinary night EXC row should use premium hours');
    assertEqual(elements['segment-fes-diu-exc-devengado'].innerText, formatearMoneda(97680), 'Festive day extra row should use festive extra value');
    assertEqual(elements['segment-fes-noc-exc-horas'].innerText, '1.50 h', 'Festive night extra row should use festive extra hours');
});

test('renderizarResultados updates deductions and footer totals', () => {
    const { document, elements } = buildDocument();
    globalThis.document = document;

    elements['deduccion-nomina'].value = '10000';
    elements['deduccion-emi'].value = '5000';
    elements['otras-deducciones'].value = '2500';

    renderer.inicializarElementos();
    renderer.renderizarResultados({
        ...structuredClone(resultadosIniciales),
        premiumTriweeklySummary: {
            ...structuredClone(resultadosIniciales.premiumTriweeklySummary),
            dayExcessHours: 2,
            dayPremiumValue: 50000
        },
        festiveExtraSummary: {
            ...structuredClone(resultadosIniciales.festiveExtraSummary),
            dayHours: 4,
            dayValue: 200000,
            totalHours: 4,
            totalValue: 200000
        },
        subsidioTransporte: 100000,
        devengadoTotal: 1150000,
        baseDeducciones: 1050000,
        totalDeducciones: 101500,
        netoPagar: 1048500,
        saludEmpleado: 42000,
        pensionEmpleado: 42000,
        cantidadHoras: 96,
        cantidadTurnos: 8,
        diasDescanso: 2
    });

    assertEqual(elements['subsidio-transporte'].innerText, formatearMoneda(100000), 'Transport subsidy row should show acquired value');
    assertEqual(elements['subsidio-transporte-deduccion'].innerText, '', 'Transport subsidy deduction cell should stay blank');
    assertEqual(elements['payslip-subsidy-base'].innerText, formatearMoneda(100000), 'Transport subsidy should repeat in base');
    assertEqual(elements['payslip-subsidy-balance'].innerText, '', 'Transport subsidy should not repeat in balance');
    assertEqual(elements['subsidio-transporte-hours'].innerText, '', 'Transport subsidy hours should stay blank');
    assertEqual(elements['payslip-deduccion-nomina'].innerText, formatearMoneda(10000), 'Payroll deduction row should update from DOM');
    assertEqual(elements['payslip-deduccion-nomina-balance'].innerText, '', 'Payroll deduction balance cell should stay blank');
    assertEqual(elements['payslip-deduccion-emi'].innerText, formatearMoneda(5000), 'EMI deduction row should update from DOM');
    assertEqual(elements['payslip-otras-deducciones'].innerText, formatearMoneda(2500), 'Other deduction row should update from DOM');
    assertEqual(elements['payslip-total-devengado'].innerText, formatearMoneda(1150000), 'Total devengados should match results');
    assertEqual(elements['payslip-total-deducciones'].innerText, formatearMoneda(101500), 'Total deducciones should match results');
    assertEqual(elements['payslip-saldo-a-cargo'].innerText, formatearMoneda(0), 'Saldo a cargo should remain an explicit zero total');
    assertEqual(elements['payslip-neto-a-pagar'].innerText, formatearMoneda(1048500), 'Neto a pagar should match results');
});

if (failed > 0) {
    console.error(`\n❌ ${failed} renderer test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} renderer tests passed.`);
