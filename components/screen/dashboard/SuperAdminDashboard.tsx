import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { authClient } from "~/lib/auth-client";
import { useConciergerie } from "~/context/ConciergerieContext";
import { useAgents } from "~/context/AgentContext";
import { useCleaning } from "~/context/CleaningContext";
import { useBlanchisserie } from "~/context/BlanchisserieContext";
import { useMaintenance } from "~/context/MaintenanceContext";
import { router } from "expo-router";

// Types pour les données du dashboard
interface DashboardStats {
  conciergerie: {
    activeProperties: number;
    reservations: number;
    revenue: number;
    occupancyRate: number;
  };
  nettoyage: {
    sessions: number;
    agents: number;
    completed: number;
    pending: number;
  };
  blanchisserie: {
    orders: number;
    processing: number;
    revenue: number;
    delivery: number;
  };
  maintenance: {
    tickets: number;
    urgent: number;
    inProgress: number;
    agents: number;
  };
}

interface RecentActivity {
  id: string;
  type: "conciergerie" | "nettoyage" | "blanchisserie" | "maintenance";
  title: string;
  description: string;
  time: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export default function SuperAdminDashboard() {
  const { data: session } = authClient.useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("week");

  // Utilisation de tous les contexts
  const { properties, reservations, setShowCreatePropertyModal } =
    useConciergerie();

  const { agents } = useAgents();
  const { sessions: allCleaningSessions } = useCleaning();
  const { orders: laundryOrders, products: laundryProducts } =
    useBlanchisserie();
  const { tickets: maintenanceTickets, sessions: maintenanceSessions } =
    useMaintenance();

  // Calculer les statistiques à partir des données réelles
  const calculateStats = (): DashboardStats => {
    const activeProperties = properties.filter(
      (p) => p.status === "available"
    ).length;
    const totalReservations = reservations.length;
    const activeReservations = reservations.filter(
      (r) =>
        r.status === "confirmed" ||
        r.status === "in_progress" ||
        r.status === "checked_in"
    ).length;

    const totalRevenue = reservations.reduce(
      (sum, r) => sum + (r.totalPrice || 0),
      0
    );
    const occupancyRate =
      activeProperties > 0
        ? Math.round((activeReservations / activeProperties) * 100)
        : 0;

    // Stats nettoyage
    const allSessions = [...allCleaningSessions];
    const activeSessions = allSessions.filter(
      (s) => s.status === "in_progress" || s.status === "planned"
    ).length;
    const completedSessions = allSessions.filter(
      (s) => s.status === "completed"
    ).length;
    const pendingSessions = allSessions.filter(
      (s) => s.status === "planned"
    ).length;
    const cleaningAgents = agents.filter(
      (a) => a.agentType === "cleaning"
    ).length;

    // Stats blanchisserie
    const totalOrders = laundryOrders.length;
    const processingOrders = laundryOrders.filter(
      (o) => o.status === "processing"
    ).length;
    const deliveryOrders = laundryOrders.filter(
      (o) => o.status === "in_delivery"
    ).length;
    const laundryRevenue = laundryOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    // Stats maintenance
    const allTickets = [...maintenanceTickets];
    const totalTickets = allTickets.length;
    const urgentTickets = allTickets.filter(
      (t) => t.priority === "urgent" || t.priority === "critical"
    ).length;
    const inProgressTickets = allTickets.filter(
      (t) => t.status === "in_progress"
    ).length;
    const maintenanceAgents = agents.filter(
      (a) => a.agentType === "maintenance"
    ).length;

    return {
      conciergerie: {
        activeProperties,
        reservations: totalReservations,
        revenue: totalRevenue,
        occupancyRate,
      },
      nettoyage: {
        sessions: activeSessions,
        agents: cleaningAgents,
        completed: completedSessions,
        pending: pendingSessions,
      },
      blanchisserie: {
        orders: totalOrders,
        processing: processingOrders,
        revenue: laundryRevenue,
        delivery: deliveryOrders,
      },
      maintenance: {
        tickets: totalTickets,
        urgent: urgentTickets,
        inProgress: inProgressTickets,
        agents: maintenanceAgents,
      },
    };
  };

  const stats = calculateStats();

  // Générer les activités récentes à partir des données
  const generateRecentActivities = (): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Tickets récents
    const allTickets = [...maintenanceTickets];
    allTickets.slice(0, 2).forEach((ticket) => {
      activities.push({
        id: `ticket-${ticket.id}`,
        type: "maintenance",
        title: ticket.title,
        description:
          ticket.description?.substring(0, 50) + "..." ||
          "Ticket de maintenance",
        time: getRelativeTime(ticket.createdAt),
        priority: ticket.priority as any,
      });
    });

    // Sessions de nettoyage récentes
    const allSessions = [...allCleaningSessions];
    allSessions.slice(0, 2).forEach((session) => {
      activities.push({
        id: `cleaning-${session.id}`,
        type: "nettoyage",
        title:
          session.status === "completed"
            ? "Session terminée"
            : "Session planifiée",
        description: `${session.property?.name || "Propriété"} - ${
          session.cleaningType || "nettoyage"
        }`,
        time: getRelativeTime(session.createdAt),
      });
    });

    // Réservations récentes
    reservations.slice(0, 1).forEach((reservation) => {
      activities.push({
        id: `reservation-${reservation.id}`,
        type: "conciergerie",
        title: "Réservation créée",
        description: `${reservation.guestName} - Check-in ${new Date(
          reservation.checkIn
        ).toLocaleDateString()}`,
        time: getRelativeTime(reservation.createdAt),
      });
    });

    // Commandes blanchisserie récentes
    laundryOrders.slice(0, 1).forEach((order) => {
      activities.push({
        id: `laundry-${order.id}`,
        type: "blanchisserie",
        title: "Commande traitée",
        description: `${order.orderNumber} - ${order.status}`,
        time: getRelativeTime(order.createdAt),
      });
    });

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  };

  // Fonction utilitaire pour calculer le temps relatif
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  const recentActivities = generateRecentActivities();

  // Handlers pour les boutons d'actions rapides
  const handleNewTicket = () => {
    // TODO: Ouvrir modal de création de ticket
    router.push("/(tabs)/super_admin/maintenance");
  };

  const handlePlanCleaning = () => {
    // TODO: Ouvrir modal de planification nettoyage
    router.push("/(tabs)/super_admin/nettoyage");
  };

  const handleAddProperty = () => {
    setShowCreatePropertyModal(true);
  };

  const handleNewLaundryOrder = () => {
    // TODO: Ouvrir modal de commande blanchisserie
    router.push("/(tabs)/super_admin/blachisserie");
  };

  const handleViewPoleDetails = (pole: string) => {
    switch (pole) {
      case "conciergerie":
        router.push("/(tabs)/super_admin/conciergerie");
        break;
      case "nettoyage":
        router.push("/(tabs)/super_admin/nettoyage");
        break;
      case "blanchisserie":
        router.push("/(tabs)/super_admin/blachisserie");
        break;
      case "maintenance":
        router.push("/(tabs)/super_admin/maintenance");
        break;
    }
  };

  async function signOut() {
    await authClient.signOut();
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "conciergerie":
        return "🏠";
      case "nettoyage":
        return "🧹";
      case "blanchisserie":
        return "🧺";
      case "maintenance":
        return "🔧";
      default:
        return "📋";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "conciergerie":
        return "#007AFF";
      case "nettoyage":
        return "#34C759";
      case "blanchisserie":
        return "#FF9500";
      case "maintenance":
        return "#FF3B30";
      default:
        return "#8E8E93";
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

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Dashboard All4Host</Text>
            <Text style={styles.headerSubtitle}>
              Bienvenue, {session?.user?.name || "Manager"}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "day" && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod("day")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "day" && styles.activePeriodButtonText,
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
              <Text style={styles.overviewValue}>
                {stats.conciergerie.reservations +
                  stats.nettoyage.sessions +
                  stats.blanchisserie.orders +
                  stats.maintenance.tickets}
              </Text>
              <Text style={styles.overviewLabel}>Total activités</Text>
              <Text style={styles.overviewChange}>+12%</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>
                {(
                  stats.conciergerie.revenue + stats.blanchisserie.revenue
                ).toLocaleString()}
                €
              </Text>
              <Text style={styles.overviewLabel}>Chiffre d'affaires</Text>
              <Text style={styles.overviewChange}>+8%</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>
                {agents.filter((a) => a.isActive).length}
              </Text>
              <Text style={styles.overviewLabel}>Agents actifs</Text>
              <Text style={styles.overviewChange}>+2</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>91%</Text>
              <Text style={styles.overviewLabel}>Satisfaction</Text>
              <Text style={styles.overviewChange}>+3%</Text>
            </View>
          </View>
        </View>

        {/* Pôles d'activité */}
        <View style={styles.polesSection}>
          <Text style={styles.sectionTitle}>Pôles d'activité</Text>

          {/* Conciergerie */}
          <View style={styles.poleCard}>
            <View style={styles.poleHeader}>
              <View style={styles.poleHeaderLeft}>
                <View style={[styles.poleIcon, { backgroundColor: "#E3F2FD" }]}>
                  <Text style={styles.poleIconText}>🏠</Text>
                </View>
                <View>
                  <Text style={styles.poleTitle}>Conciergerie</Text>
                  <Text style={styles.poleSubtitle}>
                    Gestion des propriétés
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.poleDetailsButton}
                onPress={() => handleViewPoleDetails("conciergerie")}
              >
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.conciergerie.activeProperties}
                </Text>
                <Text style={styles.poleStatLabel}>Biens actifs</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.conciergerie.reservations}
                </Text>
                <Text style={styles.poleStatLabel}>Réservations</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.conciergerie.occupancyRate}%
                </Text>
                <Text style={styles.poleStatLabel}>Taux occupation</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.conciergerie.revenue.toLocaleString()}€
                </Text>
                <Text style={styles.poleStatLabel}>Revenus</Text>
              </View>
            </View>
          </View>

          {/* Nettoyage */}
          <View style={styles.poleCard}>
            <View style={styles.poleHeader}>
              <View style={styles.poleHeaderLeft}>
                <View style={[styles.poleIcon, { backgroundColor: "#E8F5E8" }]}>
                  <Text style={styles.poleIconText}>🧹</Text>
                </View>
                <View>
                  <Text style={styles.poleTitle}>Nettoyage</Text>
                  <Text style={styles.poleSubtitle}>Sessions de nettoyage</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.poleDetailsButton}
                onPress={() => handleViewPoleDetails("nettoyage")}
              >
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.nettoyage.sessions}
                </Text>
                <Text style={styles.poleStatLabel}>Sessions actives</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.nettoyage.agents}
                </Text>
                <Text style={styles.poleStatLabel}>Agents</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.nettoyage.completed}
                </Text>
                <Text style={styles.poleStatLabel}>Terminées</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.nettoyage.pending}
                </Text>
                <Text style={styles.poleStatLabel}>En attente</Text>
              </View>
            </View>
          </View>

          {/* Blanchisserie */}
          <View style={styles.poleCard}>
            <View style={styles.poleHeader}>
              <View style={styles.poleHeaderLeft}>
                <View style={[styles.poleIcon, { backgroundColor: "#FFF3E0" }]}>
                  <Text style={styles.poleIconText}>🧺</Text>
                </View>
                <View>
                  <Text style={styles.poleTitle}>Blanchisserie</Text>
                  <Text style={styles.poleSubtitle}>Commandes de linge</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.poleDetailsButton}
                onPress={() => handleViewPoleDetails("blanchisserie")}
              >
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.blanchisserie.orders}
                </Text>
                <Text style={styles.poleStatLabel}>Commandes</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.blanchisserie.processing}
                </Text>
                <Text style={styles.poleStatLabel}>En traitement</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.blanchisserie.delivery}
                </Text>
                <Text style={styles.poleStatLabel}>En livraison</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.blanchisserie.revenue.toLocaleString()}€
                </Text>
                <Text style={styles.poleStatLabel}>Chiffre d'affaires</Text>
              </View>
            </View>
          </View>

          {/* Maintenance */}
          <View style={styles.poleCard}>
            <View style={styles.poleHeader}>
              <View style={styles.poleHeaderLeft}>
                <View style={[styles.poleIcon, { backgroundColor: "#FFEBEE" }]}>
                  <Text style={styles.poleIconText}>🔧</Text>
                </View>
                <View>
                  <Text style={styles.poleTitle}>Maintenance</Text>
                  <Text style={styles.poleSubtitle}>
                    Tickets et interventions
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.poleDetailsButton}
                onPress={() => handleViewPoleDetails("maintenance")}
              >
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.maintenance.tickets}
                </Text>
                <Text style={styles.poleStatLabel}>Tickets totaux</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={[styles.poleStatValue, { color: "#FF3B30" }]}>
                  {stats.maintenance.urgent}
                </Text>
                <Text style={styles.poleStatLabel}>Urgents</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.maintenance.inProgress}
                </Text>
                <Text style={styles.poleStatLabel}>En cours</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {stats.maintenance.agents}
                </Text>
                <Text style={styles.poleStatLabel}>Techniciens</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activité récente */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
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
                    { backgroundColor: getActivityColor(activity.type) + "20" },
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

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleNewTicket}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionTitle}>Nouveau ticket</Text>
              <Text style={styles.quickActionSubtitle}>Maintenance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handlePlanCleaning}
            >
              <Text style={styles.quickActionIcon}>🧹</Text>
              <Text style={styles.quickActionTitle}>Planifier nettoyage</Text>
              <Text style={styles.quickActionSubtitle}>Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleAddProperty}
            >
              <Text style={styles.quickActionIcon}>🏠</Text>
              <Text style={styles.quickActionTitle}>Ajouter bien</Text>
              <Text style={styles.quickActionSubtitle}>Conciergerie</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleNewLaundryOrder}
            >
              <Text style={styles.quickActionIcon}>🧺</Text>
              <Text style={styles.quickActionTitle}>Nouvelle commande</Text>
              <Text style={styles.quickActionSubtitle}>Blanchisserie</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    fontSize: 20,
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
  polesSection: {
    marginBottom: 24,
  },
  poleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  poleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  poleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  poleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  poleIconText: {
    fontSize: 24,
  },
  poleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  poleSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  poleDetailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  poleDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  poleStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  poleStat: {
    alignItems: "center",
  },
  poleStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  poleStatLabel: {
    fontSize: 11,
    color: "#8E8E93",
    textAlign: "center",
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
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
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
