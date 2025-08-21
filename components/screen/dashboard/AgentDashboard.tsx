"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  useMyAgentProfile,
  useMyAgentStats,
  useMyActiveTasks,
  useMyUpcomingSessions,
  useMyOpenTickets,
} from "~/context/AgentProfileContext";
import { authClient } from "~/lib/auth-client";

interface AgentActivity {
  id: string;
  type: "task" | "cleaning" | "maintenance" | "ticket";
  title: string;
  description: string;
  time: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export default function AgentDashboard() {
  const { data: session } = authClient.useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");

  const {
    myProfile,
    isLoading,
    error,
    updateMyAvailability,
    startMyTask,
    startCleaningSession,
    startMaintenanceSession,
    acceptTicket,
  } = useMyAgentProfile();

  const stats = useMyAgentStats();
  const activeTasks = useMyActiveTasks();
  const upcomingSessions = useMyUpcomingSessions();
  const openTickets = useMyOpenTickets();

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "#34C759";
      case "busy":
        return "#FF9500";
      case "on_mission":
        return "#007AFF";
      case "on_break":
        return "#FFCC00";
      case "offline":
        return "#8E8E93";
      default:
        return "#8E8E93";
    }
  };

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case "available":
        return "Disponible";
      case "busy":
        return "Occupé";
      case "on_mission":
        return "En mission";
      case "on_break":
        return "En pause";
      case "offline":
        return "Hors ligne";
      default:
        return "Inconnu";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "#FF3B30";
      case "high":
        return "#FF9500";
      case "medium":
        return "#007AFF";
      case "low":
        return "#34C759";
      default:
        return "#8E8E93";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  // Créer les activités récentes à partir des données
  const recentActivities: AgentActivity[] = [
    ...activeTasks.slice(0, 2).map((task) => ({
      id: task.id,
      type: "task" as "task" | "cleaning" | "maintenance" | "ticket",
      title: task.title,
      description: task.description || "Tâche assignée",
      time: formatDateTime(task.assignedAt),
      priority: task.priority as any,
    })),
    ...upcomingSessions.slice(0, 2).map((session) => ({
      id: session.id,
      type: ("cleaningType" in session ? "cleaning" : "maintenance") as
        | "task"
        | "cleaning"
        | "maintenance"
        | "ticket",
      title:
        "cleaningType" in session ? "Session nettoyage" : "Session maintenance",
      description: `${session.property?.name} - ${formatDateTime(
        session.scheduledDate
      )}`,
      time: formatDateTime(session.scheduledDate),
      priority: "medium" as any,
    })),
    ...openTickets.slice(0, 2).map((ticket) => ({
      id: ticket.id,
      type: "ticket" as const,
      title: ticket.title,
      description: ticket.description,
      time: formatDateTime(ticket.reportedAt),
      priority: ticket.priority as any,
    })),
  ].slice(0, 5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task":
        return "📋";
      case "cleaning":
        return "🧹";
      case "maintenance":
        return "🔧";
      case "ticket":
        return "🎫";
      default:
        return "📋";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task":
        return "#007AFF";
      case "cleaning":
        return "#34C759";
      case "maintenance":
        return "#FF3B30";
      case "ticket":
        return "#FF9500";
      default:
        return "#8E8E93";
    }
  };

  async function signOut() {
    await authClient.signOut();
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de votre dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!myProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Profil agent non trouvé</Text>
      </View>
    );
  }

  const completionRate =
    stats.completedTasks > 0
      ? Math.round(
          (stats.completedTasks / (stats.completedTasks + stats.activeTasks)) *
            100
        )
      : 0;

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Dashboard Agent</Text>
            <Text style={styles.headerSubtitle}>
              Bonjour, {myProfile.user?.firstName || myProfile.user?.name}
            </Text>
          </View>
          <View style={styles.profileSection}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: getAvailabilityColor(myProfile.availability),
                },
              ]}
            />
            <Text style={styles.statusText}>
              {getAvailabilityLabel(myProfile.availability)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "today" && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod("today")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "today" && styles.activePeriodButtonText,
              ]}
            >
              Aujourd'hui
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "week" && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod("week")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "week" && styles.activePeriodButtonText,
              ]}
            >
              Cette semaine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "month" && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod("month")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "month" && styles.activePeriodButtonText,
              ]}
            >
              Ce mois
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vue d'ensemble */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.completedTasks}</Text>
              <Text style={styles.overviewLabel}>Tâches terminées</Text>
              <Text style={styles.overviewChange}>+{completionRate}%</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.activeTasks}</Text>
              <Text style={styles.overviewLabel}>Tâches actives</Text>
              <Text
                style={[
                  styles.overviewChange,
                  { color: stats.activeTasks > 0 ? "#FF9500" : "#34C759" },
                ]}
              >
                {stats.activeTasks > 0 ? "En cours" : "À jour"}
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.upcomingSessions}</Text>
              <Text style={styles.overviewLabel}>Sessions prévues</Text>
              <Text style={styles.overviewChange}>Programmées</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>
                {myProfile.averageRating?.toFixed(1) || "N/A"}
              </Text>
              <Text style={styles.overviewLabel}>Note moyenne</Text>
              <Text style={styles.overviewChange}>⭐ /5</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {myProfile.availability !== "available" && (
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => updateMyAvailability("available")}
              >
                <Text style={styles.quickActionIcon}>✅</Text>
                <Text style={styles.quickActionTitle}>Disponible</Text>
                <Text style={styles.quickActionSubtitle}>Marquer comme</Text>
              </TouchableOpacity>
            )}
            {myProfile.availability !== "on_break" && (
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => updateMyAvailability("on_break")}
              >
                <Text style={styles.quickActionIcon}>☕</Text>
                <Text style={styles.quickActionTitle}>Pause</Text>
                <Text style={styles.quickActionSubtitle}>Prendre une</Text>
              </TouchableOpacity>
            )}
            {myProfile.availability !== "offline" && (
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => updateMyAvailability("offline")}
              >
                <Text style={styles.quickActionIcon}>🌙</Text>
                <Text style={styles.quickActionTitle}>Hors ligne</Text>
                <Text style={styles.quickActionSubtitle}>Mode</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionTitle}>Planning</Text>
              <Text style={styles.quickActionSubtitle}>Voir le</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mes tâches */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes tâches</Text>
            <Text style={styles.sectionBadge}>{activeTasks.length}</Text>
          </View>

          <View style={styles.tasksList}>
            {activeTasks.length > 0 ? (
              activeTasks.slice(0, 3).map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      />
                    </View>
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                    <Text style={styles.taskTime}>
                      {task.status === "assigned" ? "À démarrer" : "En cours"} •{" "}
                      {formatDateTime(task.assignedAt)}
                    </Text>
                  </View>
                  {task.status === "assigned" && (
                    <TouchableOpacity
                      style={styles.taskButton}
                      onPress={() => startMyTask(task.id)}
                    >
                      <Text style={styles.taskButtonText}>Démarrer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>✅</Text>
                <Text style={styles.emptyStateText}>Aucune tâche active</Text>
                <Text style={styles.emptyStateSubtext}>Vous êtes à jour !</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sessions programmées */}
        {upcomingSessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessions programmées</Text>
              <Text style={styles.sectionBadge}>{upcomingSessions.length}</Text>
            </View>

            <View style={styles.sessionsList}>
              {upcomingSessions.slice(0, 3).map((session) => (
                <View key={session.id} style={styles.sessionItem}>
                  <View
                    style={[
                      styles.sessionIcon,
                      {
                        backgroundColor:
                          getActivityColor(
                            "cleaningType" in session
                              ? "cleaning"
                              : "maintenance"
                          ) + "20",
                      },
                    ]}
                  >
                    <Text style={styles.sessionIconText}>
                      {"cleaningType" in session ? "🧹" : "🔧"}
                    </Text>
                  </View>
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionTitle}>
                      {"cleaningType" in session ? "Nettoyage" : "Maintenance"}
                    </Text>
                    <Text style={styles.sessionDescription}>
                      {session.property?.name}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {formatDateTime(session.scheduledDate)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sessionButton}
                    onPress={() => {
                      if ("cleaningType" in session) {
                        startCleaningSession(session.id);
                      } else {
                        startMaintenanceSession(session.id);
                      }
                    }}
                  >
                    <Text style={styles.sessionButtonText}>Commencer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tickets ouverts */}
        {openTickets.length > 0 && (
          <View style={styles.ticketsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tickets à traiter</Text>
              <Text
                style={[styles.sectionBadge, { backgroundColor: "#FF3B30" }]}
              >
                {openTickets.length}
              </Text>
            </View>

            <View style={styles.ticketsList}>
              {openTickets.slice(0, 3).map((ticket) => (
                <View key={ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketContent}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketTitle}>{ticket.title}</Text>
                      <View
                        style={[
                          styles.priorityDot,
                          {
                            backgroundColor: getPriorityColor(ticket.priority),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.ticketDescription}>
                      {ticket.description}
                    </Text>
                    <Text style={styles.ticketTime}>
                      #{ticket.ticketNumber} •{" "}
                      {formatDateTime(ticket.reportedAt)}
                    </Text>
                  </View>
                  {ticket.status === "open" && (
                    <TouchableOpacity
                      style={styles.ticketButton}
                      onPress={() => acceptTicket(ticket.id)}
                    >
                      <Text style={styles.ticketButtonText}>Accepter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Activité récente */}
        {recentActivities.length > 0 && (
          <View style={styles.activitySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activité récente</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              {recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityIcon,
                      {
                        backgroundColor: getActivityColor(activity.type) + "20",
                      },
                    ]}
                  >
                    <Text style={styles.activityIconText}>
                      {getActivityIcon(activity.type)}
                    </Text>
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.priority && (
                        <View
                          style={[
                            styles.priorityDot,
                            {
                              backgroundColor: getPriorityColor(
                                activity.priority
                              ),
                            },
                          ]}
                        />
                      )}
                    </View>
                    <Text style={styles.activityDescription}>
                      {activity.description}
                    </Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bouton de déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activePeriodButton: {
    backgroundColor: "#007AFF",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activePeriodButtonText: {
    color: "#FFFFFF",
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionBadge: {
    backgroundColor: "#007AFF",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    textAlign: "center",
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  overviewCard: {
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
  overviewValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 8,
  },
  overviewChange: {
    fontSize: 12,
    fontWeight: "600",
    color: "#34C759",
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
  },
  tasksSection: {
    marginBottom: 24,
  },
  tasksList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  taskButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  taskButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sessionsSection: {
    marginBottom: 24,
  },
  sessionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionIconText: {
    fontSize: 20,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  sessionDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  sessionButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  sessionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  ticketsSection: {
    marginBottom: 24,
  },
  ticketsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  ticketContent: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  ticketDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  ticketTime: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  ticketButton: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  ticketButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
  },
  activitySection: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  activityList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  logoutSection: {
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
