import { useLocation } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";

const number = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export default function WhatsAppButton() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  if (!number) return null;
  const text = encodeURIComponent(`Salam! ${window.location.origin}${pathname} haqqında sualım var.`);
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("chat.whatsapp")}
      title={t("chat.whatsapp")}
      className="fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/20 transition hover:scale-105 md:bottom-6 md:right-6"
    >
      <svg viewBox="0 0 24 24" className="size-7 fill-current" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0a12 12 0 0 0-10.3 18.1L0 24l6-1.6A12 12 0 1 0 12 0z" />
      </svg>
    </a>
  );
}
