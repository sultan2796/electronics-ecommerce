import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Select from "./Select";

const options = [
  { value: "a", label: "Alma" },
  { value: "b", label: "Banan" },
  { value: "c", label: "Çiyələk" },
];

describe("Select", () => {
  it("seçilmiş dəyəri və placeholder-i göstərir", () => {
    const { rerender } = render(<Select value="" options={options} onChange={() => undefined} placeholder="Meyvə seçin" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Meyvə seçin");
    rerender(<Select value="b" options={options} onChange={() => undefined} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Banan");
  });

  it("kliklə açılır və seçim edir", () => {
    const onChange = vi.fn();
    render(<Select value="a" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Çiyələk" }));
    expect(onChange).toHaveBeenCalledWith("c");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("klaviatura ilə idarə olunur", () => {
    const onChange = vi.fn();
    render(<Select value="a" options={options} onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("Escape ilə bağlanır", () => {
    render(<Select value="a" options={options} onChange={() => undefined} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
