// Types EXACTS basés sur schema.prisma

export type PropertyStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "reserved"
  | "offline";
export type ReservationStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | "in_progress"
  | "checked_in"
  | "checked_out";
export type PoleType = "conciergerie" | "cleaning" | "maintenance" | "laundry";

// Property - Modèle EXACT du schema.prisma
export interface Property {
  id: string;
  name: string;
  description: string;
  status: PropertyStatus; // @default(available)

  // Localisation
  address: string;
  city: string;
  country: string; // @default("France")
  postalCode?: string;
  latitude?: number; // Float?
  longitude?: number; // Float?

  // Caractéristiques
  surface?: number; // Float?
  numberOfRooms?: number; // Int?
  numberOfBedrooms?: number; // Int?
  numberOfBathrooms?: number; // Int?
  maxGuests?: number; // Int?
  floor?: number; // Int?
  hasElevator?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;

  // Pricing
  pricePerNight?: number; // Float?
  cleaningFee?: number; // Float?
  serviceFee?: number; // Float?
  securityDeposit?: number; // Float?

  // Ratings
  averageRating?: number; // Float? @default(0)
  totalReviews: number; // Int @default(0)

  // Policies
  checkInTime?: string; // @default("15:00")
  checkOutTime?: string; // @default("11:00")
  cancellationPolicy?: string;
  houseRules?: string;

  // Instructions pour agents
  accessInstructions?: string;
  cleaningInstructions?: string;
  maintenanceNotes?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  ownerId: string;
  managerId?: string;

  // Relations étendues (optionnelles pour le contexte)
  owner?: PropertyOwnerProfile;
  manager?: PoleManagerProfile;
  features?: PropertyFeature[];
  photos?: PropertyPhoto[];
  reviews?: PropertyReview[];
  reservations?: Reservation[];
}

// PropertyFeature - Modèle EXACT du schema.prisma
export interface PropertyFeature {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  propertyId: string;
}

// PropertyPhoto - Modèle EXACT du schema.prisma
export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  isMain: boolean; // @default(false)
  order: number; // @default(0)
  type?: string;
  propertyId: string;
  createdAt: string;
}

// PropertyReview - Modèle EXACT du schema.prisma
export interface PropertyReview {
  id: string;
  rating: number; // Float
  comment?: string;
  guestName: string;
  guestEmail?: string;
  propertyId: string;
  createdAt: string;
}

// PropertyOwnerProfile - Modèle EXACT du schema.prisma
export interface PropertyOwnerProfile {
  id: string;
  userId: string;

  // Informations propriétaire
  company?: string;
  taxNumber?: string;

  // Adresse
  address?: string;
  city?: string;
  country?: string; // @default("France")
  postal?: string;

  // Préférences de communication
  preferredContactMethod?: string; // @default("email")
  receiveNotifications: boolean; // @default(true)

  createdAt: string;
  updatedAt: string;

  // Relations étendues pour l'affichage
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  properties?: Property[];
  contracts?: PropertyContract[];
}

// PoleManagerProfile - Modèle EXACT du schema.prisma
export interface PoleManagerProfile {
  id: string;
  userId: string;
  poleTypes: PoleType[];

  // Permissions spécifiques au pôle
  canViewAnalytics: boolean;
  canManageAgents: boolean;
  canManageClients: boolean;
  canManageBilling: boolean;

  createdAt: string;
  updatedAt: string;

  // Relations
  superAdminId: string;

  // Relations étendues pour l'affichage
  user?: User;
}

// Reservation - Modèle EXACT du schema.prisma
export interface Reservation {
  id: string;

  // Relations principales
  propertyId: string;
  managerId: string;

  // Informations invité
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCount: number; // Int @default(1)

  // Dates
  checkIn: string; // DateTime
  checkOut: string; // DateTime
  nights: number; // Int

  // Tarification
  basePrice: number; // Float
  cleaningFee?: number; // Float?
  serviceFee?: number; // Float?
  taxes?: number; // Float?
  totalPrice: number; // Float

  // Statut
  status: ReservationStatus; // @default(pending)
  notes?: string;

  // Références
  confirmationCode?: string; // @unique
  bookingSource?: string; // "direct", "airbnb", "booking.com"

  // Check-in/out
  checkInTime?: string; // DateTime?
  checkOutTime?: string; // DateTime?

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  property?: Property;
  manager?: PoleManagerProfile;
}

// TicketPhoto - Modèle EXACT du schema.prisma
export interface TicketPhoto {
  id: string;
  url: string;
  caption?: string;
  ticketId: string;
  createdAt: string;
}

// PropertyContract - Modèle EXACT du schema.prisma
export interface PropertyContract {
  id: string;
  contractNumber: string; // @unique
  type: string; // "property_management", "maintenance", "cleaning"
  status: string; // @default("active")

  startDate: string; // DateTime
  endDate?: string; // DateTime?

  // Relations
  propertyId: string;
  propertyOwnerId: string;

  // Termes financiers
  monthlyFee?: number; // Float?
  commissionRate?: number; // Float?

  // Documents
  documentUrl?: string;
  signedAt?: string; // DateTime?

  createdAt: string;
  updatedAt: string;

  // Relations étendues
  property?: Property;
  propertyOwner?: PropertyOwnerProfile;
}

// Types basés EXACTEMENT sur le schéma Prisma

// Enums from schema.prisma
export type AgentType =
  | "cleaning"
  | "maintenance"
  | "laundry"
  | "concierge"
  | "multi_service";
export type AgentAvailability =
  | "available"
  | "busy"
  | "offline"
  | "on_break"
  | "on_mission";
export type SessionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "paused"
  | "pending_validation";
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent" | "critical";

// User model (simplifié pour les relations)
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// PoleManagerProfile model (simplifié pour les relations)
export interface PoleManagerProfile {
  id: string;
  userId: string;
  poleTypes: PoleType[];
  canViewAnalytics: boolean;
  canManageAgents: boolean;
  canManageClients: boolean;
  canManageBilling: boolean;
  createdAt: string;
  updatedAt: string;
  superAdminId: string;
  user?: User;
}

// Property model (simplifié pour les relations)
export interface Property {
  id: string;
  name: string;
  description: string;
  status: "available" | "occupied" | "maintenance" | "reserved" | "offline";
  address: string;
  city: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

// AgentSpecialty - Modèle EXACT du schema.prisma
export interface AgentSpecialty {
  id: string;
  name: string;
  category?: string;
  level?: string; // "débutant", "intermédiaire", "expert"
  certified: boolean;
  agentId: string;
}

// MaintenanceMaterial - Modèle EXACT du schema.prisma
export interface MaintenanceMaterial {
  id: string;
  name: string;
  quantity: number; // Float
  unit: string;
  unitPrice: number; // Float
  totalPrice: number; // Float
  supplier?: string;
  maintenanceSessionId: string;
}

// MaintenancePhoto - Modèle EXACT du schema.prisma
export interface MaintenancePhoto {
  id: string;
  url: string;
  type?: string; // "before", "after", "problem", "solution"
  caption?: string;
  maintenanceSessionId: string;
  createdAt: string;
}

// CleaningSession - Modèle EXACT du schema.prisma
export interface CleaningSession {
  id: string;
  propertyId: string;
  agentId: string;
  scheduledDate: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  cleaningType: string; // "checkout", "maintenance", "deep", "regular"
  status: SessionStatus;
  notes?: string;
  agentNotes?: string;
  ownerRating?: number;
  managerRating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  property?: Property;
  manager?: PoleManagerProfile;
  agent?: AgentProfile;
}

// MaintenanceSession - Modèle EXACT du schema.prisma
export interface MaintenanceSession {
  id: string;
  sessionNumber: string;
  ticketId: string;
  propertyId: string;
  agentId: string;
  scheduledDate: Date;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  status: SessionStatus;
  notes?: string;
  workDescription?: string;
  agentNotes?: string;
  laborCost?: number;
  materialsCost?: number;
  totalCost?: number;
  ownerApproval?: boolean;
  managerApproval?: boolean;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  property?: Property;
  manager?: PoleManagerProfile;
  agent?: AgentProfile;
  ticket?: Ticket;
}

// Ticket - Modèle PRINCIPAL EXACT du schema.prisma
export interface Ticket {
  id: string;
  ticketNumber: string; // @unique
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;

  // Relations principales
  propertyId: string;
  managerId: string;

  // Qui a créé le ticket
  reportedBy: string; // "owner", "guest", "agent", "manager"
  reportedAt: Date; // DateTime

  // Assignation
  agentId?: string;
  assignedAt?: string; // DateTime?

  // Catégorie
  category?: string; // "plumbing", "electrical", "heating"
  issueType?: string; // "repair", "installation", "inspection"
  roomLocation?: string; // "kitchen", "bathroom", "living_room"

  // Résolution
  resolution?: string;
  resolvedAt?: string; // DateTime?

  // Coûts
  estimatedCost?: number; // Float?
  estimatedDuration?: number; // Int?

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  property?: Property;
  agent?: AgentProfile;
  manager?: PoleManagerProfile;
  photos?: TicketPhoto[];
  maintenanceSession?: MaintenanceSession;
}

// TaskAssignment - Modèle EXACT du schema.prisma
export interface TaskAssignment {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  assignedAt: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  agentId: string;
  propertyId?: string;
  reservationId?: string;
  cleaningSessionId?: string;
  maintenanceSessionId?: string;
  ticketId?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// AgentProfile - Modèle EXACT du schema.prisma
export interface AgentProfile {
  id: string;
  userId: string;
  agentType: AgentType;
  availability: AgentAvailability;
  employeeId?: string;

  // Compétences
  specialties: AgentSpecialty[];
  certifications: string[];

  // Localisation
  currentLocation?: any; // Json?
  serviceZones: string[];

  // Statistiques
  rating?: number;
  completedTasks: number;
  averageRating?: number;
  responseTime?: number;

  // Planning
  workingHours?: any; // Json?
  availabilityCalendar?: any; // Json?

  // Informations contractuelles
  hourlyRate?: number;
  isActive: boolean;
  hireDate?: string;

  createdAt: string;
  updatedAt: string;

  // Manager qui le supervise
  managerId: string;
  manager?: PoleManagerProfile;

  // User relation
  user?: User;

  // Tâches assignées
  cleaningSessions?: CleaningSession[];
  maintenanceSessions?: MaintenanceSession[];
  tickets?: Ticket[];
  taskAssignments?: TaskAssignment[];
}
