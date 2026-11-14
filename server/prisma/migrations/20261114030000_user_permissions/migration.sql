ALTER TABLE "User" ADD COLUMN "extraPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "revokedPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
