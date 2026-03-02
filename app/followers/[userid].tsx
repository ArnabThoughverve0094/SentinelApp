// app/followers/[userid].tsx
import { db } from "@/FirebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";

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

// ✅ Move this function to the top level, outside the component
const getFullImageUrl = (profilePath?: string): string => {
  if (!profilePath) return dummyAuthorImage;
  if (profilePath.startsWith("http")) return profilePath;
  return `https://sentinal-uploads.s3.us-west-2.amazonaws.com${profilePath}`;
};

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

  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ✅ Fetch user details from SentinelUsers collection (primary source)
  const fetchUserDetailsFromSentinelUsers = async (userIds: string[]): Promise<Map<string, UserItem>> => {
    const uniqueUsers = new Map<string, UserItem>();

    if (userIds.length === 0) {
      return uniqueUsers;
    }

    try {
      console.log(`🔍 Fetching details from SentinelUsers for ${userIds.length} user IDs...`);

      const usersRef = collection(db, "SentinelUsers");
      
      // Firebase 'in' query supports max 10 items, so batch the requests
      for (let i = 0; i < userIds.length; i += 10) {
        const batch = userIds.slice(i, i + 10);
        const q = query(usersRef, where("userID", "in", batch));
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const userId = data.userID;
          
          if (userId && !uniqueUsers.has(userId)) {
            uniqueUsers.set(userId, {
              userId: userId,
              userName: data.userName || data.name || "Account Deleted",
              userNickName: data.userNickName || data.nickName || data.userName || data.name,
              profilePicUrl: data.profilePicUrl || "",
              userBio: data.userBio || data.bio || "",
              followersCount: data.FollowersCount || 0,
            });
          }
        });
      }

      console.log(`✅ Found ${uniqueUsers.size} users from SentinelUsers`);

      // If some users still missing, try fetching from posts as fallback
      const missingUserIds = userIds.filter(id => !uniqueUsers.has(id));
      if (missingUserIds.length > 0) {
        console.log(`🔍 Fetching ${missingUserIds.length} missing users from posts...`);
        
        const sentinelSnapshot = await getDocs(collection(db, "SentinelPosts"));
        sentinelSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const authorId = data.AuthorUserID;

          if (authorId && missingUserIds.includes(authorId) && !uniqueUsers.has(authorId)) {
            uniqueUsers.set(authorId, {
              userId: authorId,
              userName: data.AuthorName || "Account Deleted",
              userNickName: data.AuthorNickName || data.AuthorName,
              profilePicUrl: data.AuthorImageURL || "",
              userBio: data.AuthorBio || "",
              followersCount: 0,
            });
          }
        });

        console.log(`✅ Total users found: ${uniqueUsers.size}`);
      }

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
      // const usersRef = collection(db, "IronExUsers");
      // const q = query(usersRef, where("Following", "array-contains", userid));
      
      // const snapshot = await getDocs(q);
      // console.log(`📊 Query returned ${snapshot.size} documents`);

      // const uniqueFollowerMap = new Map<string, any>();
      
      // snapshot.docs.forEach((doc) => {
      //   const data = doc.data();
      //   const followerId = data.userID;
        
      //   if (followerId) {
      //     if (!uniqueFollowerMap.has(followerId)) {
      //       uniqueFollowerMap.set(followerId, {
      //         docId: doc.id,
      //         data: data
      //       });
      //       console.log(`📍 Found unique follower: ${followerId} (${data.userName || 'Unknown'})`);
      //     } else {
      //       console.log(`⚠️ Skipping duplicate follower document for: ${followerId}`);
      //     }
      //   } else {
      //     console.warn(`⚠️ Document ${doc.id} has no userID field`);
      //   }
      // });

      // const followerIdsArray = Array.from(uniqueFollowerMap.keys());
      // console.log(`✅ Total UNIQUE followers: ${followerIdsArray.length}`);

      // if (followerIdsArray.length === 0) {
      //   setUsers([]);
      //   setLoading(false);
      //   return;
      // }

      // const userDetailsMap = await fetchUserDetailsFromSentinelUsers(followerIdsArray);
      
      // const followersList: UserItem[] = [];
      // followerIdsArray.forEach((followerId) => {
      //   const userDetails = userDetailsMap.get(followerId);
      //   if (userDetails) {
      //     followersList.push(userDetails);
      //   } else {
      //     console.warn(`⚠️ No user data found for follower: ${followerId}`);
      //   }
      // });

      // console.log(`✅ Displaying ${followersList.length} followers`);
      // setUsers(followersList);
      // setLoading(false);

      // --------------------------------------------------------
      // const usersRef = collection(db, "IronExUsers");

      // // Logic: "Find all users whose 'Following' array has an object with this userId"
      // // Note: This works best if you keep the object structure consistent
      // const q = query(
      //   usersRef, 
      //   where("Following", "array-contains", { 
      //     userId: userid,
      //       // If you store other fields like userName in the array, 
      //       // they must be included here for an exact match, OR 
      //       // see the "Better Approach" below.
      //   })
      // );

      // try {
      //   const querySnapshot = await getDocs(q);
      //   const followers = querySnapshot.docs.map(doc => ({
      //     id: doc.id,
      //     ...doc.data()
      //   }));
      //   console.log(`✅ Displaying followers`, followers);
      //   console.log(`✅ Displaying ${followers.length} followers`);
      //   return followers;
      // } catch (error) {
      //   console.error("Error fetching followers:", error);
      //   return [];
      // }
      // -----------------------------------------------------

      const userDocRef = doc(db, 'IronExUsers', userid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        // Access the 'Follower' array you created in handleFollowPress
        // const followersList: UserItem[] = [];
        
        // followerIdsArray.forEach((followerId) => {
        //   const userDetails = userDetailsMap.get(followerId);
        //   if (userDetails) {
        //     followersList.push(userDetails);
        //   } else {
        //     console.warn(`⚠️ No user data found for follower: ${followerId}`);
        //   }
        // });
        
        const fetchedFollower: UserItem[] = userData.Follower || [];
        console.log(`✅ Displaying followers`, userData);
        console.log(`✅ Displaying ${fetchedFollower.length} followers`);
        setUsers(fetchedFollower);
      }

    } catch (error) {
      console.error("❌ Error fetching followers:", error);
      setUsers([]);
      setLoading(false);
    } finally{
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
      // const usersRef = collection(db, "IronExUsers");
      // const userQuery = query(usersRef, where("userID", "==", userid));
      
      // const snapshot = await getDocs(userQuery);
      // console.log(`📊 User query returned ${snapshot.size} documents`);

      // if (snapshot.empty) {
      //   console.log("⚠️ User not found");
      //   setUsers([]);
      //   setLoading(false);
      //   return;
      // }

      // const allFollowingIds = new Set<string>();
      
      // snapshot.docs.forEach((doc) => {
      //   const followingArray = doc.data().Following || [];
      //   followingArray.forEach((id: string) => allFollowingIds.add(id));
      // });

      // const mergedFollowingIds = Array.from(allFollowingIds);
      // console.log(`📋 Merged Following from ${snapshot.size} documents: ${mergedFollowingIds.length} total IDs`);

      // const validUUIDs = mergedFollowingIds.filter((id: string) => {
      //   const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      //   if (!isUUID) {
      //     console.log(`⚠️ Filtering out non-UUID ID: ${id}`);
      //   }
      //   return isUUID;
      // });

      // console.log(`✅ Filtered to ${validUUIDs.length} valid app user IDs`);

      // if (validUUIDs.length === 0) {
      //   setUsers([]);
      //   setLoading(false);
      //   return;
      // }

      // const userDetailsMap = await fetchUserDetailsFromSentinelUsers(validUUIDs);
      
      // const followingList: UserItem[] = [];
      // validUUIDs.forEach((followingId: string) => {
      //   const userDetails = userDetailsMap.get(followingId);
      //   if (userDetails) {
      //     followingList.push(userDetails);
      //   } else {
      //     console.warn(`⚠️ No user data found for following user: ${followingId}`);
      //   }
      // });

      const userDocRef = doc(db, 'IronExUsers', userid);

      const unsubscribeFollowing = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          // 1. Get the Array of following objects
          const followingList: UserItem[] = data.Following || [];

          // Update your React states
          // setFollowingData(followingList);
          console.log(`✅ Displaying ${followingList.length} following`);
          setUsers(followingList);
        }
      }, (error) => {
        console.error("❌ Real-time listener failed:", error);
      });

  
      

      // console.log(`✅ Displaying ${followingList.length} following`);
      // setUsers(followingList);
      setLoading(false);

      return () => {
        unsubscribeFollowing();
      };
      
    } catch (error) {
      console.error("❌ Error fetching following:", error);
      setUsers([]);
      setLoading(false);
    } finally {
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
  }, [activeTab, userid, fetchFollowers, fetchFollowing]);

  const handleUserPress = useCallback(
    (user: UserItem) => {
      if (user.userName != 'Account Deleted') {
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
      }
      
    },
    [router]
  );

  const handleFollowPress = useCallback(async (itemUserId: any, itemUserName: any) => {
    setLoadingId(itemUserId);
    try {
      if (itemUserId) {
        const userDocRef = collection(db, "SentinelUsers");
        let followingDocId="";

        const unsubscribeFollowing = onSnapshot(userDocRef, async followingSnapshot => {
          const followingdataArr = followingSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          }))

          for (const doc of followingdataArr) {
            const followingObjData = doc.data;
      
            if (followingObjData.userID === userid) {
              followingDocId = doc.id;
            }
          }
        })

        const userRef = doc(db, "SentinelUsers", followingDocId);
          await updateDoc(userRef, {
            Following: arrayRemove(itemUserId),
          });
        console.log(`✅ Successfully unfollowed user: ${itemUserId}`);
        Toast.show({
          type: "success",
          text1: "Unfollowed",
          text2: `You unfollowed ${itemUserName || "this user"}`,
          position: "bottom",
          visibilityTime: 2000,
        });

        return unsubscribeFollowing;

      }

      console.log("⏳ Waiting for onSnapshot to update UI...\n");
    } catch (error) {
      console.error("❌ Error handling follow/unfollow:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update follow status. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingId(null); // Stop loading regardless of success/fail
    }
  }, []);

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

        {item.userName === 'Account Deleted' ? (
        null
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}

       {/* {item.userName === 'Account Deleted' ? (
        <TouchableOpacity 
          className={`px-5 py-2 rounded-full bg-gray-200`}
          onPress={() => handleFollowPress(item.userId, item.userName)}
          disabled={loadingId === item.userId} // Prevent double-clicks
          activeOpacity={0.8}
         >
          {loadingId === item.userId ? (
            <ActivityIndicator size="small" color="#374151" />
            ) : (
            <Text className="font-semibold text-sm text-gray-700">Unfollow</Text>
          )}
        </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )} */}
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
