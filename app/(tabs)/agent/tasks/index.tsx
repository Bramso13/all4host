"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  useMyAgentProfile,
  useMyAgentStats,
  useMyActiveTasks,
  useMyUpcomingSessions,
} from "~/context/AgentProfileContext";
import { authClient } from "~/lib/auth-client";
import { SessionStatus } from "~/lib/types";

// Types pour les données des tâches
interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  avgCompletionTime: number;
  todayTasks: number;
  weekTasks: number;
  overdueTask: number;
}

interface TaskActivity {
  id: string;
  type: "task" | "cleaning" | "maintenance" | "ticket";
  title: string;
  description: string;
  time: string;
  status: "assigned" | "in_progress" | "completed" | "paused" | SessionStatus;
  priority?: "low" | "medium" | "high" | "urgent";
}

interface CleaningWorkflow {
  taskId: string;
  step:
    | "instructions"
    | "before_photos"
    | "cleaning"
    | "after_photos"
    | "completed";
  startTime?: number;
  beforePhotos: string[];
  afterPhotos: string[];
}

export default function AgentTasksPage() {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "overdue"
  >("active");
  const [cleaningWorkflow, setCleaningWorkflow] =
    useState<CleaningWorkflow | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { myProfile, isLoading, error, startMyTask, completeMyTask, myTasks } =
    useMyAgentProfile();

  const activeTasks = useMyActiveTasks();
  const completedTasks = myTasks.filter((task) => task.status === "completed");
  const upcomingSessions = useMyUpcomingSessions();

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "task":
        return "📋";
      case "cleaning":
        return "🧹";
      case "maintenance":
        return "🔧";
      case "ticket":
        return "🎫";
      default:
        return "📋";
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case "task":
        return "#007AFF";
      case "cleaning":
        return "#34C759";
      case "maintenance":
        return "#FF3B30";
      case "ticket":
        return "#FF9500";
      default:
        return "#8E8E93";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "#FF3B30";
      case "high":
        return "#FF9500";
      case "medium":
        return "#007AFF";
      case "low":
        return "#34C759";
      default:
        return "#8E8E93";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#34C759";
      case "in_progress":
        return "#007AFF";
      case "assigned":
        return "#FF9500";
      case "paused":
        return "#8E8E93";
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assignée";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminée";
      case "paused":
        return "En pause";
      default:
        return "Inconnu";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Filtrer uniquement les tâches d'aujourd'hui
  const today = new Date();
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  // Créer les activités de tâches d'aujourd'hui uniquement
  const todayActiveTasks = activeTasks.filter((task) =>
    isToday(task.assignedAt)
  );
  const todayUpcomingSessions = upcomingSessions.filter((session) =>
    isToday(session.scheduledDate)
  );

  const taskActivities: TaskActivity[] = [
    ...todayActiveTasks.map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      description: task.description || "Tâche assignée",
      time: formatDateTime(task.assignedAt),
      status: task.status as any,
      priority: task.priority as any,
    })),
    ...todayUpcomingSessions.map((session) => ({
      id: session.id,
      type: ("cleaningType" in session ? "cleaning" : "maintenance") as
        | "cleaning"
        | "maintenance",
      title:
        "cleaningType" in session ? "Session nettoyage" : "Session maintenance",
      description: `${session.property?.name} - ${new Date(
        session.scheduledDate
      ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      time: formatDateTime(session.scheduledDate),
      status: session.status as SessionStatus,
      priority: "medium" as any,
    })),
  ];

  // Filtrer les tâches selon le filtre sélectionné
  const filteredTasks = taskActivities.filter((task) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "active")
      return (
        task.status === "assigned" ||
        task.status === "in_progress" ||
        task.status === "planned"
      );
    if (selectedFilter === "overdue") {
      return task.priority === "urgent" || task.priority === "high";
    }
    return true;
  });

  const taskStats: TaskStats = {
    totalTasks: todayActiveTasks.length,
    activeTasks: todayActiveTasks.filter(
      (task) =>
        task.status === "assigned" ||
        task.status === "in_progress" ||
        task.status === "planned"
    ).length,
    completedTasks: 0, // Pas de tâches terminées affichées aujourd'hui
    avgCompletionTime: 2.5,
    todayTasks: todayActiveTasks.length,
    weekTasks: 0,
    overdueTask: todayActiveTasks.filter(
      (task) => task.priority === "urgent" || task.priority === "high"
    ).length,
  };

  // Fonctions pour le workflow de nettoyage
  const startCleaningWorkflow = (taskId: string) => {
    setCleaningWorkflow({
      taskId,
      step: "instructions",
      beforePhotos: [],
      afterPhotos: [],
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la caméra est nécessaire pour prendre des photos"
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  const addBeforePhoto = async () => {
    const photo = await takePhoto();
    if (photo && cleaningWorkflow) {
      setCleaningWorkflow({
        ...cleaningWorkflow,
        beforePhotos: [...cleaningWorkflow.beforePhotos, photo],
      });
    }
  };

  const addAfterPhoto = async () => {
    const photo = await takePhoto();
    if (photo && cleaningWorkflow) {
      setCleaningWorkflow({
        ...cleaningWorkflow,
        afterPhotos: [...cleaningWorkflow.afterPhotos, photo],
      });
    }
  };

  const startCleaning = () => {
    if (cleaningWorkflow) {
      const startTime = Date.now();
      setCleaningWorkflow({
        ...cleaningWorkflow,
        step: "cleaning",
        startTime,
      });
      startMyTask(cleaningWorkflow.taskId);

      // Démarrer le timer
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      // Stocker le timer pour le nettoyer plus tard
      (cleaningWorkflow as any).timer = timer;
    }
  };

  const finishCleaning = () => {
    if (cleaningWorkflow) {
      // Arrêter le timer
      if ((cleaningWorkflow as any).timer) {
        clearInterval((cleaningWorkflow as any).timer);
      }

      setCleaningWorkflow({
        ...cleaningWorkflow,
        step: "after_photos",
      });
    }
  };

  const completeCleaning = async () => {
    if (cleaningWorkflow) {
      await completeMyTask(cleaningWorkflow.taskId);
      setCleaningWorkflow(null);
      setElapsedTime(0);
      Alert.alert("Félicitations!", "Tâche de nettoyage terminée avec succès.");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${secs
        .toString()
        .padStart(2, "0")}s`;
    }
    return `${minutes.toString().padStart(2, "0")}m ${secs
      .toString()
      .padStart(2, "0")}s`;
  };

  async function signOut() {
    await authClient.signOut();
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de vos tâches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!myProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Profil agent non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Mes Tâches</Text>
            <Text style={styles.headerSubtitle}>
              {myProfile.user?.firstName || myProfile.user?.name} • Agent{" "}
              {myProfile.agentType}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête de la journée */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderTitle}>📅 Aujourd'hui</Text>
          <Text style={styles.dayHeaderDate}>
            {today.toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Vue d'ensemble des tâches */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{taskStats.totalTasks}</Text>
              <Text style={styles.overviewLabel}>Total tâches</Text>
              <Text style={styles.overviewChange}>
                +{taskStats.todayTasks} aujourd'hui
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{taskStats.activeTasks}</Text>
              <Text style={styles.overviewLabel}>Tâches actives</Text>
              <Text
                style={[
                  styles.overviewChange,
                  { color: taskStats.activeTasks > 0 ? "#FF9500" : "#34C759" },
                ]}
              >
                {taskStats.activeTasks > 0 ? "En cours" : "À jour"}
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>
                {taskStats.completedTasks}
              </Text>
              <Text style={styles.overviewLabel}>Terminées</Text>
              <Text style={styles.overviewChange}>Cette semaine</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>
                {taskStats.avgCompletionTime}h
              </Text>
              <Text style={styles.overviewLabel}>Temps moyen</Text>
              <Text style={styles.overviewChange}>Par tâche</Text>
            </View>
          </View>
        </View>

        {/* Filtres de tâches */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Mes tâches</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "active" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("active")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === "active" && styles.activeFilterButtonText,
                ]}
              >
                À faire ({taskStats.activeTasks})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "overdue" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("overdue")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === "overdue" && styles.activeFilterButtonText,
                ]}
              >
                Urgentes ({taskStats.overdueTask})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "all" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === "all" && styles.activeFilterButtonText,
                ]}
              >
                Toutes ({taskActivities.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Liste des tâches */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Liste des tâches</Text>
            <Text style={styles.sectionBadge}>{filteredTasks.length}</Text>
          </View>

          <View style={styles.tasksList}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View
                    style={[
                      styles.taskIcon,
                      { backgroundColor: getTaskTypeColor(task.type) + "20" },
                    ]}
                  >
                    <Text style={styles.taskIconText}>
                      {getTaskTypeIcon(task.type)}
                    </Text>
                  </View>
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={styles.taskBadges}>
                        {task.priority && (
                          <View
                            style={[
                              styles.priorityBadge,
                              {
                                backgroundColor: getPriorityColor(
                                  task.priority
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.priorityBadgeText}>
                              {task.priority.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(task.status) },
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {getStatusLabel(task.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                    <Text style={styles.taskTime}>{task.time}</Text>
                  </View>
                  <View style={styles.taskActions}>
                    {task.status === "assigned" ||
                      (task.status === "planned" && (
                        <TouchableOpacity
                          style={[
                            styles.taskActionButton,
                            { backgroundColor: "#007AFF" },
                          ]}
                          onPress={() => {
                            if (task.type === "cleaning") {
                              startCleaningWorkflow(task.id);
                            } else {
                              startMyTask(task.id);
                            }
                          }}
                        >
                          <Text style={styles.taskActionButtonText}>
                            Commencer
                          </Text>
                        </TouchableOpacity>
                      ))}
                    {task.status === "in_progress" && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.taskActionButton,
                            { backgroundColor: "#34C759" },
                          ]}
                          onPress={() => completeMyTask(task.id)}
                        >
                          <Text style={styles.taskActionButtonText}>
                            Terminer
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.taskActionButton,
                            { backgroundColor: "#8E8E93" },
                          ]}
                          onPress={() => console.log("Pause task:", task.id)}
                        >
                          <Text style={styles.taskActionButtonText}>Pause</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {task.status === "paused" && (
                      <TouchableOpacity
                        style={[
                          styles.taskActionButton,
                          { backgroundColor: "#007AFF" },
                        ]}
                        onPress={() => startMyTask(task.id)}
                      >
                        <Text style={styles.taskActionButtonText}>
                          Reprendre
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>✅</Text>
                <Text style={styles.emptyStateText}>
                  {selectedFilter === "all"
                    ? "Aucune tâche trouvée"
                    : `Aucune tâche ${
                        selectedFilter === "active"
                          ? "active"
                          : selectedFilter === "completed"
                          ? "terminée"
                          : "urgente"
                      }`}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {selectedFilter === "all"
                    ? "Vous n'avez pas de tâches assignées"
                    : "Changez de filtre pour voir d'autres tâches"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton de déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal du workflow de nettoyage */}
      <Modal
        visible={cleaningWorkflow !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {cleaningWorkflow && (
          <View style={styles.workflowContainer}>
            {/* Étape Instructions */}
            {cleaningWorkflow.step === "instructions" && (
              <View style={styles.workflowStep}>
                <View style={styles.workflowHeader}>
                  <Text style={styles.workflowTitle}>
                    📋 Instructions de nettoyage
                  </Text>
                  <TouchableOpacity
                    style={styles.workflowCloseButton}
                    onPress={() => setCleaningWorkflow(null)}
                  >
                    <Text style={styles.workflowCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.workflowContent}>
                  <View style={styles.instructionCard}>
                    <Text style={styles.instructionTitle}>
                      📸 Étapes à suivre :
                    </Text>
                    <View style={styles.instructionList}>
                      <Text style={styles.instructionItem}>
                        1. Prendre des photos AVANT le nettoyage de chaque pièce
                      </Text>
                      <Text style={styles.instructionItem}>
                        2. Commencer le nettoyage (le chrono se lance
                        automatiquement)
                      </Text>
                      <Text style={styles.instructionItem}>
                        3. Prendre des photos APRÈS le nettoyage de chaque pièce
                      </Text>
                      <Text style={styles.instructionItem}>
                        4. Valider la tâche terminée
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionCard}>
                    <Text style={styles.instructionTitle}>
                      🧹 Points de contrôle :
                    </Text>
                    <View style={styles.instructionList}>
                      <Text style={styles.instructionItem}>
                        • Passer l'aspirateur dans toutes les pièces
                      </Text>
                      <Text style={styles.instructionItem}>
                        • Nettoyer les surfaces (tables, plans de travail)
                      </Text>
                      <Text style={styles.instructionItem}>
                        • Désinfecter salle de bain et WC
                      </Text>
                      <Text style={styles.instructionItem}>
                        • Vider les poubelles
                      </Text>
                      <Text style={styles.instructionItem}>
                        • Ranger et organiser l'espace
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.workflowFooter}>
                  <TouchableOpacity
                    style={[
                      styles.workflowButton,
                      { backgroundColor: "#007AFF" },
                    ]}
                    onPress={() =>
                      setCleaningWorkflow({
                        ...cleaningWorkflow,
                        step: "before_photos",
                      })
                    }
                  >
                    <Text style={styles.workflowButtonText}>
                      Commencer les photos AVANT
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Étape Photos AVANT */}
            {cleaningWorkflow.step === "before_photos" && (
              <View style={styles.workflowStep}>
                <View style={styles.workflowHeader}>
                  <Text style={styles.workflowTitle}>
                    📸 Photos AVANT nettoyage
                  </Text>
                </View>

                <ScrollView style={styles.workflowContent}>
                  <Text style={styles.photoInstructions}>
                    Prenez une photo de chaque pièce AVANT de commencer le
                    nettoyage
                  </Text>

                  <View style={styles.photoGrid}>
                    {cleaningWorkflow.beforePhotos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.photoThumbnail}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={addBeforePhoto}
                  >
                    <Text style={styles.photoButtonIcon}>📷</Text>
                    <Text style={styles.photoButtonText}>
                      Prendre une photo
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                <View style={styles.workflowFooter}>
                  <TouchableOpacity
                    style={[
                      styles.workflowButton,
                      { backgroundColor: "#8E8E93" },
                    ]}
                    onPress={() =>
                      setCleaningWorkflow({
                        ...cleaningWorkflow,
                        step: "instructions",
                      })
                    }
                  >
                    <Text style={styles.workflowButtonText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.workflowButton,
                      {
                        backgroundColor:
                          cleaningWorkflow.beforePhotos.length > 0
                            ? "#34C759"
                            : "#C7C7CC",
                      },
                    ]}
                    onPress={startCleaning}
                    disabled={cleaningWorkflow.beforePhotos.length === 0}
                  >
                    <Text style={styles.workflowButtonText}>
                      Démarrer le nettoyage
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Étape Nettoyage en cours */}
            {cleaningWorkflow.step === "cleaning" && (
              <View style={styles.workflowStep}>
                <View style={styles.workflowHeader}>
                  <Text style={styles.workflowTitle}>
                    🧹 Nettoyage en cours
                  </Text>
                </View>

                <View style={styles.workflowContent}>
                  <View style={styles.timerContainer}>
                    <Text style={styles.timerLabel}>Temps écoulé</Text>
                    <Text style={styles.timerDisplay}>
                      {formatTime(elapsedTime)}
                    </Text>
                  </View>

                  <View style={styles.cleaningStatus}>
                    <Text style={styles.cleaningStatusText}>
                      ✅ Nettoyage en cours...
                    </Text>
                    <Text style={styles.cleaningStatusSubtext}>
                      Prenez votre temps et respectez les consignes
                    </Text>
                  </View>
                </View>

                <View style={styles.workflowFooter}>
                  <TouchableOpacity
                    style={[
                      styles.workflowButton,
                      { backgroundColor: "#34C759" },
                    ]}
                    onPress={finishCleaning}
                  >
                    <Text style={styles.workflowButtonText}>
                      J'ai terminé le nettoyage
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Étape Photos APRÈS */}
            {cleaningWorkflow.step === "after_photos" && (
              <View style={styles.workflowStep}>
                <View style={styles.workflowHeader}>
                  <Text style={styles.workflowTitle}>
                    📸 Photos APRÈS nettoyage
                  </Text>
                </View>

                <ScrollView style={styles.workflowContent}>
                  <Text style={styles.photoInstructions}>
                    Prenez une photo de chaque pièce APRÈS le nettoyage
                  </Text>

                  <Text style={styles.timeSpent}>
                    ⏱️ Temps de nettoyage : {formatTime(elapsedTime)}
                  </Text>

                  <View style={styles.photoGrid}>
                    {cleaningWorkflow.afterPhotos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.photoThumbnail}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={addAfterPhoto}
                  >
                    <Text style={styles.photoButtonIcon}>📷</Text>
                    <Text style={styles.photoButtonText}>
                      Prendre une photo
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                <View style={styles.workflowFooter}>
                  <TouchableOpacity
                    style={[
                      styles.workflowButton,
                      {
                        backgroundColor:
                          cleaningWorkflow.afterPhotos.length > 0
                            ? "#34C759"
                            : "#C7C7CC",
                      },
                    ]}
                    onPress={completeCleaning}
                    disabled={cleaningWorkflow.afterPhotos.length === 0}
                  >
                    <Text style={styles.workflowButtonText}>
                      Terminer la tâche
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activePeriodButton: {
    backgroundColor: "#007AFF",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activePeriodButtonText: {
    color: "#FFFFFF",
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionBadge: {
    backgroundColor: "#007AFF",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    textAlign: "center",
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  overviewCard: {
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
  overviewValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 8,
  },
  overviewChange: {
    fontSize: 12,
    fontWeight: "600",
    color: "#34C759",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeFilterButtonText: {
    color: "#FFFFFF",
  },
  tasksSection: {
    marginBottom: 24,
  },
  tasksList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  taskIconText: {
    fontSize: 20,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
    marginRight: 8,
  },
  taskBadges: {
    flexDirection: "row",
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  taskDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
    lineHeight: 18,
  },
  taskTime: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  taskActions: {
    flexDirection: "column",
    gap: 6,
  },
  taskActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  taskActionButtonText: {
    backgroundColor: "#007AFF",
    color: "black",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
  },
  logoutSection: {
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Styles pour l'en-tête du jour
  dayHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  dayHeaderDate: {
    fontSize: 16,
    color: "#8E8E93",
    textTransform: "capitalize",
  },
  // Styles pour le workflow
  workflowContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  workflowStep: {
    flex: 1,
  },
  workflowHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workflowTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  workflowCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  workflowCloseText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  workflowContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  workflowFooter: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E7",
    flexDirection: "row",
    gap: 12,
  },
  workflowButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  workflowButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Instructions
  instructionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  instructionList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 16,
    color: "#1C1C1E",
    lineHeight: 22,
  },
  // Photos
  photoInstructions: {
    fontSize: 16,
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
  },
  photoButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  photoButtonIcon: {
    fontSize: 24,
  },
  photoButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Timer
  timerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  timerLabel: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: "700",
    color: "#007AFF",
    fontFamily: "monospace",
  },
  timeSpent: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34C759",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  // Status de nettoyage
  cleaningStatus: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  cleaningStatusText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#34C759",
    marginBottom: 8,
  },
  cleaningStatusSubtext: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
});
