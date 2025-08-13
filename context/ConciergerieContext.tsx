import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import NoManagerScreen from "~/components/screen/conciergerie/NoManagerScreen";
import { authClient } from "~/lib/auth-client";

// Types EXACTS basés sur schema.prisma

// Enums du schema.prisma
export type PropertyStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "reserved"
  | "offline";
export type ReservationStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | "in_progress"
  | "checked_in"
  | "checked_out";
export type PoleType = "conciergerie" | "cleaning" | "maintenance" | "laundry";

// Property - Modèle EXACT du schema.prisma
export interface Property {
  id: string;
  name: string;
  description: string;
  status: PropertyStatus; // @default(available)

  // Localisation
  address: string;
  city: string;
  country: string; // @default("France")
  postalCode?: string;
  latitude?: number; // Float?
  longitude?: number; // Float?

  // Caractéristiques
  surface?: number; // Float?
  numberOfRooms?: number; // Int?
  numberOfBedrooms?: number; // Int?
  numberOfBathrooms?: number; // Int?
  maxGuests?: number; // Int?
  floor?: number; // Int?
  hasElevator?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;

  // Pricing
  pricePerNight?: number; // Float?
  cleaningFee?: number; // Float?
  serviceFee?: number; // Float?
  securityDeposit?: number; // Float?

  // Ratings
  averageRating?: number; // Float? @default(0)
  totalReviews: number; // Int @default(0)

  // Policies
  checkInTime?: string; // @default("15:00")
  checkOutTime?: string; // @default("11:00")
  cancellationPolicy?: string;
  houseRules?: string;

  // Instructions pour agents
  accessInstructions?: string;
  cleaningInstructions?: string;
  maintenanceNotes?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  ownerId: string;
  managerId?: string;

  // Relations étendues (optionnelles pour le contexte)
  owner?: PropertyOwnerProfile;
  manager?: PoleManagerProfile;
  features?: PropertyFeature[];
  photos?: PropertyPhoto[];
  reviews?: PropertyReview[];
  reservations?: Reservation[];
}

// PropertyFeature - Modèle EXACT du schema.prisma
export interface PropertyFeature {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  propertyId: string;
}

// PropertyPhoto - Modèle EXACT du schema.prisma
export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  isMain: boolean; // @default(false)
  order: number; // @default(0)
  type?: string;
  propertyId: string;
  createdAt: string;
}

// PropertyReview - Modèle EXACT du schema.prisma
export interface PropertyReview {
  id: string;
  rating: number; // Float
  comment?: string;
  guestName: string;
  guestEmail?: string;
  propertyId: string;
  createdAt: string;
}

// PropertyOwnerProfile - Modèle EXACT du schema.prisma
export interface PropertyOwnerProfile {
  id: string;
  userId: string;

  // Informations propriétaire
  company?: string;
  taxNumber?: string;

  // Adresse
  address?: string;
  city?: string;
  country?: string; // @default("France")
  postal?: string;

  // Préférences de communication
  preferredContactMethod?: string; // @default("email")
  receiveNotifications: boolean; // @default(true)

  createdAt: string;
  updatedAt: string;

  // Relations étendues pour l'affichage
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  properties?: Property[];
}

// PoleManagerProfile - Modèle EXACT du schema.prisma
export interface PoleManagerProfile {
  id: string;
  userId: string;
  poleType: PoleType;

  // Permissions spécifiques au pôle
  canViewAnalytics: boolean;
  canManageAgents: boolean;
  canManageClients: boolean;
  canManageBilling: boolean;

  createdAt: string;
  updatedAt: string;

  // Relations
  superAdminId: string;

  // Relations étendues pour l'affichage
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

// Reservation - Modèle EXACT du schema.prisma
export interface Reservation {
  id: string;

  // Relations principales
  propertyId: string;
  managerId: string;

  // Informations invité
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCount: number; // Int @default(1)

  // Dates
  checkIn: string; // DateTime
  checkOut: string; // DateTime
  nights: number; // Int

  // Tarification
  basePrice: number; // Float
  cleaningFee?: number; // Float?
  serviceFee?: number; // Float?
  taxes?: number; // Float?
  totalPrice: number; // Float

  // Statut
  status: ReservationStatus; // @default(pending)
  notes?: string;

  // Références
  confirmationCode?: string; // @unique
  bookingSource?: string; // "direct", "airbnb", "booking.com"

  // Check-in/out
  checkInTime?: string; // DateTime?
  checkOutTime?: string; // DateTime?

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  property?: Property;
  manager?: PoleManagerProfile;
}

// PropertyContract - Modèle EXACT du schema.prisma
export interface PropertyContract {
  id: string;
  contractNumber: string; // @unique
  type: string; // "property_management", "maintenance", "cleaning"
  status: string; // @default("active")

  startDate: string; // DateTime
  endDate?: string; // DateTime?

  // Relations
  propertyId: string;
  propertyOwnerId: string;

  // Termes financiers
  monthlyFee?: number; // Float?
  commissionRate?: number; // Float?

  // Documents
  documentUrl?: string;
  signedAt?: string; // DateTime?

  createdAt: string;
  updatedAt: string;

  // Relations étendues
  property?: Property;
  propertyOwner?: PropertyOwnerProfile;
}

// Mock data alignées avec le schema.prisma
const mockPropertyOwners: PropertyOwnerProfile[] = [
  {
    id: "1",
    userId: "user-owner-1",
    company: "Immobilier Premium SARL",
    taxNumber: "FR12345678901",
    address: "123 Boulevard de la République",
    city: "Paris",
    country: "France",
    postal: "75011",
    preferredContactMethod: "email",
    receiveNotifications: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    user: {
      name: "Marie Dubois",
      email: "marie.dubois@immopremium.fr",
      phone: "+33 1 23 45 67 89",
    },
  },
  {
    id: "2",
    userId: "user-owner-2",
    company: "SCI Les Jardins",
    taxNumber: "FR98765432109",
    address: "456 Avenue des Tulipes",
    city: "Lyon",
    country: "France",
    postal: "69003",
    preferredContactMethod: "phone",
    receiveNotifications: true,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-18T10:15:00Z",
    user: {
      name: "Jean Martin",
      email: "jean.martin@scilejardins.fr",
      phone: "+33 4 78 90 12 34",
    },
  },
  {
    id: "3",
    userId: "user-owner-3",
    company: undefined,
    taxNumber: undefined,
    address: "789 Rue de la Liberté",
    city: "Marseille",
    country: "France",
    postal: "13001",
    preferredContactMethod: "email",
    receiveNotifications: false,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-22T16:45:00Z",
    user: {
      name: "Sophie Laurent",
      email: "sophie.laurent@gmail.com",
      phone: "+33 4 91 23 45 67",
    },
  },
];

const mockPropertyManagers: PoleManagerProfile[] = [
  {
    id: "1",
    userId: "user-manager-1",
    poleType: "conciergerie",
    canViewAnalytics: true,
    canManageAgents: true,
    canManageClients: true,
    canManageBilling: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    superAdminId: "super-admin-1",
    user: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+33 6 12 34 56 78",
    },
  },
];

const mockProperties: Property[] = [
  {
    id: "1",
    name: "Appartement Centre-Ville",
    description: "T3 moderne avec balcon dans le centre historique",
    status: "available",
    address: "15 Rue de la Paix",
    city: "Paris",
    country: "France",
    postalCode: "75001",
    latitude: 48.8566,
    longitude: 2.3522,
    surface: 75,
    numberOfRooms: 3,
    numberOfBedrooms: 2,
    numberOfBathrooms: 1,
    maxGuests: 4,
    floor: 3,
    hasElevator: true,
    hasParking: false,
    hasBalcony: true,
    pricePerNight: 120,
    cleaningFee: 30,
    serviceFee: 15,
    securityDeposit: 200,
    averageRating: 4.8,
    totalReviews: 127,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    cancellationPolicy: "Annulation gratuite 48h avant l'arrivée",
    houseRules: "Non-fumeur, pas d'animaux",
    accessInstructions: "Code d'entrée : 1234A, Appartement au 3ème étage",
    cleaningInstructions: "Attention aux sols en parquet",
    maintenanceNotes: "Chaudière récente, éviter de toucher aux réglages",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    owner: mockPropertyOwners[0],
    ownerId: mockPropertyOwners[0].id,
    manager: mockPropertyManagers[0],
    managerId: mockPropertyManagers[0].id,
  },
  {
    id: "2",
    name: "Studio Étudiant",
    description: "Studio meublé proche université et transports",
    status: "occupied",
    address: "8 Avenue des Étudiants",
    city: "Lyon",
    country: "France",
    postalCode: "69002",
    latitude: 45.764,
    longitude: 4.8357,
    surface: 25,
    numberOfRooms: 1,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    maxGuests: 2,
    floor: 2,
    hasElevator: false,
    hasParking: false,
    hasBalcony: false,
    pricePerNight: 60,
    cleaningFee: 20,
    serviceFee: 8,
    securityDeposit: 100,
    averageRating: 4.5,
    totalReviews: 89,
    checkInTime: "16:00",
    checkOutTime: "10:00",
    cancellationPolicy: "Annulation gratuite 24h avant l'arrivée",
    houseRules: "Non-fumeur, calme après 22h",
    accessInstructions: "Boîte à clé code 9876, Studio au 2ème étage",
    cleaningInstructions: "Studio compact, attention à l'espace",
    maintenanceNotes: "Plomberie ancienne, faire attention",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-22T16:45:00Z",
    ownerId: "2",
    managerId: "manager-1",
  },
  {
    id: "3",
    name: "Maison Familiale",
    description: "Maison avec jardin et piscine pour familles",
    status: "maintenance",
    address: "42 Rue du Bonheur",
    city: "Marseille",
    country: "France",
    postalCode: "13001",
    latitude: 43.2965,
    longitude: 5.3698,
    surface: 120,
    numberOfRooms: 5,
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    maxGuests: 6,
    floor: 0,
    hasElevator: false,
    hasParking: true,
    hasBalcony: false,
    pricePerNight: 180,
    cleaningFee: 45,
    serviceFee: 25,
    securityDeposit: 300,
    averageRating: 4.9,
    totalReviews: 203,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    cancellationPolicy: "Annulation gratuite 7 jours avant l'arrivée",
    houseRules: "Animaux acceptés, piscine sous surveillance d'un adulte",
    accessInstructions: "Clé chez le voisin, Mme Rossi",
    cleaningInstructions: "Nettoyer aussi la terrasse et l'espace piscine",
    maintenanceNotes: "Maison ancienne, respecter le cachet",
    createdAt: "2024-01-05T11:00:00Z",
    updatedAt: "2024-01-21T09:15:00Z",
    ownerId: "3",
    managerId: "manager-1",
  },
];

const mockReservations: Reservation[] = [
  {
    id: "1",
    propertyId: "1",
    managerId: "manager-1",
    guestName: "Pierre Dubois",
    guestEmail: "pierre.dubois@email.com",
    guestPhone: "+33 6 12 34 56 78",
    guestCount: 2,
    checkIn: "2024-01-25T15:00:00Z",
    checkOut: "2024-01-28T11:00:00Z",
    nights: 3,
    basePrice: 360, // 3 nights × 120€
    cleaningFee: 30,
    serviceFee: 15,
    taxes: 81, // 20% sur total
    totalPrice: 486,
    status: "confirmed",
    notes: "Demande étage élevé, pas d'allergies",
    confirmationCode: "CNF2024001",
    bookingSource: "direct",
    createdAt: "2024-01-18T14:00:00Z",
    updatedAt: "2024-01-18T14:30:00Z",
  },
  {
    id: "2",
    propertyId: "2",
    managerId: "manager-1",
    guestName: "Emma Wilson",
    guestEmail: "emma.wilson@email.com",
    guestPhone: "+33 7 98 76 54 32",
    guestCount: 1,
    checkIn: "2024-01-22T16:00:00Z",
    checkOut: "2024-02-05T10:00:00Z",
    nights: 14,
    basePrice: 840, // 14 nights × 60€
    cleaningFee: 20,
    serviceFee: 8,
    taxes: 173.6, // 20% sur total
    totalPrice: 1041.6,
    status: "in_progress",
    notes: "Étudiante Erasmus, séjour longue durée",
    confirmationCode: "CNF2024002",
    bookingSource: "airbnb",
    checkInTime: "2024-01-22T16:30:00Z",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-22T16:30:00Z",
  },
  {
    id: "3",
    propertyId: "3",
    managerId: "manager-1",
    guestName: "Famille Garcia",
    guestEmail: "carlos.garcia@email.com",
    guestPhone: "+33 6 55 44 33 22",
    guestCount: 5,
    checkIn: "2024-02-10T15:00:00Z",
    checkOut: "2024-02-17T11:00:00Z",
    nights: 7,
    basePrice: 1260, // 7 nights × 180€
    cleaningFee: 45,
    serviceFee: 25,
    taxes: 266, // 20% sur total
    totalPrice: 1596,
    status: "pending",
    notes: "Vacances familiales, enfants 8, 12 et 15 ans",
    confirmationCode: "CNF2024003",
    bookingSource: "booking.com",
    createdAt: "2024-01-20T18:00:00Z",
    updatedAt: "2024-01-20T18:00:00Z",
  },
];

const mockPropertyFeatures: PropertyFeature[] = [
  // Features pour propriété 1
  {
    id: "1",
    name: "WiFi",
    icon: "wifi",
    category: "Internet",
    propertyId: "1",
  },
  {
    id: "2",
    name: "Climatisation",
    icon: "ac",
    category: "Confort",
    propertyId: "1",
  },
  {
    id: "3",
    name: "Cuisine équipée",
    icon: "kitchen",
    category: "Équipements",
    propertyId: "1",
  },
  {
    id: "4",
    name: "Balcon",
    icon: "balcony",
    category: "Extérieur",
    propertyId: "1",
  },
  // Features pour propriété 2
  {
    id: "5",
    name: "WiFi",
    icon: "wifi",
    category: "Internet",
    propertyId: "2",
  },
  {
    id: "6",
    name: "Kitchenette",
    icon: "kitchenette",
    category: "Équipements",
    propertyId: "2",
  },
  // Features pour propriété 3
  {
    id: "7",
    name: "WiFi",
    icon: "wifi",
    category: "Internet",
    propertyId: "3",
  },
  {
    id: "8",
    name: "Piscine",
    icon: "pool",
    category: "Extérieur",
    propertyId: "3",
  },
  {
    id: "9",
    name: "Jardin",
    icon: "garden",
    category: "Extérieur",
    propertyId: "3",
  },
  {
    id: "10",
    name: "Parking",
    icon: "parking",
    category: "Services",
    propertyId: "3",
  },
];

const mockPropertyPhotos: PropertyPhoto[] = [
  // Photos pour propriété 1
  {
    id: "1",
    url: "/photos/prop1_main.jpg",
    caption: "Vue principale",
    isMain: true,
    order: 0,
    type: "exterior",
    propertyId: "1",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "2",
    url: "/photos/prop1_living.jpg",
    caption: "Salon",
    isMain: false,
    order: 1,
    type: "interior",
    propertyId: "1",
    createdAt: "2024-01-15T08:15:00Z",
  },
  {
    id: "3",
    url: "/photos/prop1_bedroom.jpg",
    caption: "Chambre principale",
    isMain: false,
    order: 2,
    type: "interior",
    propertyId: "1",
    createdAt: "2024-01-15T08:30:00Z",
  },
  // Photos pour propriété 2
  {
    id: "4",
    url: "/photos/prop2_main.jpg",
    caption: "Studio vue d'ensemble",
    isMain: true,
    order: 0,
    type: "interior",
    propertyId: "2",
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "5",
    url: "/photos/prop2_kitchen.jpg",
    caption: "Coin cuisine",
    isMain: false,
    order: 1,
    type: "interior",
    propertyId: "2",
    createdAt: "2024-01-10T09:15:00Z",
  },
  // Photos pour propriété 3
  {
    id: "6",
    url: "/photos/prop3_main.jpg",
    caption: "Façade de la maison",
    isMain: true,
    order: 0,
    type: "exterior",
    propertyId: "3",
    createdAt: "2024-01-05T11:00:00Z",
  },
  {
    id: "7",
    url: "/photos/prop3_pool.jpg",
    caption: "Piscine et jardin",
    isMain: false,
    order: 1,
    type: "exterior",
    propertyId: "3",
    createdAt: "2024-01-05T11:15:00Z",
  },
];

// Composants modals
const CreateManagerModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    data: Omit<PoleManagerProfile, "id" | "createdAt" | "updatedAt">
  ) => void;
}) => {
  const [formData, setFormData] = useState({
    userId: "",
    poleType: "conciergerie" as PoleType,
    canViewAnalytics: true,
    canManageAgents: true,
    canManageClients: false,
    canManageBilling: false,
    superAdminId: "super-admin-1",
    user: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const handleSubmit = () => {
    if (!formData.user.name || !formData.user.email) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    onSubmit(formData);
  };

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Text style={modalStyles.title}>Créer un Manager</Text>
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={modalStyles.content}>
        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Nom *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.user.name}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                user: { ...prev.user, name: text },
              }))
            }
            placeholder="Nom complet"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Email *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.user.email}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                user: { ...prev.user, email: text },
              }))
            }
            placeholder="email@example.com"
            keyboardType="email-address"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Téléphone</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.user.phone}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                user: { ...prev.user, phone: text },
              }))
            }
            placeholder="+33 6 12 34 56 78"
            keyboardType="phone-pad"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Pôle</Text>
          <View style={modalStyles.radioGroup}>
            {(
              [
                "conciergerie",
                "cleaning",
                "maintenance",
                "laundry",
              ] as PoleType[]
            ).map((pole) => (
              <TouchableOpacity
                key={pole}
                style={modalStyles.radioItem}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, poleType: pole }))
                }
              >
                <View
                  style={[
                    modalStyles.radioCircle,
                    formData.poleType === pole && modalStyles.radioSelected,
                  ]}
                />
                <Text style={modalStyles.radioText}>
                  {pole === "conciergerie"
                    ? "Conciergerie"
                    : pole === "cleaning"
                    ? "Nettoyage"
                    : pole === "maintenance"
                    ? "Maintenance"
                    : "Blanchisserie"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Permissions</Text>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                canViewAnalytics: !prev.canViewAnalytics,
              }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.canViewAnalytics && modalStyles.checkboxSelected,
              ]}
            >
              {formData.canViewAnalytics && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Voir les analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                canManageAgents: !prev.canManageAgents,
              }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.canManageAgents && modalStyles.checkboxSelected,
              ]}
            >
              {formData.canManageAgents && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Gérer les agents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                canManageClients: !prev.canManageClients,
              }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.canManageClients && modalStyles.checkboxSelected,
              ]}
            >
              {formData.canManageClients && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Gérer les clients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                canManageBilling: !prev.canManageBilling,
              }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.canManageBilling && modalStyles.checkboxSelected,
              ]}
            >
              {formData.canManageBilling && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Gérer la facturation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={modalStyles.footer}>
        <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton}>
          <Text style={modalStyles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={modalStyles.submitButton}
        >
          <Text style={modalStyles.submitButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CreatePropertyModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Omit<Property, "id" | "createdAt" | "updatedAt">) => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "available" as PropertyStatus,
    address: "",
    city: "",
    country: "France",
    postalCode: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    surface: undefined as number | undefined,
    numberOfRooms: undefined as number | undefined,
    numberOfBedrooms: undefined as number | undefined,
    numberOfBathrooms: undefined as number | undefined,
    maxGuests: undefined as number | undefined,
    floor: undefined as number | undefined,
    hasElevator: false,
    hasParking: false,
    hasBalcony: false,
    pricePerNight: undefined as number | undefined,
    cleaningFee: undefined as number | undefined,
    serviceFee: undefined as number | undefined,
    securityDeposit: undefined as number | undefined,
    totalReviews: 0,
    averageRating: 0,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    cancellationPolicy: "",
    houseRules: "",
    accessInstructions: "",
    cleaningInstructions: "",
    maintenanceNotes: "",
    ownerId: "1", // TODO: Sélectionner le propriétaire
    managerId: "1", // TODO: Sélectionner le manager
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.city) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    onSubmit(formData);
  };

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Text style={modalStyles.title}>Créer une Propriété</Text>
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={modalStyles.content}>
        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Nom *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.name}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, name: text }))
            }
            placeholder="Nom de la propriété"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Description *</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={formData.description}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, description: text }))
            }
            placeholder="Description de la propriété"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Adresse *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.address}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, address: text }))
            }
            placeholder="Adresse complète"
          />
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Ville *</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.city}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, city: text }))
              }
              placeholder="Ville"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Code postal</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.postalCode}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, postalCode: text }))
              }
              placeholder="75001"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Surface (m²)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.surface?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  surface: text ? parseFloat(text) : undefined,
                }))
              }
              placeholder="75"
              keyboardType="numeric"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Nombre de pièces</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.numberOfRooms?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  numberOfRooms: text ? parseInt(text) : undefined,
                }))
              }
              placeholder="3"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Chambres</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.numberOfBedrooms?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  numberOfBedrooms: text ? parseInt(text) : undefined,
                }))
              }
              placeholder="2"
              keyboardType="numeric"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Salles de bain</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.numberOfBathrooms?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  numberOfBathrooms: text ? parseInt(text) : undefined,
                }))
              }
              placeholder="1"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Invités max</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.maxGuests?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  maxGuests: text ? parseInt(text) : undefined,
                }))
              }
              placeholder="4"
              keyboardType="numeric"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Prix/nuit (€)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.pricePerNight?.toString() || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  pricePerNight: text ? parseFloat(text) : undefined,
                }))
              }
              placeholder="120"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Équipements</Text>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                hasElevator: !prev.hasElevator,
              }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.hasElevator && modalStyles.checkboxSelected,
              ]}
            >
              {formData.hasElevator && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Ascenseur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({ ...prev, hasParking: !prev.hasParking }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.hasParking && modalStyles.checkboxSelected,
              ]}
            >
              {formData.hasParking && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Parking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modalStyles.checkboxItem}
            onPress={() =>
              setFormData((prev) => ({ ...prev, hasBalcony: !prev.hasBalcony }))
            }
          >
            <View
              style={[
                modalStyles.checkbox,
                formData.hasBalcony && modalStyles.checkboxSelected,
              ]}
            >
              {formData.hasBalcony && (
                <Text style={modalStyles.checkboxIcon}>✓</Text>
              )}
            </View>
            <Text style={modalStyles.checkboxText}>Balcon</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={modalStyles.footer}>
        <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton}>
          <Text style={modalStyles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={modalStyles.submitButton}
        >
          <Text style={modalStyles.submitButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CreateReservationModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Omit<Reservation, "id" | "createdAt" | "updatedAt">) => void;
}) => {
  const [formData, setFormData] = useState({
    propertyId: "",
    managerId: "manager-1",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestCount: 1,
    checkIn: "",
    checkOut: "",
    nights: 1,
    basePrice: 0,
    cleaningFee: 0,
    serviceFee: 0,
    taxes: 0,
    totalPrice: 0,
    status: "pending" as ReservationStatus,
    notes: "",
    confirmationCode: "",
    bookingSource: "direct",
  });

  const handleSubmit = () => {
    if (
      !formData.propertyId ||
      !formData.guestName ||
      !formData.guestEmail ||
      !formData.checkIn ||
      !formData.checkOut
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Calculer les nuits et prix automatiquement
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      Alert.alert(
        "Erreur",
        "La date de départ doit être après la date d'arrivée"
      );
      return;
    }

    const basePrice = formData.basePrice * nights;
    const totalPrice =
      basePrice + formData.cleaningFee + formData.serviceFee + formData.taxes;

    onSubmit({
      ...formData,
      nights,
      basePrice,
      totalPrice,
      confirmationCode: formData.confirmationCode || `CNF${Date.now()}`,
    });
  };

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Text style={modalStyles.title}>Créer une Réservation</Text>
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={modalStyles.content}>
        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Propriété *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.propertyId}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, propertyId: text }))
            }
            placeholder="ID de la propriété"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Nom de l'invité *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.guestName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, guestName: text }))
            }
            placeholder="Nom complet"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Email de l'invité *</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.guestEmail}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, guestEmail: text }))
            }
            placeholder="email@example.com"
            keyboardType="email-address"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Téléphone</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.guestPhone}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, guestPhone: text }))
            }
            placeholder="+33 6 12 34 56 78"
            keyboardType="phone-pad"
          />
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Nombre d'invités</Text>
          <TextInput
            style={modalStyles.input}
            value={formData.guestCount.toString()}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                guestCount: text ? parseInt(text) || 1 : 1,
              }))
            }
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Arrivée *</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.checkIn}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, checkIn: text }))
              }
              placeholder="2024-01-25T15:00:00Z"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Départ *</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.checkOut}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, checkOut: text }))
              }
              placeholder="2024-01-28T11:00:00Z"
            />
          </View>
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Prix de base/nuit (€)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.basePrice.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  basePrice: text ? parseFloat(text) || 0 : 0,
                }))
              }
              placeholder="120"
              keyboardType="numeric"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Frais de ménage (€)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.cleaningFee.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  cleaningFee: text ? parseFloat(text) || 0 : 0,
                }))
              }
              placeholder="30"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={modalStyles.row}>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Frais de service (€)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.serviceFee.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  serviceFee: text ? parseFloat(text) || 0 : 0,
                }))
              }
              placeholder="15"
              keyboardType="numeric"
            />
          </View>
          <View style={modalStyles.halfWidth}>
            <Text style={modalStyles.label}>Taxes (€)</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.taxes.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  taxes: text ? parseFloat(text) || 0 : 0,
                }))
              }
              placeholder="81"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Statut</Text>
          <View style={modalStyles.radioGroup}>
            {(["pending", "confirmed", "cancelled"] as ReservationStatus[]).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={modalStyles.radioItem}
                  onPress={() => setFormData((prev) => ({ ...prev, status }))}
                >
                  <View
                    style={[
                      modalStyles.radioCircle,
                      formData.status === status && modalStyles.radioSelected,
                    ]}
                  />
                  <Text style={modalStyles.radioText}>
                    {status === "pending"
                      ? "En attente"
                      : status === "confirmed"
                      ? "Confirmée"
                      : "Annulée"}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View style={modalStyles.section}>
          <Text style={modalStyles.label}>Notes</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={formData.notes}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, notes: text }))
            }
            placeholder="Notes sur la réservation"
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={modalStyles.footer}>
        <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton}>
          <Text style={modalStyles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={modalStyles.submitButton}
        >
          <Text style={modalStyles.submitButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Interface du contexte
interface ConciergerieContextType {
  // Data
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;
  properties: Property[];
  reservations: Reservation[];
  propertyOwners: PropertyOwnerProfile[];
  propertyFeatures: PropertyFeature[];
  propertyPhotos: PropertyPhoto[];
  propertyReviews: PropertyReview[];
  contracts: PropertyContract[];
  managers: PoleManagerProfile[];
  stats: any;

  // États
  isLoading: boolean;
  error: string | null;

  // Actions Properties
  fetchProperties: () => Promise<void>;
  createProperty: (
    property: Omit<Property, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  // Actions Reservations
  fetchReservations: () => Promise<void>;
  createReservation: (
    reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateReservation: (
    id: string,
    reservation: Partial<Reservation>
  ) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  updateReservationStatus: (
    reservationId: string,
    status: ReservationStatus
  ) => Promise<void>;
  checkInGuest: (reservationId: string) => Promise<void>;
  checkOutGuest: (reservationId: string) => Promise<void>;

  // Actions Property Owners
  fetchPropertyOwners: () => Promise<void>;
  createPropertyOwner: (
    owner: Omit<PropertyOwnerProfile, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updatePropertyOwner: (
    id: string,
    owner: Partial<PropertyOwnerProfile>
  ) => Promise<void>;
  deletePropertyOwner: (id: string) => Promise<void>;

  // Actions Features & Photos
  fetchPropertyFeatures: () => Promise<void>;
  addPropertyFeature: (feature: Omit<PropertyFeature, "id">) => Promise<void>;
  removePropertyFeature: (featureId: string) => Promise<void>;
  fetchPropertyPhotos: () => Promise<void>;
  addPropertyPhoto: (
    photo: Omit<PropertyPhoto, "id" | "createdAt">
  ) => Promise<void>;
  removePropertyPhoto: (photoId: string) => Promise<void>;

  // Actions Reviews
  fetchPropertyReviews: () => Promise<void>;
  addPropertyReview: (
    review: Omit<PropertyReview, "id" | "createdAt">
  ) => Promise<void>;

  // Actions Contracts
  fetchContracts: () => Promise<void>;
  createContract: (
    contract: Omit<PropertyContract, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateContract: (
    id: string,
    contract: Partial<PropertyContract>
  ) => Promise<void>;

  // Modals
  setShowCreateManagerModal: (show: boolean) => void;
  setShowCreatePropertyModal: (show: boolean) => void;
  setShowCreateReservationModal: (show: boolean) => void;

  // Actions Manager
  fetchManager: () => Promise<void>;
}

// Context
const ConciergerieContext = createContext<ConciergerieContextType | undefined>(
  undefined
);

// Provider
export function ConciergerieProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();

  // États
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [reservations, setReservations] =
    useState<Reservation[]>(mockReservations);
  const [propertyOwners, setPropertyOwners] =
    useState<PropertyOwnerProfile[]>(mockPropertyOwners);
  const [propertyFeatures, setPropertyFeatures] =
    useState<PropertyFeature[]>(mockPropertyFeatures);
  const [propertyPhotos, setPropertyPhotos] =
    useState<PropertyPhoto[]>(mockPropertyPhotos);
  const [propertyReviews, setPropertyReviews] = useState<PropertyReview[]>([]);
  const [contracts, setContracts] = useState<PropertyContract[]>([]);
  const [managers, setManagers] = useState<PoleManagerProfile[]>([]);
  const [manager, setManager] = useState<PoleManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États des modals
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [showCreateReservationModal, setShowCreateReservationModal] =
    useState(false);

  // Actions Properties
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/properties?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProperties(mockProperties);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des propriétés");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProperty = useCallback(
    async (propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">) => {
      try {
        // TODO: Appel API réel - POST /api/properties
        const newProperty: Property = {
          ...propertyData,
          id: Date.now().toString(),
          totalReviews: 0,
          averageRating: 0,
          country: propertyData.country || "France",
          checkInTime: propertyData.checkInTime || "15:00",
          checkOutTime: propertyData.checkOutTime || "11:00",
          status: propertyData.status || "available",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProperties((prev) => [...prev, newProperty]);
      } catch (err) {
        setError("Erreur lors de la création de la propriété");
      }
    },
    []
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const today = new Date();

  const stats = {
    totalProperties: properties.length,
    occupiedProperties: properties.filter((p) => p.status === "occupied")
      .length,
    availableProperties: properties.filter((p) => p.status === "available")
      .length,
    totalReservations: reservations.length,
    activeReservations: reservations.filter(
      (r) => r.status === "confirmed" || r.status === "checked_in"
    ).length,
    checkInsToday: reservations.filter(
      (r) =>
        new Date(r.checkIn) >= startOfToday && new Date(r.checkIn) < endOfToday
    ).length,
    checkOutsToday: reservations.filter(
      (r) =>
        new Date(r.checkOut) >= startOfToday &&
        new Date(r.checkOut) < endOfToday
    ).length,
    totalRevenue: reservations.reduce((sum, r) => sum + r.totalPrice, 0),
    monthlyRevenue: reservations
      .filter(
        (r) =>
          new Date(r.createdAt).getMonth() === today.getMonth() &&
          new Date(r.createdAt).getFullYear() === today.getFullYear()
      )
      .reduce((sum, r) => sum + r.totalPrice, 0),
  };

  const updateProperty = useCallback(
    async (id: string, propertyData: Partial<Property>) => {
      try {
        // TODO: Appel API réel - PUT /api/properties/:id
        setProperties((prev) =>
          prev.map((property) =>
            property.id === id
              ? {
                  ...property,
                  ...propertyData,
                  updatedAt: new Date().toISOString(),
                }
              : property
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la propriété");
      }
    },
    []
  );

  const deleteProperty = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/properties/:id
      setProperties((prev) => prev.filter((property) => property.id !== id));
      // Supprimer aussi les réservations associées
      setReservations((prev) =>
        prev.filter((reservation) => reservation.propertyId !== id)
      );
    } catch (err) {
      setError("Erreur lors de la suppression de la propriété");
    }
  }, []);

  // Actions Reservations
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/reservations?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setReservations(mockReservations);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des réservations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReservation = useCallback(
    async (
      reservationData: Omit<Reservation, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/reservations
        const newReservation: Reservation = {
          ...reservationData,
          id: Date.now().toString(),
          guestCount: reservationData.guestCount || 1,
          status: reservationData.status || "pending",
          confirmationCode:
            reservationData.confirmationCode ||
            `CNF2024${String(reservations.length + 1).padStart(3, "0")}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setReservations((prev) => [...prev, newReservation]);
      } catch (err) {
        setError("Erreur lors de la création de la réservation");
      }
    },
    [reservations.length]
  );

  const updateReservation = useCallback(
    async (id: string, reservationData: Partial<Reservation>) => {
      try {
        // TODO: Appel API réel - PUT /api/reservations/:id
        setReservations((prev) =>
          prev.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  ...reservationData,
                  updatedAt: new Date().toISOString(),
                }
              : reservation
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la réservation");
      }
    },
    []
  );

  const deleteReservation = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/reservations/:id
      setReservations((prev) =>
        prev.filter((reservation) => reservation.id !== id)
      );
    } catch (err) {
      setError("Erreur lors de la suppression de la réservation");
    }
  }, []);

  const updateReservationStatus = useCallback(
    async (reservationId: string, status: ReservationStatus) => {
      try {
        // TODO: Appel API réel - PUT /api/reservations/:reservationId/status
        setReservations((prev) =>
          prev.map((reservation) =>
            reservation.id === reservationId
              ? { ...reservation, status, updatedAt: new Date().toISOString() }
              : reservation
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du statut");
      }
    },
    []
  );

  const checkInGuest = useCallback(async (reservationId: string) => {
    try {
      // TODO: Appel API réel - PUT /api/reservations/:reservationId/checkin
      const now = new Date().toISOString();
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? {
                ...reservation,
                status: "checked_in",
                checkInTime: now,
                updatedAt: now,
              }
            : reservation
        )
      );
    } catch (err) {
      setError("Erreur lors du check-in");
    }
  }, []);

  const checkOutGuest = useCallback(async (reservationId: string) => {
    try {
      // TODO: Appel API réel - PUT /api/reservations/:reservationId/checkout
      const now = new Date().toISOString();
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? {
                ...reservation,
                status: "checked_out",
                checkOutTime: now,
                updatedAt: now,
              }
            : reservation
        )
      );
    } catch (err) {
      setError("Erreur lors du check-out");
    }
  }, []);

  // Actions Property Owners
  const fetchPropertyOwners = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/property-owners
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPropertyOwners(mockPropertyOwners);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des propriétaires");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPropertyOwner = useCallback(
    async (
      ownerData: Omit<PropertyOwnerProfile, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/property-owners
        const newOwner: PropertyOwnerProfile = {
          ...ownerData,
          id: Date.now().toString(),
          country: ownerData.country || "France",
          preferredContactMethod: ownerData.preferredContactMethod || "email",
          receiveNotifications: ownerData.receiveNotifications ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPropertyOwners((prev) => [...prev, newOwner]);
      } catch (err) {
        setError("Erreur lors de la création du propriétaire");
      }
    },
    []
  );

  const updatePropertyOwner = useCallback(
    async (id: string, ownerData: Partial<PropertyOwnerProfile>) => {
      try {
        // TODO: Appel API réel - PUT /api/property-owners/:id
        setPropertyOwners((prev) =>
          prev.map((owner) =>
            owner.id === id
              ? { ...owner, ...ownerData, updatedAt: new Date().toISOString() }
              : owner
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du propriétaire");
      }
    },
    []
  );

  const deletePropertyOwner = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/property-owners/:id
      setPropertyOwners((prev) => prev.filter((owner) => owner.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du propriétaire");
    }
  }, []);

  // Actions Features & Photos
  const fetchPropertyFeatures = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/property-features
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPropertyFeatures(mockPropertyFeatures);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des équipements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPropertyFeature = useCallback(
    async (featureData: Omit<PropertyFeature, "id">) => {
      try {
        // TODO: Appel API réel - POST /api/property-features
        const newFeature: PropertyFeature = {
          ...featureData,
          id: Date.now().toString(),
        };
        setPropertyFeatures((prev) => [...prev, newFeature]);
      } catch (err) {
        setError("Erreur lors de l'ajout de l'équipement");
      }
    },
    []
  );

  const removePropertyFeature = useCallback(async (featureId: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/property-features/:featureId
      setPropertyFeatures((prev) =>
        prev.filter((feature) => feature.id !== featureId)
      );
    } catch (err) {
      setError("Erreur lors de la suppression de l'équipement");
    }
  }, []);

  const fetchPropertyPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/property-photos
      await new Promise((resolve) => setTimeout(resolve, 700));
      setPropertyPhotos(mockPropertyPhotos);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des photos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPropertyPhoto = useCallback(
    async (photoData: Omit<PropertyPhoto, "id" | "createdAt">) => {
      try {
        // TODO: Appel API réel - POST /api/property-photos
        const newPhoto: PropertyPhoto = {
          ...photoData,
          id: Date.now().toString(),
          isMain: photoData.isMain ?? false,
          order: photoData.order ?? 0,
          createdAt: new Date().toISOString(),
        };
        setPropertyPhotos((prev) => [...prev, newPhoto]);
      } catch (err) {
        setError("Erreur lors de l'ajout de la photo");
      }
    },
    []
  );

  const removePropertyPhoto = useCallback(async (photoId: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/property-photos/:photoId
      setPropertyPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    } catch (err) {
      setError("Erreur lors de la suppression de la photo");
    }
  }, []);

  // Actions Reviews
  const fetchPropertyReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/property-reviews
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPropertyReviews([]);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des avis");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPropertyReview = useCallback(
    async (reviewData: Omit<PropertyReview, "id" | "createdAt">) => {
      try {
        // TODO: Appel API réel - POST /api/property-reviews
        const newReview: PropertyReview = {
          ...reviewData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setPropertyReviews((prev) => [...prev, newReview]);

        // Mettre à jour la note moyenne de la propriété
        const currentReviews = propertyReviews; // référence au state actuel
        const allReviewsForProperty = [...currentReviews, newReview].filter(
          (r: PropertyReview) => r.propertyId === reviewData.propertyId
        );
        const averageRating =
          allReviewsForProperty.reduce(
            (sum: number, review: PropertyReview) => sum + review.rating,
            0
          ) / allReviewsForProperty.length;

        setProperties((prev) =>
          prev.map((property) =>
            property.id === reviewData.propertyId
              ? {
                  ...property,
                  averageRating: Math.round(averageRating * 10) / 10,
                  totalReviews: allReviewsForProperty.length,
                  updatedAt: new Date().toISOString(),
                }
              : property
          )
        );
      } catch (err) {
        setError("Erreur lors de l'ajout de l'avis");
      }
    },
    [propertyReviews]
  );

  // Actions Contracts
  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/property-contracts
      await new Promise((resolve) => setTimeout(resolve, 900));
      setContracts([]);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des contrats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContract = useCallback(
    async (
      contractData: Omit<PropertyContract, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/property-contracts
        const newContract: PropertyContract = {
          ...contractData,
          id: Date.now().toString(),
          status: contractData.status || "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setContracts((prev) => [...prev, newContract]);
      } catch (err) {
        setError("Erreur lors de la création du contrat");
      }
    },
    []
  );

  const updateContract = useCallback(
    async (id: string, contractData: Partial<PropertyContract>) => {
      try {
        // TODO: Appel API réel - PUT /api/property-contracts/:id
        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === id
              ? {
                  ...contract,
                  ...contractData,
                  updatedAt: new Date().toISOString(),
                }
              : contract
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du contrat");
      }
    },
    []
  );

  // Actions Manager
  const fetchManager = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/pole-managers?userId=X&poleType=conciergerie
      await new Promise((resolve) => setTimeout(resolve, 500));
      setManagers([]);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement du manager");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  // Chargement initial
  useEffect(() => {
    if (session?.user) {
      fetchManager();
    }
  }, [session?.user, fetchManager]);

  const contextValue: ConciergerieContextType = {
    // Data
    selectedProperty,
    setSelectedProperty,
    properties,
    reservations,
    propertyOwners,
    propertyFeatures,
    propertyPhotos,
    propertyReviews,
    contracts,
    managers,
    stats,

    // États
    isLoading,
    error,

    // Actions Properties
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,

    // Actions Reservations
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus,
    checkInGuest,
    checkOutGuest,

    // Actions Property Owners
    fetchPropertyOwners,
    createPropertyOwner,
    updatePropertyOwner,
    deletePropertyOwner,

    // Actions Features & Photos
    fetchPropertyFeatures,
    addPropertyFeature,
    removePropertyFeature,
    fetchPropertyPhotos,
    addPropertyPhoto,
    removePropertyPhoto,

    // Actions Reviews
    fetchPropertyReviews,
    addPropertyReview,

    // Actions Contracts
    fetchContracts,
    createContract,
    updateContract,

    // Modals
    setShowCreateManagerModal,
    setShowCreatePropertyModal,
    setShowCreateReservationModal,

    // Actions Manager
    fetchManager,
  };

  // Si pas de manager de conciergerie, afficher un message
  if (!manager && !isLoading && !showCreateManagerModal) {
    return (
      <NoManagerScreen setShowCreateManagerModal={setShowCreateManagerModal} />
    );
  }

  return (
    <ConciergerieContext.Provider value={contextValue}>
      {manager && children}

      {/* Modal Créer Manager */}
      <Modal
        visible={showCreateManagerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateManagerModal(false)}
      >
        <CreateManagerModal
          onClose={() => setShowCreateManagerModal(false)}
          onSubmit={(data) => {
            // TODO: Créer le manager
            console.log("Create manager:", data);
            setShowCreateManagerModal(false);
          }}
        />
      </Modal>

      {/* Modal Créer Property */}
      <Modal
        visible={showCreatePropertyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePropertyModal(false)}
      >
        <CreatePropertyModal
          onClose={() => setShowCreatePropertyModal(false)}
          onSubmit={(data) => {
            createProperty(data);
            setShowCreatePropertyModal(false);
          }}
        />
      </Modal>

      {/* Modal Créer Reservation */}
      <Modal
        visible={showCreateReservationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateReservationModal(false)}
      >
        <CreateReservationModal
          onClose={() => setShowCreateReservationModal(false)}
          onSubmit={(data) => {
            createReservation(data);
            setShowCreateReservationModal(false);
          }}
        />
      </Modal>
    </ConciergerieContext.Provider>
  );
}

// Hook
export function useConciergerie() {
  const context = useContext(ConciergerieContext);
  if (context === undefined) {
    throw new Error(
      "useConciergerie must be used within a ConciergerieProvider"
    );
  }
  return context;
}

// Styles pour les modals
const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  radioGroup: {
    gap: 12,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    marginRight: 12,
  },
  radioSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  radioText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  checkboxIcon: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  checkboxText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
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
    fontWeight: "600",
    color: "#8E8E93",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

// Alias pour compatibilité avec l'ancien contexte
export const PropertyProvider = ConciergerieProvider;
export const useProperties = useConciergerie;
