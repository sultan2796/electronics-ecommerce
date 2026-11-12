import { OrderStatus, PaymentMethod, PaymentStatus } from "../types";

const currency = new Intl.NumberFormat("az-AZ", { style: "currency", currency: "AZN", currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const formatPrice = (value: number | string) => currency.format(Number(value));

export const discountOf = (product: { specs: { extra?: { discountPercentage?: number | null } | null } | null }) => {
  const value = product.specs?.extra?.discountPercentage;
  return typeof value === "number" && value >= 1 ? Math.round(value) : 0;
};

export const priceBeforeDiscount = (price: number | string, discount: number) =>
  discount > 0 ? Number(price) / (1 - discount / 100) : Number(price);

export const formatStorage = (gb: number) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const weekdays = ["bazar", "bazar ertəsi", "çərşənbə axşamı", "çərşənbə", "cümə axşamı", "cümə", "şənbə"];
const pad = (value: number) => String(value).padStart(2, "0");

export const formatDay = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getDate()} ${months[date.getMonth()].slice(0, 3)}`;
};

export const formatLongDate = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const weekday = weekdays[date.getDay()];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${weekday}`;
};

export const formatDate = (value: string) => {
  const date = new Date(value);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CARD: "Kartla onlayn",
  CASH_ON_DELIVERY: "Qapıda ödəniş",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Gözləyir",
  SUCCEEDED: "Ödənilib",
  FAILED: "Uğursuz",
  REFUNDED: "Geri qaytarılıb",
};

export const paymentStatusStyles: Record<PaymentStatus, string> = {
  PENDING: "text-amber-600 dark:text-amber-400",
  SUCCEEDED: "text-emerald-600 dark:text-emerald-400",
  FAILED: "text-red-600 dark:text-red-400",
  REFUNDED: "text-muted",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Gözləmədə",
  PAID: "Ödənilib",
  PROCESSING: "Hazırlanır",
  SHIPPED: "Göndərilib",
  DELIVERED: "Çatdırılıb",
  CANCELLED: "Ləğv edilib",
};

export const orderStatusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300",
  PAID: "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300",
  PROCESSING: "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300",
  SHIPPED: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
  DELIVERED: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  CANCELLED: "bg-chip text-ink/70",
};
