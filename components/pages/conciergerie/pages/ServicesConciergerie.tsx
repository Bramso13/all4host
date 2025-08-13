import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { useConciergerie } from "~/context";

export default function ServicesConciergerie() {
  const { stats, reservations, properties, setShowCreateReservationModal } =
    useConciergerie();
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Dashboard statistiques */}
      <View style={styles.conciergeStatsSection}>
        <Text style={styles.sectionTitle}>Tableau de bord Conciergerie</Text>
        <View style={styles.statsRowsContainer}>
          <View style={styles.statsRow}>
            <View
              style={[styles.statCardSmall, { borderLeftColor: "#4CAF50" }]}
            >
              <Text style={styles.statCardTitle}>Réservations actives</Text>
              <Text style={styles.statCardNumber}>
                {stats.activeReservations}
              </Text>
              <Text style={styles.statCardSubtext}>Réservations en cours</Text>
            </View>
            <View
              style={[styles.statCardSmall, { borderLeftColor: "#FF9800" }]}
            >
              <Text style={styles.statCardTitle}>Check-in aujourd'hui</Text>
              <Text style={styles.statCardNumber}>{stats.checkInsToday}</Text>
              <Text style={styles.statCardSubtext}>À partir de 15h</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View
              style={[styles.statCardSmall, { borderLeftColor: "#2196F3" }]}
            >
              <Text style={styles.statCardTitle}>Check-out aujourd'hui</Text>
              <Text style={styles.statCardNumber}>{stats.checkOutsToday}</Text>
              <Text style={styles.statCardSubtext}>Avant 11h</Text>
            </View>
            <View
              style={[styles.statCardSmall, { borderLeftColor: "#9C27B0" }]}
            >
              <Text style={styles.statCardTitle}>Revenus du mois</Text>
              <Text style={styles.statCardNumber}>
                €{(stats.monthlyRevenue / 1000).toFixed(1)}k
              </Text>
              <Text style={styles.statCardSubtext}>Revenus de ce mois</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filtres et recherche */}
      <View style={styles.filtersSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une réservation..."
            placeholderTextColor="#8E8E93"
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonActive]}
          >
            <Text
              style={[styles.filterButtonText, styles.filterButtonTextActive]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Aujourd'hui</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Cette semaine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Check-out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des réservations moderne */}
      <View style={styles.reservationsSection}>
        <View style={styles.reservationsHeaderRow}>
          <Text style={styles.reservationsTitle}>Réservations</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateReservationModal(true)}
          >
            <Text style={styles.addButtonText}>+ Nouvelle réservation</Text>
          </TouchableOpacity>
        </View>

        {/* Données des réservations du contexte */}
        {reservations && reservations.length > 0 ? (
          reservations.map((reservation) => (
            <View key={reservation.id} style={styles.modernReservationCard}>
              <View style={styles.reservationCardHeader}>
                <View style={styles.reservationMainInfo}>
                  <Text style={styles.reservationGuestName}>
                    {reservation.guestName}
                  </Text>
                  <Text style={styles.reservationPropertyName}>
                    {reservation.property?.name || "Propriété inconnue"}
                  </Text>
                </View>
                <View style={styles.reservationStatusContainer}>
                  <View
                    style={[
                      styles.reservationStatusBadge,
                      {
                        backgroundColor:
                          reservation.status === "confirmed"
                            ? "#E3F2FD"
                            : reservation.status === "checked_in"
                            ? "#E8F5E8"
                            : "#FFF3E0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reservationStatusText,
                        {
                          color:
                            reservation.status === "confirmed"
                              ? "#2196F3"
                              : reservation.status === "checked_in"
                              ? "#4CAF50"
                              : "#FF9800",
                        },
                      ]}
                    >
                      {reservation.status === "confirmed"
                        ? "Confirmée"
                        : reservation.status === "checked_in"
                        ? "En cours"
                        : "Terminée"}
                    </Text>
                  </View>
                  <View style={styles.platformBadge}>
                    <Text style={styles.platformText}>
                      {reservation.bookingSource === "airbnb"
                        ? "🏠 Airbnb"
                        : reservation.bookingSource === "booking.com"
                        ? "🏨 Booking"
                        : reservation.bookingSource === "direct"
                        ? "📞 Direct"
                        : "🔗 " + (reservation.bookingSource || "Autre")}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reservationDetails}>
                <View style={styles.reservationDatesContainer}>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Check-in</Text>
                    <Text style={styles.dateValue}>
                      {new Date(reservation.checkIn).toLocaleDateString(
                        "fr-FR"
                      )}
                    </Text>
                  </View>
                  <View style={styles.dateArrow}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Check-out</Text>
                    <Text style={styles.dateValue}>
                      {new Date(reservation.checkOut).toLocaleDateString(
                        "fr-FR"
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.reservationMeta}>
                  <View style={styles.reservationMetaItem}>
                    <Text style={styles.metaIcon}>👥</Text>
                    <Text style={styles.metaText}>
                      {reservation.guestCount} invité
                      {reservation.guestCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.reservationMetaItem}>
                    <Text style={styles.metaIcon}>🌙</Text>
                    <Text style={styles.metaText}>
                      {reservation.nights} nuit
                      {reservation.nights > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.reservationMetaItem}>
                    <Text style={styles.metaIcon}>💰</Text>
                    <Text style={styles.metaText}>
                      €{reservation.totalPrice}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reservationActions}>
                <TouchableOpacity style={styles.reservationActionButton}>
                  <Text style={styles.actionButtonIcon}>📱</Text>
                  <Text style={styles.actionButtonText}>Contacter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reservationActionButton}>
                  <Text style={styles.actionButtonIcon}>📝</Text>
                  <Text style={styles.actionButtonText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reservationActionButton}>
                  <Text style={styles.actionButtonIcon}>🏠</Text>
                  <Text style={styles.actionButtonText}>
                    {reservation.status === "confirmed"
                      ? "Check-in"
                      : reservation.status === "checked_in"
                      ? "Check-out"
                      : "Détails"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noAgentsContainer}>
            <Text style={styles.noAgentsText}>Aucune réservation trouvée</Text>
            <Text style={styles.noAgentsSubtext}>
              Créez votre première réservation pour commencer
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conciergeStatsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  statsRowsContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statCardSmall: {
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
  statCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statCardSubtext: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  filtersSection: {
    marginBottom: 24,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    position: "absolute",
    right: 16,
    top: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  reservationsSection: {
    marginBottom: 24,
  },
  reservationsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reservationsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modernReservationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reservationCardHeader: {
    marginBottom: 16,
  },
  reservationMainInfo: {
    marginBottom: 12,
  },
  reservationGuestName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  reservationPropertyName: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  reservationStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reservationStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reservationStatusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  platformBadge: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  reservationDetails: {
    marginBottom: 16,
  },
  reservationDatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "600",
  },
  dateArrow: {
    paddingHorizontal: 16,
  },
  arrowIcon: {
    fontSize: 16,
    color: "#8E8E93",
  },
  reservationMeta: {
    flexDirection: "row",
    gap: 16,
  },
  reservationMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  reservationActions: {
    flexDirection: "row",
    gap: 12,
  },
  reservationActionButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  actionButtonIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#1C1C1E",
    fontWeight: "600",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
    marginTop: 16,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownItem: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dropdownItemSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  noReservationsText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    padding: 16,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1C1E",
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
