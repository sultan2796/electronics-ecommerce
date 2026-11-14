import { ArrowRight } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { promotionService } from "../../services/promotion.service";

export interface PromoContent {
  id?: string;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  imageUrl: string;
  ctaText?: string | null;
  link?: string | null;
  badge?: string | null;
}

type Size = "side" | "wide";

function PromoLink({ href, className, onClick, children }: { href: string; className: string; onClick: () => void; children: ReactNode }) {
  if (/^https:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function PromoCard({ promo, size = "side", tracked = true, preview = false }: { promo: PromoContent; size?: Size; tracked?: boolean; preview?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = tracked ? promo.id : undefined;

  useEffect(() => {
    const node = ref.current;
    if (!id || !node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
          promotionService.trackImpression(id);
          observer.disconnect();
        }
      },
      { threshold: [0.5] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [id]);

  const wide = size === "wide";
  const body = (
    <div
      ref={ref}
      className={`group relative flex h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#16181d] via-[#111317] to-[#0b0c0f] text-white transition-colors duration-500 hover:border-white/[0.16] ${
        wide ? "min-h-[180px] flex-row items-center gap-4 p-6 sm:min-h-[200px] sm:gap-8 sm:p-8" : "min-h-[168px] flex-row items-stretch gap-3 p-5"
      }`}
    >
      <div className={`relative z-10 flex min-w-0 flex-1 flex-col ${wide ? "justify-center gap-2" : "justify-between gap-3"}`}>
        <div className="space-y-1.5">
          {(promo.eyebrow || promo.badge) && (
            <div className="flex flex-wrap items-center gap-2">
              {promo.eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9945c]">{promo.eyebrow}</p>}
              {promo.badge && <span className="rounded-full bg-[#f2662b] px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">{promo.badge}</span>}
            </div>
          )}
          <p className={`font-semibold leading-snug tracking-tight ${wide ? "text-xl sm:text-2xl" : "line-clamp-2 text-[17px]"}`}>{promo.title}</p>
          {promo.description && <p className={`text-white/60 ${wide ? "line-clamp-2 max-w-md text-sm" : "line-clamp-2 text-xs leading-relaxed"}`}>{promo.description}</p>}
        </div>
        {(promo.link || (preview && promo.ctaText)) && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/10 transition duration-300 group-hover:bg-white group-hover:text-[#111317]">
            {promo.ctaText || "Bax"}
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className={`relative z-10 flex shrink-0 items-center justify-center ${wide ? "h-32 w-32 sm:h-40 sm:w-48" : "w-[42%] max-w-[132px]"}`}>
        <img
          src={promo.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
      </div>
    </div>
  );

  if (!promo.link || preview) return body;
  return (
    <PromoLink href={promo.link} className="block h-full rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40" onClick={() => id && promotionService.trackClick(id)}>
      {body}
    </PromoLink>
  );
}
