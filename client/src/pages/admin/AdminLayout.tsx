import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../../components/brand/BrandMark";
import Logo from "../../components/brand/Logo";
import ThemeToggle from "../../components/common/ThemeToggle";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { Permission } from "../../types";

type IconName =
  | "dashboard"
  | "orders"
  | "inventory"
  | "categories"
  | "users"
  | "plus"
  | "reviews"
  | "emails"
  | "coupons"
  | "campaigns"
  | "reports"
  | "audit"
  | "slides"
  | "cube"
  | "settings"
  | "collapse"
  | "store"
  | "logout";

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: <path d="M4 13h6V4H4zm10 7h6V11h-6zM4 20h6v-4H4zm10-11h6V4h-6z" />,
  orders: <path d="M6 3h12l1 5H5zM5 8h14v12H5zM9 12h6" />,
  inventory: <path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10" />,
  categories: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  users: <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  reviews: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />,
  emails: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  campaigns: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  slides: <path d="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M8.5 9.5h.01" />,
  reports: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  audit: <path d="M9 3h6l1 2h3v16H5V5h3zM9 12h6M9 16h4" />,
  coupons: <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM9 9l6 6M9.5 14.5h.01M14.5 9.5h.01" />,
  cube: <path d="M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10" />,
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  ),
  collapse: <path d="M15 6l-6 6 6 6M20 4v16" />,
  store: <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
};

function Icon({ name, className = "size-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  permission: Permission;
  icon: IconName;
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Ümumi",
    items: [
      { to: "/admin", label: "İcmal", end: true, permission: "dashboard:read", icon: "dashboard" },
      { to: "/admin/reports", label: "Analitika", permission: "dashboard:read", icon: "reports" },
    ],
  },
  {
    title: "Satış",
    items: [
      { to: "/admin/orders", label: "Sifarişlər", permission: "orders:read", icon: "orders" },
      { to: "/admin/users", label: "Müştərilər", permission: "users:read", icon: "users" },
      { to: "/admin/reviews", label: "Rəylər", permission: "reviews:moderate", icon: "reviews" },
    ],
  },
  {
    title: "Kataloq",
    items: [
      { to: "/admin/inventory", label: "Məhsullar", permission: "inventory:write", icon: "inventory" },
      { to: "/admin/categories", label: "Kateqoriyalar", permission: "categories:write", icon: "categories" },
      { to: "/admin/models", label: "3D modellər", permission: "products:write", icon: "cube" },
      { to: "/admin/products/new", label: "Yeni məhsul", end: true, permission: "products:write", icon: "plus" },
    ],
  },
  {
    title: "Marketinq",
    items: [
      { to: "/admin/slides", label: "Slayder və bannerlər", permission: "products:write", icon: "slides" },
      { to: "/admin/campaigns", label: "Kampaniyalar", permission: "products:write", icon: "campaigns" },
      { to: "/admin/coupons", label: "Kuponlar", permission: "products:write", icon: "coupons" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { to: "/admin/emails", label: "E-poçtlar", permission: "emails:read", icon: "emails" },
      { to: "/admin/audit", label: "Əməliyyat jurnalı", permission: "users:read", icon: "audit" },
      { to: "/admin/settings", label: "Parametrlər", permission: "settings:write", icon: "settings" },
    ],
  },
];

const titles: [string, string][] = [
  ["/admin/orders", "Sifarişlər"],
  ["/admin/inventory", "Məhsullar"],
  ["/admin/categories", "Kateqoriyalar"],
  ["/admin/users", "Müştərilər"],
  ["/admin/reviews", "Rəylər"],
  ["/admin/emails", "E-poçtlar"],
  ["/admin/coupons", "Kuponlar"],
  ["/admin/campaigns", "Kampaniyalar"],
  ["/admin/slides", "Slayder və bannerlər"],
  ["/admin/models", "3D modellər"],
  ["/admin/reports", "Analitika"],
  ["/admin/audit", "Əməliyyat jurnalı"],
  ["/admin/settings", "Parametrlər"],
  ["/admin/products/new", "Yeni məhsul"],
  ["/admin/products/", "Məhsulu redaktə et"],
];

const titleFor = (pathname: string) => (pathname === "/admin" ? "İcmal" : (titles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Admin panel"));

const COLLAPSE_KEY = "electroshop:admin-sidebar";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

export default function AdminLayout() {
  const { user, can, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = titleFor(pathname);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
    document.title = `${title} · ElectroShop Admin`;
  }, [pathname, title]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      return;
    }
  }, [collapsed]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const signOut = () => logout().then(() => navigate("/login"));

  const sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center border-b border-line ${compact ? "justify-center px-2" : "px-5"}`}>
        <Link to="/admin" className="flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--ring)/0.3)]" aria-label="İcmal">
          {compact ? <BrandMark className="size-9" /> : <Logo size="sm" subtitle="İdarəetmə paneli" />}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin menyu">
        {groups.map((group) => {
          const items = group.items.filter((item) => can(item.permission));
          if (!items.length) return null;
          return (
            <div key={group.title}>
              {compact ? (
                <div className="mx-auto mb-2 h-px w-6 bg-line" />
              ) : (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{group.title}</p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      title={compact ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring)/0.4)] ${
                          compact ? "justify-center p-2.5" : "px-3 py-2"
                        } ${isActive ? "bg-brand-50 text-brand-700 dark:text-brand-500" : "text-ink/70 hover:bg-chip hover:text-ink"}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-brand-600" aria-hidden="true" />}
                          <Icon name={item.icon} />
                          {compact ? <span className="sr-only">{item.label}</span> : item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={`shrink-0 border-t border-line p-3 ${compact ? "flex justify-center" : ""}`}>
        <Link
          to="/"
          title={compact ? "Mağazaya keç" : undefined}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-ink/70 transition hover:bg-chip hover:text-ink ${compact ? "p-2.5" : "px-3 py-2"}`}
        >
          <Icon name="store" />
          {compact ? <span className="sr-only">Mağazaya keç</span> : "Mağazaya keç"}
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-canvas lg:grid ${collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[256px_1fr]"} lg:transition-[grid-template-columns] lg:duration-300`}>
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">{sidebar(collapsed)}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menyu">
          <button type="button" className="absolute inset-0 animate-[page-in_0.2s_ease-out] bg-black/40" aria-label="Menyunu bağla" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[272px] animate-[page-in_0.25s_ease-out] bg-surface shadow-2xl">{sidebar(false)}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:px-8">
          <button type="button" className="btn-ghost btn-icon size-9 lg:hidden" aria-label="Menyunu aç" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-ghost btn-icon hidden size-9 lg:inline-flex"
            aria-label={collapsed ? "Menyunu genişləndir" : "Menyunu yığ"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <Icon name="collapse" className={`size-[18px] transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Admin panel</p>
            <p className="truncate text-base font-semibold leading-tight">{title}</p>
          </div>
          <ThemeToggle />
          {user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full p-1 pr-2 transition hover:bg-chip focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--ring)/0.3)] sm:pr-3"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((value) => !value)}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden min-w-0 text-left leading-tight sm:block">
                  <span className="block max-w-[140px] truncate text-sm font-medium">{user.name}</span>
                  <span className="block text-[11px] text-muted">{roleLabels[user.role]}</span>
                </span>
              </button>
              {menuOpen && (
                <div role="menu" className="animate-pop absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-xl">
                  <p className="truncate border-b border-line px-4 pb-2 pt-1 text-xs text-muted">{user.email}</p>
                  <Link role="menuitem" to="/" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-chip">
                    <Icon name="store" className="size-4" />
                    Mağazaya keç
                  </Link>
                  {can("settings:write") && (
                    <Link role="menuitem" to="/admin/settings" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-chip">
                      <Icon name="settings" className="size-4" />
                      Parametrlər
                    </Link>
                  )}
                  <button role="menuitem" type="button" className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft" onClick={() => void signOut()}>
                    <Icon name="logout" className="size-4" />
                    Çıxış
                  </button>
                </div>
              )}
            </div>
          )}
        </header>
        <main className="animate-page mx-auto w-full max-w-7xl flex-1 p-4 pb-16 lg:p-8" key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
