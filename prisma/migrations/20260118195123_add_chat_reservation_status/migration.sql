/*
  Warnings:

  - You are about to drop the column `driverAccepted` on the `TripReservation` table. All the data in the column will be lost.
  - You are about to drop the column `passengerAccepted` on the `TripReservation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "status" "ChatStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TripReservation" DROP COLUMN "driverAccepted",
DROP COLUMN "passengerAccepted",
ADD COLUMN     "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING';
