import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/common/ThemeToggle";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { Permission } from "../../types";

type IconName = "dashboard" | "orders" | "inventory" | "categories" | "users" | "plus" | "reviews" | "emails";

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: <path d="M4 13h6V4H4zm10 7h6V11h-6zM4 20h6v-4H4zm10-11h6V4h-6z" />,
  orders: <path d="M6 3h12l1 5H5zM5 8h14v12H5zM9 12h6" />,
  inventory: <path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10" />,
  categories: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  users: <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  reviews: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />,
  emails: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  );
}

const links: { to: string; label: string; end: boolean; permission: Permission; icon: IconName }[] = [
  { to: "/admin", label: "İcmal", end: true, permission: "dashboard:read", icon: "dashboard" },
  { to: "/admin/orders", label: "Sifarişlər", end: false, permission: "orders:read", icon: "orders" },
  { to: "/admin/inventory", label: "Anbar", end: false, permission: "inventory:write", icon: "inventory" },
  { to: "/admin/categories", label: "Kateqoriyalar", end: false, permission: "categories:write", icon: "categories" },
  { to: "/admin/users", label: "İstifadəçilər", end: false, permission: "users:read", icon: "users" },
  { to: "/admin/reviews", label: "Rəylər", end: false, permission: "reviews:moderate", icon: "reviews" },
  { to: "/admin/emails", label: "E-poçtlar", end: false, permission: "emails:read", icon: "emails" },
  { to: "/admin/products/new", label: "Yeni məhsul", end: true, permission: "products:write", icon: "plus" },
];

const titleFor = (pathname: string) => {
  if (pathname === "/admin") return "İcmal";
  if (pathname.startsWith("/admin/orders")) return "Sifarişlər";
  if (pathname.startsWith("/admin/inventory")) return "Anbar";
  if (pathname.startsWith("/admin/categories")) return "Kateqoriyalar";
  if (pathname.startsWith("/admin/users")) return "İstifadəçilər";
  if (pathname.startsWith("/admin/reviews")) return "Rəylər";
  if (pathname.startsWith("/admin/emails")) return "E-poçtlar";
  if (pathname === "/admin/products/new") return "Yeni məhsul";
  if (pathname.startsWith("/admin/products/")) return "Məhsulu redaktə et";
  return "Admin panel";
};

export default function AdminLayout() {
  const { user, can, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const title = titleFor(pathname);

  useEffect(() => {
    setOpen(false);
    document.title = `${title} · ElectroShop Admin`;
  }, [pathname, title]);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/admin" className="flex items-center gap-2 px-2 pt-1">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">E</span>
        <span className="leading-tight">
          <span className="block text-sm font-bold">ElectroShop</span>
          <span className="block text-[11px] text-muted">İdarəetmə paneli</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Admin menyu">
        {links
          .filter((link) => can(link.permission))
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand-600 text-white shadow-cta" : "text-ink/70 hover:bg-chip hover:text-ink"
                }`
              }
            >
              <Icon name={link.icon} />
              {link.label}
            </NavLink>
          ))}
      </nav>

      <div className="space-y-3 rounded-2xl bg-chip p-3">
        {user && (
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block text-[11px] text-muted">{roleLabels[user.role]}</span>
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <Link to="/" className="btn-outline flex-1 px-2 py-1.5 text-xs">
            Mağaza
          </Link>
          <button type="button" className="btn-outline flex-1 px-2 py-1.5 text-xs" onClick={() => logout().then(() => navigate("/login"))}>
            Çıxış
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menyu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Menyunu bağla" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[260px] bg-surface shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border border-line lg:hidden"
            aria-label="Menyunu aç"
            onClick={() => setOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted">Admin panel</p>
            <p className="truncate text-base font-semibold">{title}</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-16 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
