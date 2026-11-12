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

export default function FigmaIcon({ name, className = "", alt = "" }: { name: FigmaIconName; className?: string; alt?: string }) {
  return <img src={`/figma/icons/${name}.svg`} alt={alt} aria-hidden={alt ? undefined : true} className={`block ${className}`} />;
}
