import { prisma } from "../config/prisma";
import { importCatalog } from "../services/catalogImport.service";

const keepDemo = process.argv.includes("--keep-demo");

importCatalog({ replaceDemo: !keepDemo })
  .then((result) => {
    console.log("İdxal tamamlandı:", result);
  })
  .catch((error) => {
    console.error("İdxal alınmadı:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
