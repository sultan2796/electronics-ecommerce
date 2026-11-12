import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { bootstrap } from "./services/bootstrap.service";
import { startCampaignRefresher } from "./services/campaign.service";
import { remindAbandonedCarts } from "./services/jobs.service";
import { expireUnpaidOrders } from "./services/order.service";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API ready on port ${env.PORT}`);
  void bootstrap();
});

const EXPIRY_INTERVAL_MS = 5 * 60 * 1000;

const runExpiry = () => {
  expireUnpaidOrders()
    .then((count) => {
      if (count > 0) console.log(`${count} ödənilməmiş sifariş avtomatik ləğv edildi`);
    })
    .catch((error) => console.error("Ödənilməmiş sifarişlərin yoxlanması alınmadı", error));
};

const expiryTimer = setInterval(runExpiry, EXPIRY_INTERVAL_MS);
runExpiry();

const campaignTimer = startCampaignRefresher();
const cartTimer = setInterval(() => {
  remindAbandonedCarts()
    .then((count) => {
      if (count > 0) console.log(`${count} tərk edilmiş səbət üçün xatırlatma göndərildi`);
    })
    .catch((error) => console.error("Səbət xatırlatması alınmadı", error));
}, 60 * 60 * 1000);

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  clearInterval(expiryTimer);
  clearInterval(campaignTimer);
  clearInterval(cartTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
