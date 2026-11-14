import CategoryTile from "../components/home/CategoryTile";
import ProductSkeletonGrid from "../components/product/ProductSkeleton";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/common/Alert";
import Benefits from "../components/home/Benefits";
import CampaignShowcase from "../components/home/CampaignShowcase";
import PromoCard, { PromoContent, toneAt } from "../components/home/PromoCard";
import HeroSlider from "../components/home/HeroSlider";
import { Reveal } from "../components/motion/Tilt";
import { promotionService } from "../services/promotion.service";
import { slideService } from "../services/slide.service";
import ProductGrid from "../components/home/ProductGrid";
import RecentlyViewed from "../components/home/RecentlyViewed";
import SectionHeader from "../components/home/SectionHeader";
import { useI18n } from "../context/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { useSeo } from "../hooks/useSeo";
import { extraService } from "../services/extra.service";
import { productService } from "../services/product.service";
import { Category, Promotion } from "../types";
import { emptyFilters } from "../utils/filters";
import { Cable, Laptop } from "lucide-react";

const categoryOrder = ["smartphones", "laptops", "tablets", "mobile-accessories", "headsets", "earphones", "cables"];

const sortCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.slug);
    const bi = categoryOrder.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
  });

const campaignBadge = (promo: Promotion) => (promo.campaign?.live && promo.campaign.discountPercent ? `−${promo.campaign.discountPercent}%` : null);

export default function Home() {
  const { t } = useI18n();
  const [active, setActive] = useState("");
  useSeo({ title: "Elektronika mağazası", description: t("hero.text") });

  const featured = useAsync(() => productService.featured(4), []);
  const slides = useAsync(() => slideService.active().catch(() => []), []);
  const picks = useAsync(() => productService.featured(10), []);
  const campaigns = useAsync(() => extraService.activeCampaigns().catch(() => []), []);
  const categoriesState = useAsync(() => productService.categories(), []);
  const categories = useMemo(
    () => sortCategories((categoriesState.data ?? []).filter((category) => (category._count?.products ?? 0) > 0)),
    [categoriesState.data],
  );
  const friday = useAsync(() => extraService.fridayCampaign().catch(() => null), []);
  const general = campaigns.data?.find((campaign) => !campaign.fridayOnly) ?? null;
  const generalShowcase = useAsync(() => (general ? extraService.campaign(general.id).catch(() => null) : Promise.resolve(null)), [general?.id]);
  const sidePromos = useAsync(() => promotionService.live("HERO_SIDE").catch(() => []), []);
  const bannerPromos = useAsync(() => promotionService.live("HOME_BANNER").catch(() => []), []);
  const fridayPromos = useAsync(() => promotionService.live("FRIDAY").catch(() => []), []);

  const sideCards: (PromoContent & { tracked: boolean })[] = sidePromos.data?.length
    ? sidePromos.data.map((promo) => ({
        ...promo,
        badge: campaignBadge(promo),
        tracked: true,
      }))
    : sidePromos.loading
      ? []
      : [
          { eyebrow: "Noutbuklar", title: "İş və oyun üçün güclü seçim", icon: Laptop, ctaText: "Bax", link: "/products?category=laptops", tracked: false },
          { eyebrow: "Aksesuarlar", title: "Hər gün üçün vacib detallar", icon: Cable, ctaText: "Bax", link: "/products?category=mobile-accessories", tracked: false },
        ];

  useEffect(() => {
    if (!active && categories.length) setActive(categories[0].slug);
  }, [active, categories]);

  const products = useAsync(
    () => (active ? productService.list({ ...emptyFilters, category: active }, 10) : Promise.resolve(null)),
    [active],
  );

  return (
    <div className="-mx-4 -mt-8 space-y-12 sm:mx-0 sm:mt-0 sm:space-y-14">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <HeroSlider products={featured.data ?? []} slides={slides.data ?? []} />
        <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-1 lg:grid-rows-2">
          {sideCards.length === 0
            ? [0, 1].map((key) => <div key={key} className="min-h-[168px] w-[86%] shrink-0 animate-pulse rounded-3xl bg-chip sm:w-auto" />)
            : sideCards.slice(0, 2).map((promo, index) => (
                <div key={promo.id ?? index} className="w-[86%] shrink-0 snap-start sm:w-auto">
                  <PromoCard promo={promo} tone={toneAt(index)} tracked={promo.tracked} />
                </div>
              ))}
        </div>
      </div>

      <div className="space-y-12 px-4 sm:space-y-14 sm:px-0">
        <Benefits />

        {categories.length > 0 && (
          <Reveal as="section">
            <SectionHeader title={t("home.categories")} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categories.map((category) => (
                <CategoryTile key={category.id} category={category} label={`${category._count?.products ?? 0} məhsul`} />
              ))}
            </div>
          </Reveal>
        )}

        {friday.data && <CampaignShowcase data={friday.data} friday promotions={fridayPromos.data ?? []} onExpire={() => void friday.reload()} />}

        {generalShowcase.data && <CampaignShowcase data={generalShowcase.data} onExpire={() => void campaigns.reload()} />}

        {bannerPromos.data && bannerPromos.data.length > 0 && (
          <Reveal as="section" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bannerPromos.data.slice(0, 4).map((promo, index) => (
              <PromoCard
                key={promo.id}
                promo={{ ...promo, badge: campaignBadge(promo) }}
                tone={toneAt(index)}
                size="wide"
              />
            ))}
          </Reveal>
        )}

        {picks.loading && !picks.data && <ProductSkeletonGrid count={5} />}
        {picks.data && picks.data.length > 0 && (
          <Reveal as="section">
            <SectionHeader title={t("home.picks")} hint={t("home.picksHint")} to="/products" linkLabel={t("home.seeAll")} />
            <ProductGrid products={picks.data} scroll />
          </Reveal>
        )}

        <Reveal as="section">
          <SectionHeader title={t("nav.products")} to={active ? `/products?category=${active}` : "/products"} linkLabel={t("home.seeAll")} />
          {categoriesState.error && <Alert>{categoriesState.error}</Alert>}
          <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  active === category.slug ? "bg-ink text-surface" : "bg-surface text-ink/70 ring-1 ring-line hover:text-ink"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          {categoriesState.loading || products.loading ? (
            <ProductSkeletonGrid count={10} />
          ) : products.error ? (
            <Alert>{products.error}</Alert>
          ) : !active ? null : !products.data?.items.length ? (
            <p className="py-10 text-center text-sm text-muted">{t("home.empty")}</p>
          ) : (
            <ProductGrid products={products.data.items} />
          )}
        </Reveal>

        <RecentlyViewed title={t("home.recent")} />
      </div>
    </div>
  );
}
