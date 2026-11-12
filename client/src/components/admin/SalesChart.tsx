import { useState } from "react";
import { formatDay, formatPrice } from "../../utils/format";

interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

const dayLabel = (date: string) => formatDay(new Date(`${date}T00:00:00`));

export default function SalesChart({ data }: { data: SalesPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((point) => point.revenue), 1);

  const total = data.reduce((sum, point) => sum + point.revenue, 0);
  const orders = data.reduce((sum, point) => sum + point.orders, 0);
  const active = hovered !== null ? data[hovered] : null;

  return (
    <section className="card p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">Son 14 günün satışları</h2>
          <p className="text-xs text-muted">Ləğv edilməmiş sifarişlər üzrə</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-brand-600">
            {formatPrice(active ? active.revenue : total)}
          </p>
          <p className="text-xs text-muted">
            {active
              ? `${dayLabel(active.date)} · ${active.orders} sifariş`
              : `${orders} sifariş`}
          </p>
        </div>
      </div>
      <div
        className="flex h-44 items-end gap-1.5"
        onMouseLeave={() => setHovered(null)}
      >
        {data.map((point, index) => {
          const height =
            point.revenue > 0 ? Math.max(6, (point.revenue / max) * 100) : 2;
          return (
            <button
              key={point.date}
              type="button"
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              aria-label={`${dayLabel(point.date)}: ${formatPrice(point.revenue)}, ${point.orders} sifariş`}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <span
                className={`block w-full rounded-t-md transition-colors ${
                  hovered === index
                    ? "bg-brand-600"
                    : point.revenue > 0
                      ? "bg-brand-500/70"
                      : "bg-chip"
                }`}
                style={{ height: `${height}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{data.length ? dayLabel(data[0].date) : ""}</span>
        <span>{data.length ? dayLabel(data[data.length - 1].date) : ""}</span>
      </div>
    </section>
  );
}
