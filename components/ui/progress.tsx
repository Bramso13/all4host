import * as React from "react";
import { Platform, View, StyleProp, ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import tw from "twrnc";

interface ProgressProps {
  value?: number | null;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Progress({ value, className, style }: ProgressProps) {
  return (
    <View
      style={[
        tw`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700`,
        className ? tw`${className}` : tw``,
        style,
      ]}
    >
      <Indicator value={value} />
    </View>
  );
}

function Indicator({ value }: { value: number | undefined | null }) {
  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(
          progress.value,
          [0, 100],
          [1, 100],
          Extrapolation.CLAMP
        )}%`,
        { overshootClamping: true }
      ),
    };
  });

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          tw`h-full w-full flex-1 bg-blue-500`,
          { transform: `translateX(-${100 - (value ?? 0)}%)` },
        ]}
      />
    );
  }

  return (
    <Animated.View
      style={[indicator, tw`h-full bg-blue-500 dark:bg-blue-400`]}
    />
  );
}

export { Progress };
