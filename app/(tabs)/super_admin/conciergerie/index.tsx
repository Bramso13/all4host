import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConciergerie } from "~/context";
import { useProperties } from "~/context/PropertyContext";
import { useAgents } from "~/context/AgentContext";
import InformationsGenerales from "~/components/pages/conciergerie/pages/InformationsGenerales";
import GestionPersonnel from "~/components/pages/conciergerie/pages/GestionPersonnel";
import ServicesConciergerie from "~/components/pages/conciergerie/pages/ServicesConciergerie";

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
    ]}
  >
    <Text
      style={[styles.iconText, { color: isActive ? "#FFFFFF" : "#007AFF" }]}
    >
      {name}
    </Text>
  </View>
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
    properties,
    selectedProperty,
    setSelectedProperty,
    reservations,
    propertyOwners,
    isLoading,
    error,
    fetchProperties,
    fetchReservations,
    fetchPropertyOwners,
    createProperty,
    updateProperty,
    deleteProperty,
  } = useConciergerie();

  const {
    agents,
    getAgentsStats,
    selectedAgent,
    setSelectedAgent,

    isLoading: agentsLoading,
    error: agentsError,
  } = useAgents();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showAgentDetailsModal, setShowAgentDetailsModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    propertyId: "",
    startDate: "",
    endDate: "",
    client: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // Calcul des statistiques à partir des données du contexte
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const pages = [
    {
      title: "Informations Générales",
      content:
        "Vue d'ensemble de votre conciergerie. Statistiques, performances et indicateurs clés de votre service.",
      color: "#F8F9FA",
      icon: "📊",
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

  const getStatusColor = (status: string) => {
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

  // Remplacer deleteReservation et createReservation par des fonctions locales :
  const handleCreateReservation = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (response.ok) {
        await fetchProperties();
        setShowCreateModal(false);
        setCreateForm({
          propertyId: "",
          startDate: "",
          endDate: "",
          client: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/reservations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        await fetchProperties();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la réservation:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <InformationsGenerales />
          </Page>

          {/* Page Gestion Personnel */}
          <Page
            title={pages[1].title}
            content={pages[1].content}
            color={pages[1].color}
          >
            <GestionPersonnel
              agents={agents}
              getAgentsStats={getAgentsStats}
              setSelectedAgent={setSelectedAgent}
              setShowCreateAgentModal={setShowCreateAgentModal}
              setShowAgentDetailsModal={setShowAgentDetailsModal}
            />
          </Page>

          {/* Page Services Conciergerie */}
          <Page
            title={pages[2].title}
            content={pages[2].content}
            color={pages[2].color}
          >
            <ServicesConciergerie />
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
    backgroundColor: "transparent",
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
});
