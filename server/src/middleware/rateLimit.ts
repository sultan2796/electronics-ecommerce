import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çox sayda cəhd. Bir az sonra yenidən yoxlayın." },
});

export const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çox sayda kupon yoxlaması. Bir az sonra yenidən cəhd edin." },
});

export const contentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çox sayda göndəriş. Bir az sonra yenidən cəhd edin." },
});
