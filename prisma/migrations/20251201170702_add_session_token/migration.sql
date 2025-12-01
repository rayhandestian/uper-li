-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionToken" TEXT,
ADD COLUMN     "sessionTokenExpires" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(6),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(6),
    "passwordChangedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "revokedAt" TIMESTAMP(6),

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminVerificationAttempt" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "adminId" TEXT NOT NULL,
    "attemptType" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminVerificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "idx_admin_email" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "idx_admin_active" ON "Admin"("active");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "idx_adminsession_adminid" ON "AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "idx_adminsession_token" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "idx_adminsession_expires" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_auditlog_admin_time" ON "AdminAuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_auditlog_action_time" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "idx_auditlog_time" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "idx_adminverif_admin_type" ON "AdminVerificationAttempt"("adminId", "attemptType");

-- CreateIndex
CREATE INDEX "idx_adminverif_locked" ON "AdminVerificationAttempt"("lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AdminVerificationAttempt_adminId_attemptType_key" ON "AdminVerificationAttempt"("adminId", "attemptType");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminVerificationAttempt" ADD CONSTRAINT "AdminVerificationAttempt_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
