import { useSiteSettings } from "../../context/SiteSettingsContext";
import BrandMark from "./BrandMark";

interface LogoProps {
  size?: "sm" | "md";
  tone?: "default" | "inverse";
  subtitle?: string;
}

export default function Logo({ size = "md", tone = "default", subtitle }: LogoProps) {
  const { settings } = useSiteSettings();
  const mark = size === "sm" ? "size-8" : "size-9";

  if (settings.logoUrl) {
    return <img src={settings.logoUrl} alt="ElectroShop" className={`${size === "sm" ? "h-8" : "h-9"} w-auto max-w-[180px] object-contain`} />;
  }

  return (
    <span className="flex items-center gap-2.5">
      {settings.logoIconUrl ? <img src={settings.logoIconUrl} alt="" className={`${mark} rounded-[9px] object-contain`} /> : <BrandMark className={mark} />}
      <span className="leading-none">
        <span
          lang="en"
          translate="no"
          className={`block font-bold tracking-[-0.02em] ${size === "sm" ? "text-[15px]" : "text-lg"} ${tone === "inverse" ? "text-white" : "text-ink"}`}
        >
          Electro<span className={tone === "inverse" ? "text-brand-500" : "text-brand-600 dark:text-brand-500"}>Shop</span>
        </span>
        {subtitle && <span className="mt-1 block text-[11px] font-medium text-muted">{subtitle}</span>}
      </span>
    </span>
  );
}
