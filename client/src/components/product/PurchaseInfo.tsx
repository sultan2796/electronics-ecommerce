import { Link } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { useStoreConfig } from "../../hooks/useStoreConfig";
import { useAsync } from "../../hooks/useAsync";
import { paymentService } from "../../services/payment.service";
import { Product } from "../../types";
import { formatPrice } from "../../utils/format";
import { translatePolicy } from "../../utils/productSpecs";

const Row = ({ icon, title, text }: { icon: string; title: string; text: string }) => (
  <li className="flex gap-3">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={icon} />
      </svg>
    </span>
    <span className="min-w-0 text-sm">
      <span className="block font-medium text-ink">{title}</span>
      <span className="block text-xs text-muted">{text}</span>
    </span>
  </li>
);

export default function PurchaseInfo({ product }: { product: Product }) {
  const { locale } = useI18n();
  const config = useStoreConfig();
  const payment = useAsync(() => paymentService.config().catch(() => null), []);
  const cardOnline = Boolean(payment.data?.methods.includes("CARD") && !payment.data?.testMode);
  const paymentText = payment.data
    ? cardOnline
      ? "Onlayn kartla və ya qapıda ödəniş. Kart məlumatları mağazada saxlanılmır."
      : "Qapıda ödəniş (nağd və ya kartla kuryerə)."
    : null;
  const extra = product.specs?.extra;
  const shippingTime = translatePolicy(extra?.shipping, locale);
  const returns = translatePolicy(extra?.returnPolicy, locale);
  const warranty = translatePolicy(extra?.warranty, locale);
  const deliveryCost = !config
    ? null
    : config.shippingFee <= 0
      ? "Bütün sifarişlərə pulsuz çatdırılma"
      : `${formatPrice(config.freeShippingMin)}-dan yuxarı pulsuz, aşağı sifarişlərə ${formatPrice(config.shippingFee)}`;
  const delivery = [shippingTime, deliveryCost].filter(Boolean).join(" · ");

  return (
    <section aria-label="Çatdırılma, qaytarma və zəmanət" className="rounded-2xl border border-line p-4">
      <ul className="space-y-3">
        {delivery && <Row icon="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4" title="Çatdırılma" text={delivery} />}
        {returns && <Row icon="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" title="Qaytarılma" text={returns} />}
        {warranty && <Row icon="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" title="Zəmanət" text={warranty} />}
        {paymentText && <Row icon="M3 6h18v12H3zM3 10h18M7 15h4" title="Ödəniş" text={paymentText} />}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
        Sualınız var?{" "}
        <Link to="/contact" className="font-medium text-brand-600">
          Bizimlə əlaqə saxlayın
        </Link>
      </p>
    </section>
  );
}
