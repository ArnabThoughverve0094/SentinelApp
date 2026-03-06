import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  _stableKey: string;
  id: string;
  type: string;
  user: { name: string; avatar: string };
  time: any;
  message: string;
  showButtons: boolean;
  status?: string;
  isRead: boolean;
};

type NotifyConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
};

const NOTIFY_CONFIG: Record<string, NotifyConfig> = {
  post_approved:        { icon: "checkmark-circle", iconColor: "#22C55E", iconBg: "#DCFCE7", badgeLabel: "✅  Post Approved",      badgeBg: "#DCFCE7", badgeText: "#15803D" },
  postapproved:         { icon: "checkmark-circle", iconColor: "#22C55E", iconBg: "#DCFCE7", badgeLabel: "✅  Post Approved",      badgeBg: "#DCFCE7", badgeText: "#15803D" },
  post_rejected:        { icon: "close-circle",     iconColor: "#EF4444", iconBg: "#FEE2E2", badgeLabel: "❌  Post Rejected",      badgeBg: "#FEE2E2", badgeText: "#B91C1C" },
  postrejected:         { icon: "close-circle",     iconColor: "#EF4444", iconBg: "#FEE2E2", badgeLabel: "❌  Post Rejected",      badgeBg: "#FEE2E2", badgeText: "#B91C1C" },
  post_pending:         { icon: "time",             iconColor: "#F59E0B", iconBg: "#FEF3C7", badgeLabel: "⏳  Post Under Review",  badgeBg: "#FEF3C7", badgeText: "#92400E" },
  postsubmitted:        { icon: "time",             iconColor: "#F59E0B", iconBg: "#FEF3C7", badgeLabel: "⏳  Post Under Review",  badgeBg: "#FEF3C7", badgeText: "#92400E" },
  videopostsubmitted:   { icon: "videocam",         iconColor: "#8B5CF6", iconBg: "#EDE9FE", badgeLabel: "🎥  Video Under Review", badgeBg: "#EDE9FE", badgeText: "#5B21B6" },
  video_review_pending: { icon: "videocam",         iconColor: "#8B5CF6", iconBg: "#EDE9FE", badgeLabel: "🎥  Video Under Review", badgeBg: "#EDE9FE", badgeText: "#5B21B6" },
  post_reported:        { icon: "flag",             iconColor: "#F97316", iconBg: "#FFEDD5", badgeLabel: "🚩  Post Reported",      badgeBg: "#FFEDD5", badgeText: "#9A3412" },
  postreported:         { icon: "flag",             iconColor: "#F97316", iconBg: "#FFEDD5", badgeLabel: "🚩  Post Reported",      badgeBg: "#FFEDD5", badgeText: "#9A3412" },
  user_blocked:         { icon: "ban",              iconColor: "#6B7280", iconBg: "#F3F4F6", badgeLabel: "🚫  Account Restricted", badgeBg: "#F3F4F6", badgeText: "#374151" },
  follow:               { icon: "person-add",       iconColor: "#3B82F6", iconBg: "#DBEAFE", badgeLabel: "👤  New Follower",       badgeBg: "#DBEAFE", badgeText: "#1D40AF" },
  like:                 { icon: "heart",            iconColor: "#EF4444", iconBg: "#FEE2E2", badgeLabel: "❤️  Post Liked",        badgeBg: "#FEE2E2", badgeText: "#B91C1C" },
  profile_updated:      { icon: "person-circle",   iconColor: "#3B82F6", iconBg: "#DBEAFE", badgeLabel: "👤  Profile Updated",    badgeBg: "#DBEAFE", badgeText: "#1D40AF" },
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
  if (typeof val === "object" && typeof val.toDate === "function") return val.toDate().getTime();
  if (typeof val === "number") return val;
  return new Date(val).getTime();
}

// ✅ Pure content-based key — NO index, always same for same notification
function buildStableKey(n: any): string {
  if (n.id) return String(n.id);
  const ts = getMillis(n.ContentDate);
  const type = (n.NotifyType || "").trim();
  const author = (n.AuthorName || "").trim();
  const desc = (n.Description || "").substring(0, 20).trim();
  return `${type}__${author}__${ts}__${desc}`;
}

export default function NotificationPage() {
  const [userId, setUserId] = useState("");
  const [notificationDetails, setNotificationDetails] = useState<Notification[]>([]);
  const [currentUserDocId, setCurrentUserDocId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(id);
    };
    init();
  }, []);

  // ✅ Start listener only once userId is ready
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "SentinelUsers"),
      where("userID", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchNotific: Notification[] = [];

      for (const docSnap of snapshot.docs) {
        const postData = docSnap.data();
        setCurrentUserDocId(docSnap.id);

        if (postData.Notification != null) {
          postData.Notification.forEach((n: any) => {
            const stableKey = buildStableKey(n);
            fetchNotific.push({
              _stableKey: stableKey,
              id: n.id || stableKey,
              type: n.NotifyType || "",
              user: {
                name: n.AuthorName || "",
                avatar: n.AuthorImageURL || "",
              },
              time: n.ContentDate,
              message: n.Description || "",
              showButtons: n.ShowButtons || false,
              status: n.Status,
              isRead: n.isRead === true, // ✅ strict boolean check
            });
          });
        }
      }

      fetchNotific.sort((a, b) => getMillis(b.time) - getMillis(a.time));
      setNotificationDetails(fetchNotific);
    });

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = useMemo(
    () => notificationDetails.filter((n) => !n.isRead).length,
    [notificationDetails]
  );

  const filteredNotifications = useMemo(
    () =>
      activeFilter === "unread"
        ? notificationDetails.filter((n) => !n.isRead)
        : notificationDetails,
    [notificationDetails, activeFilter]
  );

  // ✅ FIXED: optimistic UI update + Firestore update matched by stableKey
  const markAsRead = useCallback(
    async (notification: Notification) => {
      if (!currentUserDocId || notification.isRead) return;

      // ✅ Step 1: Optimistic update — instant UI response
      setNotificationDetails((prev) =>
        prev.map((n) =>
          n._stableKey === notification._stableKey ? { ...n, isRead: true } : n
        )
      );

      // ✅ Step 2: Update Firestore
      try {
        const userRef = doc(db, "SentinelUsers", currentUserDocId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const rawList: any[] = userSnap.data().Notification || [];

        const updated = rawList.map((n: any) => {
          // ✅ Match using same pure content key
          if (buildStableKey(n) === notification._stableKey) {
            return { ...n, isRead: true };
          }
          return n;
        });

        await updateDoc(userRef, { Notification: updated });
      } catch (e) {
        console.error("Error marking as read:", e);
        // Rollback optimistic update on error
        setNotificationDetails((prev) =>
          prev.map((n) =>
            n._stableKey === notification._stableKey ? { ...n, isRead: false } : n
          )
        );
      }
    },
    [currentUserDocId]
  );

  // ✅ FIXED: Mark all read with optimistic update
  const markAllAsRead = useCallback(async () => {
    if (!currentUserDocId) return;

    // ✅ Step 1: Optimistic update — instant UI response
    setNotificationDetails((prev) => prev.map((n) => ({ ...n, isRead: true })));

    // ✅ Step 2: Update Firestore
    try {
      const userRef = doc(db, "SentinelUsers", currentUserDocId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const rawList: any[] = userSnap.data().Notification || [];
      const updated = rawList.map((n: any) => ({ ...n, isRead: true }));

      await updateDoc(userRef, { Notification: updated });
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  }, [currentUserDocId]);

  const getTimeAgo = useCallback((dateString: any) => {
    if (!dateString) return "Just now";
    try {
      let postDate: Date;
      if (dateString && typeof dateString === "object" && dateString.toDate) postDate = dateString.toDate();
      else if (typeof dateString === "string") postDate = new Date(dateString);
      else if (dateString instanceof Date) postDate = dateString;
      else if (typeof dateString === "number") postDate = new Date(dateString);
      else return "Just now";
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
    const isUnread = !notification.isRead;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => { if (isUnread) markAsRead(notification); }}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: isUnread ? "#EFF6FF" : "#fff",
        }}
      >
        <View style={{ marginRight: 12 }}>
          <Image
            source={{
              uri: notification.user.avatar ||
                "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
            }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            resizeMode="cover"
          />
          <View style={{
            position: "absolute", bottom: -3, right: -3,
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: cfg.iconBg,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1.5, borderColor: "#fff",
            elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3,
          }}>
            <Ionicons name={cfg.icon} size={12} color={cfg.iconColor} />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, color: "#111827", lineHeight: 20, marginBottom: 3, flex: 1, paddingRight: 8 }}>
              <Text style={{ fontWeight: "700" }}>{notification.user.name}</Text>
              {"  "}
              {notification.message}
            </Text>
            {isUnread && (
              <View style={{
                width: 9, height: 9, borderRadius: 5,
                backgroundColor: "#3B82F6", marginTop: 5, flexShrink: 0,
              }} />
            )}
          </View>

          <Text style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>
            {getTimeAgo(notification.time)}
          </Text>

          <View style={{
            alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 20, backgroundColor: cfg.badgeBg,
          }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.badgeText }}>
              {cfg.badgeLabel}
            </Text>
          </View>

          {notification.showButtons && (
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity style={{
                backgroundColor: "#000", paddingHorizontal: 16,
                paddingVertical: 8, borderRadius: 8, marginRight: 8,
              }}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ color: "#374151", fontSize: 13, fontWeight: "500" }}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 8, backgroundColor: "#F9FAFB" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#111827", paddingTop: 12 }}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={{
                marginLeft: 10, marginTop: 12,
                backgroundColor: "#EF4444", borderRadius: 12,
                paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                marginTop: 12, paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 8, backgroundColor: "#EFF6FF",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#3B82F6" }}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setActiveFilter("all")}
            style={{
              paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
              backgroundColor: activeFilter === "all" ? "#111827" : "#F3F4F6",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: activeFilter === "all" ? "#fff" : "#6B7280" }}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveFilter("unread")}
            style={{
              paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
              backgroundColor: activeFilter === "unread" ? "#111827" : "#F3F4F6",
              flexDirection: "row", alignItems: "center", gap: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: activeFilter === "unread" ? "#fff" : "#6B7280" }}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={{ backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._stableKey}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: "#F3F4F6", marginLeft: 76 }} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 120 }}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text style={{ fontSize: 17, color: "#9CA3AF", marginTop: 16, fontWeight: "500" }}>
                {activeFilter === "unread" ? "No unread notifications" : "No notifications yet"}
              </Text>
              <Text style={{ fontSize: 13, color: "#D1D5DB", marginTop: 6 }}>
                {activeFilter === "unread" ? "You're all caught up! 🎉" : "We'll notify you when something happens"}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}