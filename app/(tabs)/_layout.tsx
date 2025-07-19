import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  BarChart2,
  CheckSquare,
  LogIn,
  User,
  UserPlus,
} from "lucide-react-native";
import { HapticTab } from "~/components/HapticTab";
import TabBarBackground from "~/components/ui/TabBarBackground";
import { IconSymbol } from "~/components/ui/IconSymbol";
import { SessionProvider } from "~/context/SessionContext";
import { MaterialIcons } from "@expo/vector-icons";
import { PropertyProvider } from "~/context/PropertyContext";

export default function TabLayout() {
  return (
    <SessionProvider>
      <PropertyProvider>
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
            name="index"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="chart.bar.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="conciergerie/index"
            options={{
              title: "Conciergerie",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="bell.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="nettoyage/index"
            options={{
              title: "Nettoyage",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="blachisserie/index"
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
        </Tabs>
      </PropertyProvider>
    </SessionProvider>
  );
}
