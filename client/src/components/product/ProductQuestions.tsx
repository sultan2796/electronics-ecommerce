import { MessageCircleQuestion } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { reviewService } from "../../services/review.service";
import { formatDate } from "../../utils/format";
import Alert from "../common/Alert";
import Spinner from "../common/Spinner";

export default function ProductQuestions({ productId, productSlug }: { productId: string; productSlug: string }) {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const questions = useAsync(() => reviewService.questions(productId), [productId, version, user?.id]);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await reviewService.ask(productId, text.trim());
      setText("");
      setOpen(false);
      setNotice("Sualınız göndərildi. Cavab veriləndə burada görünəcək.");
      setVersion((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await reviewService.removeQuestion(id);
      setVersion((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const items = questions.data ?? [];

  return (
    <section className="mt-6 rounded-[20px] bg-surface p-5 shadow-tile lg:p-8" aria-labelledby="questions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="questions-title" className="text-lg font-semibold">Suallar və cavablar</h2>
          <p className="text-sm text-muted">Məhsul haqqında sualınızı verin, mağaza komandası cavablandırsın.</p>
        </div>
        {user ? (
          !open && (
            <button type="button" className="btn-outline btn-sm" onClick={() => setOpen(true)}>
              <MessageCircleQuestion className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Sual ver
            </button>
          )
        ) : (
          <Link to="/login" state={{ from: `/products/${productSlug}` }} className="btn-outline btn-sm">
            Sual vermək üçün daxil olun
          </Link>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {notice && <Alert variant="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}
        {open && (
          <form onSubmit={submit} className="space-y-2 rounded-2xl border border-line p-4">
            <textarea
              className="input min-h-[90px]"
              placeholder="Məsələn: bu model hansı şarj adapteri ilə gəlir?"
              required
              minLength={10}
              maxLength={500}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted">{`${text.length}/500`}</span>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
                  Ləğv et
                </button>
                <button type="submit" className="btn-primary btn-sm" disabled={sending || text.trim().length < 10}>
                  {sending ? "Göndərilir..." : "Göndər"}
                </button>
              </div>
            </div>
          </form>
        )}

        {questions.loading && !questions.data ? (
          <Spinner />
        ) : items.length === 0 ? (
          <p className="rounded-2xl bg-chip/60 p-5 text-center text-sm text-muted">Hələ cavablanmış sual yoxdur.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="space-y-2 py-4 first:pt-1">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-chip text-[11px] font-bold">S</span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line break-words text-sm font-medium text-ink">{item.question}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {`${item.author} · ${formatDate(item.createdAt)}`}
                      {item.userId === user?.id && !item.answer && (
                        <button type="button" className="ml-2 text-red-600" onClick={() => void remove(item.id)}>
                          Sil
                        </button>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">C</span>
                  {item.answer ? (
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-line break-words text-sm text-ink/85">{item.answer}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{`Mağaza · ${item.answeredAt ? formatDate(item.answeredAt) : ""}`}</p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted">Cavab gözləyir. Yalnız siz görürsünüz.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
