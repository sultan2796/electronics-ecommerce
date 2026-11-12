import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import { useCart } from "../context/CartContext";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { orderService } from "../services/order.service";
import { goToPayment, paymentService } from "../services/payment.service";
import { PaymentMethod, ShippingAddress } from "../types";
import { formatPrice } from "../utils/format";

const fields: { name: keyof ShippingAddress; label: string; required: boolean; type?: string; autoComplete?: string }[] = [
  { name: "fullName", label: "Ad Soyad", required: true, autoComplete: "name" },
  { name: "phone", label: "Telefon", required: true, type: "tel", autoComplete: "tel" },
  { name: "line1", label: "Ünvan", required: true, autoComplete: "address-line1" },
  { name: "line2", label: "Ünvan (əlavə)", required: false, autoComplete: "address-line2" },
  { name: "city", label: "Şəhər", required: true, autoComplete: "address-level2" },
  { name: "postalCode", label: "Poçt indeksi", required: true, autoComplete: "postal-code" },
  { name: "country", label: "Ölkə", required: true, autoComplete: "country-name" },
];

const initialAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "Bakı",
  postalCode: "",
  country: "Azərbaycan",
};

const methodInfo: Record<PaymentMethod, { title: string; description: string }> = {
  CARD: { title: "Kartla onlayn ödəniş", description: "Visa, Mastercard və digər bank kartları. Təhlükəsiz ödəniş səhifəsinə yönləndiriləcəksiniz." },
  CASH_ON_DELIVERY: { title: "Qapıda ödəniş", description: "Sifarişi aldıqda nağd və ya kartla kuryerə ödəyin." },
};

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const config = useAsync(() => paymentService.config(), []);
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = config.data?.methods ?? ["CASH_ON_DELIVERY"];
  const selected: PaymentMethod = method && methods.includes(method) ? method : methods[0];

  if (cart && !cart.items.length) {
    return (
      <EmptyState
        title="Sifariş üçün səbətdə məhsul yoxdur."
        action={
          <Link to="/products" className="btn-primary">
            Məhsullara bax
          </Link>
        }
      />
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { line2, ...rest } = address;
      const result = await orderService.checkout(line2?.trim() ? address : rest, selected);
      await refresh();
      if (result.payment?.redirectUrl) {
        goToPayment(result.payment.redirectUrl, navigate);
        return;
      }
      navigate(`/orders/${result.order.id}`, {
        replace: true,
        state: { placed: true, paymentError: result.paymentError ?? null },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h1 className="text-2xl font-bold">Çatdırılma məlumatları</h1>
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className={`space-y-1 ${field.name.startsWith("line") ? "sm:col-span-2" : ""}`}>
                <span className="text-sm font-medium">{field.label}</span>
                <input
                  className="input"
                  type={field.type ?? "text"}
                  required={field.required}
                  autoComplete={field.autoComplete}
                  value={address[field.name] ?? ""}
                  onChange={(e) => setAddress((current) => ({ ...current, [field.name]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ödəniş üsulu</h2>
            {config.data?.testMode && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                Test rejimi
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                  selected === value ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-line hover:border-brand-500/50"
                }`}
              >
                <input type="radio" name="payment" className="mt-1 accent-brand-600" checked={selected === value} onChange={() => setMethod(value)} />
                <span>
                  <span className="block text-sm font-semibold">{methodInfo[value].title}</span>
                  <span className="mt-1 block text-xs text-muted">{methodInfo[value].description}</span>
                </span>
              </label>
            ))}
          </div>
          {!methods.includes("CARD") && !config.loading && (
            <p className="text-xs text-muted">Kartla onlayn ödəniş hazırda aktiv deyil.</p>
          )}
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Sifarişiniz</h2>
        {cart?.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <span className="text-ink/80">
              {item.product.name} × {item.quantity}
            </span>
            <span className="shrink-0">{formatPrice(Number(item.product.price) * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3 text-sm">
          <span className="text-muted">Çatdırılma</span>
          <span className="text-emerald-600 dark:text-emerald-400">Pulsuz</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Cəmi</span>
          <span>{formatPrice(cart?.subtotal ?? 0)}</span>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting || !cart}>
          {submitting ? "Göndərilir..." : selected === "CARD" ? "Ödənişə keç" : "Sifarişi təsdiqlə"}
        </button>
        <p className="text-center text-[11px] text-muted">Sifarişi təsdiqləməklə satış şərtləri ilə razılaşırsınız.</p>
      </aside>
    </form>
  );
}
