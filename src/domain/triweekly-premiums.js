import { TARIFAS_HORA } from './shifts.js';
import { toLocalDate } from './holidays.js';

const TRIWEEKLY_PERIOD_DAYS = 21;
const DAY_PREMIUM_RATE = 0.25;
const NIGHT_PREMIUM_RATE = 0.75;
const ORDINARY_CATEGORIES = new Set(['ordinario-dia', 'ordinario-noche']);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_TRIWEEKLY_CONFIG = {
    anchorDate: '2025-12-28',
    thresholds: [
        { effectiveUntil: '2026-07-15', maxOrdinaryHours: 132 },
        { effectiveFrom: '2026-07-16', maxOrdinaryHours: 126 }
    ]
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

const addDays = (dateInput, days) => {
    const date = startOfDay(dateInput);
    date.setDate(date.getDate() + days);
    return date;
};

const diffInDays = (a, b) => Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);

const normalizeConfig = (config = {}) => ({
    anchorDate: config.anchorDate || DEFAULT_TRIWEEKLY_CONFIG.anchorDate,
    thresholds: Array.isArray(config.thresholds) && config.thresholds.length > 0
        ? config.thresholds
        : DEFAULT_TRIWEEKLY_CONFIG.thresholds
});

const resolvePeriodBounds = (dateInput, anchorDate) => {
    const anchor = startOfDay(anchorDate);
    const date = startOfDay(dateInput);
    const dayOffset = diffInDays(date, anchor);
    const periodIndex = Math.floor(dayOffset / TRIWEEKLY_PERIOD_DAYS);
    const startDate = addDays(anchor, periodIndex * TRIWEEKLY_PERIOD_DAYS);
    const endDate = addDays(startDate, TRIWEEKLY_PERIOD_DAYS - 1);

    return {
        startDate: toDateKey(startDate),
        endDate: toDateKey(endDate)
    };
};

const resolveThreshold = (endDate, thresholds) => {
    const periodEndMs = startOfDay(endDate).getTime();

    const match = thresholds.find((threshold) => {
        const effectiveFromMs = threshold.effectiveFrom ? startOfDay(threshold.effectiveFrom).getTime() : Number.NEGATIVE_INFINITY;
        const effectiveUntilMs = threshold.effectiveUntil ? startOfDay(threshold.effectiveUntil).getTime() : Number.POSITIVE_INFINITY;
        return periodEndMs >= effectiveFromMs && periodEndMs <= effectiveUntilMs;
    });

    return match?.maxOrdinaryHours ?? thresholds[thresholds.length - 1]?.maxOrdinaryHours ?? 0;
};

const getSegmentTimestamp = (segment) => {
    const date = startOfDay(segment.fechaNominal);
    const wholeHours = Math.floor(segment.inicio);
    const minutes = Math.round((segment.inicio - wholeHours) * 60);
    date.setHours(wholeHours, minutes, 0, 0);
    return date.getTime();
};

const collectOrdinarySegments = (turnosLiquidados = []) => {
    return turnosLiquidados.flatMap(({ turno, liquidacion }) => {
        const breakdown = liquidacion?.breakdown || [];

        return breakdown
            .filter((segment) => ORDINARY_CATEGORIES.has(segment.categoria))
            .map((segment) => ({
                fechaNominal: segment.fechaNominal || turno?.fecha,
                categoria: segment.categoria,
                horas: segment.minutos / 60,
                timestamp: getSegmentTimestamp(segment)
            }))
            .filter((segment) => segment.fechaNominal && segment.horas > 0);
    });
};

const buildPremiumSummary = (periods) => periods.reduce((summary, period) => ({
    periodsCount: summary.periodsCount + 1,
    ordinaryHours: summary.ordinaryHours + period.ordinaryHours,
    excessHours: summary.excessHours + period.excessHours,
    dayExcessHours: summary.dayExcessHours + period.dayExcessHours,
    nightExcessHours: summary.nightExcessHours + period.nightExcessHours,
    dayPremiumValue: summary.dayPremiumValue + period.dayPremiumValue,
    nightPremiumValue: summary.nightPremiumValue + period.nightPremiumValue,
    premiumValue: summary.premiumValue + period.premiumValue
}), {
    periodsCount: 0,
    ordinaryHours: 0,
    excessHours: 0,
    dayExcessHours: 0,
    nightExcessHours: 0,
    dayPremiumValue: 0,
    nightPremiumValue: 0,
    premiumValue: 0
});

export const calculateTriweeklyPremiums = ({ turnosLiquidados = [], config = {} } = {}) => {
    const normalizedConfig = normalizeConfig(config);
    const ordinarySegments = collectOrdinarySegments(turnosLiquidados);

    if (ordinarySegments.length === 0) {
        return {
            premiumValue: 0,
            periods: [],
            summary: buildPremiumSummary([])
        };
    }

    const periodsMap = new Map();

    ordinarySegments.forEach((segment) => {
        const { startDate, endDate } = resolvePeriodBounds(segment.fechaNominal, normalizedConfig.anchorDate);
        const key = `${startDate}:${endDate}`;

        if (!periodsMap.has(key)) {
            periodsMap.set(key, {
                startDate,
                endDate,
                threshold: resolveThreshold(endDate, normalizedConfig.thresholds),
                ordinaryHours: 0,
                segments: []
            });
        }

        const period = periodsMap.get(key);
        period.ordinaryHours += segment.horas;
        period.segments.push(segment);
    });

    const periods = Array.from(periodsMap.values())
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((period) => {
            const excessHours = Math.max(0, period.ordinaryHours - period.threshold);
            let remainingExcess = excessHours;
            let dayExcessHours = 0;
            let nightExcessHours = 0;

            const sortedSegments = [...period.segments].sort((a, b) => b.timestamp - a.timestamp);

            sortedSegments.forEach((segment) => {
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
            const nightPremiumValue = nightExcessHours * TARIFAS_HORA.nocturna * NIGHT_PREMIUM_RATE;
            const premiumValue = dayPremiumValue + nightPremiumValue;

            return {
                startDate: period.startDate,
                endDate: period.endDate,
                threshold: period.threshold,
                ordinaryHours: period.ordinaryHours,
                excessHours,
                dayExcessHours,
                nightExcessHours,
                dayPremiumValue,
                nightPremiumValue,
                premiumValue
            };
        });

    const summary = buildPremiumSummary(periods);

    return {
        premiumValue: summary.premiumValue,
        periods,
        summary
    };
};
