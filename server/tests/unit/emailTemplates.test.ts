import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  orderConfirmationEmail,
  orderStatusEmail,
  passwordChangedEmail,
  passwordResetEmail,
  welcomeEmail,
} from "../../src/services/email/templates";

const order = {
  id: "clxyz00000000000abcdef12",
  total: "1250.50",
  paymentMethod: "CASH_ON_DELIVERY" as const,
  items: [
    { productName: "iPhone <script>", quantity: 1, unitPrice: "1000.50" },
    { productName: "AirPods", quantity: 2, unitPrice: "125" },
  ],
};

describe("e-poçt şablonları", () => {
  it("HTML simvollarını təhlükəsizləşdirir", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  it("istifadəçi adı HTML-ə xam düşmür (XSS)", () => {
    const email = welcomeEmail({ name: "<img src=x onerror=alert(1)>" });
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img");
  });

  it("sifariş təsdiqi məhsulları və cəmi göstərir", () => {
    const email = orderConfirmationEmail({ name: "Sultan" }, order);
    expect(email.template).toBe("order-confirmation");
    expect(email.subject).toContain("#ABCDEF12");
    expect(email.html).toContain("iPhone &lt;script&gt;");
    expect(email.html).not.toContain("iPhone <script>");
    expect(email.text).toContain("1250.50");
  });

  it("status məktubu yalnız müştəriyə aid statuslar üçün yaranır", () => {
    expect(orderStatusEmail({ name: "S" }, order, "SHIPPED")?.template).toBe("order-shipped");
    expect(orderStatusEmail({ name: "S" }, order, "CANCELLED")?.template).toBe("order-cancelled");
    expect(orderStatusEmail({ name: "S" }, order, "PENDING")).toBeNull();
  });

  it("şifrə bərpası məktubu linki və müddəti ehtiva edir", () => {
    const link = "http://localhost:5173/reset-password?token=abc";
    const email = passwordResetEmail({ name: "Sultan" }, link, 30);
    expect(email.html).toContain(link);
    expect(email.text).toContain(link);
    expect(email.text).toContain("30");
  });

  it("hər şablonun mövzusu, HTML və mətn versiyası var", () => {
    for (const email of [welcomeEmail({ name: "A" }), passwordChangedEmail({ name: "A" }), orderConfirmationEmail({ name: "A" }, order)]) {
      expect(email.subject.length).toBeGreaterThan(3);
      expect(email.html.startsWith("<!doctype html>")).toBe(true);
      expect(email.text.length).toBeGreaterThan(5);
    }
  });
});
