import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import AgentLayout from "~/components/layouts/AgentLayout";

import UserLayout from "~/components/layouts/UserLayout";
import { AuthScreen } from "~/components/screen/AuthScreen";
import { authClient } from "~/lib/auth-client";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function TabLayout() {
  const { data: session } = authClient.useSession();
  const user = session?.user as unknown as User;

  if (!user) {
    return <AuthScreen />;
  }

  if (user?.role === "super_admin") {
    return <UserLayout />;
  }
  if (user?.role === "agent") {
    return <AgentLayout />;
  }
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>pas user</Text>
      <TouchableOpacity
        onPress={() => {
          authClient.signOut();
        }}
        style={{
          padding: 10,
          backgroundColor: "#ff4444",
          borderRadius: 8,
          alignItems: "center",
          margin: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </View>
  );
}
