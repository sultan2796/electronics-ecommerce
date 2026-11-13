import { useEffect, useState } from "react";
import Alert from "../common/Alert";
import { adminService, VariantInput } from "../../services/admin.service";
import { getErrorMessage } from "../../services/api";
import { extraService, fileToDataUrl } from "../../services/extra.service";
import { Product, ProductVariant } from "../../types";

interface Row {
  key: string;
  id?: string;
  name: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  price: string;
  salePrice: string;
  stock: string;
  images: string[];
  isActive: boolean;
}

let counter = 0;
const nextKey = () => `row-${(counter += 1)}`;

const toRow = (variant: ProductVariant): Row => ({
  key: variant.id,
  id: variant.id,
  name: variant.name,
  color: variant.color ?? "",
  colorHex: variant.colorHex ?? "",
  size: variant.size ?? "",
  sku: variant.sku,
  price: (variant.basePrice !== undefined ? variant.basePrice : variant.price) ?? "",
  salePrice: variant.salePrice ?? "",
  stock: String(variant.stock),
  images: variant.images,
  isActive: variant.isActive,
});

const composeName = (row: Row) => [row.color.trim(), row.size.trim()].filter(Boolean).join(" / ");

const toInput = (row: Row): VariantInput => ({
  ...(row.id ? { id: row.id } : {}),
  name: row.name.trim() || composeName(row),
  color: row.color.trim() || null,
  colorHex: row.colorHex.trim() || null,
  size: row.size.trim() || null,
  sku: row.sku.trim(),
  price: row.price.trim() ? Number(row.price) : null,
  salePrice: row.salePrice.trim() ? Number(row.salePrice) : null,
  stock: Number(row.stock || 0),
  images: row.images,
  isActive: row.isActive,
});

export default function VariantEditor({ product, onSaved }: { product: Product; onSaved: (product: Product) => void }) {
  const [rows, setRows] = useState<Row[]>(() => (product.variants ?? []).map(toRow));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    setRows((product.variants ?? []).map(toRow));
  }, [product.variants]);

  const patch = (key: string, change: Partial<Row>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));

  const add = () =>
    setRows((current) => [
      ...current,
      { key: nextKey(), name: "", color: "", colorHex: "", size: "", sku: `${product.sku}-${current.length + 1}`, price: "", salePrice: "", stock: "0", images: [], isActive: true },
    ]);

  const uploadImages = async (row: Row, files: FileList | null) => {
    if (!files?.length) return;
    setUploadingKey(row.key);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8 - row.images.length)) {
        if (file.size > 2 * 1024 * 1024) throw new Error(`${file.name} 2 MB-dan böyükdür`);
        urls.push((await extraService.upload(await fileToDataUrl(file))).url);
      }
      patch(row.key, { images: [...row.images, ...urls] });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const invalid = rows.find((row) => !(row.name.trim() || composeName(row)) || row.sku.trim().length < 2);
      if (invalid) throw new Error("Hər variantın adı (və ya rəng/ölçüsü) və ən azı 2 simvollu SKU-su olmalıdır");
      const saved = await adminService.saveVariants(product.id, rows.map(toInput));
      setRows((saved.variants ?? []).map(toRow));
      onSaved(saved);
      setNotice("Variantlar saxlanıldı");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const totalStock = rows.filter((row) => row.isActive).reduce((sum, row) => sum + Number(row.stock || 0), 0);

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Variantlar (rəng, ölçü, yaddaş)</h2>
          <p className="text-xs text-muted">
            {rows.length
              ? `Aktiv variantların ümumi stoku: ${totalStock}. Məhsulun stoku variantların cəmindən hesablanır.`
              : "Variant yoxdursa, məhsul tək seçim kimi satılır. Qiyməti boş qoysanız, məhsulun qiyməti istifadə olunur."}
          </p>
        </div>
        <button type="button" className="btn-outline btn-sm" onClick={add} disabled={rows.length >= 50}>
          + Variant əlavə et
        </button>
      </div>

      {rows.map((row, index) => (
        <div key={row.key} className={`space-y-3 rounded-2xl border border-line p-4 ${row.isActive ? "" : "opacity-60"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{`#${index + 1} ${row.name.trim() || composeName(row) || "Yeni variant"}`}</p>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="accent-brand-600" checked={row.isActive} onChange={(event) => patch(row.key, { isActive: event.target.checked })} />
                Aktiv
              </label>
              <button type="button" className="text-muted disabled:opacity-30" disabled={index === 0} onClick={() => setRows((current) => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} aria-label="Yuxarı">
                ↑
              </button>
              <button type="button" className="text-muted disabled:opacity-30" disabled={index === rows.length - 1} onClick={() => setRows((current) => { const next = [...current]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} aria-label="Aşağı">
                ↓
              </button>
              <button type="button" className="text-red-600" onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}>
                Sil
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-xs">
              <span className="font-medium">Ad</span>
              <input className="input rounded-xl" value={row.name} placeholder={composeName(row) || "Qara / 256GB"} onChange={(event) => patch(row.key, { name: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Rəng</span>
              <input className="input rounded-xl" value={row.color} onChange={(event) => patch(row.key, { color: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Rəng kodu</span>
              <span className="flex gap-2">
                <input type="color" className="h-11 w-12 cursor-pointer rounded-lg border border-line bg-transparent" value={row.colorHex || "#000000"} onChange={(event) => patch(row.key, { colorHex: event.target.value })} aria-label="Rəng seçin" />
                <input className="input rounded-xl" value={row.colorHex} placeholder="#RRGGBB" onChange={(event) => patch(row.key, { colorHex: event.target.value })} />
              </span>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Ölçü / yaddaş</span>
              <input className="input rounded-xl" value={row.size} onChange={(event) => patch(row.key, { size: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">SKU *</span>
              <input className="input rounded-xl" value={row.sku} onChange={(event) => patch(row.key, { sku: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Qiymət (AZN)</span>
              <input className="input rounded-xl" type="number" step="0.01" min="0" value={row.price} placeholder={String(product.price)} onChange={(event) => patch(row.key, { price: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Endirimli qiymət</span>
              <input className="input rounded-xl" type="number" step="0.01" min="0" value={row.salePrice} disabled={!row.price.trim()} onChange={(event) => patch(row.key, { salePrice: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Stok *</span>
              <input className="input rounded-xl" type="number" step="1" min="0" value={row.stock} onChange={(event) => patch(row.key, { stock: event.target.value })} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {row.images.map((image) => (
              <span key={image} className="relative">
                <img src={image} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" loading="lazy" />
                <button type="button" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white" onClick={() => patch(row.key, { images: row.images.filter((item) => item !== image) })} aria-label="Şəkli sil">
                  ×
                </button>
              </span>
            ))}
            {row.images.length < 8 && (
              <label className={`flex h-14 cursor-pointer items-center rounded-lg border border-dashed border-line px-3 text-xs hover:border-brand-500 ${uploadingKey === row.key ? "pointer-events-none opacity-60" : ""}`}>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(event) => void uploadImages(row, event.target.files)} />
                {uploadingKey === row.key ? "Yüklənir..." : "+ Variant şəkli"}
              </label>
            )}
            {!row.images.length && <span className="text-xs text-muted">Şəkil yoxdursa, məhsulun əsas şəkilləri göstərilir.</span>}
          </div>
        </div>
      ))}

      {error && <Alert>{error}</Alert>}
      {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}
      <button type="button" className="btn-primary" disabled={saving} onClick={save}>
        {saving ? "Saxlanılır..." : "Variantları saxla"}
      </button>
    </section>
  );
}
