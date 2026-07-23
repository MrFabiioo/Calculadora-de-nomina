import { getState, resultadosIniciales, setState, store } from '../../src/state/store.js';

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

console.log('\n--- Tests: app result state contract ---');

test('app result state preserves explicit triweekly EXC opt-in for export', () => {
    store.resetState();

    setState({
        resultados: {
            ...structuredClone(resultadosIniciales),
            premiumTriweeklyTotal: 25000,
            premiumTriweeklyIncluded: true,
            totalTurnos: 125000,
            devengadoTotal: 137000
        }
    });

    if (resultadosIniciales.premiumTriweeklyIncluded !== false) {
        throw new Error('initial result state should default EXC inclusion to diagnostic-only');
    }
    if (getState().resultados.premiumTriweeklyIncluded !== true) {
        throw new Error('stored result state should preserve explicit EXC inclusion for export consumers');
    }
});

if (testsFailed > 0) {
    console.log(`\n❌ ${testsFailed} test(s) failed. ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${testsPassed} tests passed.`);
