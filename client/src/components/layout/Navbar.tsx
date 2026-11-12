import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCompare } from "../../context/CompareContext";
import { useI18n } from "../../context/I18nContext";
import { useWishlist } from "../../context/WishlistContext";
import { locales } from "../../i18n/dictionary";
import ThemeToggle from "../common/ThemeToggle";
import SearchBox from "./SearchBox";

const icons = {
  heart: "M12 20s-7-4.4-9.2-8.6C1.1 8.1 3 4.5 6.6 4.5c2 0 3.3 1.1 4.1 2.3h.6c.8-1.2 2.1-2.3 4.1-2.3 3.6 0 5.5 3.6 3.8 6.9C19 15.6 12 20 12 20z",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  scale: "M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zm14 0-3 7a4 4 0 0 0 6 0z",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
};

function Icon({ name, className = "size-[22px]" }: { name: keyof typeof icons; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}

function Action({ to, icon, label, count }: { to: string; icon: keyof typeof icons; label: string; count?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[11px] transition ${isActive ? "text-brand-600" : "text-ink/70 hover:bg-chip hover:text-ink"}`
      }
    >
      <Icon name={icon} />
      <span className="hidden xl:block">{label}</span>
      {Boolean(count) && (
        <span className="absolute right-1 top-0 min-w-[18px] rounded-full bg-brand-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white ring-2 ring-surface">
          {count}
        </span>
      )}
    </NavLink>
  );
}

const categoryLinks = [
  { to: "/products?category=smartphones", label: { az: "Smartfonlar", ru: "Смартфоны", en: "Smartphones" } },
  { to: "/products?category=laptops", label: { az: "Noutbuklar", ru: "Ноутбуки", en: "Laptops" } },
  { to: "/products?category=tablets", label: { az: "Planşetlər", ru: "Планшеты", en: "Tablets" } },
  { to: "/products?category=mobile-accessories", label: { az: "Aksesuarlar", ru: "Аксессуары", en: "Accessories" } },
];

function TopLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="whitespace-nowrap text-sm font-medium text-ink/80 transition hover:text-brand-600">
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlist } = useWishlist();
  const { items: compare } = useCompare();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-surface/95 shadow-[0_1px_0_rgb(var(--line))] backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="hidden bg-ink text-surface md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span className="flex items-center gap-2 text-surface/80">
            <Icon name="truck" className="size-4" />
            {t("benefit.delivery")} · {t("benefit.deliveryText")}
          </span>
          <div className="flex items-center gap-5">
            <a href="tel:+994120000000" className="flex items-center gap-1.5 text-surface/80 transition hover:text-surface">
              <Icon name="phone" className="size-3.5" />
              *0000
            </a>
            <div className="flex overflow-hidden rounded-md ring-1 ring-surface/20" role="group" aria-label="Dil">
              {locales.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLocale(item.code)}
                  aria-pressed={locale === item.code}
                  className={`px-2 py-0.5 text-[11px] font-semibold transition ${locale === item.code ? "bg-surface text-ink" : "text-surface/70 hover:text-surface"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="ElectroShop">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white shadow-sm">E</span>
          <span className="text-lg font-bold tracking-tight text-ink">
            Electro<span className="text-brand-600">Shop</span>
          </span>
        </Link>

        <SearchBox className="hidden flex-1 lg:block" />

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <span className="hidden md:block">
            <Action to="/compare" icon="scale" label={t("nav.compare")} count={compare.length} />
          </span>
          {user && (
            <span className="hidden md:block">
              <Action to="/wishlist" icon="heart" label={t("nav.wishlist")} count={wishlist.length} />
            </span>
          )}
          <span className="hidden md:block">
            <Action to={user ? "/cart" : "/login"} icon="cart" label={t("nav.cart")} count={itemCount} />
          </span>
          {user ? (
            <div className="group relative">
              <Action to="/profile" icon="user" label={user.name.split(" ")[0]} />
              <div className="invisible absolute right-0 top-full z-40 w-56 translate-y-1 rounded-2xl border border-line bg-surface p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="border-b border-line px-3 pb-2 pt-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted">{user.points ?? 0} bonus bal</p>
                </div>
                {[
                  { to: "/profile", label: t("nav.profile") },
                  { to: "/orders", label: t("nav.orders") },
                  { to: "/wishlist", label: t("nav.wishlist") },
                  ...(isStaff ? [{ to: "/admin", label: t("nav.admin") }] : []),
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="block rounded-lg px-3 py-2 text-sm text-ink/80 transition hover:bg-chip hover:text-ink">
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => logout().then(() => navigate("/"))}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary ml-1 px-4 py-2">
              {t("nav.login")}
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>

      <div className="px-4 pb-3 lg:hidden">
        <SearchBox />
      </div>

      <div className="hidden border-t border-line md:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-7 px-4">
          <TopLink to="/products">{t("nav.products")}</TopLink>
          {categoryLinks.map((item) => (
            <TopLink key={item.to} to={item.to}>
              {item.label[locale]}
            </TopLink>
          ))}
          <Link to="/products?sort=price_asc&inStock=true" className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700">
            <span className="size-2 animate-pulse rounded-full bg-red-600" />
            {t("nav.deals")}
          </Link>
        </div>
      </div>
    </header>
  );
}
