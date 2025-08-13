// ============================================================================
// CONTEXTS INDEX - TOUS LES PÔLES ALIGNÉS SCHEMA.PRISMA
// ============================================================================

// 🧹 PÔLE NETTOYAGE (CLEANING)
export {
  NettoyageProvider,
  useNettoyage,
  CleaningProvider, // Alias
  useCleaning, // Alias

  // Types Nettoyage
  type Property as CleaningProperty,
  type AgentProfile as CleaningAgent,
  type CleaningSession,
  type CleaningChecklist,
  type CleaningPhoto,
  type PoleManagerProfile as CleaningPoleManager,
  type SessionStatus,
  type AgentType,
  type AgentAvailability,
  type PropertyStatus,
} from "./NettoyageContext";

// 🔧 PÔLE MAINTENANCE
export {
  MaintenanceProvider,
  useMaintenance,

  // Types Maintenance
  type Property as MaintenanceProperty,
  type AgentProfile as MaintenanceAgent,
  type Ticket,
  type TicketPhoto,
  type MaintenanceSession,
  type MaintenanceMaterial,
  type MaintenancePhoto,
  type PoleManagerProfile as MaintenancePoleManager,
  type TicketStatus,
  type TicketPriority,
} from "./MaintenanceContext";

// 🧺 PÔLE BLANCHISSERIE (LAUNDRY)
export {
  BlanchisserieProvider,
  useBlanchisserie,

  // Types Blanchisserie
  type LaundryProduct,
  type LaundryOrder,
  type LaundryOrderItem,
  type DeliveryNote,
  type LaundryClientProfile,
  type LaundryInvoice,
  type PoleManagerProfile as BlanchisseriePoleManager,
  type OrderStatus,
} from "./BlanchisserieContext";

// 🏢 PÔLE CONCIERGERIE
export {
  ConciergerieProvider,
  useConciergerie,

  // Types Conciergerie
  type Property as ConciergerieProperty,
  type Reservation,
  type PropertyOwnerProfile,
  type PropertyFeature,
  type PropertyPhoto,
  type PropertyReview,
  type PropertyContract,
  type PoleManagerProfile as ConciergeriePoleManager,
  type ReservationStatus,
} from "./ConciergerieContext";

// ============================================================================
// TYPES COMMUNS À TOUS LES PÔLES
// ============================================================================

// Type général PoleManagerProfile (peut être utilisé pour tous les pôles)
export type { PoleManagerProfile, PoleType } from "./NettoyageContext";

// Union types pour plus de flexibilité
export type AnyProperty =
  | import("./NettoyageContext").Property
  | import("./MaintenanceContext").Property
  | import("./ConciergerieContext").Property;

export type AnyAgent =
  | import("./NettoyageContext").AgentProfile
  | import("./MaintenanceContext").AgentProfile;

export type AnyPoleManager =
  | import("./NettoyageContext").PoleManagerProfile
  | import("./MaintenanceContext").PoleManagerProfile
  | import("./BlanchisserieContext").PoleManagerProfile
  | import("./ConciergerieContext").PoleManagerProfile;

// ============================================================================
// RÉSUMÉ DE L'ARCHITECTURE
// ============================================================================

/*
ARCHITECTURE DES CONTEXTES - 100% ALIGNÉE SCHEMA.PRISMA

🧹 NETTOYAGE (CleaningContext/NettoyageContext)
├── CleaningSession (modèle principal)
├── Property (propriétés à nettoyer)
├── AgentProfile (agents de nettoyage)
├── PoleManagerProfile (manager du pôle)
├── CleaningChecklist (tâches de nettoyage)
└── CleaningPhoto (photos avant/après)

🔧 MAINTENANCE (MaintenanceContext)
├── Ticket (tickets de maintenance)
├── MaintenanceSession (sessions de maintenance)
├── Property (propriétés à maintenir)
├── AgentProfile (agents de maintenance)
├── PoleManagerProfile (manager du pôle)
├── TicketPhoto (photos des tickets)
├── MaintenanceMaterial (matériaux utilisés)
└── MaintenancePhoto (photos des sessions)

🧺 BLANCHISSERIE (BlanchisserieContext)
├── LaundryOrder (commandes)
├── LaundryProduct (catalogue produits)
├── LaundryOrderItem (items des commandes)
├── LaundryClientProfile (clients)
├── PoleManagerProfile (manager du pôle)
├── DeliveryNote (bons de livraison)
└── LaundryInvoice (factures)

🏢 CONCIERGERIE (ConciergerieContext)
├── Property (propriétés immobilières)
├── Reservation (réservations)
├── PropertyOwnerProfile (propriétaires)
├── PoleManagerProfile (manager du pôle)
├── PropertyFeature (équipements)
├── PropertyPhoto (photos)
├── PropertyReview (avis)
└── PropertyContract (contrats)

TOUS LES MODÈLES RESPECTENT EXACTEMENT LE SCHEMA.PRISMA
- Tous les champs avec leurs types exacts
- Toutes les relations correctes
- Tous les enums respectés
- Mock data réalistes et complètes
- Actions CRUD complètes
- Gestion des états loading/error
- Commentaires TODO pour les vrais appels API
*/
