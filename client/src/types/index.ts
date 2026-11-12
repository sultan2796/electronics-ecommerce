export type Role = "CUSTOMER" | "SUPPORT" | "MANAGER" | "ADMIN";
export type Permission =
  | "dashboard:read"
  | "products:write"
  | "inventory:write"
  | "categories:write"
  | "catalog:import"
  | "orders:read"
  | "orders:write"
  | "users:read"
  | "users:write";
export type StorageType = "SSD" | "NVME" | "HDD" | "EMMC" | "UFS";
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CARD" | "CASH_ON_DELIVERY";
export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { orders: number };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface SpecExtra {
  source?: string;
  rating?: number | null;
  discountPercentage?: number | null;
  warranty?: string | null;
  shipping?: string | null;
  returnPolicy?: string | null;
}

export interface TechSpecification {
  cpu: string | null;
  gpu: string | null;
  ramGb: number | null;
  storageGb: number | null;
  storageType: StorageType | null;
  screenSizeInch: string | null;
  resolution: string | null;
  refreshRateHz: number | null;
  batteryMah: number | null;
  os: string | null;
  weightGrams: number | null;
  connectivity: string[];
  extra?: SpecExtra | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string;
  price: string;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId: string;
  category?: Pick<Category, "id" | "name" | "slug">;
  specs: TechSpecification | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Facets {
  brands: string[];
  ram: number[];
  storage: number[];
  storageTypes: StorageType[];
  os: string[];
  price: { min: number; max: number };
  screen: { min: number; max: number };
}

export interface ProductFilters {
  q: string;
  category: string;
  brand: string[];
  ram: string[];
  storage: string[];
  storageType: string[];
  os: string[];
  minPrice: string;
  maxPrice: string;
  minScreen: string;
  maxScreen: string;
  inStock: boolean;
  sort: ProductSort;
  page: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
}

export interface PaymentRecord {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount: string;
  createdAt: string;
}

export interface PaymentConfig {
  methods: PaymentMethod[];
  provider: string | null;
  testMode: boolean;
}

export interface CheckoutResult {
  order: Order;
  payment: { redirectUrl: string } | null;
  paymentError?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  payments?: PaymentRecord[];
  total: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  createdAt: string;
  user?: { name: string; email: string };
}

export interface ImportResult {
  source: string;
  categories: number;
  created: number;
  updated: number;
  deactivated: number;
}

export interface AdminProductSummary {
  id: string;
  name: string;
  images: string[];
  stock?: number;
  price?: string;
  sold?: number;
  category: { slug: string } | null;
}

export interface AdminStats {
  productCount: number;
  inactiveCount: number;
  lowStockCount: number;
  userCount: number;
  totalOrders: number;
  revenue: number;
  averageOrderValue: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  salesByDay: { date: string; revenue: number; orders: number }[];
  topProducts: AdminProductSummary[];
  lowStockProducts: AdminProductSummary[];
  categories: { name: string; slug: string; products: number }[];
  recentOrders: Order[];
}

export interface ProductPayload {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  specs?: {
    cpu?: string;
    gpu?: string;
    ramGb?: number;
    storageGb?: number;
    storageType?: StorageType;
    screenSizeInch?: number;
    resolution?: string;
    refreshRateHz?: number;
    batteryMah?: number;
    os?: string;
    weightGrams?: number;
    connectivity: string[];
  };
}
