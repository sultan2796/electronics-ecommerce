import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StarRating from "./StarRating";

describe("StarRating", () => {
  it("yalnız göstərmə rejimində əlçatan etiket verir", () => {
    render(<StarRating value={4.5} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "5 ulduzdan 4.5");
  });

  it("seçim rejimində kliklə dəyər qaytarır", () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} />);
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
    expect(stars[1]).toHaveAttribute("aria-checked", "true");
    fireEvent.click(stars[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
