-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "restaurant_users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-restaurant',
    "auth_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_staff" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-restaurant',
    "name" TEXT NOT NULL,
    "role" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_menus" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-restaurant',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_reservations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-restaurant',
    "user_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "reserved_date" TIMESTAMP(3) NOT NULL,
    "reserved_time" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-restaurant',
    "store_name" TEXT NOT NULL,
    "store_email" TEXT,
    "store_phone" TEXT,
    "open_time" TEXT NOT NULL DEFAULT '09:00',
    "close_time" TEXT NOT NULL DEFAULT '20:00',
    "closed_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slot_duration" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_users_auth_id_key" ON "restaurant_users"("auth_id");

-- CreateIndex
CREATE INDEX "restaurant_users_tenant_id_idx" ON "restaurant_users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_users_tenant_id_email_key" ON "restaurant_users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "restaurant_staff_tenant_id_idx" ON "restaurant_staff"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_menus_tenant_id_idx" ON "restaurant_menus"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_reservations_tenant_id_idx" ON "restaurant_reservations"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_reservations_user_id_idx" ON "restaurant_reservations"("user_id");

-- CreateIndex
CREATE INDEX "restaurant_reservations_reserved_date_idx" ON "restaurant_reservations"("reserved_date");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_settings_tenant_id_key" ON "restaurant_settings"("tenant_id");

-- AddForeignKey
ALTER TABLE "restaurant_reservations" ADD CONSTRAINT "restaurant_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "restaurant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_reservations" ADD CONSTRAINT "restaurant_reservations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "restaurant_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_reservations" ADD CONSTRAINT "restaurant_reservations_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "restaurant_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
