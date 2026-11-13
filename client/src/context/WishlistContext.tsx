import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { wishlistService } from "../services/wishlist.service";
import { WishlistItem } from "../types";
import { useAuth } from "./AuthContext";

interface WishlistContextValue {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setRawItems] = useState<WishlistItem[]>([]);
  const setItems = useCallback((next: unknown) => setRawItems(Array.isArray(next) ? (next as WishlistItem[]) : []), []);

  useEffect(() => {
    if (user) {
      wishlistService.get().then(setItems).catch(() => setItems([]));
    } else {
      setItems([]);
    }
  }, [user]);

  const has = useCallback((productId: string) => items.some((item) => item.productId === productId), [items]);

  const toggle = useCallback(
    async (productId: string) => {
      setItems(has(productId) ? await wishlistService.remove(productId) : await wishlistService.add(productId));
    },
    [has],
  );

  const value = useMemo(() => ({ items, has, toggle }), [items, has, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}
