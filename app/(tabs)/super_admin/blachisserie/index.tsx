import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { authClient } from "~/lib/auth-client";
import {
  useBlanchisserie,
  type LaundryProduct,
  type LaundryOrder,
  type LaundryOrderItem,
  type DeliveryNote,
  type LaundryClientProfile,
} from "~/context/BlanchisserieContext";

// Interfaces TypeScript pour une validation stricte
interface StatusConfig {
  color: string;
  text: string;
  bg: string;
  icon: string;
}

interface StockConfig {
  color: string;
  text: string;
  bg: string;
}

type TabType = "products" | "orders" | "deliveries" | "stats";

export default function BlanchisserieScreen() {
  const { data: session } = authClient.useSession();
  const {
    products,
    orders,
    deliveryNotes,
    clients,
    isLoading,
    error,
    fetchProducts,
    fetchOrders,
    fetchDeliveryNotes,
    fetchClients,
    createProduct,
    updateProduct,
    createOrder,
    updateOrder,
    createClient,
  } = useBlanchisserie();
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // États pour les modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LaundryProduct | null>(
    null
  );
  const [editingOrder, setEditingOrder] = useState<LaundryOrder | null>(null);

  // États pour les formulaires de produit
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    isActive: true,
  });

  // États pour les formulaires de commande
  const [orderForm, setOrderForm] = useState({
    clientId: "",
    pickupAddress: "",
    deliveryAddress: "",
    instructions: "",
    subtotal: "",
    taxes: "",
    deliveryFee: "",
    notes: "",
  });

  // États pour les formulaires de client
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    contactPerson: "",
    defaultDeliveryAddress: "",
    defaultPickupAddress: "",
    preferredPickupTime: "",
    specialInstructions: "",
    creditLimit: "",
    paymentTerms: "",
  });

  // Fonctions de gestion des modals et formulaires
  const openProductModal = (product?: LaundryProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category || "",
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        isActive: true,
      });
    }
    setShowProductModal(true);
  };

  const openOrderModal = (order?: LaundryOrder) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({
        clientId: order.clientId,
        pickupAddress: order.pickupAddress || "",
        deliveryAddress: order.deliveryAddress,
        instructions: order.instructions || "",
        subtotal: order.subtotal.toString(),
        taxes: (order.taxes || 0).toString(),
        deliveryFee: (order.deliveryFee || 0).toString(),
        notes: order.notes || "",
      });
    } else {
      setEditingOrder(null);
      setOrderForm({
        clientId: "",
        pickupAddress: "",
        deliveryAddress: "",
        instructions: "",
        subtotal: "",
        taxes: "",
        deliveryFee: "",
        notes: "",
      });
    }
    setShowOrderModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      isActive: true,
    });
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setEditingOrder(null);
    setOrderForm({
      clientId: "",
      pickupAddress: "",
      deliveryAddress: "",
      instructions: "",
      subtotal: "",
      taxes: "",
      deliveryFee: "",
      notes: "",
    });
  };

  const openClientSelector = () => {
    setShowClientSelector(true);
    fetchClients(); // Charger les clients
  };

  const closeClientSelector = () => {
    setShowClientSelector(false);
  };

  const openClientModal = () => {
    setShowClientModal(true);
    setClientForm({
      name: "",
      email: "",
      phone: "",
      companyName: "",
      contactPerson: "",
      defaultDeliveryAddress: "",
      defaultPickupAddress: "",
      preferredPickupTime: "morning",
      specialInstructions: "",
      creditLimit: "",
      paymentTerms: "30",
    });
  };

  const closeClientModal = () => {
    setShowClientModal(false);
    setClientForm({
      name: "",
      email: "",
      phone: "",
      companyName: "",
      contactPerson: "",
      defaultDeliveryAddress: "",
      defaultPickupAddress: "",
      preferredPickupTime: "",
      specialInstructions: "",
      creditLimit: "",
      paymentTerms: "",
    });
  };

  const selectClient = (client: LaundryClientProfile) => {
    setOrderForm((prev) => ({
      ...prev,
      clientId: client.id,
      deliveryAddress: client.defaultDeliveryAddress || prev.deliveryAddress,
      pickupAddress: client.defaultPickupAddress || prev.pickupAddress,
    }));
    closeClientSelector();
  };

  const handleProductSubmit = async () => {
    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category.trim() || undefined,
        isActive: productForm.isActive,
      };

      // Validation
      if (
        !productData.name ||
        !productData.description ||
        isNaN(productData.price) ||
        isNaN(productData.stock)
      ) {
        Alert.alert(
          "Erreur",
          "Veuillez remplir tous les champs obligatoires avec des valeurs valides"
        );
        return;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        Alert.alert("Succès", "Produit mis à jour avec succès");
      } else {
        await createProduct(productData);
        Alert.alert("Succès", "Produit créé avec succès");
      }

      closeProductModal();
      fetchProducts();
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de l'enregistrement du produit"
      );
    }
  };

  const handleOrderSubmit = async () => {
    try {
      const subtotal = parseFloat(orderForm.subtotal);
      const taxes = parseFloat(orderForm.taxes) || 0;
      const deliveryFee = parseFloat(orderForm.deliveryFee) || 0;
      const totalAmount = subtotal + taxes + deliveryFee;

      const orderData = {
        clientId: orderForm.clientId,
        pickupAddress: orderForm.pickupAddress.trim() || undefined,
        deliveryAddress: orderForm.deliveryAddress.trim(),
        instructions: orderForm.instructions.trim() || undefined,
        subtotal,
        taxes,
        deliveryFee,
        totalAmount,
        notes: orderForm.notes.trim() || undefined,
        managerId: "", // Sera géré par l'API
        status: "received" as const,
        receivedByClient: false,
      };

      // Validation
      if (
        !orderData.clientId ||
        !orderData.deliveryAddress ||
        isNaN(subtotal)
      ) {
        Alert.alert(
          "Erreur",
          "Veuillez remplir tous les champs obligatoires avec des valeurs valides"
        );
        return;
      }

      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
        Alert.alert("Succès", "Commande mise à jour avec succès");
      } else {
        await createOrder(orderData);
        Alert.alert("Succès", "Commande créée avec succès");
      }

      closeOrderModal();
      fetchOrders();
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de l'enregistrement de la commande"
      );
    }
  };

  const handleClientSubmit = async () => {
    try {
      const clientData = {
        userId: "", // Sera géré par l'API
        companyName: clientForm.companyName.trim() || undefined,
        contactPerson: clientForm.contactPerson.trim() || undefined,
        defaultDeliveryAddress: clientForm.defaultDeliveryAddress.trim(),
        defaultPickupAddress:
          clientForm.defaultPickupAddress.trim() || undefined,
        preferredPickupTime: clientForm.preferredPickupTime || undefined,
        specialInstructions: clientForm.specialInstructions.trim() || undefined,
        creditLimit: clientForm.creditLimit
          ? parseFloat(clientForm.creditLimit)
          : undefined,
        paymentTerms: clientForm.paymentTerms
          ? parseInt(clientForm.paymentTerms)
          : undefined,
        // Données utilisateur
        user: {
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          phone: clientForm.phone.trim() || undefined,
        },
      };

      // Validation
      if (
        !clientData.user.name ||
        !clientData.user.email ||
        !clientData.defaultDeliveryAddress
      ) {
        Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
        return;
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientData.user.email)) {
        Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
        return;
      }

      await createClient(clientData);
      Alert.alert("Succès", "Client créé avec succès");

      closeClientModal();
      fetchClients(); // Recharger la liste des clients

      // Ouvrir le sélecteur pour permettre de choisir le nouveau client
      setTimeout(() => {
        openClientSelector();
      }, 500);
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la création du client"
      );
    }
  };

  // Fonctions de validation des données
  const validateProductsData = (): boolean => {
    if (!products) {
      console.error("Erreur: products est null ou undefined");
      return false;
    }
    if (!Array.isArray(products)) {
      console.error("Erreur: products n'est pas un tableau");
      return false;
    }
    if (products.length === 0) {
      console.warn("Attention: Aucun produit disponible");
      return false;
    }
    return true;
  };

  const validateOrdersData = (): boolean => {
    if (!orders) {
      console.error("Erreur: orders est null ou undefined");
      return false;
    }
    if (!Array.isArray(orders)) {
      console.error("Erreur: orders n'est pas un tableau");
      return false;
    }
    if (orders.length === 0) {
      console.warn("Attention: Aucune commande disponible");
      return false;
    }
    return true;
  };

  const validateDeliveryNotesData = (): boolean => {
    if (!deliveryNotes) {
      console.error("Erreur: deliveryNotes est null ou undefined");
      return false;
    }
    if (!Array.isArray(deliveryNotes)) {
      console.error("Erreur: deliveryNotes n'est pas un tableau");
      return false;
    }
    if (deliveryNotes.length === 0) {
      console.warn("Attention: Aucune livraison disponible");
      return false;
    }
    return true;
  };

  // Gestion des états de chargement et d'erreur avec validation
  if (typeof isLoading !== "boolean") {
    console.error("Erreur: isLoading n'est pas un boolean");
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    if (typeof error !== "string") {
      console.error("Erreur: error n'est pas une string", error);
    }
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Erreur: {error || "Erreur inconnue"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={(): void => {
              if (fetchProducts && typeof fetchProducts === "function") {
                fetchProducts();
              } else {
                console.error("Erreur: fetchProducts n'est pas une fonction");
              }
              if (fetchOrders && typeof fetchOrders === "function") {
                fetchOrders();
              } else {
                console.error("Erreur: fetchOrders n'est pas une fonction");
              }
              if (
                fetchDeliveryNotes &&
                typeof fetchDeliveryNotes === "function"
              ) {
                fetchDeliveryNotes();
              } else {
                console.error(
                  "Erreur: fetchDeliveryNotes n'est pas une fonction"
                );
              }
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusConfig = (status: string): StatusConfig => {
    if (!status || typeof status !== "string") {
      console.error(
        "Erreur: status est null, undefined ou n'est pas une string"
      );
      return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5", icon: "❓" };
    }

    switch (status) {
      case "received":
        return { color: "#FF9800", text: "Reçue", bg: "#FFF3E0", icon: "📦" };
      case "processing":
        return {
          color: "#2196F3",
          text: "En traitement",
          bg: "#E3F2FD",
          icon: "🔄",
        };
      case "delivery":
        return {
          color: "#9C27B0",
          text: "En livraison",
          bg: "#F3E5F5",
          icon: "🚚",
        };
      case "completed":
        return { color: "#4CAF50", text: "Livrée", bg: "#E8F5E8", icon: "✅" };
      case "returned":
        return {
          color: "#F44336",
          text: "Retournée",
          bg: "#FFEBEE",
          icon: "↩️",
        };
      default:
        console.warn(`Statut inconnu reçu: ${status}`);
        return { color: "#9E9E9E", text: "Inconnu", bg: "#F5F5F5", icon: "❓" };
    }
  };

  const getStockStatus = (stock: number): StockConfig => {
    if (typeof stock !== "number" || isNaN(stock)) {
      console.error("Erreur: stock n'est pas un nombre valide", stock);
      return { color: "#F44336", text: "Erreur", bg: "#FFEBEE" };
    }

    if (stock < 0) {
      console.warn(`Stock négatif détecté: ${stock}`);
      return { color: "#F44336", text: "Erreur", bg: "#FFEBEE" };
    }

    if (stock > 100)
      return { color: "#4CAF50", text: "Disponible", bg: "#E8F5E8" };
    if (stock > 50) return { color: "#FF9800", text: "Limité", bg: "#FFF3E0" };
    return { color: "#F44336", text: "Rupture", bg: "#FFEBEE" };
  };

  const renderProductsTab = (): React.JSX.Element => {
    if (!validateProductsData()) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.tabHeader}>
            <Text style={styles.tabTitle}>Produits & Stock</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openProductModal()}
            >
              <Text style={styles.addButtonText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Aucun produit disponible</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Produits & Stock</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openProductModal()}
          >
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsList}>
          {products
            .filter(
              (
                product: LaundryProduct | null | undefined
              ): product is LaundryProduct => {
                if (!product) {
                  console.warn(
                    "Produit null ou undefined trouvé dans la liste"
                  );
                  return false;
                }
                return true;
              }
            )
            .map((product: LaundryProduct) => {
              if (!product.id) {
                console.error("Produit sans ID trouvé", product);
                return null;
              }

              const stockValue: number =
                typeof product.stock === "number" ? product.stock : 0;
              const stockStatus: StockConfig = getStockStatus(stockValue);

              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {product.name || "Nom non disponible"}
                      </Text>
                      <Text style={styles.productDescription}>
                        {product.description || "Description non disponible"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.stockBadge,
                        { backgroundColor: stockStatus.bg },
                      ]}
                    >
                      <Text
                        style={[styles.stockText, { color: stockStatus.color }]}
                      >
                        {stockStatus.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productDetails}>
                    <View style={styles.productDetail}>
                      <Text style={styles.productDetailLabel}>💰 Prix:</Text>
                      <Text style={styles.productDetailValue}>
                        {typeof product.price === "number" ? product.price : 0}€
                      </Text>
                    </View>
                    <View style={styles.productDetail}>
                      <Text style={styles.productDetailLabel}>📦 Stock:</Text>
                      <Text style={styles.productDetailValue}>
                        {stockValue} unités
                      </Text>
                    </View>
                    <View style={styles.productDetail}>
                      <Text style={styles.productDetailLabel}>
                        📅 Mis à jour:
                      </Text>
                      <Text style={styles.productDetailValue}>
                        {product.updatedAt
                          ? new Date(product.updatedAt).toLocaleDateString(
                              "fr-FR"
                            )
                          : "Date inconnue"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openProductModal(product)}
                    >
                      <Text style={styles.actionButtonText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.actionButtonSecondary,
                      ]}
                      onPress={(): void => {
                        console.log(
                          `Historique du produit ${product.id} demandé`
                        );
                        Alert.alert(
                          "Information",
                          "Fonctionnalité d'historique en cours de développement"
                        );
                      }}
                    >
                      <Text style={styles.actionButtonTextSecondary}>
                        Historique
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
            .filter(
              (
                element: React.JSX.Element | null
              ): element is React.JSX.Element => element !== null
            )}
        </View>
      </View>
    );
  };

  const renderOrdersTab = (): React.JSX.Element => {
    if (!validateOrdersData()) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.tabHeader}>
            <Text style={styles.tabTitle}>Commandes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openOrderModal()}
            >
              <Text style={styles.addButtonText}>+ Nouvelle</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Aucune commande disponible</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Commandes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openOrderModal()}
          >
            <Text style={styles.addButtonText}>+ Nouvelle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersList}>
          {orders
            .filter(
              (
                order: LaundryOrder | null | undefined
              ): order is LaundryOrder => {
                if (!order) {
                  console.warn(
                    "Commande null ou undefined trouvée dans la liste"
                  );
                  return false;
                }
                return true;
              }
            )
            .map((order: LaundryOrder) => {
              if (!order.id) {
                console.error("Commande sans ID trouvée", order);
                return null;
              }

              const statusConfig: StatusConfig = getStatusConfig(
                order.status || ""
              );

              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderName}>
                        {order.orderNumber || "Numéro non disponible"}
                      </Text>
                      <Text style={styles.orderClient}>
                        {order.client?.companyName ||
                          order.client?.contactPerson ||
                          "Client inconnu"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.orderStatusBadge,
                        { backgroundColor: statusConfig.bg },
                      ]}
                    >
                      <Text style={styles.orderStatusIcon}>
                        {statusConfig.icon}
                      </Text>
                      <Text
                        style={[
                          styles.orderStatusText,
                          { color: statusConfig.color },
                        ]}
                      >
                        {statusConfig.text}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.orderDescription}>
                    {order.instructions || order.notes || "Aucune instruction"}
                  </Text>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>
                        📍 Adresse de livraison:
                      </Text>
                      <Text style={styles.orderDetailValue}>
                        {order.deliveryAddress || "Adresse non disponible"}
                      </Text>
                    </View>
                    {order.pickupAddress && (
                      <View style={styles.orderDetail}>
                        <Text style={styles.orderDetailLabel}>
                          📦 Adresse de collecte:
                        </Text>
                        <Text style={styles.orderDetailValue}>
                          {order.pickupAddress}
                        </Text>
                      </View>
                    )}
                    <View style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>💰 Total:</Text>
                      <Text style={styles.orderDetailValue}>
                        {typeof order.totalAmount === "number"
                          ? order.totalAmount
                          : 0}
                        €
                      </Text>
                    </View>
                    {order.receivedDate && (
                      <View style={styles.orderDetail}>
                        <Text style={styles.orderDetailLabel}>
                          📦 Reçue le:
                        </Text>
                        <Text style={styles.orderDetailValue}>
                          {new Date(order.receivedDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </Text>
                      </View>
                    )}
                    {order.deliveryDate && (
                      <View style={styles.orderDetail}>
                        <Text style={styles.orderDetailLabel}>
                          🚚 Livraison:
                        </Text>
                        <Text style={styles.orderDetailValue}>
                          {new Date(order.deliveryDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.orderItems}>
                    <Text style={styles.orderItemsTitle}>Articles:</Text>
                    {order.items &&
                    Array.isArray(order.items) &&
                    order.items.length > 0 ? (
                      order.items
                        .filter(
                          (
                            item: LaundryOrderItem | null | undefined
                          ): item is LaundryOrderItem => {
                            if (!item) {
                              console.warn(
                                "Article null ou undefined trouvé dans la commande",
                                order.id
                              );
                              return false;
                            }
                            return true;
                          }
                        )
                        .map((item: LaundryOrderItem) => {
                          if (!item.id) {
                            console.error("Article sans ID trouvé", item);
                            return null;
                          }
                          return (
                            <View key={item.id} style={styles.orderItem}>
                              <Text style={styles.orderItemName}>
                                {item.product?.name || "Produit inconnu"}
                              </Text>
                              <Text style={styles.orderItemQuantity}>
                                x
                                {typeof item.quantity === "number"
                                  ? item.quantity
                                  : 0}
                              </Text>
                              <Text style={styles.orderItemPrice}>
                                {typeof item.subtotal === "number"
                                  ? item.subtotal
                                  : 0}
                                €
                              </Text>
                            </View>
                          );
                        })
                        .filter(
                          (
                            element: React.JSX.Element | null
                          ): element is React.JSX.Element => element !== null
                        )
                    ) : (
                      <Text style={styles.orderItemName}>Aucun article</Text>
                    )}
                  </View>

                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(): void => {
                        console.log(
                          `Détails de la commande ${order.id} demandés`
                        );
                        Alert.alert(
                          "Information",
                          "Fonctionnalité de détails en cours de développement"
                        );
                      }}
                    >
                      <Text style={styles.actionButtonText}>Détails</Text>
                    </TouchableOpacity>
                    {order.status === "received" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSuccess,
                        ]}
                        onPress={(): void => {
                          console.log(
                            `Traitement de la commande ${order.id} demandé`
                          );
                          Alert.alert(
                            "Information",
                            "Fonctionnalité de traitement en cours de développement"
                          );
                        }}
                      >
                        <Text style={styles.actionButtonTextSuccess}>
                          Traiter
                        </Text>
                      </TouchableOpacity>
                    )}
                    {order.status === "processing" && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSuccess,
                        ]}
                        onPress={(): void => {
                          console.log(
                            `Livraison de la commande ${order.id} demandée`
                          );
                          Alert.alert(
                            "Information",
                            "Fonctionnalité de livraison en cours de développement"
                          );
                        }}
                      >
                        <Text style={styles.actionButtonTextSuccess}>
                          Livrer
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
            .filter(
              (
                element: React.JSX.Element | null
              ): element is React.JSX.Element => element !== null
            )}
        </View>
      </View>
    );
  };

  const renderDeliveriesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Livraisons</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Créer BL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deliveriesList}>
        {deliveryNotes.map((delivery) => (
          <View key={delivery.id} style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryNumber}>{delivery.number}</Text>
                <Text style={styles.deliveryClient}>
                  {delivery.order?.client?.companyName ||
                    delivery.order?.client?.contactPerson ||
                    "Client inconnu"}
                </Text>
              </View>
              <View style={styles.deliveryDate}>
                <Text style={styles.deliveryDateText}>
                  {new Date(delivery.date).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </View>

            <View style={styles.deliveryDetails}>
              <View style={styles.deliveryDetail}>
                <Text style={styles.deliveryDetailLabel}>📦 Commande:</Text>
                <Text style={styles.deliveryDetailValue}>
                  {delivery.order?.orderNumber || "N° inconnu"}
                </Text>
              </View>
              <View style={styles.deliveryDetail}>
                <Text style={styles.deliveryDetailLabel}>📍 Adresse:</Text>
                <Text style={styles.deliveryDetailValue}>
                  {delivery.order?.deliveryAddress || "Adresse inconnue"}
                </Text>
              </View>
              <View style={styles.deliveryDetail}>
                <Text style={styles.deliveryDetailLabel}>💰 Montant:</Text>
                <Text style={styles.deliveryDetailValue}>
                  {delivery.order?.totalAmount || 0}€
                </Text>
              </View>
            </View>

            <View style={styles.deliveryActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Imprimer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
              >
                <Text style={styles.actionButtonTextSecondary}>Détails</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStatsTab = () => {
    // Calculs des statistiques depuis les données du contexte
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Commandes de ce mois
    const ordersThisMonth = validateOrdersData()
      ? orders.filter((order) => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getMonth() === currentMonth &&
            orderDate.getFullYear() === currentYear
          );
        }).length
      : 0;

    // Chiffre d'affaires total
    const totalRevenue = validateOrdersData()
      ? orders
          .filter(
            (order) =>
              order.status === "completed" || order.status === "delivered"
          )
          .reduce(
            (sum, order) =>
              sum +
              (typeof order.totalAmount === "number" ? order.totalAmount : 0),
            0
          )
      : 0;

    // Livraisons effectuées
    const completedDeliveries = validateDeliveryNotesData()
      ? deliveryNotes.length
      : 0;

    // Note de satisfaction (placeholder car pas de données de satisfaction dans le contexte)
    const satisfactionScore = "N/A";

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Statistiques</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>📊 Rapport</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>📦</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{ordersThisMonth}</Text>
              <Text style={styles.statLabel}>Commandes ce mois</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>💰</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {totalRevenue.toLocaleString("fr-FR")}€
              </Text>
              <Text style={styles.statLabel}>Chiffre d'affaires</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>🚚</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{completedDeliveries}</Text>
              <Text style={styles.statLabel}>Livraisons effectuées</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>⭐</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{satisfactionScore}</Text>
              <Text style={styles.statLabel}>Satisfaction client</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Évolution des commandes</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>
              📈 Graphique interactif
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              Visualisation des tendances et performances
            </Text>
          </View>
        </View>

        <View style={styles.topProductsSection}>
          <Text style={styles.sectionTitle}>Produits les plus demandés</Text>
          <View style={styles.topProductsList}>
            {validateProductsData() ? (
              products
                .slice(0, 3)
                .map((product, index) => {
                  if (!product || !product.id) return null;

                  // Calculer les ventes réelles pour ce produit depuis les commandes
                  const productSales = validateOrdersData()
                    ? orders
                        .filter(
                          (order) => order.items && Array.isArray(order.items)
                        )
                        .reduce((totalSales, order) => {
                          if (!order.items || !Array.isArray(order.items))
                            return totalSales;
                          const productItems = order.items.filter(
                            (item) =>
                              item &&
                              item.product &&
                              item.product.id === product.id
                          );
                          return (
                            totalSales +
                            productItems.reduce(
                              (sum, item) =>
                                sum +
                                (typeof item.quantity === "number"
                                  ? item.quantity
                                  : 0),
                              0
                            )
                          );
                        }, 0)
                    : 0;

                  // Calculer le chiffre d'affaires pour ce produit
                  const productRevenue = validateOrdersData()
                    ? orders
                        .filter(
                          (order) => order.items && Array.isArray(order.items)
                        )
                        .reduce((totalRevenue, order) => {
                          if (!order.items || !Array.isArray(order.items))
                            return totalRevenue;
                          const productItems = order.items.filter(
                            (item) =>
                              item &&
                              item.product &&
                              item.product.id === product.id
                          );
                          return (
                            totalRevenue +
                            productItems.reduce(
                              (sum, item) =>
                                sum +
                                (typeof item.subtotal === "number"
                                  ? item.subtotal
                                  : 0),
                              0
                            )
                          );
                        }, 0)
                    : 0;

                  return (
                    <View key={product.id} style={styles.topProductItem}>
                      <View style={styles.topProductRank}>
                        <Text style={styles.topProductRankText}>
                          #{index + 1}
                        </Text>
                      </View>
                      <View style={styles.topProductInfo}>
                        <Text style={styles.topProductName}>
                          {product.name || "Produit sans nom"}
                        </Text>
                        <Text style={styles.topProductSales}>
                          {productSales} ventes
                        </Text>
                      </View>
                      <Text style={styles.topProductRevenue}>
                        {productRevenue.toLocaleString("fr-FR")}€
                      </Text>
                    </View>
                  );
                })
                .filter((item) => item !== null)
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Aucun produit disponible pour les statistiques
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Modal pour les produits
  const renderProductModal = () => (
    <Modal
      visible={showProductModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeProductModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeProductModal}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingProduct ? "Modifier le produit" : "Nouveau produit"}
          </Text>
          <TouchableOpacity onPress={handleProductSubmit}>
            <Text style={styles.modalSaveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom du produit *</Text>
            <TextInput
              style={styles.formInput}
              value={productForm.name}
              onChangeText={(text) =>
                setProductForm((prev) => ({ ...prev, name: text }))
              }
              placeholder="Entrez le nom du produit"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={productForm.description}
              onChangeText={(text) =>
                setProductForm((prev) => ({ ...prev, description: text }))
              }
              placeholder="Décrivez le produit"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>Prix (€) *</Text>
              <TextInput
                style={styles.formInput}
                value={productForm.price}
                onChangeText={(text) =>
                  setProductForm((prev) => ({ ...prev, price: text }))
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>Stock *</Text>
              <TextInput
                style={styles.formInput}
                value={productForm.stock}
                onChangeText={(text) =>
                  setProductForm((prev) => ({ ...prev, stock: text }))
                }
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Catégorie</Text>
            <TextInput
              style={styles.formInput}
              value={productForm.category}
              onChangeText={(text) =>
                setProductForm((prev) => ({ ...prev, category: text }))
              }
              placeholder="Catégorie du produit (optionnel)"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.formLabel}>Produit actif</Text>
              <Switch
                value={productForm.isActive}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, isActive: value }))
                }
                trackColor={{ false: "#E5E5E7", true: "#007AFF" }}
                thumbColor={productForm.isActive ? "#FFFFFF" : "#F4F3F4"}
              />
            </View>
            <Text style={styles.formHint}>
              Les produits inactifs ne sont pas visibles dans les commandes
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Modal pour les commandes
  const renderOrderModal = () => (
    <Modal
      visible={showOrderModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeOrderModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeOrderModal}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingOrder ? "Modifier la commande" : "Nouvelle commande"}
          </Text>
          <TouchableOpacity onPress={handleOrderSubmit}>
            <Text style={styles.modalSaveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Client *</Text>
            <View style={styles.clientSection}>
              <TouchableOpacity
                style={[styles.pickerContainer, styles.clientPickerButton]}
                onPress={openClientSelector}
              >
                <Text
                  style={[
                    styles.pickerPlaceholder,
                    orderForm.clientId && styles.pickerSelected,
                  ]}
                >
                  {orderForm.clientId
                    ? clients.find((c) => c.id === orderForm.clientId)?.user
                        ?.name || "Client sélectionné"
                    : "Sélectionner un client existant"}
                </Text>
                <Text style={styles.pickerIcon}>👥</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>ou</Text>

              <TouchableOpacity
                style={styles.createClientButton}
                onPress={openClientModal}
              >
                <Text style={styles.createClientText}>
                  + Créer un nouveau client
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Adresse de livraison *</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={orderForm.deliveryAddress}
              onChangeText={(text) =>
                setOrderForm((prev) => ({ ...prev, deliveryAddress: text }))
              }
              placeholder="Adresse complète de livraison"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Adresse de collecte</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={orderForm.pickupAddress}
              onChangeText={(text) =>
                setOrderForm((prev) => ({ ...prev, pickupAddress: text }))
              }
              placeholder="Adresse de collecte (optionnel)"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Instructions</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={orderForm.instructions}
              onChangeText={(text) =>
                setOrderForm((prev) => ({ ...prev, instructions: text }))
              }
              placeholder="Instructions spéciales pour la commande"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>Sous-total (€) *</Text>
              <TextInput
                style={styles.formInput}
                value={orderForm.subtotal}
                onChangeText={(text) =>
                  setOrderForm((prev) => ({ ...prev, subtotal: text }))
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>Taxes (€)</Text>
              <TextInput
                style={styles.formInput}
                value={orderForm.taxes}
                onChangeText={(text) =>
                  setOrderForm((prev) => ({ ...prev, taxes: text }))
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Frais de livraison (€)</Text>
            <TextInput
              style={styles.formInput}
              value={orderForm.deliveryFee}
              onChangeText={(text) =>
                setOrderForm((prev) => ({ ...prev, deliveryFee: text }))
              }
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={orderForm.notes}
              onChangeText={(text) =>
                setOrderForm((prev) => ({ ...prev, notes: text }))
              }
              placeholder="Notes internes"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Affichage du total calculé */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total calculé:</Text>
            <Text style={styles.totalValue}>
              {(
                parseFloat(orderForm.subtotal || "0") +
                parseFloat(orderForm.taxes || "0") +
                parseFloat(orderForm.deliveryFee || "0")
              ).toFixed(2)}
              €
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Modal pour sélectionner un client
  const renderClientSelectorModal = () => (
    <Modal
      visible={showClientSelector}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeClientSelector}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeClientSelector}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Sélectionner un client</Text>
          <TouchableOpacity onPress={openClientModal}>
            <Text style={styles.modalSaveText}>+ Nouveau</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {clients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun client trouvé</Text>
              <TouchableOpacity
                style={styles.createClientButton}
                onPress={openClientModal}
              >
                <Text style={styles.createClientText}>
                  + Créer le premier client
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.clientsList}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.clientItem,
                    orderForm.clientId === client.id &&
                      styles.clientItemSelected,
                  ]}
                  onPress={() => selectClient(client)}
                >
                  <View style={styles.clientItemContent}>
                    <View style={styles.clientItemHeader}>
                      <Text style={styles.clientItemName}>
                        {client.user?.name || "Nom non disponible"}
                      </Text>
                      {client.companyName && (
                        <Text style={styles.clientItemCompany}>
                          {client.companyName}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.clientItemEmail}>
                      {client.user?.email || "Email non disponible"}
                    </Text>
                    {client.user?.phone && (
                      <Text style={styles.clientItemPhone}>
                        📞 {client.user.phone}
                      </Text>
                    )}
                    {client.defaultDeliveryAddress && (
                      <Text style={styles.clientItemAddress}>
                        📍 {client.defaultDeliveryAddress}
                      </Text>
                    )}
                  </View>
                  {orderForm.clientId === client.id && (
                    <Text style={styles.clientItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Modal pour créer un nouveau client
  const renderClientModal = () => (
    <Modal
      visible={showClientModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeClientModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeClientModal}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nouveau client</Text>
          <TouchableOpacity onPress={handleClientSubmit}>
            <Text style={styles.modalSaveText}>Créer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom complet *</Text>
            <TextInput
              style={styles.formInput}
              value={clientForm.name}
              onChangeText={(text) =>
                setClientForm((prev) => ({ ...prev, name: text }))
              }
              placeholder="Nom et prénom du contact"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email *</Text>
            <TextInput
              style={styles.formInput}
              value={clientForm.email}
              onChangeText={(text) =>
                setClientForm((prev) => ({ ...prev, email: text }))
              }
              placeholder="adresse@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Téléphone</Text>
            <TextInput
              style={styles.formInput}
              value={clientForm.phone}
              onChangeText={(text) =>
                setClientForm((prev) => ({ ...prev, phone: text }))
              }
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Informations entreprise</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom de l'entreprise</Text>
            <TextInput
              style={styles.formInput}
              value={clientForm.companyName}
              onChangeText={(text) =>
                setClientForm((prev) => ({ ...prev, companyName: text }))
              }
              placeholder="Nom de l'entreprise (optionnel)"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Personne de contact</Text>
            <TextInput
              style={styles.formInput}
              value={clientForm.contactPerson}
              onChangeText={(text) =>
                setClientForm((prev) => ({ ...prev, contactPerson: text }))
              }
              placeholder="Personne de contact dans l'entreprise"
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.sectionTitle}>Adresses</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Adresse de livraison par défaut *
            </Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={clientForm.defaultDeliveryAddress}
              onChangeText={(text) =>
                setClientForm((prev) => ({
                  ...prev,
                  defaultDeliveryAddress: text,
                }))
              }
              placeholder="Adresse complète de livraison"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Adresse de collecte par défaut</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={clientForm.defaultPickupAddress}
              onChangeText={(text) =>
                setClientForm((prev) => ({
                  ...prev,
                  defaultPickupAddress: text,
                }))
              }
              placeholder="Adresse de collecte (optionnel)"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Préférences</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Heure de collecte préférée</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerPlaceholder}>
                {clientForm.preferredPickupTime === "morning"
                  ? "Matin (8h-12h)"
                  : clientForm.preferredPickupTime === "afternoon"
                  ? "Après-midi (12h-17h)"
                  : clientForm.preferredPickupTime === "evening"
                  ? "Soir (17h-20h)"
                  : "Sélectionner une préférence"}
              </Text>
            </View>
            {/* Note: Implémenter un vrai picker plus tard */}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Instructions spéciales</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={clientForm.specialInstructions}
              onChangeText={(text) =>
                setClientForm((prev) => ({
                  ...prev,
                  specialInstructions: text,
                }))
              }
              placeholder="Instructions particulières pour ce client"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Conditions commerciales</Text>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>Limite de crédit (€)</Text>
              <TextInput
                style={styles.formInput}
                value={clientForm.creditLimit}
                onChangeText={(text) =>
                  setClientForm((prev) => ({ ...prev, creditLimit: text }))
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>Délai de paiement (jours)</Text>
              <TextInput
                style={styles.formInput}
                value={clientForm.paymentTerms}
                onChangeText={(text) =>
                  setClientForm((prev) => ({ ...prev, paymentTerms: text }))
                }
                placeholder="30"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion de la Blanchisserie</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenue, {session?.user?.name || "Manager"}
        </Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "products" && styles.activeTab]}
            onPress={() => setActiveTab("products")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "products" && styles.activeTabText,
              ]}
            >
              🧺 Produits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "orders" && styles.activeTab]}
            onPress={() => setActiveTab("orders")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "orders" && styles.activeTabText,
              ]}
            >
              📦 Commandes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "deliveries" && styles.activeTab]}
            onPress={() => setActiveTab("deliveries")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "deliveries" && styles.activeTabText,
              ]}
            >
              🚚 Livraisons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "stats" && styles.activeTab]}
            onPress={() => setActiveTab("stats")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "stats" && styles.activeTabText,
              ]}
            >
              📊 Statistiques
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenu des onglets */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "products" && renderProductsTab()}
        {activeTab === "orders" && renderOrdersTab()}
        {activeTab === "deliveries" && renderDeliveriesTab()}
        {activeTab === "stats" && renderStatsTab()}
      </ScrollView>

      {/* Modals */}
      {renderClientSelectorModal()}
      {renderClientModal()}
      {renderProductModal()}
      {renderOrderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeTabText: {
    color: "#007AFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingTop: 20,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Styles pour les produits
  productsList: {
    gap: 16,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
  },
  productDetails: {
    gap: 8,
    marginBottom: 16,
  },
  productDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productDetailLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  productDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  productActions: {
    flexDirection: "row",
    gap: 12,
  },
  // Styles pour les commandes
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  orderClient: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  orderStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  orderDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 12,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDetailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    width: 80,
  },
  orderDetailValue: {
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  orderItemName: {
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: "#8E8E93",
    marginHorizontal: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  orderActions: {
    flexDirection: "row",
    gap: 12,
  },
  // Styles pour les livraisons
  deliveriesList: {
    gap: 16,
  },
  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  deliveryClient: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  deliveryDate: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  deliveryDetails: {
    gap: 8,
    marginBottom: 16,
  },
  deliveryDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryDetailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    width: 80,
  },
  deliveryDetailValue: {
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
  },
  deliveryActions: {
    flexDirection: "row",
    gap: 12,
  },
  // Styles pour les statistiques
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
  },
  chartSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  chartPlaceholder: {
    alignItems: "center",
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  topProductsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
    paddingBottom: 8,
  },
  topProductsList: {
    gap: 12,
  },
  topProductItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  topProductRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topProductRankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  topProductSales: {
    fontSize: 12,
    color: "#8E8E93",
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CAF50",
  },
  // Styles communs pour les boutons
  actionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtonSecondary: {
    backgroundColor: "#F2F2F7",
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  actionButtonSuccess: {
    backgroundColor: "#4CAF50",
  },
  actionButtonTextSuccess: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Styles pour les états de loading et d'erreur
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Styles pour les modals
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  modalSaveText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Styles pour les formulaires
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
  },
  formTextArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  formHint: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: "#8E8E93",
  },
  totalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
  },

  // Styles pour la sélection de client
  clientSection: {
    gap: 12,
  },
  clientPickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerSelected: {
    color: "#1C1C1E",
    fontWeight: "600",
  },
  pickerIcon: {
    fontSize: 18,
  },
  orText: {
    textAlign: "center",
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  createClientButton: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderStyle: "dashed",
  },
  createClientText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },

  // Styles pour la liste des clients
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 20,
    textAlign: "center",
  },
  clientsList: {
    gap: 12,
  },
  clientItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  clientItemSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  clientItemContent: {
    flex: 1,
  },
  clientItemHeader: {
    marginBottom: 4,
  },
  clientItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  clientItemCompany: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  clientItemEmail: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  clientItemPhone: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  clientItemAddress: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 18,
  },
  clientItemCheck: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "700",
  },
});
