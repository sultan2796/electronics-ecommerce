export default function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="rgb(var(--brand-600))" />
      <path
        fill="#fff"
        d="M9 8.5c0-.8.7-1.5 1.5-1.5h11.25a1.5 1.5 0 0 1 0 3H12.5v4.5h7a1.5 1.5 0 0 1 0 3h-7V22h9.25a1.5 1.5 0 0 1 0 3H10.5A1.5 1.5 0 0 1 9 23.5z"
      />
      <circle cx="24" cy="16" r="2" fill="#FFD2BF" />
    </svg>
  );
}
