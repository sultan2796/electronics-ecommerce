import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../context/I18nContext";
import DatePicker from "./DatePicker";

const renderPicker = (props: Partial<Parameters<typeof DatePicker>[0]> = {}) => {
  const onChange = vi.fn();
  render(
    <I18nProvider>
      <DatePicker value="2026-11-13" onChange={onChange} ariaLabel="Tarix" {...props} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Tarix" }));
  return onChange;
};

describe("DatePicker", () => {
  beforeEach(() => localStorage.clear());

  it("brauzer təqvimi əvəzinə öz panelini açır və günü seçir", () => {
    const onChange = renderPicker();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeNull();
    fireEvent.click(screen.getByRole("gridcell", { name: "20" }));
    expect(onChange).toHaveBeenCalledWith("2026-11-20");
  });

  it("seçilmiş günü işarələyir və məhdud tarixləri bağlayır", () => {
    renderPicker({ min: "2026-11-10", max: "2026-11-25" });
    expect(screen.getByRole("gridcell", { name: "13" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("gridcell", { name: "5" })[0]).toBeDisabled();
    screen.getAllByRole("gridcell", { name: "28" }).forEach((cell) => expect(cell).toBeDisabled());
  });

  it("ay adları seçilmiş dildə göstərilir", () => {
    localStorage.setItem("electroshop:locale", "ru");
    renderPicker();
    expect(screen.getByText("Ноябрь")).toBeInTheDocument();
    expect(screen.getByText("Пн")).toBeInTheDocument();
  });

  it("növbəti aya keçir", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "Növbəti ay" }));
    expect(screen.getByText("Dekabr")).toBeInTheDocument();
  });

  it("saatla birlikdə dəyər qaytarır", () => {
    const onChange = renderPicker({ withTime: true, value: "2026-11-13T09:30" });
    fireEvent.click(screen.getByRole("gridcell", { name: "15" }));
    expect(onChange).toHaveBeenCalledWith("2026-11-15T09:30");
  });
});
