import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { authClient } from "~/lib/auth-client";
import {
  useBlanchisserie,
  type LaundryProduct,
  type LaundryOrder,
  type LaundryOrderItem,
  type DeliveryNote,
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
    isLoading,
    error,
    fetchProducts,
    fetchOrders,
    fetchDeliveryNotes,
    createProduct,
    updateProduct,
    createOrder,
    updateOrder,
  } = useBlanchisserie();
  const [activeTab, setActiveTab] = useState<TabType>("products");

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
              onPress={(): void => {
                console.log("Ajout de produit demandé");
                Alert.alert(
                  "Information",
                  "Fonctionnalité d'ajout en cours de développement"
                );
              }}
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
            onPress={(): void => {
              console.log("Ajout de produit demandé");
              Alert.alert(
                "Information",
                "Fonctionnalité d'ajout en cours de développement"
              );
            }}
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
                      onPress={(): void => {
                        console.log(
                          `Modification du produit ${product.id} demandée`
                        );
                        Alert.alert(
                          "Information",
                          "Fonctionnalité de modification en cours de développement"
                        );
                      }}
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
              onPress={(): void => {
                console.log("Ajout de commande demandé");
                Alert.alert(
                  "Information",
                  "Fonctionnalité d'ajout en cours de développement"
                );
              }}
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
            onPress={(): void => {
              console.log("Ajout de commande demandé");
              Alert.alert(
                "Information",
                "Fonctionnalité d'ajout en cours de développement"
              );
            }}
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
    const ordersThisMonth = validateOrdersData() ? orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    }).length : 0;
    
    // Chiffre d'affaires total
    const totalRevenue = validateOrdersData() ? orders
      .filter(order => order.status === 'completed' || order.status === 'delivered')
      .reduce((sum, order) => sum + (typeof order.totalAmount === 'number' ? order.totalAmount : 0), 0) : 0;
    
    // Livraisons effectuées
    const completedDeliveries = validateDeliveryNotesData() ? deliveryNotes.length : 0;
    
    // Note de satisfaction (placeholder car pas de données de satisfaction dans le contexte)
    const satisfactionScore = 'N/A';
    
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
              <Text style={styles.statValue}>{totalRevenue.toLocaleString('fr-FR')}€</Text>
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
              products.slice(0, 3).map((product, index) => {
                if (!product || !product.id) return null;
                
                // Calculer les ventes réelles pour ce produit depuis les commandes
                const productSales = validateOrdersData() ? orders
                  .filter(order => order.items && Array.isArray(order.items))
                  .reduce((totalSales, order) => {
                    if (!order.items || !Array.isArray(order.items)) return totalSales;
                    const productItems = order.items.filter(item => 
                      item && item.product && item.product.id === product.id
                    );
                    return totalSales + productItems.reduce((sum, item) => 
                      sum + (typeof item.quantity === 'number' ? item.quantity : 0), 0
                    );
                  }, 0) : 0;
                
                // Calculer le chiffre d'affaires pour ce produit
                const productRevenue = validateOrdersData() ? orders
                  .filter(order => order.items && Array.isArray(order.items))
                  .reduce((totalRevenue, order) => {
                    if (!order.items || !Array.isArray(order.items)) return totalRevenue;
                    const productItems = order.items.filter(item => 
                      item && item.product && item.product.id === product.id
                    );
                    return totalRevenue + productItems.reduce((sum, item) => 
                      sum + (typeof item.subtotal === 'number' ? item.subtotal : 0), 0
                    );
                  }, 0) : 0;
                  
                return (
                  <View key={product.id} style={styles.topProductItem}>
                    <View style={styles.topProductRank}>
                      <Text style={styles.topProductRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.topProductInfo}>
                      <Text style={styles.topProductName}>{product.name || 'Produit sans nom'}</Text>
                      <Text style={styles.topProductSales}>{productSales} ventes</Text>
                    </View>
                    <Text style={styles.topProductRevenue}>{productRevenue.toLocaleString('fr-FR')}€</Text>
                  </View>
                );
              }).filter(item => item !== null)
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Aucun produit disponible pour les statistiques</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: 50,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
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
    marginBottom: 16,
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
});
