import { toLocalDate } from './holidays.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (dateInput, days) => {
    const date = dateInput instanceof Date ? new Date(dateInput) : toLocalDate(dateInput);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

const buildPtsCalendar2026 = () => {
    const pts1Start = toLocalDate('2025-12-28');

    return Array.from({ length: 18 }, (_, index) => {
        const startDate = addDays(pts1Start, index * 21);
        const endDate = addDays(startDate, 20);

        return {
            year: 2026,
            code: `PTS${index + 1}`,
            startDate: toDateKey(startDate),
            endDate: toDateKey(endDate)
        };
    });
};

export const PTS_CALENDAR_2026 = buildPtsCalendar2026();

export const DEFAULT_PTS_CALENDAR = PTS_CALENDAR_2026;

export const datesOverlap = (startA, endA, startB, endB) => {
    const aStart = toLocalDate(startA).getTime();
    const aEnd = toLocalDate(endA).getTime();
    const bStart = toLocalDate(startB).getTime();
    const bEnd = toLocalDate(endB).getTime();

    return aStart <= bEnd && bStart <= aEnd;
};

export const intersectDateRanges = (startA, endA, startB, endB) => {
    if (!datesOverlap(startA, endA, startB, endB)) {
        return null;
    }

    const start = new Date(Math.max(toLocalDate(startA).getTime(), toLocalDate(startB).getTime()));
    const end = new Date(Math.min(toLocalDate(endA).getTime(), toLocalDate(endB).getTime()));

    return {
        startDate: toDateKey(start),
        endDate: toDateKey(end),
        days: Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
    };
};

export const getPtsPeriodsIntersectingRange = ({ startDate, endDate, calendar = DEFAULT_PTS_CALENDAR } = {}) => {
    if (!startDate || !endDate) {
        return [];
    }

    return calendar
        .map((pts) => ({
            ...pts,
            liquidatedRange: intersectDateRanges(pts.startDate, pts.endDate, startDate, endDate)
        }))
        .filter((pts) => pts.liquidatedRange);
};
