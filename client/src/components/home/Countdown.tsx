import { useEffect, useState } from "react";

const pad = (value: number) => String(value).padStart(2, "0");

export default function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = Math.max(0, new Date(until).getTime() - now);
  const days = Math.floor(left / 86_400_000);
  const parts = [
    ...(days > 0 ? [{ value: days, label: "gün" }] : []),
    { value: Math.floor(left / 3_600_000) % 24, label: "saat" },
    { value: Math.floor(left / 60_000) % 60, label: "dəq" },
    { value: Math.floor(left / 1000) % 60, label: "san" },
  ];
  return (
    <span className="flex items-center gap-1.5" role="timer" aria-live="off">
      {parts.map((part) => (
        <span key={part.label} className="flex min-w-[42px] flex-col items-center rounded-lg bg-white/15 px-1.5 py-1 leading-none backdrop-blur">
          <span className="font-mono text-base font-bold tabular-nums">{pad(part.value)}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-wide opacity-75">{part.label}</span>
        </span>
      ))}
    </span>
  );
}
