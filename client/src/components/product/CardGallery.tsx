import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { PointerEvent, useRef, useState } from "react";
import ImageLightbox from "./ImageLightbox";
import ProductImage from "./ProductImage";

interface Props {
  images: string[];
  alt: string;
  category?: string;
  soldOut?: boolean;
  soldOutLabel: string;
}

const SWIPE = 40;

export default function CardGallery({ images, alt, category, soldOut = false, soldOutLabel }: Props) {
  const slides = images.filter(Boolean).length ? images.filter(Boolean) : [""];
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0]));
  const [lightbox, setLightbox] = useState(false);
  const drag = useRef<{ x: number; y: number; axis: "x" | "y" | null; time: number } | null>(null);
  const width = useRef(1);

  const show = (next: number) => {
    const target = (next + count) % count;
    setLoaded((current) => new Set(current).add(target).add((target + 1) % count));
    setIndex(target);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    width.current = event.currentTarget.clientWidth || 1;
    drag.current = { x: event.clientX, y: event.clientY, axis: null, time: Date.now() };
    if (count > 1) setLoaded((current) => new Set(current).add((index + 1) % count).add((index - 1 + count) % count));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || count < 2) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (state.axis === "x") event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (state.axis === "x") setDragX(dx);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    setDragX(0);
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (state.axis === "x" && count > 1) {
      const fast = Math.abs(dx) / Math.max(1, Date.now() - state.time) > 0.4;
      if (Math.abs(dx) > SWIPE || (fast && Math.abs(dx) > 12)) show(index + (dx < 0 ? 1 : -1));
      return;
    }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) setLightbox(true);
  };

  const offset = count > 1 ? (dragX / width.current) * 100 : 0;
  const atEdge = (index === 0 && dragX > 0) || (index === count - 1 && dragX < 0);

  return (
    <>
      <div
        className={`product-card-media relative aspect-square overflow-hidden bg-[#f4f4f6] dark:bg-[#ececee] ${count > 1 ? "touch-pan-y" : ""} cursor-zoom-in select-none`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setDragX(0);
        }}
        role="button"
        tabIndex={0}
        aria-label={`${alt} şəklini böyüt`}
        aria-roledescription={count > 1 ? "qalereya" : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setLightbox(true);
          }
          if (event.key === "ArrowRight" && count > 1) show(index + 1);
          if (event.key === "ArrowLeft" && count > 1) show(index - 1);
        }}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translate3d(${-index * 100 + (atEdge ? offset / 3 : offset)}%,0,0)`,
            transition: dragX ? "none" : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {slides.map((image, position) => (
            <div key={`${image}-${position}`} className="flex size-full shrink-0 items-center justify-center bg-[#f4f4f6] p-[10%] dark:bg-[#ececee]" aria-hidden={position !== index}>
              {loaded.has(position) && (
                <ProductImage
                  src={image || undefined}
                  category={category}
                  alt={position === 0 ? alt : ""}
                  blend
                  className={`product-card-img pointer-events-none size-full object-contain ${soldOut ? "opacity-50 grayscale" : ""}`}
                />
              )}
            </div>
          ))}
        </div>

        {soldOut && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-3 py-1 text-[11px] font-medium text-white">{soldOutLabel}</span>
        )}

        {count > 1 && !soldOut && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center" aria-hidden="true">
            <div className="flex w-[42%] max-w-[120px] gap-1">
              {slides.map((image, position) => (
                <span key={`${image}-bar-${position}`} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#1d1d1f]/[0.12]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#1d1d1f]/75 transition-[width] duration-500 ease-out"
                    style={{ width: position === index ? "100%" : position < index ? "100%" : "0%", opacity: position < index ? 0.35 : 1 }}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        <span className="card-gallery-reveal pointer-events-none absolute bottom-2.5 right-2.5 hidden size-7 items-center justify-center rounded-full bg-white/85 text-[#1d1d1f]/70 ring-1 ring-black/5 backdrop-blur-sm sm:flex" aria-hidden="true">
          <Expand className="size-3.5" strokeWidth={2} />
        </span>

        {count > 1 && (
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Əvvəlki şəkil"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                show(index - 1);
              }}
              className="card-gallery-reveal absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1d1d1f] ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white active:scale-90 sm:flex"
            >
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Növbəti şəkil"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                show(index + 1);
              }}
              className="card-gallery-reveal absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1d1d1f] ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white active:scale-90 sm:flex"
            >
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {lightbox && (
        <ImageLightbox
          images={slides}
          start={index}
          alt={alt}
          category={category}
          onClose={(last) => {
            setLightbox(false);
            show(last);
          }}
        />
      )}
    </>
  );
}
