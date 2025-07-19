import { Pressable, View } from "react-native";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { MoonStar } from "~/lib/icons/MoonStar";
import { Sun } from "~/lib/icons/Sun";
import { useColorScheme } from "~/lib/useColorScheme";
import tw from "twrnc";

export function ThemeToggle() {
  const { isDarkColorScheme, setColorScheme } = useColorScheme();

  function toggleColorScheme() {
    const newTheme = isDarkColorScheme ? "light" : "dark";
    setColorScheme(newTheme);
    setAndroidNavigationBar(newTheme);
  }

  return (
    <Pressable onPress={toggleColorScheme} style={tw`active:opacity-70`}>
      <View style={tw`flex-1 aspect-square pt-0.5 justify-center items-start`}>
        {isDarkColorScheme ? (
          <MoonStar
            style={tw`text-black dark:text-white`}
            size={23}
            strokeWidth={1.25}
          />
        ) : (
          <Sun
            style={tw`text-black dark:text-white`}
            size={24}
            strokeWidth={1.25}
          />
        )}
      </View>
    </Pressable>
  );
}
