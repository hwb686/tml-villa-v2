/*
  Warnings:

  - You are about to drop the column `house_order_id` on the `meal_orders` table. All the data in the column will be lost.
  - Added the required column `meal_config_id` to the `meal_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room_number` to the `meal_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `meal_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "meal_orders" DROP CONSTRAINT "meal_orders_house_order_id_fkey";

-- AlterTable
ALTER TABLE "meal_orders" DROP COLUMN "house_order_id",
ADD COLUMN     "meal_config_id" TEXT NOT NULL,
ADD COLUMN     "room_number" TEXT NOT NULL,
ADD COLUMN     "total_price" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "meal_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "meal_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_configs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meal_orders" ADD CONSTRAINT "meal_orders_meal_config_id_fkey" FOREIGN KEY ("meal_config_id") REFERENCES "meal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
