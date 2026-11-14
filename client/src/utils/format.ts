import { OrderStatus, PaymentMethod, PaymentStatus } from "../types";

export const formatPrice = (value: number | string) => {
  const amount = Math.round(Number(value) * 100) / 100;
  const [whole, fraction] = Math.abs(amount).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${amount < 0 ? "−" : ""}${grouped}${fraction === "00" ? "" : `,${fraction}`} ₼`;
};

export const discountOf = (product: { specs: { extra?: { discountPercentage?: number | null } | null } | null }) => {
  const value = product.specs?.extra?.discountPercentage;
  return typeof value === "number" && value >= 1 ? Math.round(value) : 0;
};

export const priceBeforeDiscount = (price: number | string, discount: number) =>
  discount > 0 ? Number(price) / (1 - discount / 100) : Number(price);

export const INSTALLMENT_MONTHS = 12;

export const pricing = (product: {
  price: string | number;
  compareAtPrice?: string | number | null;
  specs: { extra?: { discountPercentage?: number | null } | null } | null;
}) => {
  const price = Number(product.price);
  if (product.compareAtPrice && Number(product.compareAtPrice) > price) {
    const was = Number(product.compareAtPrice);
    return { price, was, percent: Math.round((1 - price / was) * 100), live: true };
  }
  const percent = discountOf(product);
  return { price, was: percent > 0 ? priceBeforeDiscount(price, percent) : null, percent, live: false };
};

export const monthlyPayment = (price: number | string, months = INSTALLMENT_MONTHS) => Math.ceil((Number(price) / months) * 100) / 100;

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
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  PAID: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  PROCESSING: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
  SHIPPED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
};

export const orderStatusDots: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500",
  PAID: "bg-blue-500",
  PROCESSING: "bg-violet-500",
  SHIPPED: "bg-sky-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

export const orderCode = (order: { id: string; orderNumber?: string | null }) =>
  order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`;
