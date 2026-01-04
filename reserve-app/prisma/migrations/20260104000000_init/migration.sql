-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "booking_users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "auth_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "memo" TEXT DEFAULT '',
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_staff" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_menus" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_reservations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "user_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "menu_id" TEXT NOT NULL,
    "reserved_date" TIMESTAMP(3) NOT NULL,
    "reserved_time" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT DEFAULT '',
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "store_name" TEXT NOT NULL,
    "store_email" TEXT,
    "store_phone" TEXT,
    "open_time" TEXT NOT NULL DEFAULT '09:00',
    "close_time" TEXT NOT NULL DEFAULT '20:00',
    "closed_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slot_duration" INTEGER NOT NULL DEFAULT 30,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "min_advance_booking_days" INTEGER NOT NULL DEFAULT 0,
    "max_advance_booking_days" INTEGER NOT NULL DEFAULT 90,
    "cancellation_deadline_hours" INTEGER NOT NULL DEFAULT 24,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_staff_shifts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "staff_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_staff_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_staff_vacations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "staff_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_staff_vacations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "enable_staff_selection" BOOLEAN NOT NULL DEFAULT false,
    "enable_staff_shift_management" BOOLEAN NOT NULL DEFAULT false,
    "enable_customer_management" BOOLEAN NOT NULL DEFAULT true,
    "enable_reservation_update" BOOLEAN NOT NULL DEFAULT false,
    "enable_reminder_email" BOOLEAN NOT NULL DEFAULT true,
    "enable_manual_reservation" BOOLEAN NOT NULL DEFAULT true,
    "enable_analytics_report" BOOLEAN NOT NULL DEFAULT true,
    "enable_repeat_rate_analysis" BOOLEAN NOT NULL DEFAULT false,
    "enable_coupon_feature" BOOLEAN NOT NULL DEFAULT false,
    "enable_line_notification" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_blocked_time_slots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "description" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_blocked_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'demo-booking',
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_users_auth_id_key" ON "booking_users"("auth_id");

-- CreateIndex
CREATE INDEX "booking_users_tenant_id_idx" ON "booking_users"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_users_role_idx" ON "booking_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "booking_users_tenant_id_email_key" ON "booking_users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "booking_staff_tenant_id_idx" ON "booking_staff"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_staff_tenant_id_email_key" ON "booking_staff"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "booking_menus_tenant_id_idx" ON "booking_menus"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_reservations_tenant_id_idx" ON "booking_reservations"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_reservations_user_id_idx" ON "booking_reservations"("user_id");

-- CreateIndex
CREATE INDEX "booking_reservations_reserved_date_idx" ON "booking_reservations"("reserved_date");

-- CreateIndex
CREATE INDEX "booking_reservations_tenant_id_user_id_idx" ON "booking_reservations"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "booking_reservations_tenant_id_staff_id_reserved_date_idx" ON "booking_reservations"("tenant_id", "staff_id", "reserved_date");

-- CreateIndex
CREATE INDEX "booking_reservations_tenant_id_status_idx" ON "booking_reservations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "booking_reservations_staff_id_reserved_date_status_idx" ON "booking_reservations"("staff_id", "reserved_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_settings_tenant_id_key" ON "booking_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_staff_shifts_tenant_id_idx" ON "booking_staff_shifts"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_staff_shifts_staff_id_idx" ON "booking_staff_shifts"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_staff_shifts_tenant_id_staff_id_day_of_week_key" ON "booking_staff_shifts"("tenant_id", "staff_id", "day_of_week");

-- CreateIndex
CREATE INDEX "booking_staff_vacations_tenant_id_idx" ON "booking_staff_vacations"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_staff_vacations_staff_id_idx" ON "booking_staff_vacations"("staff_id");

-- CreateIndex
CREATE INDEX "booking_staff_vacations_start_date_end_date_idx" ON "booking_staff_vacations"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_tenant_id_key" ON "feature_flags"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_blocked_time_slots_tenant_id_idx" ON "booking_blocked_time_slots"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_blocked_time_slots_start_date_time_end_date_time_idx" ON "booking_blocked_time_slots"("start_date_time", "end_date_time");

-- CreateIndex
CREATE INDEX "booking_blocked_time_slots_tenant_id_start_date_time_end_da_idx" ON "booking_blocked_time_slots"("tenant_id", "start_date_time", "end_date_time");

-- CreateIndex
CREATE INDEX "security_logs_tenant_id_idx" ON "security_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "security_logs_event_type_idx" ON "security_logs"("event_type");

-- CreateIndex
CREATE INDEX "security_logs_user_id_idx" ON "security_logs"("user_id");

-- CreateIndex
CREATE INDEX "security_logs_created_at_idx" ON "security_logs"("created_at");

-- CreateIndex
CREATE INDEX "security_logs_tenant_id_event_type_created_at_idx" ON "security_logs"("tenant_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "booking_reservations" ADD CONSTRAINT "booking_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "booking_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reservations" ADD CONSTRAINT "booking_reservations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "booking_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reservations" ADD CONSTRAINT "booking_reservations_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "booking_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_staff_shifts" ADD CONSTRAINT "booking_staff_shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "booking_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_staff_vacations" ADD CONSTRAINT "booking_staff_vacations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "booking_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
