const illustratedCategories = new Set([
  "laptops",
  "desktops",
  "smartphones",
  "tablets",
  "monitors",
  "accessories",
  "gaming-accessories",
  "headsets",
  "earphones",
  "cables",
]);

const isRealImage = (src?: string) => Boolean(src && !src.includes("placehold.co"));

export const fallbackImage = (category?: string) =>
  `/illustrations/${category && illustratedCategories.has(category) ? category : "default"}.svg`;

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}

export default function ProductImage({ src, alt, category, className = "" }: ProductImageProps) {
  const real = isRealImage(src);
  return (
    <img
      src={real ? src : fallbackImage(category)}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        const fallback = fallbackImage(category);
        if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
      }}
      className={`object-contain ${real ? "dark:rounded-xl dark:bg-white" : "p-[6%]"} ${className}`}
    />
  );
}
