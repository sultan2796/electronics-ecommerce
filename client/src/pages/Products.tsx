import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";
import Spinner from "../components/common/Spinner";
import ProductCard from "../components/product/ProductCard";
import SpecFilters from "../components/product/SpecFilters";
import { useAsync } from "../hooks/useAsync";
import { productService } from "../services/product.service";
import { ProductFilters, ProductSort } from "../types";
import { emptyFilters, parseFilters, serializeFilters } from "../utils/filters";

const sortLabels: Record<ProductSort, string> = {
  newest: "Ən yenilər",
  price_asc: "Qiymət: artan",
  price_desc: "Qiymət: azalan",
  name_asc: "Ad: A-Z",
};

export default function Products() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const queryKey = params.toString();

  const categories = useAsync(() => productService.categories(), []);
  const facets = useAsync(() => productService.facets(filters.category || undefined), [filters.category]);
  const products = useAsync(() => productService.list(filters), [queryKey]);

  const updateFilters = (patch: Partial<ProductFilters>) => {
    setParams(serializeFilters({ ...filters, page: 1, ...patch }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <SpecFilters
        facets={facets.data}
        categories={(categories.data ?? []).filter((category) => (category._count?.products ?? 0) > 0 || category.slug === filters.category)}
        filters={filters}
        onChange={updateFilters}
      />

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Məhsullar</h1>
            {filters.q && <p className="text-sm text-muted">“{filters.q}” üzrə axtarış</p>}
            {products.data && <p className="text-sm text-muted">{products.data.total} nəticə</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            Sırala
            <select className="input w-auto" value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value as ProductSort })}>
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {products.loading ? (
          <Spinner />
        ) : products.error ? (
          <Alert>{products.error}</Alert>
        ) : !products.data?.items.length ? (
          <EmptyState
            title="Seçilmiş filtrlərə uyğun məhsul tapılmadı."
            action={
              <button className="btn-outline" onClick={() => setParams(serializeFilters(emptyFilters))}>
                Filtrləri sıfırla
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              page={products.data.page}
              totalPages={products.data.totalPages}
              onChange={(page) => setParams(serializeFilters({ ...filters, page }))}
            />
          </>
        )}
      </section>
    </div>
  );
}
