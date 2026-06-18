const createFakeElement = () => ({
    innerText: '',
    textContent: ''
});

const elementIds = [
    'turnos-count',
    'horas-count',
    'subsidio-transporte',
    'subsidio-transporte-panel',
    'premium-triweekly-total',
    'premium-triweekly-hours',
    'premium-triweekly-periods',
    'festive-extra-value',
    'festive-extra-hours',
    'total-devengado',
    'total-deducciones',
    'neto-a-pagar',
    'salud-empleado',
    'pension-empleado',
    'salud-empresa',
    'pension-empresa',
    'total-empleado',
    'total-empresa',
    'turnos-body',
    'turno-contador',
    'empty-state',
    'deduccion-nomina',
    'deduccion-emi',
    'otras-deducciones',
    'btn-agregar',
    'btn-quitar',
    'theme-toggle'
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

const buildDocument = () => {
    const elements = Object.fromEntries(elementIds.map((id) => [id, createFakeElement()]));
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

test('renderizarResultados keeps premium widgets aligned with store defaults', () => {
    const { document, elements } = buildDocument();
    globalThis.document = document;

    renderer.inicializarElementos();
    renderer.renderizarResultados(structuredClone(resultadosIniciales));

    assertEqual(elements['premium-triweekly-total'].innerText, formatearMoneda(0), 'Triweekly premium card should start at zero');
    assertEqual(elements['premium-triweekly-hours'].innerText, '0.00 h', 'Triweekly premium hours should start at zero');
    assertEqual(elements['premium-triweekly-periods'].innerText, 0, 'Triweekly premium periods should start at zero');
    assertEqual(elements['festive-extra-value'].innerText, formatearMoneda(0), 'Festive extra card should start at zero');
    assertEqual(elements['festive-extra-hours'].innerText, '0.00 h', 'Festive extra hours should start at zero');
});

test('renderizarResultados updates premium widgets with formatted values', () => {
    const { document, elements } = buildDocument();
    globalThis.document = document;

    renderer.inicializarElementos();
    renderer.renderizarResultados({
        ...structuredClone(resultadosIniciales),
        premiumTriweeklyTotal: 25000,
        premiumTriweeklySummary: {
            ...structuredClone(resultadosIniciales.premiumTriweeklySummary),
            excessHours: 8,
            periodsCount: 1
        },
        festiveExtraSummary: {
            ...structuredClone(resultadosIniciales.festiveExtraSummary),
            totalHours: 4,
            totalValue: 97680
        }
    });

    assertEqual(elements['premium-triweekly-total'].innerText, formatearMoneda(25000), 'Triweekly premium card should format the premium total');
    assertEqual(elements['premium-triweekly-hours'].innerText, '8.00 h', 'Triweekly premium hours should format excess hours');
    assertEqual(elements['premium-triweekly-periods'].innerText, 1, 'Triweekly premium periods should render the periods count');
    assertEqual(elements['festive-extra-value'].innerText, formatearMoneda(97680), 'Festive extra card should format the extra value');
    assertEqual(elements['festive-extra-hours'].innerText, '4.00 h', 'Festive extra hours should format the extra hours');
});

if (failed > 0) {
    console.error(`\n❌ ${failed} premium widget test(s) failed. ${passed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${passed} premium widget tests passed.`);
