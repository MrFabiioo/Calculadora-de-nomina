import { TARIFAS_HORA } from './shifts.js';
import { toLocalDate } from './holidays.js';
import { DEFAULT_PTS_CALENDAR, getPtsPeriodsIntersectingRange } from './pts-calendar.js';

const ORDINARY_CATEGORIES = new Set(['ordinario-dia', 'ordinario-noche']);
const DAY_PREMIUM_RATE = 0.25;
const NIGHT_PREMIUM_RATE = 0.75;
const DEFAULT_WEEKLY_THRESHOLD = 44;
const DEFAULT_THRESHOLDS = [
    { effectiveUntil: '2026-07-15', maxOrdinaryHours: 44 },
    { effectiveFrom: '2026-07-16', maxOrdinaryHours: 42 }
];

export const DEFAULT_PTS_EXCESS_METADATA = {
    calculationMode: 'pts-portion-excess-experimental',
    status: 'experimental',
    modelLabel: 'EXC por porción de PTS — experimental',
    calendar: 'official-pts-2026',
    allocationStrategy: 'latest-ordinary-segments-first-within-liquidated-pts-portion',
    includedCategories: [...ORDINARY_CATEGORIES],
    excludedCategories: ['festivo-dia', 'festivo-noche', 'festivo-dia-extra', 'festivo-noche-extra'],
    defaultWeeklyThreshold: DEFAULT_WEEKLY_THRESHOLD
};

const startOfDay = (dateInput) => {
    const date = dateInput instanceof Date ? new Date(dateInput) : toLocalDate(dateInput);
    date.setHours(0, 0, 0, 0);
    return date;
};

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getSegmentTimestamp = (segment) => {
    const date = startOfDay(segment.fechaNominal);
    const wholeHours = Math.floor(segment.inicio);
    const minutes = Math.round((segment.inicio - wholeHours) * 60);
    date.setHours(wholeHours, minutes, 0, 0);
    return date.getTime();
};

const isWithinRange = (dateInput, startDate, endDate) => {
    const dateMs = startOfDay(dateInput).getTime();
    return dateMs >= startOfDay(startDate).getTime() && dateMs <= startOfDay(endDate).getTime();
};

const normalizePayrollPeriod = ({ payrollPeriod, turnosLiquidados }) => {
    const configuredStart = payrollPeriod?.startDate || payrollPeriod?.fechaInicio;
    const configuredEnd = payrollPeriod?.endDate || payrollPeriod?.fechaFin;

    if (configuredStart && configuredEnd) {
        return {
            startDate: configuredStart,
            endDate: configuredEnd,
            source: 'input'
        };
    }

    const dates = turnosLiquidados
        .flatMap(({ turno, liquidacion }) => {
            const breakdownDates = (liquidacion?.breakdown || [])
                .map((segment) => segment.fechaNominal)
                .filter(Boolean);

            return [...breakdownDates, turno?.fecha].filter(Boolean);
        })
        .sort();

    if (dates.length === 0) {
        return {
            startDate: null,
            endDate: null,
            source: 'unavailable'
        };
    }

    return {
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        source: 'derived-from-liquidated-shifts'
    };
};

const resolveWeeklyThreshold = (endDate, thresholds = DEFAULT_THRESHOLDS) => {
    const periodEndMs = startOfDay(endDate).getTime();
    const match = thresholds.find((threshold) => {
        const effectiveFromMs = threshold.effectiveFrom ? startOfDay(threshold.effectiveFrom).getTime() : Number.NEGATIVE_INFINITY;
        const effectiveUntilMs = threshold.effectiveUntil ? startOfDay(threshold.effectiveUntil).getTime() : Number.POSITIVE_INFINITY;
        return periodEndMs >= effectiveFromMs && periodEndMs <= effectiveUntilMs;
    });

    return match?.maxOrdinaryHours ?? DEFAULT_WEEKLY_THRESHOLD;
};

const collectOrdinarySegments = (turnosLiquidados = []) => turnosLiquidados.flatMap(({ turno, liquidacion }) => {
    const breakdown = liquidacion?.breakdown || [];

    return breakdown
        .filter((segment) => ORDINARY_CATEGORIES.has(segment.categoria))
        .map((segment) => ({
            fechaNominal: segment.fechaNominal || turno?.fecha,
            categoria: segment.categoria,
            horas: segment.minutos / 60,
            inicio: segment.inicio,
            timestamp: getSegmentTimestamp(segment)
        }))
        .filter((segment) => segment.fechaNominal && segment.horas > 0);
});

const buildSummary = (periods) => periods.reduce((summary, period) => ({
    periodsCount: summary.periodsCount + 1,
    ordinaryHours: summary.ordinaryHours + period.ordinaryHours,
    thresholdHours: summary.thresholdHours + period.thresholdHours,
    excessHours: summary.excessHours + period.excessHours,
    dayExcessHours: summary.dayExcessHours + period.dayExcessHours,
    nightExcessHours: summary.nightExcessHours + period.nightExcessHours,
    dayPremiumValue: summary.dayPremiumValue + period.dayPremiumValue,
    nightPremiumValue: summary.nightPremiumValue + period.nightPremiumValue,
    premiumValue: summary.premiumValue + period.premiumValue
}), {
    periodsCount: 0,
    ordinaryHours: 0,
    thresholdHours: 0,
    excessHours: 0,
    dayExcessHours: 0,
    nightExcessHours: 0,
    dayPremiumValue: 0,
    nightPremiumValue: 0,
    premiumValue: 0
});

const buildDiagnostics = ({ payrollPeriod, thresholds }) => ({
    ...DEFAULT_PTS_EXCESS_METADATA,
    payrollPeriod,
    thresholds,
    thresholdRule: 'full liquidated weeks * weekly threshold; partial weeks do not add threshold hours',
    pricing: {
        day: 'base day rate * 25%',
        night: 'base day rate * 75%'
    }
});

export const calculatePtsExcessPremiums = ({
    turnosLiquidados = [],
    payrollPeriod = null,
    calendar = DEFAULT_PTS_CALENDAR,
    thresholds = DEFAULT_THRESHOLDS
} = {}) => {
    const normalizedPayrollPeriod = normalizePayrollPeriod({ payrollPeriod, turnosLiquidados });
    const diagnostics = buildDiagnostics({ payrollPeriod: normalizedPayrollPeriod, thresholds });

    if (!normalizedPayrollPeriod.startDate || !normalizedPayrollPeriod.endDate) {
        const summary = buildSummary([]);
        return { premiumValue: 0, periods: [], summary: { ...summary, diagnostics }, diagnostics };
    }

    const ordinarySegments = collectOrdinarySegments(turnosLiquidados);
    const ptsPeriods = getPtsPeriodsIntersectingRange({
        startDate: normalizedPayrollPeriod.startDate,
        endDate: normalizedPayrollPeriod.endDate,
        calendar
    });

    const periods = ptsPeriods.map((pts) => {
        const { liquidatedRange } = pts;
        const segments = ordinarySegments.filter((segment) => isWithinRange(
            segment.fechaNominal,
            liquidatedRange.startDate,
            liquidatedRange.endDate
        ));
        const ordinaryHours = segments.reduce((sum, segment) => sum + segment.horas, 0);
        const fullLiquidatedWeeks = Math.floor(liquidatedRange.days / 7);
        const weeklyThreshold = resolveWeeklyThreshold(liquidatedRange.endDate, thresholds);
        const thresholdHours = fullLiquidatedWeeks * weeklyThreshold;
        const excessHours = Math.max(0, ordinaryHours - thresholdHours);
        let remainingExcess = excessHours;
        let dayExcessHours = 0;
        let nightExcessHours = 0;

        [...segments]
            .sort((a, b) => b.timestamp - a.timestamp)
            .forEach((segment) => {
                if (remainingExcess <= 0) return;

                const allocatedHours = Math.min(segment.horas, remainingExcess);
                remainingExcess -= allocatedHours;

                if (segment.categoria === 'ordinario-noche') {
                    nightExcessHours += allocatedHours;
                } else {
                    dayExcessHours += allocatedHours;
                }
            });

        const dayPremiumValue = dayExcessHours * TARIFAS_HORA.diurna * DAY_PREMIUM_RATE;
        const nightPremiumValue = nightExcessHours * TARIFAS_HORA.diurna * NIGHT_PREMIUM_RATE;

        return {
            code: pts.code,
            ptsStartDate: pts.startDate,
            ptsEndDate: pts.endDate,
            liquidatedStartDate: liquidatedRange.startDate,
            liquidatedEndDate: liquidatedRange.endDate,
            liquidatedDays: liquidatedRange.days,
            fullLiquidatedWeeks,
            weeklyThreshold,
            thresholdHours,
            ordinaryHours,
            excessHours,
            dayExcessHours,
            nightExcessHours,
            dayPremiumValue,
            nightPremiumValue,
            premiumValue: dayPremiumValue + nightPremiumValue
        };
    });

    const summary = buildSummary(periods);

    return {
        premiumValue: summary.premiumValue,
        periods,
        summary: {
            ...summary,
            diagnostics
        },
        diagnostics
    };
};
