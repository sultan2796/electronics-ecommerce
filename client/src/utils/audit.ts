export const auditActionLabels: Record<string, string> = {
  "slide.create": "Slayd əlavə edildi",
  "slide.update": "Slayd yeniləndi",
  "slide.delete": "Slayd silindi",
  "slide.reorder": "Slaydların sırası dəyişdi",
  "settings.update": "Sayt parametrləri yeniləndi",
  "order.status": "Sifariş statusu dəyişdi",
  "product.stock": "Stok yeniləndi",
  "product.create": "Məhsul yaradıldı",
  "product.update": "Məhsul redaktə edildi",
  "product.deactivate": "Məhsul deaktiv edildi",
  "category.create": "Kateqoriya yaradıldı",
  "category.update": "Kateqoriya redaktə edildi",
  "category.delete": "Kateqoriya silindi",
  "coupon.create": "Promo kod yaradıldı",
  "coupon.update": "Promo kod dəyişdi",
  "coupon.delete": "Promo kod silindi",
  "campaign.create": "Kampaniya yaradıldı",
  "campaign.update": "Kampaniya dəyişdi",
  "campaign.delete": "Kampaniya silindi",
  "user.update": "İstifadəçi dəyişdi",
};

export const describeAudit = (action: string) => auditActionLabels[action] ?? (action.startsWith("product.bulk.") ? "Toplu məhsul əməliyyatı" : action);
