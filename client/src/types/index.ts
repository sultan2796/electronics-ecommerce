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
  | "users:write"
  | "reviews:moderate"
  | "emails:read"
  | "settings:write";
export type StorageType = "SSD" | "NVME" | "HDD" | "EMMC" | "UFS";
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CARD" | "CASH_ON_DELIVERY";
export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc" | "bestsellers" | "rating";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  points?: number;
  avatarUrl?: string | null;
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
  avatarUrl?: string | null;
  _count: { orders: number };
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBlocked: boolean;
  points: number;
  createdAt: string;
  lastLoginAt: string | null;
  totalSpent: string | number;
  addresses: { id: string; fullName: string; phone: string; city: string; line1: string }[];
  _count: { orders: number; reviews: number; wishlist: number };
  orders: { id: string; orderNumber: string | null; status: OrderStatus; paymentStatus: PaymentStatus; total: string; createdAt: string }[];
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
  dimensions?: { width: number; height: number; depth: number; unit?: string } | null;
  color?: string | null;
  material?: string | null;
  model3d?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
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

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
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
  salePrice?: string | null;
  videoUrl?: string | null;
  videoPoster?: string | null;
  model3dUrl?: string | null;
  model3dActive?: boolean;
  model3dSize?: number | null;
  model3dLicense?: string | null;
  model3dSource?: string | null;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId: string;
  category?: Pick<Category, "id" | "name" | "slug">;
  specs: TechSpecification | null;
  ratingAverage?: number | null;
  compareAtPrice?: string | null;
  campaign?: { name: string; discountPercent: number; endsAt: string } | null;
  reviewCount?: number;
  variants?: ProductVariant[];
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

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  sku: string;
  price: string | null;
  basePrice?: string | null;
  compareAtPrice?: string | null;
  salePrice: string | null;
  stock: number;
  images: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  variant?: Pick<ProductVariant, "id" | "name" | "color" | "colorHex" | "size" | "sku"> | null;
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

export interface OrderStatusEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber?: string | null;
  guestEmail?: string | null;
  guestName?: string | null;
  statusHistory?: OrderStatusEvent[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  payments?: PaymentRecord[];
  total: string;
  subtotal?: string;
  discount?: string;
  shippingFee?: string;
  couponCode?: string | null;
  pointsUsed?: number;
  pointsEarned?: number;
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
  outOfStockCount?: number;
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
  salePrice?: number | null;
  videoUrl?: string | null;
  videoPoster?: string | null;
  model3dUrl?: string | null;
  model3dActive?: boolean;
  model3dSize?: number | null;
  model3dLicense?: string | null;
  model3dSource?: string | null;
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

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  author: string;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: Record<number, number>;
}

export interface ReviewPage extends Paginated<Review> {
  summary: ReviewSummary;
}

export interface MyReviewStatus {
  canReview: boolean;
  hasPurchased: boolean;
  review: Review | null;
}

export type ReviewSort = "newest" | "highest" | "lowest";

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  user: { name: string; email: string };
  product: { name: string; slug: string };
}

export type EmailStatus = "SENT" | "FAILED" | "LOGGED";

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: EmailStatus;
  provider: string;
  error: string | null;
  html: string | null;
  createdAt: string;
}

export interface SavedAddress extends ShippingAddress {
  id: string;
  label: string;
  isDefault: boolean;
}

export type CouponType = "PERCENT" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  minTotal: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponCheck {
  code: string;
  discount: string;
  subtotal: string;
  total: string;
}

export interface Campaign {
  id: string;
  name: string;
  discountPercent: number;
  categoryId: string | null;
  category?: { id: string; name: string; slug?: string } | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface SalesReport {
  totals: { revenue: number; orders: number; averageOrderValue: number };
  monthly: { month: string; revenue: number; orders: number; discount: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string; email: string; role: Role } | null;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  imageUrl: string;
  buttonText: string | null;
  buttonLink: string | null;
}

export interface AdminSlide extends HeroSlide {
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SlideInput = Omit<HeroSlide, "id"> & { isActive: boolean };
