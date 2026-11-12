import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import ProductActions from "../components/product/ProductActions";
import ProductImage from "../components/product/ProductImage";
import { useCompare } from "../context/CompareContext";
import { useAsync } from "../hooks/useAsync";
import { productService } from "../services/product.service";
import { Product } from "../types";
import { formatPrice, formatStorage } from "../utils/format";

type CellValue = string | number | null;

interface CompareRow {
  label: string;
  value: (product: Product) => CellValue;
  format?: (value: CellValue) => string;
  better?: "higher" | "lower";
}

const rows: CompareRow[] = [
  { label: "Qiymət", value: (p) => Number(p.price), format: (v) => formatPrice(Number(v)), better: "lower" },
  { label: "Brend", value: (p) => p.brand },
  { label: "Reytinq", value: (p) => p.specs?.extra?.rating ?? null, format: (v) => `★ ${Number(v).toFixed(1)}`, better: "higher" },
  { label: "Prosessor (CPU)", value: (p) => p.specs?.cpu ?? null },
  { label: "Qrafik (GPU)", value: (p) => p.specs?.gpu ?? null },
  { label: "RAM", value: (p) => p.specs?.ramGb ?? null, format: (v) => `${v} GB`, better: "higher" },
  { label: "Daxili yaddaş", value: (p) => p.specs?.storageGb ?? null, format: (v) => formatStorage(Number(v)), better: "higher" },
  { label: "Yaddaş növü", value: (p) => p.specs?.storageType ?? null },
  { label: "Ekran", value: (p) => (p.specs?.screenSizeInch ? Number(p.specs.screenSizeInch) : null), format: (v) => `${v}″` },
  { label: "Ölçü (piksel)", value: (p) => p.specs?.resolution ?? null },
  { label: "Yenilənmə tezliyi", value: (p) => p.specs?.refreshRateHz ?? null, format: (v) => `${v} Hz`, better: "higher" },
  { label: "Batareya", value: (p) => p.specs?.batteryMah ?? null, format: (v) => `${v} mAh`, better: "higher" },
  { label: "Əməliyyat sistemi", value: (p) => p.specs?.os ?? null },
  { label: "Çəki", value: (p) => p.specs?.weightGrams ?? null, format: (v) => `${v} q`, better: "lower" },
  { label: "Bağlantı", value: (p) => p.specs?.connectivity.join(", ") || null },
  { label: "Stok", value: (p) => p.stock, better: "higher" },
];

const bestValue = (values: CellValue[], better?: "higher" | "lower") => {
  if (!better) return null;
  const numbers = values.filter((value): value is number => typeof value === "number");
  if (numbers.length < 2) return null;
  return better === "higher" ? Math.max(...numbers) : Math.min(...numbers);
};

export default function Compare() {
  const { items, remove, clear } = useCompare();
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const ids = items.map((item) => item.id);
  const idsKey = ids.join(",");

  const { data: products, loading, error } = useAsync(
    () => (ids.length >= 2 ? productService.compare(ids) : Promise.resolve([] as Product[])),
    [idsKey],
  );

  const visibleRows = useMemo(() => {
    if (!products) return [];
    return rows
      .map((row) => ({ ...row, values: products.map(row.value) }))
      .filter((row) => row.values.some((value) => value !== null))
      .filter((row) => !onlyDifferences || new Set(row.values.map(String)).size > 1);
  }, [products, onlyDifferences]);

  if (items.length < 2) {
    return (
      <EmptyState
        title="Müqayisə üçün eyni kateqoriyadan ən azı 2 məhsul seçin."
        action={
          <Link to="/products" className="btn-primary">
            Məhsul seç
          </Link>
        }
      />
    );
  }

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (!products?.length) return <Alert>Məhsullar tapılmadı</Alert>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Müqayisə</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyDifferences} onChange={(e) => setOnlyDifferences(e.target.checked)} />
            Yalnız fərqləri göstər
          </label>
          <button className="btn-outline" onClick={clear}>
            Hamısını sil
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-48 p-4" />
              {products.map((product) => (
                <th key={product.id} className="p-4 text-left align-top font-normal">
                  <ProductImage src={product.images[0]} category={product.category?.slug} alt={product.name} className="mb-3 aspect-[3/2] w-full rounded-lg" />
                  <Link to={`/products/${product.slug}`} className="font-semibold hover:text-brand-700">
                    {product.name}
                  </Link>
                  <button className="mt-1 block text-xs text-red-600" onClick={() => remove(product.id)}>
                    Siyahıdan çıxar
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const best = bestValue(row.values, row.better);
              return (
                <tr key={row.label} className="border-b border-line">
                  <th className="bg-surface p-4 text-left font-medium text-ink/70">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td
                      key={products[index].id}
                      className={`p-4 ${best !== null && value === best ? "bg-emerald-50 dark:bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300" : ""}`}
                    >
                      {value === null ? "—" : row.format ? row.format(value) : String(value)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <th className="bg-surface p-4" />
              {products.map((product) => (
                <td key={product.id} className="p-4">
                  <ProductActions product={product} compact />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Yaşıl xanalar həmin göstərici üzrə ən yaxşı dəyəri göstərir.</p>
    </div>
  );
}
