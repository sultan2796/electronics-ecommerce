import Select from "../../components/common/Select";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { Order, OrderStatus } from "../../types";
import { formatDate, formatPrice, orderStatusLabels, paymentMethodLabels, paymentStatusLabels, paymentStatusStyles } from "../../utils/format";

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const statuses = Object.keys(orderStatusLabels) as OrderStatus[];

const optionsFor = (order: Order): OrderStatus[] =>
  order.status === "PENDING" && order.paymentMethod === "CASH_ON_DELIVERY"
    ? ["PROCESSING", ...nextStatuses.PENDING]
    : nextStatuses[order.status];

export default function AdminOrders() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const statusParam = params.get("status") as OrderStatus | null;
  const status = statusParam && statuses.includes(statusParam) ? statusParam : undefined;
  const page = Number(params.get("page")) || 1;
  const [error, setError] = useState<string | null>(null);

  const orders = useAsync(() => adminService.orders({ status, page }), [status, page]);

  const changeStatus = async (id: string, next: OrderStatus) => {
    setError(null);
    try {
      const updated = await adminService.updateOrderStatus(id, next);
      orders.setData((current) =>
        current ? { ...current, items: current.items.map((order) => (order.id === id ? updated : order)) } : current,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sifarişlərin izlənməsi</h1>
        <Select
          className="w-52"
          ariaLabel="Status filtri"
          value={status ?? ""}
          onChange={(next) => setParams(next ? { status: next } : {})}
          options={[{ value: "", label: "Bütün statuslar" }, ...statuses.map((value) => ({ value, label: orderStatusLabels[value] }))]}
        />
      </div>
      {error && <Alert>{error}</Alert>}

      {orders.loading ? (
        <Spinner />
      ) : orders.error ? (
        <Alert>{orders.error}</Alert>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-3">Sifariş</th>
                  <th className="px-4 py-3">Müştəri</th>
                  <th className="px-4 py-3">Tarix</th>
                  <th className="px-4 py-3">Məhsullar</th>
                  <th className="px-4 py-3">Cəmi</th>
                  <th className="px-4 py-3">Ödəniş</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {orders.data?.items.map((order) => (
                  <tr key={order.id} className="border-t border-line align-top">
                    <td className="px-4 py-3 font-medium">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p>{order.user?.name}</p>
                      <p className="text-xs text-muted">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.productName} × {item.quantity}
                        </p>
                      ))}
                    </td>
                    <td className="px-4 py-3">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs">{paymentMethodLabels[order.paymentMethod]}</p>
                      <p className={`text-xs font-medium ${paymentStatusStyles[order.paymentStatus]}`}>{paymentStatusLabels[order.paymentStatus]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      {!can("orders:write") ? (
                        <span className="text-xs text-muted">Yalnız baxış</span>
                      ) : optionsFor(order).length ? (
                        <Select
                          className="w-44"
                          size="sm"
                          align="right"
                          ariaLabel="Statusu dəyiş"
                          placeholder="Statusu dəyiş"
                          value=""
                          onChange={(next) => changeStatus(order.id, next as OrderStatus)}
                          options={optionsFor(order).map((next) => ({ value: next, label: orderStatusLabels[next] }))}
                        />
                      ) : (
                        <span className="text-xs text-muted">Tamamlanıb</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.data?.items.length && <p className="px-5 py-6 text-sm text-muted">Sifariş tapılmadı.</p>}
          </div>
          {orders.data && (
            <Pagination
              page={orders.data.page}
              totalPages={orders.data.totalPages}
              onChange={(next) => setParams({ ...(status && { status }), page: String(next) })}
            />
          )}
        </>
      )}
    </div>
  );
}
