import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProductImage from "./ProductImage";

interface Props {
  images: string[];
  start: number;
  alt: string;
  category?: string;
  onClose: (index: number) => void;
}

const SWIPE = 50;

export default function ImageLightbox({ images, start, alt, category, onClose }: Props) {
  const count = Math.max(images.length, 1);
  const [index, setIndex] = useState(start);
  const [dragX, setDragX] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const drag = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(index);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  const onPointerDown = (event: PointerEvent) => {
    if (zoomed) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, time: Date.now() };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag.current || count < 2) return;
    setDragX(event.clientX - drag.current.x);
  };

  const onPointerUp = (event: PointerEvent) => {
    const start = drag.current;
    drag.current = null;
    setDragX(0);
    if (!start) {
      if (zoomed) setZoomed(false);
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (dy > 120 && Math.abs(dy) > Math.abs(dx)) {
      onClose(index);
      return;
    }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      const now = Date.now();
      if (now - lastTap.current < 300) setZoomed((value) => !value);
      lastTap.current = now;
    }
  };

  return createPortal(
    <div className="lightbox fixed inset-0 z-[100] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label={`${alt} şəkilləri`}>
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm text-white/70" aria-live="polite">{`${index + 1} / ${count}`}</span>
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose(index)}
          aria-label="Bağla"
          className="flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <div
        className={`relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-grab active:cursor-grabbing"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setDragX(0);
        }}
      >
        <div
          key={index}
          className="lightbox-slide flex size-full items-center justify-center px-2 pb-4 sm:px-20"
          style={{ transform: `translate3d(${dragX}px,0,0)`, transition: dragX ? "none" : undefined }}
        >
          <div className="flex size-full max-w-5xl items-center justify-center rounded-3xl bg-white p-4 sm:p-10" style={{ maxHeight: "min(100%, 900px)" }}>
            <ProductImage
              src={images[index]}
              category={category}
              alt={`${alt} — ${index + 1}`}
              blend
              className={`pointer-events-none max-h-full max-w-full transition-transform duration-300 ease-out ${zoomed ? "scale-[2]" : ""}`}
            />
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => go(-1)}
              aria-label="Əvvəlki şəkil"
              className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:flex"
            >
              <ChevronLeft className="size-6" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => go(1)}
              aria-label="Növbəti şəkil"
              className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:flex"
            >
              <ChevronRight className="size-6" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          {images.map((image, position) => (
            <button
              key={`${image}-${position}`}
              type="button"
              onClick={() => {
                setZoomed(false);
                setIndex(position);
              }}
              aria-label={`${position + 1}-ci şəkil`}
              aria-current={position === index}
              className="py-2"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-300 ${position === index ? "w-6 bg-white" : "w-1.5 bg-white/35"}`} />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
