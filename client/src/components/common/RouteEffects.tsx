import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titles: [RegExp, string][] = [
  [/^\/$/, "Elektronika mağazası"],
  [/^\/products$/, "Məhsullar"],
  [/^\/compare/, "Müqayisə"],
  [/^\/cart/, "Səbət"],
  [/^\/wishlist/, "İstək siyahısı"],
  [/^\/checkout/, "Sifarişin rəsmiləşdirilməsi"],
  [/^\/orders\/.+/, "Sifariş detalları"],
  [/^\/orders/, "Sifarişlərim"],
  [/^\/profile/, "Profil"],
  [/^\/login/, "Giriş"],
  [/^\/register/, "Qeydiyyat"],
  [/^\/payment/, "Ödəniş"],
];

export default function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (pathname.startsWith("/admin") || /^\/products\/.+/.test(pathname)) return;
    const match = titles.find(([pattern]) => pattern.test(pathname));
    document.title = match ? `${match[1]} · ElectroShop` : "ElectroShop";
  }, [pathname]);

  return null;
}
