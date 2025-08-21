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
  const [products, setProducts] = useState<LaundryProduct[]>([]);
  const [clients, setClients] = useState<LaundryClientProfile[]>([]);
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [orderItems, setOrderItems] = useState<LaundryOrderItem[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [invoices, setInvoices] = useState<LaundryInvoice[]>([]);
  const [manager, setManager] = useState<PoleManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  // Actions Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8081/api/laundry-products",
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des produits");
      }
      const products = await response.json();
      setProducts(products);
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
        const response = await fetch(
          "http://localhost:8081/api/laundry-products",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(productData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création du produit");
        }

        const newProduct = await response.json();
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
        const response = await fetch(
          `http://localhost:8081/api/laundry-products?id=${id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(productData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du produit");
        }

        const updatedProduct = await response.json();
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? updatedProduct : product))
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du produit");
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/laundry-products?id=${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du produit");
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du produit");
    }
  }, []);

  // Actions Clients
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/laundry-clients");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des clients");
      }
      const clients = await response.json();
      setClients(clients);
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
        const response = await fetch(
          "http://localhost:8081/api/laundry-clients",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(clientData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création du client");
        }

        const newClient = await response.json();
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
        const response = await fetch(
          `http://localhost:8081/api/laundry-clients?id=${id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(clientData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du client");
        }

        const updatedClient = await response.json();
        setClients((prev) =>
          prev.map((client) => (client.id === id ? updatedClient : client))
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour du client");
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/laundry-clients?id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du client");
      }

      setClients((prev) => prev.filter((client) => client.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du client");
    }
  }, []);

  // Actions Orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/laundry-orders");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des commandes");
      }
      const orders = await response.json();
      setOrders(orders);
      // Extraire les items des commandes
      const allItems = orders.flatMap((order: any) => order.items || []);
      setOrderItems(allItems);
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
        const response = await fetch(
          "http://localhost:8081/api/laundry-orders",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(orderData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création de la commande");
        }

        const newOrder = await response.json();
        setOrders((prev) => [...prev, newOrder]);
      } catch (err) {
        setError("Erreur lors de la création de la commande");
      }
    },
    []
  );

  const updateOrder = useCallback(
    async (id: string, orderData: Partial<LaundryOrder>) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/laundry-orders?id=${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de la commande");
        }

        const updatedOrder = await response.json();
        setOrders((prev) =>
          prev.map((order) => (order.id === id ? updatedOrder : order))
        );
      } catch (err) {
        setError("Erreur lors de la mise à jour de la commande");
      }
    },
    []
  );

  const deleteOrder = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/laundry-orders?id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la commande");
      }

      setOrders((prev) => prev.filter((order) => order.id !== id));
      setOrderItems((prev) => prev.filter((item) => item.orderId !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la commande");
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/laundry-orders?id=${orderId}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du statut");
        }

        const updatedOrder = await response.json();
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? updatedOrder : order))
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
        const response = await fetch(
          "http://localhost:8081/api/laundry-order-items",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(orderItemData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout de l'article");
        }

        const newOrderItem = await response.json();
        setOrderItems((prev) => [...prev, newOrderItem]);
        // Rafraîchir les commandes pour avoir les totaux à jour
        fetchOrders();
      } catch (err) {
        setError("Erreur lors de l'ajout de l'article");
      }
    },
    [fetchOrders]
  );

  const updateOrderItem = useCallback(
    async (id: string, orderItemData: Partial<LaundryOrderItem>) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/laundry-order-items?id=${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderItemData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de l'article");
        }

        const updatedOrderItem = await response.json();
        setOrderItems((prev) =>
          prev.map((item) => (item.id === id ? updatedOrderItem : item))
        );
        // Rafraîchir les commandes pour avoir les totaux à jour
        fetchOrders();
      } catch (err) {
        setError("Erreur lors de la mise à jour de l'article");
      }
    },
    [fetchOrders]
  );

  const removeOrderItem = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/laundry-order-items?id=${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de l'article");
        }

        setOrderItems((prev) => prev.filter((item) => item.id !== id));
        // Rafraîchir les commandes pour avoir les totaux à jour
        fetchOrders();
      } catch (err) {
        setError("Erreur lors de la suppression de l'article");
      }
    },
    [fetchOrders]
  );

  // Actions Delivery Notes
  const fetchDeliveryNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/delivery-notes");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des bons de livraison");
      }
      const deliveryNotes = await response.json();
      setDeliveryNotes(deliveryNotes);
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
        const response = await fetch(
          "http://localhost:8081/api/delivery-notes",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(deliveryNoteData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création du bon de livraison");
        }

        const newDeliveryNote = await response.json();
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
        const response = await fetch(
          `http://localhost:8081/api/delivery-notes?id=${id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(deliveryNoteData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du bon de livraison");
        }

        const updatedDeliveryNote = await response.json();
        setDeliveryNotes((prev) =>
          prev.map((note) => (note.id === id ? updatedDeliveryNote : note))
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
      const response = await fetch(
        "http://localhost:8081/api/laundry-invoices",
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des factures");
      }
      const invoices = await response.json();
      setInvoices(invoices);
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
        const response = await fetch(
          "http://localhost:8081/api/laundry-invoices",
          {
            method: "POST",
            headers: {
              ...headers,
            },
            body: JSON.stringify(invoiceData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la création de la facture");
        }

        const newInvoice = await response.json();
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
        const response = await fetch(
          `http://localhost:8081/api/laundry-invoices?id=${id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
            },
            body: JSON.stringify(invoiceData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de la facture");
        }

        const updatedInvoice = await response.json();
        setInvoices((prev) =>
          prev.map((invoice) => (invoice.id === id ? updatedInvoice : invoice))
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
      const response = await fetch(
        `http://localhost:8081/api/laundry-managers?userId=${session.user.id}`,
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du manager");
      }
      const manager = await response.json();
      setManager(manager);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement du manager");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Chargement initial
  useEffect(() => {
    if (session?.user) {
      fetchProducts();
      fetchClients();
      fetchOrders();
      fetchDeliveryNotes();
      fetchInvoices();
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
