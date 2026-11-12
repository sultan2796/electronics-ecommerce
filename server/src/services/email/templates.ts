import { OrderStatus, PaymentMethod } from "@prisma/client";
import { clientUrl } from "../../config/env";

export interface EmailContent {
  template: string;
  subject: string;
  html: string;
  text: string;
}

interface Recipient {
  name: string;
}

interface OrderSummary {
  id: string;
  total: { toString(): string } | number | string;
  paymentMethod: PaymentMethod;
  items: { productName: string; quantity: number; unitPrice: { toString(): string } | number | string }[];
}

const BRAND = "#FE5E22";

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const money = (value: { toString(): string } | number | string) => `${Number(value.toString()).toFixed(2)} ₼`;

const orderCode = (id: string) => `#${id.slice(-8).toUpperCase()}`;

const layout = (title: string, body: string, cta?: { label: string; url: string }) => `<!doctype html>
<html lang="az">
<body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#0a090b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:${BRAND};padding:20px 32px;color:#ffffff;font-size:20px;font-weight:bold">ElectroShop</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(title)}</h1>
${body}
${
  cta
    ? `<p style="margin:28px 0 8px"><a href="${cta.url}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold">${escapeHtml(cta.label)}</a></p>`
    : ""
}
</td></tr>
<tr><td style="padding:20px 32px;background:#f9f9f9;color:#76757a;font-size:12px">Bu məktub avtomatik göndərilib. Suallarınız üçün bu məktuba cavab yazın.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const paragraph = (text: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">${text}</p>`;

const itemsTable = (order: OrderSummary) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;font-size:14px">
${order.items
  .map(
    (item) =>
      `<tr><td style="padding:8px 0;border-bottom:1px solid #eeeeee">${escapeHtml(item.productName)} × ${item.quantity}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eeeeee">${money(Number(item.unitPrice.toString()) * item.quantity)}</td></tr>`,
  )
  .join("")}
<tr><td style="padding:12px 0;font-weight:bold">Cəmi</td><td align="right" style="padding:12px 0;font-weight:bold;color:${BRAND}">${money(order.total)}</td></tr>
</table>`;

const itemsText = (order: OrderSummary) =>
  `${order.items.map((item) => `- ${item.productName} × ${item.quantity}`).join("\n")}\nCəmi: ${money(order.total)}`;

export const welcomeEmail = (user: Recipient): EmailContent => ({
  template: "welcome",
  subject: "ElectroShop-a xoş gəldiniz!",
  html: layout(
    `Xoş gəldiniz, ${user.name}!`,
    paragraph("Hesabınız uğurla yaradıldı. İndi məhsulları müqayisə edə, istək siyahısı yarada və sifariş verə bilərsiniz."),
    { label: "Alış-verişə başla", url: `${clientUrl}/products` },
  ),
  text: `Xoş gəldiniz, ${user.name}!\nHesabınız uğurla yaradıldı.\n${clientUrl}/products`,
});

export const orderConfirmationEmail = (user: Recipient, order: OrderSummary): EmailContent => {
  const payment =
    order.paymentMethod === PaymentMethod.CARD
      ? "Kartla ödənişiniz təsdiqlənəndən sonra sifarişiniz hazırlanmağa başlayacaq."
      : "Ödənişi sifarişi aldıqda kuryerə edəcəksiniz.";
  return {
    template: "order-confirmation",
    subject: `Sifarişiniz qəbul edildi ${orderCode(order.id)}`,
    html: layout(
      "Sifarişiniz qəbul edildi",
      paragraph(`Hörmətli ${escapeHtml(user.name)}, sifarişiniz üçün təşəkkür edirik.`) + itemsTable(order) + paragraph(payment),
      { label: "Sifarişə bax", url: `${clientUrl}/orders/${order.id}` },
    ),
    text: `Sifarişiniz qəbul edildi ${orderCode(order.id)}\n${itemsText(order)}\n${payment}\n${clientUrl}/orders/${order.id}`,
  };
};

export const paymentSucceededEmail = (user: Recipient, order: OrderSummary): EmailContent => ({
  template: "payment-succeeded",
  subject: `Ödəniş təsdiqləndi ${orderCode(order.id)}`,
  html: layout(
    "Ödənişiniz təsdiqləndi",
    paragraph(`Hörmətli ${escapeHtml(user.name)}, ${money(order.total)} məbləğində ödənişiniz uğurla qəbul edildi.`) +
      paragraph("Sifarişiniz hazırlanmağa göndərildi."),
    { label: "Sifarişə bax", url: `${clientUrl}/orders/${order.id}` },
  ),
  text: `Ödənişiniz təsdiqləndi ${orderCode(order.id)} — ${money(order.total)}\n${clientUrl}/orders/${order.id}`,
});

const statusMessages: Partial<Record<OrderStatus, { subject: string; title: string; body: string }>> = {
  PROCESSING: { subject: "Sifarişiniz hazırlanır", title: "Sifarişiniz hazırlanır", body: "Məhsullarınız qablaşdırılır və tezliklə göndəriləcək." },
  SHIPPED: { subject: "Sifarişiniz yoldadır", title: "Sifarişiniz göndərildi", body: "Kuryer sifarişinizi yola çıxardı. Telefonunuz açıq olsun." },
  DELIVERED: { subject: "Sifarişiniz çatdırıldı", title: "Sifarişiniz çatdırıldı", body: "Alış-verişiniz üçün təşəkkür edirik! Məhsullara rəy yazmağı unutmayın." },
  CANCELLED: { subject: "Sifarişiniz ləğv edildi", title: "Sifarişiniz ləğv edildi", body: "Sifarişiniz ləğv edildi. Kartdan pul çəkilibsə, bank tərəfindən geri qaytarılacaq." },
};

export const orderStatusEmail = (user: Recipient, order: OrderSummary, status: OrderStatus): EmailContent | null => {
  const message = statusMessages[status];
  if (!message) return null;
  return {
    template: `order-${status.toLowerCase()}`,
    subject: `${message.subject} ${orderCode(order.id)}`,
    html: layout(message.title, paragraph(`Hörmətli ${escapeHtml(user.name)},`) + paragraph(message.body) + itemsTable(order), {
      label: "Sifarişə bax",
      url: `${clientUrl}/orders/${order.id}`,
    }),
    text: `${message.title} ${orderCode(order.id)}\n${message.body}\n${clientUrl}/orders/${order.id}`,
  };
};

export const passwordResetEmail = (user: Recipient, link: string, ttlMinutes: number): EmailContent => ({
  template: "password-reset",
  subject: "Şifrənin bərpası",
  html: layout(
    "Şifrənizi bərpa edin",
    paragraph(`Hörmətli ${escapeHtml(user.name)}, hesabınız üçün şifrə bərpası istənildi.`) +
      paragraph(`Link ${ttlMinutes} dəqiqə ərzində və yalnız bir dəfə işləyir. Bunu siz istəməmisinizsə, məktubu nəzərə almayın.`),
    { label: "Yeni şifrə təyin et", url: link },
  ),
  text: `Şifrənizi bərpa etmək üçün linkə keçin (${ttlMinutes} dəqiqə etibarlıdır):\n${link}`,
});

export const passwordChangedEmail = (user: Recipient): EmailContent => ({
  template: "password-changed",
  subject: "Şifrəniz dəyişdirildi",
  html: layout(
    "Şifrəniz dəyişdirildi",
    paragraph(`Hörmətli ${escapeHtml(user.name)}, hesabınızın şifrəsi indicə dəyişdirildi və bütün cihazlardan çıxış edildi.`) +
      paragraph("Bunu siz etməmisinizsə, dərhal şifrə bərpası edin və bizimlə əlaqə saxlayın."),
    { label: "Daxil ol", url: `${clientUrl}/login` },
  ),
  text: `Şifrəniz dəyişdirildi. Bunu siz etməmisinizsə: ${clientUrl}/forgot-password`,
});

export const backInStockEmail = (user: Recipient, productName: string, url: string): EmailContent => ({
  template: "back-in-stock",
  subject: `${productName} yenidən stokdadır`,
  html: layout("Gözlədiyiniz məhsul stokdadır", paragraph(`Hörmətli ${escapeHtml(user.name)},`) + paragraph(`<strong>${escapeHtml(productName)}</strong> yenidən satışdadır. Tükənməmiş sifariş edin.`), { label: "Məhsula bax", url }),
  text: `${productName} yenidən stokdadır: ${url}`,
});
