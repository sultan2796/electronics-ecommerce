import { PrismaClient, Role, StorageType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Qulaqlıqlar", slug: "headsets" },
  { name: "Simsiz qulaqcıqlar", slug: "earphones" },
  { name: "Kabellər", slug: "cables" },
  { name: "Noutbuklar", slug: "laptops" },
  { name: "Smartfonlar", slug: "smartphones" },
  { name: "Planşetlər", slug: "tablets" },
  { name: "Monitorlar", slug: "monitors" },
  { name: "Masaüstü kompüterlər", slug: "desktops" },
  { name: "Aksesuarlar", slug: "accessories" },
  { name: "Oyun aksesuarları", slug: "gaming-accessories" },
];

const products = [
  {
    name: "JBL Club Pro",
    slug: "jbl-club-pro",
    sku: "HDS-JBL-CLUBPRO",
    brand: "JBL",
    description: "Aktiv səs-küy azaltma funksiyalı, 40 saata qədər işləyən simsiz qulaqlıq. Studiya keyfiyyətli səs və rahat yastıqlar.",
    price: 500,
    stock: 15,
    category: "headsets",
    images: ["/figma/jbl.webp"],
    specs: { batteryMah: 800, weightGrams: 284, connectivity: ["Bluetooth 5.0", "3.5mm", "USB-C"] },
  },
  {
    name: "Airpods Max",
    slug: "airpods-max",
    sku: "HDS-APL-APMAX",
    brand: "Apple",
    description: "Hesablama audiosu ilə yüksək səviyyəli qulaqlıq: aktiv səs-küy azaltma, şəffaflıq rejimi və məkan səsi. 20 saata qədər batareya.",
    price: 700,
    stock: 9,
    category: "headsets",
    images: ["/figma/beats.webp"],
    specs: { batteryMah: 664, weightGrams: 385, connectivity: ["Bluetooth 5.0", "USB-C"] },
  },
  {
    name: "Beats Studio Pro",
    slug: "beats-studio-pro",
    sku: "HDS-BTS-STUDIOPRO",
    brand: "Beats",
    description: "Tam uyğunlaşan səs-küy azaltma, şəxsi məkan səsi və USB-C ilə itkisiz audio dəstəyi.",
    price: 650,
    stock: 6,
    category: "headsets",
    images: ["/figma/f1.webp"],
    specs: { batteryMah: 700, weightGrams: 260, connectivity: ["Bluetooth 5.3", "3.5mm", "USB-C"] },
  },
  {
    name: "AirPods Pro 2",
    slug: "airpods-pro-2",
    sku: "EAR-APL-APP2",
    brand: "Apple",
    description: "Aktiv səs-küy azaltma və uyğunlaşan audio ilə simsiz qulaqcıqlar.",
    price: 449,
    stock: 18,
    category: "earphones",
    specs: { batteryMah: 523, weightGrams: 51, connectivity: ["Bluetooth 5.3", "USB-C"] },
  },
  {
    name: "Anker USB-C kabel 2 m",
    slug: "anker-usb-c-cable-2m",
    sku: "CBL-ANK-USBC2M",
    brand: "Anker",
    description: "100W sürətli şarj dəstəkli, hörülmüş USB-C – USB-C kabel.",
    price: 29,
    stock: 50,
    category: "cables",
    specs: { weightGrams: 60, connectivity: ["USB-C"] },
  },
  {
    name: "MacBook Air 13 M3",
    slug: "macbook-air-13-m3",
    sku: "LAP-APL-MBA13-M3",
    brand: "Apple",
    description: "Yüngül və səssiz noutbuk, uzun batareya ömrü ilə.",
    price: 2399,
    stock: 14,
    category: "laptops",
    specs: { cpu: "Apple M3", gpu: "Apple 10-core GPU", ramGb: 16, storageGb: 512, storageType: StorageType.SSD, screenSizeInch: 13.6, resolution: "2560x1664", refreshRateHz: 60, batteryMah: 4400, os: "macOS", weightGrams: 1240, connectivity: ["Wi-Fi 6E", "Bluetooth 5.3", "USB-C"] },
  },
  {
    name: "Dell XPS 15 9530",
    slug: "dell-xps-15-9530",
    sku: "LAP-DEL-XPS15-9530",
    brand: "Dell",
    description: "Yaradıcı işlər üçün güclü 15 düymlük noutbuk.",
    price: 3199,
    stock: 6,
    category: "laptops",
    specs: { cpu: "Intel Core i7-13700H", gpu: "NVIDIA RTX 4060", ramGb: 32, storageGb: 1024, storageType: StorageType.NVME, screenSizeInch: 15.6, resolution: "3456x2160", refreshRateHz: 60, batteryMah: 7800, os: "Windows 11", weightGrams: 1860, connectivity: ["Wi-Fi 6E", "Bluetooth 5.3", "Thunderbolt 4"] },
  },
  {
    name: "Lenovo Legion 5 Pro",
    slug: "lenovo-legion-5-pro",
    sku: "LAP-LEN-LEG5P",
    brand: "Lenovo",
    description: "Yüksək yenilənmə tezlikli ekranlı oyun noutbuku.",
    price: 2799,
    stock: 3,
    category: "laptops",
    specs: { cpu: "AMD Ryzen 7 7745HX", gpu: "NVIDIA RTX 4070", ramGb: 16, storageGb: 1024, storageType: StorageType.NVME, screenSizeInch: 16, resolution: "2560x1600", refreshRateHz: 240, batteryMah: 5300, os: "Windows 11", weightGrams: 2500, connectivity: ["Wi-Fi 6", "Bluetooth 5.1", "USB-C", "HDMI 2.1"] },
  },
  {
    name: "ASUS Vivobook 15",
    slug: "asus-vivobook-15",
    sku: "LAP-ASU-VB15",
    brand: "ASUS",
    description: "Gündəlik iş və təhsil üçün sərfəli noutbuk.",
    price: 1099,
    stock: 22,
    category: "laptops",
    specs: { cpu: "Intel Core i5-1235U", gpu: "Intel Iris Xe", ramGb: 8, storageGb: 512, storageType: StorageType.SSD, screenSizeInch: 15.6, resolution: "1920x1080", refreshRateHz: 60, batteryMah: 4200, os: "Windows 11", weightGrams: 1700, connectivity: ["Wi-Fi 6", "Bluetooth 5.0", "USB-C", "HDMI"] },
  },
  {
    name: "iPhone 16 Pro",
    slug: "iphone-16-pro",
    sku: "PHN-APL-IP16P-256",
    brand: "Apple",
    description: "Titan korpuslu flaqman smartfon.",
    price: 2499,
    stock: 18,
    category: "smartphones",
    specs: { cpu: "Apple A18 Pro", gpu: "Apple 6-core GPU", ramGb: 8, storageGb: 256, storageType: StorageType.UFS, screenSizeInch: 6.3, resolution: "2622x1206", refreshRateHz: 120, batteryMah: 3582, os: "iOS", weightGrams: 199, connectivity: ["5G", "Wi-Fi 7", "Bluetooth 5.3", "NFC", "USB-C"] },
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra",
    sku: "PHN-SAM-S24U-512",
    brand: "Samsung",
    description: "S Pen dəstəkli böyük ekranlı flaqman.",
    price: 2699,
    stock: 9,
    category: "smartphones",
    specs: { cpu: "Snapdragon 8 Gen 3", gpu: "Adreno 750", ramGb: 12, storageGb: 512, storageType: StorageType.UFS, screenSizeInch: 6.8, resolution: "3120x1440", refreshRateHz: 120, batteryMah: 5000, os: "Android", weightGrams: 232, connectivity: ["5G", "Wi-Fi 7", "Bluetooth 5.3", "NFC", "USB-C"] },
  },
  {
    name: "Google Pixel 9",
    slug: "google-pixel-9",
    sku: "PHN-GOO-PX9-128",
    brand: "Google",
    description: "Təmiz Android və güclü kamera.",
    price: 1599,
    stock: 0,
    category: "smartphones",
    specs: { cpu: "Google Tensor G4", gpu: "Mali-G715", ramGb: 12, storageGb: 128, storageType: StorageType.UFS, screenSizeInch: 6.3, resolution: "2424x1080", refreshRateHz: 120, batteryMah: 4700, os: "Android", weightGrams: 198, connectivity: ["5G", "Wi-Fi 7", "Bluetooth 5.3", "NFC"] },
  },
  {
    name: "iPad Air 11 M2",
    slug: "ipad-air-11-m2",
    sku: "TAB-APL-IPA11-M2",
    brand: "Apple",
    description: "Peşəkar işlər üçün yüngül planşet.",
    price: 1499,
    stock: 11,
    category: "tablets",
    specs: { cpu: "Apple M2", gpu: "Apple 10-core GPU", ramGb: 8, storageGb: 128, storageType: StorageType.SSD, screenSizeInch: 11, resolution: "2360x1640", refreshRateHz: 60, batteryMah: 7606, os: "iPadOS", weightGrams: 462, connectivity: ["Wi-Fi 6E", "Bluetooth 5.3", "USB-C"] },
  },
  {
    name: "LG UltraGear 27GP850",
    slug: "lg-ultragear-27gp850",
    sku: "MON-LG-27GP850",
    brand: "LG",
    description: "27 düymlük Nano IPS oyun monitoru.",
    price: 899,
    stock: 7,
    category: "monitors",
    specs: { screenSizeInch: 27, resolution: "2560x1440", refreshRateHz: 180, connectivity: ["HDMI 2.0", "DisplayPort 1.4", "USB 3.0"] },
  },
  {
    name: "iMac 24 M3",
    slug: "imac-24-m3",
    sku: "DSK-APL-IMAC24-M3",
    brand: "Apple",
    description: "4.5K Retina ekranlı hamısı-birində masaüstü kompüter.",
    price: 2899,
    stock: 5,
    category: "desktops",
    specs: { cpu: "Apple M3", gpu: "Apple 10-core GPU", ramGb: 16, storageGb: 512, storageType: StorageType.SSD, screenSizeInch: 24, resolution: "4480x2520", refreshRateHz: 60, os: "macOS", weightGrams: 4430, connectivity: ["Wi-Fi 6E", "Bluetooth 5.3", "Thunderbolt 4"] },
  },
  {
    name: "HP Victus 15L Gaming",
    slug: "hp-victus-15l-gaming",
    sku: "DSK-HP-VIC15L",
    brand: "HP",
    description: "Oyun və montaj üçün kompakt masaüstü kompüter.",
    price: 1999,
    stock: 8,
    category: "desktops",
    specs: { cpu: "Intel Core i5-13400F", gpu: "NVIDIA RTX 4060", ramGb: 16, storageGb: 1024, storageType: StorageType.NVME, os: "Windows 11", weightGrams: 5900, connectivity: ["Wi-Fi 6", "Bluetooth 5.3", "HDMI 2.1", "USB-C"] },
  },
  {
    name: "Apple Magic Keyboard",
    slug: "apple-magic-keyboard",
    sku: "ACC-APL-MKB",
    brand: "Apple",
    description: "Simsiz, yenidən doldurulan nazik klaviatura.",
    price: 199,
    stock: 30,
    category: "accessories",
    specs: { weightGrams: 239, connectivity: ["Bluetooth", "USB-C"] },
  },
  {
    name: "Logitech MX Master 3S",
    slug: "logitech-mx-master-3s",
    sku: "ACC-LOG-MXM3S",
    brand: "Logitech",
    description: "Səssiz düymələrli ergonomik simsiz siçan.",
    price: 249,
    stock: 25,
    category: "accessories",
    specs: { batteryMah: 500, weightGrams: 141, connectivity: ["Bluetooth", "Logi Bolt", "USB-C"] },
  },
  {
    name: "Sony DualSense",
    slug: "sony-dualsense",
    sku: "GAM-SNY-DS5",
    brand: "Sony",
    description: "Haptik geri bildirimli simsiz oyun pultu.",
    price: 159,
    stock: 20,
    category: "gaming-accessories",
    specs: { batteryMah: 1560, weightGrams: 280, connectivity: ["Bluetooth 5.1", "USB-C"] },
  },
  {
    name: "Razer BlackShark V2 Pro",
    slug: "razer-blackshark-v2-pro",
    sku: "GAM-RZR-BSV2P",
    brand: "Razer",
    description: "Oyunçular üçün simsiz qulaqlıq.",
    price: 399,
    stock: 4,
    category: "gaming-accessories",
    specs: { batteryMah: 1500, weightGrams: 320, connectivity: ["2.4 GHz", "Bluetooth", "USB-C"] },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Admin12345!", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin", passwordHash, role: Role.ADMIN },
  });

  const staffPasswordHash = await bcrypt.hash("Staff12345!", 12);
  for (const staff of [
    { email: "manager@example.com", name: "Anbar meneceri", role: Role.MANAGER },
    { email: "support@example.com", name: "Dəstək əməkdaşı", role: Role.SUPPORT },
  ]) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: { role: staff.role, name: staff.name },
      create: { ...staff, passwordHash: staffPasswordHash },
    });
  }

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({ where: { slug: category.slug }, update: { name: category.name }, create: category });
    categoryIds.set(category.slug, saved.id);
  }

  for (const entry of products) {
    const { category, specs, ...product } = entry;
    const categoryId = categoryIds.get(category);
    if (!categoryId) continue;
    const images: string[] = "images" in entry && entry.images ? entry.images : [];
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, images, isActive: true, categoryId, specs: { upsert: { create: specs, update: specs } } },
      create: { ...product, images, categoryId, specs: { create: specs } },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
