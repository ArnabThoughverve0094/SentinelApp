import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Share, StyleSheet, useWindowDimensions } from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentsModal from '../../components/CommentsModal';
import { LoadingComponent } from '../../components/LoadingComponent';
import TotalSentiment from '../../components/TotalSentiment';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Option {
  icon: string;
  title: string;
}

interface Template {
  name: string;
  options: Option[];
}

interface PostItem {
  id: string;
  uniqueId: string;
  AuthorImageURL: string;
  AuthorName: string;
  AuthorUserID?: string;
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
  isRepost?: boolean;
  originalPost?: PostItem;
  repostComment?: string;
  repostedBy?: string;
  repostedAt?: any;
  CommentTemplate: string;
}

// Tab Header Component
const TabHeader: React.FC<{
  activeTab: 'forYou' | 'following';
  onTabChange: (tab: 'forYou' | 'following') => void;
}> = ({ activeTab, onTabChange }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'forYou' ? 0 : 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab, slideAnim]);

  const indicatorStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenWidth / 2],
        }),
      },
    ],
  };

  return (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row">
        <TouchableOpacity
          className={`flex-1 py-4 items-center ${
            activeTab === 'forYou' ? 'bg-white' : 'bg-gray-50'
          }`}
          onPress={() => onTabChange('forYou')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === 'forYou' ? 'text-black' : 'text-gray-500'
            }`}
          >
            For you
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-4 items-center ${
            activeTab === 'following' ? 'bg-white' : 'bg-gray-50'
          }`}
          onPress={() => onTabChange('following')}
          activeOpacity={0.8}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === 'following' ? 'text-black' : 'text-gray-500'
            }`}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <View className="relative">
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              height: 2,
              width: screenWidth / 2,
              backgroundColor: '#000000',
            },
            indicatorStyle,
          ]}
        />
      </View>
    </View>
  );
};

// Repost Modal Component
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
  onQuoteRepost
}) => {
  const [repostComment, setRepostComment] = useState('');
  const [isQuoteMode, setIsQuoteMode] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
      setRepostComment('');
      setIsQuoteMode(false);
    }
  }, [visible, scaleAnim]);

  const handleQuoteRepost = () => {
    if (repostComment.trim()) {
      onQuoteRepost(repostComment.trim());
    }
    onClose();
  };

  const handleSimpleRepost = () => {
    onSimpleRepost();
    onClose();
  };

  if (!visible || !post) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-end px-4 pb-8">
        <Animated.View 
          style={[{ transform: [{ scale: scaleAnim }] }]}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <View className="px-6 py-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Share this post</Text>
                <Text className="text-gray-500 text-sm mt-1">Add your thoughts or share as is</Text>
              </View>
              <TouchableOpacity 
                className="p-2 rounded-full bg-gray-100"
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 py-4">
            <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Image
                  source={{ uri: post.AuthorImageURL }}
                  className="w-8 h-8 rounded-full mr-2"
                  resizeMode="cover"
                />
                <Text className="font-semibold text-gray-900 text-sm">{post.AuthorName}</Text>
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
                  isQuoteMode ? 'bg-black border-black' : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  isQuoteMode ? 'text-white' : 'text-gray-600'
                }`}>
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
                    repostComment.trim() ? 'bg-black' : 'bg-gray-300'
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
                    <Text className={`ml-2 font-semibold ${
                      repostComment.trim() ? 'text-white' : 'text-gray-500'
                    }`}>
                      Quote
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function SentinelFeed(): React.JSX.Element {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [fetchedData, setFetchedData] = useState<PostItem[]>([]);
  const [fetchedXData, setFetchedXData] = useState<any>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [fullScreenDoc, setFullScreenDoc] = useState<string | null>(null);
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [fullScreenCard, setFullScreenCard] = useState<PostItem | null>(null);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  const [cardAnimations, setCardAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [commentsData, setCommentsData] = useState<{ [key: string]: number }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // UPDATED: Removed videoRefs since we'll use useVideoPlayer directly
  const flipCardRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [currentUserDocId, setCurrentUserDocId] = useState('');

  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedCommentTemplate, setSelectedCommentTemplate] = useState<string | null>(null);
  const [fetchedCommentTemplate, setFetchedCommentTemplate] = useState<Template[]>([]);

  const [isGraphModalVisible, setIsGraphModalVisible] = useState(false);
  const [selectedGraphPostId, setSelectedGraphPostId] = useState<string | null>(null);
  const [selectedGraphPostType, setSelectedGraphPostType] = useState<string | null>(null);
  const [userExistingComment, setUserExistingComment] = useState<Comment | null>(null);

  const [isRejectionModalVisible, setIsRejectionModalVisible] = useState(false);
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<string[]>([]);
  const [rejectionPostId, setRejectionPostId] = useState<string | null>(null);

  const [isRepostModalVisible, setIsRepostModalVisible] = useState(false);
  const [selectedRepostPost, setSelectedRepostPost] = useState<PostItem | null>(null);

  // UPDATED: Create video player for fullscreen modal
  const fullScreenVideoPlayer = useVideoPlayer(fullScreenVideo || '', (player) => {
    player.loop = false;
    player.play();
  });

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  const rejectionReasons = [
    'Inappropriate content or language',
    'Spam or repetitive content', 
    'Misleading or false information',
    'Violates community guidelines',
    'Copyright infringement',
    'Offensive or discriminatory content'
  ];

  const areInteractionsDisabled = useCallback((item: PostItem) => {
    return !item.isApproved && !item.isNew;
  }, []);

  const fetchUserFollowing = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if(fetchuserID === "") {
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }

      if (fetchuserID) {
        console.log('🔄 Fetching following list for user:', fetchuserID);
        
        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(sentinelUsersRef, where('userID', '==', fetchuserID));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            setCurrentUserDocId(userDoc.id);
            const following = userData.Following || [];
            setFollowingUserIds(following);
            console.log('✅ Following list updated:', following);
          } else {
            console.log('📱 No user document found');
            setFollowingUserIds([]);
            setCurrentUserDocId('');
          }
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching following list:', error);
      setFollowingUserIds([]);
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

  const getMediaType = useCallback((url: string) => {
    if (!url) return 'unknown';
    
    const lower = url.toLowerCase();
    const urlPath = lower.split(/[?#]/)[0];
    if (urlPath.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/)) return 'video';
    if (urlPath.match(/\.(jpg|jpeg|png|bmp|webp)$/)) return 'image';
    if (urlPath.match(/\.(gif)$/)) return 'gif';
    if (urlPath.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/)) return 'doc';
    
    if (lower.includes('unsplash.com') || 
        lower.includes('images.') || 
        lower.includes('photo') ||
        lower.includes('img.') ||
        lower.includes('picture')) {
      return 'image';
    }
    
    if (lower.includes('video') || lower.includes('youtube') || lower.includes('vimeo')) {
      return 'video';
    }
    
    if (lower.startsWith('http') && !urlPath.includes('.')) {
      return 'image';
    }
    
    return urlPath.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/) ? 'doc' : 'image';
  }, []);

  const initializeCardAnimation = useCallback((postId: string) => {
    const animationKey = `${activeTab}-${postId}`;
    
    if (!cardAnimations[animationKey]) {
      const newAnimation = new Animated.Value(0);
      setCardAnimations(prev => ({
        ...prev,
        [animationKey]: newAnimation
      }));
      
      setTimeout(() => {
        Animated.spring(newAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, Math.random() * 150);
    }
  }, [cardAnimations, activeTab]);

  const getItem = useCallback(async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserRole = await AsyncStorage.getItem('userRole');
      if(fetchuserID !== null) {
        setUserId(fetchuserID);
      }
      if(fetchuserRole !== null) {
        setUserRole(fetchuserRole);
      }
    } catch (error) {
      console.log("Error retrieving userId", error);
    }
  }, []);

  const fetchSinglePostComments = useCallback(async (postId: string, postType: string) => {
    try {
      let totalComments = 0;
      
      const commentsRef = collection(db, postType, postId, 'Comments');
      const commentsSnapshot = await getDocs(commentsRef);
      
      totalComments = commentsSnapshot.size;
      
      for (const commentDoc of commentsSnapshot.docs) {
        const repliesRef = collection(db, postType, postId, 'Comments', commentDoc.id, 'Replies');
        const repliesSnapshot = await getDocs(repliesRef);
        totalComments += repliesSnapshot.size;
      }
      
      setCommentsData(prev => ({
        ...prev,
        [postId]: totalComments
      }));
      
      console.log(`Comments count for post ${postId}: ${totalComments}`);
      return totalComments;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return 0;
    }
  }, []);

  const handleFetchAllData = useCallback(async (forceRefresh: boolean = false) => {
    const currentTime = Date.now();
    
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    if (!forceRefresh && isInitialized && (currentTime - lastFetchTime < 30000)) {
      return;
    }

    setLoading(true);
    try {
      const postsXData: any = [];
      
      const collXDataRefPost = collection(db, 'X-Data');
      const queryXData = query(
        collXDataRefPost,
        orderBy('ContentDate', 'desc')
      );
      const unsubscribeXData = onSnapshot(queryXData, async xDataSnapshot => {
        const xdataDataArr = xDataSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }))

        for (const doc of xdataDataArr) {
          const postData = doc.data;
          const postId = doc.id;

          postsXData.push({
            uniqueId: `xdata-${postId}`,
            id: postId,
            AuthorImageURL: postData.AuthorImageURL,
            AuthorName: postData.AuthorName,
            AuthorUserID: postData.AuthorUserID || '',
            ContentDate: postData.ContentDate,
            ContentDesc: postData.ContentDesc,
            ContentURL: postData.ContentURL,
            ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
            ContentLikeCount: postData.ContentLikeCount || 0,
            ContentRepostCount: postData.ContentRepostCount || 0,
            ContentCommentCount: postData.ContentCommentCount || 0,
            isApproved: true,
            isNew: false,
            postType: "X-Data",
            Liked: (postData.LikedBy?.includes(fetchuserID) || false),
            Reposted: (postData.RepostedBy?.includes(fetchuserID) || false),
            Bookmarked: (postData.BookmarkedBy?.includes(fetchuserID) || false),
            createdAt: postData.createdAt || postData.ContentDate,
            CommentTemplate: postData.CommentTemplate || "Template1",
          });
        }

        setFetchedXData(postsXData);
      });

      const collSentinelRefPost = collection(db, 'SentinelPosts');
      const querySentinel = query(
        collSentinelRefPost,
        orderBy('ContentDate', 'desc')
      );

      console.log("Sentinel OnSnapshot");
      const unsubscribeSentinel = onSnapshot(querySentinel, async sentinelSnapshot => {
        const sentineldataArr = sentinelSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }))

        const postsData = [];
        for (const doc of sentineldataArr) {
          const postData = doc.data;
          const postId = doc.id;

          postsData.push({
            uniqueId: `sentinel-${postId}`,
            id: postId,
            AuthorImageURL: postData.AuthorImageURL,
            AuthorName: postData.AuthorName,
            AuthorUserID: postData.AuthorUserID || postData.repostedBy || '',
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
            Liked: (postData.LikedBy?.includes(fetchuserID) || false),
            Reposted: (postData.RepostedBy?.includes(fetchuserID) || false),
            Bookmarked: (postData.BookmarkedBy?.includes(fetchuserID) || false),
            createdAt: postData.createdAt || postData.ContentDate,
            CommentTemplate: postData.CommentTemplate || "Template1",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
          });
        }

        const allData = postsData.concat(postsXData);
        setFetchedData(allData);
        console.log('OnSnapshot Fetched and Sorted', `Total: ${allData.length} documents`);

        allData.forEach(post => {
          onSnapshot(
            collection(doc(db, post.postType, post.id), 'Comments'),
            commentsSnap => {
              let totalComments = 0;
              totalComments = commentsSnap.size;

              setFetchedData(prev =>
                prev.map(p =>
                  p.id === post.id
                  ? { ...p, ContentCommentCount: totalComments }
                  : p
                )
              );
            }
          )
        });
      });
      
      setLastFetchTime(currentTime);
      console.log('All Data Fetched and Sorted', `Total: ${fetchedData.length} documents`);
      
      setIsInitialized(true);

      return () => {
        unsubscribeSentinel();
        unsubscribeXData();
      };
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, fetchedData.length, lastFetchTime, userId]);

  const fetchCommentTemplate = useCallback(async () => {
    try {
      const collCommentTempPost = collection(db, 'SentimentTemplates');
      console.log("Comment Template Called");

      const unsubscribeCommentTemp = onSnapshot(collCommentTempPost, commentTempSnapshot => {
        const commentTempdataArr = commentTempSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        const commentTemmp = [];

        for (const doc of commentTempdataArr) {
          const postData = doc.data;
          const postId = doc.id;
          console.log("Comment Template ID: ", postId);

          const optionsField = postData.options;

            const result: Array<{ key: string; icon: string; title: string }> = [];
            for (const key in optionsField) {
              if (Object.prototype.hasOwnProperty.call(optionsField, key)) {
                const maybeOption = (optionsField as any)[key];
                if (maybeOption && typeof maybeOption === "object") {
                  const icon = (maybeOption as any).icon;
                  const title = (maybeOption as any).title;
                  result.push({
                    key,
                    icon: typeof icon === "string" ? icon : "",
                    title: typeof title === "string" ? title : "",
                  });
                }
              }
            }
            commentTemmp.push({
              name: postData.name || "",
              options: result,
            });
        }
        setFetchedCommentTemplate(commentTemmp);

      })

      return () => {
        unsubscribeCommentTemp();
      };

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    getItem();
    fetchUserFollowing();
    handleFetchAllData();
    fetchCommentTemplate();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkCommentUpdate = async () => {
        try {
          const lastVisitedPost = await AsyncStorage.getItem('lastVisitedPost');
          const lastVisitedPostType = await AsyncStorage.getItem('lastVisitedPostType');
          
          if (lastVisitedPost && lastVisitedPostType && isInitialized) {
            console.log('🔄 Updating comments for visited post:', lastVisitedPost);
            await fetchSinglePostComments(lastVisitedPost, lastVisitedPostType);
            
            await AsyncStorage.removeItem('lastVisitedPost');
            await AsyncStorage.removeItem('lastVisitedPostType');
          }
        } catch (error) {
          console.error('Error checking comment update:', error);
        }
      };
      
      checkCommentUpdate();
    }, [isInitialized, fetchSinglePostComments])
  );

  const handleDropdownChange = async (item: {name: string }, postItem: PostItem) => {
    setSelectedCommentTemplate(item.name);
    console.log('Selected option:', item.name);
    const postRef = doc(db, postItem.postType, postItem.id);
    await updateDoc(postRef, {
      CommentTemplate: item.name,
    });
  };
  
  const openCommentsModal = useCallback((item: PostItem) => {
    if (areInteractionsDisabled(item)) {
      Toast.show({
        type: 'error',
        text1: 'Post Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setSelectedCommentTemplate(item.CommentTemplate);
    setIsCommentModalVisible(true);
  }, [areInteractionsDisabled]);

  const closeCommentsModal = useCallback(() => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
    setSelectedPostType(null);
    setSelectedCommentTemplate(null);
  }, []);

  const openGraphModal = useCallback((item: PostItem) => {
    if (areInteractionsDisabled(item)) {
      Toast.show({
        type: 'error',
        text1: 'Post Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    console.log("Graph ID: ", item.id);
    setSelectedGraphPostId(item.id);
    setSelectedGraphPostType(item.postType);
    setIsGraphModalVisible(true);
    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setIsCommentModalVisible(false);
    setSelectedCommentTemplate(item.CommentTemplate);
  }, [areInteractionsDisabled]);

  const closeGraphModal = useCallback(() => {
    setIsGraphModalVisible(false);
    setSelectedGraphPostId(null);
    setSelectedGraphPostType(null);
  }, []);

  const addResponseGraphModal = useCallback(() => {
    setIsGraphModalVisible(false);
    setIsCommentModalVisible(true);
  }, []);

  const openRejectionModal = useCallback((postId: string) => {
    setRejectionPostId(postId);
    setSelectedRejectionReasons([]);
    setIsRejectionModalVisible(true);
  }, []);

  const closeRejectionModal = useCallback(() => {
    setIsRejectionModalVisible(false);
    setRejectionPostId(null);
    setSelectedRejectionReasons([]);
  }, []);

  const toggleRejectionReason = useCallback((reason: string) => {
    setSelectedRejectionReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
  }, []);

  const handleRejectionSubmit = useCallback(async () => {
    if (selectedRejectionReasons.length === 0 || !rejectionPostId) {
      Toast.show({
        type: 'error',
        text1: 'Selection Required',
        text2: 'Please select at least one reason for rejection.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      await handleApprovalToggle(rejectionPostId, false, false);
      
      await updateDoc(doc(db, 'SentinelPosts', rejectionPostId), {
        isApproved: false,
        isNew: false,
        rejectionReasons: selectedRejectionReasons,
        rejectedAt: new Date()
      });

      closeRejectionModal();
      
      Toast.show({
        type: 'success',
        text1: 'Post Rejected',
        text2: `Post has been rejected successfully with ${selectedRejectionReasons.length} reason(s).`,
        position: 'top',
        visibilityTime: 3000,
      });
      
    } catch (error) {
      console.error('Error rejecting post:', error);
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: 'Failed to reject post. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  }, [selectedRejectionReasons, rejectionPostId, closeRejectionModal]);

  const openFullScreenImage = useCallback((imageUrl: string) => {
    setFullScreenImage(imageUrl);
    setIsImageModalVisible(true);
  }, []);

  const closeFullScreenImage = useCallback(() => {
    setIsImageModalVisible(false);
    setFullScreenImage(null);
  }, []);

  const openFullScreenVideo = useCallback((videoUrl: string) => {
    setFullScreenVideo(videoUrl);
    setIsVideoModalVisible(true);
  }, []);

  const closeFullScreenVideo = useCallback(() => {
    setIsVideoModalVisible(false);
    setFullScreenVideo(null);
  }, []);

  const openFullScreenDoc = useCallback((docUrl: string) => {
    setFullScreenDoc(docUrl);
    setIsDocModalVisible(true);
  }, []);

  const closeFullScreenDoc = useCallback(() => {
    setIsDocModalVisible(false);
    setFullScreenDoc(null);
  }, []);

  const openFullScreenCard = useCallback((item: PostItem) => {
    setFullScreenCard(item);
    setIsCardModalVisible(true);
    setIsFlipped(false);
    setIsFlipping(false);
  }, []);

  const closeFullScreenCard = useCallback(() => {
    setIsCardModalVisible(false);
    setFullScreenCard(null);
    setIsFlipped(false);
    setIsFlipping(false);
  }, []);

  const handleFlipCard = useCallback(() => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setIsFlipped(!isFlipped);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 800);
  }, [isFlipped, isFlipping]);

  // APPROVAL TOGGLE WITH TOAST
  const handleApprovalToggle = useCallback(async (postId: string, newApprovedStatus: boolean, newIsNew: boolean = false) => {
    console.log("Toggling post:", postId, "to approved:", newApprovedStatus, "isNew:", newIsNew);

    setFetchedData(prevData => 
      prevData.map(item => 
        item.id === postId 
          ? { ...item, isApproved: newApprovedStatus, isNew: newIsNew }
          : item
      )
    );

    if (fullScreenCard && fullScreenCard.id === postId) {
      setFullScreenCard((prev: PostItem | null) => 
        prev ? { ...prev, isApproved: newApprovedStatus, isNew: newIsNew } : null
      );
    }

    try {
      await updateDoc(doc(db, 'SentinelPosts', postId), {
        isApproved: newApprovedStatus,
        isNew: newIsNew,
      });
      console.log("Post status updated successfully");
      
      // Show toast for approval
      if (newApprovedStatus && !newIsNew) {
        Toast.show({
          type: 'success',
          text1: 'Post Approved',
          text2: 'Post has been approved and is now visible to users!',
          position: 'top',
          visibilityTime: 3000,
        });
      }
      
    } catch (error) {
      console.error("Error updating post status:", error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update post status. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
      
      setFetchedData(prevData => 
        prevData.map(item => 
          item.id === postId 
            ? { ...item, isApproved: !newApprovedStatus, isNew: !newIsNew }
            : item
        )
      );
      if (fullScreenCard && fullScreenCard.id === postId) {
        setFullScreenCard((prev: PostItem | null) => 
          prev ? { ...prev, isApproved: !newApprovedStatus, isNew: !newIsNew } : null
        );
      }
    }
  }, [fullScreenCard]);

  const toggleLike = useCallback(async (postItem: PostItem) => {
    if (areInteractionsDisabled(postItem)) {
      Toast.show({
        type: 'error',
        text1: 'Action Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    const postRef = doc(db, postItem.postType, postItem.id);
    if(postItem.Liked) {
      console.log("itemID: ", postItem.id);
      console.log("item Liked: ", postItem.Liked);
      await updateDoc(postRef, {
        ContentLikeCount: postItem.ContentLikeCount - 1,
        LikedBy: arrayRemove(fetchuserID),
      });
    } else {
      console.log("itemID: ", postItem.id);
      console.log("item Liked: ", postItem.Liked);
      await updateDoc(postRef, {
        ContentLikeCount: postItem.ContentLikeCount + 1,
        LikedBy: arrayUnion(fetchuserID),
      });
    }

    if (fullScreenCard && fullScreenCard.uniqueId === postItem.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Liked: !prev.Liked,
        ContentLikeCount: prev.Liked 
          ? prev.ContentLikeCount - 1 
          : prev.ContentLikeCount + 1
      }) : null);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard, areInteractionsDisabled, userId]);

  const openRepostModal = useCallback((postItem: PostItem) => {
    if (areInteractionsDisabled(postItem)) {
      Toast.show({
        type: 'error',
        text1: 'Action Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setSelectedRepostPost(postItem);
    setIsRepostModalVisible(true);
  }, [areInteractionsDisabled]);

  const closeRepostModal = useCallback(() => {
    setIsRepostModalVisible(false);
    setSelectedRepostPost(null);
  }, []);

  // SIMPLE REPOST WITH TOAST
  const handleSimpleRepost = useCallback(async () => {
    if (!selectedRepostPost) return;

    try {
      let fetchuserID = userId;
      if(fetchuserID === ""){
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }

      const userInfo = await AsyncStorage.getItem('userName') || 'Anonymous';
      const userImage = await AsyncStorage.getItem('userImageURL') || dummyAuthorImage;

      if (selectedRepostPost.Reposted) {
        const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
        await updateDoc(postRef, {
          ContentRepostCount: selectedRepostPost.ContentRepostCount - 1,
          RepostedBy: arrayRemove(fetchuserID),
        });

        setFetchedData(prevData => 
          prevData.map(item => 
            item.uniqueId === selectedRepostPost.uniqueId 
              ? { 
                  ...item, 
                  Reposted: false, 
                  ContentRepostCount: item.ContentRepostCount - 1
                } 
              : item
          )
        );

        Toast.show({
          type: 'success',
          text1: 'Repost Removed',
          text2: 'Post has been removed from your reposts.',
          position: 'top',
          visibilityTime: 2000,
        });
      } else {
        const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
        await updateDoc(postRef, {
          ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
          RepostedBy: arrayUnion(fetchuserID),
        });

        await addDoc(collection(db, 'SentinelPosts'), {
          AuthorImageURL: userImage,
          AuthorName: userInfo,
          AuthorUserID: fetchuserID,
          ContentDate: new Date(),
          ContentDesc: selectedRepostPost.ContentDesc || '',
          ContentURL: selectedRepostPost.ContentURL || '',
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
          CommentTemplate: selectedRepostPost.CommentTemplate || "Template1",
          isRepost: true,
          originalPost: {
            id: selectedRepostPost.id || '',
            AuthorName: selectedRepostPost.AuthorName || 'Unknown User',
            AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
            ContentDesc: selectedRepostPost.ContentDesc || '',
            ContentDate: selectedRepostPost.ContentDate || new Date(),
            postType: selectedRepostPost.postType || 'Unknown'
          },
          repostComment: '',
          repostedBy: fetchuserID,
          repostedAt: new Date(),
        });

        setFetchedData(prevData => 
          prevData.map(item => 
            item.uniqueId === selectedRepostPost.uniqueId 
              ? { 
                  ...item, 
                  Reposted: true, 
                  ContentRepostCount: item.ContentRepostCount + 1
                } 
              : item
          )
        );

        Toast.show({
          type: 'success',
          text1: 'Reposted Successfully',
          text2: 'Post has been shared to your followers.',
          position: 'top',
          visibilityTime: 2000,
        });
      }

      if (fullScreenCard && fullScreenCard.uniqueId === selectedRepostPost.uniqueId) {
        setFullScreenCard((prev: PostItem | null) => prev ? ({
          ...prev,
          Reposted: !prev.Reposted,
          ContentRepostCount: prev.Reposted 
            ? prev.ContentRepostCount - 1 
            : prev.ContentRepostCount + 1
        }) : null);
      }
    } catch (error) {
      console.error('Error handling repost:', error);
      Toast.show({
        type: 'error',
        text1: 'Repost Failed',
        text2: 'Failed to repost. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  }, [selectedRepostPost, userId, fullScreenCard]);

  // QUOTE REPOST WITH TOAST
  const handleQuoteRepost = useCallback(async (comment: string) => {
    if (!selectedRepostPost) return;

    try {
      let fetchuserID = userId;
      if(fetchuserID === ""){
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }

      const userInfo = await AsyncStorage.getItem('userName') || 'Anonymous';
      const userImage = await AsyncStorage.getItem('userImageURL') || dummyAuthorImage;

      const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
      await updateDoc(postRef, {
        ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
        RepostedBy: arrayUnion(fetchuserID),
      });

      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: userImage,
        AuthorName: userInfo,
        AuthorUserID: fetchuserID,
        ContentDate: new Date(),
        ContentDesc: comment || '',
        ContentURL: selectedRepostPost.ContentURL || '',
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
        CommentTemplate: selectedRepostPost.CommentTemplate || "Template1",
        isRepost: true,
        originalPost: {
          id: selectedRepostPost.id || '',
          AuthorName: selectedRepostPost.AuthorName || 'Unknown User',
          AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
          ContentDesc: selectedRepostPost.ContentDesc || '',
          ContentDate: selectedRepostPost.ContentDate || new Date(),
          postType: selectedRepostPost.postType || 'Unknown'
        },
        repostComment: comment || '',
        repostedBy: fetchuserID,
        repostedAt: new Date(),
      });

      setFetchedData(prevData => 
        prevData.map(item => 
          item.uniqueId === selectedRepostPost.uniqueId 
            ? { 
                ...item, 
                Reposted: true, 
                ContentRepostCount: item.ContentRepostCount + 1
              } 
            : item
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Quote Repost Created',
        text2: 'Your quote repost has been shared to your followers.',
        position: 'top',
        visibilityTime: 2000,
      });

      if (fullScreenCard && fullScreenCard.uniqueId === selectedRepostPost.uniqueId) {
        setFullScreenCard((prev: PostItem | null) => prev ? ({
          ...prev,
          Reposted: true,
          ContentRepostCount: prev.ContentRepostCount + 1
        }) : null);
      }
    } catch (error) {
      console.error('Error creating quote repost:', error);
      Toast.show({
        type: 'error',
        text1: 'Quote Repost Failed',
        text2: 'Failed to create quote repost. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  }, [selectedRepostPost, userId, fullScreenCard]);

  const handleRepost = useCallback(async (postItem: PostItem) => {
    openRepostModal(postItem);
  }, [openRepostModal]);

  const handleBookmark = useCallback(async (postItem: PostItem) => {
    if (areInteractionsDisabled(postItem)) {
      Toast.show({
        type: 'error',
        text1: 'Action Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    console.log("Bookmark pressed:", postItem.id);
    
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    const postRef = doc(db, postItem.postType, postItem.id);
    if(postItem.Bookmarked) {
      console.log("itemID: ", postItem.id);
      console.log("item Bookmarked: ", postItem.Bookmarked);
      await updateDoc(postRef, {
        BookmarkedBy: arrayRemove(fetchuserID),
      });
      Toast.show({
        type: 'info',
        text1: 'Bookmark Removed',
        text2: 'Post removed from bookmarks',
        position: 'top',
        visibilityTime: 2000,
      });
    } else {
      console.log("itemID: ", postItem.id);
      console.log("item Bookmarked: ", postItem.Bookmarked);
      await updateDoc(postRef, {
        BookmarkedBy: arrayUnion(fetchuserID),
      });
      Toast.show({
        type: 'success',
        text1: 'Bookmarked',
        text2: 'Post saved to bookmarks',
        position: 'top',
        visibilityTime: 2000,
      });
    }

    if (fullScreenCard && fullScreenCard.uniqueId === postItem.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Bookmarked: !prev.Bookmarked
      }) : null);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard, areInteractionsDisabled, userId]);

  const handleShare = useCallback(async (postItem: PostItem) => {
    console.log("Share pressed:", postItem.id);
    
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Toast.show({
        type: 'error',
        text1: 'Sharing Not Available',
        text2: 'Sharing is not available on this device',
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }

    try {
      await Share.share({
        message: `SENTINEL POST\n\nShared by ${postItem.AuthorName}\n${postItem.ContentDesc}\n${postItem.ContentURL}\n\nPlease take a look.`,
      });
      
    } catch (error) {
      console.log("Error sharing ", error);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Failed to share post',
        position: 'top',
        visibilityTime: 2000,
      });
    }

    await new Promise(r => setTimeout(r, 200));
  }, []);

  // UPDATED: VideoPlayer component using expo-video
  const VideoPlayer = useCallback(({ videoUrl, index }: { videoUrl: string; index?: number }) => {
    const player = useVideoPlayer(videoUrl, (player) => {
      player.loop = true;
      player.muted = true;
      if (currentVideoIndex === index) {
        player.play();
      } else {
        player.pause();
      }
    });

    // Update play/pause when currentVideoIndex changes
    useEffect(() => {
      if (currentVideoIndex === index) {
        player.play();
      } else {
        player.pause();
      }
    }, [currentVideoIndex, index, player]);

    return (
      <View className="relative rounded-xl overflow-hidden bg-black">
        <VideoView
          player={player}
          style={{ width: '100%', height: 200 }}
          contentFit="contain"
          nativeControls={false}
        />
        <View className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50">
          <Ionicons name="play-outline" size={14} color="white" />
        </View>
        {currentVideoIndex !== index && (
          <View className="absolute inset-0 bg-black/20 items-center justify-center">
            <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center">
              <Ionicons name="play" size={20} color="white" />
            </View>
          </View>
        )}
      </View>
    );
  }, [currentVideoIndex]);

  const renderMediaContent = useCallback((item: PostItem, index?: number) => {
    const mediaUrls = item.ContentURLs && item.ContentURLs.length > 0 ? item.ContentURLs : 
                     (item.ContentURL ? [item.ContentURL] : []);
    
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const primaryMediaUrl = mediaUrls[0];
    const mediaType = getMediaType(primaryMediaUrl);

    if (mediaType === 'image') {
      return (
        <View className="mb-2">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenImage(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View className="relative rounded-xl overflow-hidden">
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{ width: '100%', height: 200 }}
                className="bg-gray-100"
                resizeMode="cover"
                onError={(error) => {
                  console.log("Image load error:", error.nativeEvent.error);
                }}
              />
              <View className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50">
                <Ionicons name="expand-outline" size={14} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else if (mediaType === 'video') {
      return (
        <View className="mb-2">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenVideo(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <VideoPlayer videoUrl={primaryMediaUrl} index={index} />
          </TouchableOpacity>
        </View>
      );
    } else if (mediaType === 'gif') {
      return (
        <View className="mb-2">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenImage(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View className="relative rounded-xl overflow-hidden">
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{ width: '100%', height: 200 }}
                className="bg-gray-100"
                resizeMode="cover"
              />
              <View className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50">
                 <MaterialIcons name="gif" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else if (mediaType === 'doc') {
      return (
        <View className="mb-2">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenDoc(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#EEF2F6',
                alignItems: 'center',
                justifyContent: 'center',
                height: 80,
              }}>
              <Ionicons name="document-text-outline" size={32} color="#000000" />
              <Text numberOfLines={1} style={{ color: '#333', marginTop: 4, textAlign: 'center', paddingHorizontal: 12, fontSize: 11 }}>
                {primaryMediaUrl.split('/').pop() || 'Document'}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 9, marginTop: 1 }}>Tap to open</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return null;
    }
  }, [getMediaType, openFullScreenImage, openFullScreenVideo, openFullScreenDoc, VideoPlayer]);

  const renderRepostContent = useCallback((item: PostItem) => {
    if (!item.isRepost || !item.originalPost) return null;

    return (
      <View className="border border-gray-200 rounded-xl p-3 mt-2 bg-gray-50">
        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: item.originalPost.AuthorImageURL || dummyAuthorImage }}
            className="w-6 h-6 rounded-full mr-2"
            resizeMode="cover"
          />
          <Text className="font-semibold text-gray-900 text-sm">{item.originalPost.AuthorName}</Text>
          <Text className="text-gray-500 text-xs ml-2">
            {getTimeAgo(item.originalPost.ContentDate)}
          </Text>
        </View>
        <Text className="text-gray-700 text-sm" numberOfLines={3}>
          {item.originalPost.ContentDesc}
        </Text>
      </View>
    );
  }, [getTimeAgo, dummyAuthorImage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered');
    await handleFetchAllData(true);
    setRefreshing(false);
  }, [handleFetchAllData]);

  const filteredData = useMemo(() => {
    let baseData = fetchedData.filter(item => {
      if (userRole === "User") {
        return item.isApproved && !item.isNew;
      }
      return true;
    });

    if (activeTab === 'following') {
      console.log('🔍 Filtering for following tab');
      console.log('Following user IDs:', followingUserIds);
      console.log('Base data count:', baseData.length);
      
      const followingData = baseData.filter(item => {
        const authorId = item.AuthorUserID || item.repostedBy;
        const isFromFollowedUser = authorId && followingUserIds.includes(authorId);
        
        if (isFromFollowedUser) {
          console.log(`✅ Including post from followed user: ${item.AuthorName} (${authorId})`);
        }
        
        return isFromFollowedUser;
      });
      
      console.log('✅ Following filtered data count:', followingData.length);
      return followingData;
    }

    return baseData;
  }, [fetchedData, userRole, activeTab, followingUserIds]);

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const viewHeight = layoutMeasurement.height;
    const viewCenter = currentScrollY + viewHeight / 2;

    filteredData.forEach((item, index) => {
      const mediaUrls = item.ContentURLs && item.ContentURLs.length > 0 ? item.ContentURLs : 
                       (item.ContentURL ? [item.ContentURL] : []);
      
      if (mediaUrls.length > 0 && getMediaType(mediaUrls[0]) === 'video') {
        const itemY = index * 340;
        const itemCenter = itemY + 150;
        
        if (Math.abs(viewCenter - itemCenter) < 100) {
          if (currentVideoIndex !== index) {
            setCurrentVideoIndex(index);
          }
        }
      }
    });
  }, [filteredData, getMediaType, currentVideoIndex]);

  const ApprovalToggle = useCallback(({ isApproved, isNew, onToggle, postId, isFullScreen = false }: { 
    isApproved: boolean; 
    isNew: boolean;
    onToggle: (approved: boolean, isNew: boolean) => void;
    postId: string;
    isFullScreen?: boolean;
  }) => {
    const handleApproveClick = () => {
      onToggle(true, false);
    };

    const handleRejectClick = () => {
      openRejectionModal(postId);
    };

    return (
      <View className="flex-row items-center justify-center" style={{ gap: isFullScreen ? 8 : 4 }}>
        <TouchableOpacity
          onPress={handleApproveClick}
          className={`px-1.5 py-1 rounded-full border flex-row items-center ${
            isApproved 
              ? 'bg-green-500 border-green-500' 
              : 'bg-white border-green-300'
          }`}
          activeOpacity={0.8}
          style={{
            shadowColor: isApproved ? '#22c55e' : '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isApproved ? 0.3 : 0.1,
            shadowRadius: 2,
            elevation: isApproved ? 2 : 1,
          }}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={isFullScreen ? 14 : 10} 
            color={isApproved ? "white" : "#22c55e"} 
          />
          <Text className={`ml-1 font-semibold ${isFullScreen ? 'text-xs' : 'text-xs'} ${
            isApproved ? 'text-white' : 'text-green-600'
          }`}>
            Approve
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRejectClick}
          className={`px-1.5 py-1 rounded-full border flex-row items-center ${
            !isApproved && !isNew 
              ? 'bg-red-500 border-red-500' 
              : 'bg-white border-red-300'
          }`}
          activeOpacity={0.8}
          style={{
            shadowColor: (!isApproved && !isNew) ? '#ef4444' : '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: (!isApproved && !isNew) ? 0.3 : 0.1,
            shadowRadius: 2,
            elevation: (!isApproved && !isNew) ? 2 : 1,
          }}
        >
          <Ionicons 
            name="close-circle" 
            size={isFullScreen ? 14 : 10} 
            color={(!isApproved && !isNew) ? "white" : "#ef4444"} 
          />
          <Text className={`ml-1 font-semibold ${isFullScreen ? 'text-xs' : 'text-xs'} ${
            (!isApproved && !isNew) ? 'text-white' : 'text-red-600'
          }`}>
            Reject
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [openRejectionModal]);

  const EnhancedCard = useCallback(({ children, postId }: { children: React.ReactNode, postId: string }) => {
    const animationKey = `${activeTab}-${postId}`;
    const animValue = cardAnimations[animationKey] || new Animated.Value(0);
    
    return (
      <Animated.View
        style={[
          {
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              },
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                })
              }
            ],
            opacity: animValue,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }
        ]}
        className="mx-3 mb-1.5 bg-white rounded-xl overflow-hidden border border-gray-100"
      >
        {children}
      </Animated.View>
    );
  }, [cardAnimations, activeTab]);

  const getPostStatus = useCallback((item: PostItem) => {
    if (item.isNew) {
      return { text: 'New', color: '#f97316', bgColor: 'bg-orange-100' };
    } else if (item.isApproved) {
      return { text: 'Approved', color: '#22c55e', bgColor: 'bg-green-100' };
    } else {
      return { text: 'Rejected', color: '#ef4444', bgColor: 'bg-red-100' };
    }
  }, []);

  const renderPostContent = useCallback((item: PostItem, index: number) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => openCommentsModal(item)}
    >
      <EnhancedCard postId={item.uniqueId}>
        <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-8 h-8 rounded-full mr-2 overflow-hidden border-2 border-white shadow-sm">
                <Image
                  source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-sm">{item.AuthorName}</Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-gray-500 text-xs mr-2">{getTimeAgo(item.ContentDate)}</Text>
                {item.postType === 'X-Data' && (
                  <View className="bg-blue-100 px-1.5 py-0.5 rounded-full mr-1.5">
                    <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                  </View>
                )}
                {item.postType === 'SentinelPosts' && (
                  <View className={`px-1.5 py-0.5 rounded-full ${getPostStatus(item).bgColor}`}>
                    <Text className="text-xs font-semibold" style={{ color: getPostStatus(item).color }}>
                      {getPostStatus(item).text}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity className="p-1.5 rounded-full bg-gray-100">
              <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-3 py-2.5">
          <Text className="text-gray-800 text-sm leading-5 mb-2 font-normal">{item.ContentDesc}</Text>

          {renderRepostContent(item)}

          {(!item.isRepost || item.repostComment) && renderMediaContent(item, index)}

          <View className="flex-row items-center justify-between pt-1.5">
            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons
                name={item.Liked ? "heart" : "heart-outline"}
                size={14}
                color={item.Liked ? "#ef4444" : "#64748b"}
              />
              <Text className={`ml-1 text-xs font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                {item.ContentLikeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                openCommentsModal(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <MaterialCommunityIcons
                name="thumbs-up-down"
                size={14}
                color="#000000"
              />
              <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                handleRepost(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons 
                name="repeat-outline" 
                size={14} 
                color={item.Reposted ? "#0ea5e9" : "#64748b"} 
              />
              <Text className={`ml-1 text-xs font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.ContentRepostCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`p-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                openGraphModal(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Feather name="bar-chart-2" size={16} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                handleBookmark(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons 
                name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                size={14} 
                color={item.Bookmarked ? "#000000" : "#64748b"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`p-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                handleShare(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Feather name="share-2" size={12} color="#64748b" />
            </TouchableOpacity>
          </View>

          {userRole !== "User" && item.postType === "SentinelPosts" && (
            <TouchableOpacity
              onPress={(e) => e.stopPropagation()}
              activeOpacity={1}
            >
              <View className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <View className="mb-2">
                  <Text className="font-bold text-gray-900 text-sm">Post Status</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {item.isNew 
                      ? 'This post is new and awaiting review' 
                      : item.isApproved
                      ? 'This post is approved and visible to users' 
                      : 'This post is rejected and not visible to users'
                    }
                  </Text>
                </View>
                
                <ApprovalToggle
                  isApproved={item.isApproved}
                  isNew={item.isNew}
                  onToggle={(approved, isNew) => handleApprovalToggle(item.id, approved, isNew)}
                  postId={item.id}
                  isFullScreen={false}
                />
              </View>
            </TouchableOpacity>
          )}
          {userRole !== "User" && item.postType === "SentinelPosts" && (
            <TouchableOpacity
              onPress={(e) => e.stopPropagation()}
              activeOpacity={1}
            >
              <View className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <View style={styles.container}>
                  <View style={[styles.labelContainer, { maxWidth: width * 0.6 }]}>
                    <Text style={styles.label}>Vote Option:</Text>
                  </View>
                  <Dropdown
                    data={fetchedCommentTemplate}
                    labelField="name"
                    valueField="name"
                    value={item.CommentTemplate}
                    onChange={itemValue => handleDropdownChange(itemValue, item)}
                    style={styles.dropdown}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </EnhancedCard>
    </TouchableOpacity>
  ), [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, ApprovalToggle, handleApprovalToggle, dummyAuthorImage, userRole, getPostStatus, areInteractionsDisabled, openGraphModal, renderRepostContent]);

  const renderPostUserContent = useCallback((item: PostItem, index: number) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => openCommentsModal(item)}
    >
      <EnhancedCard postId={item.uniqueId}>
        <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-8 h-8 rounded-full mr-2 overflow-hidden border-2 border-white shadow-sm">
                <Image
                  source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-sm">{item.AuthorName}</Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-gray-500 text-xs mr-2">{getTimeAgo(item.ContentDate)}</Text>
                {item.postType === 'X-Data' && (
                  <View className="bg-blue-100 px-1.5 py-0.5 rounded-full">
                    <Text className="text-blue-600 text-xs font-medium">𝕏 POST</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity className="p-1.5 rounded-full bg-gray-100">
              <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-3 py-2.5">
          {item.isRepost && (
            <View className="flex-row items-center mb-2 pb-2 border-b border-gray-100">
              <Ionicons name="repeat" size={14} color="#64748b" />
              <Text className="ml-1 text-gray-600 text-xs">
                {item.repostComment ? 'Quote repost' : 'Reposted'}
              </Text>
            </View>
          )}

          <Text className="text-gray-800 text-sm leading-5 mb-2">{item.ContentDesc}</Text>

          {renderRepostContent(item)}

          {(!item.isRepost || item.repostComment) && renderMediaContent(item, index)}

          <View className="flex-row items-center justify-between pt-1.5">
            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons
                name={item.Liked ? "heart" : "heart-outline"}
                size={14}
                color={item.Liked ? "#ef4444" : "#64748b"}
              />
              <Text className={`ml-1 text-xs font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                {item.ContentLikeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                openCommentsModal(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <MaterialCommunityIcons
                name="thumbs-up-down"
                size={14}
                color="#000000"
              />
              <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                handleRepost(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons 
                name="repeat-outline" 
                size={14} 
                color={item.Reposted ? "#0ea5e9" : "#64748b"} 
              />
              <Text className={`ml-1 text-xs font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.ContentRepostCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`p-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                openGraphModal(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Feather name="bar-chart-2" size={16} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                handleBookmark(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons 
                name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                size={14} 
                color={item.Bookmarked ? "#000000" : "#64748b"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`p-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => {
                e.stopPropagation();
                handleShare(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Feather name="share-2" size={12} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </EnhancedCard>
    </TouchableOpacity>
  ), [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, dummyAuthorImage, areInteractionsDisabled, openGraphModal, renderRepostContent]);

  const listItems = useMemo(() => {
    console.log(`🔄 Rendering ${filteredData.length} items for ${activeTab} tab`);
    
    return filteredData.map((item, index) => {
      initializeCardAnimation(item.uniqueId);
      
      const baseKey = `${item.postType}-${item.id}`;
      const contextKey = `${activeTab}-${index}`;
      const getTimestamp = (date: any) => {
        if (date && typeof date === 'object' && 'seconds' in date) return date.seconds;
        if (typeof date === 'number') return date;
        if (typeof date === 'string') return date;
        return '';
      };
      const timestampKey = getTimestamp(item.createdAt) || getTimestamp(item.ContentDate) || index;
      const uniqueKey = `${baseKey}-${contextKey}-${timestampKey}`;
      
      if (userRole === "User") {
        return (
          <React.Fragment key={uniqueKey}>
            {renderPostUserContent(item, index)}
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment key={uniqueKey}>
            {renderPostContent(item, index)}
          </React.Fragment>
        );
      }
    });
  }, [filteredData, userRole, initializeCardAnimation, renderPostUserContent, renderPostContent, activeTab]);

  const renderEmptyFollowingState = () => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
        <MaterialCommunityIcons name="account-heart-outline" size={40} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
        No Posts from Following
      </Text>
      <Text className="text-gray-500 text-center leading-6 mb-4">
        You're not following anyone yet, or users you follow haven't posted anything.
      </Text>
      <TouchableOpacity 
        className="bg-black px-6 py-3 rounded-xl"
        onPress={() => {
          router.push('/search');
        }}
      >
        <Text className="text-white font-semibold">Find People to Follow</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View className="bg-white border-b border-gray-200 pt-3">
        <View 
          className="px-4 py-2 flex-row items-center justify-between"
          style={{ paddingTop: Platform.OS === 'ios' ? 12 : 12 }}
        >
          <View>
            <Image
              source={require("../../assets/images/sentinel_logo.png")}
              className="w-16 h-10"
              resizeMode="contain"
            />
          </View>
          
          <TouchableOpacity 
              className="p-2 "
              onPress={() => router.push('/search')}
            >
              <MaterialCommunityIcons 
                name="magnify" 
                size={30} 
                color="#374151" 
              />
            </TouchableOpacity>
        </View>
      </View>

      <TabHeader 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      <ScrollView 
        key={`feed-${activeTab}-${filteredData.length}`}
        ref={scrollViewRef}
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 6, 
          paddingBottom: 16,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
            title="Pull to refresh"
            titleColor="#64748b"
          />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <LoadingComponent visible={true} size="large" />
          </View>
        ) : activeTab === 'following' && followingUserIds.length === 0 ? (
          renderEmptyFollowingState()
        ) : listItems.length > 0 ? (
          listItems
        ) : activeTab === 'following' ? (
          renderEmptyFollowingState()
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <LoadingComponent visible={true} size="large" />
          </View>
        )}
      </ScrollView>
      
      {/* IMAGE MODAL */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenImage}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity 
            className="absolute top-12 right-6 z-10 p-3 rounded-full bg-black/60 backdrop-blur-sm"
            onPress={closeFullScreenImage}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 justify-center items-center"
            activeOpacity={1}
            onPress={closeFullScreenImage}
          >
            {fullScreenImage && (
              <Image
                source={{ uri: fullScreenImage }}
                className="w-full max-w-full"
                style={{ 
                  height: screenHeight - 100, 
                  maxHeight: screenHeight - 100 
                }}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* VIDEO MODAL - UPDATED */}
      <Modal
        visible={isVideoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenVideo}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity 
            className="absolute top-12 right-6 z-10 p-3 rounded-full bg-black/60 backdrop-blur-sm"
            onPress={closeFullScreenVideo}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 justify-center items-center">
            {fullScreenVideo && (
              <VideoView
                player={fullScreenVideoPlayer}
                style={{ width: screenWidth, height: screenHeight - 100 }}
                contentFit="contain"
                nativeControls={true}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* DOCUMENT MODAL */}
      <Modal
        visible={isDocModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenDoc}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity 
            className="absolute top-12 right-6 z-10 p-3 rounded-full bg-black/60 backdrop-blur-sm"
            onPress={closeFullScreenDoc}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 justify-center items-center px-8">
            {fullScreenDoc && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(fullScreenDoc)}
                className="items-center"
              >
                <Ionicons name="document-text-outline" size={80} color="white" />
                <Text className="text-white text-xl mt-6 text-center font-bold">
                  Open Document
                </Text>
                <Text className="text-purple-400 text-base mt-4 text-center underline">
                  {fullScreenDoc.split('/').pop() || 'Document'}
                </Text>
                <Text className="text-gray-400 text-sm mt-4 text-center">
                  Tap here to open the file in your browser or default app
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* REJECTION MODAL */}
      <Modal
        visible={isRejectionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeRejectionModal}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
               style={{
                 shadowColor: '#000',
                 shadowOffset: { width: 0, height: 10 },
                 shadowOpacity: 0.25,
                 shadowRadius: 25,
                 elevation: 10,
               }}
          >
            <View className=" px-6 py-5 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center mr-4">
                    <Ionicons name="close-circle" size={28} color="#000" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900 text-xl">Reject Post</Text>
                    <Text className="text-black text-sm mt-1">Select rejection reasons</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="p-2 rounded-full bg-gray-100"
                  onPress={closeRejectionModal}
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.6 }} showsVerticalScrollIndicator={false}>
              <View className="px-6 py-6">
                <Text className="text-gray-700 text-base mb-6 leading-6">
                  Please select one or more reasons why this post is being rejected. This will help the user understand our community guidelines.
                </Text>

                <View style={{ gap: 12 }}>
                  {rejectionReasons.map((reason, index) => {
                    const isSelected = selectedRejectionReasons.includes(reason);
                    return (
                      <TouchableOpacity
                        key={index}
                        className={`flex-row items-center py-4 px-5 rounded-2xl border-2 ${
                          isSelected 
                            ? 'bg-white border-black' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onPress={() => toggleRejectionReason(reason)}
                        activeOpacity={0.7}
                        style={{
                          shadowColor: isSelected ? '#000' : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSelected ? 0.1 : 0,
                          shadowRadius: 4,
                          elevation: isSelected ? 2 : 0,
                        }}
                      >
                        <View 
                          className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-4 ${
                            isSelected 
                              ? ' border-black' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="black" />
                          )}
                        </View>
                        
                        <Text 
                          className={`flex-1 text-base leading-6 font-medium ${
                            isSelected ? 'text-black' : 'text-gray-700'
                          }`}
                        >
                          {reason}
                        </Text>
                        
                        {isSelected && (
                          <View className="ml-2">
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedRejectionReasons.length > 0 && (
                  <View className="mt-6 p-4  rounded-2xl ">
                    <Text className="text-black font-semibold text-sm">
                      {selectedRejectionReasons.length} reason{selectedRejectionReasons.length > 1 ? 's' : ''} selected
                    </Text>
                    <Text className="text-black text-xs mt-1">
                      The user will receive notification about these specific issues
                    </Text>
                  </View>
                )}

                <View className="flex-row mt-8" style={{ gap: 12 }}>
                  <TouchableOpacity
                    className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-200 bg-gray-50"
                    onPress={closeRejectionModal}
                    activeOpacity={0.8}
                  >
                    <Text className="text-gray-700 font-semibold text-center text-base">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className={`flex-1 py-4 px-6 rounded-2xl ${
                      selectedRejectionReasons.length > 0 
                        ? 'bg-black' 
                        : 'bg-gray-300'
                    }`}
                    onPress={handleRejectionSubmit}
                    activeOpacity={0.8}
                    disabled={selectedRejectionReasons.length === 0}
                    style={{
                      shadowColor: selectedRejectionReasons.length > 0 ? '#ef4444' : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: selectedRejectionReasons.length > 0 ? 6 : 0,
                    }}
                  >
                    <Text className={`font-semibold text-center text-base ${
                      selectedRejectionReasons.length > 0 ? 'text-white' : 'text-gray-500'
                    }`}>
                      Submit Rejection
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
        postData={fetchedData.find(item => item.id === selectedPostId)}
        commentTemplate={selectedCommentTemplate}
      />

      {/* GRAPH MODAL */}
      <TotalSentiment
        visible={isGraphModalVisible}
        onClose={closeGraphModal}
        postId={selectedGraphPostId}
        postType={selectedGraphPostType}
        postData={fetchedData.find(item => item.id === selectedGraphPostId)}
        onAddResponse={addResponseGraphModal} 
        userExistingComment={undefined} 
        onEditComment={undefined}
        commentTemplate={selectedCommentTemplate}
        />

     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  labelContainer: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    flexWrap: 'wrap', // Allow label to wrap
  },
  dropdown: {
    flex: 1,
    width: 200,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingLeft: 8,
  },
});
