import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { Link } from "react-router-dom";
import ProductImage from "../../components/product/ProductImage";
import { Product } from "../../types";
import { formatPrice } from "../../utils/format";

function StockEditor({ product, onSaved }: { product: Product; onSaved: (product: Product) => void }) {
  const [value, setValue] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const dirty = Number(value) !== product.stock;

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await adminService.updateStock(product.id, Number(value)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input className="input w-20" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn-outline px-3" disabled={!dirty || saving || value === ""} onClick={save}>
        Saxla
      </button>
    </div>
  );
}

export default function AdminInventory() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const lowStock = params.get("lowStock") === "true";
  const page = Number(params.get("page")) || 1;
  const [search, setSearch] = useState(q);
  const [error, setError] = useState<string | null>(null);

  const inventory = useAsync(() => adminService.inventory({ q: q || undefined, lowStock, page }), [q, lowStock, page]);

  const setQuery = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => (value ? merged.set(key, value) : merged.delete(key)));
    setParams(merged);
  };

  const replaceProduct = (updated: Product) =>
    inventory.setData((current) =>
      current ? { ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) } : current,
    );

  const deactivate = async (product: Product) => {
    setError(null);
    try {
      await adminService.deactivateProduct(product.id);
      replaceProduct({ ...product, isActive: false });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const reactivate = async (product: Product) => {
    setError(null);
    try {
      replaceProduct(await adminService.updateProduct(product.id, { isActive: true }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ q: search.trim(), page: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Anbar</h1>
        <form onSubmit={onSearch} className="flex flex-wrap gap-2">
          <input className="input w-64" placeholder="Ad, SKU və ya brend" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-outline">Axtar</button>
          <Link to="/admin/products/new" className="btn-primary whitespace-nowrap">
            + Yeni məhsul
          </Link>
        </form>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={lowStock} onChange={(e) => setQuery({ lowStock: e.target.checked ? "true" : "", page: "" })} />
        Yalnız az qalan stok (≤5)
      </label>
      {error && <Alert>{error}</Alert>}

      {inventory.loading ? (
        <Spinner />
      ) : inventory.error ? (
        <Alert>{inventory.error}</Alert>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-3">Məhsul</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Kateqoriya</th>
                  <th className="px-4 py-3">Qiymət</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.data?.items.map((product) => (
                  <tr key={product.id} className={`border-t border-line ${product.stock <= 5 ? "bg-amber-50/60 dark:bg-amber-500/10" : ""}`}>
                    <td className="px-4 py-3">
                      <Link to={`/admin/products/${product.id}`} className="flex items-center gap-3 font-medium hover:text-brand-600">
                        <ProductImage src={product.images[0]} category={product.category?.slug} alt={product.name} className="size-10 shrink-0 rounded-lg bg-chip" />
                        <span className="line-clamp-2">{product.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.sku}</td>
                    <td className="px-4 py-3">{product.category?.name}</td>
                    <td className="px-4 py-3">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <StockEditor key={`${product.id}-${product.stock}`} product={product} onSaved={replaceProduct} />
                    </td>
                    <td className="px-4 py-3">
                      {product.isActive ? (
                        <button className="text-xs text-red-600 hover:underline" onClick={() => deactivate(product)}>
                          Satışdan çıxar
                        </button>
                      ) : (
                        <button className="text-xs text-emerald-600 hover:underline" onClick={() => reactivate(product)}>
                          Satışa qaytar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inventory.data && (
            <Pagination page={inventory.data.page} totalPages={inventory.data.totalPages} onChange={(next) => setQuery({ page: String(next) })} />
          )}
        </>
      )}
    </div>
  );
}
