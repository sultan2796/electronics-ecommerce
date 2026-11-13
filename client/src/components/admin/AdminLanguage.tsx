import { useI18n } from "../../context/I18nContext";

const options = [
  { code: "az", label: "AZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
] as const;

export default function AdminLanguage() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="hidden overflow-hidden rounded-full border border-line p-0.5 sm:flex" role="group" aria-label="Dil">
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLocale(option.code)}
          aria-pressed={locale === option.code}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${locale === option.code ? "bg-ink text-surface" : "text-muted hover:text-ink"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
