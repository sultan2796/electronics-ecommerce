import { Permission, Role } from "../types";

export const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:read",
    "products:write",
    "inventory:write",
    "categories:write",
    "catalog:import",
    "orders:read",
    "orders:write",
    "users:read",
    "users:write",
    "reviews:moderate",
    "emails:read",
    "settings:write",
  ],
  MANAGER: ["dashboard:read", "products:write", "inventory:write", "categories:write", "catalog:import", "orders:read", "reviews:moderate"],
  SUPPORT: ["dashboard:read", "orders:read", "orders:write", "users:read", "reviews:moderate"],
  CUSTOMER: [],
};

export const adminOnlyGrants: Permission[] = ["users:write", "settings:write"];

export const permissionGroups: { title: string; items: { key: Permission; label: string; hint: string }[] }[] = [
  {
    title: "Ümumi",
    items: [{ key: "dashboard:read", label: "Admin panelə giriş", hint: "İcmal, analitika və bildirişləri görür" }],
  },
  {
    title: "Kataloq",
    items: [
      { key: "products:write", label: "Məhsulları idarə etmək", hint: "Məhsul yaratmaq, redaktə, variantlar, slaydlar, kampaniyalar" },
      { key: "inventory:write", label: "Anbar və stok", hint: "Stok miqdarlarını dəyişmək" },
      { key: "categories:write", label: "Kateqoriya və brendlər", hint: "Kateqoriya və brend yaratmaq, dəyişmək" },
      { key: "catalog:import", label: "Kataloq idxalı", hint: "Faylla toplu məhsul idxalı" },
    ],
  },
  {
    title: "Satış",
    items: [
      { key: "orders:read", label: "Sifarişlərə baxmaq", hint: "Sifarişlər və ödənişlər siyahısı" },
      { key: "orders:write", label: "Sifarişləri idarə etmək", hint: "Statusu dəyişmək, ləğv etmək, geri ödəniş qeydi" },
      { key: "reviews:moderate", label: "Rəy və suallar", hint: "Rəyləri silmək, suallara cavab vermək" },
    ],
  },
  {
    title: "Müştərilər və sistem",
    items: [
      { key: "users:read", label: "Müştərilərə baxmaq", hint: "Müştəri siyahısı və profilləri" },
      { key: "users:write", label: "İstifadəçiləri idarə etmək", hint: "Rol, blok və icazələr (yalnız admin verə bilər)" },
      { key: "emails:read", label: "E-poçt jurnalı", hint: "Göndərilən məktubların jurnalı" },
      { key: "settings:write", label: "Sayt parametrləri", hint: "Loqo, favicon, şəkil optimallaşdırması (yalnız admin verə bilər)" },
    ],
  },
];
