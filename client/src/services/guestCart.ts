import { Cart, CartItem, Product } from "../types";
import { api } from "./api";

const KEY = "electroshop:guest-cart";
const MAX_LINES = 10;
const MAX_QUANTITY = 5;

export interface GuestLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

const sameLine = (line: GuestLine, productId: string, variantId?: string | null) =>
  line.productId === productId && (line.variantId ?? "") === (variantId ?? "");

export const guestItemId = (productId: string, variantId?: string | null) => `guest-${productId}~${variantId ?? ""}`;

export const parseGuestItemId = (itemId: string) => {
  const match = /^guest-([^~]+)~(.*)$/.exec(itemId);
  return match ? { productId: match[1], variantId: match[2] || undefined } : null;
};

export const readGuestLines = (): GuestLine[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line): line is GuestLine => typeof line?.productId === "string" && Number.isInteger(line?.quantity) && line.quantity > 0)
      .slice(0, MAX_LINES)
      .map((line) => ({
        productId: line.productId,
        ...(typeof line.variantId === "string" && line.variantId ? { variantId: line.variantId } : {}),
        quantity: Math.min(MAX_QUANTITY, line.quantity),
      }));
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

export const upsertGuestLine = (
  lines: GuestLine[],
  productId: string,
  quantity: number,
  mode: "add" | "set",
  variantId?: string | null,
) => {
  const existing = lines.find((line) => sameLine(line, productId, variantId));
  const nextQuantity = Math.min(MAX_QUANTITY, mode === "add" ? (existing?.quantity ?? 0) + quantity : quantity);
  if (nextQuantity <= 0) return lines.filter((line) => !sameLine(line, productId, variantId));
  if (existing) return lines.map((line) => (sameLine(line, productId, variantId) ? { ...line, quantity: nextQuantity } : line));
  if (lines.length >= MAX_LINES) throw new Error("Qonaq səbətində ən çox 10 fərqli məhsul ola bilər. Daha çox üçün hesaba daxil olun.");
  return [...lines, { productId, ...(variantId ? { variantId } : {}), quantity: nextQuantity }];
};

const lineFor = (product: Product, variantId?: string) => {
  const variants = product.variants ?? [];
  if (!variantId) return variants.length ? null : { product, variant: null };
  const variant = variants.find((entry) => entry.id === variantId);
  if (!variant) return null;
  return {
    product: {
      ...product,
      price: variant.price ?? product.price,
      compareAtPrice: variant.compareAtPrice ?? null,
      stock: variant.stock,
      images: variant.images.length ? variant.images : product.images,
    },
    variant,
  };
};

export const buildGuestCart = async (lines: GuestLine[]): Promise<{ cart: Cart; lines: GuestLine[] }> => {
  if (!lines.length) return { cart: { id: "guest", items: [], itemCount: 0, subtotal: 0 }, lines };
  const ids = [...new Set(lines.map((line) => line.productId))];
  const { data } = await api.get<{ items: Product[] }>("/products/lookup", { params: { ids: ids.join(",") } });
  const byId = new Map(data.items.map((product) => [product.id, product]));
  const items: CartItem[] = [];
  const kept: GuestLine[] = [];
  for (const line of lines) {
    const product = byId.get(line.productId);
    const resolved = product ? lineFor(product, line.variantId) : null;
    if (!resolved || resolved.product.stock <= 0) continue;
    const quantity = Math.min(line.quantity, resolved.product.stock, MAX_QUANTITY);
    kept.push({ ...line, quantity });
    items.push({
      id: guestItemId(line.productId, line.variantId),
      productId: line.productId,
      variantId: line.variantId ?? null,
      variant: resolved.variant
        ? { id: resolved.variant.id, name: resolved.variant.name, color: resolved.variant.color, colorHex: resolved.variant.colorHex, size: resolved.variant.size, sku: resolved.variant.sku }
        : null,
      quantity,
      product: resolved.product,
    });
  }
  const subtotal = Math.round(items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) * 100) / 100;
  return { cart: { id: "guest", items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal }, lines: kept };
};
