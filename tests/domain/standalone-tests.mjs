/**
 * Tests unitarios para segments.js y payroll-breakdown.js
 * 
 * Versión standalone que no depende de imports del proyecto.
 * Ejecutar con: node tests/domain/standalone-tests.mjs
 */

import { FESTIVOS, esFestivo, esDomingo, toLocalDate } from '../../src/domain/holidays.js';
import { parseHora, cruzaMedianoche, esFranquiciaDiurna, TARIFAS_HORA } from '../../src/domain/shifts.js';
import { normalizeShiftInput, segmentShift, classifySegment, processShift } from '../../src/domain/segments.js';
import { liquidarTurnoPorTramos, aggregateShiftBreakdown, convertirAgregadoALegacy } from '../../src/domain/payroll-breakdown.js';

// ============================================
// Utilidades de testing
// ============================================

let testsPassed = 0;
let testsFailed = 0;

const test = (name, fn) => {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (e) {
        console.log(`❌ ${name}: ${e.message}`);
        testsFailed++;
    }
};

const assertEq = (actual, expected, message) => {
    if (actual !== expected) {
        throw new Error(`${message || 'Value mismatch'}: expected ${expected}, got ${actual}`);
    }
};

const assertClose = (actual, expected, tolerance = 0.01, message) => {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
        throw new Error(`${message || 'Value mismatch'}: expected ${expected}, got ${actual} (diff: ${diff})`);
    }
};

const assertArrayLength = (arr, len, message) => {
    if (!Array.isArray(arr) || arr.length !== len) {
        throw new Error(`${message || 'Array length mismatch'}: expected ${len}, got ${arr?.length || 'N/A'}`);
    }
};

// ============================================
// Tests: normalizeShiftInput
// ============================================

console.log('\n--- Tests: normalizeShiftInput ---');

test('normalizeShiftInput - turno normal mismo día', () => {
    const result = normalizeShiftInput({
        fecha: '2025-04-14',  // lunes
        horaInicio: '14:00',
        horaSalida: '22:00',
        incapacidad: false
    });
    
    assertEq(result.horaInicio, 14, 'horaInicio should be 14');
    assertEq(result.horaSalida, 22, 'horaSalida should be 22');
    assertEq(result.esDescanso, false, 'should not be descanso');
    assertEq(result.cruzaMedianoche, false, 'should not cross midnight');
});

test('normalizeShiftInput - turno cruza medianoche', () => {
    const result = normalizeShiftInput({
        fecha: '2025-04-14',
        horaInicio: '22:00',
        horaSalida: '06:00',
        incapacidad: false
    });
    
    assertEq(result.horaInicio, 22, 'horaInicio should be 22');
    assertEq(result.horaSalida, 6, 'horaSalida should be 6');
    assertEq(result.cruzaMedianoche, true, 'should cross midnight');
});

test('normalizeShiftInput - descanso', () => {
    const result = normalizeShiftInput({
        fecha: '2025-04-14',
        horaInicio: 'Descanso',
        horaSalida: 'Descanso',
        incapacidad: false
    });
    
    assertEq(result.esDescanso, true, 'should be descanso');
    assertEq(result.horaInicio, null, 'horaInicio should be null');
    assertEq(result.horaSalida, null, 'horaSalida should be null');
});

// ============================================
// Tests: segmentShift
// ============================================

console.log('\n--- Tests: segmentShift ---');

test('segmentShift - turno simple sin cruce', () => {
    const normalized = normalizeShiftInput({
        fecha: '2025-04-14',
        horaInicio: '14:00',
        horaSalida: '22:00'
    });
    
    const result = segmentShift(normalized, ['midnight']);
    
    assertArrayLength(result, 1, 'should have 1 segment');
    assertEq(result[0].minutos, 480, 'should have 480 minutes (8 hours)');
    assertEq(result[0].inicio, 14, 'segment start should be 14');
    assertEq(result[0].fin, 22, 'segment end should be 22');
});

test('segmentShift - turno cruza medianoche', () => {
    const normalized = normalizeShiftInput({
        fecha: '2025-04-14',
        horaInicio: '22:00',
        horaSalida: '06:00'
    });
    
    const result = segmentShift(normalized, ['midnight']);
    
    assertArrayLength(result, 2, 'should have 2 segments (before and after midnight)');
    
    // Primer segmento: 22:00 a 24:00 (2 horas)
    assertEq(result[0].minutos, 120, 'first segment should have 120 min');
    assertEq(result[0].inicio, 22, 'first segment start');
    assertEq(result[0].fin, 24, 'first segment end');
    
    // Segundo segmento: 00:00 a 06:00 (6 horas)
    assertEq(result[1].minutos, 360, 'second segment should have 360 min');
    assertEq(result[1].inicio, 0, 'second segment start');
    assertEq(result[1].fin, 6, 'second segment end');
});

test('segmentShift - descanso retorna array vacío', () => {
    const normalized = normalizeShiftInput({
        fecha: '2025-04-14',
        horaInicio: 'Descanso',
        horaSalida: 'Descanso'
    });
    
    const result = segmentShift(normalized, ['midnight']);
    
    assertArrayLength(result, 0, 'descanso should return empty array');
});

// ============================================
// Tests: classifySegment
// ============================================

console.log('\n--- Tests: classifySegment ---');

test('classifySegment - día ordinario', () => {
    const segment = {
        inicio: 14,
        fechaNominal: '2025-04-14'  // lunes
    };
    
    const result = classifySegment(segment);
    
    assertEq(result.esFestivo, false, 'should not be festivo');
    assertEq(result.esDomingo, false, 'should not be domingo');
    assertEq(result.categoria, 'ordinario-dia', 'should be ordinario-dia');
});

test('classifySegment - domingo', () => {
    const segment = {
        inicio: 14,
        fechaNominal: '2025-04-13'  // domingo
    };
    
    const result = classifySegment(segment);
    
    assertEq(result.esDomingo, true, 'should be domingo');
    assertEq(result.esFestivo, true, 'domingo counts as festivo for tariffs');
    assertEq(result.categoria, 'festivo-dia', 'should be festivo-dia');
});

test('classifySegment - festivo', () => {
    const segment = {
        inicio: 14,
        fechaNominal: '2025-04-18'  // festivo (Viernes Santo)
    };
    
    const result = classifySegment(segment);
    
    assertEq(result.esFestivo, true, 'should be festivo');
    assertEq(result.categoria, 'festivo-dia', 'should be festivo-dia');
});

test('classifySegment - nocturno ordinario', () => {
    const segment = {
        inicio: 22,
        fechaNominal: '2025-04-14'  // lunes
    };
    
    const result = classifySegment(segment);
    
    assertEq(result.esNocturno, true, 'should be nocturno');
    assertEq(result.categoria, 'ordinario-noche', 'should be ordinario-noche');
});

test('classifySegment - nocturno festivo', () => {
    const segment = {
        inicio: 22,
        fechaNominal: '2025-04-18'  // festivo
    };
    
    const result = classifySegment(segment);
    
    assertEq(result.esNocturno, true, 'should be nocturno');
    assertEq(result.esFestivo, true, 'should be festivo');
    assertEq(result.categoria, 'festivo-noche', 'should be festivo-noche');
});

// ============================================
// Tests: processShift (pipeline completo)
// ============================================

console.log('\n--- Tests: processShift ---');

test('processShift - turno normal día', () => {
    const result = processShift({
        fecha: '2025-04-14',
        horaInicio: '14:00',
        horaSalida: '22:00'
    });
    
    assert(result.segmentos, 'should have segmentos');
    assertArrayLength(result.segmentos, 1, 'should have 1 segment');
    assertEq(result.segmentos[0].categoria, 'ordinario-dia', 'should be ordinario-dia');
    assertEq(result.segmentos[0].minutos, 480, 'should have 480 min');
});

test('processShift - turno cruce medianoche', () => {
    const result = processShift({
        fecha: '2025-04-14',  // lunes
        horaInicio: '22:00',
        horaSalida: '06:00'
    });
    
    assertArrayLength(result.segmentos, 2, 'should have 2 segments');
    
    // Primer segmento: 22:00-24:00 del lunes (ordinario-noche)
    assertEq(result.segmentos[0].categoria, 'ordinario-noche', 'first segment should be ordinario-noche');
    assertEq(result.segmentos[0].minutos, 120, 'first segment should have 120 min');
    
    // Segundo segmento: 00:00-06:00 del martes (ordinario-noche)
    assertEq(result.segmentos[1].categoria, 'ordinario-noche', 'second segment should be ordinario-noche');
    assertEq(result.segmentos[1].minutos, 360, 'second segment should have 360 min');
});

test('processShift - turno en domingo que cruza medianoche', () => {
    const result = processShift({
        fecha: '2025-04-13',  // domingo
        horaInicio: '22:00',
        horaSalida: '06:00'
    });
    
    assertArrayLength(result.segmentos, 2, 'should have 2 segments');
    
    // Primer segmento: 22:00-24:00 del domingo (festivo-noche)
    assertEq(result.segmentos[0].esFestivo, true, 'first segment should be festivo');
    assertEq(result.segmentos[0].categoria, 'festivo-noche', 'first segment should be festivo-noche');
    
    // Segundo segmento: 00:00-06:00 del lunes (ordinario-noche)
    assertEq(result.segmentos[1].esFestivo, false, 'second segment should not be festivo');
    assertEq(result.segmentos[1].categoria, 'ordinario-noche', 'second segment should be ordinario-noche');
});

// ============================================
// Tests: liquidarTurnoPorTramos
// ============================================

console.log('\n--- Tests: liquidarTurnoPorTramos ---');

test('liquidarTurnoPorTramos - descanso', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-14',
        horaInicio: 'Descanso',
        horaSalida: 'Descanso'
    });
    
    assertEq(result.total, 0, 'total should be 0');
    assertEq(result.horas, 0, 'horas should be 0');
    assertEq(result.breakdown.length, 0, 'breakdown should be empty');
});

test('liquidarTurnoPorTramos - turno ordinario día', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-14',  // lunes
        horaInicio: '08:00',
        horaSalida: '18:00'
    });
    
    assertEq(result.horas, 10, 'should have 10 horas');
    
    const expectedValue = 10 * TARIFAS_HORA.diurna;
    assertClose(result.total, expectedValue, 1, 'total should match diurnal rate');
    
    assert(result.breakdown.length > 0, 'should have breakdown');
    assertEq(result.breakdown[0].categoria, 'ordinario-dia', 'should be ordinario-dia');
});

test('liquidarTurnoPorTramos - turno festivo', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-18',  // festivo
        horaInicio: '08:00',
        horaSalida: '18:00'
    });
    
    const expectedValue = 10 * TARIFAS_HORA.diurnaFestiva;
    assertClose(result.total, expectedValue, 1, 'total should match festivo rate');
    
    assertEq(result.breakdown[0].categoria, 'festivo-dia', 'should be festivo-dia');
});

test('liquidarTurnoPorTramos - turno domingo', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-13',  // domingo
        horaInicio: '08:00',
        horaSalida: '18:00'
    });
    
    const expectedValue = 10 * TARIFAS_HORA.diurnaFestiva;
    assertClose(result.total, expectedValue, 1, 'total should match festivo rate');
    
    assertEq(result.breakdown[0].categoria, 'festivo-dia', 'domingo should use festivo rate');
});

test('liquidarTurnoPorTramos - turno nocturno', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-14',  // lunes
        horaInicio: '22:00',
        horaSalida: '06:00'
    });
    
    assertEq(result.breakdown.length, 2, 'should have 2 segments');
    assertEq(result.horas, 8, 'should have 8 horas');
    
    assertEq(result.breakdown[0].categoria, 'ordinario-noche', 'first segment should be nocturno');
    assertEq(result.breakdown[1].categoria, 'ordinario-noche', 'second segment should be nocturno');
    
    const expectedValue = 8 * TARIFAS_HORA.nocturna;
    assertClose(result.total, expectedValue, 1, 'total should match nocturnal rate');
});

test('liquidarTurnoPorTramos - turno con incapacidad', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-14',
        horaInicio: '08:00',
        horaSalida: '18:00',
        incapacidad: true
    });
    
    const normalTotal = 10 * TARIFAS_HORA.diurna;
    const expectedTotal = normalTotal * (2 / 3);
    
    assertClose(result.total, expectedTotal, 1, 'total should be 2/3 for incapacidad');
    assertEq(result.incapacidad, true, 'should preserve incapacidad flag');
});

test('liquidarTurnoPorTramos - turno cruza medianoche de domingo a lunes', () => {
    const result = liquidarTurnoPorTramos({
        fecha: '2025-04-13',  // domingo
        horaInicio: '22:00',
        horaSalida: '06:00'
    });
    
    assertEq(result.horas, 8, 'should have 8 horas');
    assertEq(result.breakdown.length, 2, 'should have 2 segments');
    
    // Primer segmento: 22:00-24:00 domingo (festivo-noche)
    assertEq(result.breakdown[0].categoria, 'festivo-noche', 'first segment should be festivo-noche');
    assertEq(result.breakdown[0].fechaNominal, '2025-04-13', 'first segment date should be sunday');
    
    // Segundo segmento: 00:00-06:00 lunes (ordinario-noche)
    assertEq(result.breakdown[1].categoria, 'ordinario-noche', 'second segment should be ordinario-noche');
    assertEq(result.breakdown[1].fechaNominal, '2025-04-14', 'second segment date should be monday');
    
    // Valor esperado: 2h festivo-noche + 6h ordinario-noche
    const expectedValue = (2 * TARIFAS_HORA.nocturnaFestiva) + (6 * TARIFAS_HORA.nocturna);
    assertClose(result.total, expectedValue, 1, 'total should match mixed rates');
});

// ============================================
// Tests: aggregateShiftBreakdown
// ============================================

console.log('\n--- Tests: aggregateShiftBreakdown ---');

test('aggregateShiftBreakdown - turnos vacíos', () => {
    const result = aggregateShiftBreakdown([]);
    
    assertEq(result.ordinario.horasDia, 0, 'ordinario horasDia should be 0');
    assertEq(result.ordinario.valor, 0, 'ordinario valor should be 0');
    assertEq(result.total.horas, 0, 'total horas should be 0');
});

test('aggregateShiftBreakdown - turnos mixtos', () => {
    const turnos = [
        {
            total: 125000,
            horas: 8,
            breakdown: [{ categoria: 'ordinario-dia', minutos: 480, valor: 125000 }]
        },
        {
            total: 200000,
            horas: 8,
            breakdown: [{ categoria: 'festivo-noche', minutos: 480, valor: 200000 }]
        }
    ];
    
    const result = aggregateShiftBreakdown(turnos);
    
    assertEq(result.ordinario.valor, 125000, 'ordinario should have 125000');
    assertEq(result.festivo.valor, 200000, 'festivo should have 200000');
    assertEq(result.total.valor, 325000, 'total should be 325000');
});

// ============================================
// Tests: convertirAgregadoALegacy
// ============================================

console.log('\n--- Tests: convertirAgregadoALegacy ---');

test('convertirAgregadoALegacy - formato correcto', () => {
    const agregado = {
        ordinario: { horasDia: 8, horasNoche: 4, valor: 200000 },
        festivo: { horasDia: 2, horasNoche: 2, valor: 100000 },
        total: { horas: 16, valor: 300000 }
    };
    
    const result = convertirAgregadoALegacy(agregado);
    
    assertEq(result.totalTurnos, 300000, 'totalTurnos should be 300000');
    assertEq(result.totalHoras, 16, 'totalHoras should be 16');
    assertEq(result.horasDiurnas, 10, 'horasDiurnas should be 8+2');
    assertEq(result.horasNocturnas, 6, 'horasNocturnas should be 4+2');
});

// ============================================
// Verificación de holidays.js
// ============================================

console.log('\n--- Tests: holidays.js ---');

test('esFestivo - verificación', () => {
    // 2025-04-18 es festivo
    assert(esFestivo('2025-04-18'), '2025-04-18 should be festivo');
    // 2025-04-14 no es festivo
    assert(!esFestivo('2025-04-14'), '2025-04-14 should not be festivo');
});

test('esDomingo - verificación', () => {
    // 2025-04-13 es domingo
    assert(esDomingo('2025-04-13'), '2025-04-13 should be domingo');
    // 2025-04-14 es lunes
    assert(!esDomingo('2025-04-14'), '2025-04-14 should not be domingo');
});

// ============================================
// Resumen
// ============================================

console.log('\n========================================');
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('========================================');

if (testsFailed > 0) {
    process.exit(1);
} else {
    console.log('\n🎉 Todos los tests pasaron!');
}
