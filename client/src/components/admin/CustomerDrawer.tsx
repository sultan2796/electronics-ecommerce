import { useEffect } from "react";
import { Link } from "react-router-dom";
import Alert from "../common/Alert";
import Spinner from "../common/Spinner";
import StatusBadge from "../common/StatusBadge";
import { roleLabels } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { adminService } from "../../services/admin.service";
import { formatDate, formatPrice, orderCode } from "../../utils/format";

export default function CustomerDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const detail = useAsync(() => adminService.user(userId), [userId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const user = detail.data;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose} role="presentation">
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Müştəri məlumatları"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">Müştəri məlumatları</h2>
          <button className="btn-outline px-3 py-1 text-sm" onClick={onClose}>
            Bağla
          </button>
        </div>
        {detail.loading ? (
          <Spinner />
        ) : detail.error || !user ? (
          <Alert>{detail.error ?? "İstifadəçi tapılmadı"}</Alert>
        ) : (
          <div className="space-y-6 text-sm">
            <section className="space-y-1">
              <p className="text-base font-semibold">{user.name}</p>
              <p className="text-muted">{user.email}</p>
              <p className="text-muted">
                {roleLabels[user.role]} · Qeydiyyat: {formatDate(user.createdAt)}
              </p>
              <p className="text-muted">Son giriş: {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}</p>
              {user.isBlocked && <p className="font-medium text-red-600">Hesab bloklanıb</p>}
            </section>

            <section className="grid grid-cols-2 gap-3">
              {[
                ["Sifariş", String(user._count.orders)],
                ["Ümumi xərc", formatPrice(user.totalSpent)],
                ["Rəy", String(user._count.reviews)],
                ["Bonus xal", String(user.points)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line p-3">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="text-base font-semibold">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Ünvanlar</h3>
              {user.addresses.length ? (
                <ul className="space-y-2">
                  {user.addresses.map((address) => (
                    <li key={address.id} className="rounded-xl border border-line p-3">
                      <p className="font-medium">{address.fullName}</p>
                      <p className="text-muted">
                        {address.city}, {address.line1}
                      </p>
                      <a className="text-brand-600" href={`tel:${address.phone}`}>
                        {address.phone}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Yadda saxlanmış ünvan yoxdur.</p>
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Son sifarişlər</h3>
                {user.orders.length > 0 && (
                  <Link to={`/admin/orders?userId=${user.id}`} className="text-brand-600" onClick={onClose}>
                    Hamısı →
                  </Link>
                )}
              </div>
              {user.orders.length ? (
                <ul className="divide-y divide-chip">
                  {user.orders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-medium">{orderCode(order)}</p>
                        <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatPrice(order.total)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Hələ sifariş yoxdur.</p>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
