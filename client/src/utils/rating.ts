import { Product } from "../types";

export const productRating = (product: Pick<Product, "ratingAverage" | "reviewCount" | "specs">) => {
  if (typeof product.ratingAverage === "number" && (product.reviewCount ?? 0) > 0) {
    return { value: product.ratingAverage, count: product.reviewCount ?? 0, fromReviews: true };
  }
  const imported = product.specs?.extra?.rating;
  return typeof imported === "number" ? { value: imported, count: 0, fromReviews: false } : null;
};

export const ratingPercent = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

export const reviewCountLabel = (count: number) => `${count} rəy`;
