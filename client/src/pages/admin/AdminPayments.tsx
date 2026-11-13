import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import StatCard from "../../components/admin/StatCard";
import { useAsync } from "../../hooks/useAsync";
import { AdminPayment, adminService } from "../../services/admin.service";
import { PaymentStatus } from "../../types";
import { formatDate, formatPrice, paymentStatusLabels, paymentStatusStyles } from "../../utils/format";

const statuses = Object.keys(paymentStatusLabels) as PaymentStatus[];

const customerOf = (payment: AdminPayment) => payment.order.user?.name ?? payment.order.guestName ?? payment.order.guestEmail ?? "—";

export default function AdminPayments() {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const payments = useAsync(() => adminService.payments({ status: status || undefined, q: search || undefined, page }), [status, search, page]);
  const summary = payments.data?.summary ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ödənişlər</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ödənilib" value={formatPrice(summary.SUCCEEDED?.amount ?? 0)} hint={`${summary.SUCCEEDED?.count ?? 0} əməliyyat`} tone="green" />
        <StatCard label="Gözləyir" value={formatPrice(summary.PENDING?.amount ?? 0)} hint={`${summary.PENDING?.count ?? 0} əməliyyat`} tone="amber" />
        <StatCard label="Uğursuz" value={summary.FAILED?.count ?? 0} hint="Kartla ödəniş alınmayıb" tone="red" />
        <StatCard label="Geri qaytarılıb" value={formatPrice(summary.REFUNDED?.amount ?? 0)} hint={`${summary.REFUNDED?.count ?? 0} əməliyyat`} tone="blue" />
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <form
          className="flex min-w-[220px] flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(query.trim());
          }}
        >
          <input className="input" placeholder="Sifariş nömrəsi, e-poçt və ya referans" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="btn-outline">Axtar</button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {(["", ...statuses] as const).map((value) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => {
                setPage(1);
                setStatus(value);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${status === value ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
            >
              {value ? paymentStatusLabels[value] : "Hamısı"}
            </button>
          ))}
        </div>
      </div>

      {payments.loading && !payments.data ? (
        <Spinner />
      ) : payments.error ? (
        <Alert>{payments.error}</Alert>
      ) : payments.data?.items.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Sifariş</th>
                <th className="px-4 py-3 font-medium">Müştəri</th>
                <th className="px-4 py-3 font-medium">Provayder</th>
                <th className="px-4 py-3 font-medium">Məbləğ</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {payments.data.items.map((payment) => (
                <tr key={payment.id} className="border-b border-chip last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders?q=${encodeURIComponent(payment.order.orderNumber ?? payment.order.id)}`} className="font-medium hover:text-brand-600">
                      {payment.order.orderNumber ?? payment.order.id.slice(-8)}
                    </Link>
                    <p className="max-w-[180px] truncate text-xs text-muted" title={payment.reference}>{payment.reference}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{customerOf(payment)}</p>
                    <p className="text-xs text-muted">{payment.order.user?.email ?? payment.order.guestEmail ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.provider}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(payment.amount)}</td>
                  <td className={`px-4 py-3 font-medium ${paymentStatusStyles[payment.status]}`}>{paymentStatusLabels[payment.status]}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="card p-6 text-sm text-muted">
          {search || status ? "Bu filtrə uyğun ödəniş tapılmadı." : "Hələ kartla ödəniş yoxdur. Qapıda ödənişli sifarişlər burada görünmür, onlar Sifarişlər bölməsindədir."}
        </p>
      )}
      {payments.data && payments.data.totalPages > 1 && <Pagination page={page} totalPages={payments.data.totalPages} onChange={setPage} />}
    </div>
  );
}
