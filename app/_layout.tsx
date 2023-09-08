import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Link, SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Pressable } from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "../constants/colors";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="image-crop-modal"
            options={{
              presentation: "fullScreenModal",
              title: "",
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.black },
              headerRight: () => (
                <Link href="/" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <AntDesign
                        name="close"
                        size={25}
                        color={colors.white}
                        style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                </Link>
              ),
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const RootLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
    ...AntDesign.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
};

export default RootLayout;
