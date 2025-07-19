import * as React from "react";
import { Pressable, Text, View, StyleProp, ViewStyle } from "react-native";
import tw from "twrnc";

interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const getButtonStyles = (
  variant: ButtonProps["variant"] = "default",
  size: ButtonProps["size"] = "default",
  disabled: boolean = false
) => {
  const baseStyles = tw`flex-row items-center justify-center rounded-md`;

  const variantStyles = {
    default: tw`bg-blue-500 active:opacity-90`,
    destructive: tw`bg-red-500 active:opacity-90`,
    outline: tw`border border-gray-300 bg-white active:bg-gray-100`,
    secondary: tw`bg-gray-200 active:opacity-80`,
    ghost: tw`active:bg-gray-100`,
    link: tw``,
  };

  const sizeStyles = {
    default: tw`h-12 px-5 py-3`,
    sm: tw`h-9 px-3 rounded-md`,
    lg: tw`h-14 px-8 rounded-md`,
    icon: tw`h-10 w-10`,
  };

  const disabledStyles = disabled ? tw`opacity-50` : tw``;

  return [baseStyles, variantStyles[variant], sizeStyles[size], disabledStyles];
};

const getTextStyles = (
  variant: ButtonProps["variant"] = "default",
  size: ButtonProps["size"] = "default"
) => {
  const baseStyles = tw`text-base font-medium`;

  const variantStyles = {
    default: tw`text-white`,
    destructive: tw`text-white`,
    outline: tw`text-black`,
    secondary: tw`text-black`,
    ghost: tw`text-black`,
    link: tw`text-blue-500`,
  };

  const sizeStyles = {
    default: tw``,
    sm: tw``,
    lg: tw`text-lg`,
    icon: tw``,
  };

  return [baseStyles, variantStyles[variant], sizeStyles[size]];
};

function Button({
  variant = "default",
  size = "default",
  disabled = false,
  onPress,
  children,
  className,
  style,
}: ButtonProps) {
  const buttonStyles = getButtonStyles(variant, size, disabled);
  const textStyles = getTextStyles(variant, size);

  return (
    <Pressable
      style={[buttonStyles, className ? tw`${className}` : tw``, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {typeof children === "string" ? (
        <Text style={textStyles}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { Button };
export type { ButtonProps };
