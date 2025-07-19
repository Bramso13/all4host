import * as React from "react";
import { Image, Text, View, StyleProp, ViewStyle } from "react-native";
import tw from "twrnc";

interface AvatarProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  style?: StyleProp<ViewStyle>;
}

interface AvatarImageProps {
  source: any;
  className?: string;
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const getAvatarStyles = (size: AvatarProps["size"] = "md") => {
  const sizeStyles = {
    sm: tw`h-8 w-8`,
    md: tw`h-10 w-10`,
    lg: tw`h-12 w-12`,
    xl: tw`h-16 w-16`,
  };

  return [
    tw`relative flex shrink-0 overflow-hidden rounded-full`,
    sizeStyles[size],
  ];
};

function Avatar({ children, className, size = "md", style }: AvatarProps) {
  const avatarStyles = getAvatarStyles(size);

  return (
    <View style={[avatarStyles, className ? tw`${className}` : tw``, style]}>
      {children}
    </View>
  );
}

function AvatarImage({ source, className }: AvatarImageProps) {
  return (
    <Image
      source={source}
      style={[
        tw`aspect-square h-full w-full`,
        className ? tw`${className}` : tw``,
      ]}
      resizeMode="cover"
    />
  );
}

function AvatarFallback({ children, className, style }: AvatarFallbackProps) {
  return (
    <View
      style={[
        tw`flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700`,
        className ? tw`${className}` : tw``,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
