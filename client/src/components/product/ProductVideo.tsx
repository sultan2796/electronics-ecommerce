import { PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ProductVideo({ src, poster, title }: { src: string; poster?: string | null; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  if (state === "error") return null;

  return (
    <section aria-label="Məhsul videosu" className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <PlayCircle className="size-5 text-brand-600 dark:text-brand-500" strokeWidth={1.8} aria-hidden="true" />
        Məhsul videosu
      </h2>
      <div ref={hostRef} className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-black">
        {near && (
          <video
            className="size-full object-contain"
            controls
            playsInline
            preload="metadata"
            poster={poster ?? undefined}
            aria-label={title}
            onLoadStart={() => setState("loading")}
            onLoadedMetadata={() => setState("ready")}
            onError={() => setState("error")}
          >
            <source src={src} type={/\.webm(\?|$)/i.test(src) ? "video/webm" : "video/mp4"} />
          </video>
        )}
        {state !== "ready" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status">
            <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="sr-only">Video yüklənir</span>
          </div>
        )}
      </div>
    </section>
  );
}
