import AdminSearch from "../../components/admin/AdminSearch";
import Avatar from "../../components/user/Avatar";
import {
  Box,
  ChartColumn,
  ClipboardList,
  GalleryHorizontal,
  LayoutDashboard,
  LayoutGrid,
  CreditCard,
  Tags,
  LogOut,
  LucideIcon,
  Mail,
  Menu,
  Package,
  PanelLeftClose,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  Store,
  TicketPercent,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../../components/brand/BrandMark";
import Logo from "../../components/brand/Logo";
import ThemeToggle from "../../components/common/ThemeToggle";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { Permission } from "../../types";

type IconName =
  | "dashboard"
  | "orders"
  | "payments"
  | "inventory"
  | "categories"
  | "brands"
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

const icons: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  payments: CreditCard,
  inventory: Package,
  categories: LayoutGrid,
  brands: Tags,
  users: Users,
  plus: Plus,
  reviews: Star,
  emails: Mail,
  campaigns: Zap,
  slides: GalleryHorizontal,
  reports: ChartColumn,
  audit: ClipboardList,
  coupons: TicketPercent,
  cube: Box,
  settings: Settings,
  collapse: PanelLeftClose,
  store: Store,
  logout: LogOut,
};

function Icon({ name, className = "size-[18px]" }: { name: IconName; className?: string }) {
  const Glyph = icons[name];
  return <Glyph className={`${className} shrink-0`} strokeWidth={1.8} aria-hidden="true" />;
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
      { to: "/admin/payments", label: "Ödənişlər", permission: "orders:read", icon: "payments" },
      { to: "/admin/users", label: "Müştərilər", permission: "users:read", icon: "users" },
      { to: "/admin/reviews", label: "Rəylər", permission: "reviews:moderate", icon: "reviews" },
    ],
  },
  {
    title: "Kataloq",
    items: [
      { to: "/admin/inventory", label: "Məhsullar", permission: "inventory:write", icon: "inventory" },
      { to: "/admin/categories", label: "Kateqoriyalar", permission: "categories:write", icon: "categories" },
      { to: "/admin/brands", label: "Brendlər", permission: "categories:write", icon: "brands" },
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
  ["/admin/brands", "Brendlər"],
  ["/admin/users", "Müştərilər"],
  ["/admin/reviews", "Rəylər"],
  ["/admin/emails", "E-poçtlar"],
  ["/admin/payments", "Ödənişlər"],
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
            <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
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
          <AdminSearch />
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
                <Avatar name={user.name} src={user.avatarUrl} className="size-8 text-sm" />
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
