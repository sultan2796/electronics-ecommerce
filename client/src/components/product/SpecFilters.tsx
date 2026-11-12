import { FormEvent, useEffect, useState } from "react";
import { Category, Facets, ProductFilters } from "../../types";
import { countActiveFilters, emptyFilters } from "../../utils/filters";
import { formatStorage } from "../../utils/format";

interface SpecFiltersProps {
  facets: Facets | null;
  categories: Category[];
  filters: ProductFilters;
  onChange: (patch: Partial<ProductFilters>) => void;
}

function ToggleGroup({
  title,
  options,
  selected,
  format = (value) => value,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  format?: (value: string) => string;
  onChange: (values: string[]) => void;
}) {
  if (!options.length) return null;
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={`chip ${active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink/70 hover:border-brand-500"}`}
            >
              {format(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function RangeInputs({
  title,
  min,
  max,
  placeholderMin,
  placeholderMax,
  step = "1",
  onApply,
}: {
  title: string;
  min: string;
  max: string;
  placeholderMin: string;
  placeholderMax: string;
  step?: string;
  onApply: (min: string, max: string) => void;
}) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);

  useEffect(() => {
    setLocalMin(min);
    setLocalMax(max);
  }, [min, max]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply(localMin, localMax);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="flex items-center gap-2">
        <input className="input" type="number" min="0" step={step} placeholder={placeholderMin} value={localMin} onChange={(e) => setLocalMin(e.target.value)} />
        <span className="text-muted">–</span>
        <input className="input" type="number" min="0" step={step} placeholder={placeholderMax} value={localMax} onChange={(e) => setLocalMax(e.target.value)} />
        <button type="submit" className="btn-outline px-3">
          OK
        </button>
      </div>
    </form>
  );
}

export default function SpecFilters({ facets, categories, filters, onChange }: SpecFiltersProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <aside className="card space-y-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filtrlər {activeCount > 0 && <span className="text-brand-600">({activeCount})</span>}</h2>
        {activeCount > 0 && (
          <button
            className="text-sm text-brand-600 hover:underline"
            onClick={() => onChange({ ...emptyFilters, q: filters.q, category: filters.category, sort: filters.sort })}
          >
            Sıfırla
          </button>
        )}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-ink">Kateqoriya</span>
        <select className="input" value={filters.category} onChange={(e) => onChange({ ...emptyFilters, q: filters.q, sort: filters.sort, category: e.target.value })}>
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => onChange({ inStock: e.target.checked })} />
        Yalnız stokda olanlar
      </label>

      <RangeInputs
        title="Qiymət (AZN)"
        min={filters.minPrice}
        max={filters.maxPrice}
        placeholderMin={facets ? String(Math.floor(facets.price.min)) : "Min"}
        placeholderMax={facets ? String(Math.ceil(facets.price.max)) : "Max"}
        onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
      />

      <ToggleGroup title="Brend" options={facets?.brands ?? []} selected={filters.brand} onChange={(brand) => onChange({ brand })} />
      <ToggleGroup
        title="Operativ yaddaş (RAM)"
        options={(facets?.ram ?? []).map(String)}
        selected={filters.ram}
        format={(value) => `${value} GB`}
        onChange={(ram) => onChange({ ram })}
      />
      <ToggleGroup
        title="Daxili yaddaş"
        options={(facets?.storage ?? []).map(String)}
        selected={filters.storage}
        format={(value) => formatStorage(Number(value))}
        onChange={(storage) => onChange({ storage })}
      />
      <ToggleGroup
        title="Yaddaş növü"
        options={facets?.storageTypes ?? []}
        selected={filters.storageType}
        onChange={(storageType) => onChange({ storageType })}
      />
      <ToggleGroup title="Əməliyyat sistemi" options={facets?.os ?? []} selected={filters.os} onChange={(os) => onChange({ os })} />

      <RangeInputs
        title="Ekran ölçüsü (düym)"
        min={filters.minScreen}
        max={filters.maxScreen}
        step="0.1"
        placeholderMin={facets?.screen.min ? String(facets.screen.min) : "Min"}
        placeholderMax={facets?.screen.max ? String(facets.screen.max) : "Max"}
        onApply={(minScreen, maxScreen) => onChange({ minScreen, maxScreen })}
      />
    </aside>
  );
}
