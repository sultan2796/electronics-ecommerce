import { ArrowUpRight, LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { promotionService } from "../../services/promotion.service";

export interface PromoContent {
  id?: string;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: LucideIcon;
  ctaText?: string | null;
  link?: string | null;
  badge?: string | null;
}

type Size = "side" | "wide";
export type PromoTone = "warm" | "cool";

export const toneAt = (index: number): PromoTone => (index % 2 === 0 ? "warm" : "cool");

const tones: Record<PromoTone, { card: string; eyebrow: string; medallion: string; iconColor: string; ringBorder: string }> = {
  warm: {
    card: "border-[#ecdcc8] bg-gradient-to-br from-[#fffaf4] via-[#fbf1e5] to-[#f5e6d3] hover:border-[#dfc7aa] dark:border-white/[0.08] dark:from-[#1b1915] dark:via-[#15140f] dark:to-[#0f0e0b] dark:hover:border-white/[0.16]",
    eyebrow: "text-[#8a5a2b] dark:text-[#d1a26f]",
    medallion: "from-white to-[#f7ebdc] ring-[#ead6bd] dark:from-[#2a2620] dark:to-[#1a1814] dark:ring-white/10",
    iconColor: "text-[#b07a45] dark:text-[#d9ad7c]",
    ringBorder: "border-[#e8d3b8] dark:border-white/[0.08]",
  },
  cool: {
    card: "border-[#dde3ec] bg-gradient-to-br from-[#f9fbfd] via-[#f1f4f8] to-[#e7ecf3] hover:border-[#c9d2de] dark:border-white/[0.08] dark:from-[#17191e] dark:via-[#121418] dark:to-[#0c0d10] dark:hover:border-white/[0.16]",
    eyebrow: "text-[#475569] dark:text-[#9fb0c8]",
    medallion: "from-white to-[#e9eef5] ring-[#d6dee9] dark:from-[#23262d] dark:to-[#16181d] dark:ring-white/10",
    iconColor: "text-[#3f4f66] dark:text-[#c3cfdf]",
    ringBorder: "border-[#d3dce8] dark:border-white/[0.08]",
  },
};

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

function Medallion({ icon: Icon, style, wide }: { icon: LucideIcon; style: (typeof tones)[PromoTone]; wide: boolean }) {
  return (
    <span className={`relative flex items-center justify-center ${wide ? "size-32 sm:size-36" : "size-[104px]"}`} aria-hidden="true">
      <span className={`absolute inset-0 rounded-full border ${style.ringBorder}`} />
      <span className={`absolute inset-[13%] rounded-full border border-dashed ${style.ringBorder} transition-transform duration-[1200ms] ease-out group-hover:rotate-90`} />
      <span className={`relative flex size-[64%] items-center justify-center rounded-full bg-gradient-to-b ring-1 ring-inset ${style.medallion} transition-transform duration-500 ease-out group-hover:scale-[1.06]`}>
        <Icon className={`size-[48%] ${style.iconColor}`} strokeWidth={1.4} />
      </span>
    </span>
  );
}

export default function PromoCard({
  promo,
  size = "side",
  tone = "warm",
  tracked = true,
  preview = false,
}: {
  promo: PromoContent;
  size?: Size;
  tone?: PromoTone;
  tracked?: boolean;
  preview?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = tracked ? promo.id : undefined;
  const style = tones[tone];

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
  const showCta = Boolean(promo.link || (preview && promo.ctaText));
  const body = (
    <div
      ref={ref}
      className={`group relative flex h-full overflow-hidden rounded-3xl border text-ink transition-colors duration-500 dark:text-white ${style.card} ${
        wide ? "min-h-[180px] flex-row items-center gap-4 p-6 sm:min-h-[200px] sm:gap-8 sm:p-8" : "min-h-[168px] flex-row items-stretch gap-3 p-5"
      }`}
    >
      <div className={`relative z-10 flex min-w-0 flex-1 flex-col ${wide ? "justify-center gap-3" : "justify-between gap-3"}`}>
        <div className="space-y-1.5">
          {(promo.eyebrow || promo.badge) && (
            <div className="flex flex-wrap items-center gap-2">
              {promo.eyebrow && <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${style.eyebrow}`}>{promo.eyebrow}</p>}
              {promo.badge && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">{promo.badge}</span>}
            </div>
          )}
          <p className={`font-semibold leading-snug tracking-tight ${wide ? "text-xl sm:text-2xl" : "line-clamp-2 text-[17px]"}`}>{promo.title}</p>
          {promo.description && (
            <p className={`text-ink/70 dark:text-white/65 ${wide ? "line-clamp-2 max-w-md text-sm" : "line-clamp-2 text-xs leading-relaxed"}`}>{promo.description}</p>
          )}
        </div>
        {showCta && (
          <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink transition-colors duration-300 group-hover:text-brand-600 dark:text-white dark:group-hover:text-[#e7b98a]">
            {promo.ctaText || "Bax"}
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-surface transition duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-600 group-hover:text-white dark:bg-white dark:text-[#111317]">
              <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </span>
          </span>
        )}
      </div>
      <div className={`relative z-10 flex shrink-0 items-center justify-center ${wide ? "h-32 w-32 sm:h-40 sm:w-48" : "w-[40%] max-w-[124px]"}`}>
        {promo.imageUrl ? (
          <img
            src={promo.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : promo.icon ? (
          <Medallion icon={promo.icon} style={style} wide={wide} />
        ) : null}
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
