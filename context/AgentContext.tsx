import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "~/lib/auth-client";
import {
  AgentType,
  AgentAvailability,
  AgentProfile,
  AgentSpecialty,
  TaskAssignment,
  CleaningSession,
  MaintenanceSession,
  Ticket,
} from "~/lib/types";

// Types pour les opérations CRUD
export interface CreateAgentData {
  userId: string;
  agentType: AgentType;
  availability?: AgentAvailability;
  employeeId?: string;
  certifications?: string[];
  serviceZones?: string[];
  workingHours?: any;
  availabilityCalendar?: any;
  hourlyRate?: number;
  isActive?: boolean;
  hireDate?: string;
  managerId: string;
}

export interface UpdateAgentData {
  agentType?: AgentType;
  availability?: AgentAvailability;
  employeeId?: string;
  certifications?: string[];
  serviceZones?: string[];
  currentLocation?: any;
  workingHours?: any;
  availabilityCalendar?: any;
  hourlyRate?: number;
  isActive?: boolean;
  hireDate?: string;
}

export interface CreateAgentSpecialtyData {
  name: string;
  category?: string;
  level?: string;
  certified?: boolean;
  agentId: string;
}

export interface UpdateAgentSpecialtyData {
  name?: string;
  category?: string;
  level?: string;
  certified?: boolean;
}

export interface CreateTaskAssignmentData {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  dueDate?: string;
  agentId: string;
  propertyId?: string;
  reservationId?: string;
  cleaningSessionId?: string;
  maintenanceSessionId?: string;
  ticketId?: string;
  estimatedDuration?: number;
  notes?: string;
}

export interface UpdateTaskAssignmentData {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  agentId?: string;
  propertyId?: string;
  reservationId?: string;
  cleaningSessionId?: string;
  maintenanceSessionId?: string;
  ticketId?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
}

// État du contexte
interface AgentContextState {
  agents: AgentProfile[];
  agentSpecialties: AgentSpecialty[];
  taskAssignments: TaskAssignment[];
  cleaningSessions: CleaningSession[];
  maintenanceSessions: MaintenanceSession[];
  tickets: Ticket[];
  selectedAgent: AgentProfile | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

// Actions du contexte
interface AgentContextActions {
  // Agent CRUD
  createAgent: (data: CreateAgentData) => Promise<AgentProfile | null>;
  updateAgent: (
    id: string,
    data: UpdateAgentData
  ) => Promise<AgentProfile | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  getAgent: (id: string) => AgentProfile | undefined;
  setSelectedAgent: (agent: AgentProfile | null) => void;

  // Modals
  setShowCreateAgentModal: (show: boolean) => void;

  // Agent Specialty CRUD
  createAgentSpecialty: (
    data: CreateAgentSpecialtyData
  ) => Promise<AgentSpecialty | null>;
  updateAgentSpecialty: (
    id: string,
    data: UpdateAgentSpecialtyData
  ) => Promise<AgentSpecialty | null>;
  deleteAgentSpecialty: (id: string) => Promise<boolean>;
  getAgentSpecialty: (id: string) => AgentSpecialty | undefined;

  // Task Assignment CRUD
  createTaskAssignment: (
    data: CreateTaskAssignmentData
  ) => Promise<TaskAssignment | null>;
  updateTaskAssignment: (
    id: string,
    data: UpdateTaskAssignmentData
  ) => Promise<TaskAssignment | null>;
  deleteTaskAssignment: (id: string) => Promise<boolean>;
  getTaskAssignment: (id: string) => TaskAssignment | undefined;

  // Gestion des données
  loadAgents: () => Promise<void>;
  refreshAgents: () => Promise<void>;
  clearAgents: () => Promise<void>;

  // Filtres et recherche
  getAgentsByType: (type: AgentType) => AgentProfile[];
  getAgentsByAvailability: (availability: AgentAvailability) => AgentProfile[];
  getAgentsByManager: (managerId: string) => AgentProfile[];
  getActiveAgents: () => AgentProfile[];
  searchAgents: (query: string) => AgentProfile[];

  getTaskAssignmentsByAgent: (agentId: string) => TaskAssignment[];
  getTaskAssignmentsByStatus: (status: string) => TaskAssignment[];
  getTaskAssignmentsByPriority: (priority: string) => TaskAssignment[];
  getTaskAssignmentsByType: (type: string) => TaskAssignment[];
  searchTaskAssignments: (query: string) => TaskAssignment[];

  getSpecialtiesByAgent: (agentId: string) => AgentSpecialty[];
  getSpecialtiesByCategory: (category: string) => AgentSpecialty[];
  getCertifiedSpecialties: () => AgentSpecialty[];

  // Statistiques
  getAgentsStats: () => {
    total: number;
    active: number;
    inactive: number;
    available: number;
    busy: number;
    offline: number;
    onBreak: number;
    onMission: number;
    byType: Record<AgentType, number>;
  };

  getTaskAssignmentsStats: () => {
    total: number;
    assigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  };

  getSpecialtiesStats: () => {
    total: number;
    certified: number;
    byCategory: Record<string, number>;
    byLevel: Record<string, number>;
  };

  // Opérations spéciales
  updateAgentAvailability: (
    agentId: string,
    availability: AgentAvailability
  ) => Promise<boolean>;
  assignTask: (taskId: string, agentId: string) => Promise<boolean>;
  completeTask: (taskId: string) => Promise<boolean>;
  startTask: (taskId: string) => Promise<boolean>;
  addCertification: (
    agentId: string,
    certification: string
  ) => Promise<boolean>;
  removeCertification: (
    agentId: string,
    certification: string
  ) => Promise<boolean>;
  updateServiceZones: (agentId: string, zones: string[]) => Promise<boolean>;
  updateCurrentLocation: (agentId: string, location: any) => Promise<boolean>;
  updateWorkingHours: (agentId: string, hours: any) => Promise<boolean>;
  updateAvailabilityCalendar: (
    agentId: string,
    calendar: any
  ) => Promise<boolean>;
}

type AgentContextType = AgentContextState & AgentContextActions;

// Clés AsyncStorage
const STORAGE_KEYS = {
  AGENTS: "agents_cache",
  AGENT_SPECIALTIES: "agent_specialties_cache",
  TASK_ASSIGNMENTS: "task_assignments_cache",
  CLEANING_SESSIONS: "cleaning_sessions_cache",
  MAINTENANCE_SESSIONS: "maintenance_sessions_cache",
  TICKETS: "tickets_cache",
  LAST_SYNC: "agents_last_sync",
};

// Composant modal pour créer un agent
const CreateAgentModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: CreateAgentData) => void;
}) => {
  const [formData, setFormData] = useState<CreateAgentData>({
    userId: "",
    agentType: "cleaning",
    availability: "offline",
    employeeId: "",
    certifications: [],
    serviceZones: [],
    workingHours: null,
    availabilityCalendar: null,
    hourlyRate: undefined,
    isActive: true,
    hireDate: new Date().toISOString(),
    managerId: "manager-1",
  });

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [newCertification, setNewCertification] = useState("");
  const [newServiceZone, setNewServiceZone] = useState("");

  const handleSubmit = () => {
    if (
      !userInfo.name ||
      !userInfo.email ||
      userInfo.email.trim().length === 0
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const finalData = {
      ...formData,
      email: userInfo.email,
      name: userInfo.name,
    };

    onSubmit(finalData);
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [
          ...(prev.certifications || []),
          newCertification.trim(),
        ],
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const addServiceZone = () => {
    if (newServiceZone.trim()) {
      setFormData((prev) => ({
        ...prev,
        serviceZones: [...(prev.serviceZones || []), newServiceZone.trim()],
      }));
      setNewServiceZone("");
    }
  };

  const removeServiceZone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceZones: prev.serviceZones?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Text style={modalStyles.title}>Créer un Agent</Text>
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={modalStyles.content}>
        {/* Informations utilisateur */}
        <View style={modalStyles.section}>
          <Text style={modalStyles.sectionTitle}>
            Informations personnelles
          </Text>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Nom *</Text>
            <TextInput
              style={modalStyles.input}
              value={userInfo.name}
              onChangeText={(text) =>
                setUserInfo((prev) => ({ ...prev, name: text }))
              }
              placeholder="Nom complet"
            />
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Email *</Text>
            <TextInput
              style={modalStyles.input}
              value={userInfo.email}
              onChangeText={(text) =>
                setUserInfo((prev) => ({ ...prev, email: text }))
              }
              placeholder="email@example.com"
              keyboardType="email-address"
            />
          </View>

          <View style={modalStyles.row}>
            <View style={modalStyles.halfWidth}>
              <Text style={modalStyles.label}>Prénom</Text>
              <TextInput
                style={modalStyles.input}
                value={userInfo.firstName}
                onChangeText={(text) =>
                  setUserInfo((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="Prénom"
              />
            </View>
            <View style={modalStyles.halfWidth}>
              <Text style={modalStyles.label}>Nom de famille</Text>
              <TextInput
                style={modalStyles.input}
                value={userInfo.lastName}
                onChangeText={(text) =>
                  setUserInfo((prev) => ({ ...prev, lastName: text }))
                }
                placeholder="Nom de famille"
              />
            </View>
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Téléphone</Text>
            <TextInput
              style={modalStyles.input}
              value={userInfo.phone}
              onChangeText={(text) =>
                setUserInfo((prev) => ({ ...prev, phone: text }))
              }
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Informations agent */}
        <View style={modalStyles.section}>
          <Text style={modalStyles.sectionTitle}>Informations agent</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>ID Employé</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.employeeId}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, employeeId: text }))
              }
              placeholder="EMP001"
            />
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Type d'agent *</Text>
            <View style={modalStyles.radioGroup}>
              {(
                [
                  "cleaning",
                  "maintenance",
                  "laundry",
                  "concierge",
                  "multi_service",
                ] as AgentType[]
              ).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={modalStyles.radioItem}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, agentType: type }))
                  }
                >
                  <View
                    style={[
                      modalStyles.radioCircle,
                      formData.agentType === type && modalStyles.radioSelected,
                    ]}
                  />
                  <Text style={modalStyles.radioText}>
                    {type === "cleaning"
                      ? "Nettoyage"
                      : type === "maintenance"
                      ? "Maintenance"
                      : type === "laundry"
                      ? "Blanchisserie"
                      : type === "concierge"
                      ? "Conciergerie"
                      : "Multi-service"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Disponibilité initiale</Text>
            <View style={modalStyles.radioGroup}>
              {(
                [
                  "available",
                  "busy",
                  "offline",
                  "on_break",
                  "on_mission",
                ] as AgentAvailability[]
              ).map((availability) => (
                <TouchableOpacity
                  key={availability}
                  style={modalStyles.radioItem}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, availability }))
                  }
                >
                  <View
                    style={[
                      modalStyles.radioCircle,
                      formData.availability === availability &&
                        modalStyles.radioSelected,
                    ]}
                  />
                  <Text style={modalStyles.radioText}>
                    {availability === "available"
                      ? "Disponible"
                      : availability === "busy"
                      ? "Occupé"
                      : availability === "offline"
                      ? "Hors ligne"
                      : availability === "on_break"
                      ? "En pause"
                      : "En mission"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Taux horaire (€)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.hourlyRate?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  hourlyRate: text ? parseFloat(text) : undefined,
                }))
              }
              placeholder="25.50"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Certifications */}
        <View style={modalStyles.section}>
          <Text style={modalStyles.sectionTitle}>Certifications</Text>

          <View style={modalStyles.row}>
            <View style={modalStyles.flexInput}>
              <TextInput
                style={modalStyles.input}
                value={newCertification}
                onChangeText={setNewCertification}
                placeholder="Ajouter une certification"
              />
            </View>
            <TouchableOpacity
              style={modalStyles.addButton}
              onPress={addCertification}
            >
              <Text style={modalStyles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {formData.certifications && formData.certifications.length > 0 && (
            <View style={modalStyles.tagContainer}>
              {formData.certifications.map((cert, index) => (
                <View key={index} style={modalStyles.tag}>
                  <Text style={modalStyles.tagText}>{cert}</Text>
                  <TouchableOpacity
                    onPress={() => removeCertification(index)}
                    style={modalStyles.tagRemove}
                  >
                    <Text style={modalStyles.tagRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Zones de service */}
        <View style={modalStyles.section}>
          <Text style={modalStyles.sectionTitle}>Zones de service</Text>

          <View style={modalStyles.row}>
            <View style={modalStyles.flexInput}>
              <TextInput
                style={modalStyles.input}
                value={newServiceZone}
                onChangeText={setNewServiceZone}
                placeholder="Ajouter une zone de service"
              />
            </View>
            <TouchableOpacity
              style={modalStyles.addButton}
              onPress={addServiceZone}
            >
              <Text style={modalStyles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {formData.serviceZones && formData.serviceZones.length > 0 && (
            <View style={modalStyles.tagContainer}>
              {formData.serviceZones.map((zone, index) => (
                <View key={index} style={modalStyles.tag}>
                  <Text style={modalStyles.tagText}>{zone}</Text>
                  <TouchableOpacity
                    onPress={() => removeServiceZone(index)}
                    style={modalStyles.tagRemove}
                  >
                    <Text style={modalStyles.tagRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Options */}
        <View style={modalStyles.section}>
          <Text style={modalStyles.sectionTitle}>Options</Text>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.isActive && modalStyles.checkboxSelected,
              ]}
            >
              {formData.isActive && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Agent actif</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={modalStyles.footer}>
        <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton}>
          <Text style={modalStyles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={modalStyles.submitButton}
        >
          <Text style={modalStyles.submitButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Création du contexte
const AgentContext = createContext<AgentContextType | null>(null);

// Provider du contexte
export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session } = authClient.useSession();
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  const [state, setState] = useState<AgentContextState>({
    agents: [],
    agentSpecialties: [],
    taskAssignments: [],
    cleaningSessions: [],
    maintenanceSessions: [],
    tickets: [],
    selectedAgent: null,
    isLoading: false,
    error: null,
    lastSync: null,
  });

  // États des modals
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);

  // Sauvegarder dans AsyncStorage
  const saveToStorage = useCallback(
    async (data: Partial<AgentContextState>) => {
      try {
        const lastSync = new Date().toISOString();
        const promises = [];

        if (data.agents) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.AGENTS,
              JSON.stringify(data.agents)
            )
          );
        }
        if (data.agentSpecialties) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.AGENT_SPECIALTIES,
              JSON.stringify(data.agentSpecialties)
            )
          );
        }
        if (data.taskAssignments) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.TASK_ASSIGNMENTS,
              JSON.stringify(data.taskAssignments)
            )
          );
        }
        if (data.cleaningSessions) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.CLEANING_SESSIONS,
              JSON.stringify(data.cleaningSessions)
            )
          );
        }
        if (data.maintenanceSessions) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.MAINTENANCE_SESSIONS,
              JSON.stringify(data.maintenanceSessions)
            )
          );
        }
        if (data.tickets) {
          promises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.TICKETS,
              JSON.stringify(data.tickets)
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
        agentsData,
        specialtiesData,
        taskAssignmentsData,
        cleaningSessionsData,
        maintenanceSessionsData,
        ticketsData,
        lastSyncData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AGENTS),
        AsyncStorage.getItem(STORAGE_KEYS.AGENT_SPECIALTIES),
        AsyncStorage.getItem(STORAGE_KEYS.TASK_ASSIGNMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.CLEANING_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      const agents = agentsData ? JSON.parse(agentsData) : [];
      const agentSpecialties = specialtiesData
        ? JSON.parse(specialtiesData)
        : [];
      const taskAssignments = taskAssignmentsData
        ? JSON.parse(taskAssignmentsData)
        : [];
      const cleaningSessions = cleaningSessionsData
        ? JSON.parse(cleaningSessionsData)
        : [];
      const maintenanceSessions = maintenanceSessionsData
        ? JSON.parse(maintenanceSessionsData)
        : [];
      const tickets = ticketsData ? JSON.parse(ticketsData) : [];
      const lastSync = lastSyncData ? new Date(lastSyncData) : null;

      setState((prev) => ({
        ...prev,
        agents,
        agentSpecialties,
        taskAssignments,
        cleaningSessions,
        maintenanceSessions,
        tickets,
        lastSync,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement depuis AsyncStorage:", error);
    }
  }, []);

  // Charger les agents depuis l'API
  const loadAgentsFromAPI = useCallback(async () => {
    if (!session?.user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("http://localhost:8081/api/agents", {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const agents = await response.json();
        setState((prev) => ({ ...prev, agents, isLoading: false }));
        await saveToStorage({ agents });
      } else {
        throw new Error("Erreur lors du chargement des agents");
      }
    } catch (error) {
      console.error("Erreur API agents:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        isLoading: false,
      }));
    }
  }, [session?.user?.id, saveToStorage]);

  // Charger les spécialités depuis l'API
  const loadSpecialtiesFromAPI = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        "http://localhost:8081/api/agent-specialties",
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const agentSpecialties = await response.json();
        setState((prev) => ({ ...prev, agentSpecialties }));
        await saveToStorage({ agentSpecialties });
      }
    } catch (error) {
      console.error("Erreur API specialties:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Charger les tâches depuis l'API
  const loadTaskAssignmentsFromAPI = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        "http://localhost:8081/api/task-assignments",
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const taskAssignments = await response.json();
        setState((prev) => ({ ...prev, taskAssignments }));
        await saveToStorage({ taskAssignments });
      }
    } catch (error) {
      console.error("Erreur API task assignments:", error);
    }
  }, [session?.user?.id, saveToStorage]);

  // Créer un agent
  const createAgent = useCallback(
    async (data: CreateAgentData): Promise<AgentProfile | null> => {
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
          await saveToStorage({ agents: [...state.agents, newAgent] });
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
    []
  );

  // Mettre à jour un agent
  const updateAgent = useCallback(
    async (id: string, data: UpdateAgentData): Promise<AgentProfile | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/agents/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const updatedAgent = await response.json();
          const updatedAgents = state.agents.map((agent) =>
            agent.id === id ? updatedAgent : agent
          );
          setState((prev) => ({
            ...prev,
            agents: updatedAgents,
            isLoading: false,
          }));
          await saveToStorage({ agents: updatedAgents });
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
    [session?.user?.id, state.agents, saveToStorage]
  );

  // Supprimer un agent
  const deleteAgent = useCallback(
    async (id: string): Promise<boolean> => {
      if (!session?.user?.id) return false;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`http://localhost:8081/api/agents/${id}`, {
          method: "DELETE",
          headers,
        });

        if (response.ok) {
          const updatedAgents = state.agents.filter((agent) => agent.id !== id);
          setState((prev) => ({
            ...prev,
            agents: updatedAgents,
            isLoading: false,
          }));
          await saveToStorage({ agents: updatedAgents });
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
    [session?.user?.id, state.agents, saveToStorage]
  );

  // Obtenir un agent par ID
  const getAgent = useCallback(
    (id: string): AgentProfile | undefined => {
      return state.agents.find((agent) => agent.id === id);
    },
    [state.agents]
  );

  // Sélectionner un agent
  const setSelectedAgent = useCallback((agent: AgentProfile | null) => {
    setState((prev) => ({ ...prev, selectedAgent: agent }));
  }, []);

  // Créer une spécialité d'agent
  const createAgentSpecialty = useCallback(
    async (data: CreateAgentSpecialtyData): Promise<AgentSpecialty | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          "http://localhost:8081/api/agent-specialties",
          {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const newSpecialty = await response.json();
          setState((prev) => ({
            ...prev,
            agentSpecialties: [...prev.agentSpecialties, newSpecialty],
            isLoading: false,
          }));
          await saveToStorage({
            agentSpecialties: [...state.agentSpecialties, newSpecialty],
          });
          return newSpecialty;
        } else {
          throw new Error("Erreur lors de la création de la spécialité");
        }
      } catch (error) {
        console.error("Erreur création spécialité:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.agentSpecialties, saveToStorage]
  );

  // Mettre à jour une spécialité d'agent
  const updateAgentSpecialty = useCallback(
    async (
      id: string,
      data: UpdateAgentSpecialtyData
    ): Promise<AgentSpecialty | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `http://localhost:8081/api/agent-specialties/${id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const updatedSpecialty = await response.json();
          const updatedSpecialties = state.agentSpecialties.map((specialty) =>
            specialty.id === id ? updatedSpecialty : specialty
          );
          setState((prev) => ({
            ...prev,
            agentSpecialties: updatedSpecialties,
            isLoading: false,
          }));
          await saveToStorage({ agentSpecialties: updatedSpecialties });
          return updatedSpecialty;
        } else {
          throw new Error("Erreur lors de la mise à jour de la spécialité");
        }
      } catch (error) {
        console.error("Erreur mise à jour spécialité:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.agentSpecialties, saveToStorage]
  );

  // Supprimer une spécialité d'agent
  const deleteAgentSpecialty = useCallback(
    async (id: string): Promise<boolean> => {
      if (!session?.user?.id) return false;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `http://localhost:8081/api/agent-specialties/${id}`,
          {
            method: "DELETE",
            headers,
          }
        );

        if (response.ok) {
          const updatedSpecialties = state.agentSpecialties.filter(
            (specialty) => specialty.id !== id
          );
          setState((prev) => ({
            ...prev,
            agentSpecialties: updatedSpecialties,
            isLoading: false,
          }));
          await saveToStorage({ agentSpecialties: updatedSpecialties });
          return true;
        } else {
          throw new Error("Erreur lors de la suppression de la spécialité");
        }
      } catch (error) {
        console.error("Erreur suppression spécialité:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return false;
      }
    },
    [session?.user?.id, state.agentSpecialties, saveToStorage]
  );

  // Obtenir une spécialité par ID
  const getAgentSpecialty = useCallback(
    (id: string): AgentSpecialty | undefined => {
      return state.agentSpecialties.find((specialty) => specialty.id === id);
    },
    [state.agentSpecialties]
  );

  // Créer une attribution de tâche
  const createTaskAssignment = useCallback(
    async (data: CreateTaskAssignmentData): Promise<TaskAssignment | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          "http://localhost:8081/api/task-assignments",
          {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const newTask = await response.json();
          setState((prev) => ({
            ...prev,
            taskAssignments: [...prev.taskAssignments, newTask],
            isLoading: false,
          }));
          await saveToStorage({
            taskAssignments: [...state.taskAssignments, newTask],
          });
          return newTask;
        } else {
          throw new Error("Erreur lors de la création de la tâche");
        }
      } catch (error) {
        console.error("Erreur création tâche:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.taskAssignments, saveToStorage]
  );

  // Mettre à jour une attribution de tâche
  const updateTaskAssignment = useCallback(
    async (
      id: string,
      data: UpdateTaskAssignmentData
    ): Promise<TaskAssignment | null> => {
      if (!session?.user?.id) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `http://localhost:8081/api/task-assignments/${id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const updatedTask = await response.json();
          const updatedTasks = state.taskAssignments.map((task) =>
            task.id === id ? updatedTask : task
          );
          setState((prev) => ({
            ...prev,
            taskAssignments: updatedTasks,
            isLoading: false,
          }));
          await saveToStorage({ taskAssignments: updatedTasks });
          return updatedTask;
        } else {
          throw new Error("Erreur lors de la mise à jour de la tâche");
        }
      } catch (error) {
        console.error("Erreur mise à jour tâche:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return null;
      }
    },
    [session?.user?.id, state.taskAssignments, saveToStorage]
  );

  // Supprimer une attribution de tâche
  const deleteTaskAssignment = useCallback(
    async (id: string): Promise<boolean> => {
      if (!session?.user?.id) return false;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `http://localhost:8081/api/task-assignments/${id}`,
          {
            method: "DELETE",
            headers,
          }
        );

        if (response.ok) {
          const updatedTasks = state.taskAssignments.filter(
            (task) => task.id !== id
          );
          setState((prev) => ({
            ...prev,
            taskAssignments: updatedTasks,
            isLoading: false,
          }));
          await saveToStorage({ taskAssignments: updatedTasks });
          return true;
        } else {
          throw new Error("Erreur lors de la suppression de la tâche");
        }
      } catch (error) {
        console.error("Erreur suppression tâche:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isLoading: false,
        }));
        return false;
      }
    },
    [session?.user?.id, state.taskAssignments, saveToStorage]
  );

  // Obtenir une attribution de tâche par ID
  const getTaskAssignment = useCallback(
    (id: string): TaskAssignment | undefined => {
      return state.taskAssignments.find((task) => task.id === id);
    },
    [state.taskAssignments]
  );

  // Charger les données (depuis le cache puis l'API)
  const loadAgents = useCallback(async () => {
    await loadFromStorage();
    await loadAgentsFromAPI();
    await loadSpecialtiesFromAPI();
    await loadTaskAssignmentsFromAPI();
  }, [
    loadFromStorage,
    loadAgentsFromAPI,
    loadSpecialtiesFromAPI,
    loadTaskAssignmentsFromAPI,
  ]);

  // Rafraîchir depuis l'API
  const refreshAgents = useCallback(async () => {
    await loadAgentsFromAPI();
    await loadSpecialtiesFromAPI();
    await loadTaskAssignmentsFromAPI();
  }, [loadAgentsFromAPI, loadSpecialtiesFromAPI, loadTaskAssignmentsFromAPI]);

  // Vider le cache
  const clearAgents = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AGENTS),
        AsyncStorage.removeItem(STORAGE_KEYS.AGENT_SPECIALTIES),
        AsyncStorage.removeItem(STORAGE_KEYS.TASK_ASSIGNMENTS),
        AsyncStorage.removeItem(STORAGE_KEYS.CLEANING_SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.MAINTENANCE_SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.TICKETS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
      ]);
      setState((prev) => ({
        ...prev,
        agents: [],
        agentSpecialties: [],
        taskAssignments: [],
        cleaningSessions: [],
        maintenanceSessions: [],
        tickets: [],
        lastSync: null,
      }));
    } catch (error) {
      console.error("Erreur lors du vidage du cache:", error);
    }
  }, []);

  // Filtres pour les agents
  const getAgentsByType = useCallback(
    (type: AgentType): AgentProfile[] => {
      return state.agents.filter((agent) => agent.agentType === type);
    },
    [state.agents]
  );

  const getAgentsByAvailability = useCallback(
    (availability: AgentAvailability): AgentProfile[] => {
      return state.agents.filter(
        (agent) => agent.availability === availability
      );
    },
    [state.agents]
  );

  const getAgentsByManager = useCallback(
    (managerId: string): AgentProfile[] => {
      return state.agents.filter((agent) => agent.managerId === managerId);
    },
    [state.agents]
  );

  const getActiveAgents = useCallback((): AgentProfile[] => {
    return state.agents.filter((agent) => agent.isActive);
  }, [state.agents]);

  const searchAgents = useCallback(
    (query: string): AgentProfile[] => {
      const lowerQuery = query.toLowerCase();
      return state.agents.filter(
        (agent) =>
          agent.user?.name.toLowerCase().includes(lowerQuery) ||
          agent.user?.email.toLowerCase().includes(lowerQuery) ||
          agent.employeeId?.toLowerCase().includes(lowerQuery) ||
          agent.serviceZones.some((zone) =>
            zone.toLowerCase().includes(lowerQuery)
          )
      );
    },
    [state.agents]
  );

  // Filtres pour les tâches
  const getTaskAssignmentsByAgent = useCallback(
    (agentId: string): TaskAssignment[] => {
      return state.taskAssignments.filter((task) => task.agentId === agentId);
    },
    [state.taskAssignments]
  );

  const getTaskAssignmentsByStatus = useCallback(
    (status: string): TaskAssignment[] => {
      return state.taskAssignments.filter((task) => task.status === status);
    },
    [state.taskAssignments]
  );

  const getTaskAssignmentsByPriority = useCallback(
    (priority: string): TaskAssignment[] => {
      return state.taskAssignments.filter((task) => task.priority === priority);
    },
    [state.taskAssignments]
  );

  const getTaskAssignmentsByType = useCallback(
    (type: string): TaskAssignment[] => {
      return state.taskAssignments.filter((task) => task.type === type);
    },
    [state.taskAssignments]
  );

  const searchTaskAssignments = useCallback(
    (query: string): TaskAssignment[] => {
      const lowerQuery = query.toLowerCase();
      return state.taskAssignments.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery) ||
          task.notes?.toLowerCase().includes(lowerQuery)
      );
    },
    [state.taskAssignments]
  );

  // Filtres pour les spécialités
  const getSpecialtiesByAgent = useCallback(
    (agentId: string): AgentSpecialty[] => {
      return state.agentSpecialties.filter(
        (specialty) => specialty.agentId === agentId
      );
    },
    [state.agentSpecialties]
  );

  const getSpecialtiesByCategory = useCallback(
    (category: string): AgentSpecialty[] => {
      return state.agentSpecialties.filter(
        (specialty) => specialty.category === category
      );
    },
    [state.agentSpecialties]
  );

  const getCertifiedSpecialties = useCallback((): AgentSpecialty[] => {
    return state.agentSpecialties.filter((specialty) => specialty.certified);
  }, [state.agentSpecialties]);

  // Statistiques des agents
  const getAgentsStats = useCallback(() => {
    const total = state.agents.length;
    const active = state.agents.filter((agent) => agent.isActive).length;
    const inactive = total - active;
    const available = state.agents.filter(
      (agent) => agent.availability === "available"
    ).length;
    const busy = state.agents.filter(
      (agent) => agent.availability === "busy"
    ).length;
    const offline = state.agents.filter(
      (agent) => agent.availability === "offline"
    ).length;
    const onBreak = state.agents.filter(
      (agent) => agent.availability === "on_break"
    ).length;
    const onMission = state.agents.filter(
      (agent) => agent.availability === "on_mission"
    ).length;

    const byType: Record<AgentType, number> = {
      cleaning: state.agents.filter((agent) => agent.agentType === "cleaning")
        .length,
      maintenance: state.agents.filter(
        (agent) => agent.agentType === "maintenance"
      ).length,
      laundry: state.agents.filter((agent) => agent.agentType === "laundry")
        .length,
      concierge: state.agents.filter((agent) => agent.agentType === "concierge")
        .length,
      multi_service: state.agents.filter(
        (agent) => agent.agentType === "multi_service"
      ).length,
    };

    return {
      total,
      active,
      inactive,
      available,
      busy,
      offline,
      onBreak,
      onMission,
      byType,
    };
  }, [state.agents]);

  // Statistiques des tâches
  const getTaskAssignmentsStats = useCallback(() => {
    const total = state.taskAssignments.length;
    const assigned = state.taskAssignments.filter(
      (task) => task.status === "assigned"
    ).length;
    const inProgress = state.taskAssignments.filter(
      (task) => task.status === "in_progress"
    ).length;
    const completed = state.taskAssignments.filter(
      (task) => task.status === "completed"
    ).length;

    const now = new Date();
    const overdue = state.taskAssignments.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "completed"
    ).length;

    const byPriority: Record<string, number> = {};
    const byType: Record<string, number> = {};

    state.taskAssignments.forEach((task) => {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      byType[task.type] = (byType[task.type] || 0) + 1;
    });

    return {
      total,
      assigned,
      inProgress,
      completed,
      overdue,
      byPriority,
      byType,
    };
  }, [state.taskAssignments]);

  // Statistiques des spécialités
  const getSpecialtiesStats = useCallback(() => {
    const total = state.agentSpecialties.length;
    const certified = state.agentSpecialties.filter(
      (specialty) => specialty.certified
    ).length;

    const byCategory: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    state.agentSpecialties.forEach((specialty) => {
      if (specialty.category) {
        byCategory[specialty.category] =
          (byCategory[specialty.category] || 0) + 1;
      }
      if (specialty.level) {
        byLevel[specialty.level] = (byLevel[specialty.level] || 0) + 1;
      }
    });

    return {
      total,
      certified,
      byCategory,
      byLevel,
    };
  }, [state.agentSpecialties]);

  // Opérations spéciales
  const updateAgentAvailability = useCallback(
    async (
      agentId: string,
      availability: AgentAvailability
    ): Promise<boolean> => {
      const result = await updateAgent(agentId, { availability });
      return result !== null;
    },
    [updateAgent]
  );

  const assignTask = useCallback(
    async (taskId: string, agentId: string): Promise<boolean> => {
      const result = await updateTaskAssignment(taskId, {
        agentId,
        status: "assigned",
      });
      return result !== null;
    },
    [updateTaskAssignment]
  );

  const completeTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      const result = await updateTaskAssignment(taskId, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      return result !== null;
    },
    [updateTaskAssignment]
  );

  const startTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      const result = await updateTaskAssignment(taskId, {
        status: "in_progress",
        startedAt: new Date().toISOString(),
      });
      return result !== null;
    },
    [updateTaskAssignment]
  );

  const addCertification = useCallback(
    async (agentId: string, certification: string): Promise<boolean> => {
      const agent = getAgent(agentId);
      if (!agent) return false;

      const newCertifications = [...agent.certifications, certification];
      const result = await updateAgent(agentId, {
        certifications: newCertifications,
      });
      return result !== null;
    },
    [getAgent, updateAgent]
  );

  const removeCertification = useCallback(
    async (agentId: string, certification: string): Promise<boolean> => {
      const agent = getAgent(agentId);
      if (!agent) return false;

      const newCertifications = agent.certifications.filter(
        (cert) => cert !== certification
      );
      const result = await updateAgent(agentId, {
        certifications: newCertifications,
      });
      return result !== null;
    },
    [getAgent, updateAgent]
  );

  const updateServiceZones = useCallback(
    async (agentId: string, zones: string[]): Promise<boolean> => {
      const result = await updateAgent(agentId, { serviceZones: zones });
      return result !== null;
    },
    [updateAgent]
  );

  const updateCurrentLocation = useCallback(
    async (agentId: string, location: any): Promise<boolean> => {
      const result = await updateAgent(agentId, { currentLocation: location });
      return result !== null;
    },
    [updateAgent]
  );

  const updateWorkingHours = useCallback(
    async (agentId: string, hours: any): Promise<boolean> => {
      const result = await updateAgent(agentId, { workingHours: hours });
      return result !== null;
    },
    [updateAgent]
  );

  const updateAvailabilityCalendar = useCallback(
    async (agentId: string, calendar: any): Promise<boolean> => {
      const result = await updateAgent(agentId, {
        availabilityCalendar: calendar,
      });
      return result !== null;
    },
    [updateAgent]
  );

  // Charger les données au montage et quand la session change
  useEffect(() => {
    if (session?.user?.id) {
      loadAgents();
    } else {
      clearAgents();
    }
  }, [session?.user?.id, loadAgents, clearAgents]);

  const contextValue: AgentContextType = {
    // État
    ...state,

    // Agent CRUD
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    setSelectedAgent,

    // Agent Specialty CRUD
    createAgentSpecialty,
    updateAgentSpecialty,
    deleteAgentSpecialty,
    getAgentSpecialty,

    // Task Assignment CRUD
    createTaskAssignment,
    updateTaskAssignment,
    deleteTaskAssignment,
    getTaskAssignment,

    // Gestion des données
    loadAgents,
    refreshAgents,
    clearAgents,

    // Filtres et recherche
    getAgentsByType,
    getAgentsByAvailability,
    getAgentsByManager,
    getActiveAgents,
    searchAgents,

    getTaskAssignmentsByAgent,
    getTaskAssignmentsByStatus,
    getTaskAssignmentsByPriority,
    getTaskAssignmentsByType,
    searchTaskAssignments,

    getSpecialtiesByAgent,
    getSpecialtiesByCategory,
    getCertifiedSpecialties,

    // Statistiques
    getAgentsStats,
    getTaskAssignmentsStats,
    getSpecialtiesStats,

    // Opérations spéciales
    updateAgentAvailability,
    assignTask,
    completeTask,
    startTask,
    addCertification,
    removeCertification,
    updateServiceZones,
    updateCurrentLocation,
    updateWorkingHours,
    updateAvailabilityCalendar,

    // Modals
    setShowCreateAgentModal,
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}

      {/* Modal Créer Agent */}
      <Modal
        visible={showCreateAgentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateAgentModal(false)}
      >
        <CreateAgentModal
          onClose={() => setShowCreateAgentModal(false)}
          onSubmit={async (data) => {
            const agent = await createAgent(data);
            if (agent) {
              setShowCreateAgentModal(false);
            }
          }}
        />
      </Modal>
    </AgentContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useAgents = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error(
      "useAgents doit être utilisé à l'intérieur d'un AgentProvider"
    );
  }
  return context;
};

// Hook pour obtenir un agent spécifique
export const useAgent = (id: string) => {
  const { getAgent } = useAgents();
  return getAgent(id);
};

// Hook pour les agents par type
export const useAgentsByType = (type: AgentType) => {
  const { getAgentsByType } = useAgents();
  return getAgentsByType(type);
};

// Hook pour les agents par disponibilité
export const useAgentsByAvailability = (availability: AgentAvailability) => {
  const { getAgentsByAvailability } = useAgents();
  return getAgentsByAvailability(availability);
};

// Hook pour les statistiques
export const useAgentsStats = () => {
  const { getAgentsStats } = useAgents();
  return getAgentsStats();
};

// Hook pour les tâches d'un agent
export const useTaskAssignmentsByAgent = (agentId: string) => {
  const { getTaskAssignmentsByAgent } = useAgents();
  return getTaskAssignmentsByAgent(agentId);
};

// Hook pour les spécialités d'un agent
export const useSpecialtiesByAgent = (agentId: string) => {
  const { getSpecialtiesByAgent } = useAgents();
  return getSpecialtiesByAgent(agentId);
};

// Styles pour le modal
const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  title: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  flexInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  radioGroup: {
    gap: 8,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    marginRight: 12,
  },
  radioSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  radioText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  checkboxIcon: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  checkboxText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    color: "#1976D2",
    marginRight: 6,
  },
  tagRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
  },
  tagRemoveText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
