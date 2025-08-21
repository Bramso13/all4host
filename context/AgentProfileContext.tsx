"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "~/lib/auth-client";

// Types pour l'agent connecté uniquement

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

// Models simplifiés pour l'agent connecté
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  accessInstructions?: string;
  cleaningInstructions?: string;
  maintenanceNotes?: string;
}

export interface AgentSpecialty {
  id: string;
  name: string;
  category?: string;
  level?: string; // "débutant", "intermédiaire", "expert"
  certified: boolean;
  agentId: string;
}

export interface CleaningSession {
  id: string;
  propertyId: string;
  agentId: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  cleaningType: string;
  status: SessionStatus;
  notes?: string;
  agentNotes?: string;
  property?: Property;
}

export interface MaintenanceSession {
  id: string;
  sessionNumber: string;
  ticketId: string;
  propertyId: string;
  agentId: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  status: SessionStatus;
  notes?: string;
  workDescription?: string;
  agentNotes?: string;
  property?: Property;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  propertyId: string;
  reportedBy: string;
  reportedAt: string;
  agentId?: string;
  assignedAt?: string;
  category?: string;
  issueType?: string;
  roomLocation?: string;
  resolution?: string;
  resolvedAt?: string;
  property?: Property;
}

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
  notes?: string;
  property?: Property;
}

// Agent Profile pour l'agent connecté
export interface MyAgentProfile {
  id: string;
  userId: string;
  agentType: AgentType;
  availability: AgentAvailability;
  employeeId?: string;

  // Compétences
  specialties: AgentSpecialty[];
  certifications: string[];

  // Localisation
  currentLocation?: any;
  serviceZones: string[];

  // Statistiques
  rating?: number;
  completedTasks: number;
  averageRating?: number;
  responseTime?: number;

  // Planning
  workingHours?: any;
  availabilityCalendar?: any;

  // Informations contractuelles (lecture seule pour l'agent)
  hourlyRate?: number;
  isActive: boolean;
  hireDate?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  managerId: string;
  user?: User;

  // Tâches et sessions assignées
  cleaningSessions?: CleaningSession[];
  maintenanceSessions?: MaintenanceSession[];
  tickets?: Ticket[];
  taskAssignments?: TaskAssignment[];
}

// État du contexte pour l'agent connecté
interface AgentProfileState {
  // Profil de l'agent connecté
  myProfile: MyAgentProfile | null;

  // Tâches et sessions de l'agent
  myTasks: TaskAssignment[];
  myCleaningSessions: CleaningSession[];
  myMaintenanceSessions: MaintenanceSession[];
  myTickets: Ticket[];
  mySpecialties: AgentSpecialty[];

  // État
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

// Actions autorisées pour l'agent connecté
interface AgentProfileActions {
  // Profil personnel
  loadMyProfile: () => Promise<void>;
  updateMyAvailability: (availability: AgentAvailability) => Promise<void>;
  updateMyLocation: (location: any) => Promise<void>;
  updateMyProfile: (data: {
    availability?: AgentAvailability;
    currentLocation?: any;
    workingHours?: any;
    availabilityCalendar?: any;
  }) => Promise<void>;

  // Mes spécialités
  loadMySpecialties: () => Promise<void>;
  addMySpecialty: (data: {
    name: string;
    category?: string;
    level?: string;
    certified?: boolean;
  }) => Promise<void>;
  updateMySpecialty: (
    id: string,
    data: {
      name?: string;
      category?: string;
      level?: string;
      certified?: boolean;
    }
  ) => Promise<void>;
  removeMySpecialty: (id: string) => Promise<void>;

  // Mes tâches
  loadMyTasks: () => Promise<void>;
  startMyTask: (taskId: string) => Promise<void>;
  completeMyTask: (taskId: string, notes?: string) => Promise<void>;
  updateMyTaskNotes: (taskId: string, notes: string) => Promise<void>;

  // Mes sessions de nettoyage
  loadMyCleaningSessions: () => Promise<void>;
  startCleaningSession: (sessionId: string) => Promise<void>;
  completeCleaningSession: (
    sessionId: string,
    agentNotes?: string
  ) => Promise<void>;
  updateCleaningSessionStatus: (
    sessionId: string,
    status: SessionStatus
  ) => Promise<void>;

  // Mes sessions de maintenance
  loadMyMaintenanceSessions: () => Promise<void>;
  startMaintenanceSession: (sessionId: string) => Promise<void>;
  completeMaintenanceSession: (
    sessionId: string,
    agentNotes?: string
  ) => Promise<void>;
  updateMaintenanceSessionStatus: (
    sessionId: string,
    status: SessionStatus
  ) => Promise<void>;

  // Mes tickets
  loadMyTickets: () => Promise<void>;
  createTicket: (data: {
    title: string;
    description: string;
    propertyId: string;
    category?: string;
    issueType?: string;
    roomLocation?: string;
    priority?: TicketPriority;
  }) => Promise<void>;
  acceptTicket: (ticketId: string) => Promise<void>;
  updateTicketStatus: (
    ticketId: string,
    status: TicketStatus,
    resolution?: string
  ) => Promise<void>;
  resolveTicket: (ticketId: string, resolution: string) => Promise<void>;

  // Statistiques personnelles
  getMyStats: () => {
    completedTasks: number;
    averageRating: number;
    activeTasks: number;
    upcomingSessions: number;
    openTickets: number;
  };

  // Gestion des données
  refreshAll: () => Promise<void>;
  clearCache: () => Promise<void>;
}

type AgentProfileContextType = AgentProfileState & AgentProfileActions;

// Clés AsyncStorage pour l'agent
const STORAGE_KEYS = {
  MY_PROFILE: "my_agent_profile",
  MY_TASKS: "my_tasks",
  MY_CLEANING_SESSIONS: "my_cleaning_sessions",
  MY_MAINTENANCE_SESSIONS: "my_maintenance_sessions",
  MY_TICKETS: "my_tickets",
  MY_SPECIALTIES: "my_specialties",
  LAST_SYNC: "agent_profile_last_sync",
};

// Création du contexte
const AgentProfileContext = createContext<AgentProfileContextType | null>(null);

// Provider du contexte
export const AgentProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session } = authClient.useSession();
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  const [state, setState] = useState<AgentProfileState>({
    myProfile: null,
    myTasks: [],
    myCleaningSessions: [],
    myMaintenanceSessions: [],
    myTickets: [],
    mySpecialties: [],
    isLoading: false,
    error: null,
    lastSync: null,
  });

  // Sauvegarder dans AsyncStorage
  const saveToStorage = useCallback(
    async (data: Partial<AgentProfileState>) => {
      try {
        const lastSync = new Date().toISOString();
        const promises = [];

        if (data.myProfile) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MY_PROFILE,
              JSON.stringify(data.myProfile)
            )
          );
        }
        if (data.myTasks) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MY_TASKS,
              JSON.stringify(data.myTasks)
            )
          );
        }
        if (data.myCleaningSessions) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MY_CLEANING_SESSIONS,
              JSON.stringify(data.myCleaningSessions)
            )
          );
        }
        if (data.myMaintenanceSessions) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MY_MAINTENANCE_SESSIONS,
              JSON.stringify(data.myMaintenanceSessions)
            )
          );
        }
        if (data.myTickets) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MY_TICKETS,
              JSON.stringify(data.myTickets)
            )
          );
        }
        if (data.mySpecialties) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MY_SPECIALTIES,
              JSON.stringify(data.mySpecialties)
            )
          );
        }

        promises.push(AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, lastSync));
        await Promise.all(promises);

        setState((prev) => ({
          ...prev,
          lastSync: new Date(lastSync),
        }));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde dans AsyncStorage:", error);
      }
    },
    []
  );

  // Charger depuis AsyncStorage
  const loadFromStorage = useCallback(async () => {
    try {
      const [
        profileData,
        tasksData,
        cleaningSessionsData,
        maintenanceSessionsData,
        ticketsData,
        specialtiesData,
        lastSyncData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MY_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.MY_TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.MY_CLEANING_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MY_MAINTENANCE_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MY_TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.MY_SPECIALTIES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      const myProfile = profileData ? JSON.parse(profileData) : null;
      const myTasks = tasksData ? JSON.parse(tasksData) : [];
      const myCleaningSessions = cleaningSessionsData
        ? JSON.parse(cleaningSessionsData)
        : [];
      const myMaintenanceSessions = maintenanceSessionsData
        ? JSON.parse(maintenanceSessionsData)
        : [];
      const myTickets = ticketsData ? JSON.parse(ticketsData) : [];
      const mySpecialties = specialtiesData ? JSON.parse(specialtiesData) : [];
      const lastSync = lastSyncData ? new Date(lastSyncData) : null;

      setState((prev) => ({
        ...prev,
        myProfile,
        myTasks,
        myCleaningSessions,
        myMaintenanceSessions,
        myTickets,
        mySpecialties,
        lastSync,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement depuis AsyncStorage:", error);
    }
  }, []);

  // Charger le profil de l'agent connecté
  const loadMyProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `http://localhost:8081/api/agents/my-profile`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const myProfile = await response.json();
        setState((prev) => ({ ...prev, myProfile, isLoading: false }));
        await saveToStorage({ myProfile });
      } else {
        throw new Error("Erreur lors du chargement du profil");
      }
    } catch (error) {
      console.error("Erreur API profil:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        isLoading: false,
      }));
    }
  }, [session?.user?.id, saveToStorage]);

  // Mettre à jour la disponibilité
  const updateMyAvailability = useCallback(
    async (availability: AgentAvailability) => {
      if (!state.myProfile) return;

      try {
        const response = await fetch(
          `http://localhost:8081/api/agents/my-profile`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ availability }),
          }
        );

        if (response.ok) {
          const updatedProfile = await response.json();
          setState((prev) => ({ ...prev, myProfile: updatedProfile }));
          await saveToStorage({ myProfile: updatedProfile });
        }
      } catch (error) {
        console.error("Erreur mise à jour disponibilité:", error);
      }
    },
    [state.myProfile, saveToStorage]
  );

  // Mettre à jour la localisation
  const updateMyLocation = useCallback(
    async (location: any) => {
      if (!state.myProfile) return;

      try {
        const response = await fetch(
          `http://localhost:8081/api/agents/my-profile`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ currentLocation: location }),
          }
        );

        if (response.ok) {
          const updatedProfile = await response.json();
          setState((prev) => ({ ...prev, myProfile: updatedProfile }));
          await saveToStorage({ myProfile: updatedProfile });
        }
      } catch (error) {
        console.error("Erreur mise à jour localisation:", error);
      }
    },
    [state.myProfile, saveToStorage]
  );

  // Mettre à jour le profil
  const updateMyProfile = useCallback(
    async (data: {
      availability?: AgentAvailability;
      currentLocation?: any;
      workingHours?: any;
      availabilityCalendar?: any;
    }) => {
      if (!state.myProfile) return;

      try {
        const response = await fetch(
          `http://localhost:8081/api/agents/my-profile`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const updatedProfile = await response.json();
          setState((prev) => ({ ...prev, myProfile: updatedProfile }));
          await saveToStorage({ myProfile: updatedProfile });
        }
      } catch (error) {
        console.error("Erreur mise à jour profil:", error);
      }
    },
    [state.myProfile, saveToStorage]
  );

  // Charger mes tâches
  const loadMyTasks = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/agents/my-tasks`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const myTasks = await response.json();
        setState((prev) => ({ ...prev, myTasks }));
        await saveToStorage({ myTasks });
      }
    } catch (error) {
      console.error("Erreur API tâches:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Démarrer une tâche
  const startMyTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/task-assignments/${taskId}/start`,
        {
          method: "PATCH",
          headers,
        }
      );

      if (response.ok) {
        const updatedTask = await response.json();
        setState((prev) => ({
          ...prev,
          myTasks: prev.myTasks.map((task) =>
            task.id === taskId ? updatedTask : task
          ),
        }));
      }
    } catch (error) {
      console.error("Erreur démarrage tâche:", error);
    }
  }, []);

  // Compléter une tâche
  const completeMyTask = useCallback(async (taskId: string, notes?: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/task-assignments/${taskId}/complete`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        const updatedTask = await response.json();
        setState((prev) => ({
          ...prev,
          myTasks: prev.myTasks.map((task) =>
            task.id === taskId ? updatedTask : task
          ),
        }));
      }
    } catch (error) {
      console.error("Erreur completion tâche:", error);
    }
  }, []);

  // Mettre à jour les notes d'une tâche
  const updateMyTaskNotes = useCallback(
    async (taskId: string, notes: string) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/task-assignments/${taskId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ notes }),
          }
        );

        if (response.ok) {
          const updatedTask = await response.json();
          setState((prev) => ({
            ...prev,
            myTasks: prev.myTasks.map((task) =>
              task.id === taskId ? updatedTask : task
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur mise à jour notes:", error);
      }
    },
    []
  );

  // Charger mes sessions de nettoyage
  const loadMyCleaningSessions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/agents/my-cleaning-sessions`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const myCleaningSessions = await response.json();
        setState((prev) => ({ ...prev, myCleaningSessions }));
        await saveToStorage({ myCleaningSessions });
      }
    } catch (error) {
      console.error("Erreur API sessions nettoyage:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Démarrer une session de nettoyage
  const startCleaningSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/cleaning-sessions/${sessionId}/start`,
        {
          method: "PATCH",
          headers,
        }
      );

      if (response.ok) {
        const updatedSession = await response.json();
        setState((prev) => ({
          ...prev,
          myCleaningSessions: prev.myCleaningSessions.map((session) =>
            session.id === sessionId ? updatedSession : session
          ),
        }));
      }
    } catch (error) {
      console.error("Erreur démarrage session nettoyage:", error);
    }
  }, []);

  // Compléter une session de nettoyage
  const completeCleaningSession = useCallback(
    async (sessionId: string, agentNotes?: string) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/cleaning-sessions/${sessionId}/complete`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ agentNotes }),
          }
        );

        if (response.ok) {
          const updatedSession = await response.json();
          setState((prev) => ({
            ...prev,
            myCleaningSessions: prev.myCleaningSessions.map((session) =>
              session.id === sessionId ? updatedSession : session
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur completion session nettoyage:", error);
      }
    },
    []
  );

  // Mettre à jour le statut d'une session de nettoyage
  const updateCleaningSessionStatus = useCallback(
    async (sessionId: string, status: SessionStatus) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/cleaning-sessions/${sessionId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status }),
          }
        );

        if (response.ok) {
          const updatedSession = await response.json();
          setState((prev) => ({
            ...prev,
            myCleaningSessions: prev.myCleaningSessions.map((session) =>
              session.id === sessionId ? updatedSession : session
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur mise à jour statut session:", error);
      }
    },
    []
  );

  // Charger mes sessions de maintenance
  const loadMyMaintenanceSessions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/agents/my-maintenance-sessions`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const myMaintenanceSessions = await response.json();
        setState((prev) => ({ ...prev, myMaintenanceSessions }));
        await saveToStorage({ myMaintenanceSessions });
      }
    } catch (error) {
      console.error("Erreur API sessions maintenance:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Démarrer une session de maintenance
  const startMaintenanceSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/maintenance-sessions/${sessionId}/start`,
        {
          method: "PATCH",
          headers,
        }
      );

      if (response.ok) {
        const updatedSession = await response.json();
        setState((prev) => ({
          ...prev,
          myMaintenanceSessions: prev.myMaintenanceSessions.map((session) =>
            session.id === sessionId ? updatedSession : session
          ),
        }));
      }
    } catch (error) {
      console.error("Erreur démarrage session maintenance:", error);
    }
  }, []);

  // Compléter une session de maintenance
  const completeMaintenanceSession = useCallback(
    async (sessionId: string, agentNotes?: string) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance-sessions/${sessionId}/complete`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ agentNotes }),
          }
        );

        if (response.ok) {
          const updatedSession = await response.json();
          setState((prev) => ({
            ...prev,
            myMaintenanceSessions: prev.myMaintenanceSessions.map((session) =>
              session.id === sessionId ? updatedSession : session
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur completion session maintenance:", error);
      }
    },
    []
  );

  // Mettre à jour le statut d'une session de maintenance
  const updateMaintenanceSessionStatus = useCallback(
    async (sessionId: string, status: SessionStatus) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance-sessions/${sessionId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status }),
          }
        );

        if (response.ok) {
          const updatedSession = await response.json();
          setState((prev) => ({
            ...prev,
            myMaintenanceSessions: prev.myMaintenanceSessions.map((session) =>
              session.id === sessionId ? updatedSession : session
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur mise à jour statut session maintenance:", error);
      }
    },
    []
  );

  // Charger mes tickets
  const loadMyTickets = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/agents/my-tickets`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const myTickets = await response.json();
        setState((prev) => ({ ...prev, myTickets }));
        await saveToStorage({ myTickets });
      }
    } catch (error) {
      console.error("Erreur API tickets:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Créer un ticket
  const createTicket = useCallback(
    async (data: {
      title: string;
      description: string;
      propertyId: string;
      category?: string;
      issueType?: string;
      roomLocation?: string;
      priority?: TicketPriority;
    }) => {
      if (!state.myProfile) return;

      try {
        const response = await fetch("http://localhost:8081/api/tickets", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...data,
            reportedBy: "agent",
            managerId: state.myProfile.managerId,
            priority: data.priority || "medium",
          }),
        });

        if (response.ok) {
          const newTicket = await response.json();
          setState((prev) => ({
            ...prev,
            myTickets: [...prev.myTickets, newTicket],
          }));
          await saveToStorage({ myTickets: [...state.myTickets, newTicket] });
        }
      } catch (error) {
        console.error("Erreur création ticket:", error);
      }
    },
    [state.myProfile, state.myTickets, saveToStorage]
  );

  // Accepter un ticket
  const acceptTicket = useCallback(
    async (ticketId: string) => {
      if (!state.myProfile) return;

      try {
        const response = await fetch(
          `http://localhost:8081/api/tickets/${ticketId}/accept`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ agentId: state.myProfile.id }),
          }
        );

        if (response.ok) {
          const updatedTicket = await response.json();
          setState((prev) => ({
            ...prev,
            myTickets: prev.myTickets.map((ticket) =>
              ticket.id === ticketId ? updatedTicket : ticket
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur acceptation ticket:", error);
      }
    },
    [state.myProfile]
  );

  // Mettre à jour le statut d'un ticket
  const updateTicketStatus = useCallback(
    async (ticketId: string, status: TicketStatus, resolution?: string) => {
      try {
        const body: any = { status };
        if (resolution) {
          body.resolution = resolution;
          body.resolvedAt = new Date().toISOString();
        }

        const response = await fetch(
          `http://localhost:8081/api/tickets/${ticketId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify(body),
          }
        );

        if (response.ok) {
          const updatedTicket = await response.json();
          setState((prev) => ({
            ...prev,
            myTickets: prev.myTickets.map((ticket) =>
              ticket.id === ticketId ? updatedTicket : ticket
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur mise à jour statut ticket:", error);
      }
    },
    []
  );

  // Résoudre un ticket
  const resolveTicket = useCallback(
    async (ticketId: string, resolution: string) => {
      await updateTicketStatus(ticketId, "resolved", resolution);
    },
    [updateTicketStatus]
  );

  // Charger mes spécialités
  const loadMySpecialties = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/agents/my-specialties`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const mySpecialties = await response.json();
        setState((prev) => ({ ...prev, mySpecialties }));
        await saveToStorage({ mySpecialties });
      }
    } catch (error) {
      console.error("Erreur API spécialités:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Ajouter une spécialité
  const addMySpecialty = useCallback(
    async (data: {
      name: string;
      category?: string;
      level?: string;
      certified?: boolean;
    }) => {
      if (!state.myProfile) return;

      try {
        const response = await fetch(
          "http://localhost:8081/api/agent-specialties",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              ...data,
              agentId: state.myProfile.id,
            }),
          }
        );

        if (response.ok) {
          const newSpecialty = await response.json();
          setState((prev) => ({
            ...prev,
            mySpecialties: [...prev.mySpecialties, newSpecialty],
          }));
        }
      } catch (error) {
        console.error("Erreur ajout spécialité:", error);
      }
    },
    [state.myProfile]
  );

  // Mettre à jour une spécialité
  const updateMySpecialty = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        category?: string;
        level?: string;
        certified?: boolean;
      }
    ) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/agent-specialties/${id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const updatedSpecialty = await response.json();
          setState((prev) => ({
            ...prev,
            mySpecialties: prev.mySpecialties.map((specialty) =>
              specialty.id === id ? updatedSpecialty : specialty
            ),
          }));
        }
      } catch (error) {
        console.error("Erreur mise à jour spécialité:", error);
      }
    },
    []
  );

  // Supprimer une spécialité
  const removeMySpecialty = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/agent-specialties/${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          mySpecialties: prev.mySpecialties.filter(
            (specialty) => specialty.id !== id
          ),
        }));
      }
    } catch (error) {
      console.error("Erreur suppression spécialité:", error);
    }
  }, []);

  // Statistiques personnelles
  const getMyStats = useCallback(() => {
    if (!state.myProfile) {
      return {
        completedTasks: 0,
        averageRating: 0,
        activeTasks: 0,
        upcomingSessions: 0,
        openTickets: 0,
      };
    }

    const activeTasks = state.myTasks.filter(
      (task) => task.status === "assigned" || task.status === "in_progress"
    ).length;

    const upcomingSessions = [
      ...state.myCleaningSessions.filter(
        (session) => session.status === "planned"
      ),
      ...state.myMaintenanceSessions.filter(
        (session) => session.status === "planned"
      ),
    ].length;

    const openTickets = state.myTickets.filter(
      (ticket) =>
        ticket.status === "open" ||
        ticket.status === "assigned" ||
        ticket.status === "in_progress"
    ).length;

    return {
      completedTasks: state.myProfile.completedTasks,
      averageRating: state.myProfile.averageRating || 0,
      activeTasks,
      upcomingSessions,
      openTickets,
    };
  }, [state]);

  // Rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadMyProfile(),
      loadMyTasks(),
      loadMyCleaningSessions(),
      loadMyMaintenanceSessions(),
      loadMyTickets(),
      loadMySpecialties(),
    ]);
  }, [
    loadMyProfile,
    loadMyTasks,
    loadMyCleaningSessions,
    loadMyMaintenanceSessions,
    loadMyTickets,
    loadMySpecialties,
  ]);

  // Vider le cache
  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.MY_PROFILE),
        AsyncStorage.removeItem(STORAGE_KEYS.MY_TASKS),
        AsyncStorage.removeItem(STORAGE_KEYS.MY_CLEANING_SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.MY_MAINTENANCE_SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.MY_TICKETS),
        AsyncStorage.removeItem(STORAGE_KEYS.MY_SPECIALTIES),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
      ]);
      setState((prev) => ({
        ...prev,
        myProfile: null,
        myTasks: [],
        myCleaningSessions: [],
        myMaintenanceSessions: [],
        myTickets: [],
        mySpecialties: [],
        lastSync: null,
      }));
    } catch (error) {
      console.error("Erreur lors du vidage du cache:", error);
    }
  }, []);

  // Charger les données au montage et quand la session change
  useEffect(() => {
    if (session?.user?.id) {
      loadFromStorage().then(() => {
        refreshAll();
      });
    } else {
      clearCache();
    }
  }, [session?.user?.id, loadFromStorage, refreshAll, clearCache]);

  const contextValue: AgentProfileContextType = {
    // État
    ...state,

    // Actions
    loadMyProfile,
    updateMyAvailability,
    updateMyLocation,
    updateMyProfile,
    loadMySpecialties,
    addMySpecialty,
    updateMySpecialty,
    removeMySpecialty,
    loadMyTasks,
    startMyTask,
    completeMyTask,
    updateMyTaskNotes,
    loadMyCleaningSessions,
    startCleaningSession,
    completeCleaningSession,
    updateCleaningSessionStatus,
    loadMyMaintenanceSessions,
    startMaintenanceSession,
    completeMaintenanceSession,
    updateMaintenanceSessionStatus,
    loadMyTickets,
    createTicket,
    acceptTicket,
    updateTicketStatus,
    resolveTicket,
    getMyStats,
    refreshAll,
    clearCache,
  };

  return (
    <AgentProfileContext.Provider value={contextValue}>
      {children}
    </AgentProfileContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useMyAgentProfile = () => {
  const context = useContext(AgentProfileContext);
  if (!context) {
    throw new Error(
      "useMyAgentProfile doit être utilisé à l'intérieur d'un AgentProfileProvider"
    );
  }
  return context;
};

// Hook pour obtenir mes statistiques
export const useMyAgentStats = () => {
  const { getMyStats } = useMyAgentProfile();
  return getMyStats();
};

// Hook pour mes tâches actives
export const useMyActiveTasks = () => {
  const { myTasks } = useMyAgentProfile();
  return myTasks;
};

// Hook pour mes sessions à venir
export const useMyUpcomingSessions = () => {
  const { myCleaningSessions, myMaintenanceSessions } = useMyAgentProfile();
  return [
    ...myCleaningSessions.filter((session) => session.status === "planned"),
    ...myMaintenanceSessions.filter((session) => session.status === "planned"),
  ];
};

// Hook pour mes tickets ouverts
export const useMyOpenTickets = () => {
  const { myTickets } = useMyAgentProfile();
  return myTickets.filter(
    (ticket) =>
      ticket.status === "open" ||
      ticket.status === "assigned" ||
      ticket.status === "in_progress"
  );
};
