-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATETIME,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" TEXT,
    "preferences" JSONB,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "dateOfBirth", "email", "firstName", "gender", "id", "isVerified", "lastName", "name", "password", "phone", "preferences", "provider", "providerId", "role", "updatedAt") SELECT "avatar", "createdAt", "dateOfBirth", "email", "firstName", "gender", "id", "isVerified", "lastName", "name", "password", "phone", "preferences", "provider", "providerId", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
