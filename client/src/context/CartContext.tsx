import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cartService } from "../services/cart.service";
import { Cart } from "../types";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  busy: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (action: () => Promise<Cart>) => {
    setBusy(true);
    try {
      setCart(await action());
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(() => run(cartService.get), [run]);

  useEffect(() => {
    if (user) {
      refresh().catch(() => setCart(null));
    } else {
      setCart(null);
    }
  }, [user, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cart?.itemCount ?? 0,
      busy,
      addItem: (productId, quantity = 1) => run(() => cartService.add(productId, quantity)),
      updateItem: (productId, quantity) => run(() => cartService.update(productId, quantity)),
      removeItem: (productId) => run(() => cartService.remove(productId)),
      refresh,
    }),
    [cart, busy, run, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
