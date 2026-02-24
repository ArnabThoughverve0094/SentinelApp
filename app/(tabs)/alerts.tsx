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

type Notification = {
  id: string;
  type: string;
  user: { name: string; avatar: string };
  time: any;
  message: string;
  showButtons: boolean;
  status?: string;
};

// ✅ Central config — add any new NotifyType here in future
type NotifyConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
};

const NOTIFY_CONFIG: Record<string, NotifyConfig> = {
  post_approved: {
    icon: "checkmark-circle",
    iconColor: "#22C55E",
    iconBg: "#DCFCE7",
    badgeLabel: "✅  Post Approved",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
  },
  postapproved: {
    icon: "checkmark-circle",
    iconColor: "#22C55E",
    iconBg: "#DCFCE7",
    badgeLabel: "✅  Post Approved",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
  },
  post_rejected: {
    icon: "close-circle",
    iconColor: "#EF4444",
    iconBg: "#FEE2E2",
    badgeLabel: "❌  Post Rejected",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
  },
  postrejected: {
    icon: "close-circle",
    iconColor: "#EF4444",
    iconBg: "#FEE2E2",
    badgeLabel: "❌  Post Rejected",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
  },
  post_pending: {
    icon: "time",
    iconColor: "#F59E0B",
    iconBg: "#FEF3C7",
    badgeLabel: "⏳  Post Under Review",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
  postsubmitted: {
    icon: "time",
    iconColor: "#F59E0B",
    iconBg: "#FEF3C7",
    badgeLabel: "⏳  Post Under Review",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
  videopostsubmitted: {
    icon: "videocam",
    iconColor: "#8B5CF6",
    iconBg: "#EDE9FE",
    badgeLabel: "🎥  Video Under Review",
    badgeBg: "#EDE9FE",
    badgeText: "#5B21B6",
  },
  video_review_pending: {
    icon: "videocam",
    iconColor: "#8B5CF6",
    iconBg: "#EDE9FE",
    badgeLabel: "🎥  Video Under Review",
    badgeBg: "#EDE9FE",
    badgeText: "#5B21B6",
  },
  post_reported: {
    icon: "flag",
    iconColor: "#F97316",
    iconBg: "#FFEDD5",
    badgeLabel: "🚩  Post Reported",
    badgeBg: "#FFEDD5",
    badgeText: "#9A3412",
  },
  postreported: {
    icon: "flag",
    iconColor: "#F97316",
    iconBg: "#FFEDD5",
    badgeLabel: "🚩  Post Reported",
    badgeBg: "#FFEDD5",
    badgeText: "#9A3412",
  },
  user_blocked: {
    icon: "ban",
    iconColor: "#6B7280",
    iconBg: "#F3F4F6",
    badgeLabel: "🚫  Account Restricted",
    badgeBg: "#F3F4F6",
    badgeText: "#374151",
  },
  follow: {
    icon: "person-add",
    iconColor: "#3B82F6",
    iconBg: "#DBEAFE",
    badgeLabel: "👤  New Follower",
    badgeBg: "#DBEAFE",
    badgeText: "#1D40AF",
  },
  like: {
    icon: "heart",
    iconColor: "#EF4444",
    iconBg: "#FEE2E2",
    badgeLabel: "❤️  Post Liked",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
  },
};

const DEFAULT_CONFIG: NotifyConfig = {
  icon: "notifications",
  iconColor: "#6B7280",
  iconBg: "#F3F4F6",
  badgeLabel: "🔔  Notification",
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
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInHours < 24) return `${diffInHours}h`;
      if (diffInDays < 7) return `${diffInDays}d`;
      if (diffInWeeks < 4) return `${diffInWeeks}w`;
      if (diffInMonths < 12) return `${diffInMonths}mo`;
      return `${diffInYears}y`;
    } catch {
      return "Just now";
    }
  }, []);

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const cfg = NOTIFY_CONFIG[notification.type] ?? DEFAULT_CONFIG;
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff" }}>
        
        {/* Avatar + icon badge */}
        <View style={{ marginRight: 12 }}>
          <Image
            source={{
              uri: notification.user.avatar ||
                "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
            }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            resizeMode="cover"
          />
          {/* ✅ Icon overlay — enabled for ALL types */}
          <View
            style={{
              position: "absolute",
              bottom: -3,
              right: -3,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: cfg.iconBg,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "#fff",
              elevation: 3,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 3,
            }}
          >
            <Ionicons name={cfg.icon} size={12} color={cfg.iconColor} />
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          
          {/* Sender name + message */}
          <Text style={{ fontSize: 14, color: "#111827", lineHeight: 20, marginBottom: 3 }}>
            <Text style={{ fontWeight: "700" }}>{notification.user.name}</Text>
            {"  "}
            {notification.message}
          </Text>

          {/* Time */}
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>
            {getTimeAgo(notification.time)}
          </Text>

          {/* ✅ Status badge — shown for ALL notification types */}
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: cfg.badgeBg,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.badgeText }}>
              {cfg.badgeLabel}
            </Text>
          </View>

          {/* Follow/Decline Buttons (unchanged) */}
          {notification.showButtons && (
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 8 }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ color: "#374151", fontSize: 13, fontWeight: "500" }}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12, backgroundColor: "#F9FAFB" }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#111827", paddingTop: 12 }}>
          Notifications
        </Text>
      </View>

      {/* List */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={notificationDetails}
          keyExtractor={(_item, index) => index.toString()}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: "#F3F4F6", marginLeft: 76 }} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 120 }}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text style={{ fontSize: 17, color: "#9CA3AF", marginTop: 16, fontWeight: "500" }}>
                No notifications yet
              </Text>
              <Text style={{ fontSize: 13, color: "#D1D5DB", marginTop: 6 }}>
                We'll notify you when something happens
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
