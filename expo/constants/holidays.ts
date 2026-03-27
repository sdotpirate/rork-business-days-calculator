export interface Holiday {
  name: string;
  date: Date;
}

function getMemorialDay(year: number): Date {
  const lastDay = new Date(year, 4, 31);
  const dayOfWeek = lastDay.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return new Date(year, 4, 31 - diff);
}

function getLaborDay(year: number): Date {
  const firstDay = new Date(year, 8, 1);
  const dayOfWeek = firstDay.getDay();
  const diff = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  return new Date(year, 8, 1 + diff);
}

function getThanksgiving(year: number): Date {
  const firstDay = new Date(year, 10, 1);
  const dayOfWeek = firstDay.getDay();
  const firstThursday = dayOfWeek <= 4 ? 4 - dayOfWeek + 1 : 12 - dayOfWeek;
  return new Date(year, 10, firstThursday + 21);
}

function getObservedDate(date: Date): Date {
  const day = date.getDay();
  if (day === 0) return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  if (day === 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return date;
}

export function getHolidaysForYear(year: number): Holiday[] {
  const raw: { name: string; date: Date }[] = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: 'Memorial Day', date: getMemorialDay(year) },
    { name: 'Independence Day', date: new Date(year, 6, 4) },
    { name: 'Labor Day', date: getLaborDay(year) },
    { name: 'Thanksgiving', date: getThanksgiving(year) },
    { name: 'Christmas Day', date: new Date(year, 11, 25) },
  ];

  return raw.map((h) => ({
    name: h.name,
    date: getObservedDate(h.date),
  }));
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isHoliday(date: Date, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((h) => isSameDay(h.date, date));
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export interface BusinessDaysResult {
  totalCalendarDays: number;
  businessDays: number;
  weekendDays: number;
  holidaysInRange: Holiday[];
}

export function calculateBusinessDays(start: Date, end: Date): BusinessDaysResult {
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDate < startDate) {
    return { totalCalendarDays: 0, businessDays: 0, weekendDays: 0, holidaysInRange: [] };
  }

  const years = new Set<number>();
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    years.add(cursor.getFullYear());
    cursor.setMonth(cursor.getMonth() + 1);
  }
  years.add(endDate.getFullYear());

  const allHolidays: Holiday[] = [];
  years.forEach((y) => {
    allHolidays.push(...getHolidaysForYear(y));
  });

  let businessDays = 0;
  let weekendDays = 0;
  const holidaysInRange: Holiday[] = [];
  const seen = new Set<string>();

  const current = new Date(startDate);
  while (current <= endDate) {
    if (isWeekend(current)) {
      weekendDays++;
    } else {
      const holiday = isHoliday(current, allHolidays);
      if (holiday) {
        const key = `${holiday.name}-${holiday.date.toISOString()}`;
        if (!seen.has(key)) {
          holidaysInRange.push(holiday);
          seen.add(key);
        }
      } else {
        businessDays++;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const totalCalendarDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return { totalCalendarDays, businessDays, weekendDays, holidaysInRange };
}
