import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/common/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { orderService } from "../services/order.service";
import { formatDate, formatPrice, paymentMethodLabels, paymentStatusLabels, paymentStatusStyles, orderCode } from "../utils/format";

export default function Orders() {
  const location = useLocation();
  const placed = Boolean((location.state as { placed?: boolean } | null)?.placed);
  const { data: orders, loading, error, setData } = useAsync(() => orderService.mine(), []);
  const [actionError, setActionError] = useState<string | null>(null);

  const cancel = async (id: string) => {
    setActionError(null);
    try {
      const updated = await orderService.cancel(id);
      setData((current) => current?.map((order) => (order.id === id ? updated : order)) ?? null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sifarişlərim</h1>
      {placed && <Alert variant="success">Sifarişiniz qəbul edildi.</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {!orders?.length ? (
        <EmptyState
          title="Hələ sifarişiniz yoxdur."
          action={
            <Link to="/products" className="btn-primary">
              Alış-verişə başla
            </Link>
          }
        />
      ) : (
        orders.map((order) => (
          <article key={order.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link to={`/orders/${order.id}`} className="font-semibold hover:text-brand-600">
                  {orderCode(order)} →
                </Link>
                <p className="text-xs text-muted">
                  {formatDate(order.createdAt)} · {paymentMethodLabels[order.paymentMethod]} ·{" "}
                  <span className={paymentStatusStyles[order.paymentStatus]}>{paymentStatusLabels[order.paymentStatus]}</span>
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <ul className="space-y-1 text-sm text-ink/70">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="font-bold">{formatPrice(order.total)}</span>
              {order.status === "PENDING" && (
                <button className="text-sm text-red-600" onClick={() => cancel(order.id)}>
                  Sifarişi ləğv et
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
