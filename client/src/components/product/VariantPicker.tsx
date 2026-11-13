import { ProductVariant } from "../../types";
import { formatPrice } from "../../utils/format";

interface Props {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function VariantPicker({ variants, selectedId, onSelect }: Props) {
  const prices = new Set(variants.map((variant) => variant.price));
  const showPrice = prices.size > 1;

  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm font-semibold text-ink">Variant seçin</legend>
      <div role="radiogroup" aria-label="Variant seçin" className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const active = variant.id === selectedId;
          const out = variant.stock <= 0;
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(variant.id)}
              className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] ${
                active ? "border-brand-600 bg-brand-50 font-semibold text-ink dark:bg-brand-500/10" : "border-line text-ink/80 hover:border-brand-500"
              } ${out ? "opacity-60" : ""}`}
            >
              {variant.colorHex && (
                <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ backgroundColor: variant.colorHex }} aria-hidden="true" />
              )}
              <span className={out ? "line-through" : ""}>{variant.name}</span>
              {showPrice && <span className="text-xs text-muted">{formatPrice(variant.price ?? "0")}</span>}
              {out && <span className="sr-only">Stokda yoxdur</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
