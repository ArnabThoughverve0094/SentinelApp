// app/followers/[userid].tsx
import { db } from "@/FirebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  getDocs,
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
  const { userid, type } = useLocalSearchParams<{
    userid: string;
    type: "followers" | "following";
  }>();
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    (type as "followers" | "following") || "followers"
  );

  // Fetch user details from posts
  const fetchUserDetailsFromPosts = async (userIds: string[]): Promise<Map<string, UserItem>> => {
    const uniqueUsers = new Map<string, UserItem>();

    if (userIds.length === 0) {
      return uniqueUsers;
    }

    try {
      console.log(`🔍 Fetching details for ${userIds.length} unique user IDs...`);

      // Fetch from SentinelPosts
      const sentinelSnapshot = await getDocs(collection(db, "SentinelPosts"));
      sentinelSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const authorId = data.AuthorUserID;

        if (authorId && userIds.includes(authorId) && !uniqueUsers.has(authorId)) {
          uniqueUsers.set(authorId, {
            userId: authorId,
            userName: data.AuthorName || "Unknown User",
            userNickName: data.AuthorNickName || data.AuthorName,
            profilePicUrl: data.AuthorImageURL || "",
            userBio: data.AuthorBio || "",
            followersCount: 0,
          });
        }
      });

      // Fetch from X-Data for remaining users
      const xDataSnapshot = await getDocs(collection(db, "X-Data"));
      xDataSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const authorId = data.AuthorUserID;

        if (authorId && userIds.includes(authorId) && !uniqueUsers.has(authorId)) {
          uniqueUsers.set(authorId, {
            userId: authorId,
            userName: data.AuthorName || "Unknown User",
            userNickName: data.AuthorNickName || data.AuthorName,
            profilePicUrl: data.AuthorImageURL || "",
            userBio: data.AuthorBio || "",
            followersCount: 0,
          });
        }
      });

      console.log(`✅ Found details for ${uniqueUsers.size} users`);
    } catch (error) {
      console.error("❌ Error fetching user details:", error);
    }

    return uniqueUsers;
  };

  const fetchFollowers = useCallback(async () => {
    if (!userid) {
      console.log("❌ No userid provided");
      setLoading(false);
      return;
    }

    console.log("🔍 Fetching followers for userid:", userid);
    setLoading(true);

    try {
      const usersRef = collection(db, "SentinelUsers");
      const q = query(usersRef, where("Following", "array-contains", userid));
      
      const snapshot = await getDocs(q);
      console.log(`📊 Query returned ${snapshot.size} documents`);

      // CRITICAL: Use Set to deduplicate by userID
      const uniqueFollowerIds = new Set<string>();
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const followerId = data.userID;
        
        if (followerId) {
          uniqueFollowerIds.add(followerId);
          console.log(`📍 Found follower: ${followerId} (${data.userName || 'Unknown'})`);
        } else {
          console.warn(`⚠️ Document ${doc.id} has no userID field`);
        }
      });

      const followerIdsArray = Array.from(uniqueFollowerIds);
      console.log(`✅ Total UNIQUE followers: ${followerIdsArray.length}`);
      console.log(`📋 Unique follower IDs:`, followerIdsArray);

      if (followerIdsArray.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch details from posts
      const userDetailsMap = await fetchUserDetailsFromPosts(followerIdsArray);
      
      // Convert to array
      const followersList: UserItem[] = [];
      followerIdsArray.forEach((followerId) => {
        const userDetails = userDetailsMap.get(followerId);
        if (userDetails) {
          followersList.push(userDetails);
        } else {
          console.warn(`⚠️ No post data found for follower: ${followerId}`);
        }
      });

      console.log(`✅ Displaying ${followersList.length} followers`);
      setUsers(followersList);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching followers:", error);
      setUsers([]);
      setLoading(false);
    }
  }, [userid]);

  const fetchFollowing = useCallback(async () => {
    if (!userid) {
      console.log("❌ No userid provided");
      setLoading(false);
      return;
    }

    console.log("🔍 Fetching following for userid:", userid);
    setLoading(true);

    try {
      const usersRef = collection(db, "SentinelUsers");
      const userQuery = query(usersRef, where("userID", "==", userid));
      
      const snapshot = await getDocs(userQuery);
      console.log(`📊 User query returned ${snapshot.size} documents`);

      if (snapshot.empty) {
        console.log("⚠️ User not found");
        setUsers([]);
        setLoading(false);
        return;
      }

      // CRITICAL: If multiple docs with same userID exist, use the first one
      const userData = snapshot.docs[0].data();
      const followingIds = userData.Following || [];

      console.log(`📋 Following array has ${followingIds.length} total IDs:`, followingIds);

      // Filter out Twitter IDs (only keep UUID format)
      const validUUIDs = followingIds.filter((id: string) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUUID) {
          console.log(`⚠️ Filtering out Twitter ID: ${id}`);
        }
        return isUUID;
      });

      console.log(`✅ Filtered to ${validUUIDs.length} valid app user IDs`);

      if (validUUIDs.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch details from posts
      const userDetailsMap = await fetchUserDetailsFromPosts(validUUIDs);
      
      // Convert to array in order
      const followingList: UserItem[] = [];
      validUUIDs.forEach((followingId: string) => {
        const userDetails = userDetailsMap.get(followingId);
        if (userDetails) {
          followingList.push(userDetails);
        } else {
          console.warn(`⚠️ No post data found for following user: ${followingId}`);
        }
      });

      console.log(`✅ Displaying ${followingList.length} following`);
      setUsers(followingList);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching following:", error);
      setUsers([]);
      setLoading(false);
    }
  }, [userid]);

  useEffect(() => {
    console.log(`\n🔄 Active tab: ${activeTab}\n`);

    if (activeTab === "followers") {
      fetchFollowers();
    } else {
      fetchFollowing();
    }

    // No cleanup needed for getDocs (not a listener)
  }, [activeTab, userid]);

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
          <Text className="text-gray-500 mt-4">Loading {activeTab}...</Text>
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
          keyExtractor={(item) => item.userId}
          className="flex-1"
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}
