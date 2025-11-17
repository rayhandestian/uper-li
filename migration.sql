-- Database Migration Script for Raw SQL Implementation
-- This script creates the required tables for the UPer.li application
-- Run this on your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'STAFF', 'ADMIN')),
    "nimOrUsername" TEXT UNIQUE NOT NULL,
    password TEXT,
    "emailVerified" TIMESTAMP,
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "monthlyLinksCreated" INTEGER DEFAULT 0,
    "totalLinks" INTEGER DEFAULT 0,
    "lastReset" TIMESTAMP DEFAULT NOW(),
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "twoFactorSecret" TEXT,
    active BOOLEAN DEFAULT true
);

-- Create Link table
CREATE TABLE IF NOT EXISTS "Link" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "shortUrl" TEXT UNIQUE NOT NULL,
    "longUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    custom BOOLEAN DEFAULT false,
    customChanges INTEGER DEFAULT 0,
    "customChangedAt" TIMESTAMP,
    password TEXT,
    mode TEXT NOT NULL DEFAULT 'PREVIEW' CHECK (mode IN ('PREVIEW', 'DIRECT')),
    active BOOLEAN DEFAULT true,
    "deactivatedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "lastVisited" TIMESTAMP,
    "visitCount" INTEGER DEFAULT 0,
    "qrCode" TEXT
);

-- Create Visit table
CREATE TABLE IF NOT EXISTS "Visit" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "linkId" TEXT NOT NULL REFERENCES "Link"(id) ON DELETE CASCADE,
    "visitedAt" TIMESTAMP DEFAULT NOW(),
    ip TEXT,
    "userAgent" TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_nimOrUsername ON "User"("nimOrUsername");
CREATE INDEX IF NOT EXISTS idx_link_shortUrl ON "Link"("shortUrl");
CREATE INDEX IF NOT EXISTS idx_link_userId ON "Link"("userId");
CREATE INDEX IF NOT EXISTS idx_visit_linkId ON "Visit"("linkId");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_updated_at BEFORE UPDATE ON "Link"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (optional - remove in production)
-- INSERT INTO "User" (email, "nimOrUsername", role, password, active)
-- VALUES ('admin@universitaspertamina.ac.id', 'admin', 'ADMIN', '$2b$12$...hashed_password...', true)
-- ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE "User" IS 'User accounts for the UPer.li application';
COMMENT ON TABLE "Link" IS 'Shortened links created by users';
COMMENT ON TABLE "Visit" IS 'Visit tracking for shortened links';

-- Add missing columns to existing Link table (for schema updates)
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "customChanges" INTEGER DEFAULT 0;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "customChangedAt" TIMESTAMP;