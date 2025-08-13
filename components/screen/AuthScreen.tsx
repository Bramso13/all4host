import React, { useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { IconSymbol } from "~/components/ui/IconSymbol";
import tw from "twrnc";
import { authClient } from "~/lib/auth-client";

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const handleSubmit = async () => {
    setIsLoading(true);
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    console.log("email", email);

    if (isLoginMode) {
      const error = await authClient.signIn.email({ email, password });
      if (error) {
        console.log("error", error);
        setIsLoading(false);
        Alert.alert("Erreur", error.error?.message);
      }
    } else if (!isLoginMode) {
      console.log("name", name);
      const error = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error) {
        Alert.alert("Erreur", error.error?.message);
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec logo */}
          <View style={tw`flex items-center justify-center pt-16 pb-8`}>
            <Avatar size="xl" className="mb-4">
              <AvatarFallback style={tw`bg-blue-500`}>
                <IconSymbol name="house.fill" size={32} color="#fff" />
              </AvatarFallback>
            </Avatar>
            <Text variant="h1" style={tw`mb-2`}>
              ALL4HOST
            </Text>
            <Text variant="caption" style={tw`text-center px-8`}>
              Plateforme de gestion multi-services
            </Text>
          </View>

          {/* Card d'authentification */}
          <View style={tw`flex-1 px-6 pb-6`}>
            <Card>
              <CardHeader style={tw`text-center`}>
                <CardTitle>
                  {isLoginMode ? "Connexion" : "Inscription"}
                </CardTitle>
                <CardDescription>
                  {isLoginMode
                    ? "Connectez-vous à votre compte"
                    : "Créez votre compte pour commencer"}
                </CardDescription>
              </CardHeader>

              <CardContent style={tw`space-y-4`}>
                {!isLoginMode && (
                  <View style={tw`space-y-2`}>
                    <Text variant="label">Nom</Text>
                    <TextInput
                      style={tw`h-12 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                      placeholder="Votre nom"
                      placeholderTextColor="#6B7280"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {/* Email */}
                <View style={tw`space-y-2`}>
                  <Text variant="label">Email</Text>
                  <View style={tw`relative`}>
                    <IconSymbol
                      name="paperplane.fill"
                      size={20}
                      color="#6B7280"
                      style={tw`absolute left-3 top-3 z-10`}
                    />
                    <TextInput
                      style={tw`h-12 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                      placeholder="votre@email.com"
                      placeholderTextColor="#6B7280"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Mot de passe */}
                <View style={tw`space-y-2`}>
                  <Text variant="label">Mot de passe</Text>
                  <View style={tw`relative`}>
                    <IconSymbol
                      name="lock"
                      size={20}
                      color="#6B7280"
                      style={tw`absolute left-3 top-3 z-10`}
                    />
                    <TextInput
                      style={tw`h-12 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                      placeholder="••••••••"
                      placeholderTextColor="#6B7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Confirmation mot de passe (inscription uniquement) */}
                {!isLoginMode && (
                  <View style={tw`space-y-2`}>
                    <Text variant="label">Confirmer le mot de passe</Text>
                    <View style={tw`relative`}>
                      <IconSymbol
                        name="lock"
                        size={20}
                        color="#6B7280"
                        style={tw`absolute left-3 top-3 z-10`}
                      />
                      <TextInput
                        style={tw`h-12 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        placeholder="••••••••"
                        placeholderTextColor="#6B7280"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                )}

                {/* Bouton de soumission */}
                <Button
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={tw`w-full mt-6`}
                >
                  {isLoading
                    ? "Chargement..."
                    : isLoginMode
                    ? "Se connecter"
                    : "S'inscrire"}
                </Button>
              </CardContent>

              <CardFooter style={tw`flex-col space-y-4`}>
                {/* Lien pour changer de mode */}
                <View style={tw`flex-row items-center justify-center`}>
                  <Text variant="caption">
                    {isLoginMode
                      ? "Pas encore de compte ?"
                      : "Déjà un compte ?"}
                  </Text>
                  <Button
                    variant="link"
                    onPress={() => setIsLoginMode(!isLoginMode)}
                    style={tw`ml-1`}
                  >
                    <Text style={tw`text-blue-500 font-medium`}>
                      {isLoginMode ? "S'inscrire" : "Se connecter"}
                    </Text>
                  </Button>
                </View>

                {/* Séparateur */}
                <View style={tw`flex-row items-center w-full`}>
                  <View style={tw`flex-1 h-px bg-gray-300 dark:bg-gray-600`} />
                  <Text style={tw`px-4 text-gray-500 text-sm`}>ou</Text>
                  <View style={tw`flex-1 h-px bg-gray-300 dark:bg-gray-600`} />
                </View>

                {/* Boutons sociaux */}
                <View style={tw`flex-row space-x-3 w-full`}>
                  <Button variant="outline" style={tw`flex-1`}>
                    <IconSymbol
                      name="globe"
                      size={20}
                      color="#222"
                      style={tw`mr-2`}
                    />
                    <Text>Google</Text>
                  </Button>
                  <Button variant="outline" style={tw`flex-1`}>
                    <IconSymbol
                      name="globe"
                      size={20}
                      color="#222"
                      style={tw`mr-2`}
                    />
                    <Text>Apple</Text>
                  </Button>
                </View>
              </CardFooter>
            </Card>
          </View>

          {/* Footer */}
          <View style={tw`px-6 pb-6`}>
            <Text style={tw`text-center text-xs text-gray-500`}>
              En continuant, vous acceptez nos{" "}
              <Text style={tw`text-blue-500`}>conditions d'utilisation</Text> et
              notre{" "}
              <Text style={tw`text-blue-500`}>
                politique de confidentialité
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
