import { Text } from "react-native";
import SuperAdminDashboard from "~/components/screen/dashboard/SuperAdminDashboard";
import AgentDashboard from "~/components/screen/dashboard/AgentDashboard";
import { authClient } from "~/lib/auth-client";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();

  if (session?.user?.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  if (session?.user?.role === "agent") {
    return <AgentDashboard />;
  }

  return <Text>Home</Text>;
}
