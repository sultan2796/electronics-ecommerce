import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { paymentService } from "../services/payment.service";
import { formatPrice } from "../utils/format";

export default function PaymentMock() {
  const [params] = useSearchParams();
  const reference = params.get("ref") ?? "";
  const navigate = useNavigate();
  const payment = useAsync(() => paymentService.mock(reference), [reference]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = async (outcome: "succeeded" | "failed") => {
    setBusy(true);
    setError(null);
    try {
      const { orderId } = await paymentService.completeMock(reference, outcome);
      navigate(`/payment/result?order=${orderId}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  if (payment.loading) return <Spinner />;
  if (payment.error || !payment.data) return <Alert>{payment.error ?? "Ödəniş tapılmadı"}</Alert>;

  const done = payment.data.status !== "PENDING";

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        <strong>Test ödəniş səhifəsi.</strong> Real pul çəkilmir və kart məlumatı soruşulmur. Real bankın ödəniş səhifəsi Epoint qoşulandan sonra
        burada görünəcək.
      </div>
      <section className="card space-y-5 p-6 text-center">
        <p className="text-sm text-muted">Ödəniləcək məbləğ</p>
        <p className="text-4xl font-bold text-brand-600">{formatPrice(payment.data.amount)}</p>
        <p className="text-xs text-muted">Sifariş #{payment.data.orderId.slice(-8).toUpperCase()} · {payment.data.reference}</p>
        {error && <Alert>{error}</Alert>}
        {done ? (
          <Link to={`/payment/result?order=${payment.data.orderId}`} className="btn-primary w-full">
            Nəticəyə bax
          </Link>
        ) : (
          <div className="space-y-3">
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => complete("succeeded")}>
              Uğurlu ödənişi simulyasiya et
            </button>
            <button type="button" className="btn-outline w-full" disabled={busy} onClick={() => complete("failed")}>
              Uğursuz ödənişi simulyasiya et
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
