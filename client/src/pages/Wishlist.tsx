import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import ProductCard from "../components/product/ProductCard";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const { items } = useWishlist();

  if (!items.length) {
    return (
      <EmptyState
        title="İstək siyahınız boşdur."
        action={
          <Link to="/products" className="btn-primary">
            Məhsullara bax
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">İstək siyahısı</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
}
