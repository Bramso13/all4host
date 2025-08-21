import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "~/lib/auth-client";
import {
  CleaningSession,
  Property,
  PoleManagerProfile,
  AgentProfile,
} from "~/lib/types";

interface CleaningContextState {
  sessions: CleaningSession[];
  isLoading: boolean;
  error: string | null;
}

interface CleaningContextActions {
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
    sessions: [],
    isLoading: false,
    error: null,
  });
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  const fetchSessions = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        "http://localhost:8081/api/cleaning-sessions",
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors du chargement des sessions"
        );
      }

      const sessions = await response.json();
      setState((prev) => ({
        ...prev,
        sessions,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Erreur fetchSessions:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des sessions",
        isLoading: false,
      }));
    }
  }, []);

  const createSession = useCallback(async (data: Partial<CleaningSession>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        "http://localhost:8081/api/cleaning-sessions",
        {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création de la session"
        );
      }

      const newSession = await response.json();
      setState((prev) => ({
        ...prev,
        sessions: [...prev.sessions, newSession],
        isLoading: false,
      }));

      return newSession;
    } catch (error) {
      console.error("Erreur createSession:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la session",
        isLoading: false,
      }));
      throw error;
    }
  }, []);
  const updateSession = useCallback(
    async (id: string, data: Partial<CleaningSession>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          "http://localhost:8081/api/cleaning-sessions",
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ id, ...data }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la mise à jour de la session"
          );
        }

        const updatedSession = await response.json();
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === id ? updatedSession : session
          ),
          isLoading: false,
        }));

        return updatedSession;
      } catch (error) {
        console.error("Erreur updateSession:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Erreur lors de la mise à jour de la session",
          isLoading: false,
        }));
        throw error;
      }
    },
    []
  );
  const deleteSession = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        "http://localhost:8081/api/cleaning-sessions",
        {
          method: "DELETE",
          headers,
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la suppression de la session"
        );
      }

      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((session) => session.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Erreur deleteSession:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression de la session",
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSessions();
    }
  }, [session?.user?.id]);

  const contextValue: CleaningContextType = {
    ...state,

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
