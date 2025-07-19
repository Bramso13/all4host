import { View, Text } from "react-native";
import { useSession } from "~/context/SessionContext";
import tw from "twrnc";

export default function NettoyageScreen() {
  const { session } = useSession();
  console.log(session);
  return (
    <View style={tw`flex-1 items-center justify-center`}>
      <Text>{session?.user.name}</Text>
    </View>
  );
}
