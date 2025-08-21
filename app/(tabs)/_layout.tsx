import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { Tabs } from "expo-router";
import { HapticTab } from "~/components/HapticTab";
import TabBarBackground from "~/components/ui/TabBarBackground";
import { IconSymbol } from "~/components/ui/IconSymbol";
import { MaterialIcons } from "@expo/vector-icons";

import { AuthScreen } from "~/components/screen/AuthScreen";
import { authClient } from "~/lib/auth-client";
import { useAccountSwitcher } from "~/context/AccountSwitcherContext";
import { AccountSwitcherModal } from "~/components/modals/AccountSwitcherModal";

import { AgentProvider } from "~/context/AgentContext";
import { CleaningProvider } from "~/context/CleaningContext";
import { BlanchisserieProvider } from "~/context/BlanchisserieContext";
import { MaintenanceProvider } from "~/context/MaintenanceContext";
import { ConciergerieProvider } from "~/context/ConciergerieContext";

import { AgentProfileProvider } from "~/context/AgentProfileContext";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function TabLayout() {
  const { data: session } = authClient.useSession();
  const user = session?.user as unknown as User;
  const { currentAccount } = useAccountSwitcher();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  if (!user) {
    return <AuthScreen />;
  }

  const HeaderComponent = () => (
    <View style={styles.headerContainer}>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>
          {currentAccount?.name || user?.name || "Utilisateur"}
        </Text>
        <Text style={styles.accountRole}>
          {user.role === "super_admin"
            ? "Super Admin"
            : user.role === "agent"
            ? "Agent"
            : user.role === "pole_manager"
            ? "Manager"
            : user.role === "property_owner"
            ? "Propriétaire"
            : user.role === "laundry_client"
            ? "Client Blanchisserie"
            : user.role}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.accountSwitchButton}
        onPress={() => setShowAccountSwitcher(true)}
      >
        <Text style={styles.accountSwitchButtonText}>👤 Comptes</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabsForRole = () => {
    switch (user?.role) {
      case "super_admin":
        return (
          <ConciergerieProvider>
            <AgentProvider>
              <MaintenanceProvider>
                <BlanchisserieProvider>
                  <CleaningProvider>
                    <Tabs
                      screenOptions={{
                        headerShown: false,
                        tabBarButton: HapticTab,
                        tabBarBackground: TabBarBackground,
                        tabBarStyle: Platform.select({
                          ios: { position: "absolute" },
                          default: {},
                        }),
                      }}
                    >
                      <Tabs.Screen
                        name="index"
                        options={{
                          title: "Dashboard",
                          tabBarIcon: ({ color }) => (
                            <IconSymbol
                              size={28}
                              name="chart.bar.fill"
                              color={color}
                            />
                          ),
                        }}
                      />
                      <Tabs.Screen
                        name="super_admin/conciergerie/index"
                        options={{
                          title: "Conciergerie",
                          tabBarIcon: ({ color }) => (
                            <IconSymbol
                              size={28}
                              name="bell.fill"
                              color={color}
                            />
                          ),
                        }}
                      />
                      <Tabs.Screen
                        name="super_admin/nettoyage/index"
                        options={{
                          title: "Nettoyage",
                          tabBarIcon: ({ color }) => (
                            <IconSymbol
                              size={28}
                              name="house.fill"
                              color={color}
                            />
                          ),
                        }}
                      />
                      <Tabs.Screen
                        name="super_admin/blachisserie/index"
                        options={{
                          title: "Blanchisserie",
                          tabBarIcon: ({ color }) => (
                            <MaterialIcons
                              size={28}
                              name="local-laundry-service"
                              color={color}
                            />
                          ),
                        }}
                      />
                      <Tabs.Screen
                        name="super_admin/maintenance/index"
                        options={{
                          title: "Maintenance",
                          tabBarIcon: ({ color }) => (
                            <MaterialIcons
                              size={28}
                              name="build"
                              color={color}
                            />
                          ),
                        }}
                      />
                      {/* Masquer les onglets agent */}
                      <Tabs.Screen
                        name="agent/tasks/index"
                        options={{
                          href: null,
                        }}
                      />
                      <Tabs.Screen
                        name="agent/settings/index"
                        options={{
                          href: null,
                        }}
                      />
                      <Tabs.Screen
                        name="property_owner/properties/index"
                        options={{ href: null }}
                      />
                    </Tabs>
                  </CleaningProvider>
                </BlanchisserieProvider>
              </MaintenanceProvider>
            </AgentProvider>
          </ConciergerieProvider>
        );

      case "agent":
        return (
          <AgentProfileProvider>
            <AgentProvider>
              <Tabs
                screenOptions={{
                  headerShown: false,
                  tabBarButton: HapticTab,
                  tabBarBackground: TabBarBackground,
                  tabBarStyle: Platform.select({
                    ios: { position: "absolute" },
                    default: {},
                  }),
                }}
              >
                <Tabs.Screen
                  name="index"
                  options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => (
                      <IconSymbol
                        size={28}
                        name="chart.bar.fill"
                        color={color}
                      />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="agent/tasks/index"
                  options={{
                    title: "Tâches",
                    tabBarIcon: ({ color }) => (
                      <MaterialIcons
                        size={28}
                        name="assignment"
                        color={color}
                      />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="agent/settings/index"
                  options={{
                    title: "Paramètres",
                    tabBarIcon: ({ color }) => (
                      <MaterialIcons size={28} name="settings" color={color} />
                    ),
                  }}
                />
                {/* Masquer les onglets super_admin */}
                <Tabs.Screen
                  name="super_admin/conciergerie/index"
                  options={{
                    href: null,
                  }}
                />
                <Tabs.Screen
                  name="super_admin/nettoyage/index"
                  options={{
                    href: null,
                  }}
                />
                <Tabs.Screen
                  name="super_admin/blachisserie/index"
                  options={{
                    href: null,
                  }}
                />
                <Tabs.Screen
                  name="super_admin/maintenance/index"
                  options={{
                    href: null,
                  }}
                />
                <Tabs.Screen
                  name="property_owner/properties/index"
                  options={{ href: null }}
                />
              </Tabs>
            </AgentProvider>
          </AgentProfileProvider>
        );

      case "pole_manager":
        return (
          <ConciergerieProvider>
            <AgentProvider>
              <Tabs
                screenOptions={{
                  headerShown: false,
                  tabBarButton: HapticTab,
                  tabBarBackground: TabBarBackground,
                  tabBarStyle: Platform.select({
                    ios: { position: "absolute" },
                    default: {},
                  }),
                }}
              >
                <Tabs.Screen
                  name="index"
                  options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => (
                      <IconSymbol
                        size={28}
                        name="chart.bar.fill"
                        color={color}
                      />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="super_admin/conciergerie/index"
                  options={{
                    title: "Conciergerie",
                    tabBarIcon: ({ color }) => (
                      <IconSymbol size={28} name="bell.fill" color={color} />
                    ),
                  }}
                />
                {/* Masquer tous les autres onglets */}
                <Tabs.Screen
                  name="super_admin/nettoyage/index"
                  options={{ href: null }}
                />
                <Tabs.Screen
                  name="super_admin/blachisserie/index"
                  options={{ href: null }}
                />
                <Tabs.Screen
                  name="super_admin/maintenance/index"
                  options={{ href: null }}
                />
                <Tabs.Screen
                  name="agent/tasks/index"
                  options={{ href: null }}
                />
                <Tabs.Screen
                  name="agent/settings/index"
                  options={{ href: null }}
                />
                <Tabs.Screen
                  name="property_owner/properties/index"
                  options={{ href: null }}
                />
              </Tabs>
            </AgentProvider>
          </ConciergerieProvider>
        );

      case "laundry_client":
        return (
          <BlanchisserieProvider>
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                  ios: { position: "absolute" },
                  default: {},
                }),
              }}
            >
              <Tabs.Screen
                name="index"
                options={{
                  title: "Dashboard",
                  tabBarIcon: ({ color }) => (
                    <IconSymbol size={28} name="chart.bar.fill" color={color} />
                  ),
                }}
              />
              <Tabs.Screen
                name="super_admin/blachisserie/index"
                options={{
                  title: "Commandes",
                  tabBarIcon: ({ color }) => (
                    <MaterialIcons
                      size={28}
                      name="local-laundry-service"
                      color={color}
                    />
                  ),
                }}
              />
              {/* Masquer tous les autres onglets */}
              <Tabs.Screen
                name="super_admin/conciergerie/index"
                options={{ href: null }}
              />
              <Tabs.Screen
                name="super_admin/nettoyage/index"
                options={{ href: null }}
              />
              <Tabs.Screen
                name="super_admin/maintenance/index"
                options={{ href: null }}
              />
              <Tabs.Screen name="agent/tasks/index" options={{ href: null }} />
              <Tabs.Screen
                name="agent/settings/index"
                options={{ href: null }}
              />
              <Tabs.Screen
                name="property_owner/properties/index"
                options={{ href: null }}
              />
            </Tabs>
          </BlanchisserieProvider>
        );

      case "property_owner":
        return (
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
              tabBarStyle: Platform.select({
                ios: { position: "absolute" },
                default: {},
              }),
            }}
          >
            <Tabs.Screen
              name="property_owner/properties/index"
              options={{
                title: "Propriétés",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="index"
              options={{
                title: "Dashboard",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="chart.bar.fill" color={color} />
                ),
              }}
            />

            {/* Masquer TOUS les autres onglets */}
            <Tabs.Screen
              name="super_admin/conciergerie/index"
              options={{ href: null }}
            />
            <Tabs.Screen
              name="super_admin/nettoyage/index"
              options={{ href: null }}
            />
            <Tabs.Screen
              name="super_admin/blachisserie/index"
              options={{ href: null }}
            />
            <Tabs.Screen
              name="super_admin/maintenance/index"
              options={{ href: null }}
            />
            <Tabs.Screen name="agent/tasks/index" options={{ href: null }} />
            <Tabs.Screen name="agent/settings/index" options={{ href: null }} />
          </Tabs>
        );

      default:
        return (
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
              tabBarStyle: Platform.select({
                ios: { position: "absolute" },
                default: {},
              }),
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Dashboard",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="chart.bar.fill" color={color} />
                ),
              }}
            />
            {/* Masquer TOUS les onglets pour les rôles non reconnus */}
            <Tabs.Screen
              name="super_admin/conciergerie/index"
              options={{ href: null }}
            />
            <Tabs.Screen
              name="super_admin/nettoyage/index"
              options={{ href: null }}
            />
            <Tabs.Screen
              name="super_admin/blachisserie/index"
              options={{ href: null }}
            />
            <Tabs.Screen
              name="super_admin/maintenance/index"
              options={{ href: null }}
            />
            <Tabs.Screen name="agent/tasks/index" options={{ href: null }} />
            <Tabs.Screen name="agent/settings/index" options={{ href: null }} />
            <Tabs.Screen
              name="property_owner/properties/index"
              options={{ href: null }}
            />
          </Tabs>
        );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <HeaderComponent />

      {
        <View style={{ flex: 1, backgroundColor: "red" }}>
          {renderTabsForRole()}
        </View>
      }
      <AccountSwitcherModal
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  accountRole: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  accountSwitchButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  accountSwitchButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
