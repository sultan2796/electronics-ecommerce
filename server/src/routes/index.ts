import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { cartRouter } from "./cart.routes";
import { categoryRouter } from "./category.routes";
import { orderRouter } from "./order.routes";
import { paymentRouter } from "./payment.routes";
import { productRouter } from "./product.routes";
import { wishlistRouter } from "./wishlist.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/wishlist", wishlistRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin", adminRouter);
