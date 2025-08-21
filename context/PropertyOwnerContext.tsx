import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "~/lib/auth-client";
import {
  PropertyOwnerProfile,
  Property,
  PropertyContract,
  Reservation,
  CleaningSession,
  MaintenanceSession,
  Ticket,
  PropertyReview,
  PropertyStatus,
} from "~/lib/types";

// Types pour les opérations limitées du propriétaire
export interface UpdatePropertyOwnerProfileData {
  company?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  postal?: string;
  preferredContactMethod?: string;
  receiveNotifications?: boolean;
}

// État du contexte
interface PropertyOwnerContextState {
  profile: PropertyOwnerProfile | null;
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

// Actions du contexte (limitées pour un propriétaire)
interface PropertyOwnerContextActions {
  // Profil (lecture et mise à jour seulement)
  getProfile: () => PropertyOwnerProfile | null;
  updateProfile: (data: UpdatePropertyOwnerProfileData) => Promise<PropertyOwnerProfile | null>;
  
  // Propriétés (lecture seulement, pas de création/suppression)
  getProperty: (id: string) => Property | undefined;
  getPropertyDetails: (id: string) => Promise<Property | null>;
  
  // Sélection de propriété
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;
  
  // Gestion des données
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => Promise<void>;
  
  // Filtres et recherche (lecture seulement)
  getPropertiesByStatus: (status: PropertyStatus) => Property[];
  searchProperties: (query: string) => Property[];
  
  // Statistiques (lectures seulement)
  getPropertiesStats: () => {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    reserved: number;
    offline: number;
  };
  
  // Données relationnelles (lecture seulement des activités sur ses biens)
  getReservationsByProperty: (propertyId: string) => Reservation[];
  getCleaningSessionsByProperty: (propertyId: string) => CleaningSession[];
  getMaintenanceSessionsByProperty: (propertyId: string) => MaintenanceSession[];
  getTicketsByProperty: (propertyId: string) => Ticket[];
  getReviewsByProperty: (propertyId: string) => PropertyReview[];
  
  // Statistiques des activités sur ses biens
  getReservationsStats: () => {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
    in_progress: number;
  };
  
  getMaintenanceStats: () => {
    total: number;
    planned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  
  getCleaningStats: () => {
    total: number;
    planned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  
  getTicketsStats: () => {
    total: number;
    open: number;
    assigned: number;
    in_progress: number;
    resolved: number;
    closed: number;
    cancelled: number;
  };

  // Données agrégées utiles pour le propriétaire
  getMonthlyRevenue: (propertyId?: string) => number;
  getOccupancyRate: (propertyId?: string) => number;
  getAverageRating: (propertyId?: string) => number;
  getUpcomingReservations: (days?: number) => Reservation[];
  getPendingMaintenance: () => MaintenanceSession[];
  getRecentReviews: (limit?: number) => PropertyReview[];
}

type PropertyOwnerContextType = PropertyOwnerContextState & PropertyOwnerContextActions;

// Clés AsyncStorage
const STORAGE_KEYS = {
  PROFILE: "property_owner_profile_cache",
  PROPERTIES: "property_owner_properties_cache",
  LAST_SYNC: "property_owner_last_sync",
};

// Création du contexte
const PropertyOwnerContext = createContext<PropertyOwnerContextType | null>(null);

// Provider du contexte
export const PropertyOwnerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session } = authClient.useSession();
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };
  
  const [state, setState] = useState<PropertyOwnerContextState>({
    profile: null,
    properties: [],
    selectedProperty: null,
    isLoading: false,
    error: null,
    lastSync: null,
  });

  // Sauvegarder dans AsyncStorage
  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      const lastSync = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, lastSync);
      setState((prev) => ({ ...prev, lastSync: new Date(lastSync) }));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans AsyncStorage:", error);
    }
  }, []);

  // Charger depuis AsyncStorage
  const loadFromStorage = useCallback(async () => {
    try {
      const [profileData, propertiesData, lastSyncData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      const profile = profileData ? JSON.parse(profileData) : null;
      const properties = propertiesData ? JSON.parse(propertiesData) : [];
      const lastSync = lastSyncData ? new Date(lastSyncData) : null;

      setState((prev) => ({
        ...prev,
        profile,
        properties,
        lastSync,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement depuis AsyncStorage:", error);
    }
  }, []);

  // Obtenir le profil
  const getProfile = useCallback((): PropertyOwnerProfile | null => {
    return state.profile;
  }, [state.profile]);

  // Mettre à jour le profil (limité aux champs autorisés)
  const updateProfile = useCallback(
    async (data: UpdatePropertyOwnerProfileData): Promise<PropertyOwnerProfile | null> => {
      if (!session?.user?.id || !state.profile?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/property-owners?id=${state.profile.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const updatedProfile = await response.json();
          setState((prev) => ({
            ...prev,
            profile: updatedProfile,
            isLoading: false,
          }));
          await saveToStorage(STORAGE_KEYS.PROFILE, updatedProfile);
          return updatedProfile;
        } else {
          throw new Error("Erreur lors de la mise à jour du profil");
        }
      } catch (error) {
        console.error("Erreur mise à jour profil:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.profile?.id, saveToStorage]
  );

  // Obtenir une propriété par ID
  const getProperty = useCallback(
    (id: string): Property | undefined => {
      return state.properties.find((p) => p.id === id);
    },
    [state.properties]
  );

  // Obtenir les détails d'une propriété avec toutes ses relations
  const getPropertyDetails = useCallback(
    async (id: string): Promise<Property | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/properties?id=${id}&include=all`, {
          method: "GET",
          headers,
        });

        if (response.ok) {
          const property = await response.json();
          setState((prev) => ({ ...prev, isLoading: false }));
          return property;
        } else {
          throw new Error("Erreur lors du chargement des détails de la propriété");
        }
      } catch (error) {
        console.error("Erreur détails propriété:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id]
  );

  // Sélectionner une propriété
  const setSelectedProperty = useCallback((property: Property | null) => {
    setState((prev) => ({ ...prev, selectedProperty: property }));
  }, []);

  // Charger toutes les données (profil + propriétés)
  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Charger le profil et les propriétés en parallèle
      const [profileResponse, propertiesResponse] = await Promise.all([
        fetch("http://localhost:8081/api/property-owners", {
          method: "GET",
          headers,
        }),
        fetch("http://localhost:8081/api/properties?owner=me", {
          method: "GET",
          headers,
        }),
      ]);

      const profile = profileResponse.ok ? (await profileResponse.json())[0] : null;
      const properties = propertiesResponse.ok ? await propertiesResponse.json() : [];

      setState((prev) => ({
        ...prev,
        profile,
        properties,
        isLoading: false,
      }));

      // Sauvegarder en cache
      if (profile) await saveToStorage(STORAGE_KEYS.PROFILE, profile);
      await saveToStorage(STORAGE_KEYS.PROPERTIES, properties);

    } catch (error) {
      console.error("Erreur chargement données:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        isLoading: false,
      }));
    }
  }, [session?.user?.id, saveToStorage]);

  // Actualiser toutes les données
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Vider le cache
  const clearData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.removeItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
      ]);
      setState((prev) => ({
        ...prev,
        profile: null,
        properties: [],
        selectedProperty: null,
        lastSync: null,
      }));
    } catch (error) {
      console.error("Erreur lors du vidage du cache:", error);
    }
  }, []);

  // Filtrer les propriétés par statut
  const getPropertiesByStatus = useCallback(
    (status: PropertyStatus): Property[] => {
      return state.properties.filter((p) => p.status === status);
    },
    [state.properties]
  );

  // Rechercher des propriétés
  const searchProperties = useCallback(
    (query: string): Property[] => {
      const lowerQuery = query.toLowerCase();
      return state.properties.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.address.toLowerCase().includes(lowerQuery) ||
          p.city.toLowerCase().includes(lowerQuery)
      );
    },
    [state.properties]
  );

  // Statistiques des propriétés
  const getPropertiesStats = useCallback(() => {
    const total = state.properties.length;
    const available = state.properties.filter((p) => p.status === "available").length;
    const occupied = state.properties.filter((p) => p.status === "occupied").length;
    const maintenance = state.properties.filter((p) => p.status === "maintenance").length;
    const reserved = state.properties.filter((p) => p.status === "reserved").length;
    const offline = state.properties.filter((p) => p.status === "offline").length;

    return { total, available, occupied, maintenance, reserved, offline };
  }, [state.properties]);

  // Obtenir les réservations par propriété
  const getReservationsByProperty = useCallback(
    (propertyId: string): Reservation[] => {
      const property = state.properties.find((p) => p.id === propertyId);
      return property?.reservations || [];
    },
    [state.properties]
  );

  // Obtenir les sessions de nettoyage par propriété
  const getCleaningSessionsByProperty = useCallback(
    (propertyId: string): CleaningSession[] => {
      const property = state.properties.find((p) => p.id === propertyId);
      return property?.cleaningSessions || [];
    },
    [state.properties]
  );

  // Obtenir les sessions de maintenance par propriété
  const getMaintenanceSessionsByProperty = useCallback(
    (propertyId: string): MaintenanceSession[] => {
      const property = state.properties.find((p) => p.id === propertyId);
      return property?.maintenanceSessions || [];
    },
    [state.properties]
  );

  // Obtenir les tickets par propriété
  const getTicketsByProperty = useCallback(
    (propertyId: string): Ticket[] => {
      const property = state.properties.find((p) => p.id === propertyId);
      return property?.tickets || [];
    },
    [state.properties]
  );

  // Obtenir les avis par propriété
  const getReviewsByProperty = useCallback(
    (propertyId: string): PropertyReview[] => {
      const property = state.properties.find((p) => p.id === propertyId);
      return property?.reviews || [];
    },
    [state.properties]
  );

  // Statistiques des réservations
  const getReservationsStats = useCallback(() => {
    const allReservations = state.properties.flatMap((p) => p.reservations || []);
    const total = allReservations.length;
    const confirmed = allReservations.filter((r) => r.status === "confirmed").length;
    const pending = allReservations.filter((r) => r.status === "pending").length;
    const cancelled = allReservations.filter((r) => r.status === "cancelled").length;
    const completed = allReservations.filter((r) => r.status === "completed").length;
    const in_progress = allReservations.filter((r) => r.status === "in_progress").length;

    return { total, confirmed, pending, cancelled, completed, in_progress };
  }, [state.properties]);

  // Statistiques de maintenance
  const getMaintenanceStats = useCallback(() => {
    const allSessions = state.properties.flatMap((p) => p.maintenanceSessions || []);
    const total = allSessions.length;
    const planned = allSessions.filter((s) => s.status === "planned").length;
    const in_progress = allSessions.filter((s) => s.status === "in_progress").length;
    const completed = allSessions.filter((s) => s.status === "completed").length;
    const cancelled = allSessions.filter((s) => s.status === "cancelled").length;

    return { total, planned, in_progress, completed, cancelled };
  }, [state.properties]);

  // Statistiques de nettoyage
  const getCleaningStats = useCallback(() => {
    const allSessions = state.properties.flatMap((p) => p.cleaningSessions || []);
    const total = allSessions.length;
    const planned = allSessions.filter((s) => s.status === "planned").length;
    const in_progress = allSessions.filter((s) => s.status === "in_progress").length;
    const completed = allSessions.filter((s) => s.status === "completed").length;
    const cancelled = allSessions.filter((s) => s.status === "cancelled").length;

    return { total, planned, in_progress, completed, cancelled };
  }, [state.properties]);

  // Statistiques des tickets
  const getTicketsStats = useCallback(() => {
    const allTickets = state.properties.flatMap((p) => p.tickets || []);
    const total = allTickets.length;
    const open = allTickets.filter((t) => t.status === "open").length;
    const assigned = allTickets.filter((t) => t.status === "assigned").length;
    const in_progress = allTickets.filter((t) => t.status === "in_progress").length;
    const resolved = allTickets.filter((t) => t.status === "resolved").length;
    const closed = allTickets.filter((t) => t.status === "closed").length;
    const cancelled = allTickets.filter((t) => t.status === "cancelled").length;

    return { total, open, assigned, in_progress, resolved, closed, cancelled };
  }, [state.properties]);

  // Revenus mensuels
  const getMonthlyRevenue = useCallback((propertyId?: string): number => {
    const properties = propertyId 
      ? state.properties.filter(p => p.id === propertyId)
      : state.properties;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return properties.reduce((total, property) => {
      const monthlyReservations = property.reservations?.filter(r => {
        const checkInDate = new Date(r.checkIn);
        return checkInDate.getMonth() === currentMonth && 
               checkInDate.getFullYear() === currentYear &&
               r.status === "completed";
      }) || [];
      
      return total + monthlyReservations.reduce((sum, r) => sum + r.totalPrice, 0);
    }, 0);
  }, [state.properties]);

  // Taux d'occupation
  const getOccupancyRate = useCallback((propertyId?: string): number => {
    const properties = propertyId 
      ? state.properties.filter(p => p.id === propertyId)
      : state.properties;
    
    if (properties.length === 0) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const totalOccupiedDays = properties.reduce((total, property) => {
      const occupiedDays = property.reservations?.filter(r => {
        const checkIn = new Date(r.checkIn);
        const checkOut = new Date(r.checkOut);
        return checkIn.getMonth() === currentMonth && 
               checkIn.getFullYear() === currentYear &&
               (r.status === "confirmed" || r.status === "completed" || r.status === "in_progress");
      }).reduce((days, r) => days + r.nights, 0) || 0;
      
      return total + occupiedDays;
    }, 0);
    
    return (totalOccupiedDays / (properties.length * daysInMonth)) * 100;
  }, [state.properties]);

  // Note moyenne
  const getAverageRating = useCallback((propertyId?: string): number => {
    const properties = propertyId 
      ? state.properties.filter(p => p.id === propertyId)
      : state.properties;
    
    const allReviews = properties.flatMap(p => p.reviews || []);
    if (allReviews.length === 0) return 0;
    
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / allReviews.length;
  }, [state.properties]);

  // Réservations à venir
  const getUpcomingReservations = useCallback((days: number = 7): Reservation[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return state.properties.flatMap(p => p.reservations || [])
      .filter(r => {
        const checkIn = new Date(r.checkIn);
        return checkIn >= new Date() && 
               checkIn <= futureDate &&
               (r.status === "confirmed" || r.status === "pending");
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  }, [state.properties]);

  // Maintenance en attente
  const getPendingMaintenance = useCallback((): MaintenanceSession[] => {
    return state.properties.flatMap(p => p.maintenanceSessions || [])
      .filter(s => s.status === "planned" || s.status === "in_progress")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [state.properties]);

  // Avis récents
  const getRecentReviews = useCallback((limit: number = 10): PropertyReview[] => {
    return state.properties.flatMap(p => p.reviews || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [state.properties]);

  // Charger les données au montage et quand la session change
  useEffect(() => {
    if (session?.user?.id) {
      loadFromStorage().then(() => {
        refreshData();
      });
    } else {
      clearData();
    }
  }, [session?.user?.id, loadFromStorage, refreshData, clearData]);

  const contextValue: PropertyOwnerContextType = {
    // État
    ...state,
    
    // Actions profil
    getProfile,
    updateProfile,
    
    // Actions propriétés (lecture seulement)
    getProperty,
    getPropertyDetails,
    
    // Sélection
    setSelectedProperty,
    
    // Gestion des données
    loadData,
    refreshData,
    clearData,
    
    // Filtres et recherche
    getPropertiesByStatus,
    searchProperties,
    
    // Statistiques
    getPropertiesStats,
    
    // Données relationnelles
    getReservationsByProperty,
    getCleaningSessionsByProperty,
    getMaintenanceSessionsByProperty,
    getTicketsByProperty,
    getReviewsByProperty,
    
    // Statistiques des activités
    getReservationsStats,
    getMaintenanceStats,
    getCleaningStats,
    getTicketsStats,
    
    // Données agrégées pour le propriétaire
    getMonthlyRevenue,
    getOccupancyRate,
    getAverageRating,
    getUpcomingReservations,
    getPendingMaintenance,
    getRecentReviews,
  };

  return (
    <PropertyOwnerContext.Provider value={contextValue}>
      {children}
    </PropertyOwnerContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const usePropertyOwner = () => {
  const context = useContext(PropertyOwnerContext);
  if (!context) {
    throw new Error(
      "usePropertyOwner doit être utilisé à l'intérieur d'un PropertyOwnerProvider"
    );
  }
  return context;
};

// Hooks spécialisés pour des cas d'usage spécifiques
export const usePropertyOwnerProfile = () => {
  const { profile, getProfile, updateProfile } = usePropertyOwner();
  return { profile, getProfile, updateProfile };
};

export const usePropertyOwnerProperties = () => {
  const {
    properties,
    selectedProperty,
    setSelectedProperty,
    getProperty,
    getPropertyDetails,
    getPropertiesByStatus,
    searchProperties,
    getPropertiesStats,
  } = usePropertyOwner();
  
  return {
    properties,
    selectedProperty,
    setSelectedProperty,
    getProperty,
    getPropertyDetails,
    getPropertiesByStatus,
    searchProperties,
    getPropertiesStats,
  };
};

export const usePropertyOwnerDashboard = () => {
  const {
    getMonthlyRevenue,
    getOccupancyRate,
    getAverageRating,
    getUpcomingReservations,
    getPendingMaintenance,
    getRecentReviews,
    getReservationsStats,
    getMaintenanceStats,
    getCleaningStats,
    getTicketsStats,
  } = usePropertyOwner();
  
  return {
    getMonthlyRevenue,
    getOccupancyRate,
    getAverageRating,
    getUpcomingReservations,
    getPendingMaintenance,
    getRecentReviews,
    getReservationsStats,
    getMaintenanceStats,
    getCleaningStats,
    getTicketsStats,
  };
};