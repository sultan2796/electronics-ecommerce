import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { cartRouter } from "./cart.routes";
import { categoryRouter } from "./category.routes";
import { orderRouter } from "./order.routes";
import { guestOrderRouter } from "./guestOrder.routes";
import { paymentRouter } from "./payment.routes";
import { productRouter } from "./product.routes";
import { reviewRouter } from "./review.routes";
import { extraRouter } from "./extra.routes";
import { growthRouter } from "./growth.routes";
import { slideRouter } from "./slide.routes";
import { settingsRouter } from "./settings.routes";
import { wishlistRouter } from "./wishlist.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
apiRouter.use(extraRouter);
apiRouter.use(growthRouter);
apiRouter.use(slideRouter);
apiRouter.use(settingsRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/wishlist", wishlistRouter);
apiRouter.use(guestOrderRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin", adminRouter);
