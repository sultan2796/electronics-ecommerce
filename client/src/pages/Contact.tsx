import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL, WHATSAPP_URL } from "../config/contact";
import { useSeo } from "../hooks/useSeo";

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0a12 12 0 0 0-10.3 18.1L0 24l6-1.6A12 12 0 1 0 12 0z" />
  </svg>
);

export default function Contact() {
  useSeo({ title: "Əlaqə", description: `ElectroShop ilə əlaqə: ${CONTACT_PHONE_DISPLAY}` });
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Bizimlə əlaqə</h1>
        <p className="mt-2 text-muted">Sifariş, çatdırılma və məhsullarla bağlı suallarınız üçün bizə zəng edin və ya WhatsApp-da yazın.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <a href={`tel:${CONTACT_PHONE_TEL}`} className="card group flex flex-col items-center gap-3 p-8 text-center transition hover:-translate-y-0.5 hover:shadow-lg">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15">
            <PhoneIcon />
          </span>
          <span className="text-sm text-muted">Telefon</span>
          <span className="text-xl font-bold text-ink">{CONTACT_PHONE_DISPLAY}</span>
          <span className="text-sm font-semibold text-brand-600">Zəng et</span>
        </a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="card group flex flex-col items-center gap-3 p-8 text-center transition hover:-translate-y-0.5 hover:shadow-lg">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#25d366]/10 text-[#1da851] transition group-hover:bg-[#25d366] group-hover:text-white">
            <WhatsAppIcon />
          </span>
          <span className="text-sm text-muted">WhatsApp</span>
          <span className="text-xl font-bold text-ink">{CONTACT_PHONE_DISPLAY}</span>
          <span className="text-sm font-semibold text-[#1da851]">WhatsApp ilə yazın</span>
        </a>
      </div>
      <p className="text-center text-sm text-muted">Bakı, Azərbaycan</p>
    </div>
  );
}
