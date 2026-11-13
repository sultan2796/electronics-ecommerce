const KEY = "electroshop:guest-orders";

export interface GuestOrderRef {
  orderNumber: string;
  token: string;
  createdAt: string;
}

export const readGuestOrders = (): GuestOrderRef[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.orderNumber === "string" && typeof item?.token === "string").slice(0, 10) : [];
  } catch {
    return [];
  }
};

export const rememberGuestOrder = (orderNumber: string, token: string) => {
  const next = [{ orderNumber, token, createdAt: new Date().toISOString() }, ...readGuestOrders().filter((item) => item.orderNumber !== orderNumber)].slice(0, 10);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
};
