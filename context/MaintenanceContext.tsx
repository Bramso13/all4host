import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "~/lib/auth-client";

// Types EXACTS basés sur schema.prisma

// Enums du schema.prisma
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent" | "critical";
export type SessionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "paused"
  | "pending_validation";
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
export type PropertyStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "reserved"
  | "offline";
export type PoleType = "conciergerie" | "cleaning" | "maintenance" | "laundry";

// Property - Modèle EXACT du schema.prisma
export interface Property {
  id: string;
  name: string;
  description: string;
  status: PropertyStatus;

  // Localisation
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;

  // Caractéristiques
  surface?: number;
  numberOfRooms?: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  maxGuests?: number;
  floor?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;

  // Pricing
  pricePerNight?: number;
  cleaningFee?: number;
  serviceFee?: number;
  securityDeposit?: number;

  // Ratings
  averageRating?: number;
  totalReviews: number;

  // Policies
  checkInTime?: string;
  checkOutTime?: string;
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
  currentLocation?: any; // Json type
  serviceZones: string[];

  // Statistiques
  rating?: number;
  completedTasks: number;
  averageRating?: number;
  responseTime?: number;

  // Planning
  workingHours?: any; // Json type
  availabilityCalendar?: any; // Json type

  // Informations contractuelles
  hourlyRate?: number;
  isActive: boolean;
  hireDate?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  managerId: string;

  // Relations étendues pour l'affichage
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface AgentSpecialty {
  id: string;
  name: string;
  category?: string;
  level?: string; // "débutant", "intermédiaire", "expert"
  certified: boolean;
  agentId: string;
}

// PoleManagerProfile - Modèle EXACT du schema.prisma
export interface PoleManagerProfile {
  id: string;
  userId: string;
  poleType: PoleType;

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
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
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
  reportedAt: string; // DateTime

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

// TicketPhoto - Modèle EXACT du schema.prisma
export interface TicketPhoto {
  id: string;
  url: string;
  caption?: string;
  ticketId: string;
  createdAt: string;
}

// MaintenanceSession - Modèle EXACT du schema.prisma
export interface MaintenanceSession {
  id: string;
  sessionNumber: string; // @unique

  // Relation 1:1 avec Ticket
  ticketId: string; // @unique

  // Relations principales
  propertyId: string;
  agentId: string;
  managerId: string;

  // Planning
  scheduledDate: string; // DateTime
  startTime?: string; // DateTime?
  endTime?: string; // DateTime?
  estimatedDuration?: number; // Int?
  actualDuration?: number; // Int?

  // Détails
  status: SessionStatus;
  notes?: string;
  workDescription?: string;
  agentNotes?: string;

  // Coûts
  laborCost?: number; // Float?
  materialsCost?: number; // Float?
  totalCost?: number; // Float?

  // Validation
  ownerApproval?: boolean;
  managerApproval?: boolean;

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  ticket?: Ticket;
  property?: Property;
  agent?: AgentProfile;
  manager?: PoleManagerProfile;
  materials?: MaintenanceMaterial[];
  photos?: MaintenancePhoto[];
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

// Mock data alignées avec le schema.prisma
const mockProperties: Property[] = [
  {
    id: "1",
    name: "Appartement Centre-Ville",
    description: "T3 moderne avec balcon",
    status: "occupied",
    address: "15 Rue de la Paix",
    city: "Paris",
    country: "France",
    postalCode: "75001",
    surface: 75,
    numberOfRooms: 3,
    numberOfBedrooms: 2,
    numberOfBathrooms: 1,
    maxGuests: 4,
    pricePerNight: 120,
    cleaningFee: 30,
    averageRating: 4.8,
    totalReviews: 127,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    maintenanceNotes: "Chaudière récente, éviter de toucher aux réglages",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    ownerId: "owner-1",
    managerId: "manager-1",
  },
  {
    id: "2",
    name: "Studio Étudiant",
    description: "Studio meublé proche université",
    status: "maintenance",
    address: "8 Avenue des Étudiants",
    city: "Lyon",
    country: "France",
    postalCode: "69002",
    surface: 25,
    numberOfRooms: 1,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    maxGuests: 2,
    pricePerNight: 60,
    cleaningFee: 20,
    averageRating: 4.5,
    totalReviews: 89,
    checkInTime: "16:00",
    checkOutTime: "10:00",
    maintenanceNotes: "Plomberie ancienne, faire attention",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-22T16:45:00Z",
    ownerId: "owner-2",
    managerId: "manager-1",
  },
  {
    id: "3",
    name: "Maison Familiale",
    description: "Maison avec jardin",
    status: "available",
    address: "42 Rue du Bonheur",
    city: "Marseille",
    country: "France",
    postalCode: "13001",
    surface: 120,
    numberOfRooms: 5,
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    maxGuests: 6,
    pricePerNight: 180,
    cleaningFee: 45,
    averageRating: 4.9,
    totalReviews: 203,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    maintenanceNotes: "Maison ancienne, respecter le cachet",
    createdAt: "2024-01-05T11:00:00Z",
    updatedAt: "2024-01-21T09:15:00Z",
    ownerId: "owner-3",
    managerId: "manager-1",
  },
];

const mockAgents: AgentProfile[] = [
  {
    id: "1",
    userId: "user-agent-1",
    agentType: "maintenance",
    availability: "available",
    employeeId: "MAINT001",
    specialties: [
      {
        id: "1",
        name: "Plomberie",
        category: "maintenance",
        level: "expert",
        certified: true,
        agentId: "1",
      },
      {
        id: "2",
        name: "Électricité",
        category: "maintenance",
        level: "intermédiaire",
        certified: true,
        agentId: "1",
      },
    ],
    certifications: ["Habilitation électrique", "Certification gaz"],
    serviceZones: ["Paris 1er", "Paris 2e", "Paris 3e"],
    rating: 4.8,
    completedTasks: 156,
    averageRating: 4.8,
    responseTime: 20,
    hourlyRate: 35,
    isActive: true,
    hireDate: "2023-04-15T00:00:00Z",
    createdAt: "2023-04-15T08:00:00Z",
    updatedAt: "2024-01-22T10:30:00Z",
    managerId: "manager-1",
    user: {
      name: "Marc Dupont",
      email: "marc.dupont@example.com",
      phone: "+33 6 12 34 56 78",
    },
  },
  {
    id: "2",
    userId: "user-agent-2",
    agentType: "maintenance",
    availability: "busy",
    employeeId: "MAINT002",
    specialties: [
      {
        id: "3",
        name: "Électricité",
        category: "maintenance",
        level: "expert",
        certified: true,
        agentId: "2",
      },
      {
        id: "4",
        name: "Domotique",
        category: "maintenance",
        level: "expert",
        certified: false,
        agentId: "2",
      },
    ],
    certifications: ["Habilitation électrique B2V", "Formation domotique"],
    serviceZones: ["Lyon", "Villeurbanne"],
    rating: 4.9,
    completedTasks: 203,
    averageRating: 4.9,
    responseTime: 15,
    hourlyRate: 40,
    isActive: true,
    hireDate: "2023-01-10T00:00:00Z",
    createdAt: "2023-01-10T08:00:00Z",
    updatedAt: "2024-01-22T11:15:00Z",
    managerId: "manager-1",
    user: {
      name: "Sophie Martin",
      email: "sophie.martin@example.com",
      phone: "+33 6 98 76 54 32",
    },
  },
  {
    id: "3",
    userId: "user-agent-3",
    agentType: "maintenance",
    availability: "available",
    employeeId: "MAINT003",
    specialties: [
      {
        id: "5",
        name: "Plomberie",
        category: "maintenance",
        level: "expert",
        certified: true,
        agentId: "3",
      },
      {
        id: "6",
        name: "Chauffage",
        category: "maintenance",
        level: "expert",
        certified: true,
        agentId: "3",
      },
    ],
    certifications: ["Certification PGN", "Formation climatisation"],
    serviceZones: ["Marseille", "Aix-en-Provence"],
    rating: 4.7,
    completedTasks: 189,
    averageRating: 4.7,
    responseTime: 25,
    hourlyRate: 38,
    isActive: true,
    hireDate: "2023-07-01T00:00:00Z",
    createdAt: "2023-07-01T08:00:00Z",
    updatedAt: "2024-01-21T16:45:00Z",
    managerId: "manager-1",
    user: {
      name: "Ahmed Ben Ali",
      email: "ahmed.benali@example.com",
      phone: "+33 6 55 44 33 22",
    },
  },
];

const mockTickets: Ticket[] = [
  {
    id: "1",
    ticketNumber: "MAINT-2024-001",
    title: "Fuite d'eau salle de bain",
    description: "Fuite importante au niveau du lavabo, urgent à réparer",
    status: "open",
    priority: "urgent",
    propertyId: "1",
    managerId: "manager-1",
    reportedBy: "owner",
    reportedAt: "2024-01-22T08:30:00Z",
    category: "plumbing",
    issueType: "repair",
    roomLocation: "bathroom",
    estimatedCost: 150,
    estimatedDuration: 120,
    createdAt: "2024-01-22T08:30:00Z",
    updatedAt: "2024-01-22T08:30:00Z",
  },
  {
    id: "2",
    ticketNumber: "MAINT-2024-002",
    title: "Panne électrique cuisine",
    description: "Plus d'électricité dans la cuisine depuis hier",
    status: "in_progress",
    priority: "high",
    propertyId: "2",
    managerId: "manager-1",
    agentId: "2",
    reportedBy: "guest",
    reportedAt: "2024-01-21T14:20:00Z",
    assignedAt: "2024-01-22T09:15:00Z",
    category: "electrical",
    issueType: "repair",
    roomLocation: "kitchen",
    estimatedCost: 200,
    estimatedDuration: 180,
    createdAt: "2024-01-21T14:20:00Z",
    updatedAt: "2024-01-22T09:15:00Z",
  },
  {
    id: "3",
    ticketNumber: "MAINT-2024-003",
    title: "Climatisation défaillante",
    description: "La climatisation ne refroidit plus correctement",
    status: "open",
    priority: "medium",
    propertyId: "3",
    managerId: "manager-1",
    reportedBy: "manager",
    reportedAt: "2024-01-20T16:45:00Z",
    category: "heating",
    issueType: "repair",
    roomLocation: "living_room",
    estimatedCost: 300,
    estimatedDuration: 240,
    createdAt: "2024-01-20T16:45:00Z",
    updatedAt: "2024-01-20T16:45:00Z",
  },
  {
    id: "4",
    ticketNumber: "MAINT-2024-004",
    title: "Porte qui grince",
    description: "Porte d'entrée qui fait du bruit",
    status: "resolved",
    priority: "low",
    propertyId: "1",
    managerId: "manager-1",
    agentId: "1",
    reportedBy: "agent",
    reportedAt: "2024-01-19T10:00:00Z",
    assignedAt: "2024-01-19T14:00:00Z",
    category: "general",
    issueType: "repair",
    roomLocation: "entrance",
    estimatedCost: 50,
    estimatedDuration: 30,
    resolution: "Lubrification des gonds effectuée",
    resolvedAt: "2024-01-21T15:30:00Z",
    createdAt: "2024-01-19T10:00:00Z",
    updatedAt: "2024-01-21T15:30:00Z",
  },
];

const mockSessions: MaintenanceSession[] = [
  {
    id: "1",
    sessionNumber: "SESSION-2024-001",
    ticketId: "2",
    propertyId: "2",
    agentId: "2",
    managerId: "manager-1",
    scheduledDate: "2024-01-22T14:00:00Z",
    startTime: "2024-01-22T14:00:00Z",
    status: "in_progress",
    estimatedDuration: 180,
    notes: "Vérification du tableau électrique en cours",
    workDescription: "Diagnostic et réparation circuit électrique cuisine",
    agentNotes: "Problème identifié au niveau du disjoncteur différentiel",
    laborCost: 80,
    materialsCost: 45,
    totalCost: 125,
    ownerApproval: true,
    createdAt: "2024-01-22T09:15:00Z",
    updatedAt: "2024-01-22T14:30:00Z",
  },
  {
    id: "2",
    sessionNumber: "SESSION-2024-002",
    ticketId: "4",
    propertyId: "1",
    agentId: "1",
    managerId: "manager-1",
    scheduledDate: "2024-01-21T09:00:00Z",
    startTime: "2024-01-21T09:00:00Z",
    endTime: "2024-01-21T09:30:00Z",
    status: "completed",
    estimatedDuration: 30,
    actualDuration: 30,
    notes: "Intervention rapide et efficace",
    workDescription: "Lubrification gonds porte d'entrée",
    agentNotes: "Porte remise en état, plus de grincement",
    laborCost: 50,
    materialsCost: 5,
    totalCost: 55,
    ownerApproval: true,
    managerApproval: true,
    createdAt: "2024-01-21T08:45:00Z",
    updatedAt: "2024-01-21T15:30:00Z",
  },
];

// Interface du contexte
interface MaintenanceContextType {
  // Data
  properties: Property[];
  agents: AgentProfile[];
  tickets: Ticket[];
  sessions: MaintenanceSession[];
  manager: PoleManagerProfile | null;

  // États
  isLoading: boolean;
  error: string | null;

  // Actions Properties
  fetchProperties: () => Promise<void>;
  createProperty: (
    property: Omit<Property, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  // Actions Agents
  fetchAgents: () => Promise<void>;
  createAgent: (
    agent: Omit<AgentProfile, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateAgent: (id: string, agent: Partial<AgentProfile>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;

  // Actions Tickets
  fetchTickets: () => Promise<void>;
  createTicket: (
    ticket: Omit<Ticket, "id" | "ticketNumber" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateTicket: (id: string, ticket: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  assignTicket: (ticketId: string, agentId: string) => Promise<void>;
  resolveTicket: (ticketId: string, resolution: string) => Promise<void>;

  // Actions Sessions
  fetchSessions: () => Promise<void>;
  createSession: (
    session: Omit<
      MaintenanceSession,
      "id" | "sessionNumber" | "createdAt" | "updatedAt"
    >
  ) => Promise<void>;
  updateSession: (
    id: string,
    session: Partial<MaintenanceSession>
  ) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Actions Manager
  fetchManager: () => Promise<void>;

  // Actions Materials & Photos
  addMaterial: (
    sessionId: string,
    material: Omit<MaintenanceMaterial, "id">
  ) => Promise<void>;
  updateMaterial: (
    materialId: string,
    material: Partial<MaintenanceMaterial>
  ) => Promise<void>;
  removeMaterial: (materialId: string, sessionId: string) => Promise<void>;
  addPhoto: (
    sessionId: string,
    photo: Omit<MaintenancePhoto, "id" | "createdAt">
  ) => Promise<void>;
  addTicketPhoto: (
    ticketId: string,
    photo: Omit<TicketPhoto, "id" | "createdAt">
  ) => Promise<void>;
}

// Context
const MaintenanceContext = createContext<MaintenanceContextType | undefined>(
  undefined
);

// Provider
export function MaintenanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();

  // États
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [agents, setAgents] = useState<AgentProfile[]>(mockAgents);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [sessions, setSessions] = useState<MaintenanceSession[]>(mockSessions);
  const [manager, setManager] = useState<PoleManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions Properties
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/properties?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProperties(mockProperties);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des propriétés");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProperty = useCallback(
    async (propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">) => {
      try {
        // TODO: Appel API réel - POST /api/properties
        const newProperty: Property = {
          ...propertyData,
          id: Date.now().toString(),
          totalReviews: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProperties((prev) => [...prev, newProperty]);
      } catch (err) {
        setError("Erreur lors de la création de la propriété");
      }
    },
    []
  );

  const updateProperty = useCallback(
    async (id: string, propertyData: Partial<Property>) => {
      try {
        // TODO: Appel API réel - PUT /api/properties/:id
        setProperties((prev) =>
          prev.map((property) =>
            property.id === id
              ? {
                  ...property,
                  ...propertyData,
                  updatedAt: new Date().toISOString(),
                }
              : property
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la propriété");
      }
    },
    []
  );

  const deleteProperty = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/properties/:id
      setProperties((prev) => prev.filter((property) => property.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la propriété");
    }
  }, []);

  // Actions Agents
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/agents?managerId=X&agentType=maintenance
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAgents(mockAgents);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des agents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAgent = useCallback(
    async (agentData: Omit<AgentProfile, "id" | "createdAt" | "updatedAt">) => {
      try {
        // TODO: Appel API réel - POST /api/agents
        const newAgent: AgentProfile = {
          ...agentData,
          id: Date.now().toString(),
          completedTasks: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAgents((prev) => [...prev, newAgent]);
      } catch (err) {
        setError("Erreur lors de la création de l'agent");
      }
    },
    []
  );

  const updateAgent = useCallback(
    async (id: string, agentData: Partial<AgentProfile>) => {
      try {
        // TODO: Appel API réel - PUT /api/agents/:id
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === id
              ? { ...agent, ...agentData, updatedAt: new Date().toISOString() }
              : agent
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de l'agent");
      }
    },
    []
  );

  const deleteAgent = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/agents/:id
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de l'agent");
    }
  }, []);

  // Actions Tickets
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/tickets?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setTickets(mockTickets);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des tickets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = useCallback(
    async (
      ticketData: Omit<
        Ticket,
        "id" | "ticketNumber" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        // TODO: Appel API réel - POST /api/tickets
        const newTicket: Ticket = {
          ...ticketData,
          id: Date.now().toString(),
          ticketNumber: `MAINT-2024-${String(tickets.length + 1).padStart(
            3,
            "0"
          )}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTickets((prev) => [...prev, newTicket]);
      } catch (err) {
        setError("Erreur lors de la création du ticket");
      }
    },
    [tickets.length]
  );

  const updateTicket = useCallback(
    async (id: string, ticketData: Partial<Ticket>) => {
      try {
        // TODO: Appel API réel - PUT /api/tickets/:id
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === id
              ? {
                  ...ticket,
                  ...ticketData,
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du ticket");
      }
    },
    []
  );

  const deleteTicket = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/tickets/:id
      setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du ticket");
    }
  }, []);

  const assignTicket = useCallback(
    async (ticketId: string, agentId: string) => {
      try {
        // TODO: Appel API réel - PUT /api/tickets/:ticketId/assign
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  agentId,
                  status: "assigned",
                  assignedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          )
        );
      } catch (err) {
        setError("Erreur lors de l'assignation du ticket");
      }
    },
    []
  );

  const resolveTicket = useCallback(
    async (ticketId: string, resolution: string) => {
      try {
        // TODO: Appel API réel - PUT /api/tickets/:ticketId/resolve
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  status: "resolved",
                  resolution,
                  resolvedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          )
        );
      } catch (err) {
        setError("Erreur lors de la résolution du ticket");
      }
    },
    []
  );

  // Actions Sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/maintenance-sessions?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSessions(mockSessions);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (
      sessionData: Omit<
        MaintenanceSession,
        "id" | "sessionNumber" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        // TODO: Appel API réel - POST /api/maintenance-sessions
        const newSession: MaintenanceSession = {
          ...sessionData,
          id: Date.now().toString(),
          sessionNumber: `SESSION-2024-${String(sessions.length + 1).padStart(
            3,
            "0"
          )}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions((prev) => [...prev, newSession]);
      } catch (err) {
        setError("Erreur lors de la création de la session");
      }
    },
    [sessions.length]
  );

  const updateSession = useCallback(
    async (id: string, sessionData: Partial<MaintenanceSession>) => {
      try {
        // TODO: Appel API réel - PUT /api/maintenance-sessions/:id
        setSessions((prev) =>
          prev.map((session) =>
            session.id === id
              ? {
                  ...session,
                  ...sessionData,
                  updatedAt: new Date().toISOString(),
                }
              : session
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la session");
      }
    },
    []
  );

  const deleteSession = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/maintenance-sessions/:id
      setSessions((prev) => prev.filter((session) => session.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la session");
    }
  }, []);

  // Actions Manager
  const fetchManager = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/pole-managers?userId=X&poleType=maintenance
      await new Promise((resolve) => setTimeout(resolve, 500));
      setManager({
        id: "manager-1",
        userId: session.user.id,
        poleType: "maintenance",
        canViewAnalytics: true,
        canManageAgents: true,
        canManageClients: false,
        canManageBilling: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        superAdminId: "super-admin-1",
        user: {
          name: session.user.name || "Manager Maintenance",
          email: session.user.email || "",
        },
      });
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement du manager");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  // Actions Materials & Photos
  const addMaterial = useCallback(
    async (
      sessionId: string,
      materialData: Omit<MaintenanceMaterial, "id">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/maintenance-sessions/:sessionId/materials
        const newMaterial: MaintenanceMaterial = {
          ...materialData,
          id: Date.now().toString(),
        };
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  materials: [...(session.materials || []), newMaterial],
                  materialsCost:
                    (session.materialsCost || 0) + newMaterial.totalPrice,
                  totalCost:
                    (session.laborCost || 0) +
                    ((session.materialsCost || 0) + newMaterial.totalPrice),
                  updatedAt: new Date().toISOString(),
                }
              : session
          )
        );
      } catch (err) {
        setError("Erreur lors de l'ajout du matériel");
      }
    },
    []
  );

  const updateMaterial = useCallback(
    async (materialId: string, materialData: Partial<MaintenanceMaterial>) => {
      try {
        // TODO: Appel API réel - PUT /api/maintenance-materials/:materialId
        setSessions((prev) =>
          prev.map((session) => ({
            ...session,
            materials: session.materials?.map((material) =>
              material.id === materialId
                ? { ...material, ...materialData }
                : material
            ),
          }))
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du matériel");
      }
    },
    []
  );

  const removeMaterial = useCallback(
    async (materialId: string, sessionId: string) => {
      try {
        // TODO: Appel API réel - DELETE /api/maintenance-materials/:materialId
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  materials: session.materials?.filter(
                    (material) => material.id !== materialId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : session
          )
        );
      } catch (err) {
        setError("Erreur lors de la suppression du matériel");
      }
    },
    []
  );

  const addPhoto = useCallback(
    async (
      sessionId: string,
      photoData: Omit<MaintenancePhoto, "id" | "createdAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/maintenance-sessions/:sessionId/photos
        const newPhoto: MaintenancePhoto = {
          ...photoData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  photos: [...(session.photos || []), newPhoto],
                  updatedAt: new Date().toISOString(),
                }
              : session
          )
        );
      } catch (err) {
        setError("Erreur lors de l'ajout de la photo");
      }
    },
    []
  );

  const addTicketPhoto = useCallback(
    async (
      ticketId: string,
      photoData: Omit<TicketPhoto, "id" | "createdAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/tickets/:ticketId/photos
        const newPhoto: TicketPhoto = {
          ...photoData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  photos: [...(ticket.photos || []), newPhoto],
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          )
        );
      } catch (err) {
        setError("Erreur lors de l'ajout de la photo au ticket");
      }
    },
    []
  );

  // Chargement initial
  useEffect(() => {
    if (session?.user) {
      fetchManager();
    }
  }, [session?.user, fetchManager]);

  const contextValue: MaintenanceContextType = {
    // Data
    properties,
    agents,
    tickets,
    sessions,
    manager,

    // États
    isLoading,
    error,

    // Actions Properties
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,

    // Actions Agents
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,

    // Actions Tickets
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    resolveTicket,

    // Actions Sessions
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,

    // Actions Manager
    fetchManager,

    // Actions Materials & Photos
    addMaterial,
    updateMaterial,
    removeMaterial,
    addPhoto,
    addTicketPhoto,
  };

  return (
    <MaintenanceContext.Provider value={contextValue}>
      {children}
    </MaintenanceContext.Provider>
  );
}

// Hook
export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
}
