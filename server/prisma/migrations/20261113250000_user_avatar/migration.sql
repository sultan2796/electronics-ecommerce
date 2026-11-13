ALTER TABLE "User" ADD COLUMN "avatarId" TEXT;
CREATE UNIQUE INDEX "User_avatarId_key" ON "User"("avatarId");
ALTER TABLE "User" ADD CONSTRAINT "User_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
