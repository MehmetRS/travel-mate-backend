-- Migration SQL: Remove unique constraint from Vehicle.userId and add regular index

-- Drop the unique constraint on Vehicle.userId
DROP INDEX IF EXISTS "Vehicle_userId_key";

-- Add a regular index on Vehicle.userId for performance
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- Update the User table to change the relation from one-to-one to one-to-many
-- This requires dropping the existing constraint and recreating it properly

-- First, drop the existing foreign key constraint
ALTER TABLE "Vehicle" DROP CONSTRAINT IF EXISTS "Vehicle_userId_fkey";

-- Recreate the foreign key constraint
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
