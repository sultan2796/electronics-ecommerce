import { useTheme } from "../../context/ThemeContext";

const labels = {
  light: "İşıqlı rejim",
  dark: "Qaranlıq rejim",
  system: "Sistem ayarı",
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { preference, cycle } = useTheme();
  const label = `${labels[preference]} (dəyişmək üçün basın)`;
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-full border border-line text-ink/80 transition hover:border-brand-500 hover:text-brand-600 ${className}`}
    >
      {preference === "light" ? <SunIcon /> : preference === "dark" ? <MoonIcon /> : <SystemIcon />}
    </button>
  );
}
