import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

function Broken(): JSX.Element {
  throw new Error("test xətası");
}

describe("ErrorBoundary", () => {
  it("uşaq komponent çökəndə xəta ekranını və mesajı göstərir", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Gözlənilməz xəta baş verdi")).toBeInTheDocument();
    expect(screen.getByText("test xətası")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("xəta yoxdursa uşaqları göstərir", () => {
    render(
      <ErrorBoundary>
        <p>salam</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("salam")).toBeInTheDocument();
  });
});
