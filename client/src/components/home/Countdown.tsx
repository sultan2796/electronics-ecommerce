import { useEffect, useRef, useState } from "react";
import { onServerClockChange, serverNow } from "../../utils/serverClock";

const pad = (value: number) => String(value).padStart(2, "0");

type Tone = "glass" | "dark";

const toneStyles: Record<Tone, string> = {
  glass: "bg-white/15 backdrop-blur",
  dark: "bg-white/[0.06] ring-1 ring-inset ring-white/10",
};

export default function Countdown({ until, onEnd, tone = "glass" }: { until: string; onEnd?: () => void; tone?: Tone }) {
  const [now, setNow] = useState(serverNow);
  const ended = useRef(false);
  const target = new Date(until).getTime();

  useEffect(() => {
    ended.current = false;
  }, [target]);

  useEffect(() => {
    const tick = () => setNow(serverNow());
    const timer = window.setInterval(tick, 1000);
    const unsubscribe = onServerClockChange(tick);
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const left = Math.max(0, target - now);

  useEffect(() => {
    if (left > 0 || ended.current || !Number.isFinite(target)) return;
    ended.current = true;
    onEnd?.();
  }, [left, onEnd, target]);

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
        <span key={part.label} className={`flex min-w-[42px] flex-col items-center rounded-lg px-1.5 py-1 leading-none ${toneStyles[tone]}`}>
          <span className="font-mono text-base font-bold tabular-nums">{pad(part.value)}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-wide opacity-75">{part.label}</span>
        </span>
      ))}
    </span>
  );
}
