import { Bell, Cable, Headphones, Headset, Heart, House, LucideIcon, Search, ShoppingBag, ShoppingCart, Star } from "lucide-react";

export type FigmaIconName =
  | "bag"
  | "cable"
  | "earphones"
  | "headset"
  | "heart"
  | "heart-detail"
  | "nav-bell"
  | "nav-cart"
  | "nav-heart"
  | "nav-home"
  | "search"
  | "star";

const icons: Record<FigmaIconName, LucideIcon> = {
  bag: ShoppingBag,
  cable: Cable,
  earphones: Headphones,
  headset: Headset,
  heart: Heart,
  "heart-detail": Heart,
  "nav-bell": Bell,
  "nav-cart": ShoppingCart,
  "nav-heart": Heart,
  "nav-home": House,
  search: Search,
  star: Star,
};

export default function FigmaIcon({ name, className = "", alt = "" }: { name: FigmaIconName; className?: string; alt?: string }) {
  const Icon = icons[name];
  return (
    <Icon
      className={`block shrink-0 ${className}`}
      strokeWidth={1.75}
      fill={name === "star" ? "currentColor" : "none"}
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      role={alt ? "img" : undefined}
    />
  );
}
