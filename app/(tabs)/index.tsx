import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { authClient } from "~/lib/auth-client";

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

// Données de démonstration
const mockStats: DashboardStats = {
  conciergerie: {
    activeProperties: 24,
    reservations: 18,
    revenue: 12450,
    occupancyRate: 85,
  },
  nettoyage: {
    sessions: 16,
    agents: 8,
    completed: 156,
    pending: 12,
  },
  blanchisserie: {
    orders: 32,
    processing: 8,
    revenue: 2340,
    delivery: 6,
  },
  maintenance: {
    tickets: 28,
    urgent: 4,
    inProgress: 12,
    agents: 6,
  },
};

const mockActivities: RecentActivity[] = [
  {
    id: "1",
    type: "maintenance",
    title: "Fuite d'eau urgente",
    description: "Appartement Centre-Ville - Salle de bain",
    time: "Il y a 15 min",
    priority: "urgent",
  },
  {
    id: "2",
    type: "nettoyage",
    title: "Session terminée",
    description: "Studio Étudiant - Marc Dupont",
    time: "Il y a 32 min",
  },
  {
    id: "3",
    type: "conciergerie",
    title: "Nouvelle réservation",
    description: "Maison Familiale - Check-in demain",
    time: "Il y a 1h",
  },
  {
    id: "4",
    type: "blanchisserie",
    title: "Commande en livraison",
    description: "Hôtel Luxe Paris - 50 pièces",
    time: "Il y a 2h",
  },
  {
    id: "5",
    type: "maintenance",
    title: "Ticket résolu",
    description: "Porte qui grince réparée",
    time: "Il y a 3h",
  },
];

export default function DashboardScreen() {
  const { data: session } = authClient.useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("week");

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
              <Text style={styles.overviewValue}>68</Text>
              <Text style={styles.overviewLabel}>Total activités</Text>
              <Text style={styles.overviewChange}>+12%</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>17,130€</Text>
              <Text style={styles.overviewLabel}>Chiffre d'affaires</Text>
              <Text style={styles.overviewChange}>+8%</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>22</Text>
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
              <TouchableOpacity style={styles.poleDetailsButton}>
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.conciergerie.activeProperties}
                </Text>
                <Text style={styles.poleStatLabel}>Biens actifs</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.conciergerie.reservations}
                </Text>
                <Text style={styles.poleStatLabel}>Réservations</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.conciergerie.occupancyRate}%
                </Text>
                <Text style={styles.poleStatLabel}>Taux occupation</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.conciergerie.revenue.toLocaleString()}€
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
              <TouchableOpacity style={styles.poleDetailsButton}>
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.nettoyage.sessions}
                </Text>
                <Text style={styles.poleStatLabel}>Sessions actives</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.nettoyage.agents}
                </Text>
                <Text style={styles.poleStatLabel}>Agents</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.nettoyage.completed}
                </Text>
                <Text style={styles.poleStatLabel}>Terminées</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.nettoyage.pending}
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
              <TouchableOpacity style={styles.poleDetailsButton}>
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.blanchisserie.orders}
                </Text>
                <Text style={styles.poleStatLabel}>Commandes</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.blanchisserie.processing}
                </Text>
                <Text style={styles.poleStatLabel}>En traitement</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.blanchisserie.delivery}
                </Text>
                <Text style={styles.poleStatLabel}>En livraison</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.blanchisserie.revenue.toLocaleString()}€
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
              <TouchableOpacity style={styles.poleDetailsButton}>
                <Text style={styles.poleDetailsText}>Détails →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.poleStats}>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.maintenance.tickets}
                </Text>
                <Text style={styles.poleStatLabel}>Tickets totaux</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={[styles.poleStatValue, { color: "#FF3B30" }]}>
                  {mockStats.maintenance.urgent}
                </Text>
                <Text style={styles.poleStatLabel}>Urgents</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.maintenance.inProgress}
                </Text>
                <Text style={styles.poleStatLabel}>En cours</Text>
              </View>
              <View style={styles.poleStat}>
                <Text style={styles.poleStatValue}>
                  {mockStats.maintenance.agents}
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
            {mockActivities.map((activity) => (
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
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionTitle}>Nouveau ticket</Text>
              <Text style={styles.quickActionSubtitle}>Maintenance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>🧹</Text>
              <Text style={styles.quickActionTitle}>Planifier nettoyage</Text>
              <Text style={styles.quickActionSubtitle}>Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>🏠</Text>
              <Text style={styles.quickActionTitle}>Ajouter bien</Text>
              <Text style={styles.quickActionSubtitle}>Conciergerie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
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
