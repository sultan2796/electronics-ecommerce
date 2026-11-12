import { KeyboardEvent, PointerEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types";
import { discountOf, formatPrice, priceBeforeDiscount } from "../../utils/format";
import FigmaIcon from "../common/FigmaIcon";

type Slide = { kind: "brand"; id: string } | { kind: "product"; id: string; product: Product };

const gradients = [
  "from-[#120c24] via-[#3a1c71] to-[#fe5e22]",
  "from-[#07141f] via-[#14506e] to-[#22b8fe]",
  "from-[#1a0f0a] via-[#7a2e12] to-[#f97847]",
  "from-[#0a090b] via-[#2b2727] to-[#7b2cbf]",
];

const AUTOPLAY_MS = 5000;

function BrandSlide({ active }: { active: boolean }) {
  return (
    <>
      <img src="/figma/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/30 to-transparent sm:block" />
      <div className="absolute inset-y-0 left-0 hidden max-w-[440px] flex-col justify-center gap-4 pl-14 text-white sm:flex">
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">Yeni kolleksiya</span>
        <h2 className="text-4xl font-semibold leading-tight">Səsin yeni səviyyəsi</h2>
        <p className="text-sm text-white/80">Qulaqlıq, smartfon, noutbuk və aksesuarlarda ən yaxşı seçimlər bir yerdə.</p>
        <Link to="/products" tabIndex={active ? 0 : -1} className="btn-primary w-fit px-6">
          Məhsullara bax
        </Link>
      </div>
    </>
  );
}

function ProductSlide({ product, index, active }: { product: Product; index: number; active: boolean }) {
  const discount = discountOf(product);
  const rating = product.specs?.extra?.rating;
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`}>
      <div className="mx-auto grid h-full max-w-5xl grid-cols-[1fr_auto] items-center gap-4 px-6 pb-8 pt-16 text-white sm:gap-10 sm:px-14 sm:pt-6">
        <div className="min-w-0 space-y-2 sm:space-y-4">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] backdrop-blur sm:text-xs">
            {product.category?.name ?? product.brand}
          </span>
          <h2 className="line-clamp-2 text-lg font-semibold leading-tight sm:text-4xl">{product.name}</h2>
          {typeof rating === "number" && (
            <p className="flex items-center gap-1.5 text-xs text-white/80 sm:text-sm">
              <FigmaIcon name="star" className="h-[11px] w-3" />
              {rating.toFixed(1)} · {product.brand}
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-bold sm:text-3xl">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-xs text-white/60 line-through sm:text-sm">{formatPrice(priceBeforeDiscount(product.price, discount).toFixed(2))}</span>
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold">-{discount}%</span>
              </>
            )}
          </div>
          <Link to={`/products/${product.slug}`} tabIndex={active ? 0 : -1} className="btn-primary px-5 py-2 sm:px-6">
            İndi al
          </Link>
        </div>
        <div className="flex size-[130px] items-center justify-center rounded-full bg-white/95 shadow-2xl sm:size-[320px]">
          <img src={product.images[0]} alt={product.name} className="size-[78%] object-contain drop-shadow-[0px_8px_12px_rgba(0,0,0,0.25)]" />
        </div>
      </div>
    </div>
  );
}

export default function HeroSlider({ products, overlay }: { products: Product[]; overlay?: ReactNode }) {
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
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

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
      className="relative h-[300px] touch-pan-y select-none overflow-hidden bg-black outline-none sm:h-[460px] sm:rounded-phone"
      aria-roledescription="carousel"
      aria-label="Təkliflər"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
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

      {overlay}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Əvvəlki slayd"
            className="absolute left-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-2xl leading-none text-white backdrop-blur transition hover:bg-white/35 sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Növbəti slayd"
            className="absolute right-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-2xl leading-none text-white backdrop-blur transition hover:bg-white/35 sm:flex"
          >
            ›
          </button>
          <div className="absolute bottom-[6px] left-1/2 flex -translate-x-1/2 gap-[5px]">
            {slides.map((slide, position) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(position)}
                aria-label={`${position + 1}-ci slayd`}
                aria-current={position === index}
                className="py-[7px]"
              >
                <span className={`block h-1 w-[42px] rounded-[40px] transition-colors ${position === index ? "bg-white" : "bg-[#949494]"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
