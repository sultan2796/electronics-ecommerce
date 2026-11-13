import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";

const query = (media: string) => typeof window !== "undefined" && Boolean(window.matchMedia?.(media).matches);

export const prefersReducedMotion = () => query("(prefers-reduced-motion: reduce)");

export const canHover = () => query("(hover: hover) and (pointer: fine)");

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function useTilt<T extends HTMLElement>(maxDegrees = 6) {
  const ref = useRef<T>(null);
  const frame = useRef(0);

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--rx", "0deg");
    element.style.setProperty("--ry", "0deg");
    element.style.setProperty("--glare", "0");
    element.dataset.tilting = "false";
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (event.pointerType !== "mouse" || !canHover() || prefersReducedMotion()) return;
      const element = ref.current;
      if (!element) return;
      const { clientX, clientY } = event;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        element.style.setProperty("--rx", `${((0.5 - y) * maxDegrees).toFixed(2)}deg`);
        element.style.setProperty("--ry", `${((x - 0.5) * maxDegrees).toFixed(2)}deg`);
        element.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        element.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        element.style.setProperty("--glare", "1");
        element.dataset.tilting = "true";
      });
    },
    [maxDegrees],
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { ref, onPointerMove, onPointerLeave: reset };
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      element.dataset.revealed = "true";
      return;
    }
    element.dataset.revealed = "false";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return ref;
}
