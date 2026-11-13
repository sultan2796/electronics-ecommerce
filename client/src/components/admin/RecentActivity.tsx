import { Link } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync";
import { extraService } from "../../services/extra.service";
import { describeAudit } from "../../utils/audit";
import { formatDate } from "../../utils/format";

export default function RecentActivity() {
  const log = useAsync(() => extraService.audit({ page: 1 }), []);
  const items = log.data?.items.slice(0, 6) ?? [];
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-chip px-5 py-4">
        <h2 className="font-semibold">Son fəaliyyətlər</h2>
        <Link to="/admin/audit" className="link text-xs">
          Hamısı
        </Link>
      </div>
      {log.loading && !log.data ? (
        <div className="space-y-3 p-5" aria-hidden="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-10 animate-pulse rounded-xl bg-chip" />
          ))}
        </div>
      ) : log.error ? (
        <p className="px-5 py-6 text-sm text-muted">Fəaliyyətlər yüklənmədi.</p>
      ) : items.length ? (
        <ol className="divide-y divide-chip">
          {items.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chip text-xs font-semibold text-ink/70">
                {(entry.user?.name ?? "S").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{describeAudit(entry.action)}</span>
                <span className="block truncate text-xs text-muted">{entry.user?.name ?? "Sistem"}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{formatDate(entry.createdAt)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 py-6 text-sm text-muted">Hələ fəaliyyət qeydə alınmayıb.</p>
      )}
    </section>
  );
}
