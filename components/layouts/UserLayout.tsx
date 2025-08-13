import { View, Text, Platform } from "react-native";
import { PropertyProvider } from "~/context/PropertyContext";
import { HapticTab } from "../HapticTab";
import TabBarBackground from "../ui/TabBarBackground";
import { Tabs } from "expo-router";
import { IconSymbol } from "../ui/IconSymbol";
import { MaterialIcons } from "@expo/vector-icons";
import { AgentProvider } from "~/context/AgentContext";
import { CleaningProvider } from "~/context/CleaningContext";
import {
  BlanchisserieProvider,
  MaintenanceProvider,
  ConciergerieProvider,
} from "~/context";

const UserLayout = () => {
  return (
    <MaintenanceProvider>
      <BlanchisserieProvider>
        <CleaningProvider>
          <ConciergerieProvider>
            <AgentProvider>
              <Tabs
                screenOptions={{
                  headerShown: false,
                  tabBarButton: HapticTab,
                  tabBarBackground: TabBarBackground,
                  tabBarStyle: Platform.select({
                    ios: {
                      // Use a transparent background on iOS to show the blur effect
                      position: "absolute",
                    },
                    default: {},
                  }),
                }}
              >
                <Tabs.Screen
                  name="super_admin/conciergerie/index"
                  options={{
                    title: "Conciergerie",
                    tabBarIcon: ({ color }) => (
                      <IconSymbol size={28} name="bell.fill" color={color} />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="super_admin/nettoyage/index"
                  options={{
                    title: "Nettoyage",
                    tabBarIcon: ({ color }) => (
                      <IconSymbol size={28} name="house.fill" color={color} />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="super_admin/blachisserie/index"
                  options={{
                    title: "Blachisserie",
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
                      <MaterialIcons size={28} name="build" color={color} />
                    ),
                  }}
                />
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
                {/* Agent Tabs invisible ici */}
                <Tabs.Screen
                  name="agent/tasks/index"
                  options={{
                    title: "Tasks",
                    href: null,
                    tabBarIcon: ({ color }) => (
                      <MaterialIcons size={28} name="build" color={color} />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="agent/settings/index"
                  options={{
                    title: "Settings",
                    href: null,
                    tabBarIcon: ({ color }) => (
                      <MaterialIcons size={28} name="build" color={color} />
                    ),
                  }}
                />
              </Tabs>
            </AgentProvider>
          </ConciergerieProvider>
        </CleaningProvider>
      </BlanchisserieProvider>
    </MaintenanceProvider>
  );
};

export default UserLayout;
