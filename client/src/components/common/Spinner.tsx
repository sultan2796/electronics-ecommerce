export default function Spinner({ label = "Yüklənir..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
