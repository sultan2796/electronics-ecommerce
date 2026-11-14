import { ArrowRight, CalendarClock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { CampaignShowcase as Showcase, Promotion } from "../../types";
import { Reveal } from "../motion/Tilt";
import Countdown from "./Countdown";
import ProductGrid from "./ProductGrid";
import PromoCard from "./PromoCard";

const percentLabel = (showcase: NonNullable<Showcase["campaign"]>) => (showcase.discountPercent > 0 ? `−${showcase.discountPercent}%` : null);

export default function CampaignShowcase({
  data,
  friday = false,
  promotions = [],
  onExpire,
  full = false,
}: {
  data: Showcase;
  friday?: boolean;
  promotions?: Promotion[];
  onExpire?: () => void;
  full?: boolean;
}) {
  const campaign = data.campaign;
  if (!campaign || data.status === "none") return null;

  if (data.status === "upcoming") {
    if (!campaign.startsAt) return null;
    return (
      <Reveal as="section" className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#121418] to-[#0b0c0f] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-[#c9945c] ring-1 ring-inset ring-white/10">
              <CalendarClock className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9945c]">{friday ? "Friday Deals · Cümə Endirimləri" : "Tezliklə"}</p>
              <p className="mt-0.5 text-lg font-semibold">{campaign.name}</p>
              <p className="text-xs text-white/55">{friday ? "Növbəti cümə endirimləri başlayana qədər" : "Kampaniya başlayana qədər"}</p>
            </div>
          </div>
          <Countdown until={campaign.startsAt} tone="dark" onEnd={onExpire} />
        </div>
      </Reveal>
    );
  }

  if (!campaign.endsAt || data.products.length === 0) return null;
  const badge = percentLabel(campaign);

  return (
    <Reveal as="section" className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#17191e] via-[#101114] to-[#0a0b0d] text-white">
        <div className="pointer-events-none absolute -left-20 -top-32 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,102,43,0.16),transparent)]" />
        <div className="relative grid grid-cols-1 gap-6 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9945c] ring-1 ring-inset ring-white/10">
                <Zap className="size-3.5" strokeWidth={2} aria-hidden="true" />
                {friday ? "Friday Deals · Cümə Endirimləri" : "Kampaniya"}
              </span>
              {badge && <span className="rounded-full bg-[#f2662b] px-2.5 py-1 text-xs font-bold tabular-nums">{badge}</span>}
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">{campaign.name}</h2>
            {campaign.description && <p className="max-w-xl text-sm text-white/65 sm:text-base">{campaign.description}</p>}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs text-white/55">Bitməsinə</span>
              <Countdown until={campaign.endsAt} tone="dark" onEnd={onExpire} />
            </div>
          </div>
          <div className="flex items-center gap-5 md:flex-col md:items-end">
            {campaign.bannerUrl && (
              <img src={campaign.bannerUrl} alt="" loading="lazy" decoding="async" className="hidden h-32 w-auto max-w-[260px] object-contain md:block lg:h-40" />
            )}
            {!full && (
              <Link
                to={`/campaigns/${campaign.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111317] transition hover:bg-white/90"
              >
                Hamısına bax
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {promotions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {promotions.slice(0, 2).map((promotion) => (
            <PromoCard key={promotion.id} promo={promotion} size="wide" />
          ))}
        </div>
      )}

      <ProductGrid products={data.products} scroll={!full} />
    </Reveal>
  );
}
