import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import useAuthStore from "../../store/auth.store";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { checkAuth, token, user } = useAuthStore();

  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isReadyToNavigate, setIsReadyToNavigate] = useState(false);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    "JetBrainMono-Medium": require("../../assets/font/JetBrainsMono-Medium.ttf"),
  });

  // 1. Run ONCE on cold boot to check AsyncStorage via your store
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsAuthChecked(true);
        setIsReadyToNavigate(true); // Locks in the startup readiness state
      }
    };
    initializeApp();
  }, [checkAuth]);

  // 2. Initial Boot Router: Runs ONLY when the app is opening
  useEffect(() => {
    // Strictly guard this so it only runs if fonts are ready AND it's initial boot
    if (!fontsLoaded || !isReadyToNavigate) return;

    const handleInitialRoute = async () => {
      const isAuthScreen = segments[0] === "(auth)";
      const isSignedIn = !!(user && token);

      // Send them to their initial destination based on cold boot auth state
      if (!isAuthScreen && !isSignedIn) {
        router.replace("/");
      } else if (isAuthScreen && isSignedIn) {
        router.replace("/home");
      }

      // Turn off this navigation listener completely so it NEVER runs again during this session
      setIsReadyToNavigate(false);

      // Hide the green splash screen now that the user is placed on their correct starting screen
      await SplashScreen.hideAsync();
    };

    handleInitialRoute();
  }, [fontsLoaded, isReadyToNavigate]); // Look! segments, token, and user are safely removed.

  // Prevent UI rendering until assets and initial calculations are resolved
  if (!fontsLoaded || !isAuthChecked) return null;

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
