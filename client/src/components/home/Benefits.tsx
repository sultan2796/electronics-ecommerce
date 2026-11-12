import { useI18n } from "../../context/I18nContext";
import { TranslationKey } from "../../i18n/dictionary";

const items: { title: TranslationKey; text: TranslationKey; icon: string }[] = [
  { title: "benefit.delivery", text: "benefit.deliveryText", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4" },
  { title: "benefit.warranty", text: "benefit.warrantyText", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" },
  { title: "benefit.payment", text: "benefit.paymentText", icon: "M3 6h18v12H3zM3 10h18M7 15h4" },
  { title: "benefit.return", text: "benefit.returnText", icon: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" },
];

export default function Benefits() {
  const { t } = useI18n();
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={item.icon} />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold leading-tight text-ink sm:text-sm">{t(item.title)}</span>
            <span className="block text-[11px] leading-tight text-muted sm:text-xs">{t(item.text)}</span>
          </span>
        </div>
      ))}
    </section>
  );
}
