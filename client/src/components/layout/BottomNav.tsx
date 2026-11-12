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
              {item.icon === "nav-home" ? (
                <span className={`relative block ${item.size} overflow-visible`}>
                  <FigmaIcon
                    name="nav-home"
                    className={`absolute left-[-18px] top-[-18px] h-[66.09px] w-16 max-w-none ${isActive ? "" : "opacity-40 grayscale"}`}
                  />
                </span>
              ) : (
                <FigmaIcon
                  name={item.icon}
                  className={`${item.size} ${isActive ? "opacity-100 dark:invert-0 [filter:brightness(0)_saturate(100%)_invert(48%)_sepia(84%)_saturate(2817%)_hue-rotate(352deg)_brightness(101%)_contrast(99%)]" : "dark:invert"}`}
                />
              )}
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
