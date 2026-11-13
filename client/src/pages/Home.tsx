import ProductSkeletonGrid from "../components/product/ProductSkeleton";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/common/Alert";
import Benefits from "../components/home/Benefits";
import Countdown from "../components/home/Countdown";
import HeroSlider from "../components/home/HeroSlider";
import { Reveal, TiltLink } from "../components/motion/Tilt";
import { slideService } from "../services/slide.service";
import ProductGrid from "../components/home/ProductGrid";
import RecentlyViewed from "../components/home/RecentlyViewed";
import SectionHeader from "../components/home/SectionHeader";
import { useI18n } from "../context/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { useSeo } from "../hooks/useSeo";
import { extraService } from "../services/extra.service";
import { productService } from "../services/product.service";
import { Category } from "../types";
import { emptyFilters } from "../utils/filters";
import { fallbackImage } from "../components/product/ProductImage";

const categoryOrder = ["smartphones", "laptops", "tablets", "mobile-accessories", "headsets", "earphones", "cables"];

const sortCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.slug);
    const bi = categoryOrder.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
  });

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
  const campaign = campaigns.data?.[0] ?? null;

  const deals = useAsync(
    () => productService.list({ ...emptyFilters, category: campaign?.category?.slug ?? "", inStock: true, sort: "price_desc" }, 10),
    [campaign?.id],
  );

  useEffect(() => {
    if (!active && categories.length) setActive(categories[0].slug);
  }, [active, categories]);

  const products = useAsync(
    () => (active ? productService.list({ ...emptyFilters, category: active }, 10) : Promise.resolve(null)),
    [active],
  );

  return (
    <div className="-mx-4 -mt-8 space-y-12 sm:mx-0 sm:mt-0 sm:space-y-14">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <HeroSlider products={featured.data ?? []} slides={slides.data ?? []} />
        <div className="hidden grid-rows-2 gap-4 lg:grid">
          <TiltLink to="/products?category=laptops" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Noutbuklar</p>
            <p className="mt-1 text-xl font-bold leading-tight">İş və oyun üçün güclü seçim</p>
            <span className="mt-3 inline-block text-sm font-semibold text-brand-500">Bax →</span>
            <img src={fallbackImage("laptops")} alt="" className="depth-2 absolute -bottom-4 -right-6 w-40 opacity-90 transition duration-500 group-hover:scale-105" />
          </TiltLink>
          <TiltLink to="/products?category=mobile-accessories" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Aksesuarlar</p>
            <p className="mt-1 text-xl font-bold leading-tight">Hər gün üçün vacib detallar</p>
            <span className="mt-3 inline-block text-sm font-semibold">Bax →</span>
            <img src={fallbackImage("earphones")} alt="" className="depth-2 absolute -bottom-4 -right-4 w-36 opacity-90 transition duration-500 group-hover:scale-105" />
          </TiltLink>
        </div>
      </div>

      <div className="space-y-12 px-4 sm:space-y-14 sm:px-0">
        <Benefits />

        {categories.length > 0 && (
          <Reveal as="section">
            <SectionHeader title={t("home.categories")} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categories.map((category) => (
                <TiltLink
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  degrees={8}
                  className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 text-center hover:border-brand-500/40 hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.35)]"
                >
                  <span className="depth-1 flex size-16 items-center justify-center rounded-2xl bg-chip transition group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10">
                    <img src={fallbackImage(category.slug)} alt="" className="size-11 object-contain transition duration-500 group-hover:scale-110" />
                  </span>
                  <span className="text-sm font-medium text-ink">{category.name}</span>
                  <span className="-mt-2 text-xs text-muted">{`${category._count?.products ?? 0} məhsul`}</span>
                </TiltLink>
              ))}
            </div>
          </Reveal>
        )}

        {campaign && deals.data && deals.data.items.length > 0 && (
          <Reveal as="section" className="overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-brand-600 p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{t("home.deals")}</p>
                <h2 className="text-xl font-bold sm:text-2xl">
                  {campaign.name} · −{campaign.discountPercent}%
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/80">{t("home.dealsEnds")}</span>
                <Countdown until={campaign.endsAt} />
              </div>
            </div>
            <ProductGrid products={deals.data.items} scroll />
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
