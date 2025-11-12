import { db } from "@/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Text, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  const [unreadCount, setUnreadCount] = useState<number>(0);

  const hasNotifications = unreadCount > 0;

  // Get screen width - NO INSTALLATION NEEDED
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate responsive font size
  const getFontSize = () => {
    if (screenWidth < 350) return 8;
    if (screenWidth < 380) return 9;
    return 10;
  };


  const fetchUserNotification = useCallback(async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId') || "";
      const sentinelUsersRef = collection(db, 'SentinelUsers');
      const q = query(sentinelUsersRef, where('userID', '==', fetchuserID));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const userDoc = snapshot.docs[0];
              const userData = userDoc.data();
              const notification = userData.Notification || [];
              console.log('✅ Notification list updated:', notification);

              let unreadNotificationCount = 0;
  
              for (const docNotification of notification) {
                if(!docNotification.isRead){
                  unreadNotificationCount++;
                }
              }

              // setUnreadCount(unreadNotificationCount);
  
            } else {
              console.log('📱 No user document found');
            }
          });
  
          return unsubscribe;
    } catch (error) {
      console.error('Error fetching following list:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchUserNotification();
  }, []);

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
          // 1. Conditionally show the badge
          // Set to an empty string to force the dot shape without a number
          tabBarBadge: hasNotifications ? unreadCount : undefined, 
          
          // 2. Style the badge to look like a small red dot
          tabBarBadgeStyle: {
            backgroundColor: 'red',
            minWidth: 0,      // Make the badge very small
            minHeight: 0,     // Ensure it's square for perfect circle
            borderRadius: 10,  // Half of the width/height makes it a perfect circle
            padding: 0,       // Remove any padding
            top: 1,           // Adjust vertical position
            right: 0,         // Adjust horizontal position
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