import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type Notification = {
  id: string;
  type: string;
  user: {
    name: string;
    avatar: string;
  };
  time: any; // changed to any to support Firestore Timestamp, string, or number
  message: string;
  showButtons: boolean;
  status?: "approved" | "rejected";
};

const getNotificationIcon = (type: string, status?: string) => {
  switch (type) {
    case "follow":
      return <Ionicons name="person-add" size={16} color="#3B82F6" />;
    case "like":
      return <Ionicons name="heart" size={16} color="#EF4444" />;
    case "post_approved":
      return <Ionicons name="checkmark-circle" size={16} color="#22C55E" />;
    case "post_rejected":
      return <Ionicons name="close-circle" size={16} color="#EF4444" />;
    default:
      return <Ionicons name="notifications" size={16} color="#6B7280" />;
  }
};

function getMillis(val: any): number {
  // Supports Firestore Timestamp, string date, or ms number
  if (!val) return 0;
  if (typeof val === "object" && typeof val.toDate === "function") return val.toDate().getTime();
  if (typeof val === "number") return val;
  return new Date(val).getTime();
}

export default function NotificationPage() {
  const [userImage, setUserImage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [notificationDetails, setNotificationDetails] = useState<Notification[]>([]);
  const [currentUserDocId, setCurrentUserDocId] = useState('');

  useEffect(() => {
    getItem();
    fetchUserData();
  }, []);

  const getItem = async () => {
    try {
      const fetchuserName = await AsyncStorage.getItem('userName');
      const fetchUserImage = await AsyncStorage.getItem('profilePicUrl');
      const fetchuserID = await AsyncStorage.getItem('userId');
      if(fetchuserName !== null) setUserName(fetchuserName);
      if(fetchUserImage !== null) setUserImage(fetchUserImage);
      if(fetchuserID !== null) setUserId(fetchuserID);
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  }

  const fetchUserData = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if(fetchuserID === "") {
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }

      if (fetchuserID) {
        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(
          sentinelUsersRef, 
          where('userID', '==', fetchuserID));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const snapshotDataArr = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          }));

          const fetchNotific: Notification[] = [];
          for (const doc of snapshotDataArr) {
            const postData = doc.data;
            const postId = doc.id;
            setCurrentUserDocId(postId);

            if (postData.Notification != null) {
              for (const docNotification of postData.Notification) {
                fetchNotific.push({
                  id: docNotification.id,
                  type: docNotification.NotifyType,
                  user: {
                    name: docNotification.AuthorName,
                    avatar: docNotification.AuthorImageURL,
                  },
                  time: docNotification.ContentDate,
                  message: docNotification.Description,
                  showButtons: docNotification.ShowButtons,
                  status: docNotification.Status,
                });
              }
            }
          }
          // Robust sort (latest first)
          fetchNotific.sort((a, b) => getMillis(b.time) - getMillis(a.time));
          setNotificationDetails(fetchNotific);
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching notification list:', error);
      setNotificationDetails([]);
      setCurrentUserDocId('');
    }
  }, [userId]);

  const getTimeAgo = useCallback((dateString: any) => {
    if (!dateString) return 'Just now';
    try {
      let postDate: Date;
      if (dateString && typeof dateString === 'object' && dateString.toDate) {
        postDate = dateString.toDate();
      }
      else if (typeof dateString === 'string') {
        postDate = new Date(dateString);
      }
      else if (dateString instanceof Date) {
        postDate = dateString;
      }
      else if (typeof dateString === 'number') {
        postDate = new Date(dateString);
      }
      else {
        return 'Just now';
      }
      const now = new Date();
      const diffInMs = now.getTime() - postDate.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);
      const diffInYears = Math.floor(diffInDays / 365);

      if (diffInSeconds < 60) {
        return diffInSeconds <= 0 ? 'Just now' : `${diffInSeconds}s`;
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks}w`;
      } else if (diffInMonths < 12) {
        return `${diffInMonths}mo`;
      } else {
        return `${diffInYears}y`;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Just now';
    }
  }, []);

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <View className="flex-row items-start px-4 py-3 bg-white">
      {/* Avatar with status indicator */}
      <View className="relative mr-3">
        <Image
          source={{ uri: notification.user.avatar }}
          className="w-12 h-12 rounded-full"
          resizeMode="cover"
        />
        {/* Status icon overlay for post notifications */}
        {(notification.type === "post_approved" ||
          notification.type === "post_rejected") && (
          <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center shadow-sm">
            {/* {getNotificationIcon(notification.type, notification.status)} */}
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        {/* User name and message */}
        <View className="flex-row items-start mb-1">
          <View className="flex-1">
            <Text className="text-sm text-gray-900 leading-5">
              <Text className="font-semibold">{notification.user.name}</Text>{" "}
              {notification.message}
            </Text>
          </View>
          {/* Notification type icon */}
          {notification.type !== "post_approved" &&
            notification.type !== "post_rejected" && (
              <View className="ml-2 mt-1">
                {/* {getNotificationIcon(notification.type)} */}
              </View>
            )}
        </View>

        {/* Time */}
        <Text className="text-xs text-gray-500 mb-2">{getTimeAgo(notification.time)}</Text>

        {/* Status badge for post notifications */}
        {(notification.type === "post_approved" ||
          notification.type === "post_rejected") && (
          <View
            className={`self-start px-2 py-1 rounded-full mb-2 ${
              notification.status === "approved" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                notification.status === "approved"
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {notification.status === "approved"
                ? "Post Approved"
                : "Post Rejected"}
            </Text>
          </View>
        )}

        {/* Follow/Decline Buttons */}
        {notification.showButtons && (
          <View className="flex-row">
            <TouchableOpacity className="bg-black px-4 py-2 rounded-md mr-2">
              <Text className="text-white text-sm font-medium">Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 rounded-md">
              <Text className="text-gray-700 text-sm font-medium">Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="px-4 pt-10 pb-3 bg-gray-50">
        <Text className="text-2xl font-bold text-gray-900 pt-3">
          Notifications
        </Text>
      </View>

      {/* Notifications List */}
      <View className="flex-1">
        <FlatList
          data={notificationDetails}
          keyExtractor={(_item, index) => index.toString()}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 ml-16" />
          )}
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
