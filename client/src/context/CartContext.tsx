import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartService } from "../services/cart.service";
import { buildGuestCart, clearGuestLines, parseGuestItemId, readGuestLines, upsertGuestLine, writeGuestLines } from "../services/guestCart";
import { Cart } from "../types";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  busy: boolean;
  isGuest: boolean;
  addItem: (productId: string, quantity?: number, variantId?: string | null) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearGuest: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, initializing: loading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);
  const isGuest = !user;
  const merging = useRef(false);

  const run = useCallback(async (action: () => Promise<Cart>) => {
    setBusy(true);
    try {
      setCart(await action());
    } finally {
      setBusy(false);
    }
  }, []);

  const loadGuest = useCallback(async () => {
    const { cart: guestCart, lines } = await buildGuestCart(readGuestLines());
    writeGuestLines(lines);
    return guestCart;
  }, []);

  const refresh = useCallback(() => run(user ? cartService.get : loadGuest), [run, user, loadGuest]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      refresh().catch(() => setCart(null));
      return;
    }
    const pending = readGuestLines();
    if (!pending.length || merging.current) {
      refresh().catch(() => setCart(null));
      return;
    }
    merging.current = true;
    clearGuestLines();
    void run(async () => {
      const failed: typeof pending = [];
      for (const line of pending) {
        try {
          await cartService.add(line.productId, line.quantity, line.variantId);
        } catch {
          failed.push(line);
        }
      }
      if (failed.length) writeGuestLines(failed);
      return cartService.get();
    })
      .catch(() => setCart(null))
      .finally(() => {
        merging.current = false;
      });
  }, [user, loading, refresh, run]);

  const guestMutate = useCallback(
    (productId: string, quantity: number, mode: "add" | "set", variantId?: string | null) =>
      run(async () => {
        writeGuestLines(upsertGuestLine(readGuestLines(), productId, quantity, mode, variantId));
        return loadGuest();
      }),
    [run, loadGuest],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cart?.itemCount ?? 0,
      busy,
      isGuest,
      addItem: (productId, quantity = 1, variantId) =>
        user ? run(() => cartService.add(productId, quantity, variantId)) : guestMutate(productId, quantity, "add", variantId),
      updateItem: (itemId, quantity) => {
        if (user) return run(() => cartService.update(itemId, quantity));
        const line = parseGuestItemId(itemId);
        return line ? guestMutate(line.productId, quantity, "set", line.variantId) : Promise.resolve();
      },
      removeItem: (itemId) => {
        if (user) return run(() => cartService.remove(itemId));
        const line = parseGuestItemId(itemId);
        return line ? guestMutate(line.productId, 0, "set", line.variantId) : Promise.resolve();
      },
      refresh,
      clearGuest: () => {
        clearGuestLines();
        setCart({ id: "guest", items: [], itemCount: 0, subtotal: 0 });
      },
    }),
    [cart, busy, isGuest, user, run, guestMutate, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
