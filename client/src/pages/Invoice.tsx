import { useEffect } from "react";
import Logo from "../components/brand/Logo";
import { Link, useParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import { useAsync } from "../hooks/useAsync";
import { orderService } from "../services/order.service";
import { formatDate, formatPrice, orderStatusLabels, paymentMethodLabels, orderCode } from "../utils/format";

export default function Invoice() {
  const { id = "" } = useParams();
  const { data: order, loading, error } = useAsync(() => orderService.get(id), [id]);

  useEffect(() => {
    if (order) document.title = `Faktura ${orderCode(order)} · ElectroShop`;
  }, [order]);

  if (loading) return <Spinner />;
  if (error || !order) return <Alert>{error ?? "Sifariş tapılmadı"}</Alert>;

  const code = orderCode(order).replace(/^#/, "");
  const subtotal = Number(order.subtotal ?? 0) || order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to={`/orders/${order.id}`} className="text-sm text-muted hover:text-brand-600">
          ← Sifarişə qayıt
        </Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          PDF kimi yüklə / Çap et
        </button>
      </div>

      <article className="rounded-2xl bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 print:rounded-none print:p-0 print:shadow-none print:ring-0 sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <Logo />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              ElectroShop MMC
              <br />
              Bakı, Azərbaycan
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-wide">Faktura</p>
            <p className="mt-1 text-sm text-slate-500">№ {code}</p>
            <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-6 py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alıcı</p>
            <p className="mt-2 font-medium">{address.fullName}</p>
            <p className="text-slate-600">{address.phone}</p>
            <p className="text-slate-600">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
            </p>
            <p className="text-slate-600">
              {address.city}, {address.postalCode}, {address.country}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sifariş</p>
            <p className="mt-2">Status: {orderStatusLabels[order.status]}</p>
            <p>Ödəniş: {paymentMethodLabels[order.paymentMethod]}</p>
            {order.paidAt && <p>Ödənilib: {formatDate(order.paidAt)}</p>}
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="py-3">Məhsul</th>
              <th className="py-3 text-center">Say</th>
              <th className="py-3 text-right">Qiymət</th>
              <th className="py-3 text-right">Məbləğ</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 pr-4">{item.productName}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{formatPrice(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{formatPrice(Number(item.unitPrice) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Ara cəm</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {Number(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>
                Endirim
                {order.couponCode ? ` (${order.couponCode})` : ""}
                {order.pointsUsed ? ` · ${order.pointsUsed} bal` : ""}
              </span>
              <span>−{formatPrice(order.discount ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Çatdırılma</span>
            <span>Pulsuz</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
            <span>Cəmi</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          Alış-verişiniz üçün təşəkkür edirik! Suallar üçün sifariş nömrəsini ({code}) qeyd edin.
        </footer>
      </article>
    </div>
  );
}
