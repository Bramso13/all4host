import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "./SessionContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { authClient } from "~/lib/auth-client";

// Types basés sur le schéma Prisma
export interface ConciergerieManager {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  properties?: Property[];
}

export interface Property {
  id: string;
  name: string;
  description: string;
  status: "available" | "occupied" | "maintenance" | "reserved";
  location?: string;
  surface?: number;
  numberOfRooms?: number;
  numberOfBathrooms?: number;
  createdAt: string;
  updatedAt: string;
  conciergerieManagerId: string;
  conciergerieManager?: ConciergerieManager;
  photos?: PropertyPhoto[];
  reservations?: Reservation[];
  tickets?: Ticket[];
  payments?: Payment[];
  cleaningSessions?: CleaningSession[];
  maintenanceSessions?: MaintenanceSession[];
}

export interface PropertyPhoto {
  id: string;
  url: string;
  type?: string; // before, after, general
  propertyId: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  client?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority?: string;
  propertyId: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method?: string;
  status?: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningSession {
  id: string;
  propertyId: string;
  cleaningId: string;
  agentId: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceSession {
  id: string;
  propertyId: string;
  maintenanceId: string;
  agentId: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: "cleaning" | "laundry" | "maintenance";
  createdAt: string;
  updatedAt: string;
  conciergerieManagerId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  maintenanceSessions?: MaintenanceSession[];
  cleaningSessions?: CleaningSession[];
  tasks?: Task[];
  tickets?: Ticket[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: "cleaning" | "laundry" | "maintenance";
  createdAt: string;
  updatedAt: string;
  conciergerieManagerId?: string;
  agentId?: string;
}

// Types pour les opérations
export interface CreateConciergerieManagerData {
  name: string;
}

export interface CreatePropertyData {
  name: string;
  description: string;
  status?: "available" | "occupied" | "maintenance" | "reserved";
  location?: string;
  surface?: number;
  numberOfRooms?: number;
  numberOfBathrooms?: number;
}

export interface CreateAgentData {
  name: string;
  description: string;
  type: "cleaning" | "laundry" | "maintenance";
  userId: string;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  type?: "cleaning" | "laundry" | "maintenance";
}

export interface UpdatePropertyData {
  name?: string;
  description?: string;
  status?: "available" | "occupied" | "maintenance" | "reserved";
  location?: string;
  surface?: number;
  numberOfRooms?: number;
  numberOfBathrooms?: number;
}

// État du contexte
interface PropertyContextState {
  properties: Property[];
  conciergerieManager: ConciergerieManager | null;
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

// Actions du contexte
interface PropertyContextActions {
  // Opérations CRUD ConciergerieManager
  createConciergerieManager: (
    data: CreateConciergerieManagerData
  ) => Promise<ConciergerieManager | null>;
  getConciergerieManager: () => ConciergerieManager | null;
  setShowCreateManagerModal: (show: boolean) => void;

  // Opérations CRUD Property
  createProperty: (data: CreatePropertyData) => Promise<Property | null>;
  updateProperty: (
    id: string,
    data: UpdatePropertyData
  ) => Promise<Property | null>;
  deleteProperty: (id: string) => Promise<boolean>;
  getProperty: (id: string) => Property | undefined;

  // Opérations CRUD Agent
  createAgent: (data: CreateAgentData) => Promise<Agent | null>;
  updateAgent: (id: string, data: UpdateAgentData) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  getAgent: (id: string) => Agent | undefined;
  selectedProperty: Property | null;

  // Gestion des données
  loadProperties: () => Promise<void>;
  refreshProperties: () => Promise<void>;
  clearProperties: () => Promise<void>;

  // Filtres et recherche
  getPropertiesByStatus: (status: Property["status"]) => Property[];
  searchProperties: (query: string) => Property[];
  getAgentsByType: (type: Agent["type"]) => Agent[];
  searchAgents: (query: string) => Agent[];

  // Statistiques
  getPropertiesStats: () => {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    reserved: number;
  };
  getAgentsStats: () => {
    total: number;
    cleaning: number;
    laundry: number;
    maintenance: number;
  };
}

type PropertyContextType = PropertyContextState & PropertyContextActions;

// Clés AsyncStorage
const STORAGE_KEYS = {
  PROPERTIES: "properties_cache",
  CONCIERGERIE_MANAGER: "conciergerie_manager_cache",
  AGENTS: "agents_cache",
  LAST_SYNC: "properties_last_sync",
};

// Création du contexte
const PropertyContext = createContext<PropertyContextType | null>(null);

// Provider du contexte
export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sessionContext = useSession();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    status: "available" as Property["status"],
    location: "",
    surface: "",
    numberOfRooms: "",
    numberOfBathrooms: "",
  });
  const [createManagerForm, setCreateManagerForm] = useState({
    name: "",
  });

  const session = sessionContext?.session;
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };
  const [state, setState] = useState<PropertyContextState>({
    properties: [],
    conciergerieManager: null,
    agents: [],
    isLoading: false,
    error: null,
    lastSync: null,
  });

  // Sauvegarder le manager de conciergerie dans AsyncStorage
  const saveManagerToStorage = useCallback(
    async (manager: ConciergerieManager) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CONCIERGERIE_MANAGER,
          JSON.stringify(manager)
        );
      } catch (error) {
        console.error(
          "Erreur lors de la sauvegarde du manager dans AsyncStorage:",
          error
        );
      }
    },
    []
  );

  const handleAddProperty = () => {
    console.log("handleAddProperty");
    if (!state.conciergerieManager) {
      setShowCreateManagerModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleCreateManager = async () => {
    if (!createManagerForm.name.trim()) {
      Alert.alert("Erreur", "Le nom est obligatoire");
      return;
    }

    const managerData = {
      name: createManagerForm.name.trim(),
    };

    const newManager = await createConciergerieManager(managerData);
    if (newManager) {
      setShowCreateManagerModal(false);
      setCreateManagerForm({ name: "" });
      Alert.alert("Succès", "Manager de conciergerie créé avec succès");
      // Ouvrir automatiquement le modal de création de propriété
      setShowCreateModal(true);
    }
  };

  const handleCreateProperty = async () => {
    if (!createForm.name.trim() || !createForm.description.trim()) {
      Alert.alert("Erreur", "Le nom et la description sont obligatoires");
      return;
    }

    const propertyData = {
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      status: createForm.status,
      location: createForm.location.trim() || undefined,
      surface: createForm.surface ? parseFloat(createForm.surface) : undefined,
      numberOfRooms: createForm.numberOfRooms
        ? parseInt(createForm.numberOfRooms)
        : undefined,
      numberOfBathrooms: createForm.numberOfBathrooms
        ? parseInt(createForm.numberOfBathrooms)
        : undefined,
    };

    const newProperty = await createProperty(propertyData);
    if (newProperty) {
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        description: "",
        status: "available",
        location: "",
        surface: "",
        numberOfRooms: "",
        numberOfBathrooms: "",
      });
      Alert.alert("Succès", "Propriété créée avec succès");
    }
  };

  const resetForm = () => {
    setCreateForm({
      name: "",
      description: "",
      status: "available",
      location: "",
      surface: "",
      numberOfRooms: "",
      numberOfBathrooms: "",
    });
  };

  // Créer un ConciergerieManager
  const createConciergerieManager = useCallback(
    async (
      data: CreateConciergerieManagerData
    ): Promise<ConciergerieManager | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          "http://localhost:8081/api/conciergerie-managers",
          {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const newManager = await response.json();
          setState((prev) => ({
            ...prev,
            conciergerieManager: newManager,
            isLoading: false,
          }));
          await saveManagerToStorage(newManager);
          return newManager;
        } else {
          throw new Error(
            "Erreur lors de la création du manager de conciergerie"
          );
        }
      } catch (error) {
        console.error("Erreur création manager:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, saveManagerToStorage]
  );

  // Obtenir le ConciergerieManager
  const getConciergerieManager = useCallback((): ConciergerieManager | null => {
    return state.conciergerieManager;
  }, [state.conciergerieManager]);

  // Charger les données depuis AsyncStorage
  const loadFromStorage = useCallback(async () => {
    try {
      const [propertiesData, lastSyncData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (propertiesData) {
        const properties = JSON.parse(propertiesData);
        const lastSync = lastSyncData ? new Date(lastSyncData) : null;

        setState((prev) => ({
          ...prev,
          properties,
          lastSync,
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement depuis AsyncStorage:", error);
    }
  }, []);

  // Sauvegarder les données dans AsyncStorage
  const saveToStorage = useCallback(async (properties: Property[]) => {
    try {
      const lastSync = new Date().toISOString();
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.PROPERTIES,
          JSON.stringify(properties)
        ),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, lastSync),
      ]);

      setState((prev) => ({
        ...prev,
        lastSync: new Date(lastSync),
      }));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans AsyncStorage:", error);
    }
  }, []);

  // Charger le manager de conciergerie depuis l'API
  const loadManagerFromAPI = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        "http://localhost:8081/api/conciergerie-managers",
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const managers = await response.json();
        if (managers && managers.length > 0) {
          const manager = managers[0]; // Prendre le premier manager
          setState((prev) => ({ ...prev, conciergerieManager: manager }));
          await saveManagerToStorage(manager);
        } else {
          // Aucun manager trouvé, vider le cache
          setState((prev) => ({ ...prev, conciergerieManager: null }));
          await AsyncStorage.removeItem(STORAGE_KEYS.CONCIERGERIE_MANAGER);
        }
      }
    } catch (error) {
      console.error("Erreur API manager:", error);
      // En cas d'erreur, essayer de charger depuis le cache
      try {
        const cachedManager = await AsyncStorage.getItem(
          STORAGE_KEYS.CONCIERGERIE_MANAGER
        );
        if (cachedManager) {
          const manager = JSON.parse(cachedManager);
          setState((prev) => ({ ...prev, conciergerieManager: manager }));
        }
      } catch (cacheError) {
        console.error(
          "Erreur lors du chargement du cache manager:",
          cacheError
        );
      }
    }
  }, [session?.user?.id, saveManagerToStorage]);

  // Charger les propriétés depuis l'API
  const loadPropertiesFromAPI = useCallback(async () => {
    if (!session?.user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("http://localhost:8081/api/properties", {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const properties = await response.json();
        setState((prev) => ({ ...prev, properties, isLoading: false }));
        await saveToStorage(properties);
      } else {
        throw new Error("Erreur lors du chargement des propriétés");
      }
    } catch (error) {
      console.error("Erreur API:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        isLoading: false,
      }));
    }
  }, [session?.user?.id, saveToStorage]);

  // Créer une propriété
  const createProperty = useCallback(
    async (data: CreatePropertyData): Promise<Property | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("http://localhost:8081/api/properties", {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const newProperty = await response.json();
          setState((prev) => ({
            ...prev,
            properties: [...prev.properties, newProperty],
            isLoading: false,
          }));
          await saveToStorage([...state.properties, newProperty]);
          return newProperty;
        } else {
          throw new Error(
            "Erreur lors de la création de la propriété: " + response.status
          );
        }
      } catch (error) {
        console.error("Erreur création:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.properties, saveToStorage]
  );

  // Mettre à jour une propriété
  const updateProperty = useCallback(
    async (id: string, data: UpdatePropertyData): Promise<Property | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/properties`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ id, ...data }),
        });

        if (response.ok) {
          const updatedProperty = await response.json();
          setState((prev) => ({
            ...prev,
            properties: prev.properties.map((p) =>
              p.id === id ? updatedProperty : p
            ),
            isLoading: false,
          }));
          await saveToStorage(
            state.properties.map((p) => (p.id === id ? updatedProperty : p))
          );
          return updatedProperty;
        } else {
          throw new Error("Erreur lors de la mise à jour de la propriété");
        }
      } catch (error) {
        console.error("Erreur mise à jour:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.properties, saveToStorage]
  );

  // Supprimer une propriété
  const deleteProperty = useCallback(
    async (id: string): Promise<boolean> => {
      if (!session?.user?.id) return false;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/properties`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          setState((prev) => ({
            ...prev,
            properties: prev.properties.filter((p) => p.id !== id),
            isLoading: false,
          }));
          await saveToStorage(state.properties.filter((p) => p.id !== id));
          return true;
        } else {
          throw new Error("Erreur lors de la suppression de la propriété");
        }
      } catch (error) {
        console.error("Erreur suppression:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return false;
      }
    },
    [session?.user?.id, state.properties, saveToStorage]
  );

  // Obtenir une propriété par ID
  const getProperty = useCallback(
    (id: string): Property | undefined => {
      return state.properties.find((p) => p.id === id);
    },
    [state.properties]
  );

  // Charger les propriétés (depuis le cache puis l'API)
  const loadProperties = useCallback(async () => {
    await loadFromStorage();
    // Toujours charger le manager depuis l'API
    await loadManagerFromAPI();
    await loadPropertiesFromAPI();
  }, [loadFromStorage, loadManagerFromAPI, loadPropertiesFromAPI]);

  // Rafraîchir les propriétés depuis l'API
  const refreshProperties = useCallback(async () => {
    // Toujours rafraîchir le manager depuis l'API
    await loadManagerFromAPI();
    await loadPropertiesFromAPI();
  }, [loadManagerFromAPI, loadPropertiesFromAPI]);

  // Vider le cache
  const clearProperties = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.removeItem(STORAGE_KEYS.CONCIERGERIE_MANAGER),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
      ]);
      setState((prev) => ({
        ...prev,
        properties: [],
        conciergerieManager: null,
        lastSync: null,
      }));
    } catch (error) {
      console.error("Erreur lors du vidage du cache:", error);
    }
  }, []);

  // Filtrer par statut
  const getPropertiesByStatus = useCallback(
    (status: Property["status"]): Property[] => {
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
          p.location?.toLowerCase().includes(lowerQuery)
      );
    },
    [state.properties]
  );

  // Obtenir les statistiques
  const getPropertiesStats = useCallback(() => {
    const total = state.properties.length;
    const available = state.properties.filter(
      (p) => p.status === "available"
    ).length;
    const occupied = state.properties.filter(
      (p) => p.status === "occupied"
    ).length;
    const maintenance = state.properties.filter(
      (p) => p.status === "maintenance"
    ).length;
    const reserved = state.properties.filter(
      (p) => p.status === "reserved"
    ).length;

    return { total, available, occupied, maintenance, reserved };
  }, [state.properties]);

  // Créer un agent
  const createAgent = useCallback(
    async (data: CreateAgentData): Promise<Agent | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("http://localhost:8081/api/agents", {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const newAgent = await response.json();
          setState((prev) => ({
            ...prev,
            agents: [...prev.agents, newAgent],
            isLoading: false,
          }));
          return newAgent;
        } else {
          throw new Error("Erreur lors de la création de l'agent");
        }
      } catch (error) {
        console.error("Erreur création agent:", error);
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

  // Mettre à jour un agent
  const updateAgent = useCallback(
    async (id: string, data: UpdateAgentData): Promise<Agent | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/agents`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ id, ...data }),
        });

        if (response.ok) {
          const updatedAgent = await response.json();
          setState((prev) => ({
            ...prev,
            agents: prev.agents.map((a) => (a.id === id ? updatedAgent : a)),
            isLoading: false,
          }));
          return updatedAgent;
        } else {
          throw new Error("Erreur lors de la mise à jour de l'agent");
        }
      } catch (error) {
        console.error("Erreur mise à jour agent:", error);
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

  // Supprimer un agent
  const deleteAgent = useCallback(
    async (id: string): Promise<boolean> => {
      if (!session?.user?.id) return false;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/agents`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          setState((prev) => ({
            ...prev,
            agents: prev.agents.filter((a) => a.id !== id),
            isLoading: false,
          }));
          return true;
        } else {
          throw new Error("Erreur lors de la suppression de l'agent");
        }
      } catch (error) {
        console.error("Erreur suppression agent:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return false;
      }
    },
    [session?.user?.id]
  );

  // Obtenir un agent par ID
  const getAgent = useCallback(
    (id: string): Agent | undefined => {
      return state.agents.find((a) => a.id === id);
    },
    [state.agents]
  );

  // Filtrer les agents par type
  const getAgentsByType = useCallback(
    (type: Agent["type"]): Agent[] => {
      return state.agents.filter((a) => a.type === type);
    },
    [state.agents]
  );

  // Rechercher des agents
  const searchAgents = useCallback(
    (query: string): Agent[] => {
      const lowerQuery = query.toLowerCase();
      return state.agents.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerQuery) ||
          a.description.toLowerCase().includes(lowerQuery)
      );
    },
    [state.agents]
  );

  // Obtenir les statistiques des agents
  const getAgentsStats = useCallback(() => {
    const total = state.agents.length;
    const cleaning = state.agents.filter((a) => a.type === "cleaning").length;
    const laundry = state.agents.filter((a) => a.type === "laundry").length;
    const maintenance = state.agents.filter(
      (a) => a.type === "maintenance"
    ).length;

    return { total, cleaning, laundry, maintenance };
  }, [state.agents]);

  // Charger les agents depuis l'API
  const loadAgentsFromAPI = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("http://localhost:8081/api/agents", {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const agents = await response.json();
        setState((prev) => ({ ...prev, agents }));
      }
    } catch (error) {
      console.error("Erreur API agents:", error);
    }
  }, [session?.user?.id]);

  // Charger les données au montage et quand la session change
  useEffect(() => {
    if (session?.user?.id) {
      loadProperties();
    } else {
      clearProperties();
    }
  }, [session?.user?.id, loadProperties, clearProperties]);

  const contextValue: PropertyContextType = {
    // État
    ...state,
    // Actions Agent
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    selectedProperty,
    // Actions ConciergerieManager
    createConciergerieManager,
    getConciergerieManager,
    setShowCreateManagerModal,
    // Actions Property
    createProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    loadProperties,
    refreshProperties,
    clearProperties,
    getPropertiesByStatus,
    searchProperties,
    getPropertiesStats,
    // Actions Agent
    getAgentsByType,
    searchAgents,
    getAgentsStats,
  };

  return (
    <PropertyContext.Provider value={contextValue}>
      <PropertyDropdown
        selectedProperty={selectedProperty}
        onPropertySelect={setSelectedProperty}
        onAddProperty={handleAddProperty}
      />

      {/* Modal de création de ConciergerieManager */}
      <Modal
        visible={showCreateManagerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateManagerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Créer un manager de conciergerie
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCreateManagerModal(false);
                setCreateManagerForm({ name: "" });
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom du manager *</Text>
              <TextInput
                style={styles.input}
                value={createManagerForm.name}
                onChangeText={(text) => setCreateManagerForm({ name: text })}
                placeholder="Nom du manager de conciergerie"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateManagerModal(false);
                setCreateManagerForm({ name: "" });
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                state.isLoading && styles.createButtonDisabled,
              ]}
              onPress={handleCreateManager}
              disabled={state.isLoading}
            >
              <Text style={styles.createButtonText}>
                {state.isLoading ? "Création..." : "Créer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de création de propriété */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Créer une nouvelle propriété</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={createForm.name}
                onChangeText={(text) =>
                  setCreateForm((prev) => ({ ...prev, name: text }))
                }
                placeholder="Nom de la propriété"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={createForm.description}
                onChangeText={(text) =>
                  setCreateForm((prev) => ({ ...prev, description: text }))
                }
                placeholder="Description de la propriété"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Statut</Text>
              <View style={styles.statusContainer}>
                {(
                  ["available", "occupied", "maintenance", "reserved"] as const
                ).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      createForm.status === status && styles.statusButtonActive,
                    ]}
                    onPress={() =>
                      setCreateForm((prev) => ({ ...prev, status }))
                    }
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        createForm.status === status &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {status === "available" && "Disponible"}
                      {status === "occupied" && "Occupé"}
                      {status === "maintenance" && "Maintenance"}
                      {status === "reserved" && "Réservé"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Localisation</Text>
              <TextInput
                style={styles.input}
                value={createForm.location}
                onChangeText={(text) =>
                  setCreateForm((prev) => ({ ...prev, location: text }))
                }
                placeholder="Adresse ou localisation"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Surface (m²)</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.surface}
                  onChangeText={(text) =>
                    setCreateForm((prev) => ({ ...prev, surface: text }))
                  }
                  placeholder="0"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Pièces</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.numberOfRooms}
                  onChangeText={(text) =>
                    setCreateForm((prev) => ({ ...prev, numberOfRooms: text }))
                  }
                  placeholder="0"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Salles de bain</Text>
              <TextInput
                style={styles.input}
                value={createForm.numberOfBathrooms}
                onChangeText={(text) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    numberOfBathrooms: text,
                  }))
                }
                placeholder="0"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                state.isLoading && styles.createButtonDisabled,
              ]}
              onPress={handleCreateProperty}
              disabled={state.isLoading}
            >
              <Text style={styles.createButtonText}>
                {state.isLoading ? "Création..." : "Créer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {children}
    </PropertyContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error(
      "useProperties doit être utilisé à l'intérieur d'un PropertyProvider"
    );
  }
  return context;
};

// Hook pour obtenir une propriété spécifique
export const useProperty = (id: string) => {
  const { getProperty } = useProperties();
  return getProperty(id);
};

// Hook pour les propriétés par statut
export const usePropertiesByStatus = (status: Property["status"]) => {
  const { getPropertiesByStatus } = useProperties();
  return getPropertiesByStatus(status);
};

// Hook pour les statistiques
export const usePropertiesStats = () => {
  const { getPropertiesStats } = useProperties();
  return getPropertiesStats();
};

// Composant dropdown pour la sélection de propriété
export const PropertyDropdown: React.FC<{
  selectedProperty: Property | null;
  onPropertySelect: (property: Property) => void;
  onAddProperty: () => void;
}> = ({ selectedProperty, onPropertySelect, onAddProperty }) => {
  const { properties, isLoading } = useProperties();

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "available":
        return "#4CAF50";
      case "occupied":
        return "#FF9800";
      case "maintenance":
        return "#F44336";
      case "reserved":
        return "#2196F3";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <View style={styles.dropdownContainer}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TouchableOpacity style={styles.dropdownTrigger}>
            <Text style={styles.dropdownTriggerText}>
              {selectedProperty
                ? selectedProperty.name
                : "Sélectionner un bien"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </DropdownMenuTrigger>
        <DropdownMenuContent style={styles.dropdownContent}>
          {properties && properties.length > 0 ? (
            properties.map((property) => (
              <DropdownMenuItem
                key={property.id}
                onPress={() => onPropertySelect(property)}
                style={styles.dropdownContentItem}
              >
                <Text style={styles.dropdownItemText}>{property.name}</Text>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(property.status) },
                  ]}
                />
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem style={styles.dropdownContentItem}>
              <Text style={styles.dropdownItemText}>Aucun bien trouvé</Text>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                console.log("onAddProperty");
                onAddProperty();
              }}
            >
              <Text style={styles.dropdownTriggerText}>➕ Ajouter un bien</Text>
              <Text style={styles.dropdownArrow}>+</Text>
            </TouchableOpacity>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
  },
  addPropertyText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  dropdownContentItem: {
    flex: 1,
    padding: 10,
    backgroundColor: "white",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownContent: {
    width: "100%",
    paddingHorizontal: 20,
  },
  // Styles du modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  statusButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  statusButtonTextActive: {
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E7",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
