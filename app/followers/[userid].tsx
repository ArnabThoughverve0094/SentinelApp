// app/followers/[userId].tsx
import { db } from "@/FirebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const dummyAuthorImage =
  "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg";

interface UserItem {
  userId: string;
  userName: string;
  userNickName?: string;
  profilePicUrl?: string;
  userBio?: string;
  followersCount?: number;
}

export default function FollowersFollowingScreen() {
  const { userId, type } = useLocalSearchParams<{
    userId: string;
    type: "followers" | "following";
  }>();
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    (type as "followers" | "following") || "followers"
  );

  const fetchFollowers = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Query for users who have this userId in their Following array
      const usersRef = collection(db, "SentinelUsers");
      const q = query(usersRef, where("Following", "array-contains", userId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const followersList: UserItem[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            
            // ✅ Only include users with valid data
            if (data.userID && data.userName) {
              followersList.push({
                userId: data.userID,
                userName: data.userName,
                userNickName: data.userNickName,
                profilePicUrl: data.profilePicUrl,
                userBio: data.userBio,
                followersCount: data.FollowersCount || 0,
              });
            }
          });

          console.log(`✅ Followers: Found ${followersList.length} users`);
          setUsers(followersList);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching followers:", error);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up followers listener:", error);
      setLoading(false);
    }
  }, [userId]);

  const fetchFollowing = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const usersRef = collection(db, "SentinelUsers");
      const userQuery = query(usersRef, where("userID", "==", userId));
      
      const unsubscribe = onSnapshot(
        userQuery,
        async (snapshot) => {
          if (snapshot.empty) {
            console.log(`⚠️ No user found with ID: ${userId}`);
            setUsers([]);
            setLoading(false);
            return;
          }

          const userDoc = snapshot.docs[0];
          const followingIds = userDoc.data().Following || [];

          console.log(`📋 Following Array has ${followingIds.length} IDs:`, followingIds);

          if (followingIds.length === 0) {
            setUsers([]);
            setLoading(false);
            return;
          }

          const followingList: UserItem[] = [];

          // Fetch user details for each ID in the Following array
          for (let i = 0; i < followingIds.length; i += 10) {
            const batch = followingIds.slice(i, i + 10);
            const batchQuery = query(usersRef, where("userID", "in", batch));
            const batchSnapshot = await getDocs(batchQuery);

            batchSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              
              // ✅ Only include users with valid data
              if (data.userID && data.userName) {
                followingList.push({
                  userId: data.userID,
                  userName: data.userName,
                  userNickName: data.userNickName,
                  profilePicUrl: data.profilePicUrl,
                  userBio: data.userBio,
                  followersCount: data.FollowersCount || 0,
                });
              }
            });
          }

          console.log(`✅ Following: Found ${followingList.length} valid users`);
          setUsers(followingList);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching following:", error);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up following listener:", error);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      if (activeTab === "followers") {
        unsubscribe = await fetchFollowers();
      } else {
        unsubscribe = await fetchFollowing();
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab, fetchFollowers, fetchFollowing]);

  const getFullImageUrl = (profilePath?: string): string => {
    if (!profilePath) return dummyAuthorImage;
    if (profilePath.startsWith("http")) return profilePath;
    return `https://sentinal-uploads.s3.us-west-2.amazonaws.com${profilePath}`;
  };

  const handleUserPress = useCallback(
    (user: UserItem) => {
      router.push({
        pathname: "/profile/[userId]" as any,
        params: {
          userId: user.userId,
          authorName: user.userName,
          authorImageUrl: getFullImageUrl(user.profilePicUrl),
          userBio: user.userBio || "",
          isAnonymous: "false",
        },
      });
    },
    [router]
  );

  const renderUserItem = useCallback(
    ({ item }: { item: UserItem }) => (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getFullImageUrl(item.profilePicUrl) }}
          className="w-12 h-12 rounded-full mr-3"
          resizeMode="cover"
        />

        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-base">
            {item.userName}
          </Text>
          <Text className="text-gray-500 text-sm">
            @{item.userNickName || item.userName}
          </Text>
          {item.userBio && (
            <Text className="text-gray-600 text-xs mt-1" numberOfLines={1}>
              {item.userBio}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    ),
    [handleUserPress]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {activeTab === "followers" ? "Followers" : "Following"}
        </Text>
      </View>

      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${
            activeTab === "followers" ? "border-b-2 border-black" : ""
          }`}
          onPress={() => setActiveTab("followers")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "followers" ? "text-black" : "text-gray-500"
            }`}
          >
            Followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 items-center ${
            activeTab === "following" ? "border-b-2 border-black" : ""
          }`}
          onPress={() => setActiveTab("following")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "following" ? "text-black" : "text-gray-500"
            }`}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : users.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg font-semibold mt-4">
            {activeTab === "followers" ? "No followers yet" : "No following yet"}
          </Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            {activeTab === "followers"
              ? "Users who follow this profile will appear here"
              : "Users this profile follows will appear here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => `${item.userId}-${index}`}
          className="flex-1"
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

