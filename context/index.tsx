// ============================================================================
// CONTEXTS INDEX - TOUS LES PÔLES ALIGNÉS SCHEMA.PRISMA
// ============================================================================

// 🔧 PÔLE MAINTENANCE
export { MaintenanceProvider, useMaintenance } from "./MaintenanceContext";

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
export { ConciergerieProvider, useConciergerie } from "./ConciergerieContext";

// 🏠 PROPRIÉTAIRES DE BIENS
export {
  PropertyOwnerProvider,
  usePropertyOwner,
  usePropertyOwnerProfile,
  usePropertyOwnerProperties,
  usePropertyOwnerDashboard,

  // Types PropertyOwner
  type UpdatePropertyOwnerProfileData,
} from "./PropertyOwnerContext";

// ============================================================================
// TYPES COMMUNS À TOUS LES PÔLES
// ============================================================================

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
