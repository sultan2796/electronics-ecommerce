import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/common/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { orderService } from "../services/order.service";
import { goToPayment } from "../services/payment.service";
import { OrderStatus } from "../types";
import { formatDate, formatPrice, orderStatusLabels, paymentMethodLabels, paymentStatusLabels, paymentStatusStyles } from "../utils/format";

const flow: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderDetail() {
  const { id = "" } = useParams();
  const { data: order, loading, error, setData } = useAsync(() => orderService.get(id), [id]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as { placed?: boolean; paymentError?: string | null } | null) ?? null;

  if (loading && !order) return <Spinner />;
  if (error || !order) return <Alert>{error ?? "Sifariş tapılmadı"}</Alert>;

  const cancelled = order.status === "CANCELLED";
  const currentStep = flow.indexOf(order.status);
  const address = order.shippingAddress;

  const canPay = order.status === "PENDING" && order.paymentMethod === "CARD" && order.paymentStatus !== "SUCCEEDED";

  const pay = async () => {
    setPaying(true);
    setActionError(null);
    try {
      const { redirectUrl } = await orderService.pay(order.id);
      goToPayment(redirectUrl, navigate);
    } catch (err) {
      setActionError(getErrorMessage(err));
      setPaying(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Sifariş ləğv edilsin?")) return;
    setCancelling(true);
    setActionError(null);
    try {
      setData(await orderService.cancel(order.id));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="text-xs text-muted hover:text-brand-600">
            ← Sifarişlərim
          </Link>
          <h1 className="text-2xl font-bold">Sifariş #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/orders/${order.id}/invoice`} className="btn-outline px-4 py-2 text-sm">
            Faktura (PDF)
          </Link>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {state?.placed && !state.paymentError && <Alert variant="success">Sifarişiniz qəbul edildi. Təşəkkür edirik!</Alert>}
      {state?.paymentError && <Alert>Sifariş yaradıldı, amma ödəniş başlamadı: {state.paymentError}</Alert>}
      {canPay && (
        <Alert variant="info">
          Bu sifariş ödəniş gözləyir. Ödənilməmiş kart sifarişləri 30 dəqiqədən sonra avtomatik ləğv olunur.
        </Alert>
      )}
      {actionError && <Alert>{actionError}</Alert>}

      <section className="card p-6">
        {cancelled ? (
          <p className="text-sm text-muted">Bu sifariş ləğv edilib. Məhsullar stoka qaytarılıb.</p>
        ) : (
          <ol className="grid grid-cols-5 gap-2">
            {flow.map((step, index) => {
              const done = index <= currentStep;
              return (
                <li key={step} className="space-y-2 text-center">
                  <span className={`block h-1.5 rounded-full ${done ? "bg-brand-500" : "bg-chip"}`} />
                  <span className={`block text-[11px] sm:text-xs ${done ? "font-medium text-ink" : "text-muted"}`}>
                    {orderStatusLabels[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-4 font-semibold">Məhsullar</h2>
          <ul className="divide-y divide-chip">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {item.productName} <span className="text-muted">× {item.quantity}</span>
                </span>
                <span className="font-medium">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {Number(order.discount ?? 0) > 0 && (
            <div className="mt-4 flex justify-between border-t border-chip pt-4 text-sm text-emerald-600 dark:text-emerald-400">
              <span>
                Endirim{order.couponCode ? ` (${order.couponCode})` : ""}
                {order.pointsUsed ? ` · ${order.pointsUsed} bal` : ""}
              </span>
              <span>−{formatPrice(order.discount ?? 0)}</span>
            </div>
          )}
          <div className="mt-4 flex justify-between border-t border-chip pt-4 text-lg font-bold">
            <span>Cəmi</span>
            <span className="text-brand-600">{formatPrice(order.total)}</span>
          </div>
        </section>

        <section className="card space-y-4 p-6 text-sm">
          <div>
            <h2 className="mb-2 font-semibold">Çatdırılma ünvanı</h2>
            <p>{address.fullName}</p>
            <p className="text-muted">{address.phone}</p>
            <p className="text-muted">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
            </p>
            <p className="text-muted">
              {address.city}, {address.postalCode}, {address.country}
            </p>
          </div>
          <div className="space-y-1">
            <h2 className="mb-1 font-semibold">Ödəniş</h2>
            <p className="text-muted">{paymentMethodLabels[order.paymentMethod]}</p>
            <p className={`font-medium ${paymentStatusStyles[order.paymentStatus]}`}>{paymentStatusLabels[order.paymentStatus]}</p>
            {order.paidAt && <p className="text-xs text-muted">{formatDate(order.paidAt)}</p>}
          </div>
          {canPay && (
            <button type="button" className="btn-primary w-full" disabled={paying} onClick={pay}>
              {paying ? "Yönləndirilir..." : order.paymentStatus === "FAILED" ? "Yenidən ödə" : "İndi ödə"}
            </button>
          )}
          {order.status === "PENDING" && (
            <button type="button" className="btn-outline w-full text-red-600" disabled={cancelling} onClick={cancel}>
              {cancelling ? "Ləğv edilir..." : "Sifarişi ləğv et"}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
