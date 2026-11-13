import { Link } from "react-router-dom";
import RecentActivity from "../../components/admin/RecentActivity";
import SalesChart from "../../components/admin/SalesChart";
import StatCard from "../../components/admin/StatCard";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import StatusBadge from "../../components/common/StatusBadge";
import ProductImage from "../../components/product/ProductImage";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { adminService } from "../../services/admin.service";
import { OrderStatus } from "../../types";
import { formatDate, formatLongDate, formatPrice, orderStatusLabels, orderStatusStyles, orderCode } from "../../utils/format";
import CatalogImport from "./CatalogImport";

const statusBarColors: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400",
  PAID: "bg-blue-500",
  PROCESSING: "bg-indigo-500",
  SHIPPED: "bg-cyan-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-slate-400",
};

export default function AdminDashboard() {
  const { can } = useAuth();
  const { data: stats, loading, error, reload } = useAsync(() => adminService.stats(), []);

  if (loading && !stats) return <Spinner />;
  if (error || !stats) return <Alert>{error ?? "Məlumat tapılmadı"}</Alert>;

  const statuses = Object.keys(orderStatusLabels) as OrderStatus[];
  const pending = stats.ordersByStatus.PENDING ?? 0;
  const maxCategory = Math.max(...stats.categories.map((category) => category.products), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">İcmal</h1>
          <p className="text-sm text-muted">{formatLongDate(new Date())}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline" onClick={reload} disabled={loading}>
            {loading ? "Yenilənir..." : "Yenilə"}
          </button>
          {can("products:write") && (
            <Link to="/admin/products/new" className="btn-primary">
              + Yeni məhsul
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gəlir" value={formatPrice(stats.revenue)} hint="Ödənilmiş və daha irəli statuslu sifarişlər" tone="green" />
        <StatCard
          label="Sifarişlər"
          value={stats.totalOrders}
          hint={pending > 0 ? `${pending} sifariş təsdiq gözləyir` : "Gözləyən sifariş yoxdur"}
          to="/admin/orders"
          tone="blue"
        />
        <StatCard label="Orta sifariş dəyəri" value={formatPrice(stats.averageOrderValue.toFixed(2))} hint={`${stats.userCount} istifadəçi`} tone="brand" />
        <StatCard
          label="Məhsullar"
          value={stats.productCount}
          hint={`${stats.lowStockCount} az stok · ${stats.inactiveCount} deaktiv`}
          to="/admin/inventory"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <SalesChart data={stats.salesByDay} />
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Sifariş statusları</h2>
          {statuses.map((status) => {
            const count = stats.ordersByStatus[status] ?? 0;
            const width = stats.totalOrders ? (count / stats.totalOrders) * 100 : 0;
            return (
              <Link key={status} to={`/admin/orders?status=${status}`} className="block space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${orderStatusStyles[status]}`}>{orderStatusLabels[status]}</span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-chip">
                  <div className={`h-full rounded-full ${statusBarColors[status]}`} style={{ width: `${width}%` }} />
                </div>
              </Link>
            );
          })}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Ən çox satılanlar</h2>
          {stats.topProducts.length ? (
            <ul className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <li key={product.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-semibold text-muted">{index + 1}</span>
                  <ProductImage src={product.images[0]} category={product.category?.slug} alt={product.name} className="size-10 rounded-lg bg-chip" />
                  <Link to={`/admin/products/${product.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-brand-600">
                    {product.name}
                  </Link>
                  <span className="text-xs font-semibold">{product.sold} əd.</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Hələ satış yoxdur.</p>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Az qalan stok</h2>
            <Link to="/admin/inventory?lowStock=true" className="link text-xs">
              Hamısı
            </Link>
          </div>
          {stats.lowStockProducts.length ? (
            <ul className="space-y-3">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-3">
                  <ProductImage src={product.images[0]} category={product.category?.slug} alt={product.name} className="size-10 rounded-lg bg-chip" />
                  <Link to={`/admin/products/${product.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-brand-600">
                    {product.name}
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${product.stock === 0 ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300" : "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300"}`}>
                    {product.stock}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Bütün məhsulların stoku kifayətdir.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Kateqoriyalar</h2>
          <ul className="space-y-3">
            {stats.categories.map((category) => (
              <li key={category.slug} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <Link to={`/products?category=${category.slug}`} className="hover:text-brand-600">
                    {category.name}
                  </Link>
                  <span className="font-semibold">{category.products}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-chip">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(category.products / maxCategory) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between border-b border-chip px-5 py-4">
          <h2 className="font-semibold">Son sifarişlər</h2>
          <Link to="/admin/orders" className="link text-xs">
            Hamısı
          </Link>
        </div>
        {stats.recentOrders.length ? (
          <table className="w-full min-w-[640px] text-sm">
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-chip last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 font-medium">{orderCode(order)}</td>
                  <td className="px-5 py-3">
                    <p>{order.user?.name ?? order.guestName ?? "Qonaq"}{!order.user && <span className="ml-1.5 rounded-full bg-chip px-1.5 py-0.5 text-[10px] font-medium text-muted">Qonaq</span>}</p>
                    <p className="text-xs text-muted">{order.user?.email ?? order.guestEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-muted">{`${order.items.reduce((sum, item) => sum + item.quantity, 0)} məhsul`}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3 font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-sm text-muted">Hələ sifariş yoxdur.</p>
        )}
      </section>

      {can("users:read") && <RecentActivity />}

      {can("catalog:import") && <CatalogImport onImported={reload} />}
    </div>
  );
}
