import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL, WHATSAPP_URL } from "../../config/contact";
import Logo from "../brand/Logo";
import { Link } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { TranslationKey } from "../../i18n/dictionary";

const columns: { title: TranslationKey; links: { to: string; label: string }[] }[] = [
  {
    title: "footer.shop",
    links: [
      { to: "/products", label: "Bütün məhsullar" },
      { to: "/products?category=smartphones", label: "Smartfonlar" },
      { to: "/products?category=laptops", label: "Noutbuklar" },
      { to: "/compare", label: "Müqayisə" },
    ],
  },
  {
    title: "footer.account",
    links: [
      { to: "/profile", label: "Profilim" },
      { to: "/orders", label: "Sifarişlərim" },
      { to: "/wishlist", label: "İstək siyahısı" },
      { to: "/forgot-password", label: "Şifrə bərpası" },
    ],
  },
  {
    title: "footer.help",
    links: [
      { to: "/products?inStock=true", label: "Çatdırılma və ödəniş" },
      { to: "/orders", label: "Sifarişi izlə" },
      { to: "/profile", label: "Bonus balları" },
      { to: "/contact", label: "Əlaqə" },
    ],
  },
];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="hidden bg-[#0f172a] text-slate-300 md:block">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo tone="inverse" />
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">{t("footer.tagline")}</p>
          <div className="space-y-2 pt-1 text-sm">
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="flex items-center gap-2 font-semibold text-white transition hover:text-brand-500">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
              </svg>
              {CONTACT_PHONE_DISPLAY}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 transition hover:text-[#25d366]">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                <path d="M12 0a12 12 0 0 0-10.3 18.1L0 24l6-1.6A12 12 0 1 0 12 0zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8z" />
              </svg>
              WhatsApp
            </a>
          </div>
          <div className="flex gap-2 pt-1">
            {["VISA", "MC", "COD"].map((label) => (
              <span key={label} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400">
                {label}
              </span>
            ))}
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-white">{t(column.title)}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} ElectroShop. {t("footer.rights")}
          </span>
          <span>Bakı, Azərbaycan</span>
        </div>
      </div>
    </footer>
  );
}
