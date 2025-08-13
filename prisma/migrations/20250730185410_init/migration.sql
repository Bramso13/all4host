-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('super_admin', 'pole_manager', 'property_owner', 'laundry_client', 'agent');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- CreateEnum
CREATE TYPE "public"."PoleType" AS ENUM ('conciergerie', 'cleaning', 'maintenance', 'laundry');

-- CreateEnum
CREATE TYPE "public"."PoleStatus" AS ENUM ('active', 'inactive', 'trial', 'expired');

-- CreateEnum
CREATE TYPE "public"."AgentType" AS ENUM ('cleaning', 'maintenance', 'laundry', 'concierge', 'multi_service');

-- CreateEnum
CREATE TYPE "public"."AgentAvailability" AS ENUM ('available', 'busy', 'offline', 'on_break', 'on_mission');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('available', 'occupied', 'maintenance', 'reserved', 'offline');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('confirmed', 'pending', 'cancelled', 'completed', 'in_progress', 'checked_in', 'checked_out');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled', 'paused', 'pending_validation');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('received', 'processing', 'ready', 'pickup_scheduled', 'in_delivery', 'delivered', 'completed', 'cancelled', 'returned');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('info', 'warning', 'error', 'success', 'task_assigned', 'status_update', 'payment_due', 'review_request', 'pole_activated', 'pole_expired');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'pending',
    "language" TEXT DEFAULT 'fr',
    "timezone" TEXT DEFAULT 'Europe/Paris',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."super_admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessNumber" TEXT,
    "vatNumber" TEXT,
    "billingAddress" TEXT NOT NULL,
    "billingCity" TEXT NOT NULL,
    "billingCountry" TEXT NOT NULL DEFAULT 'France',
    "billingPostal" TEXT NOT NULL,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'basic',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pole_subscriptions" (
    "id" TEXT NOT NULL,
    "poleType" "public"."PoleType" NOT NULL,
    "status" "public"."PoleStatus" NOT NULL DEFAULT 'inactive',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "lastBillingDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdminId" TEXT NOT NULL,

    CONSTRAINT "pole_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pole_manager_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poleType" "public"."PoleType" NOT NULL,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canManageAgents" BOOLEAN NOT NULL DEFAULT true,
    "canManageClients" BOOLEAN NOT NULL DEFAULT false,
    "canManageBilling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdminId" TEXT NOT NULL,

    CONSTRAINT "pole_manager_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_owner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT,
    "taxNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'France',
    "postal" TEXT,
    "preferredContactMethod" TEXT DEFAULT 'email',
    "receiveNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."laundry_client_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "defaultPickupAddress" TEXT,
    "defaultDeliveryAddress" TEXT NOT NULL,
    "preferredPickupTime" TEXT,
    "specialInstructions" TEXT,
    "creditLimit" DOUBLE PRECISION DEFAULT 0,
    "paymentTerms" INTEGER DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" "public"."AgentType" NOT NULL,
    "availability" "public"."AgentAvailability" NOT NULL DEFAULT 'offline',
    "employeeId" TEXT,
    "certifications" TEXT[],
    "currentLocation" JSONB,
    "serviceZones" TEXT[],
    "rating" DOUBLE PRECISION DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "responseTime" INTEGER,
    "workingHours" JSONB,
    "availabilityCalendar" JSONB,
    "hourlyRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level" TEXT,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "agent_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'available',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'France',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "surface" DOUBLE PRECISION,
    "numberOfRooms" INTEGER,
    "numberOfBedrooms" INTEGER,
    "numberOfBathrooms" INTEGER,
    "maxGuests" INTEGER,
    "floor" INTEGER,
    "hasElevator" BOOLEAN,
    "hasParking" BOOLEAN,
    "hasBalcony" BOOLEAN,
    "pricePerNight" DOUBLE PRECISION,
    "cleaningFee" DOUBLE PRECISION,
    "serviceFee" DOUBLE PRECISION,
    "securityDeposit" DOUBLE PRECISION,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "checkInTime" TEXT DEFAULT '15:00',
    "checkOutTime" TEXT DEFAULT '11:00',
    "cancellationPolicy" TEXT,
    "houseRules" TEXT,
    "accessInstructions" TEXT,
    "cleaningInstructions" TEXT,
    "maintenanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_features" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "property_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_reviews" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "cleaningFee" DOUBLE PRECISION,
    "serviceFee" DOUBLE PRECISION,
    "taxes" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "confirmationCode" TEXT,
    "bookingSource" TEXT,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_sessions" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "cleaningType" TEXT NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "agentNotes" TEXT,
    "ownerRating" DOUBLE PRECISION,
    "managerRating" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "cleaning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_checklists" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "cleaningSessionId" TEXT NOT NULL,

    CONSTRAINT "cleaning_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "caption" TEXT,
    "cleaningSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'open',
    "priority" "public"."TicketPriority" NOT NULL DEFAULT 'medium',
    "propertyId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "category" TEXT,
    "issueType" TEXT,
    "roomLocation" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "estimatedDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ticket_photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_sessions" (
    "id" TEXT NOT NULL,
    "sessionNumber" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "workDescription" TEXT,
    "agentNotes" TEXT,
    "laborCost" DOUBLE PRECISION,
    "materialsCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "ownerApproval" BOOLEAN,
    "managerApproval" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "maintenance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "maintenanceSessionId" TEXT NOT NULL,

    CONSTRAINT "maintenance_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "caption" TEXT,
    "maintenanceSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."laundry_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."laundry_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'received',
    "receivedDate" TIMESTAMP(3),
    "processedDate" TIMESTAMP(3),
    "readyDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "instructions" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxes" DOUBLE PRECISION,
    "deliveryFee" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "receivedByClient" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "laundry_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."laundry_order_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_notes" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "agentId" TEXT NOT NULL,
    "propertyId" TEXT,
    "reservationId" TEXT,
    "cleaningSessionId" TEXT,
    "maintenanceSessionId" TEXT,
    "ticketId" TEXT,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "propertyId" TEXT NOT NULL,
    "propertyOwnerId" TEXT NOT NULL,
    "monthlyFee" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION,
    "documentUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."super_admin_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "superAdminId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admin_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."super_admin_invoice_items" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "poleType" "public"."PoleType",
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "super_admin_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."laundry_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clientId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'info',
    "priority" TEXT DEFAULT 'medium',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "actionUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "super_admin_profiles_userId_key" ON "public"."super_admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pole_subscriptions_superAdminId_poleType_key" ON "public"."pole_subscriptions"("superAdminId", "poleType");

-- CreateIndex
CREATE UNIQUE INDEX "pole_manager_profiles_userId_key" ON "public"."pole_manager_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "property_owner_profiles_userId_key" ON "public"."property_owner_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_client_profiles_userId_key" ON "public"."laundry_client_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "public"."agent_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_employeeId_key" ON "public"."agent_profiles"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_confirmationCode_key" ON "public"."reservations"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketNumber_key" ON "public"."tickets"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_sessions_sessionNumber_key" ON "public"."maintenance_sessions"("sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_sessions_ticketId_key" ON "public"."maintenance_sessions"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_orders_orderNumber_key" ON "public"."laundry_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_notes_number_key" ON "public"."delivery_notes"("number");

-- CreateIndex
CREATE UNIQUE INDEX "property_contracts_contractNumber_key" ON "public"."property_contracts"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "super_admin_invoices_invoiceNumber_key" ON "public"."super_admin_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_invoices_invoiceNumber_key" ON "public"."laundry_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- AddForeignKey
ALTER TABLE "public"."super_admin_profiles" ADD CONSTRAINT "super_admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pole_subscriptions" ADD CONSTRAINT "pole_subscriptions_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."super_admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pole_manager_profiles" ADD CONSTRAINT "pole_manager_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pole_manager_profiles" ADD CONSTRAINT "pole_manager_profiles_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."super_admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_owner_profiles" ADD CONSTRAINT "property_owner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laundry_client_profiles" ADD CONSTRAINT "laundry_client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_profiles" ADD CONSTRAINT "agent_profiles_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_specialties" ADD CONSTRAINT "agent_specialties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."property_owner_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_features" ADD CONSTRAINT "property_features_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_photos" ADD CONSTRAINT "property_photos_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_reviews" ADD CONSTRAINT "property_reviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_sessions" ADD CONSTRAINT "cleaning_sessions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_sessions" ADD CONSTRAINT "cleaning_sessions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_sessions" ADD CONSTRAINT "cleaning_sessions_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_checklists" ADD CONSTRAINT "cleaning_checklists_cleaningSessionId_fkey" FOREIGN KEY ("cleaningSessionId") REFERENCES "public"."cleaning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_photos" ADD CONSTRAINT "cleaning_photos_cleaningSessionId_fkey" FOREIGN KEY ("cleaningSessionId") REFERENCES "public"."cleaning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_photos" ADD CONSTRAINT "ticket_photos_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_sessions" ADD CONSTRAINT "maintenance_sessions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_sessions" ADD CONSTRAINT "maintenance_sessions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_sessions" ADD CONSTRAINT "maintenance_sessions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_sessions" ADD CONSTRAINT "maintenance_sessions_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_materials" ADD CONSTRAINT "maintenance_materials_maintenanceSessionId_fkey" FOREIGN KEY ("maintenanceSessionId") REFERENCES "public"."maintenance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_photos" ADD CONSTRAINT "maintenance_photos_maintenanceSessionId_fkey" FOREIGN KEY ("maintenanceSessionId") REFERENCES "public"."maintenance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laundry_orders" ADD CONSTRAINT "laundry_orders_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."pole_manager_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laundry_orders" ADD CONSTRAINT "laundry_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."laundry_client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laundry_order_items" ADD CONSTRAINT "laundry_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."laundry_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laundry_order_items" ADD CONSTRAINT "laundry_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."laundry_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_notes" ADD CONSTRAINT "delivery_notes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."laundry_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_assignments" ADD CONSTRAINT "task_assignments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_contracts" ADD CONSTRAINT "property_contracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_contracts" ADD CONSTRAINT "property_contracts_propertyOwnerId_fkey" FOREIGN KEY ("propertyOwnerId") REFERENCES "public"."property_owner_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."super_admin_invoices" ADD CONSTRAINT "super_admin_invoices_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."super_admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."super_admin_invoice_items" ADD CONSTRAINT "super_admin_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."super_admin_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laundry_invoices" ADD CONSTRAINT "laundry_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."laundry_client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
