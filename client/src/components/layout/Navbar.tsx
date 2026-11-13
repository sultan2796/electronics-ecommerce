import Avatar from "../user/Avatar";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../../config/contact";
import { Heart, LucideIcon, Phone, Scale, ShoppingCart, Truck, UserRound } from "lucide-react";
import Logo from "../brand/Logo";
import { useDeliveryText } from "../common/DeliveryNote";
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

const icons = { heart: Heart, cart: ShoppingCart, user: UserRound, scale: Scale, truck: Truck, phone: Phone } satisfies Record<string, LucideIcon>;

function Icon({ name, className = "size-[22px]" }: { name: keyof typeof icons; className?: string }) {
  const Glyph = icons[name];
  return <Glyph className={className} strokeWidth={1.7} aria-hidden="true" />;
}

function Action({ to, icon, label, count, avatar }: { to: string; icon: keyof typeof icons; label: string; count?: number; avatar?: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[11px] transition ${isActive ? "text-brand-600" : "text-ink/70 hover:bg-chip hover:text-ink"}`
      }
    >
      {avatar ?? <Icon name={icon} />}
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
  const deliveryText = useDeliveryText();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-surface/95 shadow-[0_1px_0_rgb(var(--line))] backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="hidden bg-[#0f172a] text-white dark:border-b dark:border-line dark:bg-[#0b0c0e] md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span className="flex items-center gap-2 text-white/75">
            <Icon name="truck" className="size-4" />
            {deliveryText ? `${t("benefit.delivery")} · ${deliveryText}` : t("benefit.delivery")}
          </span>
          <div className="flex items-center gap-5">
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="flex items-center gap-1.5 text-white/75 transition hover:text-white">
              <Icon name="phone" className="size-3.5" />
              {CONTACT_PHONE_DISPLAY}
            </a>
            <Link to="/contact" className="text-white/75 transition hover:text-white">
              Əlaqə
            </Link>
            <div className="flex overflow-hidden rounded-md ring-1 ring-white/20" role="group" aria-label="Dil">
              {locales.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLocale(item.code)}
                  aria-pressed={locale === item.code}
                  className={`px-2 py-0.5 text-[11px] font-semibold transition ${locale === item.code ? "bg-white text-[#0f172a]" : "text-white/70 hover:text-white"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
        <Link to="/" className="flex shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--ring)/0.3)]" aria-label="ElectroShop">
          <Logo />
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
              <Action to="/profile" icon="user" label={user.name.split(" ")[0]} avatar={user.avatarUrl ? <Avatar name={user.name} src={user.avatarUrl} className="size-6 text-[10px]" /> : undefined} />
              <div className="invisible absolute right-0 top-full z-40 w-56 translate-y-1 rounded-2xl border border-line bg-surface p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex items-center gap-2.5 border-b border-line px-3 pb-2 pt-1">
                  <Avatar name={user.name} src={user.avatarUrl} className="size-9 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted">{`${user.points ?? 0} bonus bal`}</p>
                  </div>
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
