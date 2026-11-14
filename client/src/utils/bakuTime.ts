const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Baku",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const toBakuInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) parts[part.type] = part.value;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const fromBakuInput = (value: string) => {
  if (!value) return null;
  const normalized = value.length === 10 ? `${value}T00:00` : value.slice(0, 16);
  const date = new Date(`${normalized}:00+04:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const formatBaku = (value: string | Date | null | undefined) => {
  const input = toBakuInput(value ?? null);
  if (!input) return "—";
  const [date, time] = input.split("T");
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year} ${time}`;
};
