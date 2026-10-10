import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import useAuthStore from "../../store/auth.store";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { checkAuth, token, user } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
    };
    initializeAuth();
  }, [checkAuth]);

  //handle navigation based on auth state
  useEffect(() => {
    const checkAuthState = async () => {
      const user = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");
      const isAuthScreen = segments[0] === "(auth)";
      const isSignedIn = user && token;
      if (!isAuthScreen && !isSignedIn) {
        router.replace("/");
      } else if (isAuthScreen && isSignedIn) {
        router.replace("/home");
      }
    };
    checkAuthState();
  }, [token, user, router, segments]);

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
