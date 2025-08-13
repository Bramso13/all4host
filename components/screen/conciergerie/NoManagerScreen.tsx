import { useConciergerie } from "~/context/ConciergerieContext";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";

const NoManagerScreen = ({
  setShowCreateManagerModal,
}: {
  setShowCreateManagerModal: (show: boolean) => void;
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.noManagerContainer}>
        <Text style={styles.noManagerTitle}>Aucun manager de conciergerie</Text>
        <Text style={styles.noManagerText}>
          Vous devez créer un manager de conciergerie pour commencer à gérer vos
          propriétés.
        </Text>
        <TouchableOpacity
          style={styles.createManagerButton}
          onPress={() => setShowCreateManagerModal(true)}
        >
          <Text style={styles.createManagerButtonText}>Créer un manager</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noManagerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  noManagerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noManagerText: {
    fontSize: 16,
    marginBottom: 20,
  },
  createManagerButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  createManagerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NoManagerScreen;
