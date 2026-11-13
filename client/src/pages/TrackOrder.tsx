import { CheckCircle2, PackageSearch } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import Breadcrumbs from "../components/common/Breadcrumbs";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/common/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { orderService } from "../services/order.service";
import { OrderStatus } from "../types";
import { formatDate, formatPrice, orderStatusLabels, paymentMethodLabels } from "../utils/format";

const steps: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function TrackOrder() {
  const { orderNumber = "" } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const token = new URLSearchParams(location.hash.replace(/^#/, "")).get("token") ?? params.get("token") ?? "";
  const placed = Boolean((location.state as { placed?: boolean } | null)?.placed);
  const order = useAsync(() => (token ? orderService.track(orderNumber, token) : Promise.reject(new Error("İzləmə linki natamamdır"))), [orderNumber, token]);
  const data = order.data;
  const finished = data?.status === "DELIVERED" || data?.status === "CANCELLED";

  useEffect(() => {
    document.title = `${orderNumber} · Sifariş izləmə · ElectroShop`;
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [orderNumber]);

  useEffect(() => {
    if (!data || finished) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") order.reload();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [data, finished, order.reload]);

  if (order.loading && !data) return <Spinner />;

  if (order.error || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <PackageSearch className="mx-auto size-12 text-muted" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="text-xl font-bold">Sifariş tapılmadı</h1>
        <p className="text-sm text-muted">İzləmə linki yanlış və ya köhnədir. Sifariş təsdiqi məktubundakı linkdən istifadə edin və ya bizimlə əlaqə saxlayın.</p>
        <Link to="/contact" className="btn-outline">
          Əlaqə
        </Link>
      </div>
    );
  }

  const current = data.status === "PAID" ? 0 : steps.indexOf(data.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "Ana səhifə", to: "/" }, { label: "Sifariş izləmə" }, { label: data.orderNumber }]} />
      {placed && (
        <div className="flex gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-success" strokeWidth={2} aria-hidden="true" />
          <div>
            <p className="font-semibold">Sifarişiniz qəbul edildi</p>
            <p className="text-muted">Təsdiq və bu izləmə linki e-poçtunuza göndərildi. Linki yadda saxlayın: sifarişinizə yalnız onunla baxmaq olar.</p>
          </div>
        </div>
      )}

      <section className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{`Sifariş ${data.orderNumber}`}</h1>
            <p className="text-sm text-muted">{formatDate(data.createdAt)}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        {data.status === "CANCELLED" ? (
          <Alert>Bu sifariş ləğv edilib.</Alert>
        ) : (
          <ol className="grid grid-cols-4 gap-2" aria-label="Sifarişin mərhələləri">
            {steps.map((step, index) => {
              const done = index <= current;
              return (
                <li key={step} className="space-y-2" aria-current={index === current ? "step" : undefined}>
                  <span className={`block h-1.5 rounded-full ${done ? "bg-brand-600" : "bg-chip"}`} />
                  <span className={`block text-xs ${done ? "font-medium text-ink" : "text-muted"}`}>{orderStatusLabels[step]}</span>
                </li>
              );
            })}
          </ol>
        )}

        {data.statusHistory.length > 0 && (
          <div className="border-t border-line pt-4">
            <h2 className="mb-3 text-sm font-semibold">Status tarixçəsi</h2>
            <ol className="space-y-2.5">
              {[...data.statusHistory].reverse().map((event, index) => (
                <li key={`${event.status}-${event.createdAt}`} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className={index === 0 ? "font-medium" : "text-muted"}>
                    {orderStatusLabels[event.status]}
                    {event.note && <span className="text-muted"> · {event.note}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatDate(event.createdAt)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-semibold">Məhsullar</h2>
        <ul className="divide-y divide-line">
          {data.items.map((item) => (
            <li key={`${item.productId}-${item.productName}`} className="flex justify-between gap-4 py-2.5 text-sm">
              <span translate="no">
                {item.productName} × {item.quantity}
              </span>
              <span className="shrink-0">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Məhsulların dəyəri</dt>
            <dd>{formatPrice(data.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Çatdırılma</dt>
            <dd>{Number(data.shippingFee) > 0 ? formatPrice(data.shippingFee) : "Pulsuz"}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Cəmi</dt>
            <dd>{formatPrice(data.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Ödəniş</dt>
            <dd>{paymentMethodLabels[data.paymentMethod]}</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6 text-sm">
        <h2 className="mb-2 font-semibold">Çatdırılma ünvanı</h2>
        <p>{data.shippingAddress.fullName}</p>
        <p className="text-muted">
          {data.shippingAddress.line1}
          {data.shippingAddress.line2 ? `, ${data.shippingAddress.line2}` : ""}, {data.shippingAddress.city}
        </p>
        <p className="text-muted">{data.shippingAddress.phone}</p>
      </section>

      <p className="text-center text-xs text-muted">
        Növbəti sifarişlərinizi bir yerdə izləmək üçün{" "}
        <Link to="/register" className="link text-xs">
          hesab yaradın
        </Link>
        .
      </p>
    </div>
  );
}
