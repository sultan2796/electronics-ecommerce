import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { PointerEvent, WheelEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProductImage from "./ProductImage";

interface Props {
  images: string[];
  start: number;
  alt: string;
  category?: string;
  onClose: (index: number) => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE = 60;

type View = { scale: number; x: number; y: number };
const resting: View = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ImageLightbox({ images, start, alt, category, onClose }: Props) {
  const count = Math.max(images.length, 1);
  const [index, setIndex] = useState(start);
  const [view, setView] = useState<View>(resting);
  const [swipe, setSwipe] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startX: number; startY: number; view: View; distance: number; moved: boolean; time: number } | null>(null);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });
  const zoomed = view.scale > 1.01;

  const bounded = useCallback((next: View): View => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || next.scale <= 1) return resting;
    const maxX = ((next.scale - 1) * rect.width) / 2;
    const maxY = ((next.scale - 1) * rect.height) / 2;
    return { scale: next.scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const zoomAt = useCallback(
    (scale: number, clientX?: number, clientY?: number) => {
      setView((current) => {
        const rect = stageRef.current?.getBoundingClientRect();
        const target = clamp(scale, 1, MAX_SCALE);
        if (!rect || target <= 1) return resting;
        const px = (clientX ?? rect.left + rect.width / 2) - (rect.left + rect.width / 2);
        const py = (clientY ?? rect.top + rect.height / 2) - (rect.top + rect.height / 2);
        const ratio = target / current.scale;
        return bounded({ scale: target, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio });
      });
    },
    [bounded],
  );

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setDirection(delta > 0 ? 1 : -1);
      setView(resting);
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const html = document.documentElement;
    const previous = { overflow: document.body.style.overflow, touch: html.style.touchAction };
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    html.style.touchAction = "none";
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous.overflow;
      html.style.touchAction = previous.touch;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(index);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "+" || event.key === "=") zoomAt(view.scale + 0.75);
      if (event.key === "-") zoomAt(view.scale - 0.75);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, index, onClose, view.scale, zoomAt]);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setDragging(true);
    gesture.current = { startX: event.clientX, startY: event.clientY, view, distance: distance(), moved: pointers.current.size > 1, time: Date.now() };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const state = gesture.current;
    if (pointers.current.size > 1) {
      const current = distance();
      if (state.distance > 0) {
        const [a, b] = [...pointers.current.values()];
        const scale = clamp((state.view.scale * current) / state.distance, 1, MAX_SCALE);
        const rect = stageRef.current?.getBoundingClientRect();
        if (rect) {
          const px = (a.x + b.x) / 2 - (rect.left + rect.width / 2);
          const py = (a.y + b.y) / 2 - (rect.top + rect.height / 2);
          const ratio = scale / state.view.scale;
          setView(bounded({ scale, x: px - (px - state.view.x) * ratio, y: py - (py - state.view.y) * ratio }));
        }
      }
      state.moved = true;
      return;
    }
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) state.moved = true;
    if (state.view.scale > 1.01) {
      setView(bounded({ ...state.view, x: state.view.x + dx, y: state.view.y + dy }));
    } else if (count > 1 && Math.abs(dx) > Math.abs(dy)) {
      setSwipe(dx);
    }
  };

  const finish = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    const state = gesture.current;
    if (pointers.current.size > 0) {
      const [rest] = [...pointers.current.values()];
      gesture.current = { startX: rest.x, startY: rest.y, view, distance: 0, moved: true, time: Date.now() };
      return;
    }
    gesture.current = null;
    setDragging(false);
    setSwipe(0);
    if (!state) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved) {
      const now = Date.now();
      const tap = lastTap.current;
      if (now - tap.time < 300 && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 30) {
        if (zoomed) setView(resting);
        else zoomAt(DOUBLE_TAP_SCALE, event.clientX, event.clientY);
        lastTap.current = { time: 0, x: 0, y: 0 };
      } else {
        lastTap.current = { time: now, x: event.clientX, y: event.clientY };
      }
      return;
    }
    if (state.view.scale > 1.01) return;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.5) onClose(index);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    zoomAt(view.scale * (event.deltaY < 0 ? 1.2 : 1 / 1.2), event.clientX, event.clientY);
  };

  const control =
    "flex items-center justify-center rounded-full bg-white/80 text-[#1d1d1f] shadow-[0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-black/5 backdrop-blur-md transition duration-200 hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] disabled:opacity-40";

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="lightbox fixed inset-0 outline-none z-[100] flex h-[100dvh] w-screen touch-none flex-col overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} şəkilləri`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium tabular-nums text-[#1d1d1f]/70 ring-1 ring-black/5 backdrop-blur-md" aria-live="polite">
          {`${index + 1} / ${count}`}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" className={`${control} hidden size-10 sm:flex`} onClick={() => zoomAt(view.scale / 1.5)} disabled={!zoomed} aria-label="Kiçilt">
            <Minus className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className={`${control} hidden size-10 sm:flex`} onClick={() => zoomAt(view.scale * 1.5)} disabled={view.scale >= MAX_SCALE} aria-label="Böyüt">
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
          <button ref={closeRef} type="button" onClick={() => onClose(index)} aria-label="Bağla" className={`${control} size-10`}>
            <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`relative min-h-0 flex-1 select-none overflow-hidden ${zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onWheel={onWheel}
      >
        <div
          key={index}
          className="lightbox-slide absolute inset-0 flex items-center justify-center p-6 sm:p-12"
          style={{
            ["--slide-from" as string]: `${direction * 8}%`,
            transform: `translate3d(${swipe}px,0,0)`,
            transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="flex size-full items-center justify-center bg-[#f5f5f7] will-change-transform"
            style={{
              transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
              transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <ProductImage
              src={images[index]}
              category={category}
              alt={`${alt} — ${index + 1}`}
              blend
              className="pointer-events-none max-h-full max-w-full rounded-none"
            />
          </div>
        </div>

        {count > 1 && !zoomed && (
          <>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => go(-1)}
              aria-label="Əvvəlki şəkil"
              className={`${control} absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 sm:flex`}
            >
              <ChevronLeft className="size-6" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => go(1)}
              aria-label="Növbəti şəkil"
              className={`${control} absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 sm:flex`}
            >
              <ChevronRight className="size-6" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </>
        )}

        {!zoomed && (
          <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-[#1d1d1f]/45">
            {count > 1 ? "Sürüşdürərək dəyişin · iki dəfə toxunaraq böyüdün" : "İki dəfə toxunaraq böyüdün"}
          </p>
        )}
      </div>

      {count > 1 && (
        <div className="relative z-10 flex justify-center gap-2 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {images.map((image, position) => (
            <button
              key={`${image}-${position}`}
              type="button"
              onClick={() => {
                if (position === index) return;
                setDirection(position > index ? 1 : -1);
                setView(resting);
                setIndex(position);
              }}
              aria-label={`${position + 1}-ci şəkil`}
              aria-current={position === index}
              className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 transition duration-200 sm:size-16 ${
                position === index ? "ring-2 ring-[#1d1d1f]" : "opacity-60 ring-black/5 hover:opacity-100"
              }`}
            >
              <ProductImage src={image} category={category} alt="" blend className="pointer-events-none size-full rounded-none" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
