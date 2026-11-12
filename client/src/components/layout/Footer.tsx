import { Link } from "react-router-dom";

const columns = [
  {
    title: "Mağaza",
    links: [
      { to: "/products", label: "Bütün məhsullar" },
      { to: "/products?category=smartphones", label: "Smartfonlar" },
      { to: "/products?category=laptops", label: "Noutbuklar" },
      { to: "/compare", label: "Müqayisə" },
    ],
  },
  {
    title: "Hesab",
    links: [
      { to: "/profile", label: "Profilim" },
      { to: "/orders", label: "Sifarişlərim" },
      { to: "/wishlist", label: "İstək siyahısı" },
      { to: "/forgot-password", label: "Şifrə bərpası" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="hidden border-t border-chip bg-navbar md:block">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-base font-bold text-ink">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">E</span>
            ElectroShop
          </p>
          <p className="max-w-xs text-sm text-muted">Smartfon, noutbuk, planşet və aksesuarlar — rəsmi zəmanət və sürətli çatdırılma ilə.</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-ink">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted transition hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-chip py-4 text-center text-xs text-muted">© {new Date().getFullYear()} ElectroShop. Bütün hüquqlar qorunur.</div>
    </footer>
  );
}
