-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "completedByDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedByPassenger" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
