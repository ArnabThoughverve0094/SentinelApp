import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Updated notification data to match your image exactly
const notifications = [
  {
    id: '1',
    type: 'follow',
    user: {
      name: 'Kellan Arbor',
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    time: '2 m',
    message: 'sent you a follow request.',
    showButtons: true,
  },
  {
    id: '2',
    type: 'like',
    user: {
      name: 'Elowen Farris',
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    time: '4 m',
    message: 'liked your post.',
    showButtons: false,
  },
  {
    id: '3',
    type: 'follow',
    user: {
      name: 'Laurie Kittel',
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    time: '7 m',
    message: 'sent you a follow request.',
    showButtons: true,
  },
  {
    id: '4',
    type: 'follow',
    user: {
      name: 'Larkin Veum',
      avatar: "https://randomuser.me/api/portraits/men/25.jpg",
    },
    time: '21 m',
    message: 'sent you a follow request.',
    showButtons: true,
  },
  {
    id: '5',
    type: 'like',
    user: {
      name: 'Rigel Quitzon',
      avatar: "https://randomuser.me/api/portraits/men/18.jpg",
    },
    time: '1h ago',
    message: 'liked your post.',
    showButtons: false,
  },
];

type Notification = {
  id: string;
  type: string;
  user: {
    name: string;
    avatar: string;
  };
  time: string;
  message: string;
  showButtons: boolean;
};

const NotificationItem = ({ notification }: { notification: Notification }) => (
  <View className="flex-row items-start px-4 py-3 bg-white">
    {/* Avatar */}
    <Image
      source={{ uri: notification.user.avatar }}
      className="w-12 h-12 rounded-full mr-3"
      resizeMode="cover"
    />
    
    {/* Content */}
    <View className="flex-1">
      {/* User name and message */}
      <Text className="text-sm text-gray-900 leading-5 mb-1">
        <Text className="font-semibold">{notification.user.name}</Text>
        {' '}{notification.message}
      </Text>
      
      {/* Time */}
      <Text className="text-xs text-gray-500 mb-2">{notification.time}</Text>
      
      {/* Follow/Decline Buttons */}
      {notification.showButtons && (
        <View className="flex-row">
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md mr-2">
            <Text className="text-white text-sm font-medium">Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-md">
            <Text className="text-gray-700 text-sm font-medium">Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

export default function NotificationPage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <View style={styles.results} />
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-gray-50">
        <Text className="text-xl font-semibold text-gray-900">Notifications</Text>
      </View>

      {/* Notifications List */}
      <View className="flex-1">
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 ml-16" />
          )}
          ListEmptyComponent={
            <View className="items-center mt-32">
              <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
              <Text className="text-lg text-gray-400 mt-4">No notifications yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
});