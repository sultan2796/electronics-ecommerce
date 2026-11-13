import { ShoppingCart } from "lucide-react";
import { formatPrice } from "../../utils/format";

interface StickyBuyBarProps {
  visible: boolean;
  price: number;
  soldOut: boolean;
  busy: boolean;
  onAdd: () => void;
  onBuy: () => void;
}

export default function StickyBuyBar({ visible, price, soldOut, busy, onAdd, onBuy }: StickyBuyBarProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-[66px] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur transition duration-300 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted">Qiymət</p>
          <p className="truncate text-lg font-bold leading-tight">{formatPrice(price)}</p>
        </div>
        <button
          type="button"
          className="btn-outline btn-icon size-11"
          aria-label="Səbətə at"
          tabIndex={visible ? 0 : -1}
          disabled={busy || soldOut}
          onClick={onAdd}
        >
          <ShoppingCart className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button type="button" className="btn-primary h-11 px-6" tabIndex={visible ? 0 : -1} disabled={busy || soldOut} onClick={onBuy}>
          {soldOut ? "Stokda yoxdur" : "İndi al"}
        </button>
      </div>
    </div>
  );
}
