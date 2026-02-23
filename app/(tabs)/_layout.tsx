import { db } from "@/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Platform, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, fontScale } = useWindowDimensions(); // ✅ Live updates on rotation

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const hasNotifications = unreadCount > 0;

  // ✅ Fully dynamic sizing based on real screen width
  const isSmallScreen  = screenWidth < 360;   // e.g. Galaxy A series, older iPhones
  const isMediumScreen = screenWidth < 400;   // e.g. iPhone 14, Pixel 6
  // Large screen = 400+  e.g. iPhone Pro Max, tablets

  // Icon size: scales smoothly
  const iconSize = isSmallScreen ? 22 : isMediumScreen ? 24 : 26;

  // Font size: also accounts for system font scale (accessibility setting)
  const baseFontSize = isSmallScreen ? 8 : isMediumScreen ? 9 : 10;
  const fontSize = Math.round(baseFontSize / fontScale); // ✅ prevents overflow when user has large text

  // Tab bar height: taller on large screens, shorter on small ones
  const tabBarHeight = isSmallScreen ? 56 : isMediumScreen ? 60 : 65;

  // ✅ Short label for "Notifications" — prevents line wrapping on small screens
  const notifLabel = isSmallScreen ? "Alerts" : isMediumScreen ? "Notifs" : "Notifications";

  const fetchUserNotification = useCallback(async () => {
    try {
      const fetchuserID = (await AsyncStorage.getItem("userId")) || "";
      const sentinelUsersRef = collection(db, "SentinelUsers");
      const q = query(sentinelUsersRef, where("userID", "==", fetchuserID));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          const notifications = userData.Notification || [];
          const unreadCount = notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unreadCount); // ✅ was commented out — now enabled
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    fetchUserNotification().then((u) => { unsub = u; });
    return () => { unsub?.(); }; // ✅ cleanup listener on unmount
  }, []);

  // ✅ Reusable label style — avoids repetition
  const labelStyle = (focused: boolean) => ({
    fontSize,
    color: focused ? "#000" : "#9CA3AF",
    marginTop: 2,
    fontWeight: (focused ? "600" : "400") as "600" | "400",
    includeFontPadding: false,    // ✅ Android fix: removes extra top padding
    textAlignVertical: "center" as const,
    numberOfLines: 1,             // ✅ Force single line
  });

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: tabBarHeight + insets.bottom, // ✅ dynamic + safe area
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 0 : 6, // ✅ iOS handles bottom via insets
          paddingHorizontal: isSmallScreen ? 2 : 4, // ✅ tighter padding on small screens
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          flex: 1,
          maxWidth: screenWidth / 5, // ✅ always exactly 1/5 of screen — no overflow
        },
        headerShown: false,
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="home" size={iconSize + 2} color={focused ? "#000" : "#9CA3AF"} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={labelStyle(focused)} numberOfLines={1}>Home</Text>
          ),
        }}
      />

      {/* Bookmarks */}
      <Tabs.Screen
        name="bookmarks"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "bookmark" : "bookmark-outline"}
              size={iconSize}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={labelStyle(focused)} numberOfLines={1}>Bookmark</Text>
          ),
        }}
      />

      {/* Search (Hidden) */}
      <Tabs.Screen name="search" options={{ href: null }} />

      {/* Create */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={iconSize + 2}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={labelStyle(focused)} numberOfLines={1}>Create</Text>
          ),
        }}
      />

      {/* Notifications */}
      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={iconSize}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            // ✅ Key fix: label shortens on small screens
            <Text style={labelStyle(focused)} numberOfLines={1}>{notifLabel}</Text>
          ),
          tabBarBadge: hasNotifications ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "red",
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            fontSize: 9,
            lineHeight: Platform.OS === "android" ? 14 : undefined,
            top: -2,
            right: -4,
          },
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={iconSize + 2}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={labelStyle(focused)} numberOfLines={1}>Profile</Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
