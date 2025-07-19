import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthScreen } from "~/components/screen/AuthScreen";
import { authClient } from "~/lib/auth-client";

// Types pour Better Auth
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  serviceUsers?: Array<{
    id: string;
    service: {
      id: string;
      name: string;
      type: string;
    };
  }>;
}

interface Session {
  user: User;
  expires: string;
}

interface SessionContextType {
  session: Session | null;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<string | null>;
  onLogout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Utiliser le hook useSession de Better Auth
  const { data: authSession, isPending } = authClient.useSession();
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  // Fonction pour récupérer les données complètes de l'utilisateur
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch("http://localhost:8081/api/user", {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else {
        console.error("Erreur lors de la récupération des données utilisateur");
        return null;
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données utilisateur:",
        error
      );
      return null;
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = async () => {
    if (session?.user?.id) {
      const userData = await fetchUserData(session.user.id);
      if (userData) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                user: userData,
              }
            : null
        );
      }
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (authSession) {
        // Récupérer les données complètes de l'utilisateur
        fetchUserData(authSession.user.id).then((userData) => {
          if (userData) {
            setSession({
              user: userData,
              expires: authSession.session.expiresAt.toISOString(),
            });
          } else {
            // Fallback avec les données de base si l'API échoue
            setSession({
              user: {
                id: authSession.user.id,
                email: authSession.user.email,
                name: authSession.user.name,
                role: "user", // Par défaut
              },
              expires: authSession.session.expiresAt.toISOString(),
            });
          }
          setIsLoading(false);
        });
      } else {
        setSession(null);
        setIsLoading(false);
      }
    }
  }, [authSession, isPending]);

  const onLogin = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        return result.error.message || "Erreur de connexion";
      }

      return null;
    } catch (error) {
      return "Erreur de connexion";
    }
  };

  const onRegister = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<string | null> => {
    if (password !== confirmPassword) {
      return "Les mots de passe ne correspondent pas";
    }

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        return result.error.message || "Erreur d'inscription";
      }

      return null;
    } catch (error) {
      return "Erreur d'inscription";
    }
  };

  const onLogout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const value = {
    session,
    onLogin,
    onRegister,
    onLogout,
    refreshUserData,
  };

  return (
    <SessionContext.Provider value={value}>
      {session ? (
        children
      ) : (
        <AuthScreen
          isLoading={isLoading}
          onLogin={onLogin}
          onRegister={onRegister}
        />
      )}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const session = useContext(SessionContext);
  if (session === undefined) {
    throw new Error(
      "useSession doit être utilisé à l'intérieur d'un SessionProvider"
    );
  }
  return session;
};

// Hook pour accéder au client Better Auth
export const useAuthClient = () => {
  return authClient;
};
