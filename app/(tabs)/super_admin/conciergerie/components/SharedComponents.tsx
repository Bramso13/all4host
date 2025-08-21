import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// Composant pour les icônes
export const Icon = ({
  name,
  isActive,
}: {
  name: string;
  isActive: boolean;
}) => (
  <View
    style={[
      styles.iconContainer,
      {
        backgroundColor: isActive ? "#FFFFFF" : "transparent",
        shadowColor: isActive ? "#000000" : "transparent",
        shadowOffset: isActive
          ? {
              width: 0,
              height: 4,
            }
          : undefined,
        shadowOpacity: isActive ? 0.1 : 0,
        shadowRadius: isActive ? 8 : 0,
        elevation: isActive ? 4 : 0,
      },
    ]}
  >
    <Text
      style={[styles.iconText, { color: isActive ? "#FFFFFF" : "#007AFF" }]}
    >
      {name}
    </Text>
  </View>
);

// Composant pour les statistiques
export const StatCard = ({
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

// Composant pour les informations de propriété
export const PropertyInfoCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) => (
  <View style={styles.infoCard}>
    <View style={styles.infoHeader}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoTitle}>{title}</Text>
    </View>
    <Text style={styles.infoValue}>{value || "Non renseigné"}</Text>
  </View>
);

// Composant pour le statut
export const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return { color: "#4CAF50", text: "Disponible", bg: "#E8F5E8" };
      case "occupied":
        return { color: "#FF9800", text: "Occupé", bg: "#FFF3E0" };
      case "maintenance":
        return { color: "#F44336", text: "Maintenance", bg: "#FFEBEE" };
      case "reserved":
        return { color: "#2196F3", text: "Réservé", bg: "#E3F2FD" };
      default:
        return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

// Composant pour le type d'agent
export const AgentTypeBadge = ({ type }: { type: string }) => {
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

// Composant pour une carte d'agent
export const AgentCard = ({
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
          {agent.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.agentInfo}>
        <Text style={styles.agentName}>{agent.name}</Text>
        <Text style={styles.agentDescription} numberOfLines={2}>
          {agent.description}
        </Text>
      </View>
      <AgentTypeBadge type={agent.type} />
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

// Composant pour chaque page
export const Page = ({
  title,
  content,
  color,
  children,
}: {
  title: string;
  content: string;
  color: string;
  children?: React.ReactNode;
}) => (
  <View style={[styles.page, { backgroundColor: color }]}>
    <View style={styles.pageContent}>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageText}>{content}</Text>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
    fontWeight: "600",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  infoValue: {
    fontSize: 16,
    color: "#1C1C1E",
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 10,
    fontWeight: "600",
  },
  agentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  agentAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  agentInfo: {
    flex: 1,
    marginRight: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 18,
  },
  agentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentDate: {
    fontSize: 12,
    color: "#8E8E93",
  },
  agentStats: {
    flexDirection: "row",
    gap: 12,
  },
  agentStat: {
    fontSize: 12,
    color: "#8E8E93",
  },
  page: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 12,
  },
  pageText: {
    fontSize: 14,
    color: "#3A3A3C",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
});
