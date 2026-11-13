import { AlertTriangle, Bell, Mail, MessageSquare, PackageX, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AdminNotice, adminService } from "../../services/admin.service";

const SEEN_KEY = "electroshop:admin-notices-seen";
const POLL_MS = 60_000;

const icons = { order: ShoppingBag, refund: AlertTriangle, stock: PackageX, review: MessageSquare, email: Mail };
const tones = {
  order: "bg-sky-50 text-sky-600 dark:bg-sky-500/15",
  refund: "bg-red-50 text-red-600 dark:bg-red-500/15",
  stock: "bg-amber-50 text-amber-600 dark:bg-amber-500/15",
  review: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15",
  email: "bg-red-50 text-red-600 dark:bg-red-500/15",
};

const readSeen = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
};

const ago = (value: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "indicə";
  if (minutes < 60) return `${minutes} dəq əvvəl`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  return `${Math.round(hours / 24)} gün əvvəl`;
};

export default function AdminNotifications() {
  const [items, setItems] = useState<AdminNotice[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(readSeen);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (document.visibilityState === "hidden") return;
    adminService
      .notifications()
      .then((data) => setItems(data.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((item) => new Date(item.createdAt).getTime() > seen).length;

  const markSeen = () => {
    const now = Date.now();
    setSeen(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {
      return;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Bildirişlər, ${unread} oxunmamış` : "Bildirişlər"}
        className="relative flex size-10 items-center justify-center rounded-full border border-line text-ink/70 transition hover:bg-chip hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
      >
        <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white ring-2 ring-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Bildirişlər" className="animate-pop fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Bildirişlər</p>
            {unread > 0 && (
              <button type="button" className="text-xs text-brand-600" onClick={markSeen}>
                Hamısını oxunmuş et
              </button>
            )}
          </div>
          {items.length ? (
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {items.map((item) => {
                const Icon = icons[item.kind];
                const fresh = new Date(item.createdAt).getTime() > seen;
                return (
                  <li key={item.id}>
                    <Link to={item.to} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-chip">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tones[item.kind]}`}>
                        <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          {fresh && <span className="size-1.5 shrink-0 rounded-full bg-brand-600" aria-label="Yeni" />}
                        </span>
                        <span className="block truncate text-xs text-muted">{item.detail}</span>
                        <span className="block text-[11px] text-muted">{ago(item.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted">Yeni bildiriş yoxdur</p>
          )}
        </div>
      )}
    </div>
  );
}
