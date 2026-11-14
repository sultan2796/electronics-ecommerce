export const BAKU_TZ = "Asia/Baku";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BAKU_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const bakuParts = (date: Date) => {
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAYS.indexOf(map.weekday),
  };
};

const offsetMs = (date: Date) => {
  const p = bakuParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
};

export const bakuWeekday = (date: Date) => bakuParts(date).weekday;

export const bakuDayStart = (date: Date, addDays = 0) => {
  const p = bakuParts(date);
  const guess = new Date(Date.UTC(p.year, p.month - 1, p.day + addDays) - offsetMs(date));
  return new Date(Date.UTC(p.year, p.month - 1, p.day + addDays) - offsetMs(guess));
};
