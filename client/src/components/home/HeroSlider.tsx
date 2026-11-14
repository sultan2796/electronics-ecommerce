import { KeyboardEvent, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { canHover, useReducedMotion } from "../../hooks/useMotion";
import { HeroSlide, Product } from "../../types";
import { formatPrice, monthlyPayment, pricing } from "../../utils/format";
import ProductImage from "../product/ProductImage";

type Slide =
  | { kind: "brand"; id: string }
  | { kind: "custom"; id: string; slide: HeroSlide }
  | { kind: "product"; id: string; product: Product };

const themes = [
  { bg: "from-[#eef2ff] via-[#f5f3ff] to-[#fdf2f8] dark:from-[#17171f] dark:via-[#121218] dark:to-[#0e0f12]", accent: "text-indigo-600 dark:text-indigo-300", chip: "bg-indigo-600" },
  { bg: "from-[#ecfeff] via-[#f0f9ff] to-[#eef2ff] dark:from-[#12191d] dark:via-[#101418] dark:to-[#0e0f12]", accent: "text-sky-600 dark:text-sky-300", chip: "bg-sky-600" },
  { bg: "from-[#fff7ed] via-[#fffbeb] to-[#fef2f2] dark:from-[#1b1713] dark:via-[#141210] dark:to-[#0e0f12]", accent: "text-brand-600 dark:text-brand-500", chip: "bg-brand-600" },
  { bg: "from-[#f0fdf4] via-[#ecfdf5] to-[#f0f9ff] dark:from-[#121a16] dark:via-[#101512] dark:to-[#0e0f12]", accent: "text-emerald-600 dark:text-emerald-300", chip: "bg-emerald-600" },
];

const AUTOPLAY_MS = 6500;
const VIDEO_MS = 12000;
const SWIPE_THRESHOLD = 45;

const isExternal = (href: string) => /^https:\/\//.test(href);

function SlideLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  const className = "btn-primary mt-2 w-fit px-7 py-3 transition duration-300 active:scale-[0.97]";
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} tabIndex={active ? 0 : -1} className={className}>
      {children}
    </Link>
  );
}

const prefersLiteMedia = () => {
  if (typeof window === "undefined") return true;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

function HeroVideo({ src, poster, active, className }: { src: string; poster?: string; active: boolean; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const lite = useMemo(prefersLiteMedia, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || lite || failed) return;
    if (active) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [active, lite, failed]);

  if (lite || failed) return poster ? <img src={poster} alt="" className={className} loading="lazy" decoding="async" /> : null;
  return (
    <>
      {poster && !ready && <img src={poster} alt="" className={className} loading="lazy" decoding="async" />}
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
        aria-hidden="true"
        onLoadedData={() => setReady(true)}
        onError={() => setFailed(true)}
        className={`${className} transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

function ImageSlide({
  image,
  video,
  eyebrow,
  title,
  text,
  buttonText,
  buttonLink,
  active,
  priority,
}: {
  image: string;
  video?: string | null;
  eyebrow?: string | null;
  title: string;
  text?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  active: boolean;
  priority: boolean;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-[#0f172a]">
      <div className="hero-media absolute inset-0">
        {video ? (
          <HeroVideo src={video} poster={image} active={active} className="absolute inset-0 h-full w-full object-cover object-[center_35%] opacity-90" />
        ) : (
          <img
            src={image}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="hero-kenburns h-full w-full object-cover object-[center_35%] opacity-90"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/60 to-transparent" />
      <div className="hero-reveal relative flex h-full max-w-xl flex-col justify-center gap-4 px-6 pb-12 text-white sm:px-14 sm:pb-14">
        {eyebrow && (
          <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-bold leading-tight sm:text-[44px] sm:leading-[1.08]">{title}</h2>
        {text && <p className="max-w-md text-sm text-white/75 sm:text-base">{text}</p>}
        {buttonText && buttonLink && (
          <SlideLink href={buttonLink} active={active}>
            {buttonText}
          </SlideLink>
        )}
      </div>
    </div>
  );
}

function BrandSlide({ active, priority }: { active: boolean; priority: boolean }) {
  const { t } = useI18n();
  return (
    <ImageSlide
      image="/figma/hero.jpg"
      eyebrow={t("hero.newCollection")}
      title={t("hero.title")}
      text={t("hero.text")}
      buttonText={t("hero.shop")}
      buttonLink="/products"
      active={active}
      priority={priority}
    />
  );
}

function ProductSlide({ product, index, active }: { product: Product; index: number; active: boolean }) {
  const { t } = useI18n();
  const theme = themes[index % themes.length];
  const price = pricing(product);
  return (
    <div className={`h-full bg-gradient-to-br ${theme.bg}`}>
      <div className="grid h-full grid-cols-[1fr_auto] items-center gap-4 px-6 pb-12 pt-6 sm:grid-cols-2 sm:gap-8 sm:px-14 sm:pb-14">
        <div className="hero-reveal min-w-0 space-y-3 sm:space-y-4">
          <p className={`text-sm font-semibold ${theme.accent}`}>{product.campaign?.name ?? product.category?.name ?? product.brand}</p>
          <h2 translate="no" className="line-clamp-2 text-xl font-bold leading-tight text-slate-900 dark:text-white sm:text-[38px] sm:leading-[1.15]">
            {product.name}
          </h2>
          <p translate="no" className="hidden line-clamp-2 max-w-md text-sm text-slate-600 dark:text-white/60 sm:block">
            {product.description}
          </p>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-4xl">{formatPrice(price.price)}</span>
            {price.was && <span className="pb-1 text-sm text-slate-500 line-through dark:text-white/45">{formatPrice(price.was.toFixed(2))}</span>}
            {price.percent > 0 && <span className={`mb-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white ${theme.chip}`}>−{price.percent}%</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <Link
              to={`/products/${product.slug}`}
              tabIndex={active ? 0 : -1}
              className="btn-primary px-6 py-2.5 transition duration-300 active:scale-[0.97]"
            >
              {t("hero.details")}
            </Link>
            {price.price >= 100 && (
              <span className="text-xs text-slate-500 dark:text-white/50 sm:text-sm">{t("card.monthly", { amount: formatPrice(monthlyPayment(price.price)) })}</span>
            )}
          </div>
        </div>
        {product.videoUrl ? (
          <div className="flex h-full items-center justify-center py-6">
            <div className="hero-float relative aspect-[4/5] w-[130px] overflow-hidden rounded-3xl bg-black shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] ring-1 ring-black/10 sm:aspect-square sm:w-[340px] dark:ring-white/10">
              <HeroVideo src={product.videoUrl} poster={product.videoPoster ?? product.images[0]} active={active} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur sm:left-4 sm:top-4 sm:text-xs">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                Video
              </span>
            </div>
          </div>
        ) : (
        <div className="flex h-full items-center justify-center py-6 [perspective:1000px]">
          <div className="hero-float relative flex aspect-square w-[130px] items-center justify-center mix-blend-multiply dark:mix-blend-normal sm:w-[340px]">
            <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.6)_38%,transparent_70%)] dark:inset-[-12%] dark:bg-[radial-gradient(circle,rgba(226,226,230,1)_0%,rgba(226,226,230,0.92)_30%,rgba(226,226,230,0.4)_50%,rgba(226,226,230,0.08)_64%,transparent_72%)]" />
            <div className="absolute inset-x-[18%] bottom-[2%] h-[10%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(15,23,42,0.18)_0%,transparent_70%)]" />
            <ProductImage
              src={product.images[0]}
              category={product.category?.slug}
              alt={product.name}
              blend
              className="hero-kenburns hero-product-img relative size-full object-contain"
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}


export default function HeroSlider({ products, slides: managed = [] }: { products: Product[]; slides?: HeroSlide[] }) {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  const slides: Slide[] = [
    ...(managed.length ? managed.map((slide) => ({ kind: "custom" as const, id: slide.id, slide })) : [{ kind: "brand" as const, id: "brand" }]),
    ...products.map((product) => ({ kind: "product" as const, id: product.id, product })),
  ];
  const count = slides.length;
  const firstProduct = slides.findIndex((slide) => slide.kind === "product");
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.visibilityState === "hidden");
  const touchTimer = useRef(0);
  const rootRef = useRef<HTMLElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const frame = useRef(0);
  const paused = hovered || focused || touching || hidden;

  const go = useCallback(
    (next: number, dir?: 1 | -1) => {
      const target = ((next % count) + count) % count;
      if (target === index) return;
      setPrevious(index);
      setDirection(dir ?? (target > index ? 1 : -1));
      setIndex(target);
    },
    [count, index],
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const current = slides[index];
  const hasVideo = current?.kind === "custom" ? Boolean(current.slide.videoUrl) : current?.kind === "product" ? Boolean(current.product.videoUrl) : false;
  const duration = hasVideo ? VIDEO_MS : AUTOPLAY_MS;
  const remaining = useRef({ index: -1, ms: duration });

  useEffect(() => {
    if (remaining.current.index !== index) remaining.current = { index, ms: duration };
    if (paused || count < 2 || reducedMotion) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => go(index + 1, 1), remaining.current.ms);
    return () => {
      window.clearTimeout(timer);
      remaining.current.ms = Math.max(0, remaining.current.ms - (Date.now() - startedAt));
    };
  }, [paused, count, index, reducedMotion, go, duration]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(touchTimer.current);
    },
    [],
  );

  const onPointerDown = (event: PointerEvent) => {
    startX.current = event.clientX;
    startY.current = event.clientY;
    if (event.pointerType !== "mouse") {
      window.clearTimeout(touchTimer.current);
      setTouching(true);
    }
  };

  const finishSwipe = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") {
      window.clearTimeout(touchTimer.current);
      touchTimer.current = window.setTimeout(() => setTouching(false), 4000);
    }
    if (startX.current === null || startY.current === null) return;
    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;
    startX.current = null;
    startY.current = null;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      go(index + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 1 : -1);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || reducedMotion || !canHover()) return;
    const element = rootRef.current;
    if (!element) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--px", ((clientX - rect.left) / rect.width - 0.5).toFixed(3));
      element.style.setProperty("--py", ((clientY - rect.top) / rect.height - 0.5).toFixed(3));
    });
  };

  const resetParallax = () => {
    rootRef.current?.style.setProperty("--px", "0");
    rootRef.current?.style.setProperty("--py", "0");
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1, 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1, -1);
    }
  };

  const darkSlide = slides[index]?.kind !== "product";

  return (
    <section
      ref={rootRef}
      className="group/hero relative h-[340px] touch-pan-y select-none overflow-hidden rounded-none bg-[#0f172a] outline-none ring-brand-500/30 focus-visible:ring-4 sm:h-[460px] sm:rounded-3xl"
      aria-roledescription="carousel"
      aria-label={t("hero.carousel")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        resetParallax();
      }}
      onFocus={(event) => {
        let keyboard = true;
        try {
          keyboard = event.target.matches(":focus-visible");
        } catch {
          keyboard = true;
        }
        if (keyboard) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onPointerDown={onPointerDown}
      onPointerUp={finishSwipe}
      onPointerCancel={finishSwipe}
      onPointerMove={onPointerMove}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`${index + 1} / ${count}`}
      </p>
      <div className="relative h-full">
        {slides.map((slide, position) => {
          const active = position === index;
          const state = active ? "active" : position === previous ? "leaving" : "idle";
          return (
            <div
              key={slide.id}
              className="hero-slide"
              data-state={state}
              style={{ ["--dir" as string]: direction }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} / ${count}`}
              aria-hidden={!active}
            >
              {slide.kind === "brand" && <BrandSlide active={active} priority={position === 0} />}
              {slide.kind === "custom" && (
                <ImageSlide
                  image={slide.slide.imageUrl}
                  video={slide.slide.videoUrl}
                  eyebrow={slide.slide.eyebrow}
                  title={slide.slide.title}
                  text={slide.slide.subtitle}
                  buttonText={slide.slide.buttonText}
                  buttonLink={slide.slide.buttonLink}
                  active={active}
                  priority={position === 0}
                />
              )}
              {slide.kind === "product" && <ProductSlide product={slide.product} index={position - firstProduct} active={active} />}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 px-6 pb-4 sm:px-14 sm:pb-6">
            <div className="pointer-events-auto flex items-baseline gap-1.5" aria-live="polite">
              <span key={index} className={`hero-count text-lg font-semibold tabular-nums sm:text-xl ${darkSlide ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={`text-xs tabular-nums ${darkSlide ? "text-white/50" : "text-slate-900/40 dark:text-white/40"}`}>{`/ ${String(count).padStart(2, "0")}`}</span>
            </div>
            <button
              type="button"
              onClick={() => go(index + 1, 1)}
              aria-label={t("hero.next")}
              className={`hero-ring pointer-events-auto relative flex size-10 items-center justify-center rounded-full backdrop-blur-md transition duration-300 active:scale-90 sm:size-12 ${
                darkSlide ? "bg-white/[0.06] text-white" : "bg-white/50 text-slate-900 dark:bg-white/[0.06] dark:text-white"
              }`}
            >
              <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
                <circle cx="24" cy="24" r="22" fill="none" strokeWidth="1.5" className={darkSlide ? "stroke-white/15" : "stroke-slate-900/10 dark:stroke-white/15"} />
                {!reducedMotion && (
                  <circle
                    key={index}
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    pathLength={1}
                    className={`hero-ring-fill ${darkSlide ? "stroke-white" : "stroke-brand-500 dark:stroke-white"}`}
                    style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? "paused" : "running" }}
                  />
                )}
              </svg>
              <svg viewBox="0 0 24 24" className="relative size-3.5 opacity-70 transition group-hover/hero:opacity-100 sm:size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
