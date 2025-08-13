import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Reservation, useConciergerie } from "~/context";

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

export default function InformationsGenerales() {
  const {
    selectedProperty,
    setSelectedProperty,
    properties,
    setShowCreatePropertyModal,
  } = useConciergerie();
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

  return (
    <View>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TouchableOpacity style={styles.dropdownTrigger}>
            <Text style={styles.dropdownTriggerText}>
              {selectedProperty
                ? selectedProperty.name
                : "Sélectionner un bien"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </DropdownMenuTrigger>
        <DropdownMenuContent style={styles.dropdownContent}>
          {properties && properties.length > 0 ? (
            properties.map((property) => (
              <DropdownMenuItem
                key={property.id}
                onPress={() => setSelectedProperty(property)}
                style={styles.dropdownContentItem}
              >
                <Text style={styles.dropdownItemText}>{property.name}</Text>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(property.status) },
                  ]}
                />
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem style={styles.dropdownContentItem}>
              <Text style={styles.dropdownItemText}>Aucun bien trouvé</Text>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                console.log("onAddProperty");
                setShowCreatePropertyModal(true);
              }}
            >
              <Text style={styles.dropdownTriggerText}>➕ Ajouter un bien</Text>
              <Text style={styles.dropdownArrow}>+</Text>
            </TouchableOpacity>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedProperty ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Section avec images */}
          <View style={styles.heroSection}>
            <View style={styles.propertyImageContainer}>
              <View style={styles.propertyImagePlaceholder}>
                <Text style={styles.imageIcon}>📸</Text>
                <Text style={styles.imageText}>Photo principale</Text>
              </View>
              <View style={styles.imageGallery}>
                <View style={styles.smallImagePlaceholder}>
                  <Text style={styles.smallImageIcon}>🏠</Text>
                </View>
                <View style={styles.smallImagePlaceholder}>
                  <Text style={styles.smallImageIcon}>🛏️</Text>
                </View>
                <View style={styles.smallImagePlaceholder}>
                  <Text style={styles.smallImageIcon}>🚿</Text>
                </View>
                <View style={styles.smallImagePlaceholder}>
                  <Text style={styles.smallImageIcon}>🍽️</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Titre et évaluation */}
          <View style={styles.propertyTitleSection}>
            <View style={styles.propertyTitleHeader}>
              <Text style={styles.propertyTitle}>{selectedProperty.name}</Text>
              <StatusBadge status={selectedProperty.status} />
            </View>
            <View style={styles.ratingSection}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingNumber}>
                  {selectedProperty.averageRating?.toFixed(1) || "N/A"}
                </Text>
                <View style={styles.stars}>
                  <Text style={styles.starIcon}>
                    {selectedProperty.averageRating
                      ? "⭐".repeat(Math.round(selectedProperty.averageRating))
                      : "⭐⭐⭐⭐⭐"}
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewCount}>
                • {selectedProperty.totalReviews || 0} avis
              </Text>
              <Text style={styles.propertyLocation}>
                📍{" "}
                {selectedProperty.address ||
                  selectedProperty.city ||
                  "Adresse non renseignée"}
                , {selectedProperty.country}
              </Text>
            </View>
          </View>

          {/* Hébergé par */}
          <View style={styles.hostSection}>
            <View style={styles.hostInfo}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>H</Text>
              </View>
              <View style={styles.hostDetails}>
                <Text style={styles.hostTitle}>
                  Hébergé par {selectedProperty.owner?.company || "N/A"}
                </Text>
                <Text style={styles.hostSubtitle}>
                  Superhôte • {selectedProperty.owner?.createdAt || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.hostBadges}>
              <View style={styles.superHostBadge}>
                <Text style={styles.superHostText}>Superhôte</Text>
              </View>
            </View>
          </View>

          {/* Équipements et caractéristiques */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Ce que propose ce logement</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚪</Text>
                <Text style={styles.featureText}>
                  {selectedProperty.numberOfRooms || "N/A"} chambres
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚿</Text>
                <Text style={styles.featureText}>
                  {selectedProperty.numberOfBathrooms || "N/A"} salles de bain
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📐</Text>
                <Text style={styles.featureText}>
                  {selectedProperty.surface || "N/A"} m²
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>👥</Text>
                <Text style={styles.featureText}>
                  {selectedProperty.maxGuests || "N/A"} voyageurs
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📶</Text>
                <Text style={styles.featureText}>Wifi gratuit</Text>
              </View>
              {selectedProperty.hasParking && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🅿️</Text>
                  <Text style={styles.featureText}>Parking</Text>
                </View>
              )}
              {selectedProperty.hasBalcony && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🏠</Text>
                  <Text style={styles.featureText}>Balcon</Text>
                </View>
              )}
              {selectedProperty.hasElevator && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🛗</Text>
                  <Text style={styles.featureText}>Ascenseur</Text>
                </View>
              )}
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🍳</Text>
                <Text style={styles.featureText}>Cuisine équipée</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {selectedProperty.description || "Description non renseignée"}
            </Text>
            <TouchableOpacity style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>Afficher plus</Text>
            </TouchableOpacity>
          </View>

          {/* Politiques Booking/Airbnb */}
          <View style={styles.policiesSection}>
            <Text style={styles.sectionTitle}>
              Politiques de l'établissement
            </Text>
            <View style={styles.policyItem}>
              <Text style={styles.policyIcon}>🕒</Text>
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>
                  Arrivée : À partir de {selectedProperty.checkInTime || "N/A"}
                </Text>
                <Text style={styles.policySubtitle}>
                  {selectedProperty.accessInstructions ||
                    "Arrivée libre avec la boîte à clés"}
                </Text>
              </View>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyIcon}>🚪</Text>
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>
                  Départ avant {selectedProperty.checkOutTime || "N/A"}
                </Text>
                <Text style={styles.policySubtitle}>Départ libre</Text>
              </View>
            </View>
            {selectedProperty.houseRules ? (
              <View style={styles.policyItem}>
                <Text style={styles.policyIcon}>📋</Text>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>Règles de la maison</Text>
                  <Text style={styles.policySubtitle}>
                    {selectedProperty.houseRules}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.policyItem}>
                  <Text style={styles.policyIcon}>🚭</Text>
                  <View style={styles.policyContent}>
                    <Text style={styles.policyTitle}>
                      Interdiction de fumer
                    </Text>
                    <Text style={styles.policySubtitle}>
                      Dans tout le logement
                    </Text>
                  </View>
                </View>
                <View style={styles.policyItem}>
                  <Text style={styles.policyIcon}>🐕</Text>
                  <View style={styles.policyContent}>
                    <Text style={styles.policyTitle}>Animaux autorisés</Text>
                    <Text style={styles.policySubtitle}>
                      Frais supplémentaires possibles
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Statistiques de réservation */}
          <View style={styles.bookingStatsSection}>
            <Text style={styles.sectionTitle}>Statistiques de réservation</Text>
            <View style={styles.bookingStatsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {selectedProperty.reservations
                    ? Math.round(
                        (selectedProperty.reservations.filter(
                          (r: Reservation) =>
                            r.status === "confirmed" ||
                            r.status === "checked_in"
                        ).length /
                          Math.max(selectedProperty.reservations.length, 1)) *
                          100
                      )
                    : "N/A"}
                  {selectedProperty.reservations && "%"}
                </Text>
                <Text style={styles.statLabel}>Taux d'occupation</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {selectedProperty.pricePerNight
                    ? `€${selectedProperty.pricePerNight}`
                    : "N/A"}
                </Text>
                <Text style={styles.statLabel}>Prix/nuit</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {selectedProperty.reservations?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Réservations total</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {selectedProperty.averageRating?.toFixed(1) || "N/A"}
                </Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  dropdownArrow: {
    fontSize: 14,
    color: "#8E8E93",
  },
  dropdownContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
    minWidth: 200,
  },
  dropdownContentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  heroSection: {
    marginBottom: 24,
  },
  propertyImageContainer: {
    flexDirection: "row",
    gap: 12,
  },
  propertyImagePlaceholder: {
    flex: 2,
    height: 200,
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  imageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  imageGallery: {
    flex: 1,
    gap: 12,
  },
  smallImagePlaceholder: {
    height: 44,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  smallImageIcon: {
    fontSize: 16,
  },
  propertyTitleSection: {
    marginBottom: 24,
  },
  propertyTitleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 4,
  },
  stars: {
    flexDirection: "row",
  },
  starIcon: {
    fontSize: 12,
  },
  reviewCount: {
    fontSize: 14,
    color: "#8E8E93",
    marginRight: 12,
  },
  propertyLocation: {
    fontSize: 14,
    color: "#8E8E93",
  },
  hostSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  hostAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  hostDetails: {
    flex: 1,
  },
  hostTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  hostSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  hostBadges: {
    flexDirection: "row",
  },
  superHostBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  superHostText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  featuresSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: "45%",
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#1C1C1E",
    flex: 1,
  },
  descriptionSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 16,
    color: "#3A3A3C",
    lineHeight: 24,
    marginBottom: 16,
  },
  showMoreButton: {
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  policiesSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  policyIcon: {
    fontSize: 20,
    marginRight: 16,
    marginTop: 2,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  policySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  bookingStatsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    fontWeight: "500",
  },
  noPropertyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noPropertyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  noPropertySubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontWeight: "500",
  },
});
