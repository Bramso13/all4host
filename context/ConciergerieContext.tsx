import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { View, Text, Modal } from "react-native";
import NoManagerScreen from "~/components/screen/conciergerie/NoManagerScreen";
import { authClient } from "~/lib/auth-client";
import {
  CreateManagerModal,
  CreatePropertyModal,
  CreateReservationModal,
} from "~/components/modals/ConciergerieModals";
import {
  Property,
  PropertyOwnerProfile,
  PoleManagerProfile,
  Reservation,
  PropertyFeature,
  PropertyPhoto,
  PropertyReview,
  PropertyContract,
} from "~/lib/types";
import { ReservationStatus } from "~/lib/types";

// Mock data alignées avec le schema.prisma (commenté car on utilise maintenant les vraies API)
/*
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
    poleTypes: ["conciergerie"],
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

*/

/*
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
*/

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
  managers: (PoleManagerProfile & { isCurrentUser?: boolean })[];
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
  fetchManagers: () => Promise<void>;
  createManager: (managerData: any) => Promise<PoleManagerProfile>;
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [propertyOwners, setPropertyOwners] = useState<PropertyOwnerProfile[]>(
    []
  );
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>(
    []
  );
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>([]);
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

  const cookies = authClient.getCookie();
  const headers = {
    Cookie: cookies,
  };

  // Actions Properties
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/properties", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors du chargement des propriétés"
        );
      }

      const properties = await response.json();
      setProperties(properties);
      setError(null);
    } catch (err) {
      console.error("Erreur fetchProperties:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des propriétés"
      );
    } finally {
      setIsLoading(false);
    }
  }, [headers]);

  const createProperty = useCallback(
    async (propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">) => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8081/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(propertyData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la création de la propriété"
          );
        }

        const newProperty = await response.json();
        setProperties((prev) => [...prev, newProperty]);
        setError(null);

        return newProperty;
      } catch (err) {
        console.error("Erreur createProperty:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la création de la propriété";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
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
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8081/api/properties", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ id, ...propertyData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la mise à jour de la propriété"
          );
        }

        const updatedProperty = await response.json();
        setProperties((prev) =>
          prev.map((property) =>
            property.id === id ? updatedProperty : property
          )
        );
        setError(null);

        return updatedProperty;
      } catch (err) {
        console.error("Erreur updateProperty:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la mise à jour de la propriété";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  const deleteProperty = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8081/api/properties", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la suppression de la propriété"
          );
        }

        setProperties((prev) => prev.filter((property) => property.id !== id));
        // Supprimer aussi les réservations associées localement
        setReservations((prev) =>
          prev.filter((reservation) => reservation.propertyId !== id)
        );
        setError(null);
      } catch (err) {
        console.error("Erreur deleteProperty:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la suppression de la propriété";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  // Actions Reservations
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/reservations?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setReservations([]);
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
      const response = await fetch(
        "http://localhost:8081/api/property-owners",
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors du chargement des propriétaires"
        );
      }

      const propertyOwners = await response.json();
      setPropertyOwners(propertyOwners);
      setError(null);
    } catch (err) {
      console.error("Erreur fetchPropertyOwners:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des propriétaires"
      );
    } finally {
      setIsLoading(false);
    }
  }, [headers]);

  const createPropertyOwner = useCallback(
    async (
      ownerData: Omit<PropertyOwnerProfile, "id" | "createdAt" | "updatedAt">
    ) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "http://localhost:8081/api/property-owners",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: JSON.stringify(ownerData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la création du propriétaire"
          );
        }

        const newOwner = await response.json();
        setPropertyOwners((prev) => [...prev, newOwner]);
        setError(null);

        return newOwner;
      } catch (err) {
        console.error("Erreur createPropertyOwner:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la création du propriétaire";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  const updatePropertyOwner = useCallback(
    async (id: string, ownerData: Partial<PropertyOwnerProfile>) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "http://localhost:8081/api/property-owners",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: JSON.stringify({ id, ...ownerData }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la mise à jour du propriétaire"
          );
        }

        const updatedOwner = await response.json();
        setPropertyOwners((prev) =>
          prev.map((owner) => (owner.id === id ? updatedOwner : owner))
        );
        setError(null);

        return updatedOwner;
      } catch (err) {
        console.error("Erreur updatePropertyOwner:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la mise à jour du propriétaire";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  const deletePropertyOwner = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "http://localhost:8081/api/property-owners",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: JSON.stringify({ id }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la suppression du propriétaire"
          );
        }

        setPropertyOwners((prev) => prev.filter((owner) => owner.id !== id));
        setError(null);
      } catch (err) {
        console.error("Erreur deletePropertyOwner:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la suppression du propriétaire";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  // Actions Features & Photos
  const fetchPropertyFeatures = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/property-features
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPropertyFeatures([]);
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
      setPropertyPhotos([]);
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
      const response = await fetch("http://localhost:8081/api/pole-managers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          // L'utilisateur n'est pas super admin
          setManager(null);
          setManagers([]);
          setError("Accès réservé aux super admins");
          return;
        }
        throw new Error("Erreur lors de la récupération du manager");
      }

      const managerData = await response.json();

      if (managerData) {
        console.log("Manager data:", managerData);
        setManager(managerData);
        setManagers([managerData]);
      } else {
        setManager(null);
        setManagers([]);
      }
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement du manager");
      console.error("Erreur fetchManager:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/managers-list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          // L'utilisateur n'est pas super admin
          setManager(null);
          setManagers([]);
          setError("Accès réservé aux super admins");
          return;
        }
        throw new Error("Erreur lors de la récupération des managers");
      }

      const data = await response.json();
      const managersData = data.managers || [];

      console.log("All Managers data:", managersData);

      // Trouver le manager qui correspond à l'utilisateur connecté (lui-même)
      const currentUserManager = managersData.find((m: any) => m.isCurrentUser);

      setManagers(managersData);
      setManager(currentUserManager || null);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des managers");
      console.error("Erreur fetchManagers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, headers]);

  const createManager = async (managerData: any) => {
    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:8081/api/pole-managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(managerData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log("Error creating manager:", error);
        throw new Error(error.error || "Erreur lors de la création du manager");
      }

      const newManager = await response.json();
      setManager(newManager);
      setManagers([...managers, newManager]);
      setError(null);

      return newManager;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du manager";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (session?.user) {
      fetchManager();
      fetchManagers();
    }
  }, [session?.user]);

  // Chargement des propriétés et propriétaires quand le manager est défini
  useEffect(() => {
    if (manager) {
      fetchProperties();
      fetchPropertyOwners();
    }
  }, [manager]);

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
    fetchManagers,
    createManager,
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
          onCreateManager={async (data) => {
            try {
              const manager = await createManager(data);
              if (manager) {
                setShowCreateManagerModal(false);
                return true;
              }

              return false;
            } catch (err) {
              // L'erreur est déjà gérée dans createManager
              console.error("Erreur lors de la création du manager:", err);
            }
            return false;
          }}
          forAdmin={true}
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
          visible={showCreatePropertyModal}
          onClose={() => setShowCreatePropertyModal(false)}
          onCreateProperty={createProperty}
          onCreatePropertyOwner={createPropertyOwner}
          propertyOwners={propertyOwners}
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
          visible={showCreateReservationModal}
          onClose={() => setShowCreateReservationModal(false)}
          onCreateReservation={(data) => {
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

// Alias pour compatibilité avec l'ancien contexte
export const PropertyProvider = ConciergerieProvider;
export const useProperties = useConciergerie;
