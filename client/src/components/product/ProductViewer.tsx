import { PointerEvent, Suspense, WheelEvent, lazy, useEffect, useRef, useState } from "react";
import type { CameraView, ModelStageHandle } from "./ModelStage";
import ProductImage from "./ProductImage";
import ImageLightbox from "./ImageLightbox";

const ModelStage = lazy(() => import("./ModelStage"));

const CAMERA_VIEWS: { key: CameraView; label: string }[] = [
  { key: "front", label: "Ön" },
  { key: "back", label: "Arxa" },
  { key: "left", label: "Sol" },
  { key: "right", label: "Sağ" },
  { key: "top", label: "Yuxarı" },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

interface ProductViewerProps {
  images: string[];
  alt: string;
  category?: string;
  model3d?: string | null;
  modelCredit?: string | null;
}

export default function ProductViewer({ images, alt, category, model3d, modelCredit }: ProductViewerProps) {
  const frames = images.length ? images : [""];
  const canSpin = frames.length > 1;
  const [mode, setMode] = useState<"photo" | "spin" | "model">(model3d ? "model" : "photo");
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [autoSpin, setAutoSpin] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelSpin, setModelSpin] = useState(true);
  const modelRef = useRef<ModelStageHandle>(null);
  const drag = useRef<{ x: number; y: number; index: number; offset: { x: number; y: number }; time: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setMode(model3d ? "model" : "photo");
    setModelReady(false);
    setModelError(false);
    setModelProgress(0);
    setModelSpin(true);
  }, [images, model3d]);

  useEffect(() => {
    if (modelError && mode === "model") setMode("photo");
  }, [modelError, mode]);

  useEffect(() => {
    if (!autoSpin || mode !== "spin") return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % frames.length), 700);
    return () => window.clearInterval(timer);
  }, [autoSpin, mode, frames.length]);

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const changeZoom = (delta: number) => {
    setZoom((current) => {
      const next = clamp(Math.round((current + delta) * 100) / 100, MIN_ZOOM, MAX_ZOOM);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const select = (next: number) => {
    setAutoSpin(false);
    setIndex(next);
    resetView();
  };

  const onWheel = (event: WheelEvent) => {
    if (mode === "model") return;
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (mode === "model") return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, index, offset, time: Date.now() };
    setAutoSpin(false);
  };

  const onPointerMove = (event: PointerEvent) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (zoom > 1) {
      const limit = ((zoom - 1) / zoom) * ((stageRef.current?.clientWidth ?? 400) / 2);
      setOffset({ x: clamp(start.offset.x + dx / zoom, -limit, limit), y: clamp(start.offset.y + dy / zoom, -limit, limit) });
    } else if (mode === "photo" && frames.length > 1 && Math.abs(dx) > Math.abs(dy)) {
      setSwipeX(dx);
    } else if (mode === "spin" && canSpin) {
      const step = Math.round(dx / 45);
      setIndex((((start.index - step) % frames.length) + frames.length) % frames.length);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    const start = drag.current;
    drag.current = null;
    setSwipeX(0);
    if (!start || mode !== "photo" || zoom > 1) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (frames.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      const dir = dx < 0 ? 1 : -1;
      setSlideDir(dir);
      setIndex((current) => (current + dir + frames.length) % frames.length);
      return;
    }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && Date.now() - start.time < 400) setLightbox(true);
  };

  const cancelPointer = () => {
    drag.current = null;
    setSwipeX(0);
  };

  const tabs: { key: "photo" | "spin" | "model"; label: string; show: boolean }[] = [
    { key: "photo", label: "Şəkillər", show: true },
    { key: "spin", label: "360° fırlatma", show: canSpin },
    { key: "model", label: "3D model", show: Boolean(model3d) && !modelError },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      {lightbox && (
        <ImageLightbox
          images={frames}
          start={index}
          alt={alt}
          category={category}
          onClose={(last) => {
            setLightbox(false);
            setIndex(last);
          }}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-chip p-1" role="tablist" aria-label="Baxış rejimi">
          {tabs
            .filter((tab) => tab.show)
            .map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => {
                  setMode(tab.key);
                  setAutoSpin(false);
                  resetView();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === tab.key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {tab.label}
              </button>
            ))}
        </div>
        {mode === "model" && modelReady && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const next = !modelSpin;
                setModelSpin(next);
                modelRef.current?.setAutoRotate(next);
              }}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ${modelSpin ? "bg-brand-600 text-white" : "bg-chip text-ink/80 hover:text-ink"}`}
            >
              <Icon d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5" />
              {modelSpin ? "Dayandır" : "Avtomatik fırlat"}
            </button>
            <button type="button" aria-label="Uzaqlaşdır" onClick={() => modelRef.current?.zoom(1.25)} className="flex size-9 items-center justify-center rounded-lg bg-chip text-ink/80 transition hover:text-ink">
              <Icon d="M5 12h14" />
            </button>
            <button type="button" aria-label="Yaxınlaşdır" onClick={() => modelRef.current?.zoom(0.8)} className="flex size-9 items-center justify-center rounded-lg bg-chip text-ink/80 transition hover:text-ink">
              <Icon d="M12 5v14M5 12h14" />
            </button>
            <button type="button" aria-label="Sıfırla" onClick={() => modelRef.current?.reset()} className="flex size-9 items-center justify-center rounded-lg bg-chip text-ink/80 transition hover:text-ink">
              <Icon d="M4 4v6h6M4.6 15A8 8 0 1 0 6 6.3L4 10" />
            </button>
          </div>
        )}
        {mode !== "model" && (
          <div className="ml-auto flex items-center gap-1">
            {mode === "spin" && (
              <button
                type="button"
                onClick={() => setAutoSpin((value) => !value)}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ${autoSpin ? "bg-brand-600 text-white" : "bg-chip text-ink/80 hover:text-ink"}`}
              >
                <Icon d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5" />
                {autoSpin ? "Dayandır" : "Avtomatik fırlat"}
              </button>
            )}
            <button type="button" aria-label="Uzaqlaşdır" onClick={() => changeZoom(-0.5)} disabled={zoom <= MIN_ZOOM} className="flex size-9 items-center justify-center rounded-lg bg-chip text-ink/80 transition hover:text-ink disabled:opacity-40">
              <Icon d="M5 12h14" />
            </button>
            <span className="w-12 text-center text-xs font-semibold tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Yaxınlaşdır" onClick={() => changeZoom(0.5)} disabled={zoom >= MAX_ZOOM} className="flex size-9 items-center justify-center rounded-lg bg-chip text-ink/80 transition hover:text-ink disabled:opacity-40">
              <Icon d="M12 5v14M5 12h14" />
            </button>
            <button type="button" aria-label="Sıfırla" onClick={resetView} disabled={zoom === 1} className="flex size-9 items-center justify-center rounded-lg bg-chip text-ink/80 transition hover:text-ink disabled:opacity-40">
              <Icon d="M4 4v6h6M4.6 15A8 8 0 1 0 6 6.3L4 10" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={stageRef}
        className={`relative flex aspect-square w-full select-none items-center justify-center overflow-hidden rounded-2xl bg-[#f6f7f9] dark:bg-white ${mode === "photo" && zoom === 1 ? "touch-pan-y" : "touch-none"} ${
          mode === "model" ? "" : zoom > 1 ? "cursor-grab active:cursor-grabbing" : mode === "spin" ? "cursor-ew-resize" : "cursor-zoom-in"
        }`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancelPointer}
        onDoubleClick={() => mode === "spin" && (zoom > 1 ? resetView() : changeZoom(1))}
      >
        {mode === "model" && model3d ? (
          <>
            <Suspense fallback={null}>
              <ModelStage
                ref={modelRef}
                src={model3d}
                alt={alt}
                onProgress={setModelProgress}
                onLoaded={() => setModelReady(true)}
                onError={() => setModelError(true)}
              />
            </Suspense>
            {!modelReady && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3" role="status">
                <span className="size-8 animate-spin rounded-full border-2 border-line border-t-brand-600" />
                <span className="text-xs font-medium text-muted">3D model yüklənir{modelProgress ? ` · ${modelProgress}%` : "..."}</span>
              </div>
            )}
            {modelReady && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <div className="flex gap-1 rounded-full bg-slate-900/75 p-1 backdrop-blur" role="group" aria-label="Kamera bucağı">
                  {CAMERA_VIEWS.map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => {
                        setModelSpin(false);
                        modelRef.current?.setView(view.key);
                      }}
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white/85 transition hover:bg-white/15 hover:text-white"
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            key={mode === "photo" ? index : "frame"}
            className={`flex size-full items-center justify-center p-8 ease-out ${swipeX ? "" : "transition-transform duration-150"} ${mode === "photo" && !swipeX ? "viewer-slide" : ""}`}
            style={{
              transform: `translate3d(${swipeX}px,0,0) scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
              ["--slide-from" as string]: `${slideDir * 6}%`,
            }}
          >
            <ProductImage src={frames[index]} category={category} alt={alt} className="pointer-events-none max-h-full max-w-full object-contain mix-blend-multiply dark:rounded-none dark:bg-transparent" />
          </div>
        )}

        {mode === "spin" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="flex items-center gap-2 rounded-full bg-slate-900/75 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">
              <Icon d="M7 8 3 12l4 4M17 8l4 4-4 4M3 12h18" />
              Fırlatmaq üçün sağa-sola sürüşdürün · {index + 1}/{frames.length}
            </span>
          </div>
        )}
        {mode === "photo" && zoom === 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] text-white">
            {index + 1}/{frames.length}
          </span>
        )}
      </div>

      {mode === "model" && modelReady && modelCredit && <p className="text-[11px] leading-snug text-muted">{`3D model: ${modelCredit}`}</p>}

      {modelError && (
        <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400">3D model yüklənmədi, məhsulun şəkilləri göstərilir.</p>
      )}

      {mode === "spin" && (
        <p className="text-[11px] leading-snug text-muted">Məhsulun real 3D modeli yoxdur. Bu baxış təchizatçının müxtəlif bucaqlardan çəkdiyi şəkillərdən interaktiv şəkildə qurulub.</p>
      )}

      {frames.length > 1 && mode !== "model" && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Məhsul şəkilləri">
          {frames.map((image, position) => (
            <button
              key={`${image}-${position}`}
              type="button"
              role="option"
              aria-selected={position === index}
              aria-label={`Bucaq ${position + 1}`}
              onClick={() => select(position)}
              className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-[#f6f7f9] p-1.5 transition dark:bg-white ${
                position === index ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <ProductImage src={image} category={category} alt="" className="size-full object-contain mix-blend-multiply dark:rounded-none dark:bg-transparent" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
