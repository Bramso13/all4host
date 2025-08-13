import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

const TasksScreen = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  // Données mockées pour l'exemple
  const tasks = [
    {
      id: 1,
      title: "Nettoyage appartement",
      status: "en_cours",
      priority: "normale",
      address: "123 rue de Paris",
      time: "14:00",
      date: "2024-01-20",
    },
    {
      id: 2,
      title: "Maintenance chaudière",
      status: "à_faire",
      priority: "urgente",
      address: "45 avenue Victor Hugo",
      time: "09:30",
      date: "2024-01-20",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Tâches</Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "all" && styles.activeFilter,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text style={styles.filterText}>Toutes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "pending" && styles.activeFilter,
          ]}
          onPress={() => setActiveFilter("pending")}
        >
          <Text style={styles.filterText}>À faire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "inProgress" && styles.activeFilter,
          ]}
          onPress={() => setActiveFilter("inProgress")}
        >
          <Text style={styles.filterText}>En cours</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.taskList}>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => router.push(`/agent/tasks/${task.id}`)}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View
                style={[
                  styles.priorityBadge,
                  task.priority === "urgente" && styles.urgentBadge,
                ]}
              >
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskAddress}>{task.address}</Text>
              <Text style={styles.taskTime}>
                {task.time} - {task.date}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                task.status === "en_cours" && styles.inProgressBadge,
              ]}
            >
              <Text style={styles.statusText}>{task.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  filters: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeFilter: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    color: "#333",
  },
  taskList: {
    padding: 10,
  },
  taskCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
  },
  urgentBadge: {
    backgroundColor: "#FFE5E5",
  },
  priorityText: {
    color: "#333",
    fontSize: 12,
  },
  taskInfo: {
    marginTop: 10,
  },
  taskAddress: {
    color: "#666",
  },
  taskTime: {
    color: "#666",
    marginTop: 5,
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  inProgressBadge: {
    backgroundColor: "#E5F6FF",
  },
  statusText: {
    color: "#333",
    fontSize: 12,
  },
});

export default TasksScreen;
