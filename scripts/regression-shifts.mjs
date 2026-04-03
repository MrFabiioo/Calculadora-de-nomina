/**
 * Script de regresión - Fixtures de turnos reales para testing
 * 
 * Casos mínimos obligatorios según SDD Task 6.2:
 * 1. Día normal 08:00-18:00
 * 2. Normal nocturno 22:00-06:00
 * 3. Sábado 22:00 → domingo 06:00 (2h nocturnas normales + 6h nocturnas festivas)
 * 4. Domingo 22:00 → lunes normal 06:00 (2h nocturnas festivas + 6h nocturnas normales)
 * 5. Domingo 22:00 → lunes festivo 06:00 (2h nocturnas festivas + 6h nocturnas festivas)
 * 6. Festivo 22:00 → día normal 06:00 (2h nocturnas festivas + 6h nocturnas normales)
 * 7. Festivo 22:00 → siguiente festivo 06:00 (8h nocturnas festivas)
 * 8. Turno que NO cruza medianoche (ej: 06:00-14:00)
 * 9. Turno en límite exacto 00:00
 * 10. 03/04/2026 (viernes festivo) — el caso bug original
 */

import { TARIFAS_HORA, MEDIA_HORA } from '../src/domain/shifts.js';
import { FESTIVOS, esFestivo, esDomingo } from '../src/domain/holidays.js';
import { compararCalculos, generarReporteRegresion } from '../src/domain/calculations.js';
import { liquidarTurnoPorTramos } from '../src/domain/payroll-breakdown.js';

// ============================================
// CONSTANTES Y HELPERS
// ============================================

const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2
    }).format(valor);
};

const formatearHoras = (horas) => horas.toFixed(2);

// ============================================
// FIXTURES DE TURNOS
// ============================================

const FIXTURES_TURNOS_REGRESION = [
    {
        id: 1,
        descripcion: 'Día normal 08:00-18:00',
        turno: {
            fecha: '2026-04-07', // Martes normal
            horaInicio: '08:00 Am',
            horaSalida: '06:00 Pm',
            incapacidad: false
        },
        esperado: {
            horas: 10,
            tipo: 'ordinario-dia',
            valorAproximado: 10 * TARIFAS_HORA.diurna
        }
    },
    {
        id: 2,
        descripcion: 'Normal nocturno 22:00-06:00',
        turno: {
            fecha: '2026-04-07', // Martes normal
            horaInicio: '10:00 Pm',
            horaSalida: '06:00 Am',
            incapacidad: false
        },
        esperado: {
            horas: 8,
            tipo: 'ordinario-noche',
            valorAproximado: 8 * TARIFAS_HORA.nocturna
        }
    },
    {
        id: 3,
        descripcion: 'Sábado 22:00 → domingo 06:00 (2h nocturnas normales + 6h nocturnas festivas)',
        turno: {
            fecha: '2026-04-04', // Sábado
            horaInicio: '10:00 Pm',
            horaSalida: '06:00 Am',
            incapacidad: false
        },
        esperado: {
            horas: 8,
            // 2h nocturnas ordinarias (22:00-00:00 del sábado) + 6h nocturnas festivas (00:00-06:00 del domingo)
            tipo: 'mixto',
            valorAproximado: (2 * TARIFAS_HORA.nocturna) + (6 * TARIFAS_HORA.nocturnaFestiva)
        }
    },
    {
        id: 4,
        descripcion: 'Domingo 22:00 → lunes normal 06:00 (2h nocturnas festivas + 6h nocturnas normales)',
        turno: {
            fecha: '2026-04-05', // Domingo
            horaInicio: '10:00 Pm',
            horaSalida: '06:00 Am',
            incapacidad: false
        },
        esperado: {
            horas: 8,
            // 2h nocturnas festivas (22:00-00:00 del domingo) + 6h nocturnas ordinarias (00:00-06:00 del lunes)
            tipo: 'mixto',
            valorAproximado: (2 * TARIFAS_HORA.nocturnaFestiva) + (6 * TARIFAS_HORA.nocturna)
        }
    },
    {
        id: 5,
        descripcion: 'Domingo 22:00 → lunes festivo 06:00 (2h nocturnas festivas + 6h nocturnas festivas)',
        turno: {
            fecha: '2026-04-05', // Domingo
            horaInicio: '10:00 Pm',
            horaSalida: '06:00 Am',
            incapacidad: false,
            // Forzar que lunes 06/04 sea festivo (si está en FESTIVOS)
            // NOTA: Este test depende de si 06/04/2026 está en FESTIVOS
        },
        esperado: {
            horas: 8,
            // 2h nocturnas festivas + 6h nocturnas festivas (si el lunes es festivo)
            tipo: 'festivo-noche',
            valorAproximado: 8 * TARIFAS_HORA.nocturnaFestiva
        }
    },
    {
        id: 6,
        descripcion: 'Festivo 22:00 → día normal 06:00 (2h nocturnas festivas + 6h nocturnas normales)',
        turno: {
            fecha: '2026-04-03', // Jueves festivo (Viernes Santo)
            horaInicio: '10:00 Pm',
            horaSalida: '06:00 Am',
            incapacidad: false
        },
        esperado: {
            horas: 8,
            // 2h nocturnas festivas (22:00-00:00 del festivo) + 6h nocturnas ordinarias (00:00-06:00 del viernes)
            tipo: 'mixto',
            valorAproximado: (2 * TARIFAS_HORA.nocturnaFestiva) + (6 * TARIFAS_HORA.nocturna)
        }
    },
    {
        id: 7,
        descripcion: 'Festivo 22:00 → siguiente festivo 06:00 (8h nocturnas festivas)',
        turno: {
            fecha: '2026-04-03', // Jueves festivo (Viernes Santo)
            horaInicio: '10:00 Pm',
            horaSalida: '06:00 Am',
            incapacidad: false,
            // Asumiendo que 04/04/2026 también es festivo (Sábado Santo)
        },
        esperado: {
            horas: 8,
            tipo: 'festivo-noche',
            valorAproximado: 8 * TARIFAS_HORA.nocturnaFestiva
        }
    },
    {
        id: 8,
        descripcion: 'Turno que NO cruza medianoche (ej: 06:00-14:00)',
        turno: {
            fecha: '2026-04-07', // Martes normal
            horaInicio: '06:00 Am',
            horaSalida: '02:00 Pm',
            incapacidad: false
        },
        esperado: {
            horas: 8,
            tipo: 'ordinario-dia',
            valorAproximado: 8 * TARIFAS_HORA.diurna
        }
    },
    {
        id: 9,
        descripcion: 'Turno en límite exacto 00:00',
        turno: {
            fecha: '2026-04-07', // Martes normal
            horaInicio: '10:00 Pm',
            horaSalida: '12:00 Am',
            incapacidad: false
        },
        esperado: {
            horas: 2,
            tipo: 'ordinario-noche',
            valorAproximado: 2 * TARIFAS_HORA.nocturna
        }
    },
    {
        id: 10,
        descripcion: '03/04/2026 (viernes festivo) — el caso bug original',
        turno: {
            fecha: '2026-04-03', // Viernes Santo - festivo
            horaInicio: '06:00 Am',
            horaSalida: '06:00 Pm',
            incapacidad: false
        },
        esperado: {
            horas: 12,
            tipo: 'festivo-dia',
            valorAproximado: 12 * TARIFAS_HORA.diurnaFestiva
        }
    }
];

// ============================================
// EJECUTAR REGRESIÓN
// ============================================

console.log('='.repeat(80));
console.log('REGRESIÓN: Comparación Legacy vs Segmentado');
console.log('='.repeat(80));
console.log('');

// Verificar festividades
console.log('--- Festivos en el sistema ---');
console.log('FESTIVOS:', FESTIVOS);
console.log('');

// Ejecutar comparación para cada fixture
const resultados = FIXTURES_TURNOS_REGRESION.map(fixture => {
    console.log(`--- Caso ${fixture.id}: ${fixture.descripcion} ---`);
    console.log(`Fecha: ${fixture.turno.fecha}`);
    console.log(`Horario: ${fixture.turno.horaInicio} - ${fixture.turno.horaSalida}`);
    console.log(`Es festivo: ${esFestivo(fixture.turno.fecha)}`);
    console.log(`Es domingo: ${esDomingo(fixture.turno.fecha)}`);
    
    // Ejecutar comparación
    const comparacion = compararCalculos(fixture.turno);
    
    console.log(`Legacy:     ${formatearMoneda(comparacion.legacy)} (${comparacion.horasLegacy}h)`);
    console.log(`Segmentado: ${formatearMoneda(comparacion.segmentado)} (${comparacion.horasSegmentado}h)`);
    console.log(`Diff:       ${formatearMoneda(comparacion.diff)} (${comparacion.diffPct.toFixed(2)}%)`);
    console.log(`Esperado:   ${comparacion.esperado ? '✓ SÍ' : '✗ NO'}`);
    
    // Mostrar breakdown si hay
    if (comparacion.breakdown && comparacion.breakdown.length > 0) {
        console.log('Breakdown:');
        comparacion.breakdown.forEach((seg, i) => {
            console.log(`  [${i + 1}] ${seg.fechaNominal} ${seg.inicio.toFixed(2)}-${seg.fin.toFixed(2)}h: ` +
                `${seg.minutos}min = ${seg.categoria} @ ${formatearMoneda(seg.tarifa)} = ${formatearMoneda(seg.valor)}`);
        });
    }
    
    console.log('');
    
    return {
        fixture,
        comparacion
    };
});

// Resumen
const totalLegacy = resultados.reduce((sum, r) => sum + r.comparacion.legacy, 0);
const totalSegmentado = resultados.reduce((sum, r) => sum + r.comparacion.segmentado, 0);
const diffTotal = Math.abs(totalLegacy - totalSegmentado);
const esperados = resultados.filter(r => r.comparacion.esperado).length;
const noEsperados = resultados.filter(r => !r.comparacion.esperado).length;

console.log('='.repeat(80));
console.log('RESUMEN');
console.log('='.repeat(80));
console.log(`Total Legacy:     ${formatearMoneda(totalLegacy)}`);
console.log(`Total Segmentado: ${formatearMoneda(totalSegmentado)}`);
console.log(`Diff Total:       ${formatearMoneda(diffTotal)}`);
console.log('');
console.log(`Casos esperados:   ${esperados}/${resultados.length}`);
console.log(`Casos NO esperados: ${noEsperados}/${resultados.length}`);
console.log('');

if (noEsperados > 0) {
    console.log('CASOS CON DIVERGENCIA NO ESPERADA:');
    resultados.filter(r => !r.comparacion.esperado).forEach(r => {
        console.log(`  - Caso ${r.fixture.id}: ${r.fixture.descripcion}`);
        console.log(`    Diff: ${formatearMoneda(r.comparacion.diff)} (${r.comparacion.diffPct.toFixed(2)}%)`);
    });
    console.log('');
    console.log('⚠️  ATENCIÓN: Estos casos requieren investigación.');
    console.log('    El motor segmentado debe alinearse con legacy o documentar divergencias aceptadas.');
} else {
    console.log('✓ TODOS LOS CASOS ESPERADOS - Regresión OK');
}

console.log('='.repeat(80));
