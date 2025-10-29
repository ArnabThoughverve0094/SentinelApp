import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true, // ✅ Changed from false to true
        tabBarActiveTintColor: "#000", // Black active
        tabBarInactiveTintColor: "#9CA3AF", // Gray inactive
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 65 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="home"
              size={28}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 10,
                color: focused ? "#000" : "#9CA3AF",
                marginTop: 4,
                fontWeight: focused ? "600" : "400",
              }}
            >
              Home
            </Text>
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
              size={26}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 10,
                color: focused ? "#000" : "#9CA3AF",
                marginTop: 4,
                fontWeight: focused ? "600" : "400",
              }}
            >
              Bookmark
            </Text>
          ),
        }}
      />

      {/* Search (Hidden) */}
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hidden from tab bar
        }}
      />

      {/* Create */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={28}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 10,
                color: focused ? "#000" : "#9CA3AF",
                marginTop: 4,
                fontWeight: focused ? "600" : "400",
              }}
            >
              Create
            </Text>
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
              size={26}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 10,
                color: focused ? "#000" : "#9CA3AF",
                marginTop: 4,
                fontWeight: focused ? "600" : "400",
              }}
            >
              Notifications
            </Text>
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={28}
              color={focused ? "#000" : "#9CA3AF"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 10,
                color: focused ? "#000" : "#9CA3AF",
                marginTop: 4,
                fontWeight: focused ? "600" : "400",
              }}
            >
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
