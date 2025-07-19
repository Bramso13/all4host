import * as React from "react";
import { Text, View, StyleProp, ViewStyle } from "react-native";
import tw from "twrnc";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Card({ children, className, style }: CardProps) {
  return (
    <View
      style={[
        tw`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800`,
        className ? tw`${className}` : tw``,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CardHeader({ children, className, style }: CardHeaderProps) {
  return (
    <View
      style={[
        tw`flex flex-col space-y-1.5 p-6`,
        className ? tw`${className}` : tw``,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text
      style={[
        tw`text-2xl font-semibold leading-none tracking-tight text-black dark:text-white`,
        className ? tw`${className}` : tw``,
      ]}
    >
      {children}
    </Text>
  );
}

function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Text
      style={[
        tw`text-sm text-gray-600 dark:text-gray-400`,
        className ? tw`${className}` : tw``,
      ]}
    >
      {children}
    </Text>
  );
}

function CardContent({ children, className, style }: CardContentProps) {
  return (
    <View style={[tw`p-6 pt-0`, className ? tw`${className}` : tw``, style]}>
      {children}
    </View>
  );
}

function CardFooter({ children, className, style }: CardFooterProps) {
  return (
    <View
      style={[
        tw`flex flex-row items-center p-6 pt-0`,
        className ? tw`${className}` : tw``,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
