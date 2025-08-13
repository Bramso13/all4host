import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "~/lib/auth-client";

// Types EXACTS basés sur schema.prisma

// Enums du schema.prisma
export type OrderStatus =
  | "received"
  | "processing"
  | "ready"
  | "pickup_scheduled"
  | "in_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";
export type PoleType = "conciergerie" | "cleaning" | "maintenance" | "laundry";

// LaundryProduct - Modèle EXACT du schema.prisma
export interface LaundryProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Float
  stock: number; // Int @default(0)
  category?: string;
  isActive: boolean; // @default(true)

  createdAt: string; // DateTime @default(now())
  updatedAt: string; // DateTime @updatedAt

  // Relations étendues (optionnelles pour le contexte)
  orderItems?: LaundryOrderItem[];
}

// LaundryClientProfile - Modèle EXACT du schema.prisma
export interface LaundryClientProfile {
  id: string;
  userId: string;

  // Informations client
  companyName?: string;
  contactPerson?: string;

  // Adresses par défaut
  defaultPickupAddress?: string;
  defaultDeliveryAddress: string;

  // Préférences
  preferredPickupTime?: string; // "morning", "afternoon", "evening"
  specialInstructions?: string;

  // Statut commercial
  creditLimit?: number; // Float? @default(0)
  paymentTerms?: number; // Int? @default(30)

  createdAt: string;
  updatedAt: string;

  // Relations étendues pour l'affichage
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  laundryOrders?: LaundryOrder[];
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

// LaundryOrder - Modèle PRINCIPAL EXACT du schema.prisma
export interface LaundryOrder {
  id: string;
  orderNumber: string; // @unique
  status: OrderStatus; // @default(received)

  // Dates importantes
  receivedDate?: string; // DateTime?
  processedDate?: string; // DateTime?
  readyDate?: string; // DateTime?
  deliveryDate?: string; // DateTime?

  // Adresses
  pickupAddress?: string;
  deliveryAddress: string;

  // Instructions
  instructions?: string;

  // Tarification
  subtotal: number; // Float
  taxes?: number; // Float?
  deliveryFee?: number; // Float?
  totalAmount: number; // Float

  // Notes
  notes?: string;

  // Le client peut marquer comme reçu
  receivedByClient: boolean; // @default(false)
  receivedAt?: string; // DateTime?

  createdAt: string;
  updatedAt: string;

  // Relations
  managerId: string;
  clientId: string;

  // Relations étendues (peuplées par le contexte)
  manager?: PoleManagerProfile;
  client?: LaundryClientProfile;
  items?: LaundryOrderItem[];
  deliveryNotes?: DeliveryNote[];
}

// LaundryOrderItem - Modèle EXACT du schema.prisma
export interface LaundryOrderItem {
  id: string;
  quantity: number; // Int
  unitPrice: number; // Float
  subtotal: number; // Float
  notes?: string;

  orderId: string;
  productId: string;

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  order?: LaundryOrder;
  product?: LaundryProduct;
}

// DeliveryNote - Modèle EXACT du schema.prisma
export interface DeliveryNote {
  id: string;
  number: string; // @unique
  date: string; // DateTime
  notes?: string;

  orderId: string;

  createdAt: string;
  updatedAt: string;

  // Relations étendues (peuplées par le contexte)
  order?: LaundryOrder;
}

// LaundryInvoice - Modèle EXACT du schema.prisma
export interface LaundryInvoice {
  id: string;
  invoiceNumber: string; // @unique
  status: string; // @default("draft")

  // Dates
  issueDate: string; // DateTime @default(now())
  dueDate: string; // DateTime
  paidAt?: string; // DateTime?

  // Montants
  subtotal: number; // Float
  taxRate: number; // Float @default(20)
  taxAmount: number; // Float
  totalAmount: number; // Float
  paidAmount: number; // Float @default(0)

  // Relations
  clientId: string;

  notes?: string;

  createdAt: string;
  updatedAt: string;

  // Relations étendues pour l'affichage
  client?: LaundryClientProfile;
}

// Mock data alignées avec le schema.prisma
const mockProducts: LaundryProduct[] = [
  {
    id: "1",
    name: "Chemises Blanches",
    description: "Chemises en coton blanc, repassage professionnel",
    price: 8.5,
    stock: 150,
    category: "Vêtements",
    isActive: true,
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Pantalons de Travail",
    description: "Pantalons robustes, lavage industriel",
    price: 12.0,
    stock: 85,
    category: "Vêtements",
    isActive: true,
    createdAt: "2024-01-02T09:00:00Z",
    updatedAt: "2024-01-14T16:30:00Z",
  },
  {
    id: "3",
    name: "Uniformes Hôtellerie",
    description: "Ensembles complets pour personnel hôtelier",
    price: 15.5,
    stock: 60,
    category: "Uniformes",
    isActive: true,
    createdAt: "2024-01-03T10:00:00Z",
    updatedAt: "2024-01-13T14:20:00Z",
  },
  {
    id: "4",
    name: "Linge de Lit",
    description: "Draps et housses de couette, blanchiment",
    price: 6.0,
    stock: 200,
    category: "Linge",
    isActive: true,
    createdAt: "2024-01-04T11:00:00Z",
    updatedAt: "2024-01-12T11:45:00Z",
  },
];

const mockClients: LaundryClientProfile[] = [
  {
    id: "1",
    userId: "user-client-1",
    companyName: "Hôtel Le Grand Luxe",
    contactPerson: "Marie Dubois",
    defaultPickupAddress: "15 Avenue des Champs, Paris 75001",
    defaultDeliveryAddress: "15 Avenue des Champs, Paris 75001",
    preferredPickupTime: "morning",
    specialInstructions: "Livraison par l'entrée de service",
    creditLimit: 5000,
    paymentTerms: 30,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    user: {
      name: "Marie Dubois",
      email: "marie.dubois@hotelluxe.com",
      phone: "+33 1 23 45 67 89",
    },
  },
  {
    id: "2",
    userId: "user-client-2",
    companyName: "Restaurant Le Gourmet",
    contactPerson: "Jean Martin",
    defaultPickupAddress: "8 Rue de la Table, Lyon 69002",
    defaultDeliveryAddress: "8 Rue de la Table, Lyon 69002",
    preferredPickupTime: "afternoon",
    specialInstructions: "Attention, uniformes de cuisine très sales",
    creditLimit: 2000,
    paymentTerms: 15,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-18T10:15:00Z",
    user: {
      name: "Jean Martin",
      email: "jean.martin@legourmet.fr",
      phone: "+33 4 78 90 12 34",
    },
  },
  {
    id: "3",
    userId: "user-client-3",
    companyName: "TechCorp",
    contactPerson: "Sophie Laurent",
    defaultPickupAddress: "789 Boulevard de l'Innovation, Marseille 13008",
    defaultDeliveryAddress: "789 Boulevard de l'Innovation, Marseille 13008",
    preferredPickupTime: "evening",
    specialInstructions: "Uniformes d'entreprise, qualité premium demandée",
    creditLimit: 3000,
    paymentTerms: 30,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-22T16:45:00Z",
    user: {
      name: "Sophie Laurent",
      email: "sophie.laurent@techcorp.com",
      phone: "+33 4 91 23 45 67",
    },
  },
];

const mockOrders: LaundryOrder[] = [
  {
    id: "1",
    orderNumber: "LAU-2024-001",
    status: "delivered",
    receivedDate: "2024-01-18T08:00:00Z",
    processedDate: "2024-01-19T10:00:00Z",
    readyDate: "2024-01-20T14:00:00Z",
    deliveryDate: "2024-01-20T16:00:00Z",
    pickupAddress: "15 Avenue des Champs, Paris 75001",
    deliveryAddress: "15 Avenue des Champs, Paris 75001",
    instructions: "Livraison entre 15h et 17h",
    subtotal: 425.0,
    deliveryFee: 15.0,
    taxes: 88.0,
    totalAmount: 528.0,
    notes: "Commande prioritaire",
    receivedByClient: true,
    receivedAt: "2024-01-20T16:30:00Z",
    createdAt: "2024-01-17T14:00:00Z",
    updatedAt: "2024-01-20T16:30:00Z",
    managerId: "manager-1",
    clientId: "1",
  },
  {
    id: "2",
    orderNumber: "LAU-2024-002",
    status: "processing",
    receivedDate: "2024-01-21T09:00:00Z",
    processedDate: "2024-01-22T08:00:00Z",
    pickupAddress: "8 Rue de la Table, Lyon 69002",
    deliveryAddress: "8 Rue de la Table, Lyon 69002",
    instructions: "Urgence, livraison rapide demandée",
    subtotal: 240.0,
    deliveryFee: 12.0,
    taxes: 50.4,
    totalAmount: 302.4,
    notes: "Uniformes de cuisine très sales",
    receivedByClient: false,
    createdAt: "2024-01-20T16:00:00Z",
    updatedAt: "2024-01-22T08:00:00Z",
    managerId: "manager-1",
    clientId: "2",
  },
  {
    id: "3",
    orderNumber: "LAU-2024-003",
    status: "received",
    receivedDate: "2024-01-22T10:00:00Z",
    pickupAddress: "789 Boulevard de l'Innovation, Marseille 13008",
    deliveryAddress: "789 Boulevard de l'Innovation, Marseille 13008",
    instructions: "Qualité premium demandée",
    subtotal: 620.0,
    deliveryFee: 20.0,
    taxes: 128.0,
    totalAmount: 768.0,
    notes: "Nouveau client, soigner la qualité",
    receivedByClient: false,
    createdAt: "2024-01-21T18:00:00Z",
    updatedAt: "2024-01-22T10:00:00Z",
    managerId: "manager-1",
    clientId: "3",
  },
];

const mockOrderItems: LaundryOrderItem[] = [
  // Items pour commande 1
  {
    id: "1",
    quantity: 25,
    unitPrice: 8.5,
    subtotal: 212.5,
    notes: "Chemises executive",
    orderId: "1",
    productId: "1",
    createdAt: "2024-01-17T14:00:00Z",
    updatedAt: "2024-01-17T14:00:00Z",
  },
  {
    id: "2",
    quantity: 10,
    unitPrice: 15.5,
    subtotal: 155.0,
    notes: "Uniformes réception",
    orderId: "1",
    productId: "3",
    createdAt: "2024-01-17T14:00:00Z",
    updatedAt: "2024-01-17T14:00:00Z",
  },
  {
    id: "3",
    quantity: 8,
    unitPrice: 6.0,
    subtotal: 48.0,
    notes: "Linge de chambre",
    orderId: "1",
    productId: "4",
    createdAt: "2024-01-17T14:00:00Z",
    updatedAt: "2024-01-17T14:00:00Z",
  },
  // Items pour commande 2
  {
    id: "4",
    quantity: 20,
    unitPrice: 12.0,
    subtotal: 240.0,
    notes: "Pantalons de cuisine très sales",
    orderId: "2",
    productId: "2",
    createdAt: "2024-01-20T16:00:00Z",
    updatedAt: "2024-01-20T16:00:00Z",
  },
  // Items pour commande 3
  {
    id: "5",
    quantity: 40,
    unitPrice: 15.5,
    subtotal: 620.0,
    notes: "Uniformes d'entreprise, qualité premium",
    orderId: "3",
    productId: "3",
    createdAt: "2024-01-21T18:00:00Z",
    updatedAt: "2024-01-21T18:00:00Z",
  },
];

const mockDeliveryNotes: DeliveryNote[] = [
  {
    id: "1",
    number: "BL-2024-001",
    date: "2024-01-20T16:00:00Z",
    notes: "Livraison effectuée en mains propres à M. Dubois",
    orderId: "1",
    createdAt: "2024-01-20T16:00:00Z",
    updatedAt: "2024-01-20T16:00:00Z",
  },
  {
    id: "2",
    number: "BL-2024-002",
    date: "2024-01-22T14:00:00Z",
    notes: "En attente de livraison",
    orderId: "2",
    createdAt: "2024-01-22T14:00:00Z",
    updatedAt: "2024-01-22T14:00:00Z",
  },
];

// Interface du contexte
interface BlanchisserieContextType {
  // Data
  products: LaundryProduct[];
  clients: LaundryClientProfile[];
  orders: LaundryOrder[];
  orderItems: LaundryOrderItem[];
  deliveryNotes: DeliveryNote[];
  invoices: LaundryInvoice[];
  manager: PoleManagerProfile | null;

  // États
  isLoading: boolean;
  error: string | null;

  // Actions Products
  fetchProducts: () => Promise<void>;
  createProduct: (
    product: Omit<LaundryProduct, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateProduct: (
    id: string,
    product: Partial<LaundryProduct>
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Actions Clients
  fetchClients: () => Promise<void>;
  createClient: (
    client: Omit<LaundryClientProfile, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateClient: (
    id: string,
    client: Partial<LaundryClientProfile>
  ) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Actions Orders
  fetchOrders: () => Promise<void>;
  createOrder: (
    order: Omit<LaundryOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateOrder: (id: string, order: Partial<LaundryOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Actions Order Items
  addOrderItem: (
    orderItem: Omit<LaundryOrderItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateOrderItem: (
    id: string,
    orderItem: Partial<LaundryOrderItem>
  ) => Promise<void>;
  removeOrderItem: (id: string, orderId: string) => Promise<void>;

  // Actions Delivery Notes
  fetchDeliveryNotes: () => Promise<void>;
  createDeliveryNote: (
    deliveryNote: Omit<DeliveryNote, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateDeliveryNote: (
    id: string,
    deliveryNote: Partial<DeliveryNote>
  ) => Promise<void>;

  // Actions Invoices
  fetchInvoices: () => Promise<void>;
  createInvoice: (
    invoice: Omit<LaundryInvoice, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateInvoice: (
    id: string,
    invoice: Partial<LaundryInvoice>
  ) => Promise<void>;

  // Actions Manager
  fetchManager: () => Promise<void>;
}

// Context
const BlanchisserieContext = createContext<
  BlanchisserieContextType | undefined
>(undefined);

// Provider
export function BlanchisserieProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();

  // États
  const [products, setProducts] = useState<LaundryProduct[]>(mockProducts);
  const [clients, setClients] = useState<LaundryClientProfile[]>(mockClients);
  const [orders, setOrders] = useState<LaundryOrder[]>(mockOrders);
  const [orderItems, setOrderItems] =
    useState<LaundryOrderItem[]>(mockOrderItems);
  const [deliveryNotes, setDeliveryNotes] =
    useState<DeliveryNote[]>(mockDeliveryNotes);
  const [invoices, setInvoices] = useState<LaundryInvoice[]>([]);
  const [manager, setManager] = useState<PoleManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/laundry-products
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProducts(mockProducts);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des produits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(
    async (
      productData: Omit<LaundryProduct, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/laundry-products
        const newProduct: LaundryProduct = {
          ...productData,
          id: Date.now().toString(),
          isActive: productData.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProducts((prev) => [...prev, newProduct]);
      } catch (err) {
        setError("Erreur lors de la création du produit");
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (id: string, productData: Partial<LaundryProduct>) => {
      try {
        // TODO: Appel API réel - PUT /api/laundry-products/:id
        setProducts((prev) =>
          prev.map((product) =>
            product.id === id
              ? {
                  ...product,
                  ...productData,
                  updatedAt: new Date().toISOString(),
                }
              : product
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du produit");
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/laundry-products/:id
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du produit");
    }
  }, []);

  // Actions Clients
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/laundry-clients?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 800));
      setClients(mockClients);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createClient = useCallback(
    async (
      clientData: Omit<LaundryClientProfile, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/laundry-clients
        const newClient: LaundryClientProfile = {
          ...clientData,
          id: Date.now().toString(),
          creditLimit: clientData.creditLimit ?? 0,
          paymentTerms: clientData.paymentTerms ?? 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setClients((prev) => [...prev, newClient]);
      } catch (err) {
        setError("Erreur lors de la création du client");
      }
    },
    []
  );

  const updateClient = useCallback(
    async (id: string, clientData: Partial<LaundryClientProfile>) => {
      try {
        // TODO: Appel API réel - PUT /api/laundry-clients/:id
        setClients((prev) =>
          prev.map((client) =>
            client.id === id
              ? {
                  ...client,
                  ...clientData,
                  updatedAt: new Date().toISOString(),
                }
              : client
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du client");
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/laundry-clients/:id
      setClients((prev) => prev.filter((client) => client.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du client");
    }
  }, []);

  // Actions Orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/laundry-orders?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setOrders(mockOrders);
      setOrderItems(mockOrderItems);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des commandes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOrder = useCallback(
    async (
      orderData: Omit<
        LaundryOrder,
        "id" | "orderNumber" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        // TODO: Appel API réel - POST /api/laundry-orders
        const newOrder: LaundryOrder = {
          ...orderData,
          id: Date.now().toString(),
          orderNumber: `LAU-2024-${String(orders.length + 1).padStart(3, "0")}`,
          status: orderData.status || "received",
          receivedByClient: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setOrders((prev) => [...prev, newOrder]);
      } catch (err) {
        setError("Erreur lors de la création de la commande");
      }
    },
    [orders.length]
  );

  const updateOrder = useCallback(
    async (id: string, orderData: Partial<LaundryOrder>) => {
      try {
        // TODO: Appel API réel - PUT /api/laundry-orders/:id
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, ...orderData, updatedAt: new Date().toISOString() }
              : order
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la commande");
      }
    },
    []
  );

  const deleteOrder = useCallback(async (id: string) => {
    try {
      // TODO: Appel API réel - DELETE /api/laundry-orders/:id
      setOrders((prev) => prev.filter((order) => order.id !== id));
      // Supprimer aussi les items associés
      setOrderItems((prev) => prev.filter((item) => item.orderId !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la commande");
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        // TODO: Appel API réel - PUT /api/laundry-orders/:orderId/status
        const now = new Date().toISOString();
        const statusDateFields: Partial<LaundryOrder> = {
          status,
          updatedAt: now,
        };

        // Mettre à jour les dates selon le statut
        switch (status) {
          case "processing":
            statusDateFields.processedDate = now;
            break;
          case "ready":
            statusDateFields.readyDate = now;
            break;
          case "delivered":
            statusDateFields.deliveryDate = now;
            break;
          case "completed":
            statusDateFields.receivedByClient = true;
            statusDateFields.receivedAt = now;
            break;
        }

        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, ...statusDateFields } : order
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du statut");
      }
    },
    []
  );

  // Actions Order Items
  const addOrderItem = useCallback(
    async (
      orderItemData: Omit<LaundryOrderItem, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/laundry-order-items
        const newOrderItem: LaundryOrderItem = {
          ...orderItemData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setOrderItems((prev) => [...prev, newOrderItem]);

        // Mettre à jour le sous-total de la commande
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderItemData.orderId
              ? {
                  ...order,
                  subtotal: order.subtotal + newOrderItem.subtotal,
                  totalAmount:
                    order.subtotal +
                    newOrderItem.subtotal +
                    (order.taxes || 0) +
                    (order.deliveryFee || 0),
                  updatedAt: new Date().toISOString(),
                }
              : order
          )
        );
      } catch (err) {
        setError("Erreur lors de l'ajout de l'article");
      }
    },
    []
  );

  const updateOrderItem = useCallback(
    async (id: string, orderItemData: Partial<LaundryOrderItem>) => {
      try {
        // TODO: Appel API réel - PUT /api/laundry-order-items/:id
        setOrderItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...orderItemData,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de l'article");
      }
    },
    []
  );

  const removeOrderItem = useCallback(
    async (id: string, orderId: string) => {
      try {
        // TODO: Appel API réel - DELETE /api/laundry-order-items/:id
        const itemToRemove = orderItems.find((item) => item.id === id);
        if (itemToRemove) {
          setOrderItems((prev) => prev.filter((item) => item.id !== id));

          // Mettre à jour le sous-total de la commande
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    subtotal: order.subtotal - itemToRemove.subtotal,
                    totalAmount:
                      order.subtotal -
                      itemToRemove.subtotal +
                      (order.taxes || 0) +
                      (order.deliveryFee || 0),
                    updatedAt: new Date().toISOString(),
                  }
                : order
            )
          );
        }
      } catch (err) {
        setError("Erreur lors de la suppression de l'article");
      }
    },
    [orderItems]
  );

  // Actions Delivery Notes
  const fetchDeliveryNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/delivery-notes?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 600));
      setDeliveryNotes(mockDeliveryNotes);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des bons de livraison");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDeliveryNote = useCallback(
    async (
      deliveryNoteData: Omit<DeliveryNote, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/delivery-notes
        const newDeliveryNote: DeliveryNote = {
          ...deliveryNoteData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDeliveryNotes((prev) => [...prev, newDeliveryNote]);
      } catch (err) {
        setError("Erreur lors de la création du bon de livraison");
      }
    },
    []
  );

  const updateDeliveryNote = useCallback(
    async (id: string, deliveryNoteData: Partial<DeliveryNote>) => {
      try {
        // TODO: Appel API réel - PUT /api/delivery-notes/:id
        setDeliveryNotes((prev) =>
          prev.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...deliveryNoteData,
                  updatedAt: new Date().toISOString(),
                }
              : note
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du bon de livraison");
      }
    },
    []
  );

  // Actions Invoices
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/laundry-invoices?managerId=X
      await new Promise((resolve) => setTimeout(resolve, 900));
      setInvoices([]);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des factures");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvoice = useCallback(
    async (
      invoiceData: Omit<LaundryInvoice, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        // TODO: Appel API réel - POST /api/laundry-invoices
        const newInvoice: LaundryInvoice = {
          ...invoiceData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setInvoices((prev) => [...prev, newInvoice]);
      } catch (err) {
        setError("Erreur lors de la création de la facture");
      }
    },
    []
  );

  const updateInvoice = useCallback(
    async (id: string, invoiceData: Partial<LaundryInvoice>) => {
      try {
        // TODO: Appel API réel - PUT /api/laundry-invoices/:id
        setInvoices((prev) =>
          prev.map((invoice) =>
            invoice.id === id
              ? {
                  ...invoice,
                  ...invoiceData,
                  updatedAt: new Date().toISOString(),
                }
              : invoice
          )
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la facture");
      }
    },
    []
  );

  // Actions Manager
  const fetchManager = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // TODO: Appel API réel - GET /api/pole-managers?userId=X&poleType=laundry
      await new Promise((resolve) => setTimeout(resolve, 500));
      setManager({
        id: "manager-1",
        userId: session.user.id,
        poleType: "laundry",
        canViewAnalytics: true,
        canManageAgents: true,
        canManageClients: true,
        canManageBilling: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        superAdminId: "super-admin-1",
        user: {
          name: session.user.name || "Manager Blanchisserie",
          email: session.user.email || "",
        },
      });
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

  const contextValue: BlanchisserieContextType = {
    // Data
    products,
    clients,
    orders,
    orderItems,
    deliveryNotes,
    invoices,
    manager,

    // États
    isLoading,
    error,

    // Actions Products
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,

    // Actions Clients
    fetchClients,
    createClient,
    updateClient,
    deleteClient,

    // Actions Orders
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,

    // Actions Order Items
    addOrderItem,
    updateOrderItem,
    removeOrderItem,

    // Actions Delivery Notes
    fetchDeliveryNotes,
    createDeliveryNote,
    updateDeliveryNote,

    // Actions Invoices
    fetchInvoices,
    createInvoice,
    updateInvoice,

    // Actions Manager
    fetchManager,
  };

  return (
    <BlanchisserieContext.Provider value={contextValue}>
      {children}
    </BlanchisserieContext.Provider>
  );
}

// Hook
export function useBlanchisserie() {
  const context = useContext(BlanchisserieContext);
  if (context === undefined) {
    throw new Error(
      "useBlanchisserie must be used within a BlanchisserieProvider"
    );
  }
  return context;
}
