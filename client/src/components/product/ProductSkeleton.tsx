export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-chip" />
      <div className="space-y-2.5 p-4">
        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-chip" />
        <div className="h-3.5 w-full animate-pulse rounded-full bg-chip" />
        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-chip" />
        <div className="h-5 w-1/2 animate-pulse rounded-full bg-chip pt-2" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-chip" />
      </div>
    </div>
  );
}

export default function ProductSkeletonGrid({ count = 8, className = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" }: { count?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-label="Məhsullar yüklənir">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
