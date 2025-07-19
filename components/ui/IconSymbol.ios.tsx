import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";
import tw from "twrnc";

interface IconSymbolProps {
  name: SymbolViewProps["name"];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
  className?: string;
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
  className,
}: IconSymbolProps) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        className ? tw`${className}` : tw``,
        style,
      ]}
    />
  );
}
