export interface RecipientSource {
  userId: string | null;
  user?: { name: string; email: string } | null;
  guestEmail?: string | null;
  guestName?: string | null;
}

export const orderRecipient = (order: RecipientSource) => {
  if (order.user) return { name: order.user.name, email: order.user.email };
  if (order.guestEmail) return { name: order.guestName ?? "Hörmətli müştəri", email: order.guestEmail };
  return null;
};
