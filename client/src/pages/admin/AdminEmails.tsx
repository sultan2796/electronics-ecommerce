import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { adminService } from "../../services/admin.service";
import { EmailLogEntry, EmailStatus } from "../../types";
import { formatDate } from "../../utils/format";

const statuses: EmailStatus[] = ["SENT", "LOGGED", "FAILED"];

const statusLabels: Record<EmailStatus, string> = {
  SENT: "Göndərildi",
  LOGGED: "Konsola yazıldı",
  FAILED: "Xəta",
};

const statusStyles: Record<EmailStatus, string> = {
  SENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  LOGGED: "bg-chip text-ink/70",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const templateLabels: Record<string, string> = {
  welcome: "Xoş gəldiniz",
  "order-confirmation": "Sifariş təsdiqi",
  "payment-succeeded": "Ödəniş uğurlu",
  "order-processing": "Hazırlanır",
  "order-shipped": "Göndərildi",
  "order-delivered": "Çatdırıldı",
  "order-cancelled": "Ləğv edildi",
  "password-reset": "Şifrə bərpası",
  "password-changed": "Şifrə dəyişdi",
};

export default function AdminEmails() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const statusParam = params.get("status") as EmailStatus | null;
  const status = statusParam && statuses.includes(statusParam) ? statusParam : undefined;
  const page = Number(params.get("page")) || 1;
  const [search, setSearch] = useState(q);
  const [selected, setSelected] = useState<EmailLogEntry | null>(null);

  const emails = useAsync(() => adminService.emails({ q: q || undefined, status, page }), [q, status, page]);

  const setQuery = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => (value ? merged.set(key, value) : merged.delete(key)));
    setParams(merged);
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ q: search.trim(), page: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">E-poçt bildirişləri</h1>
          <p className="text-sm text-muted">Sistemin göndərdiyi bütün məktubların jurnalı</p>
        </div>
        <form onSubmit={onSearch} className="flex gap-2">
          <input className="input w-64" placeholder="Alıcı və ya mövzu" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-outline">Axtar</button>
        </form>
      </div>

      {emails.data?.mode === "console" && (
        <Alert variant="info">
          Test rejimi: məktublar real göndərilmir, server konsoluna yazılır və burada önizlənir. Real göndəriş üçün server/.env faylında
          EMAIL_PROVIDER=resend və RESEND_API_KEY təyin edin.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setQuery({ status: "", page: "" })}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${!status ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
        >
          Hamısı
        </button>
        {statuses.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setQuery({ status: value, page: "" })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${status === value ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
          >
            {statusLabels[value]}
          </button>
        ))}
      </div>

      {emails.loading && !emails.data ? (
        <Spinner />
      ) : emails.error ? (
        <Alert>{emails.error}</Alert>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr className="border-b border-chip">
                  <th className="px-4 py-3">Alıcı / mövzu</th>
                  <th className="px-4 py-3">Növ</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tarix</th>
                </tr>
              </thead>
              <tbody>
                {emails.data?.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">
                      Hələ məktub yoxdur
                    </td>
                  </tr>
                )}
                {emails.data?.items.map((email) => (
                  <tr
                    key={email.id}
                    onClick={() => setSelected(email)}
                    className={`cursor-pointer border-b border-chip last:border-0 transition hover:bg-chip/60 ${selected?.id === email.id ? "bg-chip" : ""}`}
                  >
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate font-medium">{email.to}</p>
                      <p className="truncate text-xs text-muted">{email.subject}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{templateLabels[email.template] ?? email.template}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[email.status]}`}>{statusLabels[email.status]}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDate(email.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card flex min-h-[420px] flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="border-b border-chip p-4 text-sm">
                  <p className="font-semibold">{selected.subject}</p>
                  <p className="text-xs text-muted">
                    {selected.to} · {selected.provider}
                  </p>
                  {selected.error && <p className="mt-2 text-xs text-red-600">{selected.error}</p>}
                </div>
                {selected.html ? (
                  <iframe title="E-poçt önizləməsi" sandbox="" srcDoc={selected.html} className="min-h-[520px] w-full flex-1 bg-white" />
                ) : (
                  <p className="p-6 text-sm text-muted">Real göndərilən məktubların məzmunu təhlükəsizlik üçün saxlanılmır.</p>
                )}
              </>
            ) : (
              <p className="m-auto p-6 text-sm text-muted">Önizləmə üçün soldan məktub seçin</p>
            )}
          </div>
        </div>
      )}
      {emails.data && (
        <Pagination page={emails.data.page} totalPages={emails.data.totalPages} onChange={(next) => setQuery({ page: String(next) })} />
      )}
    </div>
  );
}
