import { KeyboardEvent, ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  searchable?: boolean;
  align?: "left" | "right";
}

export default function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Seçin",
  className = "",
  buttonClassName = "",
  ariaLabel,
  size = "md",
  disabled = false,
  searchable,
  align = "left",
}: SelectProps<T>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const typeahead = useRef({ text: "", timer: 0 });

  const withSearch = searchable ?? options.length > 8;
  const selected = options.find((option) => option.value === value) ?? null;
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("az");
    return term ? options.filter((option) => option.label.toLocaleLowerCase("az").includes(term)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const [menuBox, setMenuBox] = useState<{ left: number; width: number } | null>(null);
  const hasHints = options.some((option) => option.hint);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setDropUp(window.innerHeight - rect.bottom < 280 && rect.top > 300);
    const viewport = document.documentElement.clientWidth || window.innerWidth;
    const width = Math.min(Math.max(rect.width, hasHints ? 288 : rect.width), viewport - 24);
    const preferred = align === "right" ? rect.width - width : 0;
    const left = Math.min(Math.max(preferred, 12 - rect.left), viewport - 12 - width - rect.left);
    setMenuBox({ left, width });
    if (withSearch) searchRef.current?.focus();
  }, [open, withSearch, align, hasHints]);

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, open]);

  const openList = () => {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  };

  const choose = (option: SelectOption<T> | undefined) => {
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const move = (step: number) => {
    if (!visible.length) return;
    let next = active;
    for (let i = 0; i < visible.length; i += 1) {
      next = (next + step + visible.length) % visible.length;
      if (!visible[next].disabled) break;
    }
    setActive(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(visible.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(visible[active]);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    } else if (!withSearch && event.key.length === 1) {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.text += event.key.toLocaleLowerCase("az");
      typeahead.current.timer = window.setTimeout(() => (typeahead.current.text = ""), 600);
      const found = visible.findIndex((option) => option.label.toLocaleLowerCase("az").startsWith(typeahead.current.text));
      if (found >= 0) setActive(found);
    }
  };

  const height = size === "sm" ? "h-9 text-sm" : "h-11 text-sm";

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        className={`flex w-full items-center gap-2 rounded-xl border bg-surface px-3.5 text-left transition ${height} ${
          open ? "border-brand-500 ring-4 ring-brand-500/10" : "border-line hover:border-ink/30"
        } disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        {selected?.icon}
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-ink" : "text-muted"}`}>{selected?.label ?? placeholder}</span>
        <svg viewBox="0 0 20 20" className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_45px_-15px_rgba(15,23,42,0.35)] ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={menuBox ? { left: menuBox.left, width: menuBox.width } : { left: 0, minWidth: "100%" }}
        >
          {withSearch && (
            <div className="border-b border-line p-2">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder="Axtar..."
                aria-label="Seçimlərdə axtar"
                className="h-9 w-full rounded-lg bg-chip px-3 text-sm text-ink outline-none placeholder:text-muted"
              />
            </div>
          )}
          <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={ariaLabel} className="max-h-[min(22rem,60vh)] overflow-y-auto overscroll-contain p-1.5">
            {visible.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">Nəticə yoxdur</li>}
            {visible.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value || "__empty"}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    option.disabled ? "cursor-not-allowed opacity-40" : index === active ? "bg-chip text-ink" : "text-ink/80"
                  } ${isSelected ? "font-semibold text-ink" : ""}`}
                >
                  {option.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block">{option.label}</span>
                    {option.hint && <span className="block text-xs font-normal text-muted">{option.hint}</span>}
                  </span>
                  {isSelected && (
                    <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
