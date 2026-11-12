import { useState } from "react";
import { getErrorMessage } from "../../services/api";
import { BulkAction, extraService } from "../../services/extra.service";
import { Category } from "../../types";

const actions: { value: BulkAction; label: string; placeholder?: string }[] = [
  { value: "adjustPrice", label: "Qiyməti faizlə dəyiş", placeholder: "məs. -10 və ya 5" },
  { value: "setStock", label: "Stoku təyin et", placeholder: "məs. 25" },
  { value: "adjustStock", label: "Stoka əlavə et / çıx", placeholder: "məs. 10 və ya -3" },
  { value: "setCategory", label: "Kateqoriyanı dəyiş" },
  { value: "activate", label: "Aktivləşdir" },
  { value: "deactivate", label: "Satışdan çıxar" },
];

export default function BulkBar({ ids, categories, onDone, onClear }: { ids: string[]; categories: Category[]; onDone: (message: string) => void; onClear: () => void }) {
  const [action, setAction] = useState<BulkAction>("adjustPrice");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = actions.find((item) => item.value === action)!;
  const needsNumber = Boolean(current.placeholder);

  const apply = async () => {
    if (needsNumber && (value.trim() === "" || Number.isNaN(Number(value)))) return setError("Rəqəm daxil edin");
    if (action === "setCategory" && !value) return setError("Kateqoriya seçin");
    if (!window.confirm(`${ids.length} məhsula "${current.label}" tətbiq olunsun?`)) return;
    setBusy(true);
    setError(null);
    try {
      const result = await extraService.bulkProducts({ ids, action, value: needsNumber ? Number(value) : value || undefined });
      setValue("");
      onDone(`${result.updated} məhsul yeniləndi`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-20 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-brand-500/40 bg-surface p-3 shadow-lg">
      <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-sm font-semibold text-white">{ids.length} seçildi</span>
      <select
        className="input w-auto py-2"
        value={action}
        onChange={(e) => {
          setAction(e.target.value as BulkAction);
          setValue("");
          setError(null);
        }}
      >
        {actions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {needsNumber && <input className="input w-40 py-2" type="number" placeholder={current.placeholder} value={value} onChange={(e) => setValue(e.target.value)} />}
      {action === "setCategory" && (
        <select className="input w-auto py-2" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">Kateqoriya seçin</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      )}
      <button type="button" className="btn-primary py-2" disabled={busy} onClick={apply}>
        {busy ? "Tətbiq olunur..." : "Tətbiq et"}
      </button>
      <button type="button" className="btn-outline py-2" onClick={onClear}>
        Seçimi ləğv et
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
