import { NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import FigmaIcon, { FigmaIconName } from "../common/FigmaIcon";

const items: { to: string; icon: FigmaIconName; label: string; end?: boolean; size: string }[] = [
  { to: "/", icon: "nav-home", label: "Ana səhifə", end: true, size: "h-[26px] w-6" },
  { to: "/cart", icon: "nav-cart", label: "Səbət", size: "h-[26px] w-[30px]" },
  { to: "/wishlist", icon: "nav-heart", label: "İstək siyahısı", size: "h-6 w-[27px]" },
  { to: "/orders", icon: "nav-bell", label: "Sifarişlər", size: "h-[26px] w-5" },
];

export default function BottomNav() {
  const { itemCount } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[66px] items-center justify-around rounded-t-[24px] bg-navbar md:hidden" aria-label="Əsas menyu">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} aria-label={item.label} className="relative flex h-full w-16 items-center justify-center">
          {({ isActive }) => (
            <>
              <span className={`flex flex-col items-center gap-1 transition ${isActive ? "text-brand-600 dark:text-brand-500" : "text-muted"}`}>
                <FigmaIcon name={item.icon} className="size-[22px]" />
                <span className={`h-1 w-1 rounded-full transition ${isActive ? "bg-current" : "bg-transparent"}`} />
              </span>
              {item.to === "/cart" && itemCount > 0 && (
                <span className="absolute right-2 top-3 min-w-[18px] rounded-full bg-brand-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {itemCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
