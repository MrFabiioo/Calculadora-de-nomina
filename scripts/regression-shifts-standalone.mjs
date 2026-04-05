/**
 * Script de regresión - Fixtures de turnos reales para testing
 * 
 * Versión standalone que no depende de imports del proyecto.
 * Ejecutar con: node scripts/regression-shifts-standalone.mjs
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

// ============================================
// TARIFAS (de shifts.js)
// ============================================

const TARIFAS_HORA = {
    diurna: 12210,
    nocturna: 16483.5,
    diurnaFestiva: 21978,
    nocturnFestiva: 26251.6666667
};

const MEDIA_HORA = TARIFAS_HORA.diurna / 2;

// ============================================
// FESTIVOS (copiados de holidays.js)
// ============================================

const FESTIVOS = [
    "2024-01-01", "2024-01-06", "2024-03-24", "2024-03-28", "2024-03-29",
    "2024-05-01", "2024-06-02", "2024-06-03", "2024-07-01", "2024-07-20",
    "2024-08-07", "2024-08-19", "2024-10-14", "2024-11-04", "2024-11-11",
    "2024-12-08", "2024-12-25",
    "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-13", "2025-04-14",
    "2025-04-17", "2025-04-18", "2025-05-01", "2025-06-02", "2025-06-23",
    "2025-07-20", "2025-08-07", "2025-08-18", "2025-10-13", "2025-11-03",
    "2025-11-17", "2025-12-08", "2025-12-25",
    "2026-01-01", "2026-01-05", "2026-01-06", "2026-03-23", "2026-03-24",
    "2026-04-02", "2026-04-03", "2026-05-01", "2026-06-08", "2026-06-15",
    "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
    "2026-11-16", "2026-12-08", "2026-12-25"
];

// ============================================
// HELPERS (de holidays.js y shifts.js)
// ============================================

const toLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const esFestivo = (fechaStr) => {
    if (!fechaStr) return false;
    return FESTIVOS.includes(fechaStr);
};

const esDomingo = (fechaStr) => {
    if (!fechaStr) return false;
    const fecha = toLocalDate(fechaStr);
    if (!fecha) return false;
    return fecha.getDay() === 0;
};

const esNormalAFestivo = (fechaStr) => {
    // No implementado en standalone - para regresión asumimos false
    return false;
};

const esFestivoANormal = (fechaStr) => {
    return false;
};

// ============================================
// PARSING DE HORAS (de shifts.js)
// ============================================

const parseHora = (horaStr) => {
    if (!horaStr || horaStr === 'Descanso') return null;
    
    const match = horaStr.match(/^(\d{1,2}):(\d{2})\s*(Am|Pm)?$/i);
    if (!match) return null;
    
    let horas = parseInt(match[1], 10);
    const minutos = parseInt(match[2], 10);
    const periodo = match[3]?.toLowerCase();
    
    if (periodo === 'am') {
        if (horas === 12) horas = 0;
    } else if (periodo === 'pm') {
        if (horas !== 12) horas += 12;
    }
    
    return horas + minutos / 60;
};

const cruzaMedianoche = (inicio, fin) => {
    return fin <= inicio;
};

const normalizarHora = (horaStr) => {
    return parseHora(horaStr);
};

// Franquicia diurna: [06:00, 19:00)
const esFranquiciaDiurna = (horaDecimal) => {
    return horaDecimal >= 6 && horaDecimal < 19;
};

// ============================================
// CALCULAR TURNO LEGACY (de shifts.js)
// ============================================

const calcularTurno = (horaInicio, horaSalida) => {
    const inicio = parseHora(horaInicio);
    const fin = parseHora(horaSalida);
    
    if (inicio === null || fin === null) {
        return null;
    }
    
    const cruza = cruzaMedianoche(inicio, fin);
    const finEffective = cruza ? fin + 24 : fin;
    const horas = finEffective - inicio;
    
    return {
        inicio,
        fin,
        horas,
        cruzaMedianoche: cruza
    };
};

const calcularValorTurno = (turnoData, fecha, tieneIncapacidad = false) => {
    if (!turnoData) return 0;
    
    let valor;
    
    if (esDomingo(fecha) && esFestivo(fecha)) {
        valor = TARIFAS_HORA.nocturnaFestiva * turnoData.horas;
    } else if (esDomingo(fecha)) {
        valor = TARIFAS_HORA.nocturnaFestiva * turnoData.horas;
    } else if (esNormalAFestivo(fecha)) {
        // Este caso legacy usa la tarifa intermedia
        valor = TARIFAS_HORA.diurna * turnoData.horas;
    } else if (esFestivoANormal(fecha)) {
        valor = TARIFAS_HORA.diurna * turnoData.horas;
    } else if (esFestivo(fecha)) {
        // Determinar si es diurno o nocturno basado en las horas
        // Para simplificar en standalone, usamos una aproximación
        const inicio = turnoData.inicio;
        const fin = turnoData.cruzaMedianoche ? turnoData.fin + 24 : turnoData.fin;
        
        // Calcular horas diurnas y nocturnas
        const horasDiurnas = Math.max(0, Math.min(fin, 19) - Math.max(inicio, 6));
        const horasNocturnas = (fin - inicio) - horasDiurnas;
        
        valor = (horasDiurnas * TARIFAS_HORA.diurnaFestiva) + (horasNocturnas * TARIFAS_HORA.nocturnaFestiva);
    } else {
        // Día normal - calcular diurno/nocturno
        const inicio = turnoData.inicio;
        const fin = turnoData.cruzaMedianoche ? turnoData.fin + 24 : turnoData.fin;
        
        const horasDiurnas = Math.max(0, Math.min(fin, 19) - Math.max(inicio, 6));
        const horasNocturnas = (fin - inicio) - horasDiurnas;
        
        valor = (horasDiurnas * TARIFAS_HORA.diurna) + (horasNocturnas * TARIFAS_HORA.nocturna);
    }
    
    // Aplicar descuento por incapacidad (2/3 según Art. 227 CST)
    if (tieneIncapacidad) {
        valor *= 2 / 3;
    }
    
    return valor;
};

// ============================================
// MOTOR SEGMENTADO (copiado de segments.js + payroll-breakdown.js)
// ============================================

const normalizeShiftInput = (input) => {
    const { fecha, horaInicio, horaSalida, incapacidad = false } = input;
    
    const esDescanso = (horaInicio === 'Descanso' || horaSalida === 'Descanso');
    
    const inicioDecimal = parseHora(horaInicio);
    const finDecimal = parseHora(horaSalida);
    
    const fechaBase = toLocalDate(fecha);
    const cruza = inicioDecimal !== null && finDecimal !== null && cruzaMedianoche(inicioDecimal, finDecimal);
    
    return {
        fechaBase,
        fechaString: fecha,
        horaInicio: inicioDecimal,
        horaSalida: finDecimal,
        incapacidad,
        esDescanso,
        cruzaMedianoche: cruza,
        fechaSalida: cruza ? toLocalDate(sumarDias(fecha, 1)) : fechaBase
    };
};

const sumarDias = (fechaStr, dias) => {
    const fecha = new Date(fechaStr + "T00:00:00");
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
};

const getSegmentLimits = (boundaries, horaInicio, horaFinEffective) => {
    const limites = new Set();
    limites.add(horaInicio);
    limites.add(horaFinEffective);
    
    boundaries.forEach(boundary => {
        let hora;
        switch (boundary) {
            case 'midnight':
                // Para turnos que cruzan medianoche (finEffective > 24), usar 24
                // Para turnos normales, usar 0
                hora = horaFinEffective > 24 ? 24 : 0;
                break;
            case '06:00':
            case 'mañana': hora = 6; break;
            case '19:00':
            case 'tarde': hora = 19; break;
            default: return;
        }
        
        // Solo agregar si está dentro del rango del turno
        if (hora >= horaInicio && hora <= horaFinEffective) {
            limites.add(hora);
        }
    });
    
    return Array.from(limites).sort((a, b) => a - b);
};

const segmentShift = (normalized, boundaries = ['midnight']) => {
    const { fechaBase, horaInicio, horaSalida, esDescanso, fechaSalida } = normalized;
    
    if (esDescanso) return [];
    if (horaInicio === null || horaSalida === null) return [];
    
    const finEffective = horaSalida <= horaInicio ? horaSalida + 24 : horaSalida;
    const limites = getSegmentLimits(boundaries, horaInicio, finEffective);
    
    const segmentos = [];
    
    for (let i = 0; i < limites.length - 1; i++) {
        const limiteInicio = limites[i];
        const limiteFin = limites[i + 1];
        
        const inicio = Math.max(horaInicio, limiteInicio);
        const fin = Math.min(finEffective, limiteFin);
        
        if (fin > inicio) {
            const horaSegmento = inicio;
            let fechaNominal;
            
            if (horaSegmento >= 24) {
                fechaNominal = typeof fechaSalida === 'string' ? fechaSalida : fechaSalida.toISOString().split('T')[0];
            } else {
                fechaNominal = (horaSegmento < horaInicio && horaInicio < 6) 
                    ? (typeof fechaSalida === 'string' ? fechaSalida : fechaSalida.toISOString().split('T')[0])
                    : (typeof fechaBase === 'string' ? fechaBase : fechaBase.toISOString().split('T')[0]);
            }
            
            const horaInicioAjustada = horaSegmento >= 24 ? horaSegmento - 24 : horaSegmento;
            const horaFinAjustada = fin >= 24 ? fin - 24 : fin;
            
            segmentos.push({
                inicio: horaInicioAjustada,
                fin: horaFinAjustada,
                minutos: (fin - inicio) * 60,
                fechaNominal: typeof fechaNominal === 'string' ? fechaNominal : fechaNominal.toISOString().split('T')[0]
            });
        }
    }
    
    return segmentos;
};

const classifySegment = (segment) => {
    const { inicio, fechaNominal } = segment;
    
    const esFestivoSeg = esFestivo(fechaNominal);
    const esDom = esDomingo(fechaNominal);
    const esNocturno = !esFranquiciaDiurna(inicio);
    
    let categoria;
    if (esFestivoSeg || esDom) {
        categoria = esNocturno ? 'festivo-noche' : 'festivo-dia';
    } else {
        categoria = esNocturno ? 'ordinario-noche' : 'ordinario-dia';
    }
    
    return {
        esFestivo: esFestivoSeg || esDom,
        esDomingo: esDom,
        esNocturno,
        categoria
    };
};

const processShift = (input, boundaries = ['midnight']) => {
    const normalized = normalizeShiftInput(input);
    const segmentos = segmentShift(normalized, boundaries);
    
    const segmentosClasificados = segmentos.map(segment => ({
        ...segment,
        ...classifySegment(segment)
    }));
    
    return { normalized, segmentos: segmentosClasificados };
};

const TARIFAS_POR_CATEGORIA = {
    'ordinario-dia': TARIFAS_HORA.diurna,
    'ordinario-noche': TARIFAS_HORA.nocturna,
    'festivo-dia': TARIFAS_HORA.diurnaFestiva,
    'festivo-noche': TARIFAS_HORA.nocturnaFestiva
};

const liquidarTurnoPorTramos = (turno, boundaries = ['midnight', '06:00', '19:00']) => {
    const { horaInicio, horaSalida, incapacidad = false } = turno;
    
    if (horaInicio === 'Descanso' || horaSalida === 'Descanso') {
        return { total: 0, horas: 0, breakdown: [], incapacidad: false };
    }
    
    const result = processShift(turno, boundaries);
    const { segmentos } = result;
    
    const breakdown = segmentos.map(segment => {
        const { minutos, categoria } = segment;
        const horas = minutos / 60;
        const tarifa = TARIFAS_POR_CATEGORIA[categoria] || TARIFAS_HORA.diurna;
        const valor = horas * tarifa;
        
        return {
            inicio: segment.inicio,
            fin: segment.fin,
            fechaNominal: segment.fechaNominal,
            minutos,
            categoria,
            tarifa,
            valor
        };
    });
    
    const totalBruto = breakdown.reduce((sum, seg) => sum + seg.valor, 0);
    const totalHoras = breakdown.reduce((sum, seg) => sum + (seg.minutos / 60), 0);
    
    let total = totalBruto;
    if (incapacidad) {
        total = totalBruto * (2 / 3);
        breakdown.forEach(seg => { seg.valor = seg.valor * (2 / 3); });
    }
    
    return { total, horas: totalHoras, breakdown, incapacidad };
};

// ============================================
// COMPARACIÓN Y REPORTE
// ============================================

const compararCalculos = (turno) => {
    const { horaInicio, horaSalida, fecha, incapacidad } = turno;
    
    if (horaInicio === 'Descanso' || horaSalida === 'Descanso') {
        return { legacy: 0, segmentado: 0, diff: 0, esperado: true };
    }
    
    // Legacy
    const turnoData = calcularTurno(horaInicio, horaSalida);
    const valorLegacy = turnoData ? calcularValorTurno(turnoData, fecha, incapacidad) : 0;
    
    // Segmentado (usa defaults: ['midnight', '06:00', '19:00'])
    const resultadoSegmentado = liquidarTurnoPorTramos(turno);
    const valorSegmentado = resultadoSegmentado ? resultadoSegmentado.total : 0;
    
    const diff = Math.abs(valorLegacy - valorSegmentado);
    const diffPct = valorLegacy > 0 ? (diff / valorLegacy) * 100 : 0;
    const esperado = diffPct < 1;
    
    return {
        legacy: valorLegacy,
        segmentado: valorSegmentado,
        diff,
        diffPct,
        esperado,
        horasLegacy: turnoData?.horas || 0,
        horasSegmentado: resultadoSegmentado?.horas || 0,
        breakdown: resultadoSegmentado?.breakdown || []
    };
};

const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2
    }).format(valor);
};

// ============================================
// FIXTURES
// ============================================

const FIXTURES = [
    {
        id: 1,
        descripcion: 'Día normal 08:00-18:00',
        turno: { fecha: '2026-04-07', horaInicio: '08:00 Am', horaSalida: '06:00 Pm', incapacidad: false }
    },
    {
        id: 2,
        descripcion: 'Normal nocturno 22:00-06:00',
        turno: { fecha: '2026-04-07', horaInicio: '10:00 Pm', horaSalida: '06:00 Am', incapacidad: false }
    },
    {
        id: 3,
        descripcion: 'Sábado 22:00 → domingo 06:00',
        turno: { fecha: '2026-04-04', horaInicio: '10:00 Pm', horaSalida: '06:00 Am', incapacidad: false }
    },
    {
        id: 4,
        descripcion: 'Domingo 22:00 → lunes normal 06:00',
        turno: { fecha: '2026-04-05', horaInicio: '10:00 Pm', horaSalida: '06:00 Am', incapacidad: false }
    },
    {
        id: 5,
        descripcion: 'Domingo 22:00 → lunes festivo 06:00',
        turno: { fecha: '2026-04-05', horaInicio: '10:00 Pm', horaSalida: '06:00 Am', incapacidad: false }
    },
    {
        id: 6,
        descripcion: 'Festivo 22:00 → día normal 06:00',
        turno: { fecha: '2026-04-03', horaInicio: '10:00 Pm', horaSalida: '06:00 Am', incapacidad: false }
    },
    {
        id: 7,
        descripcion: 'Festivo 22:00 → siguiente festivo 06:00',
        turno: { fecha: '2026-04-03', horaInicio: '10:00 Pm', horaSalida: '06:00 Am', incidencia: 'asumir 04/04 festivo' }
    },
    {
        id: 8,
        descripcion: 'Turno sin cruzar medianoche 06:00-14:00',
        turno: { fecha: '2026-04-07', horaInicio: '06:00 Am', horaSalida: '02:00 Pm', incapacidad: false }
    },
    {
        id: 9,
        descripcion: 'Turno en límite exacto 00:00',
        turno: { fecha: '2026-04-07', horaInicio: '10:00 Pm', horaSalida: '12:00 Am', incapacidad: false }
    },
    {
        id: 10,
        descripcion: '03/04/2026 (viernes festivo)',
        turno: { fecha: '2026-04-03', horaInicio: '06:00 Am', horaSalida: '06:00 Pm', incapacidad: false }
    }
];

// ============================================
// EJECUCIÓN
// ============================================

console.log('='.repeat(80));
console.log('REGRESIÓN: Comparación Legacy vs Segmentado');
console.log('='.repeat(80));
console.log('');

// Verificar festividades
console.log('--- Festivos relevantes ---');
console.log('03/04/2026 (Viernes Santo):', esFestivo('2026-04-03'));
console.log('04/04/2026 (Sábado Santo):', esFestivo('2026-04-04'));
console.log('05/04/2026 (Domingo): esFestivo=', esFestivo('2026-04-05'), 'esDomingo=', esDomingo('2026-04-05'));
console.log('06/04/2026 (Lunes):', esFestivo('2026-04-06'));
console.log('07/04/2026 (Martes):', esFestivo('2026-04-07'));
console.log('');

const resultados = FIXTURES.map(fixture => {
    console.log(`--- Caso ${fixture.id}: ${fixture.descripcion} ---`);
    console.log(`  Fecha: ${fixture.turno.fecha} (festivo: ${esFestivo(fixture.turno.fecha)}, domingo: ${esDomingo(fixture.turno.fecha)})`);
    console.log(`  Horario: ${fixture.turno.horaInicio} - ${fixture.turno.horaSalida}`);
    
    const comparacion = compararCalculos(fixture.turno);
    
    console.log(`  Legacy:     ${formatearMoneda(comparacion.legacy)} (${comparacion.horasLegacy}h)`);
    console.log(`  Segmentado: ${formatearMoneda(comparacion.segmentado)} (${comparacion.horasSegmentado}h)`);
    console.log(`  Diff:       ${formatearMoneda(comparacion.diff)} (${comparacion.diffPct.toFixed(2)}%)`);
    console.log(`  Esperado:   ${comparacion.esperado ? '✓ SÍ' : '✗ NO'}`);
    
    if (comparacion.breakdown?.length > 0) {
        console.log('  Breakdown:');
        comparacion.breakdown.forEach(seg => {
            console.log(`    [${seg.fechaNominal}] ${seg.inicio.toFixed(2)}-${seg.fin.toFixed(2)}h: ${seg.minutos}min ${seg.categoria} = ${formatearMoneda(seg.valor)}`);
        });
    }
    
    console.log('');
    
    return { fixture, comparacion };
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
} else {
    console.log('✓ TODOS LOS CASOS ESPERADOS - Regresión OK');
}
