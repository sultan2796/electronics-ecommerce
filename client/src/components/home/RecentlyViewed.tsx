import { useState } from "react";
import { Product } from "../../types";
import { clearRecentlyViewed, readRecentlyViewed } from "../../utils/recentlyViewed";
import ProductCard from "../product/ProductCard";

export default function RecentlyViewed({ excludeId, title = "Son baxdıqlarınız" }: { excludeId?: string; title?: string }) {
  const [items, setItems] = useState<Product[]>(() => readRecentlyViewed().filter((item) => item.id !== excludeId));

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-[10px]">
        <h2 className="text-base text-ink">{title}</h2>
        <button
          type="button"
          className="text-xs text-muted hover:text-brand-600"
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
        >
          Təmizlə
        </button>
      </div>
      <div className="no-scrollbar -mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-3 pt-1 sm:mx-0 sm:px-0">
        {items.map((product) => (
          <div key={product.id} className="w-[158px] shrink-0 snap-start sm:w-[200px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
