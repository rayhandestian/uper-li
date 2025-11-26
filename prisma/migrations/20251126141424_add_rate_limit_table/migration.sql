-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "shortUrl" TEXT NOT NULL,
    "longUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "custom" BOOLEAN DEFAULT false,
    "customChanges" INTEGER DEFAULT 0,
    "customChangedAt" TIMESTAMP(6),
    "password" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'PREVIEW',
    "active" BOOLEAN DEFAULT true,
    "deactivatedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "lastVisited" TIMESTAMP(6),
    "visitCount" INTEGER DEFAULT 0,
    "qrCode" TEXT,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "nimOrUsername" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(6),
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "monthlyLinksCreated" INTEGER DEFAULT 0,
    "totalLinks" INTEGER DEFAULT 0,
    "lastReset" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorLoginCode" TEXT,
    "twoFactorSetupCode" TEXT,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetTime" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_shortUrl_key" ON "Link"("shortUrl");

-- CreateIndex
CREATE INDEX "idx_link_shorturl" ON "Link"("shortUrl");

-- CreateIndex
CREATE INDEX "idx_link_userid" ON "Link"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nimOrUsername_key" ON "User"("nimOrUsername");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_nimorusername" ON "User"("nimOrUsername");

-- CreateIndex
CREATE INDEX "idx_ratelimit_resettime" ON "RateLimit"("resetTime");

-- CreateIndex
CREATE INDEX "idx_ratelimit_identifier" ON "RateLimit"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_identifier_endpoint_key" ON "RateLimit"("identifier", "endpoint");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
