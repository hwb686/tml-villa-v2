/*
  Warnings:

  - You are about to drop the column `license_no` on the `car_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `car_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `car_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_type` on the `car_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `car_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `car_rentals` table. All the data in the column will be lost.
  - Added the required column `car_config_id` to the `car_rentals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `days` to the `car_rentals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room_number` to the `car_rentals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `car_rentals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "car_rentals" DROP CONSTRAINT "car_rentals_user_id_fkey";

-- AlterTable
ALTER TABLE "car_rentals" DROP COLUMN "license_no",
DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "preferred_type",
DROP COLUMN "remarks",
DROP COLUMN "user_id",
ADD COLUMN     "car_config_id" TEXT NOT NULL,
ADD COLUMN     "days" INTEGER NOT NULL,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "room_number" TEXT NOT NULL,
ADD COLUMN     "total_price" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "car_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "car_type" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_configs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "car_rentals" ADD CONSTRAINT "car_rentals_car_config_id_fkey" FOREIGN KEY ("car_config_id") REFERENCES "car_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
