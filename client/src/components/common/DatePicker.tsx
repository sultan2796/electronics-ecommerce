import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../context/I18nContext";
import Select from "./Select";

const INTL_LOCALE = { az: "az-Latn-AZ", ru: "ru-RU", en: "en-GB" } as const;

const MONTHS = {
  az: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const WEEKDAYS = {
  az: ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

const LABELS = {
  az: { today: "Bu gün", clear: "Təmizlə", time: "Saat", choose: "Tarix seçin", prev: "Əvvəlki ay", next: "Növbəti ay", done: "Hazır" },
  ru: { today: "Сегодня", clear: "Очистить", time: "Время", choose: "Выберите дату", prev: "Предыдущий месяц", next: "Следующий месяц", done: "Готово" },
  en: { today: "Today", clear: "Clear", time: "Time", choose: "Pick a date", prev: "Previous month", next: "Next month", done: "Done" },
};

const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDateKey = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  min?: string;
  max?: string;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  clearable?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  withTime = false,
  min,
  max,
  required,
  placeholder,
  ariaLabel,
  className = "",
  clearable = !required,
}: DatePickerProps) {
  const { locale } = useI18n();
  const labels = LABELS[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseDateKey(value);
  const selectedKey = selected ? toDateKey(selected) : null;
  const time = withTime && value.length >= 16 ? value.slice(11, 16) : "12:00";
  const [view, setView] = useState(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [focusKey, setFocusKey] = useState<string>(() => toDateKey(selected ?? new Date()));
  const minDate = useMemo(() => (min ? parseDateKey(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseDateKey(max) : null), [max]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayKey = toDateKey(today);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openPicker = () => {
    const base = selected ?? today;
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    setFocusKey(toDateKey(base));
    setOpen(true);
  };

  const isDisabled = (date: Date) => Boolean((minDate && date < minDate) || (maxDate && date > maxDate));

  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => new Date(view.getFullYear(), view.getMonth(), index - offset + 1));
  }, [view]);

  const years = useMemo(() => {
    const current = today.getFullYear();
    const from = Math.min(minDate?.getFullYear() ?? current - 5, view.getFullYear());
    const to = Math.max(maxDate?.getFullYear() ?? current + 5, view.getFullYear());
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [view, minDate, maxDate, today]);

  const emit = (date: Date, nextTime = time) => onChange(withTime ? `${toDateKey(date)}T${nextTime}` : toDateKey(date));

  const pick = (date: Date) => {
    if (isDisabled(date)) return;
    emit(date);
    if (!withTime) setOpen(false);
  };

  const shiftMonth = (delta: number) => setView((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = parseDateKey(focusKey) ?? new Date();
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in steps) {
      event.preventDefault();
      const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + steps[event.key]);
      setFocusKey(toDateKey(next));
      if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
        setView(new Date(next.getFullYear(), next.getMonth(), 1));
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(current);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const display = selected
    ? `${selected.getDate()} ${MONTHS[locale][selected.getMonth()].toLocaleLowerCase(INTL_LOCALE[locale])} ${selected.getFullYear()}${withTime ? `, ${time}` : ""}`
    : "";

  return (
    <div ref={rootRef} className={`relative ${className}`} translate="no">
      <button
        type="button"
        className="input flex w-full items-center justify-between gap-2 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span className={display ? "" : "text-muted"}>{display || placeholder || labels.choose}</span>
        <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
          <path d="M3 8.5h14M7 2.5v4M13 2.5v4" strokeLinecap="round" />
        </svg>
      </button>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0 opacity-0"
          required
          value={value}
          onChange={() => undefined}
        />
      )}
      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel ?? labels.choose}
          className="animate-pop absolute left-0 z-50 mt-2 w-[18.5rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-3 shadow-xl dark:bg-slate-900"
        >
          <div className="mb-2 flex items-center gap-1">
            <button type="button" className="flex size-8 items-center justify-center rounded-lg text-xl leading-none hover:bg-chip" aria-label={labels.prev} onClick={() => shiftMonth(-1)}>
              ‹
            </button>
            <Select
              className="flex-1"
              size="sm"
              ariaLabel="month"
              value={String(view.getMonth())}
              onChange={(month) => setView(new Date(view.getFullYear(), Number(month), 1))}
              options={MONTHS[locale].map((name, index) => ({ value: String(index), label: name }))}
            />
            <Select
              className="w-24"
              size="sm"
              ariaLabel="year"
              value={String(view.getFullYear())}
              onChange={(year) => setView(new Date(Number(year), view.getMonth(), 1))}
              options={years.map((year) => ({ value: String(year), label: String(year) }))}
            />
            <button type="button" className="flex size-8 items-center justify-center rounded-lg text-xl leading-none hover:bg-chip" aria-label={labels.next} onClick={() => shiftMonth(1)}>
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
            {WEEKDAYS[locale].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div role="grid" tabIndex={0} onKeyDown={onGridKey} className="grid grid-cols-7 gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            {days.map((date) => {
              const key = toDateKey(date);
              const outside = date.getMonth() !== view.getMonth();
              const disabled = isDisabled(date);
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;
              const focused = key === focusKey;
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  tabIndex={-1}
                  disabled={disabled}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => pick(date)}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-brand-600 font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-ink/25"
                        : `hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/15 ${outside ? "text-ink/35" : "text-ink"}`
                  } ${isToday && !isSelected ? "ring-1 ring-inset ring-brand-500 font-semibold" : ""} ${focused && !isSelected ? "bg-chip" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          {withTime && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
              <span className="font-medium">{labels.time}</span>
              <span className="flex items-center gap-1">
                <Select
                  className="w-20"
                  size="sm"
                  ariaLabel="hour"
                  disabled={!selected}
                  value={time.slice(0, 2)}
                  onChange={(hour) => selected && emit(selected, `${hour}:${time.slice(3, 5)}`)}
                  options={Array.from({ length: 24 }, (_, hour) => ({ value: pad(hour), label: pad(hour) }))}
                />
                :
                <Select
                  className="w-20"
                  size="sm"
                  ariaLabel="minute"
                  align="right"
                  disabled={!selected}
                  value={time.slice(3, 5)}
                  onChange={(minute) => selected && emit(selected, `${time.slice(0, 2)}:${minute}`)}
                  options={Array.from({ length: 12 }, (_, step) => ({ value: pad(step * 5), label: pad(step * 5) }))}
                />
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
            <button
              type="button"
              className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40"
              disabled={isDisabled(today)}
              onClick={() => pick(today)}
            >
              {labels.today}
            </button>
            <div className="flex gap-3">
              {clearable && value && (
                <button
                  type="button"
                  className="text-muted hover:text-ink"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  {labels.clear}
                </button>
              )}
              {withTime && (
                <button type="button" className="font-medium text-ink hover:text-brand-600" onClick={() => setOpen(false)}>
                  {labels.done}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
