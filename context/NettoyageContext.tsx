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

  // Relations étendues (optionnelles pour le contexte)
  features?: PropertyFeature[];
  photos?: PropertyPhoto[];
  reservations?: Reservation[];
  cleaningSessions?: CleaningSession[];
}

export interface PropertyFeature {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  propertyId: string;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  isMain: boolean;
  order: number;
  type?: string;
  propertyId: string;
  createdAt: string;
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

// CleaningSession - Modèle PRINCIPAL EXACT du schema.prisma
export interface CleaningSession {
  id: string;

  // Relations principales
  propertyId: string;
  agentId: string;
  managerId: string;

  // Planning
  scheduledDate: string; // DateTime
  startTime?: string; // DateTime?
  endTime?: string; // DateTime?
  duration?: number; // Int?

  // Type
  cleaningType: string; // "checkout", "maintenance", "deep", "regular"

  // Détails
  status: SessionStatus;
  notes?: string;
  agentNotes?: string;

  // Évaluation
  ownerRating?: number; // Float?
  managerRating?: number; // Float?
  feedback?: string;

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  property?: Property;
  agent?: AgentProfile;
  manager?: PoleManagerProfile;
  checklist?: CleaningChecklist[];
  photos?: CleaningPhoto[];
}

// CleaningChecklist - Modèle EXACT du schema.prisma
export interface CleaningChecklist {
  id: string;
  item: string;
  completed: boolean;
  notes?: string;
  order: number;
  cleaningSessionId: string;
}

// CleaningPhoto - Modèle EXACT du schema.prisma
export interface CleaningPhoto {
  id: string;
  url: string;
  type?: string; // "before", "after", "issue"
  caption?: string;
  cleaningSessionId: string;
  createdAt: string;
}

// Reservation pour compléter les relations Property
export interface Reservation {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data alignées avec le schema.prisma
const mockProperties: Property[] = [
  {
    id: "1",
    name: "Appartement Centre-Ville",
    description: "T3 moderne avec balcon",
    status: "available",
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
    accessInstructions: "Code d'entrée : 1234A",
    cleaningInstructions: "Attention aux sols en parquet",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    ownerId: "owner-1",
    managerId: "manager-1",
  },
  {
    id: "2",
    name: "Studio Étudiant",
    description: "Studio meublé proche université",
    status: "occupied",
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
    accessInstructions: "Boîte à clé code 9876",
    cleaningInstructions: "Studio compact, attention à l'espace",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-22T16:45:00Z",
    ownerId: "owner-2",
    managerId: "manager-1",
  },
  {
    id: "3",
    name: "Maison Familiale",
    description: "Maison avec jardin",
    status: "maintenance",
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
    accessInstructions: "Clé chez le voisin",
    cleaningInstructions: "Nettoyer aussi la terrasse",
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
    agentType: "cleaning",
    availability: "available",
    employeeId: "EMP001",
    specialties: [
      {
        id: "1",
        name: "Nettoyage approfondi",
        category: "cleaning",
        level: "expert",
        certified: true,
        agentId: "1",
      },
      {
        id: "2",
        name: "Désinfection",
        category: "cleaning",
        level: "intermédiaire",
        certified: false,
        agentId: "1",
      },
    ],
    certifications: ["ISO 14001", "Formation HACCP"],
    serviceZones: ["Paris 1er", "Paris 2e", "Paris 3e"],
    rating: 4.8,
    completedTasks: 156,
    averageRating: 4.8,
    responseTime: 15,
    hourlyRate: 25,
    isActive: true,
    hireDate: "2023-06-15T00:00:00Z",
    createdAt: "2023-06-15T08:00:00Z",
    updatedAt: "2024-01-22T10:30:00Z",
    managerId: "manager-1",
    user: {
      name: "Marie Dupont",
      email: "marie.dupont@example.com",
      phone: "+33 6 12 34 56 78",
    },
  },
  {
    id: "2",
    userId: "user-agent-2",
    agentType: "cleaning",
    availability: "busy",
    employeeId: "EMP002",
    specialties: [
      {
        id: "3",
        name: "Nettoyage vitres",
        category: "cleaning",
        level: "expert",
        certified: true,
        agentId: "2",
      },
      {
        id: "4",
        name: "Entretien sols",
        category: "cleaning",
        level: "expert",
        certified: true,
        agentId: "2",
      },
    ],
    certifications: ["Certification vitres", "Formation produits éco"],
    serviceZones: ["Lyon", "Villeurbanne"],
    rating: 4.9,
    completedTasks: 203,
    averageRating: 4.9,
    responseTime: 12,
    hourlyRate: 28,
    isActive: true,
    hireDate: "2023-03-10T00:00:00Z",
    createdAt: "2023-03-10T08:00:00Z",
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
    agentType: "cleaning",
    availability: "offline",
    employeeId: "EMP003",
    specialties: [
      {
        id: "5",
        name: "Nettoyage après travaux",
        category: "cleaning",
        level: "expert",
        certified: true,
        agentId: "3",
      },
    ],
    certifications: ["Formation sécurité chantier"],
    serviceZones: ["Marseille", "Aix-en-Provence"],
    rating: 4.7,
    completedTasks: 134,
    averageRating: 4.7,
    responseTime: 20,
    hourlyRate: 30,
    isActive: true,
    hireDate: "2023-09-01T00:00:00Z",
    createdAt: "2023-09-01T08:00:00Z",
    updatedAt: "2024-01-21T16:45:00Z",
    managerId: "manager-1",
    user: {
      name: "Ahmed Ben Ali",
      email: "ahmed.benali@example.com",
      phone: "+33 6 55 44 33 22",
    },
  },
];

const mockSessions: CleaningSession[] = [
  {
    id: "1",
    propertyId: "1",
    agentId: "1",
    managerId: "manager-1",
    scheduledDate: "2024-01-25T09:00:00Z",
    startTime: "2024-01-25T09:00:00Z",
    endTime: "2024-01-25T12:00:00Z",
    duration: 180,
    cleaningType: "checkout",
    status: "completed",
    notes: "Nettoyage après départ client",
    agentNotes: "Appartement en bon état, nettoyage standard effectué",
    ownerRating: 5.0,
    managerRating: 4.8,
    feedback: "Excellent travail, propriétaire très satisfait",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-25T12:30:00Z",
  },
  {
    id: "2",
    propertyId: "2",
    agentId: "2",
    managerId: "manager-1",
    scheduledDate: "2024-01-26T14:00:00Z",
    cleaningType: "regular",
    status: "in_progress",
    notes: "Nettoyage hebdomadaire",
    agentNotes: "En cours, RAS",
    createdAt: "2024-01-22T08:00:00Z",
    updatedAt: "2024-01-26T14:15:00Z",
  },
  {
    id: "3",
    propertyId: "3",
    agentId: "3",
    managerId: "manager-1",
    scheduledDate: "2024-01-28T10:00:00Z",
    cleaningType: "deep",
    status: "planned",
    notes: "Nettoyage après travaux de rénovation",
    createdAt: "2024-01-21T16:00:00Z",
    updatedAt: "2024-01-21T16:00:00Z",
  },
];

// Interface du contexte
interface NettoyageContextType {
  // Data
  properties: Property[];
  agents: AgentProfile[];
  sessions: CleaningSession[];
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

  // Actions Sessions
  fetchSessions: () => Promise<void>;
  createSession: (
    session: Omit<CleaningSession, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateSession: (
    id: string,
    session: Partial<CleaningSession>
  ) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Actions Manager
  fetchManager: () => Promise<void>;

  // Actions Checklist & Photos
  updateChecklist: (
    sessionId: string,
    checklist: CleaningChecklist[]
  ) => Promise<void>;
  addPhoto: (
    sessionId: string,
    photo: Omit<CleaningPhoto, "id" | "createdAt">
  ) => Promise<void>;
}

// Context
const NettoyageContext = createContext<NettoyageContextType | undefined>(
  undefined
);

// Provider
export function NettoyageProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();

  // États
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [agents, setAgents] = useState<AgentProfile[]>(mockAgents);
  const [sessions, setSessions] = useState<CleaningSession[]>(mockSessions);
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
      // TODO: Appel API réel - GET /api/agents?managerId=X&agentType=cleaning
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

  // Actions Sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/cleaning-sessions?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1200));
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
      sessionData: Omit<CleaningSession, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/cleaning-sessions
        const newSession: CleaningSession = {
          ...sessionData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions((prev) => [...prev, newSession]);
      } catch (err) {
        setError("Erreur lors de la création de la session");
      }
    },
    []
  );

  const updateSession = useCallback(
    async (id: string, sessionData: Partial<CleaningSession>) => {
      try {
        // TODO: Appel API réel - PUT /api/cleaning-sessions/:id
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
      // TODO: Appel API réel - DELETE /api/cleaning-sessions/:id
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
      // TODO: Appel API réel - GET /api/pole-managers?userId=X&poleType=cleaning
      await new Promise((resolve) => setTimeout(resolve, 500));
      setManager({
        id: "manager-1",
        userId: session.user.id,
        poleType: "cleaning",
        canViewAnalytics: true,
        canManageAgents: true,
        canManageClients: false,
        canManageBilling: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        superAdminId: "super-admin-1",
        user: {
          name: session.user.name || "Manager Nettoyage",
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

  // Actions Checklist & Photos
  const updateChecklist = useCallback(
    async (sessionId: string, checklist: CleaningChecklist[]) => {
      try {
        // TODO: Appel API réel - PUT /api/cleaning-sessions/:sessionId/checklist
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? { ...session, checklist, updatedAt: new Date().toISOString() }
              : session
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la checklist");
      }
    },
    []
  );

  const addPhoto = useCallback(
    async (
      sessionId: string,
      photoData: Omit<CleaningPhoto, "id" | "createdAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/cleaning-sessions/:sessionId/photos
        const newPhoto: CleaningPhoto = {
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

  // Chargement initial
  useEffect(() => {
    if (session?.user) {
      fetchManager();
    }
  }, [session?.user, fetchManager]);

  const contextValue: NettoyageContextType = {
    // Data
    properties,
    agents,
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

    // Actions Sessions
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,

    // Actions Manager
    fetchManager,

    // Actions Checklist & Photos
    updateChecklist,
    addPhoto,
  };

  return (
    <NettoyageContext.Provider value={contextValue}>
      {children}
    </NettoyageContext.Provider>
  );
}

// Hook
export function useNettoyage() {
  const context = useContext(NettoyageContext);
  if (context === undefined) {
    throw new Error("useNettoyage must be used within a NettoyageProvider");
  }
  return context;
}

// Alias pour compatibilité
export const CleaningProvider = NettoyageProvider;
export const useCleaning = useNettoyage;
