const FESTIVE_BASE_CATEGORIES = new Set(['festivo-dia', 'festivo-noche']);
const FESTIVE_EXTRA_CATEGORY_MAP = {
    'festivo-dia': 'festivo-dia-extra',
    'festivo-noche': 'festivo-noche-extra'
};

const DAILY_FESTIVE_THRESHOLD_MINUTES = 480;
const FESTIVE_DAY_END_HOUR = 19;

const buildAbsoluteHour = (segment, dayOffset) => {
    const hour = segment.inicio;
    return hour === 0 && dayOffset > 0 ? 24 : hour + (dayOffset * 24);
};

const normalizeFestiveCategory = (absoluteStart) => {
    const hourOfDay = absoluteStart % 24;
    return hourOfDay >= 6 && hourOfDay < FESTIVE_DAY_END_HOUR ? 'festivo-dia' : 'festivo-noche';
};

const splitFestiveSegmentByBoundary = (segmentWithOrdering) => {
    const absoluteStart = segmentWithOrdering.__absoluteStart;
    const absoluteEnd = absoluteStart + (segmentWithOrdering.minutos / 60);
    const dayOffset = Math.floor(absoluteStart / 24);
    const dayBoundary = (dayOffset * 24) + FESTIVE_DAY_END_HOUR;

    if (absoluteStart < dayBoundary && absoluteEnd > dayBoundary) {
        const firstMinutes = (dayBoundary - absoluteStart) * 60;
        const secondMinutes = segmentWithOrdering.minutos - firstMinutes;

        return [
            {
                ...segmentWithOrdering,
                minutos: firstMinutes,
                fin: segmentWithOrdering.inicio + (firstMinutes / 60),
                categoria: normalizeFestiveCategory(absoluteStart)
            },
            {
                ...segmentWithOrdering,
                inicio: segmentWithOrdering.inicio + (firstMinutes / 60),
                minutos: secondMinutes,
                categoria: normalizeFestiveCategory(dayBoundary)
            }
        ].map((piece) => ({
            ...piece,
            fin: piece.inicio + (piece.minutos / 60)
        }));
    }

    return [{
        ...segmentWithOrdering,
        categoria: normalizeFestiveCategory(absoluteStart)
    }];
};

export const applyFestiveExtraPremiums = (segments = []) => {
    if (!Array.isArray(segments) || segments.length === 0) {
        return [];
    }

    let festiveMinutesAccumulated = 0;
    let previousDate = null;
    let dayOffset = 0;

    return segments.flatMap((segment) => {
        if (segment.fechaNominal !== previousDate) {
            festiveMinutesAccumulated = 0;
            if (previousDate !== null) {
                dayOffset += 1;
            }
            previousDate = segment.fechaNominal;
        }

        const segmentWithOrdering = {
            ...segment,
            __absoluteStart: buildAbsoluteHour(segment, dayOffset)
        };

        if (!FESTIVE_BASE_CATEGORIES.has(segment.categoria)) {
            return [{ ...segmentWithOrdering }];
        }

        return splitFestiveSegmentByBoundary(segmentWithOrdering).flatMap((piece) => {
            const baseMinutesRemaining = Math.max(0, DAILY_FESTIVE_THRESHOLD_MINUTES - festiveMinutesAccumulated);
            const baseMinutes = Math.min(piece.minutos, baseMinutesRemaining);
            const extraMinutes = Math.max(0, piece.minutos - baseMinutes);

            festiveMinutesAccumulated += piece.minutos;

            const pieces = [];

            if (baseMinutes > 0) {
                pieces.push({
                    ...piece,
                    minutos: baseMinutes,
                    fin: piece.inicio + (baseMinutes / 60)
                });
            }

            if (extraMinutes > 0) {
                pieces.push({
                    ...piece,
                    inicio: piece.inicio + (baseMinutes / 60),
                    fin: piece.fin,
                    minutos: extraMinutes,
                    categoria: FESTIVE_EXTRA_CATEGORY_MAP[piece.categoria]
                });
            }

            return pieces;
        });
    }).sort((left, right) => left.__absoluteStart - right.__absoluteStart)
        .map(({ __absoluteStart, ...segment }) => segment);
};
