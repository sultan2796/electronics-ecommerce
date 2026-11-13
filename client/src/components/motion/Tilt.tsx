import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useReveal, useTilt } from "../../hooks/useMotion";

export function TiltLink({ to, className = "", children, degrees = 6 }: { to: string; className?: string; children: ReactNode; degrees?: number }) {
  const tilt = useTilt<HTMLAnchorElement>(degrees);
  return (
    <Link ref={tilt.ref} to={to} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className={`tilt ${className}`}>
      <span className="tilt-glare" aria-hidden="true" />
      {children}
    </Link>
  );
}

export function Reveal({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
