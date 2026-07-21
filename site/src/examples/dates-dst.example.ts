import { DateUtilities } from '@sdcorejs/utils/fns';

const localDate = DateUtilities.parseLocalDateStrict('2026-03-08');
const localDateTime = DateUtilities.parseLocalDateTimeStrict('2026-03-08T09:30:00');
const instant = DateUtilities.parseInstant('2026-03-08T09:30:00+07:00');

// Calendar-day semantics remain one day even across a 23-hour DST transition.
const calendarDays = DateUtilities.calendarDayDifference('2026-03-08', '2026-03-09');
const elapsedDays = DateUtilities.elapsedDayDifference(instant, new Date(instant.getTime() + 86_400_000));
const nextMonth = DateUtilities.addMonths(localDate, 1, { overflow: 'constrain' });

void [localDateTime, calendarDays, elapsedDays, nextMonth];
