import * as React from "react";
import {
  Platform,
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import tw from "twrnc";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const Tooltip = ({ children, content, className, style }: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <View
      style={[tw`relative`, className ? tw`${className}` : tw``, style]}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <TooltipContent>{content}</TooltipContent>}
    </View>
  );
};

function TooltipContent({ children, className, style }: TooltipContentProps) {
  return (
    <Animated.View
      entering={Platform.select({ web: undefined, default: FadeIn })}
      exiting={Platform.select({ web: undefined, default: FadeOut })}
      style={[
        tw`absolute z-50 overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-md dark:border-gray-700 dark:bg-gray-800`,
        className ? tw`${className}` : tw``,
        style,
      ]}
    >
      <Text style={tw`text-sm text-black dark:text-white`}>{children}</Text>
    </Animated.View>
  );
}

const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export { Tooltip, TooltipContent, TooltipTrigger };
