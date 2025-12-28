/*
  Warnings:

  - You are about to drop the column `district` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `village` on the `Address` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "GeneralSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bannerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bannerImage" TEXT,
    "paymentTimeLimit" INTEGER NOT NULL DEFAULT 5,
    "businessAddress" TEXT,
    "businessEmail" TEXT,
    "businessLogoUrl" TEXT,
    "printSize" TEXT NOT NULL DEFAULT 'a4',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "heroTagline" TEXT,
    "heroSubtitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "flashSaleId" TEXT,
    "auctionId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL,
    "minPurchase" DECIMAL,
    "maxDiscount" DECIMAL,
    "usageLimit" INTEGER,
    "usagePerUser" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "flashSaleOnly" BOOLEAN NOT NULL DEFAULT false,
    "auctionOnly" BOOLEAN NOT NULL DEFAULT false,
    "regularOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VoucherUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoucherUsage_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "villageId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "rtRwBlock" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "phone" TEXT NOT NULL,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Address" ("cityId", "createdAt", "districtId", "id", "isDefault", "label", "name", "notes", "phone", "postalCode", "provinceId", "rtRwBlock", "street", "updatedAt", "userId", "villageId") SELECT "cityId", "createdAt", "districtId", "id", "isDefault", "label", "name", "notes", "phone", "postalCode", "provinceId", "rtRwBlock", "street", "updatedAt", "userId", "villageId" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalAmount" DECIMAL NOT NULL,
    "paymentProof" TEXT,
    "shippingCode" TEXT,
    "shippingName" TEXT,
    "shippingCost" DECIMAL,
    "shippingCity" TEXT,
    "addressId" TEXT NOT NULL,
    "voucherId" TEXT,
    "discount" DECIMAL DEFAULT 0,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addressId", "createdAt", "expiresAt", "id", "paymentProof", "shippingCity", "shippingCode", "shippingCost", "status", "totalAmount", "updatedAt", "userId") SELECT "addressId", "createdAt", "expiresAt", "id", "paymentProof", "shippingCity", "shippingCode", "shippingCost", "status", "totalAmount", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");
