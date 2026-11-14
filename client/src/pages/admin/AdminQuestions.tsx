import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import { confirmDialog } from "../../components/common/Overlays";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { AdminQuestion, adminService } from "../../services/admin.service";
import { getErrorMessage } from "../../services/api";
import { formatDate } from "../../utils/format";

type Status = "open" | "answered" | "all";
const tabs: { value: Status; label: string }[] = [
  { value: "open", label: "Cavab gözləyir" },
  { value: "answered", label: "Cavablanıb" },
  { value: "all", label: "Hamısı" },
];

function QuestionRow({ item, onChanged }: { item: AdminQuestion; onChanged: () => void }) {
  const [answer, setAnswer] = useState(item.answer ?? "");
  const [editing, setEditing] = useState(!item.answer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="space-y-3 border-b border-chip p-4 last:border-0 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/products/${item.product.slug}`} className="text-xs font-medium text-brand-600 hover:underline">
            {item.product.name}
          </Link>
          <p className="mt-1 whitespace-pre-line break-words text-sm font-medium">{item.question}</p>
          <p className="mt-0.5 text-[11px] text-muted">{`${item.user.name} · ${item.user.email} · ${formatDate(item.createdAt)}`}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {!item.isPublished && <span className="rounded-full bg-chip px-2 py-0.5 text-muted">Gizlədilib</span>}
          <button type="button" className="text-brand-600 disabled:opacity-50" disabled={busy} onClick={() => void run(() => adminService.updateQuestion(item.id, { isPublished: !item.isPublished }))}>
            {item.isPublished ? "Gizlət" : "Göstər"}
          </button>
          <button
            type="button"
            className="text-red-600 disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              if (await confirmDialog("Sual silinsin?", { confirmLabel: "Sil" })) await run(() => adminService.deleteQuestion(item.id));
            }}
          >
            Sil
          </button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea className="input min-h-[80px]" placeholder="Cavabınızı yazın" maxLength={2000} value={answer} onChange={(event) => setAnswer(event.target.value)} />
          <div className="flex gap-2">
            <button type="button" className="btn-primary btn-sm" disabled={busy || answer.trim().length < 2} onClick={() => void run(() => adminService.updateQuestion(item.id, { answer: answer.trim() }))}>
              {busy ? "Saxlanılır..." : item.answer ? "Cavabı yenilə" : "Cavabla"}
            </button>
            {item.answer && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>
                Ləğv et
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-chip/60 p-3 text-sm">
          <p className="whitespace-pre-line break-words">{item.answer}</p>
          <p className="mt-1 text-[11px] text-muted">
            {`${item.answeredBy?.name ?? "Mağaza"} · ${item.answeredAt ? formatDate(item.answeredAt) : ""}`}
            <button type="button" className="ml-2 text-brand-600" onClick={() => setEditing(true)}>
              Redaktə
            </button>
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

export default function AdminQuestions() {
  const [status, setStatus] = useState<Status>("open");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const questions = useAsync(() => adminService.questions({ status, page }), [status, page, version]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suallar</h1>
        <p className="text-sm text-muted">Müştərilərin məhsul səhifəsində verdiyi suallar. Cavablanmış suallar məhsul səhifəsində görünür.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setPage(1);
              setStatus(tab.value);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${status === tab.value ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
          >
            {tab.value === "open" && questions.data ? `${tab.label} (${questions.data.openCount})` : tab.label}
          </button>
        ))}
      </div>
      {questions.loading && !questions.data ? (
        <Spinner />
      ) : questions.error ? (
        <Alert>{questions.error}</Alert>
      ) : questions.data?.items.length ? (
        <ul className="card">
          {questions.data.items.map((item) => (
            <QuestionRow key={`${item.id}-${item.updatedAt}`} item={item} onChanged={() => setVersion((value) => value + 1)} />
          ))}
        </ul>
      ) : (
        <p className="card p-6 text-sm text-muted">{status === "open" ? "Cavab gözləyən sual yoxdur." : "Sual yoxdur."}</p>
      )}
      {questions.data && questions.data.totalPages > 1 && <Pagination page={page} totalPages={questions.data.totalPages} onChange={setPage} />}
    </div>
  );
}
