import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { authClient } from "~/lib/auth-client";

import { useMaintenance } from "~/context/MaintenanceContext";
import { useConciergerie } from "~/context/ConciergerieContext";

import { useAgentsByType } from "~/context/AgentContext";
import { JSX } from "react";
import { MaintenanceSession, Ticket } from "~/lib/types";
import { MaintenanceAgent } from "~/context";

// Types pour les configurations de statut et priorité
interface StatusConfig {
  color: string;
  text: string;
  bg: string;
}

interface PriorityConfig {
  color: string;
  bg: string;
  icon: string;
}

interface AvailabilityConfig {
  color: string;
  text: string;
  bg: string;
}

type TabType = "dashboard" | "tickets" | "sessions" | "agents";

// Helper function to check if a date is in the current month
const isThisMonth = (date: Date): boolean => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

export default function MaintenanceScreen(): JSX.Element {
  const { data: session } = authClient.useSession();
  const agents = useAgentsByType("maintenance");

  const {
    tickets,
    sessions,
    isLoading,
    error,
    fetchTickets,
    fetchSessions,
    createTicket,
    createSession,
    updateTicket,
  } = useMaintenance();

  const { properties } = useConciergerie();

  const maintenanceAgents = useAgentsByType("maintenance");

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showAssignAgentModal, setShowAssignAgentModal] =
    useState<boolean>(false);
  const [showCreateSessionModal, setShowCreateSessionModal] =
    useState<boolean>(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState<boolean>(false);
  const [showPlanSessionModal, setShowPlanSessionModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<MaintenanceAgent | null>(
    null
  );
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("60");
  
  // États pour le formulaire de création de ticket
  const [ticketTitle, setTicketTitle] = useState<string>("");
  const [ticketDescription, setTicketDescription] = useState<string>("");
  const [ticketPriority, setTicketPriority] = useState<string>("medium");
  const [ticketCategory, setTicketCategory] = useState<string>("");
  const [ticketProperty, setTicketProperty] = useState<string>("");
  const [ticketRoomLocation, setTicketRoomLocation] = useState<string>("");
  const [ticketEstimatedCost, setTicketEstimatedCost] = useState<string>("");
  const [ticketEstimatedDuration, setTicketEstimatedDuration] = useState<string>("");
  
  // États pour le formulaire de planification de session
  const [sessionTicketId, setSessionTicketId] = useState<string>("");
  const [sessionAgentId, setSessionAgentId] = useState<string>("");
  const [sessionScheduledDate, setSessionScheduledDate] = useState<string>("");
  const [sessionWorkDescription, setSessionWorkDescription] = useState<string>("");
  const [sessionEstimatedDuration, setSessionEstimatedDuration] = useState<string>("60");

  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              fetchTickets();
              fetchSessions();
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Vérification des données et gestion d'erreurs
  const validateTicketsData = (): boolean => {
    if (!tickets) {
      console.error("Erreur: tickets est null ou undefined");
      return false;
    }
    if (!Array.isArray(tickets)) {
      console.error("Erreur: tickets n'est pas un tableau");
      return false;
    }
    if (tickets.length === 0) {
      console.warn("Attention: Aucun ticket disponible");
      return false;
    }
    return true;
  };

  const validateSessionsData = (): boolean => {
    if (!sessions) {
      console.error("Erreur: sessions est null ou undefined");
      return false;
    }
    if (!Array.isArray(sessions)) {
      console.error("Erreur: sessions n'est pas un tableau");
      return false;
    }
    if (sessions.length === 0) {
      console.warn("Attention: Aucune session disponible");
      return false;
    }
    return true;
  };

  const validateAgentsData = (): boolean => {
    if (!agents) {
      console.error("Erreur: agents est null ou undefined");
      return false;
    }
    if (!Array.isArray(agents)) {
      console.error("Erreur: agents n'est pas un tableau");
      return false;
    }
    if (agents.length === 0) {
      console.warn("Attention: Aucun agent disponible");
      return false;
    }
    return true;
  };

  const getPriorityConfig = (priority: string): PriorityConfig => {
    if (!priority || typeof priority !== "string") {
      console.error(
        "Erreur: priority est null, undefined ou n'est pas une string"
      );
      return { color: "#8E8E93", bg: "#F2F2F7", icon: "❓" };
    }

    switch (priority) {
      case "urgent":
        return { color: "#FF3B30", bg: "#FFEBEE", icon: "🚨" };
      case "high":
        return { color: "#FF9500", bg: "#FFF3E0", icon: "⚠️" };
      case "medium":
        return { color: "#007AFF", bg: "#E3F2FD", icon: "📋" };
      case "low":
        return { color: "#34C759", bg: "#E8F5E8", icon: "📝" };
      default:
        console.warn(`Attention: priority '${priority}' non reconnue`);
        return { color: "#8E8E93", bg: "#F2F2F7", icon: "❓" };
    }
  };

  const getStatusConfig = (status: string): StatusConfig => {
    if (!status || typeof status !== "string") {
      console.error(
        "Erreur: status est null, undefined ou n'est pas une string"
      );
      return { color: "#8E8E93", text: "Inconnu", bg: "#F2F2F7" };
    }

    switch (status) {
      case "open":
        return { color: "#FF9500", text: "Ouvert", bg: "#FFF3E0" };
      case "in_progress":
        return { color: "#007AFF", text: "En cours", bg: "#E3F2FD" };
      case "resolved":
        return { color: "#34C759", text: "Résolu", bg: "#E8F5E8" };
      case "closed":
        return { color: "#8E8E93", text: "Fermé", bg: "#F2F2F7" };
      case "planned":
        return { color: "#5856D6", text: "Planifié", bg: "#EEEEFF" };
      case "completed":
        return { color: "#34C759", text: "Terminé", bg: "#E8F5E8" };
      case "cancelled":
        return { color: "#FF3B30", text: "Annulé", bg: "#FFEBEE" };
      default:
        console.warn(`Attention: status '${status}' non reconnu`);
        return { color: "#8E8E93", text: "Inconnu", bg: "#F2F2F7" };
    }
  };

  const getAvailabilityConfig = (availability: string): AvailabilityConfig => {
    if (!availability || typeof availability !== "string") {
      console.error(
        "Erreur: availability est null, undefined ou n'est pas une string"
      );
      return { color: "#8E8E93", text: "Inconnu", bg: "#F2F2F7" };
    }

    switch (availability) {
      case "available":
        return { color: "#34C759", text: "Disponible", bg: "#E8F5E8" };
      case "busy":
        return { color: "#FF9500", text: "Occupé", bg: "#FFF3E0" };
      case "offline":
        return { color: "#8E8E93", text: "Hors ligne", bg: "#F2F2F7" };
      default:
        console.warn(`Attention: availability '${availability}' non reconnue`);
        return { color: "#8E8E93", text: "Inconnu", bg: "#F2F2F7" };
    }
  };

  const handleAssignAgent = (ticket: Ticket): void => {
    if (!ticket) {
      console.error("Erreur: ticket est null ou undefined");
      Alert.alert("Erreur", "Impossible d'assigner un agent: ticket invalide");
      return;
    }
    if (!ticket.id) {
      console.error("Erreur: ticket.id est manquant");
      Alert.alert(
        "Erreur",
        "Impossible d'assigner un agent: ID du ticket manquant"
      );
      return;
    }

    setSelectedTicket(ticket);
    setShowAssignAgentModal(true);
  };

  const handleCreateSession = (): void => {
    if (!selectedTicket) {
      console.error("Erreur: selectedTicket est null");
      Alert.alert("Erreur", "Aucun ticket sélectionné");
      return;
    }
    if (!selectedAgent) {
      console.error("Erreur: selectedAgent est null");
      Alert.alert("Erreur", "Aucun agent sélectionné");
      return;
    }
    if (!selectedTicket.id) {
      console.error("Erreur: selectedTicket.id est manquant");
      Alert.alert("Erreur", "ID du ticket manquant");
      return;
    }
    if (!selectedAgent.id) {
      console.error("Erreur: selectedAgent.id est manquant");
      Alert.alert("Erreur", "ID de l'agent manquant");
      return;
    }

    Alert.alert("Succès", "Session de maintenance créée avec succès!");
    setShowAssignAgentModal(false);
    setShowCreateSessionModal(false);
    setSelectedTicket(null);
    setSelectedAgent(null);
    setSessionNotes("");
    setEstimatedDuration("60");
  };

  const resetTicketForm = (): void => {
    setTicketTitle("");
    setTicketDescription("");
    setTicketPriority("medium");
    setTicketCategory("");
    setTicketProperty("");
    setTicketRoomLocation("");
    setTicketEstimatedCost("");
    setTicketEstimatedDuration("");
  };

  const resetSessionForm = (): void => {
    setSessionTicketId("");
    setSessionAgentId("");
    setSessionScheduledDate("");
    setSessionWorkDescription("");
    setSessionEstimatedDuration("60");
  };

  const handleCreateTicket = async (): Promise<void> => {
    if (!ticketTitle.trim() || !ticketDescription.trim() || !ticketProperty.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createTicket({
        title: ticketTitle,
        description: ticketDescription,
        priority: ticketPriority as "low" | "medium" | "high" | "urgent" | "critical",
        status: "open",
        propertyId: ticketProperty,
        reportedBy: "manager",
        reportedAt: new Date(),
        category: ticketCategory || undefined,
        roomLocation: ticketRoomLocation || undefined,
        estimatedCost: ticketEstimatedCost ? parseFloat(ticketEstimatedCost) : undefined,
        estimatedDuration: ticketEstimatedDuration ? parseInt(ticketEstimatedDuration) : undefined,
        managerId: session?.user?.id || "",
      });
      
      Alert.alert("Succès", "Ticket créé avec succès!");
      setShowCreateTicketModal(false);
      resetTicketForm();
    } catch (error) {
      Alert.alert("Erreur", "Erreur lors de la création du ticket");
    }
  };

  const handlePlanSession = async (): Promise<void> => {
    if (!sessionTicketId || !sessionAgentId || !sessionScheduledDate) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const selectedTicketForSession = tickets.find(t => t.id === sessionTicketId);
    if (!selectedTicketForSession?.propertyId) {
      Alert.alert("Erreur", "Propriété du ticket introuvable");
      return;
    }

    try {
      await createSession({
        ticketId: sessionTicketId,
        propertyId: selectedTicketForSession.propertyId,
        agentId: sessionAgentId,
        scheduledDate: new Date(sessionScheduledDate),
        estimatedDuration: parseInt(sessionEstimatedDuration),
        status: "planned",
        workDescription: sessionWorkDescription || undefined,
        managerId: session?.user?.id || "",
      });
      
      Alert.alert("Succès", "Session planifiée avec succès!");
      setShowPlanSessionModal(false);
      resetSessionForm();
    } catch (error) {
      Alert.alert("Erreur", "Erreur lors de la planification de la session");
    }
  };

  const renderDashboard = (): JSX.Element => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statIconText}>🎫</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {tickets ? tickets.filter((t) => t.status === "open").length : 0}
            </Text>
            <Text style={styles.statLabel}>Tickets ouverts</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statIconText}>🔧</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {sessions
                ? sessions.filter((s) => s.status === "in_progress").length
                : 0}
            </Text>
            <Text style={styles.statLabel}>Sessions en cours</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statIconText}>✅</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {sessions
                ? sessions.filter(
                    (s) =>
                      s.status === "completed" &&
                      isThisMonth(new Date(s.updatedAt))
                  ).length
                : 0}
            </Text>
            <Text style={styles.statLabel}>Complétées ce mois</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statIconText}>👷</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {maintenanceAgents
                ? maintenanceAgents.filter(
                    (agent) => agent.availability === "available"
                  ).length
                : 0}
            </Text>
            <Text style={styles.statLabel}>Agents disponibles</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tickets urgents</Text>
        <View style={styles.urgentTicketsList}>
          {validateTicketsData() ? (
            tickets
              .filter((ticket: Ticket) => {
                if (!ticket) {
                  console.error("Erreur: ticket est null dans le filtre");
                  return false;
                }
                if (!ticket.priority || !ticket.status) {
                  console.error(
                    "Erreur: ticket.priority ou ticket.status est manquant"
                  );
                  return false;
                }
                return ticket.priority === "urgent" && ticket.status === "open";
              })
              .map((ticket: Ticket) => {
                if (!ticket || !ticket.id) {
                  console.error(
                    "Erreur: ticket ou ticket.id est manquant dans le map"
                  );
                  return null;
                }

                const priorityConfig: PriorityConfig = getPriorityConfig(
                  ticket.priority
                );
                const ticketTitle: string = ticket.title || "Titre manquant";
                const ticketDescription: string =
                  ticket.description || "Description manquante";
                const propertyName: string =
                  ticket.property?.name || "Propriété inconnue";

                return (
                  <View key={ticket.id} style={styles.urgentTicketCard}>
                    <View style={styles.urgentTicketHeader}>
                      <Text style={styles.urgentTicketTitle}>
                        {ticketTitle}
                      </Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: priorityConfig.bg },
                        ]}
                      >
                        <Text style={styles.priorityIcon}>
                          {priorityConfig.icon}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.urgentTicketProperty}>
                      {propertyName}
                    </Text>
                    <Text style={styles.urgentTicketDescription}>
                      {ticketDescription}
                    </Text>
                    <TouchableOpacity
                      style={styles.urgentAssignButton}
                      onPress={(): void => handleAssignAgent(ticket)}
                    >
                      <Text style={styles.urgentAssignButtonText}>
                        Assigner un agent
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
              .filter((element): element is JSX.Element => element !== null)
          ) : (
            <View style={styles.urgentTicketCard}>
              <Text style={styles.urgentTicketTitle}>
                {tickets && tickets.length === 0
                  ? "Aucun ticket disponible"
                  : "Aucun ticket urgent en cours"}
              </Text>
              <Text style={styles.urgentTicketDescription}>
                {!tickets
                  ? "Erreur de chargement des tickets"
                  : tickets.length === 0
                  ? "Créez votre premier ticket de maintenance"
                  : "Tous les tickets urgents sont traités"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sessions en cours</Text>
        <View style={styles.activeSessions}>
          {validateSessionsData() ? (
            sessions
              .filter((session: MaintenanceSession) => {
                if (!session) {
                  console.error("Erreur: session est null dans le filtre");
                  return false;
                }
                if (!session.status) {
                  console.error("Erreur: session.status est manquant");
                  return false;
                }
                return session.status === "in_progress";
              })
              .map((session: MaintenanceSession) => {
                if (!session || !session.id) {
                  console.error(
                    "Erreur: session ou session.id est manquant dans le map"
                  );
                  return null;
                }

                const propertyName: string =
                  session.property?.name || "Propriété inconnue";
                const agentName: string =
                  session.agent?.user?.name || "Agent inconnu";
                const ticketTitle: string =
                  session.ticket?.title || "Ticket inconnu";

                // Calculate progress for active session
                const calculateActiveProgress = (
                  session: MaintenanceSession
                ): number => {
                  if (session.status === "completed") return 100;
                  if (session.status === "cancelled") return 0;
                  if (session.status === "planned") return 0;
                  if (session.status === "in_progress") {
                    if (session.startTime && session.estimatedDuration) {
                      const startTime = new Date(session.startTime);
                      const now = new Date();
                      const elapsed = now.getTime() - startTime.getTime();
                      const elapsedMinutes = elapsed / (1000 * 60);
                      const progressPercent = Math.min(
                        95,
                        (elapsedMinutes / session.estimatedDuration) * 100
                      );
                      return Math.max(5, progressPercent);
                    }
                    return 25; // Default progress for in_progress without timing data
                  }
                  return 0;
                };
                const sessionProgress = calculateActiveProgress(session);

                return (
                  <View key={session.id} style={styles.activeSessionCard}>
                    <View style={styles.activeSessionHeader}>
                      <Text style={styles.activeSessionProperty}>
                        {propertyName}
                      </Text>
                      <Text style={styles.activeSessionAgent}>{agentName}</Text>
                    </View>
                    <Text style={styles.activeSessionTitle}>{ticketTitle}</Text>
                    <View style={styles.activeSessionProgress}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.round(sessionProgress)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(sessionProgress)}%
                      </Text>
                    </View>
                  </View>
                );
              })
              .filter((element): element is JSX.Element => element !== null)
          ) : (
            <View style={styles.activeSessionCard}>
              <Text style={styles.activeSessionProperty}>
                {sessions && sessions.length === 0
                  ? "Aucune session programmée"
                  : "Aucune session en cours"}
              </Text>
              <Text style={styles.activeSessionTitle}>
                {!sessions
                  ? "Erreur de chargement des sessions"
                  : sessions.length === 0
                  ? "Planifiez votre première session de maintenance"
                  : "Toutes les sessions sont terminées ou planifiées"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderTickets = (): JSX.Element => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Tickets de maintenance</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateTicketModal(true)}
        >
          <Text style={styles.addButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity style={[styles.filterTab, styles.activeFilterTab]}>
          <Text style={[styles.filterTabText, styles.activeFilterTabText]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>Ouverts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>En cours</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>Urgents</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ticketsList}>
        {validateTicketsData() ? (
          tickets
            .map((ticket: Ticket) => {
              if (!ticket || !ticket.id) {
                console.error(
                  "Erreur: ticket ou ticket.id est manquant dans renderTickets"
                );
                return null;
              }

              const priorityConfig: PriorityConfig = getPriorityConfig(
                ticket.priority
              );
              const statusConfig: StatusConfig = getStatusConfig(ticket.status);
              const ticketTitle: string = ticket.title || "Titre manquant";
              const ticketDescription: string =
                ticket.description || "Description manquante";
              const propertyName: string =
                ticket.property?.name || "Propriété inconnue";
              const propertyLocation: string =
                ticket.property?.address || "Localisation inconnue";
              const agentName: string =
                ticket.agent?.user?.name || "Agent inconnu";
              const createdDate: string = ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleDateString("fr-FR")
                : "Date inconnue";

              return (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketTitle}>{ticketTitle}</Text>
                      <Text style={styles.ticketProperty}>{propertyName}</Text>
                    </View>
                    <View style={styles.ticketBadges}>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: priorityConfig.bg },
                        ]}
                      >
                        <Text style={styles.priorityIcon}>
                          {priorityConfig.icon}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusConfig.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusConfig.color },
                          ]}
                        >
                          {statusConfig.text}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.ticketDescription}>
                    {ticketDescription}
                  </Text>

                  <View style={styles.ticketDetails}>
                    <View style={styles.ticketDetail}>
                      <Text style={styles.ticketDetailLabel}>📅 Créé le:</Text>
                      <Text style={styles.ticketDetailValue}>
                        {createdDate}
                      </Text>
                    </View>
                    <View style={styles.ticketDetail}>
                      <Text style={styles.ticketDetailLabel}>
                        📍 Localisation:
                      </Text>
                      <Text style={styles.ticketDetailValue}>
                        {propertyLocation}
                      </Text>
                    </View>
                    {ticket.agent && (
                      <View style={styles.ticketDetail}>
                        <Text style={styles.ticketDetailLabel}>
                          👷 Agent assigné:
                        </Text>
                        <Text style={styles.ticketDetailValue}>
                          {agentName}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.ticketActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Détails</Text>
                    </TouchableOpacity>
                    {ticket.status === "open" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSuccess,
                        ]}
                        onPress={(): void => handleAssignAgent(ticket)}
                      >
                        <Text style={styles.actionButtonTextSuccess}>
                          Assigner
                        </Text>
                      </TouchableOpacity>
                    )}
                    {ticket.status === "in_progress" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSuccess,
                        ]}
                      >
                        <Text style={styles.actionButtonTextSuccess}>
                          Résoudre
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
            .filter((element): element is JSX.Element => element !== null)
        ) : (
          <View style={styles.ticketCard}>
            <Text style={styles.ticketTitle}>
              {!tickets ? "Erreur de chargement" : "Aucun ticket disponible"}
            </Text>
            <Text style={styles.ticketDescription}>
              {!tickets
                ? "Impossible de charger les tickets. Vérifiez votre connexion."
                : "Créez votre premier ticket de maintenance pour commencer."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderSessions = (): JSX.Element => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Sessions de maintenance</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowPlanSessionModal(true)}
        >
          <Text style={styles.addButtonText}>+ Planifier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sessionsList}>
        {validateSessionsData() ? (
          sessions
            .map((session: MaintenanceSession) => {
              if (!session || !session.id) {
                console.error(
                  "Erreur: session ou session.id est manquant dans renderSessions"
                );
                return null;
              }

              const statusConfig: StatusConfig = getStatusConfig(
                session.status
              );
              // Calculate progress based on actual session data
              const calculateProgress = (
                session: MaintenanceSession
              ): number => {
                if (session.status === "completed") return 100;
                if (session.status === "cancelled") return 0;
                if (session.status === "planned") return 0;
                if (session.status === "in_progress") {
                  if (session.startTime && session.estimatedDuration) {
                    const startTime = new Date(session.startTime);
                    const now = new Date();
                    const elapsed = now.getTime() - startTime.getTime();
                    const elapsedMinutes = elapsed / (1000 * 60);
                    const progressPercent = Math.min(
                      95,
                      (elapsedMinutes / session.estimatedDuration) * 100
                    );
                    return Math.max(5, progressPercent);
                  }
                  return 25; // Default progress for in_progress without timing data
                }
                return 0;
              };
              const progress: number = calculateProgress(session);

              const ticketTitle: string =
                session.ticket?.title || "Ticket inconnu";
              const propertyName: string =
                session.property?.name || "Propriété inconnue";
              const agentName: string =
                session.agent?.user?.name || "Agent inconnu";
              const estimatedDuration: string =
                session.estimatedDuration?.toString() || "Non définie";
              const startDate: string = session.startTime
                ? new Date(session.startTime).toLocaleString("fr-FR")
                : "";
              const endDate: string = session.endTime
                ? new Date(session.endTime).toLocaleString("fr-FR")
                : "";
              const sessionNotes: string = session.notes || "";

              return (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{ticketTitle}</Text>
                      <Text style={styles.sessionProperty}>{propertyName}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusConfig.color },
                        ]}
                      >
                        {statusConfig.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionDetails}>
                    <View style={styles.sessionDetail}>
                      <Text style={styles.sessionDetailLabel}>👷 Agent:</Text>
                      <Text style={styles.sessionDetailValue}>{agentName}</Text>
                    </View>
                    <View style={styles.sessionDetail}>
                      <Text style={styles.sessionDetailLabel}>
                        ⏱️ Durée estimée:
                      </Text>
                      <Text style={styles.sessionDetailValue}>
                        {estimatedDuration} min
                      </Text>
                    </View>
                    {startDate && (
                      <View style={styles.sessionDetail}>
                        <Text style={styles.sessionDetailLabel}>🕐 Début:</Text>
                        <Text style={styles.sessionDetailValue}>
                          {startDate}
                        </Text>
                      </View>
                    )}
                    {endDate && (
                      <View style={styles.sessionDetail}>
                        <Text style={styles.sessionDetailLabel}>🕐 Fin:</Text>
                        <Text style={styles.sessionDetailValue}>{endDate}</Text>
                      </View>
                    )}
                  </View>

                  {session.status === "in_progress" && (
                    <View style={styles.sessionProgress}>
                      <Text style={styles.progressLabel}>Progression</Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressPercentage}>{progress}%</Text>
                    </View>
                  )}

                  {sessionNotes && (
                    <View style={styles.sessionNotes}>
                      <Text style={styles.sessionNotesLabel}>📝 Notes:</Text>
                      <Text style={styles.sessionNotesText}>
                        {sessionNotes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.sessionActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Détails</Text>
                    </TouchableOpacity>
                    {session.status === "planned" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSuccess,
                        ]}
                      >
                        <Text style={styles.actionButtonTextSuccess}>
                          Démarrer
                        </Text>
                      </TouchableOpacity>
                    )}
                    {session.status === "in_progress" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSuccess,
                        ]}
                      >
                        <Text style={styles.actionButtonTextSuccess}>
                          Terminer
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
            .filter((element): element is JSX.Element => element !== null)
        ) : (
          <View style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>
              {!sessions ? "Erreur de chargement" : "Aucune session disponible"}
            </Text>
            <Text style={styles.sessionProperty}>
              {!sessions
                ? "Impossible de charger les sessions. Vérifiez votre connexion."
                : "Planifiez votre première session de maintenance à partir d'un ticket."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAgents = (): JSX.Element => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Agents de maintenance</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Inviter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.agentsList}>
        {validateAgentsData() ? (
          agents
            .map((agent: MaintenanceAgent) => {
              if (!agent || !agent.id) {
                console.error(
                  "Erreur: agent ou agent.id est manquant dans renderAgents"
                );
                return null;
              }

              const availabilityConfig: AvailabilityConfig =
                getAvailabilityConfig(agent.availability);
              const agentName: string = agent.user?.name || "Nom manquant";
              const agentDescription: string = "Agent de maintenance";
              const agentRating: string =
                agent.rating?.toString() || "Non noté";
              const completedJobs: string =
                agent.completedTasks?.toString() || "0";
              const agentSpecialties: string[] =
                agent.specialties?.map((s: string) => s) || [];

              return (
                <View key={agent.id} style={styles.agentCard}>
                  <View style={styles.agentHeader}>
                    <View style={styles.agentInfo}>
                      <Text style={styles.agentName}>{agentName}</Text>
                      <Text style={styles.agentDescription}>
                        {agentDescription}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.availabilityBadge,
                        { backgroundColor: availabilityConfig.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.availabilityText,
                          { color: availabilityConfig.color },
                        ]}
                      >
                        {availabilityConfig.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.agentSpecialties}>
                    <Text style={styles.specialtiesLabel}>Spécialités:</Text>
                    <View style={styles.specialtiesList}>
                      {agentSpecialties.length > 0 ? (
                        agentSpecialties
                          .map((specialty: string, index: number) => {
                            if (!specialty || typeof specialty !== "string") {
                              console.error(
                                `Erreur: specialty à l'index ${index} est invalide`
                              );
                              return null;
                            }
                            return (
                              <View key={index} style={styles.specialtyTag}>
                                <Text style={styles.specialtyText}>
                                  {specialty}
                                </Text>
                              </View>
                            );
                          })
                          .filter(
                            (element): element is JSX.Element =>
                              element !== null
                          )
                      ) : (
                        <View style={styles.specialtyTag}>
                          <Text style={styles.specialtyText}>
                            Aucune spécialité
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.agentStats}>
                    <View style={styles.agentStat}>
                      <Text style={styles.agentStatValue}>{agentRating}</Text>
                      <Text style={styles.agentStatLabel}>⭐ Note</Text>
                    </View>
                    <View style={styles.agentStat}>
                      <Text style={styles.agentStatValue}>{completedJobs}</Text>
                      <Text style={styles.agentStatLabel}>
                        🔧 Interventions
                      </Text>
                    </View>
                  </View>

                  <View style={styles.agentActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Profil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        agent.availability === "available"
                          ? styles.actionButtonSuccess
                          : styles.actionButtonSecondary,
                      ]}
                      disabled={agent.availability !== "available"}
                    >
                      <Text
                        style={
                          agent.availability === "available"
                            ? styles.actionButtonTextSuccess
                            : styles.actionButtonTextSecondary
                        }
                      >
                        {agent.availability === "available"
                          ? "Assigner"
                          : "Indisponible"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
            .filter((element): element is JSX.Element => element !== null)
        ) : (
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>
              {!maintenanceAgents
                ? "Erreur de chargement"
                : agents && agents.length === 0
                ? "Aucun agent configuré"
                : "Aucun agent de maintenance"}
            </Text>
            <Text style={styles.agentDescription}>
              {!maintenanceAgents
                ? "Impossible de charger les agents. Vérifiez votre connexion."
                : agents && agents.length === 0
                ? "Invitez votre premier agent pour commencer."
                : "Aucun agent spécialisé en maintenance n'est disponible."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion de la Maintenance</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenue, {session?.user?.name || "Manager"}
        </Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "dashboard" && styles.activeTab]}
            onPress={(): void => setActiveTab("dashboard")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "dashboard" && styles.activeTabText,
              ]}
            >
              📊 Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "tickets" && styles.activeTab]}
            onPress={(): void => setActiveTab("tickets")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "tickets" && styles.activeTabText,
              ]}
            >
              🎫 Tickets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sessions" && styles.activeTab]}
            onPress={(): void => setActiveTab("sessions")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "sessions" && styles.activeTabText,
              ]}
            >
              🔧 Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "agents" && styles.activeTab]}
            onPress={(): void => setActiveTab("agents")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "agents" && styles.activeTabText,
              ]}
            >
              👷 Agents
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenu des onglets */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "tickets" && renderTickets()}
        {activeTab === "sessions" && renderSessions()}
        {activeTab === "agents" && renderAgents()}
      </ScrollView>

      {/* Modal d'assignation d'agent */}
      <Modal
        visible={showAssignAgentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={(): void => setShowAssignAgentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assigner un agent</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAssignAgentModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <View style={styles.ticketSummary}>
                <Text style={styles.ticketSummaryTitle}>
                  {selectedTicket.title}
                </Text>
                <Text style={styles.ticketSummaryProperty}>
                  {selectedTicket.property?.name}
                </Text>
              </View>
            )}

            <Text style={styles.modalSectionTitle}>Choisir un agent:</Text>
            <ScrollView style={styles.agentSelection}>
              {agents
                .filter((agent) => agent.availability === "available")
                .map((agent) => (
                  <TouchableOpacity
                    key={agent.id}
                    style={[
                      styles.agentSelectionCard,
                      selectedAgent?.id === agent.id &&
                        styles.selectedAgentCard,
                    ]}
                    onPress={() => setSelectedAgent(agent)}
                  >
                    <View style={styles.agentSelectionInfo}>
                      <Text style={styles.agentSelectionName}>
                        {agent.user?.name}
                      </Text>
                      <Text style={styles.agentSelectionDescription}>
                        Agent de maintenance
                      </Text>
                      <View style={styles.agentSelectionSpecialties}>
                        {agent.specialties
                          ?.slice(0, 2)
                          .map((specialty, index) => (
                            <View key={index} style={styles.specialtyTagSmall}>
                              <Text style={styles.specialtyTextSmall}>
                                {specialty.name}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                    <View style={styles.agentSelectionStats}>
                      <Text style={styles.agentSelectionRating}>
                        ⭐ {agent.rating}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAssignAgentModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  !selectedAgent && styles.modalConfirmButtonDisabled,
                ]}
                onPress={() => {
                  if (selectedAgent) {
                    setShowAssignAgentModal(false);
                    setShowCreateSessionModal(true);
                  }
                }}
                disabled={!selectedAgent}
              >
                <Text style={styles.modalConfirmText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de création de session */}
      <Modal
        visible={showCreateSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer une session</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCreateSessionModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sessionSummary}>
              <Text style={styles.sessionSummaryTitle}>Résumé</Text>
              <Text style={styles.sessionSummaryDetail}>
                Ticket: {selectedTicket?.title}
              </Text>
              <Text style={styles.sessionSummaryDetail}>
                Agent: {selectedAgent?.user?.name}
              </Text>
              <Text style={styles.sessionSummaryDetail}>
                Bien: {selectedTicket?.property?.name}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Durée estimée (minutes):</Text>
              <TextInput
                style={styles.textInput}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                keyboardType="numeric"
                placeholder="60"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optionnel):</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={sessionNotes}
                onChangeText={setSessionNotes}
                multiline
                numberOfLines={4}
                placeholder="Ajoutez des notes pour cette session..."
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateSessionModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreateSession}
              >
                <Text style={styles.modalConfirmText}>Créer la session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de création de ticket */}
      <Modal
        visible={showCreateTicketModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un ticket</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCreateTicketModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titre *:</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticketTitle}
                  onChangeText={setTicketTitle}
                  placeholder="Titre du ticket"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *:</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={ticketDescription}
                  onChangeText={setTicketDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Description détaillée du problème"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priorité:</Text>
                <View style={styles.priorityOptions}>
                  {["low", "medium", "high", "urgent"].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        ticketPriority === priority && styles.selectedPriorityOption,
                      ]}
                      onPress={() => setTicketPriority(priority)}
                    >
                      <Text
                        style={[
                          styles.priorityOptionText,
                          ticketPriority === priority && styles.selectedPriorityText,
                        ]}
                      >
                        {priority === "low" ? "Faible" : 
                         priority === "medium" ? "Moyenne" :
                         priority === "high" ? "Haute" : "Urgente"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Catégorie:</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticketCategory}
                  onChangeText={setTicketCategory}
                  placeholder="Ex: plomberie, électricité, chauffage"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Propriété *:</Text>
                <View style={styles.propertySelection}>
                  {properties.map((property) => (
                    <TouchableOpacity
                      key={property.id}
                      style={[
                        styles.propertySelectionCard,
                        ticketProperty === property.id && styles.selectedPropertyCard,
                      ]}
                      onPress={() => setTicketProperty(property.id)}
                    >
                      <View style={styles.propertySelectionInfo}>
                        <Text style={styles.propertySelectionName}>
                          {property.name}
                        </Text>
                        <Text style={styles.propertySelectionAddress}>
                          {property.address}, {property.city}
                        </Text>
                        <View style={styles.propertySelectionStatus}>
                          <View style={[
                            styles.statusIndicator,
                            { backgroundColor: 
                              property.status === 'available' ? '#34C759' :
                              property.status === 'occupied' ? '#FF9500' :
                              property.status === 'maintenance' ? '#FF3B30' : '#8E8E93'
                            }
                          ]} />
                          <Text style={styles.propertyStatusText}>
                            {property.status === 'available' ? 'Disponible' :
                             property.status === 'occupied' ? 'Occupée' :
                             property.status === 'maintenance' ? 'Maintenance' : 'Hors ligne'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Localisation:</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticketRoomLocation}
                  onChangeText={setTicketRoomLocation}
                  placeholder="Ex: cuisine, salle de bain, salon"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coût estimé (€):</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticketEstimatedCost}
                  onChangeText={setTicketEstimatedCost}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Durée estimée (minutes):</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticketEstimatedDuration}
                  onChangeText={setTicketEstimatedDuration}
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateTicketModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreateTicket}
              >
                <Text style={styles.modalConfirmText}>Créer le ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de planification de session */}
      <Modal
        visible={showPlanSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Planifier une session</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPlanSessionModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ticket *:</Text>
                <View style={styles.ticketSelection}>
                  {tickets
                    .filter(ticket => ticket.status === "open" || ticket.status === "assigned")
                    .map((ticket) => (
                    <TouchableOpacity
                      key={ticket.id}
                      style={[
                        styles.ticketSelectionCard,
                        sessionTicketId === ticket.id && styles.selectedTicketCard,
                      ]}
                      onPress={() => setSessionTicketId(ticket.id)}
                    >
                      <Text style={styles.ticketSelectionTitle}>{ticket.title}</Text>
                      <Text style={styles.ticketSelectionProperty}>
                        {ticket.property?.name || "Propriété"}
                      </Text>
                      <View style={styles.ticketSelectionPriority}>
                        <Text style={styles.priorityText}>
                          {getPriorityConfig(ticket.priority).icon} {ticket.priority}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Agent *:</Text>
                <View style={styles.agentSelection}>
                  {agents
                    .filter(agent => agent.availability === "available")
                    .map((agent) => (
                    <TouchableOpacity
                      key={agent.id}
                      style={[
                        styles.agentSelectionCard,
                        sessionAgentId === agent.id && styles.selectedAgentCard,
                      ]}
                      onPress={() => setSessionAgentId(agent.id)}
                    >
                      <Text style={styles.agentSelectionName}>
                        {agent.user?.name}
                      </Text>
                      <Text style={styles.agentSelectionDescription}>
                        Agent de maintenance
                      </Text>
                      <Text style={styles.agentSelectionRating}>
                        ⭐ {agent.rating || "N/A"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date et heure prévues *:</Text>
                <TextInput
                  style={styles.textInput}
                  value={sessionScheduledDate}
                  onChangeText={setSessionScheduledDate}
                  placeholder="YYYY-MM-DD HH:MM"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Durée estimée (minutes):</Text>
                <TextInput
                  style={styles.textInput}
                  value={sessionEstimatedDuration}
                  onChangeText={setSessionEstimatedDuration}
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description du travail:</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={sessionWorkDescription}
                  onChangeText={setSessionWorkDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Description détaillée du travail à effectuer"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPlanSessionModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handlePlanSession}
              >
                <Text style={styles.modalConfirmText}>Planifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: 50,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeTabText: {
    color: "#007AFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingTop: 20,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  urgentTicketsList: {
    gap: 12,
  },
  urgentTicketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentTicketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  urgentTicketTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    flex: 1,
  },
  urgentTicketProperty: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  urgentTicketDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  urgentAssignButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  urgentAssignButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activeSessions: {
    gap: 12,
  },
  activeSessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeSessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeSessionProperty: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  activeSessionAgent: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  activeSessionTitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  activeSessionProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  filterTabs: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
  },
  activeFilterTab: {
    backgroundColor: "#007AFF",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeFilterTabText: {
    color: "#FFFFFF",
  },
  ticketsList: {
    gap: 16,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  ticketProperty: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  ticketBadges: {
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  priorityIcon: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  ticketDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketDetails: {
    gap: 8,
    marginBottom: 16,
  },
  ticketDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketDetailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    width: 120,
  },
  ticketDetailValue: {
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
  },
  ticketActions: {
    flexDirection: "row",
    gap: 12,
  },
  sessionsList: {
    gap: 16,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  sessionProperty: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  sessionDetails: {
    gap: 8,
    marginBottom: 16,
  },
  sessionDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDetailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    width: 120,
  },
  sessionDetailValue: {
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
  },
  sessionProgress: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
    marginTop: 4,
  },
  sessionNotes: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  sessionNotesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  sessionNotesText: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 12,
  },
  agentsList: {
    gap: 16,
  },
  agentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  agentSpecialties: {
    marginBottom: 16,
  },
  specialtiesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  specialtiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  agentStats: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  agentStat: {
    alignItems: "center",
  },
  agentStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  agentStatLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  agentActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtonSecondary: {
    backgroundColor: "#F2F2F7",
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  actionButtonSuccess: {
    backgroundColor: "#34C759",
  },
  actionButtonTextSuccess: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 18,
    color: "#8E8E93",
  },
  ticketSummary: {
    padding: 20,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
  },
  ticketSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  ticketSummaryProperty: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  agentSelection: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  agentSelectionCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedAgentCard: {
    borderColor: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
  agentSelectionInfo: {
    flex: 1,
  },
  agentSelectionName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  agentSelectionDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  agentSelectionSpecialties: {
    flexDirection: "row",
    gap: 4,
  },
  specialtyTagSmall: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  specialtyTextSmall: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "600",
  },
  agentSelectionStats: {
    justifyContent: "center",
    alignItems: "center",
  },
  agentSelectionRating: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sessionSummary: {
    padding: 20,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
  },
  sessionSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  sessionSummaryDetail: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  inputGroup: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  priorityOptions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedPriorityOption: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  selectedPriorityText: {
    color: "#007AFF",
  },
  ticketSelection: {
    gap: 8,
    maxHeight: 200,
  },
  ticketSelectionCard: {
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedTicketCard: {
    borderColor: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
  ticketSelectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  ticketSelectionProperty: {
    fontSize: 12,
    color: "#007AFF",
    marginBottom: 4,
  },
  ticketSelectionPriority: {
    alignSelf: "flex-start",
  },
  priorityText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  propertySelection: {
    gap: 8,
    maxHeight: 200,
  },
  propertySelectionCard: {
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPropertyCard: {
    borderColor: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
  propertySelectionInfo: {
    flex: 1,
  },
  propertySelectionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  propertySelectionAddress: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 6,
  },
  propertySelectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  propertyStatusText: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "600",
  },
  // Styles pour les états de loading et d'erreur
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
