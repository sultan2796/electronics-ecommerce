import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import { getErrorMessage } from "../services/api";
import { orderService } from "../services/order.service";
import { goToPayment, OrderPaymentStatus, paymentService } from "../services/payment.service";
import { formatPrice } from "../utils/format";

const MAX_ATTEMPTS = 8;

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get("order") ?? "";
  const navigate = useNavigate();
  const [status, setStatus] = useState<OrderPaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const poll = async (attempt: number) => {
      try {
        const result = await paymentService.status(orderId);
        if (!active) return;
        setStatus(result);
        setAttempts(attempt);
        if (result.paymentStatus === "PENDING" && result.status === "PENDING" && attempt < MAX_ATTEMPTS) {
          timer = window.setTimeout(() => poll(attempt + 1), 2000);
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      }
    };
    poll(1);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [orderId]);

  const retry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const { redirectUrl } = await orderService.pay(orderId);
      goToPayment(redirectUrl, navigate);
    } catch (err) {
      setError(getErrorMessage(err));
      setRetrying(false);
    }
  };

  if (error && !status) return <Alert>{error}</Alert>;
  if (!status) return <Spinner label="Ödəniş yoxlanılır..." />;

  const stillPending = status.paymentStatus === "PENDING" && status.status === "PENDING";
  const failed = status.paymentStatus === "FAILED" && status.status === "PENDING";
  const cancelled = status.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-md">
      <section className="card space-y-5 p-8 text-center">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full text-3xl ${
            status.paid
              ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              : failed || cancelled
                ? "bg-red-100 dark:bg-red-500/15 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                : "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          }`}
          aria-hidden
        >
          {status.paid ? "✓" : failed || cancelled ? "!" : "…"}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            {status.paid ? "Ödəniş uğurla tamamlandı" : cancelled ? "Sifariş ləğv edilib" : failed ? "Ödəniş alınmadı" : "Ödəniş gözlənilir"}
          </h1>
          <p className="text-sm text-muted">
            Sifariş #{status.id.slice(-8).toUpperCase()} · {formatPrice(status.total)}
          </p>
        </div>
        {stillPending && attempts >= MAX_ATTEMPTS && (
          <p className="text-sm text-muted">Bankdan cavab hələ gəlməyib. Bir neçə dəqiqə sonra sifariş səhifəsini yeniləyin.</p>
        )}
        {error && <Alert>{error}</Alert>}
        <div className="space-y-3">
          {failed && (
            <button type="button" className="btn-primary w-full" disabled={retrying} onClick={retry}>
              {retrying ? "Yönləndirilir..." : "Yenidən ödə"}
            </button>
          )}
          <Link to={`/orders/${status.id}`} className={failed ? "btn-outline w-full" : "btn-primary w-full"}>
            Sifarişə bax
          </Link>
          <Link to="/products" className="block text-sm text-brand-600 hover:underline">
            Alış-verişə davam et
          </Link>
        </div>
      </section>
    </div>
  );
}
