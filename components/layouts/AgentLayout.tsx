import { View, Text, Platform } from "react-native";

import { HapticTab } from "../HapticTab";
import TabBarBackground from "../ui/TabBarBackground";
import { Tabs } from "expo-router";
import { IconSymbol } from "../ui/IconSymbol";
import { MaterialIcons } from "@expo/vector-icons";

import { AgentProfileProvider } from "~/context/AgentProfileContext";

const AgentLayout = () => {
  return (
    <AgentProfileProvider>
      {/* Tabs invisible ici */}
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
            href: null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="bell.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="super_admin/nettoyage/index"
          options={{
            title: "Nettoyage",
            href: null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="super_admin/blachisserie/index"
          options={{
            title: "Blachisserie",
            href: null,
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
            href: null,
            tabBarIcon: ({ color }) => (
              <MaterialIcons size={28} name="build" color={color} />
            ),
          }}
        />
        {/* Agent Tabs visible ici */}

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
          name="agent/tasks/index"
          options={{
            title: "Tasks",

            tabBarIcon: ({ color }) => (
              <MaterialIcons size={28} name="build" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="agent/settings/index"
          options={{
            title: "  Settings",

            tabBarIcon: ({ color }) => (
              <MaterialIcons size={28} name="settings" color={color} />
            ),
          }}
        />
      </Tabs>
    </AgentProfileProvider>
  );
};

export default AgentLayout;
