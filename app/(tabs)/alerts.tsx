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
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ Extended Notification type to support all cases
type Notification = {
  id: string;
  type: string;
  user: {
    name: string;
    avatar: string;
  };
  time: any;
  message: string;
  showButtons: boolean;
  status?: string;
};

// ✅ Config map for every NotifyType — icon, badge label, badge colors
const NOTIFY_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconColor: string; badgeLabel: string; badgeBg: string; badgeText: string }
> = {
  post_approved: {
    icon: "checkmark-circle",
    iconColor: "#22C55E",
    badgeLabel: "Post Approved",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
  },
  post_rejected: {
    icon: "close-circle",
    iconColor: "#EF4444",
    badgeLabel: "Post Rejected",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
  },
  post_pending: {
    icon: "time",
    iconColor: "#F59E0B",
    badgeLabel: "Post Under Review",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
  postsubmitted: {
    icon: "time",
    iconColor: "#F59E0B",
    badgeLabel: "Post Under Review",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
  videopostsubmitted: {
    icon: "videocam",
    iconColor: "#8B5CF6",
    badgeLabel: "Video Under Review",
    badgeBg: "#EDE9FE",
    badgeText: "#6D28D9",
  },
  video_review_pending: {
    icon: "videocam",
    iconColor: "#8B5CF6",
    badgeLabel: "Video Under Review",
    badgeBg: "#EDE9FE",
    badgeText: "#6D28D9",
  },
  post_reported: {
    icon: "flag",
    iconColor: "#F97316",
    badgeLabel: "Post Reported",
    badgeBg: "#FFEDD5",
    badgeText: "#9A3412",
  },
  user_blocked: {
    icon: "ban",
    iconColor: "#6B7280",
    badgeLabel: "User Restricted",
    badgeBg: "#F3F4F6",
    badgeText: "#374151",
  },
  follow: {
    icon: "person-add",
    iconColor: "#3B82F6",
    badgeLabel: "New Follower",
    badgeBg: "#DBEAFE",
    badgeText: "#1D40AF",
  },
  like: {
    icon: "heart",
    iconColor: "#EF4444",
    badgeLabel: "Post Liked",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
  },
};

const DEFAULT_CONFIG = {
  icon: "notifications" as keyof typeof Ionicons.glyphMap,
  iconColor: "#6B7280",
  badgeLabel: "Notification",
  badgeBg: "#F3F4F6",
  badgeText: "#374151",
};

function getMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === "object" && typeof val.toDate === "function")
    return val.toDate().getTime();
  if (typeof val === "number") return val;
  return new Date(val).getTime();
}

export default function NotificationPage() {
  const [userImage, setUserImage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [notificationDetails, setNotificationDetails] = useState<Notification[]>([]);
  const [currentUserDocId, setCurrentUserDocId] = useState("");

  useEffect(() => {
    getItem();
    fetchUserData();
  }, []);

  const getItem = async () => {
    try {
      const fetchuserName = await AsyncStorage.getItem("userName");
      const fetchUserImage = await AsyncStorage.getItem("profilePicUrl");
      const fetchuserID = await AsyncStorage.getItem("userId");
      if (fetchuserName !== null) setUserName(fetchuserName);
      if (fetchUserImage !== null) setUserImage(fetchUserImage);
      if (fetchuserID !== null) setUserId(fetchuserID);
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if (fetchuserID === "") {
        fetchuserID = (await AsyncStorage.getItem("userId")) || "";
        setUserId(fetchuserID);
      }

      if (fetchuserID) {
        const sentinelUsersRef = collection(db, "SentinelUsers");
        const q = query(sentinelUsersRef, where("userID", "==", fetchuserID));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const snapshotDataArr = snapshot.docs.map((doc) => ({
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

          fetchNotific.sort((a, b) => getMillis(b.time) - getMillis(a.time));
          setNotificationDetails(fetchNotific);
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error("Error fetching notification list:", error);
      setNotificationDetails([]);
      setCurrentUserDocId("");
    }
  }, [userId]);

  const getTimeAgo = useCallback((dateString: any) => {
    if (!dateString) return "Just now";
    try {
      let postDate: Date;
      if (dateString && typeof dateString === "object" && dateString.toDate) {
        postDate = dateString.toDate();
      } else if (typeof dateString === "string") {
        postDate = new Date(dateString);
      } else if (dateString instanceof Date) {
        postDate = dateString;
      } else if (typeof dateString === "number") {
        postDate = new Date(dateString);
      } else {
        return "Just now";
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

      if (diffInSeconds < 60) return diffInSeconds <= 0 ? "Just now" : `${diffInSeconds}s`;
      else if (diffInMinutes < 60) return `${diffInMinutes}m`;
      else if (diffInHours < 24) return `${diffInHours}h`;
      else if (diffInDays < 7) return `${diffInDays}d`;
      else if (diffInWeeks < 4) return `${diffInWeeks}w`;
      else if (diffInMonths < 12) return `${diffInMonths}mo`;
      else return `${diffInYears}y`;
    } catch (error) {
      return "Just now";
    }
  }, []);

  // ✅ Single NotificationItem handles ALL types beautifully
  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const config = NOTIFY_CONFIG[notification.type] ?? DEFAULT_CONFIG;

    return (
      <View className="flex-row items-start px-4 py-3 bg-white">
        
        {/* Avatar with type icon overlay */}
        <View className="relative mr-3">
          <Image
            source={{
              uri:
                notification.user.avatar ||
                "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
            }}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
          {/* ✅ Icon overlay on avatar for every notification type */}
          <View
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              backgroundColor: "white",
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Ionicons name={config.icon} size={13} color={config.iconColor} />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          
          {/* Name + Message */}
          <Text className="text-sm text-gray-900 leading-5 mb-1">
            <Text className="font-semibold">{notification.user.name}</Text>{" "}
            {notification.message}
          </Text>

          {/* Time */}
          <Text className="text-xs text-gray-400 mb-2">
            {getTimeAgo(notification.time)}
          </Text>

          {/* ✅ Status Badge — shown for every notification type */}
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 20,
              marginBottom: 4,
              backgroundColor: config.badgeBg,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: config.badgeText }}>
              {config.badgeLabel}
            </Text>
          </View>

          {/* Follow/Decline Buttons */}
          {notification.showButtons && (
            <View className="flex-row mt-1">
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
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="px-4 pt-10 pb-3 bg-gray-50">
        <Text className="text-2xl font-bold text-gray-900 pt-3">
          Notifications
        </Text>
      </View>

      {/* List */}
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
              <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
              <Text className="text-lg text-gray-400 mt-4">No notifications yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
