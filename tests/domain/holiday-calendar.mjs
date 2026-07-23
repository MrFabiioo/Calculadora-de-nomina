import { esFestivo, esDomingo } from '../../src/domain/holidays.js';

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

console.log('\n--- Tests: Colombian holiday calendar ---');

test('Semana Santa 2025 marks Thursday and Friday as holidays', () => {
    assertEq(esFestivo('2025-04-17'), true, 'Maundy Thursday 2025 should be a legal holiday');
    assertEq(esFestivo('2025-04-18'), true, 'Good Friday 2025 should be a legal holiday');
});

test('Semana Santa 2025 does not mark Monday Apr 14 as holiday', () => {
    assertEq(esFestivo('2025-04-14'), false, 'Monday Apr 14 2025 should not be a legal holiday');
    assertEq(esDomingo('2025-04-14'), false, 'Monday Apr 14 2025 should not be treated as Sunday');
});

test('2025 moved Monday holidays around June/July match the official calendar', () => {
    assertEq(esFestivo('2025-06-30'), true, 'June 30 2025 should be a national holiday');
    assertEq(esFestivo('2025-07-13'), false, 'July 13 2025 should not be listed as a legal holiday');
});

if (testsFailed > 0) {
    console.log(`\n❌ ${testsFailed} test(s) failed. ${testsPassed} passed.`);
    process.exit(1);
}

console.log(`\n✅ All ${testsPassed} tests passed.`);
