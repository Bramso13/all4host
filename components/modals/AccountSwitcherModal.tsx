import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useAccountSwitcher } from "~/context/AccountSwitcherContext";

interface AccountSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    savedAccounts,
    currentAccount,
    switchToAccount,
    removeAccount,
    addAccount,
    isLoading,
  } = useAccountSwitcher();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSwitchAccount = async (accountId: string) => {
    try {
      setIsProcessing(true);
      await switchToAccount(accountId);
      onClose();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de se connecter à ce compte");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newEmail || !newPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      setIsProcessing(true);
      await addAccount(newEmail, newPassword);
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      Alert.alert("Succès", "Compte ajouté avec succès");
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ajouter ce compte. Vérifiez vos identifiants."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      "Supprimer le compte",
      `Êtes-vous sûr de vouloir supprimer le compte ${accountName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => removeAccount(accountId),
        },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "pole_manager":
        return "Manager";
      case "agent":
        return "Agent";
      case "property_owner":
        return "Propriétaire";
      case "laundry_client":
        return "Client Blanchisserie";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "#FF6B35";
      case "pole_manager":
        return "#4CAF50";
      case "agent":
        return "#2196F3";
      case "property_owner":
        return "#9C27B0";
      case "laundry_client":
        return "#FF9800";
      default:
        return "#757575";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Comptes</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {currentAccount && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compte Actuel</Text>
              <View style={[styles.accountCard, styles.currentAccountCard]}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{currentAccount.name}</Text>
                  <Text style={styles.accountEmail}>
                    {currentAccount.email}
                  </Text>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleColor(currentAccount.role) },
                    ]}
                  >
                    <Text style={styles.roleText}>
                      {getRoleLabel(currentAccount.role)}
                    </Text>
                  </View>
                </View>
                <View style={styles.currentIndicator}>
                  <Text style={styles.currentText}>Actuel</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Comptes Sauvegardés</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(!showAddForm)}
              >
                <Text style={styles.addButtonText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {showAddForm && (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>
                  Ajouter un nouveau compte
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                </View>
                <View style={styles.addFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddForm(false);
                      setNewEmail("");
                      setNewPassword("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (isProcessing || !newEmail || !newPassword) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleAddAccount}
                    disabled={isProcessing || !newEmail || !newPassword}
                  >
                    <Text style={styles.submitButtonText}>
                      {isProcessing ? "Ajout..." : "Ajouter"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.accountsList}>
              {savedAccounts.length > 0 ? (
                savedAccounts.map((account) => (
                  <View key={account.id} style={styles.accountCard}>
                    <TouchableOpacity
                      style={styles.accountInfo}
                      onPress={() => handleSwitchAccount(account.id)}
                      disabled={
                        isProcessing || account.id === currentAccount?.id
                      }
                    >
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountEmail}>{account.email}</Text>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: getRoleColor(account.role) },
                        ]}
                      >
                        <Text style={styles.roleText}>
                          {getRoleLabel(account.role)}
                        </Text>
                      </View>
                      <Text style={styles.lastUsed}>
                        Dernière connexion:{" "}
                        {new Date(account.lastUsed).toLocaleDateString("fr-FR")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() =>
                        handleRemoveAccount(account.id, account.name)
                      }
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Aucun compte sauvegardé
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Ajoutez un compte pour pouvoir basculer rapidement entre
                    différents comptes
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addForm: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1C1C1E",
    backgroundColor: "#FFFFFF",
  },
  addFormButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    paddingVertical: 12,
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
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentAccountCard: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  lastUsed: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  currentIndicator: {
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  removeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
    maxWidth: 280,
  },
});
