import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "../types";

export const MAX_COMPARE = 4;
const STORAGE_KEY = "compare-items";

export interface CompareEntry {
  id: string;
  name: string;
  categorySlug: string;
  image?: string;
}

interface CompareContextValue {
  items: CompareEntry[];
  has: (productId: string) => boolean;
  toggle: (product: Product) => string | null;
  remove: (productId: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const readStored = (): CompareEntry[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompareEntry[]) : [];
  } catch {
    return [];
  }
};

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareEntry[]>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      return;
    }
  }, [items]);

  const has = useCallback((productId: string) => items.some((item) => item.id === productId), [items]);

  const toggle = useCallback(
    (product: Product): string | null => {
      if (has(product.id)) {
        setItems((current) => current.filter((item) => item.id !== product.id));
        return null;
      }
      const categorySlug = product.category?.slug ?? "";
      if (items.length && items[0].categorySlug !== categorySlug) {
        return "Yalnız eyni kateqoriyadan olan məhsulları müqayisə etmək olar";
      }
      if (items.length >= MAX_COMPARE) {
        return `Ən çox ${MAX_COMPARE} məhsul müqayisə edilə bilər`;
      }
      setItems((current) => [...current, { id: product.id, name: product.name, categorySlug, image: product.images[0] }]);
      return null;
    },
    [has, items],
  );

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      has,
      toggle,
      remove: (productId) => setItems((current) => current.filter((item) => item.id !== productId)),
      clear: () => setItems([]),
    }),
    [items, has, toggle],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
