import { useState } from "react";
import { Product } from "../../types";
import { clearRecentlyViewed, readRecentlyViewed } from "../../utils/recentlyViewed";
import ProductGrid from "./ProductGrid";

export default function RecentlyViewed({ excludeId, title = "Son baxdıqlarınız" }: { excludeId?: string; title?: string }) {
  const [items, setItems] = useState<Product[]>(() => readRecentlyViewed().filter((item) => item.id !== excludeId));

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
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
      <ProductGrid products={items} scroll />
    </section>
  );
}
