import { useState } from "react";
import DatePicker from "../../components/common/DatePicker";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { extraService } from "../../services/extra.service";
import { formatPrice } from "../../utils/format";

const months = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
const label = (key: string) => `${months[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`;
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function AdminReports() {
  const { can } = useAuth();
  const today = new Date();
  const [from, setFrom] = useState(isoDay(new Date(today.getFullYear(), today.getMonth() - 11, 1)));
  const [to, setTo] = useState(isoDay(today));
  const [hovered, setHovered] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const range = { from: `${from}T00:00:00`, to: `${to}T23:59:59` };
  const report = useAsync(() => extraService.salesReport(range), [from, to]);

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      const blob = await extraService.salesCsv(range);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sifarisler-${from}-${to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const data = report.data;
  const max = Math.max(1, ...(data?.monthly.map((m) => m.revenue) ?? [1]));
  const hasRevenue = Boolean(data?.monthly.some((m) => m.revenue > 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hesabatlar</h1>
          <p className="text-sm text-muted">Ödənilmiş və icra olunan sifarişlər üzrə gəlir</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1 text-xs text-muted">
            Başlanğıc
            <DatePicker className="w-48" required ariaLabel="Başlanğıc" value={from} max={to} onChange={setFrom} />
          </div>
          <div className="space-y-1 text-xs text-muted">
            Son
            <DatePicker className="w-48" required ariaLabel="Son" value={to} min={from} onChange={setTo} />
          </div>
          {can("orders:read") && (
            <button type="button" className="btn-primary py-2.5" onClick={download} disabled={downloading}>
              {downloading ? "Hazırlanır..." : "Excel (CSV) yüklə"}
            </button>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {report.loading && !data ? (
        <Spinner />
      ) : report.error ? (
        <Alert>{report.error}</Alert>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Gəlir", value: formatPrice(data.totals.revenue) },
              { label: "Sifarişlər", value: String(data.totals.orders) },
              { label: "Orta çek", value: formatPrice(data.totals.averageOrderValue) },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="card p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold">Aylıq gəlir</h2>
              <p className="text-sm text-muted">
                {hovered !== null
                  ? `${label(data.monthly[hovered].month)}: ${formatPrice(data.monthly[hovered].revenue)} · ${data.monthly[hovered].orders} sifariş`
                  : "Sütuna toxunun və ya üzərinə gəlin"}
              </p>
            </div>
            <div className="relative">
              {!hasRevenue && (
                <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-muted">Bu dövrdə gəlir yoxdur</p>
              )}
              <div className="flex h-48 items-end gap-1 sm:h-56 sm:gap-2" onMouseLeave={() => setHovered(null)}>
                {data.monthly.map((month, index) => (
                  <button
                    type="button"
                    key={month.month}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 focus-visible:outline-none"
                    onMouseEnter={() => setHovered(index)}
                    onFocus={() => setHovered(index)}
                    onClick={() => setHovered(index)}
                    aria-label={`${label(month.month)}: ${formatPrice(month.revenue)}, ${month.orders} sifariş`}
                  >
                    <span
                      className={`block w-full max-w-[44px] rounded-t-md transition-colors ${
                        hovered === index ? "bg-brand-600" : month.revenue > 0 ? "bg-brand-500/70 group-hover:bg-brand-500" : "bg-chip"
                      }`}
                      style={{ height: month.revenue > 0 ? `${Math.max(3, (month.revenue / max) * 100)}%` : "3px" }}
                    />
                    <span
                      className={`w-full overflow-visible whitespace-nowrap text-center text-[10px] leading-tight text-muted ${index % 2 === (data.monthly.length - 1) % 2 ? "" : "invisible sm:visible"}`}
                    >
                      {months[Number(month.month.slice(5, 7)) - 1]}
                      <span className="hidden sm:inline">{` ${month.month.slice(2, 4)}`}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <h2 className="px-4 pt-5 font-semibold sm:px-5">Ən çox satılan məhsullar</h2>
            <table className="mt-3 w-full table-fixed text-sm">
              <thead className="text-left text-xs text-muted sm:text-sm">
                <tr className="border-b border-chip">
                  <th className="px-4 py-3 font-medium sm:px-5">Məhsul</th>
                  <th className="w-16 px-2 py-3 text-right font-medium sm:w-32 sm:px-5">Ədəd</th>
                  <th className="w-28 px-4 py-3 text-right font-medium sm:w-36 sm:px-5">Gəlir</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      Bu dövrdə satış yoxdur
                    </td>
                  </tr>
                )}
                {data.topProducts.map((product) => (
                  <tr key={product.name} className="border-b border-chip last:border-0">
                    <td className="break-words px-4 py-3 sm:px-5">{product.name}</td>
                    <td className="px-2 py-3 text-right tabular-nums sm:px-5">{product.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums sm:px-5">{formatPrice(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
