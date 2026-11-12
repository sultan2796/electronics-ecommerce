import { Product } from "../../types";
import ProductCard from "../product/ProductCard";

export default function ProductGrid({ products, scroll = false }: { products: Product[]; scroll?: boolean }) {
  if (scroll) {
    return (
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[180px] shrink-0 snap-start sm:w-[230px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
