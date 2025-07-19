import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProperties } from "~/context/PropertyContext";

const { width: screenWidth } = Dimensions.get("window");

// Composant pour les icônes (remplacez par vos vraies icônes)
const Icon = ({ name, isActive }: { name: string; isActive: boolean }) => (
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
      // { backgroundColor: isActive ? "#007AFF" : "rgba(255, 255, 255, 0.9)" },
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

// Composant pour les informations de propriété
const PropertyInfoCard = ({
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
const StatusBadge = ({ status }: { status: string }) => {
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
const Page = ({
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
    <ScrollView
      style={styles.pageScrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageContent}>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageText}>{content}</Text>
        {children}
      </View>
    </ScrollView>
  </View>
);

export default function ConciergerieScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const {
    conciergerieManager,
    isLoading,
    setShowCreateManagerModal,
    properties,
    getPropertiesStats,
    selectedProperty,
  } = useProperties();

  // Récupérer la propriété sélectionnée (pour l'instant, on prend la première)

  const stats = getPropertiesStats();

  const pages = [
    {
      title: "Informations Générales",
      content:
        "Vue d'ensemble de votre conciergerie. Statistiques, performances et indicateurs clés de votre service.",
      color: "#F8F9FA",
      icon: "📊",
    },
    {
      title: "Gestion Maintenance",
      content:
        "Suivi des interventions, planning des maintenances préventives et gestion des réparations urgentes.",
      color: "#E3F2FD",
      icon: "🔧",
    },
    {
      title: "Gestion Personnel",
      content:
        "Gestion des équipes, planning des agents, formation et suivi des performances du personnel.",
      color: "#F3E5F5",
      icon: "👥",
    },
    {
      title: "Services Conciergerie",
      content:
        "Gestion complète de vos besoins de conciergerie. Réservations, demandes spéciales et suivi personnalisé.",
      color: "#FFF3E0",
      icon: "🏨",
    },
  ];

  const handlePageChange = (pageIndex: number) => {
    // Animation de fade
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentPage(pageIndex);
    scrollViewRef.current?.scrollTo({
      x: pageIndex * screenWidth,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffset / screenWidth);
    if (pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
    }
  };

  // Si pas de manager de conciergerie, afficher un message
  if (!conciergerieManager && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noManagerContainer}>
          <Text style={styles.noManagerTitle}>
            Aucun manager de conciergerie
          </Text>
          <Text style={styles.noManagerText}>
            Vous devez créer un manager de conciergerie pour commencer à gérer
            vos propriétés.
          </Text>
          <TouchableOpacity
            style={styles.createManagerButton}
            onPress={() => setShowCreateManagerModal(true)}
          >
            <Text style={styles.createManagerButtonText}>Créer un manager</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {/* Page Informations Générales */}
          <Page
            title={pages[0].title}
            content={pages[0].content}
            color={pages[0].color}
          >
            {selectedProperty ? (
              <View style={styles.generalInfoContainer}>
                {/* En-tête de la propriété */}
                <View style={styles.propertyHeader}>
                  <Text style={styles.propertyName}>
                    {selectedProperty.name}
                  </Text>
                  <StatusBadge status={selectedProperty.status} />
                </View>

                {/* Informations de la propriété */}
                <View style={styles.propertySection}>
                  <Text style={styles.sectionTitle}>
                    Détails de la Propriété
                  </Text>
                  <View style={styles.propertyInfoGrid}>
                    <PropertyInfoCard
                      title="Description"
                      value={selectedProperty.description}
                      icon="📝"
                    />
                    <PropertyInfoCard
                      title="Localisation"
                      value={selectedProperty.location || ""}
                      icon="📍"
                    />
                    <PropertyInfoCard
                      title="Surface"
                      value={
                        selectedProperty.surface
                          ? `${selectedProperty.surface} m²`
                          : ""
                      }
                      icon="📐"
                    />
                    <PropertyInfoCard
                      title="Pièces"
                      value={selectedProperty.numberOfRooms || ""}
                      icon="🚪"
                    />
                    <PropertyInfoCard
                      title="Salles de bain"
                      value={selectedProperty.numberOfBathrooms || ""}
                      icon="🚿"
                    />
                    <PropertyInfoCard
                      title="Créé le"
                      value={new Date(
                        selectedProperty.createdAt
                      ).toLocaleDateString("fr-FR")}
                      icon="📅"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noPropertyContainer}>
                <Text style={styles.noPropertyText}>
                  Aucune propriété sélectionnée
                </Text>
                <Text style={styles.noPropertySubtext}>
                  Sélectionnez une propriété pour voir ses informations
                </Text>
              </View>
            )}
          </Page>

          {/* Page Gestion Maintenance */}
          <Page
            title={pages[1].title}
            content={pages[1].content}
            color={pages[1].color}
          >
            <View style={styles.maintenanceContainer}>
              <Text style={styles.comingSoonText}>🚧</Text>
              <Text style={styles.comingSoonTitle}>
                Fonctionnalité en cours
              </Text>
              <Text style={styles.comingSoonSubtext}>
                La gestion de maintenance sera bientôt disponible
              </Text>
            </View>
          </Page>

          {/* Page Gestion Personnel */}
          <Page
            title={pages[2].title}
            content={pages[2].content}
            color={pages[2].color}
          >
            <View style={styles.personnelContainer}>
              {/* En-tête avec statistiques */}
              <View style={styles.personnelHeader}>
                <Text style={styles.sectionTitle}>Équipe de Conciergerie</Text>
                <View style={styles.personnelStats}>
                  <StatCard title="Total" value={3} icon="👥" color="#007AFF" />
                  <StatCard
                    title="Nettoyage"
                    value={2}
                    icon="🧹"
                    color="#2196F3"
                  />
                  <StatCard
                    title="Maintenance"
                    value={1}
                    icon="🔧"
                    color="#FF9800"
                  />
                </View>
              </View>

              {/* Liste des agents */}
              <View style={styles.agentsSection}>
                <View style={styles.agentsHeader}>
                  <Text style={styles.sectionTitle}>Agents</Text>
                  <TouchableOpacity style={styles.addAgentButton}>
                    <Text style={styles.addAgentButtonText}>+ Ajouter</Text>
                  </TouchableOpacity>
                </View>

                {/* Agents fictifs pour la démo */}
                <View style={styles.agentsList}>
                  <AgentCard
                    agent={{
                      id: "1",
                      name: "Marie Dubois",
                      description:
                        "Agent de nettoyage expérimentée, spécialisée dans les espaces résidentiels de luxe",
                      type: "cleaning",
                      createdAt: "2024-01-15T10:00:00Z",
                      cleaningSessions: [1, 2, 3, 4, 5],
                      tickets: [1, 2],
                    }}
                  />
                  <AgentCard
                    agent={{
                      id: "2",
                      name: "Jean Martin",
                      description:
                        "Technicien de maintenance polyvalent, expert en systèmes électriques et plomberie",
                      type: "maintenance",
                      createdAt: "2024-02-01T14:30:00Z",
                      cleaningSessions: [],
                      tickets: [3, 4, 5],
                    }}
                  />
                  <AgentCard
                    agent={{
                      id: "3",
                      name: "Sophie Leroy",
                      description:
                        "Agent de nettoyage dédiée aux espaces communs et aux services de conciergerie",
                      type: "cleaning",
                      createdAt: "2024-01-20T09:15:00Z",
                      cleaningSessions: [6, 7, 8],
                      tickets: [6],
                    }}
                  />
                </View>
              </View>
            </View>
          </Page>

          {/* Page Services Conciergerie */}
          <Page
            title={pages[3].title}
            content={pages[3].content}
            color={pages[3].color}
          >
            <View style={styles.servicesContainer}>
              <Text style={styles.comingSoonText}>🏨</Text>
              <Text style={styles.comingSoonTitle}>Services Conciergerie</Text>
              <Text style={styles.comingSoonSubtext}>
                La gestion des services sera bientôt disponible
              </Text>
            </View>
          </Page>
        </ScrollView>

        {/* Boutons de navigation en superposition */}
        <View style={styles.navigationContainer}>
          <View style={styles.navigationButtons}>
            {pages.map((page, index) => (
              <TouchableOpacity
                key={index}
                style={styles.navButton}
                onPress={() => handlePageChange(index)}
                activeOpacity={0.7}
              >
                <Icon name={page.icon} isActive={currentPage === index} />
                {/* <Text
                  style={[
                    styles.navButtonText,
                    { color: currentPage === index ? "#007AFF" : "#8E8E93" },
                  ]}
                >
                  {page.title.split(" ")[0]}
                </Text> */}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Indicateurs de page */}
        <View style={styles.indicators}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    currentPage === index ? "#007AFF" : "#D1D1D6",
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: screenWidth,
    flex: 1,
    paddingTop: 60,
  },
  pageScrollView: {
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
    marginBottom: 24,
  },
  navigationContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  navigationButtons: {
    flexDirection: "row",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", //white,
    // borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  navButton: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    padding: 0,
    margin: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconText: {
    fontSize: 16,
    fontWeight: "600",
  },
  navButtonText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  indicators: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  // Styles pour l'écran sans manager
  noManagerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#F8F9FA",
  },
  noManagerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 16,
  },
  noManagerText: {
    fontSize: 16,
    color: "#3A3A3C",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  createManagerButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  createManagerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Styles pour les informations générales
  generalInfoContainer: {
    marginTop: 20,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  propertySection: {
    marginBottom: 24,
  },
  propertyInfoGrid: {
    gap: 12,
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
    shadowRadius: 6,
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
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
    lineHeight: 22,
  },
  noPropertyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noPropertyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 8,
  },
  noPropertySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  // Styles pour les agents
  agentTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  agentInfo: {
    flex: 1,
    marginRight: 8,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "700",
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
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
    color: "#007AFF",
    fontWeight: "600",
  },
  // Styles pour la gestion du personnel
  personnelContainer: {
    marginTop: 20,
  },
  personnelHeader: {
    marginBottom: 24,
  },
  personnelStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  agentsSection: {
    marginBottom: 24,
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
    paddingVertical: 8,
    borderRadius: 20,
  },
  addAgentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  agentsList: {
    gap: 12,
  },
  // Styles pour les pages en cours
  maintenanceContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  servicesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  comingSoonText: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
});
