let offset = 0;
let synced = false;
const listeners = new Set<() => void>();

export const syncServerClock = (value: unknown) => {
  const serverMs = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(serverMs) || serverMs <= 0) return;
  const next = serverMs - Date.now();
  if (synced && Math.abs(next - offset) < 1000) return;
  offset = next;
  synced = true;
  listeners.forEach((listener) => listener());
};

export const serverNow = () => Date.now() + offset;

export const onServerClockChange = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
