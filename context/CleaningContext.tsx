import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "~/lib/auth-client";

// Types alignés avec les interfaces existantes et le nouveau schéma Prisma
export interface Property {
  id: string;
  name: string;
  address: string;
  rooms: number;
  surface: number;
  status: "available" | "occupied" | "maintenance" | "reserved" | "offline";
  createdAt?: string;
  updatedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  experience: string;
  rating: number;
  availability: "available" | "busy" | "offline";
  specialties: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CleaningSession {
  id: string;
  propertyId: string;
  property: Property;
  agentId: string;
  agent: Agent;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  type: "standard" | "deep_clean" | "maintenance";
  notes?: string;
  checklistCompleted: number;
  checklistTotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PoleManager {
  id: string;
  userId: string;
  poleType: "cleaning";
  canViewAnalytics: boolean;
  canManageAgents: boolean;
  canManageClients: boolean;
  canManageBilling: boolean;
  createdAt: string;
  updatedAt: string;
  superAdminId: string;
}

interface CleaningContextState {
  manager: PoleManager | null;
  properties: Property[];
  agents: Agent[];
  sessions: CleaningSession[];
  isLoading: boolean;
  error: string | null;
}

interface CleaningContextActions {
  // Manager
  fetchManager: () => Promise<void>;
  createManager: (data: Partial<PoleManager>) => Promise<void>;

  // Properties
  fetchProperties: () => Promise<void>;

  // Agents
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<void>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;

  // Sessions
  fetchSessions: () => Promise<void>;
  createSession: (data: Partial<CleaningSession>) => Promise<void>;
  updateSession: (id: string, data: Partial<CleaningSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

type CleaningContextType = CleaningContextState & CleaningContextActions;

const CleaningContext = createContext<CleaningContextType | null>(null);

export const CleaningProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session } = authClient.useSession();
  const [state, setState] = useState<CleaningContextState>({
    manager: null,
    properties: [],
    agents: [],
    sessions: [],
    isLoading: false,
    error: null,
  });

  // Mock data temporaire (sera remplacé par de vrais appels API)
  const mockProperties: Property[] = [
    {
      id: "1",
      name: "Appartement Champs-Élysées",
      address: "123 Avenue des Champs-Élysées, Paris",
      rooms: 3,
      surface: 85,
      status: "occupied",
    },
    {
      id: "2",
      name: "Studio Montmartre",
      address: "45 Rue des Martyrs, Paris",
      rooms: 1,
      surface: 35,
      status: "available",
    },
    {
      id: "3",
      name: "Loft Marais",
      address: "78 Rue de Rivoli, Paris",
      rooms: 2,
      surface: 65,
      status: "maintenance",
    },
  ];

  const mockAgents: Agent[] = [
    {
      id: "1",
      name: "Marie Dupont",
      phone: "06 12 34 56 78",
      experience: "5 ans",
      rating: 4.8,
      availability: "available",
      specialties: ["Appartements", "Bureaux"],
    },
    {
      id: "2",
      name: "Jean Martin",
      phone: "06 98 76 54 32",
      experience: "3 ans",
      rating: 4.6,
      availability: "busy",
      specialties: ["Industriel", "Commerces"],
    },
    {
      id: "3",
      name: "Sophie Bernard",
      phone: "06 55 44 33 22",
      experience: "7 ans",
      rating: 4.9,
      availability: "available",
      specialties: ["Résidentiel", "Hôtels"],
    },
  ];

  const mockSessions: CleaningSession[] = [
    {
      id: "1",
      propertyId: "1",
      property: mockProperties[0],
      agentId: "1",
      agent: mockAgents[0],
      scheduledDate: "2024-02-15",
      scheduledTime: "09:00",
      duration: 180,
      status: "scheduled",
      type: "standard",
      notes: "Nettoyage complet après départ client",
      checklistCompleted: 0,
      checklistTotal: 12,
    },
    {
      id: "2",
      propertyId: "2",
      property: mockProperties[1],
      agentId: "2",
      agent: mockAgents[1],
      scheduledDate: "2024-02-15",
      scheduledTime: "14:00",
      duration: 120,
      status: "in_progress",
      type: "maintenance",
      notes: "Nettoyage post-travaux",
      checklistCompleted: 8,
      checklistTotal: 15,
    },
  ];

  const fetchManager = useCallback(async () => {
    if (!session?.user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Remplacer par un vrai appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockManager: PoleManager = {
        id: "manager_1",
        userId: session.user.id,
        poleType: "cleaning",
        canViewAnalytics: true,
        canManageAgents: true,
        canManageClients: false,
        canManageBilling: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        superAdminId: "super_admin_1",
      };

      setState((prev) => ({
        ...prev,
        manager: mockManager,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Erreur lors du chargement du manager",
        isLoading: false,
      }));
    }
  }, [session?.user?.id]);

  const fetchProperties = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Remplacer par un vrai appel API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({
        ...prev,
        properties: mockProperties,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Erreur lors du chargement des propriétés",
        isLoading: false,
      }));
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Remplacer par un vrai appel API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({
        ...prev,
        agents: mockAgents,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Erreur lors du chargement des agents",
        isLoading: false,
      }));
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Remplacer par un vrai appel API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({
        ...prev,
        sessions: mockSessions,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Erreur lors du chargement des sessions",
        isLoading: false,
      }));
    }
  }, []);

  // TODO: Implémenter les autres fonctions CRUD
  const createManager = useCallback(async (data: Partial<PoleManager>) => {},
  []);
  const createAgent = useCallback(async (data: Partial<Agent>) => {}, []);
  const updateAgent = useCallback(
    async (id: string, data: Partial<Agent>) => {},
    []
  );
  const deleteAgent = useCallback(async (id: string) => {}, []);
  const createSession = useCallback(
    async (data: Partial<CleaningSession>) => {},
    []
  );
  const updateSession = useCallback(
    async (id: string, data: Partial<CleaningSession>) => {},
    []
  );
  const deleteSession = useCallback(async (id: string) => {}, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchManager();
      fetchProperties();
      fetchAgents();
      fetchSessions();
    }
  }, [
    session?.user?.id,
    fetchManager,
    fetchProperties,
    fetchAgents,
    fetchSessions,
  ]);

  const contextValue: CleaningContextType = {
    ...state,
    fetchManager,
    createManager,
    fetchProperties,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };

  return (
    <CleaningContext.Provider value={contextValue}>
      {children}
    </CleaningContext.Provider>
  );
};

export const useCleaning = () => {
  const context = useContext(CleaningContext);
  if (!context) {
    throw new Error("useCleaning doit être utilisé dans un CleaningProvider");
  }
  return context;
};
