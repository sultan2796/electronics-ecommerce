import { Link, useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import { formatBytes } from "../../components/admin/ModelManager";
import ProductImage from "../../components/product/ProductImage";
import { useAsync } from "../../hooks/useAsync";
import { adminService } from "../../services/admin.service";

const filters = [
  { value: "with", label: "3D modeli olanlar" },
  { value: "without", label: "3D modeli olmayanlar" },
] as const;

export default function AdminModels() {
  const [params, setParams] = useSearchParams();
  const model = params.get("model") === "without" ? "without" : "with";
  const page = Number(params.get("page")) || 1;
  const list = useAsync(() => adminService.inventory({ model, page }), [model, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">3D modellər</h1>
        <p className="text-sm text-muted">Məhsullara bağlı GLB/GLTF modelləri. Modeli yükləmək, dəyişmək və silmək üçün məhsulu redaktə edin.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Model filtri">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={model === filter.value}
            onClick={() => setParams({ model: filter.value })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${model === filter.value ? "bg-brand-600 text-white" : "bg-chip text-ink/70 hover:text-ink"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {list.loading && !list.data ? (
        <Spinner />
      ) : list.error ? (
        <Alert>{list.error}</Alert>
      ) : !list.data?.items.length ? (
        <div className="card p-10 text-center text-sm text-muted">
          {model === "with" ? "Hələ heç bir məhsula 3D model bağlanmayıb." : "Bütün məhsulların 3D modeli var."}
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-3">Məhsul</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fayl ölçüsü</th>
                  <th className="px-4 py-3">Lisenziya / mənbə</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((product) => (
                  <tr key={product.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-chip">
                          <ProductImage src={product.images[0]} category={product.category?.slug} alt="" className="size-full object-contain" />
                        </span>
                        <span translate="no" className="line-clamp-2 font-medium">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {product.model3dUrl ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${product.model3dActive === false ? "bg-chip text-muted" : "bg-success-soft text-success"}`}>
                          {product.model3dActive === false ? "Deaktiv" : "Aktiv"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs font-medium text-muted">Model yoxdur</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{product.model3dUrl ? formatBytes(product.model3dSize ?? null) : "—"}</td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-muted">
                      {[product.model3dLicense, product.model3dSource].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link to={`/admin/products/${product.id}`} className="btn-outline btn-sm">
                        {product.model3dUrl ? "İdarə et" : "Model əlavə et"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={list.data.page}
            totalPages={list.data.totalPages}
            onChange={(next) => setParams({ model, page: String(next) })}
          />
        </>
      )}
    </div>
  );
}
