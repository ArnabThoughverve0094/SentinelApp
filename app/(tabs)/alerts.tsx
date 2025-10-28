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
  time: string;
  message: string;
  showButtons: boolean;
  status?: "approved" | "rejected";
};

// ✅ Fixed: Explicitly type the array and cast status literals
const notifications: Notification[] = [
  {
    id: "1",
    type: "follow",
    user: {
      name: "Kellan Arbor",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    time: "2 m",
    message: "sent you a follow request.",
    showButtons: true,
  },
  {
    id: "2",
    type: "post_approved",
    user: {
      name: "Sentinel Admin",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    time: "5 m",
    message: "Your post has been approved and is now visible to all users.",
    showButtons: false,
    status: "approved" as "approved", // ✅ Cast as literal type
  },
  {
    id: "3",
    type: "like",
    user: {
      name: "Elowen Farris",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    time: "8 m",
    message: "liked your post.",
    showButtons: false,
  },
  {
    id: "4",
    type: "post_rejected",
    user: {
      name: "Sentinel Moderator",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    },
    time: "12 m",
    message:
      "Your post was rejected due to: Inappropriate content or language.",
    showButtons: false,
    status: "rejected" as "rejected", // ✅ Cast as literal type
  },
  {
    id: "5",
    type: "follow",
    user: {
      name: "Laurie Kittel",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    time: "15 m",
    message: "sent you a follow request.",
    showButtons: true,
  },
  {
    id: "6",
    type: "post_approved",
    user: {
      name: "Sentinel Admin",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    time: "18 m",
    message: "Your video post about community events has been approved.",
    showButtons: false,
    status: "approved" as "approved",
  },
  {
    id: "7",
    type: "follow",
    user: {
      name: "Larkin Veum",
      avatar: "https://randomuser.me/api/portraits/men/25.jpg",
    },
    time: "21 m",
    message: "sent you a follow request.",
    showButtons: true,
  },
  {
    id: "8",
    type: "post_rejected",
    user: {
      name: "Sentinel Moderator",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    },
    time: "35 m",
    message:
      "Your post was rejected due to: Spam or repetitive content, Misleading or false information.",
    showButtons: false,
    status: "rejected" as "rejected",
  },
  {
    id: "9",
    type: "like",
    user: {
      name: "Rigel Quitzon",
      avatar: "https://randomuser.me/api/portraits/men/18.jpg",
    },
    time: "1h ago",
    message: "liked your post.",
    showButtons: false,
  },
  {
    id: "10",
    type: "post_approved",
    user: {
      name: "Sentinel Admin",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    time: "2h ago",
    message: "Your image post has been reviewed and approved successfully.",
    showButtons: false,
    status: "approved" as "approved",
  },
  {
    id: "11",
    type: "post_rejected",
    user: {
      name: "Sentinel Moderator",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    },
    time: "3h ago",
    message: "Your post was rejected due to: Violates community guidelines.",
    showButtons: false,
    status: "rejected" as "rejected",
  },
  {
    id: "12",
    type: "post_approved",
    user: {
      name: "Sentinel Admin",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    time: "5h ago",
    message:
      "Great job! Your post about local news has been approved and published.",
    showButtons: false,
    status: "approved" as "approved",
  },
];

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

      if(fetchuserName !== null) {
        console.log("userName: ", fetchuserName);
        setUserName(fetchuserName);
      }

      if(fetchUserImage !== null) {
        console.log("userImage: ", fetchUserImage);
        setUserImage(fetchUserImage);
      }

      if(fetchuserID !== null) {
        setUserId(fetchuserID);
      }
      
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
        console.log('🔄 Fetching following list for user:', fetchuserID);
        
        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(
          sentinelUsersRef, 
          where('userID', '==', fetchuserID));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const snapshotDataArr = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          }))

          const fetchNotific = [];
          
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
                })
              }
            }
            
            setNotificationDetails(fetchNotific);
            console.log('✅ Notification list updated:', fetchNotific);
          }
          
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
      {/* <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
        <Ionicons name="search" size={20} color="#9ca3af" />
        <Text
          className="flex-1 ml-3 text-gray-700 text-base"
          onPress={() => {
            // You can implement a proper search input here
            console.log("Search functionality to be implemented");
          }}
        >
          Search notifications...
        </Text>
        <Ionicons
          name="filter"
          size={20}
          color="#9ca3af"
          onPress={() => {
            // Implement sorting/filtering functionality here
            console.log("Sort/filter functionality to be implemented");
          }}
        />
      </View> */}

      {/* Notifications List */}
      <View className="flex-1">
        <FlatList
          // data={notifications}
          data={notificationDetails}
          keyExtractor={(item) => item.id}
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
function getTimeAgo(time: string): import("react").ReactNode {
  throw new Error("Function not implemented.");
}

