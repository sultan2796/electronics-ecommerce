import { KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { Product } from "../../types";
import { formatPrice, monthlyPayment, pricing } from "../../utils/format";
import ProductImage from "../product/ProductImage";

type Slide = { kind: "brand"; id: string } | { kind: "product"; id: string; product: Product };

const themes = [
  { bg: "from-[#eef2ff] via-[#f5f3ff] to-[#fdf2f8]", accent: "text-indigo-600", chip: "bg-indigo-600" },
  { bg: "from-[#ecfeff] via-[#f0f9ff] to-[#eef2ff]", accent: "text-sky-600", chip: "bg-sky-600" },
  { bg: "from-[#fff7ed] via-[#fffbeb] to-[#fef2f2]", accent: "text-brand-600", chip: "bg-brand-600" },
  { bg: "from-[#f0fdf4] via-[#ecfdf5] to-[#f0f9ff]", accent: "text-emerald-600", chip: "bg-emerald-600" },
];

const AUTOPLAY_MS = 6000;

function BrandSlide({ active }: { active: boolean }) {
  const { t } = useI18n();
  return (
    <div className="relative h-full overflow-hidden bg-[#0f172a]">
      <img src="/figma/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_35%] opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/60 to-transparent" />
      <div className="relative flex h-full max-w-xl flex-col justify-center gap-4 px-6 text-white sm:px-12">
        <span className="w-fit rounded-full border border-white/25 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90">{t("hero.newCollection")}</span>
        <h2 className="text-2xl font-bold leading-tight sm:text-[42px] sm:leading-[1.1]">{t("hero.title")}</h2>
        <p className="max-w-md text-sm text-white/75 sm:text-base">{t("hero.text")}</p>
        <Link to="/products" tabIndex={active ? 0 : -1} className="btn-primary mt-2 w-fit px-7 py-3">
          {t("hero.shop")}
        </Link>
      </div>
    </div>
  );
}

function ProductSlide({ product, index, active }: { product: Product; index: number; active: boolean }) {
  const { t } = useI18n();
  const theme = themes[index % themes.length];
  const price = pricing(product);
  return (
    <div className={`h-full bg-gradient-to-br ${theme.bg}`}>
      <div className="grid h-full grid-cols-[1fr_auto] items-center gap-4 px-6 sm:grid-cols-2 sm:gap-8 sm:px-12">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <p className={`text-xs font-semibold uppercase tracking-wider ${theme.accent}`}>
            {product.campaign?.name ?? product.category?.name ?? product.brand}
          </p>
          <h2 className="line-clamp-2 text-xl font-bold leading-tight text-slate-900 sm:text-[38px] sm:leading-[1.15]">{product.name}</h2>
          <p className="hidden line-clamp-2 max-w-md text-sm text-slate-600 sm:block">{product.description}</p>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-2xl font-bold text-slate-900 sm:text-4xl">{formatPrice(price.price)}</span>
            {price.was && <span className="pb-1 text-sm text-slate-500 line-through">{formatPrice(price.was.toFixed(2))}</span>}
            {price.percent > 0 && <span className={`mb-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white ${theme.chip}`}>−{price.percent}%</span>}
          </div>
          {price.price >= 100 && <p className="text-xs text-slate-500 sm:text-sm">{t("card.monthly", { amount: formatPrice(monthlyPayment(price.price)) })}</p>}
          <div className="flex gap-3 pt-1">
            <Link to={`/products/${product.slug}`} tabIndex={active ? 0 : -1} className="btn-primary px-6 py-2.5">
              {t("hero.details")}
            </Link>
          </div>
        </div>
        <div className="flex h-full items-center justify-center py-6">
          <div className="relative flex aspect-square w-[120px] items-center justify-center sm:w-[340px]">
            <div className="absolute inset-[8%] rounded-full bg-white/70 blur-2xl" />
            <ProductImage
              src={product.images[0]}
              category={product.category?.slug}
              alt={product.name}
              className="relative size-full object-contain drop-shadow-[0_24px_30px_rgba(15,23,42,0.25)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlider({ products }: { products: Product[] }) {
  const slides: Slide[] = [
    { kind: "brand", id: "brand" },
    ...products.map((product) => ({ kind: "product" as const, id: product.id, product })),
  ];
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (paused || count < 2 || reducedMotion) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [paused, count, index]);

  const onPointerDown = (event: PointerEvent) => {
    startX.current = event.clientX;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (startX.current === null) return;
    const delta = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  };

  return (
    <section
      className="relative h-[320px] touch-pan-y select-none overflow-hidden rounded-none outline-none ring-brand-500/30 focus-visible:ring-4 sm:h-[440px] sm:rounded-3xl"
      aria-roledescription="carousel"
      aria-label="Təkliflər"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, position) => (
          <div
            key={slide.id}
            className="relative h-full w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} / ${count}`}
            aria-hidden={position !== index}
          >
            {slide.kind === "brand" ? (
              <BrandSlide active={position === index} />
            ) : (
              <ProductSlide product={slide.product} index={position - 1} active={position === index} />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute bottom-4 left-6 flex items-center gap-2 sm:bottom-6 sm:left-12">
          {slides.map((slide, position) => {
            const current = position === index;
            const dark = slides[index]?.kind === "brand";
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(position)}
                aria-label={`${position + 1}-ci slayd`}
                aria-current={current}
                className="py-2"
              >
                <span
                  className={`relative block h-1.5 overflow-hidden rounded-full transition-all duration-300 ${current ? "w-10" : "w-1.5"} ${dark ? "bg-white/35" : "bg-slate-900/15"}`}
                >
                  {current && (
                    <span
                      key={`${index}-${paused}`}
                      className={`absolute inset-y-0 left-0 rounded-full ${dark ? "bg-white" : "bg-slate-900"} ${paused ? "w-full" : "animate-[slide-progress_linear_forwards]"}`}
                      style={paused ? undefined : { animationDuration: `${AUTOPLAY_MS}ms` }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
