import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { authClient } from "~/lib/auth-client";
import { useCleaning } from "~/context/CleaningContext";
import { useAgentsByType } from "~/context/AgentContext";
import { useConciergerie } from "~/context/ConciergerieContext";

export default function NettoyageScreen() {
  const { data: session } = authClient.useSession();
  const { properties } = useConciergerie();
  const {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    updateSession,
  } = useCleaning();

  const cleaningAgents = useAgentsByType("cleaning");

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "sessions" | "agents"
  >("dashboard");
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Form state for creating new session
  const [formData, setFormData] = useState({
    propertyId: "",
    agentId: "",
    scheduledDate: "",
    duration: "",
    cleaningType: "standard",
    notes: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "scheduled":
        return {
          color: "#FF9800",
          text: "Planifiée",
          bg: "#FFF3E0",
          icon: "📅",
        };
      case "in_progress":
        return {
          color: "#2196F3",
          text: "En cours",
          bg: "#E3F2FD",
          icon: "🔄",
        };
      case "completed":
        return {
          color: "#4CAF50",
          text: "Terminée",
          bg: "#E8F5E8",
          icon: "✅",
        };
      case "cancelled":
        return { color: "#F44336", text: "Annulée", bg: "#FFEBEE", icon: "❌" };
      default:
        return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5", icon: "❓" };
    }
  };

  const getAgentAvailabilityConfig = (availability: string) => {
    switch (availability) {
      case "available":
        return { color: "#4CAF50", text: "Disponible", bg: "#E8F5E8" };
      case "busy":
        return { color: "#FF9800", text: "Occupé", bg: "#FFF3E0" };
      case "off":
        return { color: "#F44336", text: "Indisponible", bg: "#FFEBEE" };
      default:
        return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5" };
    }
  };

  const getChronoText = (startTime: Date | null) => {
    if (!startTime) return "--:--";

    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();

    if (diffMs < 0) return "--:--";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCreateSession = async () => {
    if (
      !formData.propertyId ||
      !formData.agentId ||
      !formData.scheduledDate ||
      !formData.duration
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsCreating(true);
    try {
      await createSession({
        propertyId: formData.propertyId,
        agentId: formData.agentId,
        scheduledDate: new Date(formData.scheduledDate),
        duration: parseInt(formData.duration),
        cleaningType: formData.cleaningType,
        notes: formData.notes || undefined,
      });

      // Reset form and close modal
      setFormData({
        propertyId: "",
        agentId: "",
        scheduledDate: "",
        duration: "",
        cleaningType: "standard",
        notes: "",
      });
      setShowCreateSessionModal(false);

      // Refresh sessions
      await fetchSessions();
    } catch (error) {
      console.error("Erreur lors de la création de la session:", error);
      alert("Erreur lors de la création de la session. Veuillez réessayer.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setFormData({
      propertyId: "",
      agentId: "",
      scheduledDate: "",
      duration: "",
      cleaningType: "standard",
      notes: "",
    });
    setShowCreateSessionModal(false);
  };

  const renderDashboard = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions =
      sessions?.filter((session) => {
        if (!session?.scheduledDate) return false;
        const sessionDate = new Date(session.scheduledDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      }) || [];
    const sessionsInProgress = todaySessions.filter(
      (session) => session.status === "in_progress"
    ).length;
    const availableAgents =
      cleaningAgents?.filter((agent) => agent.availability === "available")
        .length || 0;
    const totalAgents = cleaningAgents?.length || 0;
    const averageRating =
      cleaningAgents?.length > 0
        ? (
            cleaningAgents.reduce(
              (sum, agent) => sum + (agent.rating || 0),
              0
            ) / cleaningAgents.length
          ).toFixed(1)
        : 0;

    return (
      <View style={styles.tabContent}>
        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Tableau de bord Nettoyage</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: "#4CAF50" }]}>
              <Text style={styles.statTitle}>Sessions aujourd'hui</Text>
              <Text style={styles.statNumber}>{todaySessions.length || 0}</Text>
              <Text style={styles.statSubtext}>
                {sessionsInProgress} en cours
              </Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#2196F3" }]}>
              <Text style={styles.statTitle}>Agents disponibles</Text>
              <Text style={styles.statNumber}>{availableAgents}</Text>
              <Text style={styles.statSubtext}>sur {totalAgents} agents</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#FF9800" }]}>
              <Text style={styles.statTitle}>Biens enregistrés</Text>
              <Text style={styles.statNumber}>{properties?.length || 0}</Text>
              <Text style={styles.statSubtext}>dans le système</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#9C27B0" }]}>
              <Text style={styles.statTitle}>Note moyenne</Text>
              <Text style={styles.statNumber}>{averageRating}</Text>
              <Text style={styles.statSubtext}>des agents</Text>
            </View>
          </View>
        </View>

        {/* Sessions du jour */}
        <View style={styles.todaySessionsSection}>
          <Text style={styles.sectionTitle}>Sessions d'aujourd'hui</Text>
          {!todaySessions || todaySessions.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Aucune session prévue aujourd'hui
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Les sessions planifiées apparaîtront ici
              </Text>
            </View>
          ) : (
            todaySessions.map((session) => {
              const statusConfig = getStatusConfig(session.status);
              return (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionProperty}>
                        {session.property?.name || "Propriété non définie"}
                      </Text>
                      <Text style={styles.sessionAgent}>
                        👤 {session.agent?.user?.name || "Agent non assigné"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.bg },
                      ]}
                    >
                      <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
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
                    <View style={styles.sessionDetailRow}>
                      <Text style={styles.detailIcon}>🕐</Text>
                      <Text style={styles.detailText}>
                        {new Date(session.scheduledDate).toLocaleDateString(
                          "fr-FR"
                        )}{" "}
                        ({session.duration || 0} min)
                      </Text>
                    </View>
                    <View style={styles.sessionDetailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>
                        {session.property?.address || "Adresse non définie"}
                      </Text>
                    </View>
                    <View style={styles.sessionDetailRow}>
                      <Text style={styles.detailIcon}>⏱️</Text>
                      <Text style={styles.detailText}>
                        Chrono:{" "}
                        {session.startTime && getChronoText(session.startTime)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Détails</Text>
                    </TouchableOpacity>
                    {session.status === "planned" && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={() => {
                          setSelectedSession(session);
                          setShowAssignAgentModal(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            styles.primaryButtonText,
                          ]}
                        >
                          Démarrer
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  };

  const renderSessions = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Sessions de Nettoyage</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateSessionModal(true)}
        >
          <Text style={styles.addButtonText}>+ Nouvelle session</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sessionsList}>
        {!sessions || sessions.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Aucune session de nettoyage
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Créez votre première session pour commencer
            </Text>
          </View>
        ) : (
          sessions.map((session) => {
            const statusConfig = getStatusConfig(session.status);
            const chronoText =
              session.startTime && getChronoText(session.startTime);

            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionProperty}>
                      {session.property?.name || "Propriété non définie"}
                    </Text>
                    <Text style={styles.sessionDate}>
                      📅{" "}
                      {session.scheduledDate
                        ? new Date(session.scheduledDate).toLocaleDateString(
                            "fr-FR"
                          )
                        : "Date non définie"}{" "}
                      à{" "}
                      {session.scheduledDate &&
                        new Date(session.scheduledDate).toLocaleTimeString(
                          "fr-FR"
                        )}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig.bg },
                    ]}
                  >
                    <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                    <Text
                      style={[styles.statusText, { color: statusConfig.color }]}
                    >
                      {statusConfig.text}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionAgent}>
                  <View style={styles.agentInfo}>
                    <View style={styles.agentAvatar}>
                      <Text style={styles.agentAvatarText}>
                        {session.agent?.user?.name?.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.agentName}>
                        {session.agent?.user?.name || "Agent non assigné"}
                      </Text>
                      <Text style={styles.agentPhone}>
                        📱{" "}
                        {session.agent?.user?.phone ||
                          "Téléphone non renseigné"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.agentRating}>
                    <Text style={styles.ratingText}>
                      ⭐ {session.agent?.rating || "N/A"}
                    </Text>
                  </View>
                </View>

                {session.status === "in_progress" && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle}>Temps écoulé</Text>
                      <Text style={styles.progressText}>{chronoText}</Text>
                    </View>
                    <View style={styles.chronoIndicator}>
                      <Text style={styles.chronoText}>
                        ⏱️ Intervention en cours
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.sessionMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🏠</Text>
                    <Text style={styles.metaText}>
                      {session.property?.numberOfRooms || "N/A"} pièces
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>📐</Text>
                    <Text style={styles.metaText}>
                      {session.property?.surface || "N/A"} m²
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>⏱️</Text>
                    <Text style={styles.metaText}>
                      {session.duration || 0} min
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🧹</Text>
                    <Text style={styles.metaText}>
                      {session.cleaningType === "standard"
                        ? "Standard"
                        : session.cleaningType === "deep_clean"
                        ? "Approfondi"
                        : "Maintenance"}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Modifier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.primaryButtonText,
                      ]}
                    >
                      Assigner
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  const renderAgents = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Agents de Nettoyage</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Nouvel agent</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.agentsList}>
        {!cleaningAgents || cleaningAgents.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Aucun agent de nettoyage</Text>
            <Text style={styles.emptyStateSubtext}>
              Ajoutez des agents pour gérer les sessions
            </Text>
          </View>
        ) : (
          cleaningAgents.map((agent) => {
            const availabilityConfig = getAgentAvailabilityConfig(
              agent.availability
            );

            return (
              <View key={agent.id} style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <View style={styles.agentMainInfo}>
                    <View style={styles.agentAvatar}>
                      <Text style={styles.agentAvatarText}>
                        {agent.user?.name?.charAt(0) || "?"}
                      </Text>
                    </View>
                    <View style={styles.agentDetails}>
                      <Text style={styles.agentName}>
                        {agent.user?.name || "Agent sans nom"}
                      </Text>
                      <Text style={styles.agentExperience}>
                        💼 Expérience non renseignée
                      </Text>
                      <Text style={styles.agentPhone}>
                        📱 {agent.user?.phone || "Téléphone non renseigné"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.agentStatus}>
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
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>
                        ⭐ {agent.rating || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.agentSpecialties}>
                  <Text style={styles.specialtiesTitle}>Spécialités:</Text>
                  <View style={styles.specialtiesList}>
                    {agent.specialties && agent.specialties.length > 0 ? (
                      agent.specialties.map((specialty, index) => (
                        <View key={index} style={styles.specialtyTag}>
                          <Text style={styles.specialtyText}>
                            {specialty.name}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noSpecialtiesText}>
                        Aucune spécialité définie
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.agentStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {agent.completedTasks || 0}
                    </Text>
                    <Text style={styles.statLabel}>Sessions complétées</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {agent.averageRating
                        ? `${(agent.averageRating * 20).toFixed(0)}%`
                        : "N/A"}
                    </Text>
                    <Text style={styles.statLabel}>Taux de satisfaction</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {agent.responseTime ? `${agent.responseTime}min` : "N/A"}
                    </Text>
                    <Text style={styles.statLabel}>Temps réponse</Text>
                  </View>
                </View>

                <View style={styles.agentActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Profil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Planning</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.primaryButtonText,
                      ]}
                    >
                      Assigner
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );

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
              fetchSessions();
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion du Nettoyage</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenue, {session?.user?.name || "Manager"}
        </Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "dashboard" && styles.activeTab]}
            onPress={() => setActiveTab("dashboard")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "dashboard" && styles.activeTabText,
              ]}
            >
              📊 Tableau de bord
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sessions" && styles.activeTab]}
            onPress={() => setActiveTab("sessions")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "sessions" && styles.activeTabText,
              ]}
            >
              🧹 Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "agents" && styles.activeTab]}
            onPress={() => setActiveTab("agents")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "agents" && styles.activeTabText,
              ]}
            >
              👥 Agents
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenu des onglets */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "sessions" && renderSessions()}
        {activeTab === "agents" && renderAgents()}
      </ScrollView>

      {/* Modal d'assignation d'agent */}
      <Modal
        visible={showAssignAgentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAssignAgentModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assigner un agent</Text>
            <TouchableOpacity style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Confirmer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedSession && (
              <View style={styles.sessionSummary}>
                <Text style={styles.summaryTitle}>Session sélectionnée</Text>
                <Text style={styles.summaryProperty}>
                  {selectedSession.property?.name || "Propriété non définie"}
                </Text>
                <Text style={styles.summaryDate}>
                  📅{" "}
                  {selectedSession.scheduledDate
                    ? new Date(
                        selectedSession.scheduledDate
                      ).toLocaleDateString("fr-FR")
                    : "Date non définie"}{" "}
                  à {selectedSession.scheduledTime || "Heure non définie"}
                </Text>
              </View>
            )}

            <Text style={styles.agentsListTitle}>Agents disponibles</Text>
            {cleaningAgents
              .filter((agent) => agent.availability === "available")
              .map((agent) => (
                <TouchableOpacity key={agent.id} style={styles.agentSelectCard}>
                  <View style={styles.agentSelectInfo}>
                    <View style={styles.agentAvatar}>
                      <Text style={styles.agentAvatarText}>
                        {agent.user?.name?.charAt(0) || "?"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.agentName}>
                        {agent.user?.name || "Agent sans nom"}
                      </Text>
                      <Text style={styles.agentExperience}>
                        💼 Expérience non renseignée
                      </Text>
                      <Text style={styles.agentRating}>
                        ⭐ {agent.rating || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.agentSelectButton}>
                    <Text style={styles.selectButtonText}>Sélectionner</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de création de session */}
      <Modal
        visible={showCreateSessionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCloseCreateModal}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle session</Text>
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                isCreating && styles.disabledButton,
              ]}
              onPress={handleCreateSession}
              disabled={isCreating}
            >
              <Text style={styles.modalSaveText}>
                {isCreating ? "Création..." : "Créer"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Bien à nettoyer *</Text>
              <View style={styles.selectContainer}>
                {properties?.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={[
                      styles.selectOption,
                      formData.propertyId === property.id &&
                        styles.selectOptionSelected,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        propertyId: property.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.propertyId === property.id &&
                          styles.selectOptionTextSelected,
                      ]}
                    >
                      {property.name || "Propriété sans nom"}
                    </Text>
                    <Text style={styles.selectOptionSubtext}>
                      {property.address || "Adresse non définie"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date et heure *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="2024-02-15T09:00"
                placeholderTextColor="#8E8E93"
                value={formData.scheduledDate}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, scheduledDate: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Durée estimée (minutes) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="120"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={formData.duration}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, duration: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Agent assigné *</Text>
              <View style={styles.selectContainer}>
                {cleaningAgents
                  ?.filter((agent) => agent.availability === "available")
                  .map((agent) => (
                    <TouchableOpacity
                      key={agent.id}
                      style={[
                        styles.selectOption,
                        formData.agentId === agent.id &&
                          styles.selectOptionSelected,
                      ]}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, agentId: agent.id }))
                      }
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          formData.agentId === agent.id &&
                            styles.selectOptionTextSelected,
                        ]}
                      >
                        {agent.user?.name || "Agent sans nom"}
                      </Text>
                      <Text style={styles.selectOptionSubtext}>
                        ⭐ {agent.rating || "N/A"} •{" "}
                        {agent.user?.phone || "Pas de téléphone"}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type de nettoyage *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.cleaningType === "standard" &&
                      styles.typeOptionActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cleaningType: "standard",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.cleaningType === "standard" &&
                        styles.typeOptionTextActive,
                    ]}
                  >
                    Standard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.cleaningType === "deep" && styles.typeOptionActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, cleaningType: "deep" }))
                  }
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.cleaningType === "deep" &&
                        styles.typeOptionTextActive,
                    ]}
                  >
                    Approfondi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.cleaningType === "maintenance" &&
                      styles.typeOptionActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cleaningType: "maintenance",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.cleaningType === "maintenance" &&
                        styles.typeOptionTextActive,
                    ]}
                  >
                    Maintenance
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Instructions spéciales..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, notes: text }))
                }
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
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

  // Styles pour le dashboard
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: "#8E8E93",
  },

  // Styles pour les sessions
  todaySessionsSection: {
    marginBottom: 24,
  },
  sessionsList: {
    gap: 16,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginRight: 12,
  },
  sessionProperty: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  sessionAgent: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 16,
  },
  sessionDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#8E8E93",
    flex: 1,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },

  // Styles pour les agents dans les sessions
  agentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  agentAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  agentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  agentPhone: {
    fontSize: 12,
    color: "#8E8E93",
  },
  agentRating: {
    marginLeft: "auto",
  },
  ratingText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "600",
  },

  // Styles pour le chrono
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
    fontFamily: "monospace",
  },
  chronoIndicator: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  chronoText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },

  // Styles pour les métadonnées de session
  sessionMeta: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  metaItem: {
    alignItems: "center",
  },
  metaIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#8E8E93",
    textAlign: "center",
  },

  // Styles pour les agents
  agentsList: {
    gap: 16,
  },
  agentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  agentMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  agentDetails: {
    flex: 1,
  },
  agentExperience: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 2,
  },
  agentStatus: {
    alignItems: "flex-end",
    gap: 8,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ratingContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  agentSpecialties: {
    marginBottom: 16,
  },
  specialtiesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  specialtiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 11,
    color: "#2196F3",
    fontWeight: "600",
  },
  agentStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#8E8E93",
    textAlign: "center",
  },
  agentActions: {
    flexDirection: "row",
    gap: 12,
  },

  // Styles pour les modals
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#007AFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Styles pour la sélection d'agent
  sessionSummary: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  summaryProperty: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  agentsListTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  agentSelectCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  agentSelectInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  agentSelectButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Styles pour le formulaire
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
    backgroundColor: "#F8F9FA",
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  selectOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  selectOptionSubtext: {
    fontSize: 14,
    color: "#8E8E93",
  },
  selectOptionSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  selectOptionTextSelected: {
    color: "#2196F3",
  },
  disabledButton: {
    opacity: 0.6,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeOption: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  typeOptionActive: {
    backgroundColor: "#007AFF",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  typeOptionTextActive: {
    color: "#FFFFFF",
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
  // Styles pour les états vides
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    marginVertical: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  noSpecialtiesText: {
    fontSize: 12,
    color: "#8E8E93",
    fontStyle: "italic",
  },
});
