import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "~/lib/auth-client";
import {
  Ticket,
  MaintenanceSession,
  MaintenanceMaterial,
  MaintenancePhoto,
  TicketPhoto,
} from "~/lib/types";

// Interface du contexte
interface MaintenanceContextType {
  // Data
  tickets: Ticket[];
  sessions: MaintenanceSession[];

  // États
  isLoading: boolean;
  error: string | null;

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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sessions, setSessions] = useState<MaintenanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  // Actions Tickets
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8081/api/maintenance/tickets",
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tickets");
      }
      const tickets = await response.json();
      setTickets(tickets);
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
        const response = await fetch(
          "http://localhost:8081/api/maintenance/tickets",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(ticketData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création du ticket");
        }

        const newTicket = await response.json();
        setTickets((prev) => [...prev, newTicket]);
      } catch (err) {
        setError("Erreur lors de la création du ticket");
      }
    },
    []
  );

  const updateTicket = useCallback(
    async (id: string, ticketData: Partial<Ticket>) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance/tickets?id=${id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(ticketData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du ticket");
        }

        const updatedTicket = await response.json();
        setTickets((prev) =>
          prev.map((ticket) => (ticket.id === id ? updatedTicket : ticket))
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du ticket");
      }
    },
    []
  );

  const deleteTicket = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/maintenance/tickets?id=${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du ticket");
      }

      setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du ticket");
    }
  }, []);

  const assignTicket = useCallback(
    async (ticketId: string, agentId: string) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance/tickets?id=${ticketId}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify({ agentId }),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de l'assignation du ticket");
        }

        const updatedTicket = await response.json();
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId ? updatedTicket : ticket
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
        const response = await fetch(
          `http://localhost:8081/api/maintenance/tickets?id=${ticketId}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify({ status: "resolved", resolution }),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la résolution du ticket");
        }

        const updatedTicket = await response.json();
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId ? updatedTicket : ticket
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
      const response = await fetch(
        "http://localhost:8081/api/maintenance/sessions",
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des sessions");
      }
      const sessions = await response.json();
      setSessions(sessions);
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
        const response = await fetch(
          "http://localhost:8081/api/maintenance/sessions",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(sessionData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création de la session");
        }

        const newSession = await response.json();
        setSessions((prev) => [...prev, newSession]);
      } catch (err) {
        setError("Erreur lors de la création de la session");
      }
    },
    []
  );

  const updateSession = useCallback(
    async (id: string, sessionData: Partial<MaintenanceSession>) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance/sessions?id=${id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(sessionData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de la session");
        }

        const updatedSession = await response.json();
        setSessions((prev) =>
          prev.map((session) => (session.id === id ? updatedSession : session))
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la session");
      }
    },
    []
  );

  const deleteSession = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/maintenance/sessions?id=${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la session");
      }

      setSessions((prev) => prev.filter((session) => session.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la session");
    }
  }, []);

  // Actions Materials & Photos
  const addMaterial = useCallback(
    async (
      sessionId: string,
      materialData: Omit<MaintenanceMaterial, "id">
    ) => {
      try {
        const response = await fetch(
          "http://localhost:8081/api/maintenance/materials",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify({
              ...materialData,
              maintenanceSessionId: sessionId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout du matériel");
        }

        const newMaterial = await response.json();
        // Rafraîchir les sessions pour avoir les coûts à jour
        fetchSessions();
      } catch (err) {
        setError("Erreur lors de l'ajout du matériel");
      }
    },
    []
  );

  const updateMaterial = useCallback(
    async (materialId: string, materialData: Partial<MaintenanceMaterial>) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance/materials?id=${materialId}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(materialData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du matériel");
        }

        const updatedMaterial = await response.json();
        // Rafraîchir les sessions pour avoir les coûts à jour
        fetchSessions();
      } catch (err) {
        setError("Erreur lors de la mise à jour du matériel");
      }
    },
    []
  );

  const removeMaterial = useCallback(
    async (materialId: string, sessionId: string) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/maintenance/materials?id=${materialId}`,
          {
            method: "DELETE",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du matériel");
        }

        // Rafraîchir les sessions pour avoir les coûts à jour
        fetchSessions();
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
        const response = await fetch(
          "http://localhost:8081/api/maintenance/photos",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify({
              ...photoData,
              maintenanceSessionId: sessionId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout de la photo");
        }

        const newPhoto = await response.json();
        // Rafraîchir les sessions pour avoir les photos à jour
        fetchSessions();
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
        const response = await fetch(
          "http://localhost:8081/api/maintenance/photos",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify({
              ...photoData,
              ticketId: ticketId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout de la photo au ticket");
        }

        const newPhoto = await response.json();
        // Rafraîchir les tickets pour avoir les photos à jour
        fetchTickets();
      } catch (err) {
        setError("Erreur lors de l'ajout de la photo au ticket");
      }
    },
    []
  );

  // Chargement initial
  useEffect(() => {
    if (session?.user) {
      fetchTickets();
      fetchSessions();
    }
  }, [session?.user]);

  const contextValue: MaintenanceContextType = {
    // Data

    tickets,
    sessions,

    // États
    isLoading,
    error,

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
