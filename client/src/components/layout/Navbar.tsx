import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCompare } from "../../context/CompareContext";
import { useWishlist } from "../../context/WishlistContext";
import FigmaIcon from "../common/FigmaIcon";
import ThemeToggle from "../common/ThemeToggle";
import SearchBox from "./SearchBox";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative whitespace-nowrap text-sm transition ${isActive ? "font-medium text-brand-600" : "text-ink/70 hover:text-ink"}`;

function Counter({ value }: { value: number }) {
  if (!value) return null;
  return (
    <span className="absolute -right-3 -top-2 min-w-[1.1rem] rounded-full bg-brand-600 px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white">
      {value}
    </span>
  );
}

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlist } = useWishlist();
  const { items: compare } = useCompare();
  const navigate = useNavigate();


  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand-600">
          ElectroShop
        </Link>
        <SearchBox className="hidden min-w-[180px] flex-1 lg:block" />
        <nav className="ml-auto flex items-center gap-4 lg:gap-6">
          <NavLink to="/products" className={(state) => `${linkClass(state)} hidden md:block`}>
            Məhsullar
          </NavLink>
          <NavLink to="/compare" className={(state) => `${linkClass(state)} hidden md:block`}>
            Müqayisə
            <Counter value={compare.length} />
          </NavLink>
          {user && (
            <span className="hidden items-center gap-4 md:flex lg:gap-6">
              <NavLink to="/wishlist" className={linkClass}>
                İstək siyahısı
                <Counter value={wishlist.length} />
              </NavLink>
              <NavLink to="/cart" className={linkClass}>
                Səbət
                <Counter value={itemCount} />
              </NavLink>
              <NavLink to="/orders" className={linkClass}>
                Sifarişlər
              </NavLink>
            </span>
          )}
          {isStaff && (
            <NavLink to="/admin" className={(state) => `${linkClass(state)} hidden md:block`}>
              Admin
            </NavLink>
          )}
          {user && (
            <NavLink to="/profile" className={linkClass} title={user.email}>
              <span className="hidden md:inline">Profil</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white md:hidden">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            </NavLink>
          )}
          <ThemeToggle />
          {user ? (
            <button className="btn-outline hidden px-4 py-1.5 md:inline-flex" onClick={() => logout().then(() => navigate("/"))}>
              Çıxış
            </button>
          ) : (
            <Link to="/login" className="btn-primary px-4 py-1.5">
              Giriş
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
