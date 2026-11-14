import { confirmDialog } from "../common/Overlays";
import Select from "../common/Select";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { reviewService } from "../../services/review.service";
import { MyReviewStatus, ReviewSort } from "../../types";
import { formatDate } from "../../utils/format";
import { ratingPercent } from "../../utils/rating";
import Alert from "../common/Alert";
import Pagination from "../common/Pagination";
import Spinner from "../common/Spinner";
import StarRating from "./StarRating";

const sortLabels: Record<ReviewSort, string> = {
  newest: "Ən yeni",
  highest: "Ən yüksək",
  lowest: "Ən aşağı",
};

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  onSummaryChange?: (average: number | null, count: number) => void;
}

export default function ReviewSection({ productId, productSlug, onSummaryChange }: ReviewSectionProps) {
  const { user, can } = useAuth();
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [page, setPage] = useState(1);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [mine, setMine] = useState<MyReviewStatus | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reviews = useAsync(
    () => reviewService.list(productId, { sort, page, rating: starFilter ?? undefined }),
    [productId, sort, page, version, starFilter],
  );

  useEffect(() => {
    if (!user) {
      setMine(null);
      return;
    }
    reviewService
      .mine(productId)
      .then((status) => {
        setMine(status);
        if (status.review) {
          setRating(status.review.rating);
          setTitle(status.review.title ?? "");
          setComment(status.review.comment);
        }
      })
      .catch(() => setMine(null));
  }, [productId, user, version]);

  useEffect(() => {
    if (reviews.data) onSummaryChange?.(reviews.data.summary.average, reviews.data.summary.count);
  }, [reviews.data, onSummaryChange]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (rating < 1) {
      setError("Ulduz sayını seçin");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await reviewService.save(productId, { rating, title: title.trim() || undefined, comment: comment.trim() });
      setNotice(mine?.review ? "Rəyiniz yeniləndi" : "Rəyiniz üçün təşəkkürlər!");
      setEditing(false);
      setVersion((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!(await confirmDialog("Rəy silinsin?", { description: "Bu əməliyyatı geri qaytarmaq olmaz.", confirmLabel: "Sil" }))) return;
    try {
      await reviewService.remove(id);
      if (mine?.review?.id === id) {
        setRating(0);
        setTitle("");
        setComment("");
      }
      setNotice("Rəy silindi");
      setVersion((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const summary = reviews.data?.summary;
  const showForm = Boolean(mine?.canReview && (!mine.review || editing));

  return (
    <section id="reviews" className="mt-10 rounded-[20px] bg-surface p-5 shadow-tile lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Müştəri rəyləri</h2>
        {summary && summary.count > 1 && (
          <Select
            className="w-40"
            size="sm"
            ariaLabel="Rəyləri sırala"
            value={sort}
            onChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            options={(Object.keys(sortLabels) as ReviewSort[]).map((key) => ({ value: key, label: sortLabels[key] }))}
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <p className="text-4xl font-bold text-ink">{summary?.average?.toFixed(1) ?? "—"}</p>
            <div>
              <StarRating value={summary?.average ?? 0} />
              <p className="mt-1 text-xs text-muted">{summary?.count ?? 0} rəy əsasında</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary?.distribution[star] ?? 0;
              const percent = ratingPercent(count, summary?.count ?? 0);
              return (
                <li key={star}>
                  <button
                    type="button"
                    disabled={count === 0}
                    aria-pressed={starFilter === star}
                    aria-label={`${star} ulduzlu rəyləri göstər (${count})`}
                    onClick={() => {
                      setStarFilter((current) => (current === star ? null : star));
                      setPage(1);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-0.5 text-xs transition enabled:hover:bg-chip disabled:cursor-default disabled:opacity-50 ${
                      starFilter === star ? "bg-amber-50 font-semibold text-ink ring-1 ring-amber-300 dark:bg-amber-500/10" : "text-muted"
                    }`}
                  >
                    <span className="w-3 text-right">{star}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-chip">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="w-8 text-right">{percent}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {starFilter && (
            <button type="button" className="text-xs font-medium text-brand-600" onClick={() => setStarFilter(null)}>
              {`Yalnız ${starFilter} ulduzlu rəylər · filtri sıfırla`}
            </button>
          )}

          {!user && (
            <p className="text-xs text-muted">
              Rəy yazmaq üçün{" "}
              <Link to="/login" state={{ from: `/products/${productSlug}` }} className="font-medium text-brand-600">
                daxil olun
              </Link>
              .
            </p>
          )}
          {user && mine && !mine.canReview && (
            <p className="rounded-xl bg-chip px-3 py-2 text-xs text-muted">Rəyi yalnız bu məhsulu almış müştərilər yaza bilər.</p>
          )}
          {user && mine?.review && !editing && (
            <div className="rounded-xl border border-line p-3 text-xs">
              <p className="font-medium text-ink">Sizin rəyiniz</p>
              <StarRating value={mine.review.rating} size="sm" />
              <div className="mt-2 flex gap-3">
                <button type="button" className="font-medium text-brand-600" onClick={() => setEditing(true)}>
                  Redaktə et
                </button>
                <button type="button" className="font-medium text-red-600" onClick={() => remove(mine.review!.id)}>
                  Sil
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {notice && <Alert variant="success">{notice}</Alert>}
          {showForm && (
            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line p-4">
              <p className="text-sm font-semibold text-ink">{mine?.review ? "Rəyi redaktə edin" : "Rəy yazın"}</p>
              {error && <Alert>{error}</Alert>}
              <StarRating value={rating} size="lg" onChange={setRating} />
              <input className="input" placeholder="Başlıq (istəyə bağlı)" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea
                className="input min-h-[110px]"
                placeholder="Məhsul haqqında təcrübənizi bölüşün (ən az 10 simvol)"
                required
                minLength={10}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn-primary" disabled={saving}>
                  {saving ? "Göndərilir..." : mine?.review ? "Yadda saxla" : "Rəyi göndər"}
                </button>
                {editing && (
                  <button type="button" className="btn-outline" onClick={() => setEditing(false)}>
                    Ləğv et
                  </button>
                )}
              </div>
            </form>
          )}

          {reviews.loading && !reviews.data ? (
            <Spinner />
          ) : reviews.error ? (
            <Alert>{reviews.error}</Alert>
          ) : reviews.data && reviews.data.items.length === 0 ? (
            <p className="rounded-2xl bg-chip/60 p-6 text-center text-sm text-muted">Hələ rəy yoxdur. İlk rəyi siz yazın!</p>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.data?.items.map((review) => (
                <li key={review.id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-500">
                        {(review.author || "?").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {review.author} {review.userId === user?.id && <span className="text-xs text-muted">(siz)</span>}
                        </p>
                        <p className="text-[11px] text-muted">{formatDate(review.createdAt)} · Təsdiqlənmiş alış</p>
                      </div>
                    </div>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  {review.title && <p className="mt-3 text-sm font-semibold text-ink">{review.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/80">{review.comment}</p>
                  {(review.userId === user?.id || can("reviews:moderate")) && (
                    <button type="button" className="mt-2 text-xs font-medium text-red-600" onClick={() => remove(review.id)}>
                      Sil
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {reviews.data && <Pagination page={reviews.data.page} totalPages={reviews.data.totalPages} onChange={setPage} />}
        </div>
      </div>
    </section>
  );
}
