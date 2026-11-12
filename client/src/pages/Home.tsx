import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import FigmaIcon from "../components/common/FigmaIcon";
import Spinner from "../components/common/Spinner";
import HeroSlider from "../components/home/HeroSlider";
import CategoryChips from "../components/product/CategoryChips";
import ProductCard from "../components/product/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";
import { productService } from "../services/product.service";
import { Category } from "../types";
import { emptyFilters } from "../utils/filters";

const categoryOrder = ["headsets", "smartphones", "laptops", "tablets", "mobile-accessories", "earphones", "cables"];

const sortCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.slug);
    const bi = categoryOrder.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
  });

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");

  const featured = useAsync(() => productService.featured(3), []);
  const picks = useAsync(() => productService.featured(10), []);
  const categoriesState = useAsync(() => productService.categories(), []);
  const categories = useMemo(
    () => sortCategories((categoriesState.data ?? []).filter((category) => (category._count?.products ?? 0) > 0)),
    [categoriesState.data],
  );

  useEffect(() => {
    if (!active && categories.length) setActive(categories[0].slug);
  }, [active, categories]);

  const products = useAsync(
    () => (active ? productService.list({ ...emptyFilters, category: active }, 8) : Promise.resolve(null)),
    [active],
  );

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(search.trim() ? `/products?q=${encodeURIComponent(search.trim())}` : "/products");
  };

  return (
    <div className="-mx-4 -mt-8 space-y-[30px] sm:mx-0 sm:mt-0">
      <HeroSlider
        products={featured.data ?? []}
        overlay={
          <>
            <Link
              to={user ? "/profile" : "/login"}
              aria-label={user ? "Hesabım" : "Giriş"}
              className="absolute left-[26px] top-[25px] z-10 flex size-[38px] items-center justify-center rounded-full border-2 border-white bg-brand-500 text-sm font-semibold text-white"
            >
              {user ? initials(user.name) : "?"}
            </Link>
            <Link to="/wishlist" aria-label="İstək siyahısı" className="absolute right-[20px] top-[25px] z-10">
              <FigmaIcon name="heart" className="size-[22.5px]" />
            </Link>
          </>
        }
      />

      <div className="space-y-[30px] px-5 sm:px-0">
        <form onSubmit={onSearch} className="relative md:hidden">
          <FigmaIcon name="search" className="pointer-events-none absolute left-[14px] top-1/2 size-4 -translate-y-1/2 dark:invert" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Qulaqlıq, noutbuk, smartfon axtar"
            className="h-10 w-full rounded-full border border-ink/20 bg-surface pl-[45px] pr-4 text-base text-ink outline-none placeholder:text-muted focus:border-brand-500"
          />
        </form>

        {picks.data && picks.data.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-[10px]">
              <h2 className="text-base text-ink">Sizin üçün seçdiklərimiz</h2>
              <span className="text-xs text-muted">Ən yüksək reytinq</span>
            </div>
            <div className="no-scrollbar -mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-3 pt-1 sm:mx-0 sm:px-0">
              {picks.data.map((product) => (
                <div key={product.id} className="w-[158px] shrink-0 snap-start sm:w-[220px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between px-[10px]">
            <h2 className="text-base text-ink">Kateqoriyalar</h2>
            <Link to={active ? `/products?category=${active}` : "/products"} className="text-xs text-brand-600 hover:underline">
              Hamısına bax
            </Link>
          </div>
          {categoriesState.error && <Alert>{categoriesState.error}</Alert>}
          <CategoryChips categories={categories} active={active} onSelect={setActive} />
        </section>


        <section>
          {categoriesState.loading || products.loading ? (
            <Spinner />
          ) : products.error ? (
            <Alert>{products.error}</Alert>
          ) : !active ? null : !products.data?.items.length ? (
            <p className="py-10 text-center text-sm text-muted">Bu kateqoriyada hələ məhsul yoxdur.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-[28px] gap-y-[42px] sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
