let testsPassed = 0;
let testsFailed = 0;

const test = (name, fn) => {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed += 1;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        testsFailed += 1;
    }
};

const assertDeepEqual = (actual, expected, message) => {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);

    if (actualJson !== expectedJson) {
        throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
    }
};

const legacyPersistedState = {
    turnos: [],
    deducciones: {
        nomina: 0,
        emi: 0,
        otras: 0
    },
    configuracion: {
        tema: 'light',
        triweekly: {
            anchorDate: '2025-12-28',
            thresholds: [
                { effectiveUntil: '2026-07-15', maxOrdinaryHours: 132 },
                { effectiveFrom: '2026-07-16', maxOrdinaryHours: 126 }
            ]
        }
    }
};

globalThis.localStorage = {
    getItem: () => JSON.stringify(legacyPersistedState),
    setItem: () => {},
    removeItem: () => {}
};

const { DEFAULT_TRIWEEKLY_CONFIG } = await import('../../src/domain/triweekly-premiums.js');
const { store } = await import('../../src/state/store.js');

console.log('\n--- Tests: store legacy triweekly config ---');

test('normalizes legacy triweekly config from localStorage to current defaults', () => {
    const state = store.getState();

    assertDeepEqual(
        state.configuracion.triweekly,
        DEFAULT_TRIWEEKLY_CONFIG,
        'legacy persisted triweekly config should load as current defaults'
    );
});

if (testsFailed > 0) {
    console.log(`\n${testsFailed} store test(s) failed, ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n${testsPassed} store test(s) passed.`);
