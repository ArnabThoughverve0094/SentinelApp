import React from "react";
import {
  Text,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Sample notification data with remote avatar URLs
const searchResults = [
  {
    id: "1",
    type: "follow",
    user: {
      name: "Rajesh Francis",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      followers: "23 followers",
    },
    time: "3m ago",
    message: "started following you.",
    unread: true,
  },
  {
    id: "2",
    type: "like",
    user: {
      name: "Jamison Eldridge",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      followers: "343 followers",
    },
    time: "10m ago",
    message: "liked your post.",
    unread: true,
  },
  {
    id: "3",
    type: "comment",
    user: {
      name: "Jamison Eldridge",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      followers: "16.4K followers",
    },
    time: "1h ago",
    message: 'commented: "Great shot!"',
    unread: false,
  },
];

type Search = {
  id: string;
  type: string;
  user: {
    name: string;
    avatar: string;
    followers: string;
  };
  time: string;
  message: string;
  unread: boolean;
};

type SearchItemProps = {
  search: Search;
};

const SearchItem: React.FC<SearchItemProps> = ({ search }) => (
  <View className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 mb-3 shadow-sm border border-gray-100">
    {/* Left side - Avatar and Info */}
    <View className="flex-row items-center flex-1">
      <Image
        source={{ uri: search.user.avatar }}
        className="w-12 h-12 rounded-full mr-3"
        resizeMode="cover"
      />

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">
          {search.user.name}
        </Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          {search.user.followers}
        </Text>
      </View>
    </View>

    {/* Right side - Follow Button */}
    <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md">
      <Text className="text-white text-sm font-medium">Follow</Text>
    </TouchableOpacity>
  </View>
);

export default function NotificationPage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="px-6 pt-8 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Search</Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <Text className="ml-3 text-gray-400 flex-1">Search...</Text>
        </View>
      </View>

      <View className="flex-1 px-6">
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SearchItem search={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-32">
              <Ionicons
                name="notifications-off-outline"
                size={60}
                color="#D1D5DB"
              />
              <Text className="text-lg text-gray-400 mt-4">
                No notifications yet
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
