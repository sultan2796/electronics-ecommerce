import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../context/I18nContext";
import { HeroSlide } from "../../types";
import HeroSlider from "./HeroSlider";

if (typeof window.PointerEvent === "undefined" || !("pointerType" in new window.PointerEvent("pointerdown"))) {
  class TestPointerEvent extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;
}

const slides: HeroSlide[] = [
  { id: "a", title: "Qış endirimi", subtitle: "Hər şey ucuz", eyebrow: "Yeni", imageUrl: "/a.jpg", buttonText: "Al", buttonLink: "/products" },
  { id: "b", title: "Noutbuk həftəsi", subtitle: null, eyebrow: null, imageUrl: "/b.jpg", buttonText: null, buttonLink: null },
  { id: "c", title: "Aksesuarlar", subtitle: null, eyebrow: null, imageUrl: "/c.jpg", buttonText: "Bax", buttonLink: "https://example.com" },
];

const renderSlider = () =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <HeroSlider products={[]} slides={slides} />
      </I18nProvider>
    </MemoryRouter>,
  );

const activeTitle = () => document.querySelector('.hero-slide[data-state="active"] h2')?.textContent;

describe("HeroSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("admin slaydlarını göstərir və brend slaydını əvəz edir", () => {
    renderSlider();
    expect(activeTitle()).toBe("Qış endirimi");
    expect(document.querySelectorAll(".hero-slide")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Al" })).toHaveAttribute("href", "/products");
  });

  it("oxlarla irəli və geri keçir, əvvəlki slayd çıxış animasiyası alır", () => {
    renderSlider();
    fireEvent.click(screen.getByRole("button", { name: "Növbəti slayd" }));
    expect(activeTitle()).toBe("Noutbuk həftəsi");
    expect(document.querySelector('.hero-slide[data-state="leaving"] h2')?.textContent).toBe("Qış endirimi");
    fireEvent.click(screen.getByRole("button", { name: "Əvvəlki slayd" }));
    fireEvent.click(screen.getByRole("button", { name: "Əvvəlki slayd" }));
    expect(activeTitle()).toBe("Aksesuarlar");
  });

  it("avtomatik keçir, üzərinə gələndə dayanır", () => {
    renderSlider();
    act(() => vi.advanceTimersByTime(6600));
    expect(activeTitle()).toBe("Noutbuk həftəsi");
    fireEvent.mouseEnter(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(20000));
    expect(activeTitle()).toBe("Noutbuk həftəsi");
    fireEvent.mouseLeave(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(6600));
    expect(activeTitle()).toBe("Aksesuarlar");
  });

  it("toxunma ilə sürüşdürmə slaydı dəyişir", () => {
    renderSlider();
    const region = screen.getByRole("region");
    fireEvent.pointerDown(region, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(region, { clientX: 120, clientY: 110, pointerType: "touch" });
    expect(activeTitle()).toBe("Noutbuk həftəsi");
  });

  it("klaviatura oxları və nöqtələr işləyir", () => {
    renderSlider();
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(activeTitle()).toBe("Noutbuk həftəsi");
    fireEvent.click(screen.getByRole("button", { name: "3-ci slayd" }));
    expect(activeTitle()).toBe("Aksesuarlar");
    expect(screen.getByRole("link", { name: "Bax" })).toHaveAttribute("rel", "noopener noreferrer");
  });
});
