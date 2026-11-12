import { useState } from "react";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import { roleLabels } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { extraService } from "../../services/extra.service";
import { formatDate } from "../../utils/format";

const entities = ["", "Product", "Order", "User", "Category", "Coupon", "Campaign"];
const entityLabels: Record<string, string> = {
  "": "Hamısı",
  Product: "Məhsul",
  Order: "Sifariş",
  User: "İstifadəçi",
  Category: "Kateqoriya",
  Coupon: "Promo kod",
  Campaign: "Kampaniya",
};

const actionLabels: Record<string, string> = {
  "order.status": "Sifariş statusu dəyişdi",
  "product.stock": "Stok yeniləndi",
  "product.create": "Məhsul yaradıldı",
  "product.update": "Məhsul redaktə edildi",
  "product.deactivate": "Məhsul deaktiv edildi",
  "category.create": "Kateqoriya yaradıldı",
  "category.update": "Kateqoriya redaktə edildi",
  "category.delete": "Kateqoriya silindi",
  "coupon.create": "Promo kod yaradıldı",
  "coupon.update": "Promo kod dəyişdi",
  "coupon.delete": "Promo kod silindi",
  "campaign.create": "Kampaniya yaradıldı",
  "campaign.update": "Kampaniya dəyişdi",
  "campaign.delete": "Kampaniya silindi",
  "user.update": "İstifadəçi dəyişdi",
};

const describe = (action: string) => actionLabels[action] ?? (action.startsWith("product.bulk.") ? "Toplu məhsul əməliyyatı" : action);

const summary = (details: Record<string, unknown> | null) => {
  if (!details) return "";
  return Object.entries(details)
    .filter(([key]) => !["specs", "description", "images", "password"].includes(key))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? `${value.length} ədəd` : typeof value === "object" ? "…" : String(value)}`)
    .join(" · ")
    .slice(0, 160);
};

export default function AdminAudit() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const logs = useAsync(() => extraService.audit({ entity: entity || undefined, page }), [entity, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Əməliyyat jurnalı</h1>
        <p className="text-sm text-muted">Hansı işçi nəyi və nə vaxt dəyişib</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {entities.map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => {
              setEntity(value);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${entity === value ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
          >
            {entityLabels[value]}
          </button>
        ))}
      </div>
      {logs.loading && !logs.data ? (
        <Spinner />
      ) : logs.error ? (
        <Alert>{logs.error}</Alert>
      ) : (
        <>
          <div className="card divide-y divide-chip">
            {logs.data?.items.length === 0 && <p className="p-8 text-center text-sm text-muted">Qeyd yoxdur</p>}
            {logs.data?.items.map((log) => (
              <div key={log.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{describe(log.action)}</p>
                  <p className="truncate text-xs text-muted">{summary(log.details)}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-medium">{log.user?.name ?? "Sistem"}</p>
                  <p className="text-muted">
                    {log.user ? roleLabels[log.user.role] : ""} · {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {logs.data && <Pagination page={logs.data.page} totalPages={logs.data.totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
