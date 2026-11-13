import { Cart, CartItem, Product } from "../types";
import { api } from "./api";

const KEY = "electroshop:guest-cart";
const MAX_LINES = 10;
const MAX_QUANTITY = 5;

export interface GuestLine {
  productId: string;
  quantity: number;
}

export const readGuestLines = (): GuestLine[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line): line is GuestLine => typeof line?.productId === "string" && Number.isInteger(line?.quantity) && line.quantity > 0)
      .slice(0, MAX_LINES)
      .map((line) => ({ productId: line.productId, quantity: Math.min(MAX_QUANTITY, line.quantity) }));
  } catch {
    return [];
  }
};

export const writeGuestLines = (lines: GuestLine[]) => {
  try {
    if (lines.length) localStorage.setItem(KEY, JSON.stringify(lines.slice(0, MAX_LINES)));
    else localStorage.removeItem(KEY);
  } catch {
    return;
  }
};

export const clearGuestLines = () => writeGuestLines([]);

export const upsertGuestLine = (lines: GuestLine[], productId: string, quantity: number, mode: "add" | "set") => {
  const existing = lines.find((line) => line.productId === productId);
  const nextQuantity = Math.min(MAX_QUANTITY, mode === "add" ? (existing?.quantity ?? 0) + quantity : quantity);
  if (nextQuantity <= 0) return lines.filter((line) => line.productId !== productId);
  if (existing) return lines.map((line) => (line.productId === productId ? { ...line, quantity: nextQuantity } : line));
  if (lines.length >= MAX_LINES) throw new Error("Qonaq səbətində ən çox 10 fərqli məhsul ola bilər. Daha çox üçün hesaba daxil olun.");
  return [...lines, { productId, quantity: nextQuantity }];
};

export const buildGuestCart = async (lines: GuestLine[]): Promise<{ cart: Cart; lines: GuestLine[] }> => {
  if (!lines.length) return { cart: { id: "guest", items: [], itemCount: 0, subtotal: 0 }, lines };
  const { data } = await api.get<{ items: Product[] }>("/products/lookup", { params: { ids: lines.map((line) => line.productId).join(",") } });
  const byId = new Map(data.items.map((product) => [product.id, product]));
  const items: CartItem[] = [];
  const kept: GuestLine[] = [];
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || product.stock <= 0) continue;
    const quantity = Math.min(line.quantity, product.stock, MAX_QUANTITY);
    kept.push({ productId: line.productId, quantity });
    items.push({ id: `guest-${line.productId}`, productId: line.productId, quantity, product });
  }
  const subtotal = Math.round(items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) * 100) / 100;
  return { cart: { id: "guest", items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal }, lines: kept };
};
