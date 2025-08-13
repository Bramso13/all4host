import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// Composant pour les statistiques
const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// Composant pour le type d'agent
const AgentTypeBadge = ({ type }: { type: string }) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "cleaning":
        return {
          color: "#2196F3",
          text: "Nettoyage",
          bg: "#E3F2FD",
          icon: "🧹",
        };
      case "laundry":
        return {
          color: "#9C27B0",
          text: "Blanchisserie",
          bg: "#F3E5F5",
          icon: "👕",
        };
      case "maintenance":
        return {
          color: "#FF9800",
          text: "Maintenance",
          bg: "#FFF3E0",
          icon: "🔧",
        };
      case "concierge":
        return {
          color: "#4CAF50",
          text: "Conciergerie",
          bg: "#E8F5E8",
          icon: "🏨",
        };
      case "multi_service":
        return {
          color: "#673AB7",
          text: "Multi-service",
          bg: "#EDE7F6",
          icon: "⚡",
        };
      default:
        return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5", icon: "❓" };
    }
  };

  const config = getTypeConfig(type);

  return (
    <View style={[styles.agentTypeBadge, { backgroundColor: config.bg }]}>
      <Text style={styles.agentTypeIcon}>{config.icon}</Text>
      <Text style={[styles.agentTypeText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

// Composant pour le type de manager
const ManagerTypeBadge = ({ type }: { type: string }) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "conciergerie":
        return {
          color: "#4CAF50",
          text: "Conciergerie",
          bg: "#E8F5E8",
          icon: "🏨",
        };
      case "cleaning":
        return {
          color: "#2196F3",
          text: "Nettoyage",
          bg: "#E3F2FD",
          icon: "🧹",
        };
      case "maintenance":
        return {
          color: "#FF9800",
          text: "Maintenance",
          bg: "#FFF3E0",
          icon: "🔧",
        };
      case "laundry":
        return {
          color: "#9C27B0",
          text: "Blanchisserie",
          bg: "#F3E5F5",
          icon: "👕",
        };
      default:
        return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5", icon: "❓" };
    }
  };

  const config = getTypeConfig(type);

  return (
    <View style={[styles.managerTypeBadge, { backgroundColor: config.bg }]}>
      <Text style={styles.managerTypeIcon}>{config.icon}</Text>
      <Text style={[styles.managerTypeText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

// Composant pour une carte de manager
const ManagerCard = ({
  manager,
  onPress,
}: {
  manager: any;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.managerCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.managerHeader}>
      <View style={styles.managerAvatar}>
        <Text style={styles.managerAvatarText}>
          {(manager.user?.name || "M").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.managerInfo}>
        <Text style={styles.managerName}>
          {manager.user?.name || "Manager"}
        </Text>
        <Text style={styles.managerDescription} numberOfLines={2}>
          Manager {manager.poleType}
        </Text>
      </View>
      <ManagerTypeBadge type={manager.poleType} />
    </View>
    <View style={styles.managerFooter}>
      <Text style={styles.managerDate}>
        Créé le {new Date(manager.createdAt).toLocaleDateString("fr-FR")}
      </Text>
      <View style={styles.managerStats}>
        <Text style={styles.managerStat}>
          {manager.managedAgents?.length || 0} agents
        </Text>
        <Text style={styles.managerStat}>
          {manager.properties?.length || 0} propriétés
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Composant pour une carte d'agent
const AgentCard = ({
  agent,
  onPress,
}: {
  agent: any;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.agentCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.agentHeader}>
      <View style={styles.agentAvatar}>
        <Text style={styles.agentAvatarText}>
          {(agent.user?.name || "A").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.agentInfo}>
        <Text style={styles.agentName}>{agent.user?.name || "Agent"}</Text>
        <Text style={styles.agentDescription} numberOfLines={2}>
          Agent {agent.agentType} - {agent.availability}
        </Text>
      </View>
      <AgentTypeBadge type={agent.agentType} />
    </View>
    <View style={styles.agentFooter}>
      <Text style={styles.agentDate}>
        Créé le {new Date(agent.createdAt).toLocaleDateString("fr-FR")}
      </Text>
      <View style={styles.agentStats}>
        <Text style={styles.agentStat}>
          {agent.cleaningSessions?.length || 0} sessions
        </Text>
        <Text style={styles.agentStat}>
          {agent.tickets?.length || 0} tickets
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function GestionPersonnel({
  agents,
  managers,
  getAgentsStats,
  getManagersStats,
  setSelectedAgent,
  setSelectedManager,
  setShowCreateAgentModal,
  setShowCreateManagerModal,
  setShowAgentDetailsModal,
  setShowManagerDetailsModal,
}: {
  agents: any[];
  managers?: any[];
  getAgentsStats: () => any;
  getManagersStats?: () => any;
  setSelectedAgent: (agent: any) => void;
  setSelectedManager?: (manager: any) => void;
  setShowCreateAgentModal: (show: boolean) => void;
  setShowCreateManagerModal?: (show: boolean) => void;
  setShowAgentDetailsModal: (show: boolean) => void;
  setShowManagerDetailsModal?: (show: boolean) => void;
}) {
  return (
    <View style={styles.personnelContainer}>
      {/* En-tête avec statistiques */}
      <View style={styles.personnelHeader}>
        <Text style={styles.sectionTitle}>Équipe de Conciergerie</Text>
        <View style={styles.personnelStats}>
          {(() => {
            const stats = getAgentsStats();
            return (
              <>
                <StatCard
                  title="Total"
                  value={stats.total}
                  icon="👥"
                  color="#007AFF"
                />
                <StatCard
                  title="Nettoyage"
                  value={stats.byType.cleaning}
                  icon="🧹"
                  color="#2196F3"
                />
                <StatCard
                  title="Maintenance"
                  value={stats.byType.maintenance}
                  icon="🔧"
                  color="#FF9800"
                />
              </>
            );
          })()}
        </View>
      </View>

      {/* Liste des managers */}
      {
        <View style={styles.managersSection}>
          <View style={styles.managersHeader}>
            <Text style={styles.sectionTitle}>Managers</Text>
            <TouchableOpacity
              style={styles.addManagerButton}
              onPress={() => {}}
            >
              <Text style={styles.addManagerButtonText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.managersList}>
            {managers && managers.length > 0 ? (
              managers.map((manager) => (
                <ManagerCard
                  key={manager.id}
                  manager={manager}
                  onPress={() => {}}
                />
              ))
            ) : (
              <View style={styles.noManagersContainer}>
                <Text style={styles.noManagersText}>Aucun manager trouvé</Text>
                <Text style={styles.noManagersSubtext}>
                  Créez votre premier manager pour commencer
                </Text>
              </View>
            )}
          </View>
        </View>
      }

      {/* Liste des agents */}
      <View style={styles.agentsSection}>
        <View style={styles.agentsHeader}>
          <Text style={styles.sectionTitle}>Agents</Text>
          <TouchableOpacity
            style={styles.addAgentButton}
            onPress={() => setShowCreateAgentModal(true)}
          >
            <Text style={styles.addAgentButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des vrais agents */}
        <View style={styles.agentsList}>
          {agents && agents.length > 0 ? (
            agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onPress={() => {
                  setSelectedAgent(agent);
                  setShowAgentDetailsModal(true);
                }}
              />
            ))
          ) : (
            <View style={styles.noAgentsContainer}>
              <Text style={styles.noAgentsText}>Aucun agent trouvé</Text>
              <Text style={styles.noAgentsSubtext}>
                Créez votre premier agent pour commencer
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  personnelContainer: {
    flex: 1,
  },
  personnelHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  personnelStats: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  agentsSection: {
    flex: 1,
  },
  agentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addAgentButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addAgentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  agentsList: {
    gap: 16,
  },
  agentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  agentAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  agentInfo: {
    flex: 1,
    marginRight: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  agentTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  agentTypeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  agentTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  agentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentDate: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  agentStats: {
    flexDirection: "row",
    gap: 16,
  },
  agentStat: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  noAgentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noAgentsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  noAgentsSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
  // Styles pour les managers
  managersSection: {
    marginBottom: 24,
  },
  managersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addManagerButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addManagerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  managersList: {
    gap: 16,
  },
  managerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  managerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  managerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  managerAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  managerInfo: {
    flex: 1,
    marginRight: 12,
  },
  managerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  managerDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  managerTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  managerTypeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  managerTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  managerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  managerDate: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  managerStats: {
    flexDirection: "row",
    gap: 16,
  },
  managerStat: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  noManagersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noManagersText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  noManagersSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
});
