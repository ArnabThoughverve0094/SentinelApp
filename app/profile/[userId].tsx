// app/profile/[userId].tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Share,
  Modal,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/FirebaseConfig";
import Toast from "react-native-toast-message";
import CommentsModal from "@/components/CommentsModal";
import TotalSentiment from "@/components/TotalSentiment";

const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';
const dummyHeaderImage =
  "https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg";

interface UserDoc {
  userID?: string;
  userName?: string;
  userNickName?: string;
  profilePicUrl?: string;
  userBio?: string;
  Website?: string;
  website?: string;
  FollowersCount?: number;
  Following?: string[];
  PostsCount?: number;
}

interface PostItem {
  id: string;
  uniqueId: string;
  AuthorUserID?: string;
  AuthorImageURL: string;
  AuthorName: string;
  ContentDate: string;
  ContentDesc: string;
  ContentURL: string;
  ContentURLs?: string[];
  ContentLikeCount: number;
  ContentRepostCount: number;
  ContentCommentCount?: number;
  isApproved: boolean;
  isNew: boolean;
  postType: string;
  Liked: boolean;
  Reposted: boolean;
  Bookmarked?: boolean;
  createdAt?: any;
  CommentTemplate: string;
  isRepost?: boolean;
  originalPost?: PostItem;
  repostComment?: string;
  repostedBy?: string;
  repostedAt?: any;
  isAnonymous: boolean;
  contentType: string;
}

interface RepostModalProps {
  visible: boolean;
  onClose: () => void;
  post: PostItem | null;
  onSimpleRepost: () => void;
  onQuoteRepost: (comment: string) => void;
}

const RepostModal: React.FC<RepostModalProps> = ({
  visible,
  onClose,
  post,
  onSimpleRepost,
  onQuoteRepost,
}) => {
  const [repostComment, setRepostComment] = useState("");
  const [isQuoteMode, setIsQuoteMode] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRepostComment("");
      setIsQuoteMode(false);
    }
  }, [visible]);

  const handleQuoteRepost = () => {
    if (repostComment.trim()) {
      onQuoteRepost(repostComment.trim());
      onClose();
    }
  };

  const handleSimpleRepost = () => {
    onSimpleRepost();
    onClose();
  };

  if (!visible || !post) return null;

  let AuthorName: string;
  let AuthorImage: string;
  if (post.isAnonymous) {
    AuthorName = "Anonymous";
    AuthorImage = dummyAuthorImage;
  } else {
    AuthorName = post.AuthorName;
    AuthorImage = post.AuthorImageURL;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-end px-4 pb-8">
        <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
          <View className="px-6 pt-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Share this post</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Add your thoughts or share as is
                </Text>
              </View>
              <TouchableOpacity className="p-2 rounded-full bg-gray-100" onPress={onClose}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-2 py-0">
            <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Image
                  source={{ uri: AuthorImage }}
                  className="w-8 h-8 rounded-full mr-2"
                  resizeMode="cover"
                />
                <Text className="font-semibold text-gray-900 text-sm">{AuthorName}</Text>
              </View>
              <Text className="text-gray-700 text-sm" numberOfLines={3}>
                {post.ContentDesc}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-600 text-sm">Add your thoughts?</Text>
              <TouchableOpacity
                onPress={() => setIsQuoteMode(!isQuoteMode)}
                className={`px-3 py-1 rounded-full border ${
                  isQuoteMode ? "bg-black border-black" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-xs font-medium ${isQuoteMode ? "text-white" : "text-gray-600"}`}>
                  Quote
                </Text>
              </TouchableOpacity>
            </View>

            {isQuoteMode && (
              <View className="mb-4">
                <TextInput
                  className="border border-gray-300 rounded-xl p-3 text-gray-900 min-h-[80px]"
                  placeholder="Add your comment..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={repostComment}
                  onChangeText={setRepostComment}
                  maxLength={280}
                />
                <Text className="text-xs text-gray-500 mt-1 text-right">
                  {repostComment.length}/280
                </Text>
              </View>
            )}

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleSimpleRepost}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="repeat" size={18} color="#64748b" />
                  <Text className="ml-2 text-gray-700 font-semibold">Repost</Text>
                </View>
              </TouchableOpacity>

              {isQuoteMode && (
                <TouchableOpacity
                  onPress={handleQuoteRepost}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    repostComment.trim() ? "bg-black" : "bg-gray-300"
                  }`}
                  activeOpacity={0.8}
                  disabled={!repostComment.trim()}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="comment-quote"
                      size={18}
                      color={repostComment.trim() ? "white" : "#9CA3AF"}
                    />
                    <Text
                      className={`ml-2 font-semibold ${
                        repostComment.trim() ? "text-white" : "text-gray-500"
                      }`}
                    >
                      Quote
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getFullImageUrl = (profilePath?: string): string => {
  const dummy = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';
  
  if (!profilePath) return dummy;
  if (profilePath.startsWith("http")) return profilePath;
  return `https://sentinal-uploads.s3.us-west-2.amazonaws.com${profilePath}`;
};

export default function UserProfileScreen() {
  const { userId, authorName, authorImageUrl, isAnonymous, userBio } = useLocalSearchParams<{
    userId: string;
    authorName?: string;
    authorImageUrl?: string;
    isAnonymous?: string;
    userBio?: string;
  }>();

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [currentUserDocId, setCurrentUserDocId] = useState("");
  const [profileUserDocId, setProfileUserDocId] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedCommentTemplate, setSelectedCommentTemplate] = useState<string | null>(null);

  const [isGraphModalVisible, setIsGraphModalVisible] = useState(false);
  const [selectedGraphPostId, setSelectedGraphPostId] = useState<string | null>(null);
  const [selectedGraphPostType, setSelectedGraphPostType] = useState<string | null>(null);

  const [isRepostModalVisible, setIsRepostModalVisible] = useState(false);
  const [selectedRepostPost, setSelectedRepostPost] = useState<PostItem | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const ImageFullScreenModal = () => (
    <Modal
      visible={isImageModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsImageModalVisible(false)}
    >
      <View className="flex-1 bg-black">
        <View className="absolute top-0 left-0 right-0 z-50 bg-black/80">
          <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
            <TouchableOpacity
              onPress={() => setIsImageModalVisible(false)}
              className="w-10 h-10 rounded-full bg-gray-800/60 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-800/60 items-center justify-center"
            >
              <Feather name="more-vertical" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: avatar }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
          <View className="px-6 pb-8 pt-4">
            <Text className="text-white text-lg font-semibold">
              {displayName}
            </Text>
            {userDoc?.userBio && (
              <Text className="text-white/80 text-sm mt-1">
                {userDoc.userBio}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  useEffect(() => {
    const loadCurrentUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setCurrentUserId(id);
    };
    loadCurrentUser();
  }, []);

  const fetchUserFollowing = useCallback(async () => {
    if (isAnonymous === 'true') {
      return;
    }
    try {
      let fetchuserID = currentUserId;
      if (!fetchuserID) {
        fetchuserID = (await AsyncStorage.getItem("userId")) || "";
        setCurrentUserId(fetchuserID);
      }

      if (fetchuserID) {
        console.log("👤 Fetching following list for user:", fetchuserID);
        const sentinelUsersRef = collection(db, "SentinelUsers");
        const q = query(sentinelUsersRef, where("userID", "==", fetchuserID));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            setCurrentUserDocId(userDoc.id);
            const following = userData.Following || [];
            setFollowingUserIds(following);
            console.log("✅ Following list updated:", following);

            if (userId) {
              const isUserFollowing = following.includes(userId);
              setIsFollowing(isUserFollowing);
              console.log(`📌 Is following ${userId}:`, isUserFollowing);
            }
          } else {
            console.log("📝 No user document found");
            setFollowingUserIds([]);
            setCurrentUserDocId("");
            setIsFollowing(false);
          }
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error("❌ Error fetching following list:", error);
      setFollowingUserIds([]);
      setIsFollowing(false);
    }
  }, [currentUserId, userId, isAnonymous]);

  useEffect(() => {
    fetchUserFollowing();
  }, [fetchUserFollowing]);

  useEffect(() => {
    if (userId) {
      const isUserFollowing = followingUserIds.includes(userId);
      setIsFollowing(isUserFollowing);
      console.log(`🔄 Updated following status for ${userId}:`, isUserFollowing);
    }
  }, [userId, followingUserIds]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      setLoading(true);
      
      try {
        if (isAnonymous === 'true') {
          const mapped: UserDoc = {
            userID: 'anonymous',
            userName: 'Anonymous',
            userNickName: 'Anonymous',
            profilePicUrl: dummyAuthorImage,
            userBio: userBio as string || 'This is an anonymous user',
            Website: undefined,
            website: undefined,
            FollowersCount: 0,
            Following: [],
            PostsCount: 0,
          };
          setUserDoc(mapped);
          setLoading(false);
          return;
        }

        const storedUserId = await AsyncStorage.getItem("userId");

        if (storedUserId && storedUserId === userId) {
          const [name, nickname, email, country, bio, profilePicUrl] =
            await AsyncStorage.multiGet([
              "userName",
              "userNickName",
              "userEmail",
              "userCountry",
              "userBio",
              "profilePicUrl",
            ]);

          const usersRef = collection(db, "SentinelUsers");
          const qSnap = query(usersRef, where("userID", "==", storedUserId));
          
          const unsubscribe = onSnapshot(qSnap, (snapshot) => {
            const mapped: UserDoc = {
              userID: storedUserId,
              userName: name[1] || authorName || "",
              userNickName: nickname[1] || "",
              profilePicUrl: profilePicUrl[1] || (authorImageUrl as string) || "",
              userBio: bio[1] || "",
              Website: undefined,
              website: undefined,
              FollowersCount: 0,
              Following: [],
              PostsCount: 0,
            };

            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              setProfileUserDocId(snapshot.docs[0].id);
              mapped.FollowersCount = data.FollowersCount || 0;
              mapped.Following = data.Following || [];
              mapped.PostsCount = data.PostsCount || 0;
            }

            setUserDoc(mapped);
            setLoading(false);
          });

          return () => unsubscribe();
        }

        const usersRef = collection(db, "SentinelUsers");
        const qSnap = query(usersRef, where("userID", "==", userId as string));

        const unsubscribe = onSnapshot(qSnap, (snapshot) => {
          if (!snapshot.empty) {
            const userDocData = snapshot.docs[0];
            const data = userDocData.data() as DocumentData;
            setProfileUserDocId(userDocData.id);

            const mapped: UserDoc = {
              userID: data.userID || data.userId,
              userName:
                data.name ||
                data.userName ||
                data.UserName ||
                data.AuthorName ||
                authorName ||
                "",
              userNickName:
                data.nickName ||
                data.nickname ||
                data.userNickName ||
                data.userNick ||
                "",
              profilePicUrl:
                data.profilePicUrl ||
                data.profilePic ||
                data.AuthorImageURL ||
                (authorImageUrl as string) ||
                "",
              userBio: data.bio || data.userBio || data.Bio || "",
              Website: data.Website,
              website: data.website,
              FollowersCount: data.FollowersCount || 0,
              Following: data.Following || [],
              PostsCount: data.PostsCount || 0,
            };

            setUserDoc(mapped);
            setLoading(false);
          } else {
            const mapped: UserDoc = {
              userID: userId,
              userName: (authorName as string) || "",
              userNickName: "",
              profilePicUrl: (authorImageUrl as string) || "",
              userBio: (userBio as string) || "",
              Website: undefined,
              website: undefined,
              FollowersCount: 0,
              Following: [],
              PostsCount: 0,
            };
            setUserDoc(mapped);
            setLoading(false);
          }
        });

        return () => unsubscribe();
      } catch (e) {
        console.log("Error loading user profile", e);
        setUserDoc(null);
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, authorName, authorImageUrl, isAnonymous, userBio]);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;

    try {
      const collSentinelRefPost = collection(db, "SentinelPosts");
      
      let querySentinel;
      if (isAnonymous === 'true') {
        querySentinel = query(
          collSentinelRefPost,
          where("isAnonymous", "==", true)
        );
      } else {
        querySentinel = query(
          collSentinelRefPost,
          where("AuthorUserID", "==", userId as string)
        );
      }

      const unsubscribeSentinel = onSnapshot(querySentinel, async (sentinelSnapshot) => {
        const sentineldataArr = sentinelSnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));

        const postsData: PostItem[] = [];
        const loggedUserId = await AsyncStorage.getItem("userId");

        for (const doc of sentineldataArr) {
          const postData = doc.data;
          const postId = doc.id;

          if (!postData.isApproved || postData.isNew) {
            continue;
          }

          if (isAnonymous === 'true' && !postData.isAnonymous) {
            continue;
          }

          if (isAnonymous !== 'true' && postData.isAnonymous) {
            continue;
          }

          postsData.push({
            uniqueId: `sentinel-${postId}`,
            id: postId,
            AuthorImageURL: postData.AuthorImageURL,
            AuthorName: postData.AuthorName,
            AuthorUserID: postData.AuthorUserID || postData.repostedBy || "",
            ContentDate: postData.ContentDate,
            ContentDesc: postData.ContentDesc,
            ContentURL: postData.ContentURL,
            ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
            ContentLikeCount: postData.ContentLikeCount || 0,
            ContentRepostCount: postData.ContentRepostCount || 0,
            ContentCommentCount: postData.ContentCommentCount || 0,
            isApproved: postData.isApproved || false,
            isNew: postData.isNew !== undefined ? postData.isNew : true,
            postType: "SentinelPosts",
            Liked: postData.LikedBy?.includes(loggedUserId) || false,
            Reposted: postData.RepostedBy?.includes(loggedUserId) || false,
            Bookmarked: postData.BookmarkedBy?.includes(loggedUserId) || false,
            createdAt: postData.createdAt || postData.ContentDate,
            CommentTemplate: postData.CommentTemplate || "Sentinel Default Template",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || "",
            repostedBy: postData.repostedBy || "",
            repostedAt: postData.repostedAt || null,
            isAnonymous: postData.isAnonymous || false,
            contentType: postData.contentType || "My Thoughts",
          });
        }

        const sortedPosts = postsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        setUserPosts(sortedPosts);

        sortedPosts.forEach((post) => {
          onSnapshot(collection(doc(db, post.postType, post.id), "Comments"), (commentsSnap) => {
            let totalComments = 0;
            totalComments = commentsSnap.size;
            commentsSnap.forEach((comment) => {
              onSnapshot(
                collection(doc(db, post.postType, post.id), "Comments", comment.id, "Replies"),
                (repliesSnap) => {
                  totalComments += repliesSnap.size;
                }
              );
            });
            setUserPosts((prev) =>
              prev.map((p) => (p.id === post.id ? { ...p, ContentCommentCount: totalComments } : p))
            );
          });
        });
      });

      return unsubscribeSentinel;
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  }, [userId, isAnonymous]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserPosts();
    setRefreshing(false);
  }, [fetchUserPosts]);

  const handleFollowPress = useCallback(async () => {
    if (!userId) return;

    console.log(`\n🔄 ${isFollowing ? "Unfollowing" : "Following"} user`);
    console.log("User ID:", userId);
    console.log("Profile User Doc ID:", profileUserDocId);

    try {
      if (isFollowing) {
        if (currentUserDocId) {
          const userRef = doc(db, "SentinelUsers", currentUserDocId);
          await updateDoc(userRef, {
            Following: arrayRemove(userId),
          });

          if (profileUserDocId) {
            const profileRef = doc(db, "SentinelUsers", profileUserDocId);
            await updateDoc(profileRef, {
              FollowersCount: increment(-1),
            });
            console.log("✅ Decreased follower count for profile user");
          }

          console.log(`✅ Successfully unfollowed user: ${userId}`);
          Toast.show({
            type: "success",
            text1: "Unfollowed",
            text2: `You unfollowed ${userDoc?.userName || "this user"}`,
            position: "bottom",
            visibilityTime: 2000,
          });
        }
      } else {
        if (currentUserDocId) {
          const userRef = doc(db, "SentinelUsers", currentUserDocId);
          await updateDoc(userRef, {
            Following: arrayUnion(userId),
          });

          if (profileUserDocId) {
            const profileRef = doc(db, "SentinelUsers", profileUserDocId);
            await updateDoc(profileRef, {
              FollowersCount: increment(1),
            });
            console.log("✅ Increased follower count for profile user");
          } else {
            console.log("📝 Creating new document for profile user...");
            const profileRef = doc(db, "SentinelUsers", `user_${userId}`);
            await setDoc(profileRef, {
              userID: userId,
              FollowersCount: 1,
              Following: [],
              PostsCount: 0,
            }, { merge: true });
            setProfileUserDocId(`user_${userId}`);
            console.log("✅ Created document for profile user with follower count");
          }

          console.log(`✅ Successfully followed user: ${userId}`);
          Toast.show({
            type: "success",
            text1: "Following",
            text2: `You are now following ${userDoc?.userName || "this user"}`,
            position: "bottom",
            visibilityTime: 2000,
          });
        } else {
          console.log("📝 Creating new user document...");
          const newDocRef = await addDoc(collection(db, "SentinelUsers"), {
            userID: currentUserId,
            Following: [userId],
          });
          setCurrentUserDocId(newDocRef.id);

          if (profileUserDocId) {
            const profileRef = doc(db, "SentinelUsers", profileUserDocId);
            await updateDoc(profileRef, {
              FollowersCount: increment(1),
            });
          } else {
            const profileRef = doc(db, "SentinelUsers", `user_${userId}`);
            await setDoc(profileRef, {
              userID: userId,
              FollowersCount: 1,
              Following: [],
              PostsCount: 0,
            }, { merge: true });
            setProfileUserDocId(`user_${userId}`);
          }

          console.log(`✅ Created document and followed user: ${userId}`);
          Toast.show({
            type: "success",
            text1: "Following",
            text2: `You are now following ${userDoc?.userName || "this user"}`,
            position: "bottom",
            visibilityTime: 2000,
          });
        }
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
    }
  }, [currentUserDocId, currentUserId, userId, isFollowing, userDoc, profileUserDocId]);

  const toggleLike = useCallback(async (postItem: PostItem) => {
    let fetchuserID = currentUserId;
    if (!fetchuserID) {
      fetchuserID = (await AsyncStorage.getItem("userId")) || "";
      setCurrentUserId(fetchuserID);
    }

    const postRef = doc(db, postItem.postType, postItem.id);

    if (postItem.Liked) {
      await updateDoc(postRef, {
        ContentLikeCount: postItem.ContentLikeCount - 1,
        LikedBy: arrayRemove(fetchuserID),
      });
    } else {
      await updateDoc(postRef, {
        ContentLikeCount: postItem.ContentLikeCount + 1,
        LikedBy: arrayUnion(fetchuserID),
      });
    }

    await new Promise((r) => setTimeout(r, 200));
  }, [currentUserId]);

  const openCommentsModal = useCallback((item: PostItem) => {
    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setSelectedCommentTemplate(item.CommentTemplate);
    setIsCommentModalVisible(true);
  }, []);

  const closeCommentsModal = useCallback(() => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
    setSelectedPostType(null);
    setSelectedCommentTemplate(null);
  }, []);

  const openRepostModal = useCallback((postItem: PostItem) => {
    if (postItem.Reposted) {
      Toast.show({
        type: "success",
        text1: "Already Reposted",
        text2: "You have already reposted this Post.",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }
    setSelectedRepostPost(postItem);
    setIsRepostModalVisible(true);
  }, []);

  const closeRepostModal = useCallback(() => {
    setIsRepostModalVisible(false);
    setSelectedRepostPost(null);
  }, []);

  const openGraphModal = useCallback((item: PostItem) => {
    setSelectedGraphPostId(item.id);
    setSelectedGraphPostType(item.postType);
    setIsGraphModalVisible(true);
    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setIsCommentModalVisible(false);
    setSelectedCommentTemplate(item.CommentTemplate);
  }, []);

  const closeGraphModal = useCallback(() => {
    setIsGraphModalVisible(false);
    setSelectedGraphPostId(null);
    setSelectedGraphPostType(null);
  }, []);

  const addResponseGraphModal = useCallback(() => {
    setIsGraphModalVisible(false);
    setIsCommentModalVisible(true);
  }, []);

  const handleSimpleRepost = useCallback(async () => {
    if (!selectedRepostPost) return;

    try {
      let fetchuserID = currentUserId;
      if (!fetchuserID) {
        fetchuserID = (await AsyncStorage.getItem("userId")) || "";
        setCurrentUserId(fetchuserID);
      }

      const userInfo = (await AsyncStorage.getItem("userName")) || "Anonymous";
      const userImage = (await AsyncStorage.getItem("profilePicUrl")) || dummyAuthorImage;

      if (selectedRepostPost.Reposted) {
        Toast.show({
          type: "success",
          text1: "Already Reposted",
          text2: "You have already reposted this Post.",
          position: "bottom",
          visibilityTime: 2000,
        });
      } else {
        const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
        await updateDoc(postRef, {
          ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
          RepostedBy: arrayUnion(fetchuserID),
        });

        await addDoc(collection(db, "SentinelPosts"), {
          AuthorImageURL: userImage,
          AuthorName: userInfo,
          AuthorUserID: fetchuserID,
          ContentDate: new Date(),
          ContentDesc: selectedRepostPost.ContentDesc || "",
          ContentURL: selectedRepostPost.ContentURL || "",
          ContentURLs: selectedRepostPost.ContentURLs || [],
          ContentLikeCount: 0,
          ContentRepostCount: 0,
          ContentCommentCount: 0,
          isApproved: true,
          isNew: false,
          LikedBy: [],
          RepostedBy: [],
          BookmarkedBy: [],
          createdAt: new Date(),
          CommentTemplate: selectedRepostPost.CommentTemplate || "Sentinel Default Template",
          isRepost: true,
          originalPost: {
            id: selectedRepostPost.id || "",
            AuthorUserID: selectedRepostPost.AuthorUserID || "",
            AuthorName: selectedRepostPost.AuthorName || "Anonymous",
            AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
            ContentDesc: selectedRepostPost.ContentDesc || "",
            ContentDate: selectedRepostPost.ContentDate || new Date(),
            postType: selectedRepostPost.postType || "Unknown",
            isAnonymous: selectedRepostPost.isAnonymous || false,
            contentType: selectedRepostPost.contentType || "My Thoughts",
          },
          repostComment: "",
          repostedBy: fetchuserID,
          repostedAt: new Date(),
          isAnonymous: false,
          contentType: "Found Online",
        });

        Toast.show({
          type: "success",
          text1: "Reposted Successfully",
          text2: "Post has been shared to your followers.",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Error handling repost:", error);
      Toast.show({
        type: "error",
        text1: "Repost Failed",
        text2: "Failed to repost. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  }, [selectedRepostPost, currentUserId]);

  const handleQuoteRepost = useCallback(
    async (comment: string) => {
      if (!selectedRepostPost) return;

      try {
        let fetchuserID = currentUserId;
        if (!fetchuserID) {
          fetchuserID = (await AsyncStorage.getItem("userId")) || "";
          setCurrentUserId(fetchuserID);
        }

        const userInfo = (await AsyncStorage.getItem("userName")) || "Anonymous";
        const userImage = (await AsyncStorage.getItem("profilePicUrl")) || dummyAuthorImage;

        if (selectedRepostPost.Reposted) {
          Toast.show({
            type: "success",
            text1: "Already Reposted",
            text2: "You have already reposted this Post.",
            position: "bottom",
            visibilityTime: 2000,
          });
        } else {
          const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
          await updateDoc(postRef, {
            ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
            RepostedBy: arrayUnion(fetchuserID),
          });

          await addDoc(collection(db, "SentinelPosts"), {
            AuthorImageURL: userImage,
            AuthorName: userInfo,
            AuthorUserID: fetchuserID,
            ContentDate: new Date(),
            ContentDesc: comment || "",
            ContentURL: selectedRepostPost.ContentURL || "",
            ContentURLs: selectedRepostPost.ContentURLs || [],
            ContentLikeCount: 0,
            ContentRepostCount: 0,
            ContentCommentCount: 0,
            isApproved: true,
            isNew: false,
            LikedBy: [],
            RepostedBy: [],
            BookmarkedBy: [],
            createdAt: new Date(),
            CommentTemplate: selectedRepostPost.CommentTemplate || "Sentinel Default Template",
            isRepost: true,
            originalPost: {
              id: selectedRepostPost.id || "",
              AuthorUserID: selectedRepostPost.AuthorUserID || "",
              AuthorName: selectedRepostPost.AuthorName || "Anonymous",
              AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
              ContentDesc: selectedRepostPost.ContentDesc || "",
              ContentDate: selectedRepostPost.ContentDate || new Date(),
              postType: selectedRepostPost.postType || "Unknown",
              isAnonymous: selectedRepostPost.isAnonymous || false,
              contentType: selectedRepostPost.contentType || "My Thoughts",
            },
            repostComment: comment || "",
            repostedBy: fetchuserID,
            repostedAt: new Date(),
            isAnonymous: false,
            contentType: "Found Online",
          });

          Toast.show({
            type: "success",
            text1: "Quote Repost Created",
            text2: "Your quote repost has been shared to your followers.",
            position: "bottom",
            visibilityTime: 2000,
          });
        }
      } catch (error) {
        console.error("Error creating quote repost:", error);
        Toast.show({
          type: "error",
          text1: "Quote Repost Failed",
          text2: "Failed to create quote repost. Please try again.",
          position: "bottom",
          visibilityTime: 3000,
        });
      }
    },
    [selectedRepostPost, currentUserId]
  );

  const handleRepost = useCallback(
    async (postItem: PostItem) => {
      openRepostModal(postItem);
    },
    [openRepostModal]
  );

  const handleBookmark = useCallback(async (postItem: PostItem) => {
    try {
      let fetchuserID = currentUserId;
      if (!fetchuserID) {
        fetchuserID = (await AsyncStorage.getItem("userId")) || "";
        setCurrentUserId(fetchuserID);
      }

      const postRef = doc(db, postItem.postType, postItem.id);

      if (postItem.Bookmarked) {
        await updateDoc(postRef, {
          BookmarkedBy: arrayRemove(fetchuserID),
        });
        Toast.show({
          type: "success",
          text1: "Bookmark Removed",
          text2: "Post has been removed from your bookmarks.",
          position: "bottom",
          visibilityTime: 2000,
        });
      } else {
        await updateDoc(postRef, {
          BookmarkedBy: arrayUnion(fetchuserID),
        });
        Toast.show({
          type: "success",
          text1: "Bookmarked",
          text2: "Post has been saved to your bookmarks.",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to bookmark. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  }, [currentUserId]);

  const handleShare = useCallback(async (postItem: PostItem) => {
    try {
      if (postItem.isAnonymous) {
        await Share.share({
          message: `SENTINEL POST by Anonymous\n\n${postItem.ContentDesc}\n\n${postItem.ContentURL}\n\ntake a look.`,
        });
      } else {
        await Share.share({
          message: `SENTINEL POST by ${postItem.AuthorName}\n\n${postItem.ContentDesc}\n\n${postItem.ContentURL}\n\ntake a look.`,
        });
      }
    } catch (error) {
      console.log("Error sharing:", error);
      Toast.show({
        type: "error",
        text1: "Share Failed",
        text2: "Failed to share post",
        position: "bottom",
        visibilityTime: 2000,
      });
    }

    await new Promise((r) => setTimeout(r, 200));
  }, []);

  const avatar = React.useMemo(() => {
    if (isAnonymous === 'true') {
      return dummyAuthorImage;
    }
    
    if (!userDoc?.profilePicUrl) {
      return dummyAuthorImage;
    }
    
    return getFullImageUrl(userDoc.profilePicUrl) || dummyAuthorImage;
  }, [isAnonymous, userDoc?.profilePicUrl]);

  const displayName = 
    isAnonymous === 'true' 
      ? 'Anonymous'
      : (userDoc?.userName && userDoc.userName.trim()) ||
        (userDoc?.userNickName && userDoc.userNickName.trim()) ||
        "Unknown user";

  const handleWebsitePress = () => {
    const url = userDoc?.Website || userDoc?.website;
    if (!url) return;
    let finalUrl = url;
    if (!finalUrl.startsWith("http")) {
      finalUrl = `https://${finalUrl}`;
    }
    Linking.openURL(finalUrl);
  };

  const getTimeAgo = (dateString: any): string => {
    if (!dateString) return "Just now";
    try {
      let postDate: Date;
      if (dateString && typeof dateString === "object" && dateString.toDate) {
        postDate = dateString.toDate();
      } else if (typeof dateString === "string") {
        postDate = new Date(dateString);
      } else if (dateString instanceof Date) {
        postDate = dateString;
      } else {
        return "Just now";
      }

      const now = new Date();
      const diffInMs = now.getTime() - postDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return postDate.toLocaleDateString();
    } catch (error) {
      return "Just now";
    }
  };

  const renderPost = (item: PostItem, index: number) => {
    const displayAuthorName = item.isAnonymous ? "Anonymous" : item.AuthorName;
    const displayAuthorImage = item.isAnonymous ? dummyAuthorImage : (item.AuthorImageURL || dummyAuthorImage);

    return (
      <TouchableOpacity
        key={`post-${item.uniqueId}-${index}`}
        activeOpacity={0.95}
        onPress={() => openCommentsModal(item)}
      >
        <View className="bg-white mx-4 mb-3 rounded-2xl shadow-sm border border-gray-100">
          <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full mr-2 overflow-hidden border-2 border-white shadow-sm">
                <Image
                  source={{ uri: displayAuthorImage || dummyAuthorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-sm">{displayAuthorName}</Text>
                <Text className="text-gray-500 text-xs">{getTimeAgo(item.ContentDate)}</Text>
              </View>

              <View className="px-2 py-1 rounded-full bg-green-100">
                <Text className="text-xs font-semibold text-green-600">APPROVED</Text>
              </View>
            </View>
          </View>

          <View className="px-3 py-3">
            <Text className="text-gray-800 text-sm leading-5 mb-2">{item.ContentDesc}</Text>

            {item.ContentURL && (
              <View className="rounded-xl overflow-hidden bg-gray-100 mb-3">
                <Image
                  source={{ uri: item.ContentURL }}
                  style={{ width: "100%", aspectRatio: 16 / 9 }}
                  resizeMode="cover"
                />
              </View>
            )}

            <View className="flex-row items-center">
              <View className="flex-1">
                <View className="flex-row items-center mt-1.5">
                  <TouchableOpacity
                    className="flex-row items-center mr-5 px-1.5 py-1"
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleLike(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.Liked ? "heart" : "heart-outline"}
                      size={20}
                      color={item.Liked ? "#ef4444" : "#64748b"}
                    />
                    <Text
                      className={`ml-1 text-xs font-medium ${
                        item.Liked ? "text-red-500" : "text-gray-600"
                      }`}
                    >
                      {item.ContentLikeCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center mr-5 px-1.5 py-1"
                    onPress={(e) => {
                      e.stopPropagation();
                      openCommentsModal(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="thumbs-up-down" size={20} color="#000000" />
                    <Text className="text-gray-600 ml-1 text-xs font-medium">
                      {item.ContentCommentCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center mr-5 px-1.5 py-1"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRepost(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="repeat-outline"
                      size={20}
                      color={item.Reposted ? "#0ea5e9" : "#64748b"}
                    />
                    <Text
                      className={`ml-1 text-xs font-medium ${
                        item.Reposted ? "text-blue-500" : "text-gray-600"
                      }`}
                    >
                      {item.ContentRepostCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="mr-2 p-1.5"
                    onPress={(e) => {
                      e.stopPropagation();
                      openGraphModal(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="bar-chart-2" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <View className="flex-row items-center mt-1.5">
                  <TouchableOpacity
                    className="flex-row items-center mr-5 px-1.5 py-1"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleBookmark(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.Bookmarked ? "bookmark" : "bookmark-outline"}
                      size={20}
                      color={item.Bookmarked ? "#000000" : "#64748b"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="mr-2 p-1"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShare(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="share-2" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isOwnProfile = currentUserId === userId;

  return (
    <View className="flex-1 bg-black">
      <View className="h-40 bg-gray-900">
        <Image source={{ uri: dummyHeaderImage }} className="w-full h-full" resizeMode="cover" />
      </View>

      <View className="absolute top-10 left-3 z-50">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-black/60 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={() => setIsImageModalVisible(true)}
        activeOpacity={0.9}
        className="absolute top-28 left-4 z-40"
      >
        <View className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 shadow-lg">
          <Image
            source={{ 
              uri: avatar || 'https://ui-avatars.com/api/?name=Anonymous&background=4F46E5'
            }}
            className="w-full h-full rounded-full"
            resizeMode="cover"
            key={`avatar-${isAnonymous}-${avatar}`}
          />
        </View>
      </TouchableOpacity>

      <ImageFullScreenModal />

      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8B5CF6"]} />
        }
      >
        <View className="px-4">
          <View className="h-5" />

          <View className="flex-row justify-end mb-3">
            {isAnonymous === 'true' ? (
              <View className="px-4 py-2 rounded-lg bg-gray-100">
                <Text className="text-sm font-semibold text-gray-600">Anonymous User</Text>
              </View>
            ) : isOwnProfile ? (
              <View className="px-4 py-2 rounded-lg bg-blue-50">
                <Text className="text-sm font-semibold text-blue-600">You</Text>
              </View>
            ) : (
              <TouchableOpacity
                className={`px-5 py-2 rounded-full ${isFollowing ? "bg-gray-200" : "bg-black"}`}
                onPress={handleFollowPress}
                activeOpacity={0.8}
              >
                <Text className={`font-semibold text-sm ${isFollowing ? "text-gray-700" : "text-white"}`}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-xl font-bold text-gray-900">{displayName}</Text>

          {isAnonymous === 'true' ? (
            <Text className="text-sm text-gray-500">@Anonymous</Text>
          ) : (
            <Text className="text-sm text-gray-500">
              @{userDoc?.userNickName || userDoc?.userName || 'user'}
            </Text>
          )}

          {loading ? (
            <View className="flex-row items-center mt-3">
              <ActivityIndicator size="small" color="#111827" />
              <Text className="ml-2 text-sm text-gray-500">Loading profile…</Text>
            </View>
          ) : userDoc?.userBio ? (
            <Text className="mt-3 text-sm text-gray-800">{userDoc.userBio}</Text>
          ) : null}

          {(userDoc?.Website || userDoc?.website) && (
            <TouchableOpacity className="flex-row items-center mt-2" onPress={handleWebsitePress}>
              <Ionicons name="link-outline" size={16} color="#2563EB" />
              <Text className="ml-1 text-xs text-blue-600">
                {userDoc.Website || userDoc.website}
              </Text>
            </TouchableOpacity>
          )}

          {isAnonymous !== 'true' && (
            <View className="flex-row mt-3 mb-3">
              <Text className="mr-4 text-sm text-gray-900">
                <Text className="font-semibold">{userDoc?.Following?.length ?? 0}</Text> Following
              </Text>
              <Text className="text-sm text-gray-900">
                <Text className="font-semibold">{userDoc?.FollowersCount ?? 0}</Text> Followers
              </Text>
            </View>
          )}
        </View>

        <View className="border-t border-gray-200 mt-2 pt-4">
          <View className="px-4 mb-3">
            <Text className="text-lg font-bold text-gray-900">Posts</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {userPosts.length} approved {userPosts.length === 1 ? "post" : "posts"}
            </Text>
          </View>

          {loading ? (
            <View className="py-12">
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : userPosts.length === 0 ? (
            <View className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 py-12">
              <View className="items-center">
                <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-semibold mt-4">No approved posts</Text>
                <Text className="text-gray-400 text-sm mt-2 text-center px-6">
                  This user has no approved posts to display yet.
                </Text>
              </View>
            </View>
          ) : (
            userPosts.map((item, index) => renderPost(item, index))
          )}

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <RepostModal
        visible={isRepostModalVisible}
        onClose={closeRepostModal}
        post={selectedRepostPost}
        onSimpleRepost={handleSimpleRepost}
        onQuoteRepost={handleQuoteRepost}
      />

      <CommentsModal
        visible={isCommentModalVisible}
        onClose={closeCommentsModal}
        postId={selectedPostId}
        postType={selectedPostType}
        postData={userPosts.find((item) => item.id === selectedPostId)}
        commentTemplate={selectedCommentTemplate}
      />

      <TotalSentiment
        visible={isGraphModalVisible}
        onClose={closeGraphModal}
        postId={selectedGraphPostId}
        postType={selectedGraphPostType}
        postData={userPosts.find((item) => item.id === selectedGraphPostId)}
        onAddResponse={addResponseGraphModal}
        userExistingComment={undefined}
        onEditComment={undefined}
        commentTemplate={selectedCommentTemplate}
      />
    </View>
  );
}
