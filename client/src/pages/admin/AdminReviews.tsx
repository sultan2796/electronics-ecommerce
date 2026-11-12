import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import StarRating from "../../components/product/StarRating";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { formatDate } from "../../utils/format";

const ratingFilters = [5, 4, 3, 2, 1];

export default function AdminReviews() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const ratingParam = Number(params.get("rating"));
  const rating = ratingFilters.includes(ratingParam) ? ratingParam : undefined;
  const page = Number(params.get("page")) || 1;
  const [search, setSearch] = useState(q);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reviews = useAsync(() => adminService.reviews({ q: q || undefined, rating, page }), [q, rating, page]);

  const setQuery = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => (value ? merged.set(key, value) : merged.delete(key)));
    setParams(merged);
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ q: search.trim(), page: "" });
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu rəy silinsin? Məhsulun reytinqi yenidən hesablanacaq.")) return;
    setBusyId(id);
    setError(null);
    try {
      await adminService.deleteReview(id);
      reviews.setData((current) =>
        current ? { ...current, total: current.total - 1, items: current.items.filter((item) => item.id !== id) } : current,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rəylər</h1>
          <p className="text-sm text-muted">Cəmi {reviews.data?.total ?? 0} rəy · yalnız alış etmiş müştərilər yaza bilər</p>
        </div>
        <form onSubmit={onSearch} className="flex gap-2">
          <input className="input w-64" placeholder="Məhsul, mətn və ya e-poçt" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-outline">Axtar</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setQuery({ rating: "", page: "" })}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${!rating ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
        >
          Hamısı
        </button>
        {ratingFilters.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setQuery({ rating: String(value), page: "" })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${rating === value ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
          >
            {value} ★
          </button>
        ))}
      </div>

      {error && <Alert>{error}</Alert>}

      {reviews.loading && !reviews.data ? (
        <Spinner />
      ) : reviews.error ? (
        <Alert>{reviews.error}</Alert>
      ) : reviews.data && reviews.data.items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">Rəy tapılmadı</div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.data?.items.map((review) => (
              <article key={review.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/products/${review.product.slug}`} className="block truncate font-semibold hover:text-brand-600">
                      {review.product.name}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {review.user.name} · {review.user.email}
                    </p>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.title && <p className="text-sm font-semibold">{review.title}</p>}
                <p className="line-clamp-4 whitespace-pre-line text-sm text-ink/80">{review.comment}</p>
                <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
                  <span>{formatDate(review.createdAt)}</span>
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => remove(review.id)}
                    className="font-medium text-red-600 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </article>
            ))}
          </div>
          {reviews.data && (
            <Pagination page={reviews.data.page} totalPages={reviews.data.totalPages} onChange={(next) => setQuery({ page: String(next) })} />
          )}
        </>
      )}
    </div>
  );
}
