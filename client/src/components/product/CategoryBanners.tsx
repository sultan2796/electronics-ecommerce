import { Link } from "react-router-dom";

export interface CategoryBanner {
  slug: string;
  label: string;
  image: string;
}

export const categoryBanners: CategoryBanner[] = [
  { slug: "laptops", label: "Noutbuklar", image: "/images/categories/laptops.png" },
  { slug: "desktops", label: "Masaüstü kompüterlər", image: "/images/categories/desktops.png" },
  { slug: "accessories", label: "Aksesuarlar", image: "/images/categories/accessories.png" },
  { slug: "gaming-accessories", label: "Oyun aksesuarları", image: "/images/categories/gaming-accessories.png" },
];

export default function CategoryBanners({ banners = categoryBanners }: { banners?: CategoryBanner[] }) {
  return (
    <div className="mx-auto grid w-full max-w-[600px] grid-cols-1 gap-x-5 sm:grid-cols-2">
      {banners.map((banner) => (
        <div key={banner.slug} className="flex flex-col items-center justify-center py-2.5">
          <Link
            to={`/products?category=${banner.slug}`}
            className="group flex h-[300px] w-full flex-col items-center justify-center rounded-[20px] bg-[#f5f5f7] px-5"
          >
            <span className="flex w-full flex-col items-center justify-center gap-5">
              <span className="relative block h-[153px] w-full">
                <img src={banner.image} alt={banner.label} className="absolute inset-0 h-full w-full object-contain" />
              </span>
              <span className="flex items-center justify-center overflow-clip px-1.5">
                <span className="whitespace-nowrap text-center font-[Arial,sans-serif] text-[18px] leading-[22px] tracking-[0.72px] text-[#3936c3] group-hover:text-brand-700">
                  {banner.label}
                </span>
              </span>
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
