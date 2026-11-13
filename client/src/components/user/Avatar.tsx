import { useState } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export default function Avatar({ name, src, className = "size-8 text-sm" }: { name: string; src?: string | null; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(src)} className={`shrink-0 rounded-full bg-chip object-cover ${className}`} />;
  }
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white ${className}`}>
      {initials(name)}
    </span>
  );
}
