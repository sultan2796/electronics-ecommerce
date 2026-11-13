import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button, { buttonClass } from "./Button";

describe("Button", () => {
  it("variant və ölçü siniflərini birləşdirir", () => {
    expect(buttonClass("outline", "sm", "w-full")).toBe("btn-outline btn-sm w-full");
    expect(buttonClass()).toBe("btn-primary");
  });

  it("klik hadisəsini ötürür", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Səbətə at</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Səbətə at" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("yüklənərkən spinner göstərir, deaktiv olur və təkrar klik etmir", () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingText="Göndərilir..." onClick={onClick}>
        Sifarişi tamamla
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Göndərilir..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector(".btn-spinner")).not.toBeNull();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("standart tipi button-dur, formu təsadüfən göndərmir", () => {
    render(<Button>Davam et</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
