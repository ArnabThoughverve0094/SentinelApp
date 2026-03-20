//app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animate splash screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBegin = async () => {
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSplash(false);
      // After splash, check auth status
      checkAuthStatus();
    });
  };

  const checkAuthStatus = async () => {
    try {
      const [userToken, tokenExpiry] = await AsyncStorage.multiGet([
        "userToken",
        "tokenExpiry",
      ]);

      const token = userToken[1];
      const expiry = tokenExpiry[1];

      if (token) {
        console.log("Valid session found, redirecting to tabs");
        router.replace("/(tabs)");
      } else {
        console.log("No valid session, redirecting to auth");
        router.replace("/(auth)");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      router.replace("/(auth)");
    } finally {
      setIsLoading(false);
    }
  };

  // Show Splash Screen First
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

        <View style={styles.splashContent}>
          {/* Logo Section - Centered */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require("../assets/images/ironex-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Begin Button - Bottom */}
          <Animated.View
            style={[styles.buttonContainer, { opacity: fadeAnim }]}
          >
            <TouchableOpacity
              onPress={handleBegin}
              style={styles.beginButton}
              activeOpacity={0.85}
            >
              <Text style={styles.beginButtonText}>Begin</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Show Loading Screen while checking auth
  // if (isLoading) {
  // return (
  // <View className="flex-1 bg-violet-500 items-center justify-center">
  //   <ActivityIndicator size="large" color="white" />
  //   <Text className="text-white text-lg mt-4 font-semibold">IronEx</Text>
  //   <Text className="text-white text-sm mt-2">Loading your experience...</Text>
  // </View>
  // );
  // }

  // This will never show because of router.replace() calls above
  // return null;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  splashContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    position: "absolute",
    top: height * 0.42,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 186,
    height: 31.5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: height * 0.18,
    alignItems: "center",
  },
  beginButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    width: 150,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  beginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
