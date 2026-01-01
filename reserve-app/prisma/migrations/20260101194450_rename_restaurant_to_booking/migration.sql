-- Rename tables from restaurant_* to booking_*

-- 1. Rename main tables
ALTER TABLE "restaurant_users" RENAME TO "booking_users";
ALTER TABLE "restaurant_staff" RENAME TO "booking_staff";
ALTER TABLE "restaurant_menus" RENAME TO "booking_menus";
ALTER TABLE "restaurant_reservations" RENAME TO "booking_reservations";
ALTER TABLE "restaurant_settings" RENAME TO "booking_settings";
ALTER TABLE "restaurant_staff_shifts" RENAME TO "booking_staff_shifts";
ALTER TABLE "restaurant_staff_vacations" RENAME TO "booking_staff_vacations";

-- 2. Update default tenant_id values from 'demo-restaurant' to 'demo-booking'
ALTER TABLE "booking_users" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';
ALTER TABLE "booking_staff" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';
ALTER TABLE "booking_menus" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';
ALTER TABLE "booking_reservations" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';
ALTER TABLE "booking_settings" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';
ALTER TABLE "booking_staff_shifts" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';
ALTER TABLE "booking_staff_vacations" ALTER COLUMN "tenant_id" SET DEFAULT 'demo-booking';

-- 3. Update existing tenant_id data from 'demo-restaurant' to 'demo-booking'
UPDATE "booking_users" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
UPDATE "booking_staff" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
UPDATE "booking_menus" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
UPDATE "booking_reservations" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
UPDATE "booking_settings" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
UPDATE "booking_staff_shifts" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
UPDATE "booking_staff_vacations" SET "tenant_id" = 'demo-booking' WHERE "tenant_id" = 'demo-restaurant';
