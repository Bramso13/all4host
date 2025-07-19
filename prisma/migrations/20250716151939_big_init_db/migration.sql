-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'occupied', 'maintenance', 'reserved');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('received', 'processing', 'delivery', 'completed', 'returned');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('cleaning', 'maintenance', 'housekeeping', 'laundry');

-- CreateEnum
CREATE TYPE "ServiceUserStatus" AS ENUM ('active', 'inactive');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'agent';

-- CreateTable
CREATE TABLE "ConciergerieManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConciergerieManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conciergerieManagerId" TEXT,
    "agentId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'available',
    "location" TEXT,
    "surface" DOUBLE PRECISION,
    "numberOfRooms" INTEGER,
    "numberOfBathrooms" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conciergerieManagerId" TEXT NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "client" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conciergerieManagerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSession" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "MaintenanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningSession" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cleaningId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,

    CONSTRAINT "CleaningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cleaning" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cleaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "client" TEXT,
    "site" TEXT,
    "surface" DOUBLE PRECISION,
    "type" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cleaningManagerId" TEXT NOT NULL,

    CONSTRAINT "InterventionSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteCleaningSession" (
    "id" TEXT NOT NULL,
    "interventionSiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cleaningManagerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,
    "status" "InterventionStatus" NOT NULL DEFAULT 'planned',
    "laundryManagerId" TEXT,
    "cleaningAgentId" TEXT,

    CONSTRAINT "SiteCleaningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningAgent" (
    "id" TEXT NOT NULL,
    "cleaningManagerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaundryManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaundryManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "stock" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "laundryManagerId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'received',
    "receivedDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "client" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "total" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "laundryManagerId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "priority" TEXT,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "method" TEXT,
    "status" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "cleaningSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "maintenanceSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteCleaningPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "siteCleaningSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCleaningPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningChecklist" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "cleaningSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteCleaningChecklist" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "siteCleaningSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCleaningChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningPlanning" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "interventionSiteId" TEXT NOT NULL,
    "cleaningManagerId" TEXT NOT NULL,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningPlanning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "laundryManagerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT,
    "userId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ServiceUserStatus" NOT NULL DEFAULT 'active',
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ServiceUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConciergerieManager" ADD CONSTRAINT "ConciergerieManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_conciergerieManagerId_fkey" FOREIGN KEY ("conciergerieManagerId") REFERENCES "ConciergerieManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_conciergerieManagerId_fkey" FOREIGN KEY ("conciergerieManagerId") REFERENCES "ConciergerieManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_conciergerieManagerId_fkey" FOREIGN KEY ("conciergerieManagerId") REFERENCES "ConciergerieManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSession" ADD CONSTRAINT "MaintenanceSession_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSession" ADD CONSTRAINT "MaintenanceSession_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSession" ADD CONSTRAINT "MaintenanceSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSession" ADD CONSTRAINT "CleaningSession_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSession" ADD CONSTRAINT "CleaningSession_cleaningId_fkey" FOREIGN KEY ("cleaningId") REFERENCES "Cleaning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSession" ADD CONSTRAINT "CleaningSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningManager" ADD CONSTRAINT "CleaningManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionSite" ADD CONSTRAINT "InterventionSite_cleaningManagerId_fkey" FOREIGN KEY ("cleaningManagerId") REFERENCES "CleaningManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningSession" ADD CONSTRAINT "SiteCleaningSession_interventionSiteId_fkey" FOREIGN KEY ("interventionSiteId") REFERENCES "InterventionSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningSession" ADD CONSTRAINT "SiteCleaningSession_cleaningManagerId_fkey" FOREIGN KEY ("cleaningManagerId") REFERENCES "CleaningManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningSession" ADD CONSTRAINT "SiteCleaningSession_laundryManagerId_fkey" FOREIGN KEY ("laundryManagerId") REFERENCES "LaundryManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningSession" ADD CONSTRAINT "SiteCleaningSession_cleaningAgentId_fkey" FOREIGN KEY ("cleaningAgentId") REFERENCES "CleaningAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAgent" ADD CONSTRAINT "CleaningAgent_cleaningManagerId_fkey" FOREIGN KEY ("cleaningManagerId") REFERENCES "CleaningManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryManager" ADD CONSTRAINT "LaundryManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_laundryManagerId_fkey" FOREIGN KEY ("laundryManagerId") REFERENCES "LaundryManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_laundryManagerId_fkey" FOREIGN KEY ("laundryManagerId") REFERENCES "LaundryManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPhoto" ADD CONSTRAINT "PropertyPhoto_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningPhoto" ADD CONSTRAINT "CleaningPhoto_cleaningSessionId_fkey" FOREIGN KEY ("cleaningSessionId") REFERENCES "CleaningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePhoto" ADD CONSTRAINT "MaintenancePhoto_maintenanceSessionId_fkey" FOREIGN KEY ("maintenanceSessionId") REFERENCES "MaintenanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningPhoto" ADD CONSTRAINT "SiteCleaningPhoto_siteCleaningSessionId_fkey" FOREIGN KEY ("siteCleaningSessionId") REFERENCES "SiteCleaningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPhoto" ADD CONSTRAINT "TicketPhoto_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningChecklist" ADD CONSTRAINT "CleaningChecklist_cleaningSessionId_fkey" FOREIGN KEY ("cleaningSessionId") REFERENCES "CleaningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningChecklist" ADD CONSTRAINT "SiteCleaningChecklist_siteCleaningSessionId_fkey" FOREIGN KEY ("siteCleaningSessionId") REFERENCES "SiteCleaningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningPlanning" ADD CONSTRAINT "CleaningPlanning_interventionSiteId_fkey" FOREIGN KEY ("interventionSiteId") REFERENCES "InterventionSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningPlanning" ADD CONSTRAINT "CleaningPlanning_cleaningManagerId_fkey" FOREIGN KEY ("cleaningManagerId") REFERENCES "CleaningManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningPlanning" ADD CONSTRAINT "CleaningPlanning_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_laundryManagerId_fkey" FOREIGN KEY ("laundryManagerId") REFERENCES "LaundryManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUser" ADD CONSTRAINT "ServiceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUser" ADD CONSTRAINT "ServiceUser_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
