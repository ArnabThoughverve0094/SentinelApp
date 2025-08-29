import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ResizeMode, Video } from 'expo-av';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FlipCard from 'react-native-flip-card';
import CommentsModal from '../../components/CommentsModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PostItem {
  id: string;
  uniqueId: string;
  liked: boolean;
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
  postType: string;
  Liked: boolean;
  Reposted: boolean;
  createdAt?: any;
}

// Custom Modal Component for Alerts
interface CustomModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  buttons,
  onClose
}) => {
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
    }
  }, [visible, scaleAnim]);

  const getModalStyle = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-circle' as const,
          iconColor: '#22C55E',
          iconBg: 'bg-green-100',
        };
      case 'error':
        return {
          iconName: 'close-circle' as const,
          iconColor: '#EF4444',
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          iconName: 'warning' as const,
          iconColor: '#F59E0B',
          iconBg: 'bg-yellow-100',
        };
      default:
        return {
          iconName: 'information-circle' as const,
          iconColor: '#3B82F6',
          iconBg: 'bg-blue-100',
        };
    }
  };

  const modalStyle = getModalStyle();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <Animated.View 
          style={[{ transform: [{ scale: scaleAnim }] }]}
          className="bg-white rounded-3xl p-8 items-center w-full max-w-sm shadow-2xl"
        >
          {/* Icon */}
          <View className={`w-20 h-20 ${modalStyle.iconBg} rounded-full items-center justify-center mb-6`}>
            <Ionicons name={modalStyle.iconName} size={48} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            {message}
          </Text>

          {/* Buttons */}
          <View className="w-full space-y-3">
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                className={`py-4 px-8 rounded-xl items-center w-full shadow-lg ${
                  button.style === 'cancel' 
                    ? 'bg-gray-200' 
                    : button.style === 'destructive'
                    ? 'bg-red-500'
                    : 'bg-violet-500'
                }`}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text className={`text-lg font-semibold ${
                  button.style === 'cancel' 
                    ? 'text-gray-700' 
                    : 'text-white'
                }`}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function SentinelFeed(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState("1");
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
  const flipCardRef = useRef<any>(null);

  // ------- COMMENT MODAL STATE -------
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);

  // ------- REJECTION MODAL STATE -------
  const [isRejectionModalVisible, setIsRejectionModalVisible] = useState(false);
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<string[]>([]);
  const [rejectionPostId, setRejectionPostId] = useState<string | null>(null);

  // ------- CUSTOM ALERT STATE -------
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: []
  });

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // REJECTION REASONS ARRAY
  const rejectionReasons = [
    'Inappropriate content or language',
    'Spam or repetitive content', 
    'Misleading or false information',
    'Violates community guidelines',
    'Copyright infringement',
    'Offensive or discriminatory content'
  ];

  // Custom Alert function
  const showCustomAlert = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      buttons
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  // IMPROVED TIME AGO FUNCTION
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
        return diffInSeconds <= 0 ? 'Just now' : `${diffInSeconds}s ago`;
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
      } else if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
      } else {
        return `${diffInYears}y ago`;
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
    if (!cardAnimations[postId]) {
      const newAnimation = new Animated.Value(0);
      setCardAnimations(prev => ({
        ...prev,
        [postId]: newAnimation
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
  }, [cardAnimations]);

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

  // ✅ FIXED: Correct comment counting from subcollections
  const fetchSinglePostComments = useCallback(async (postId: string, postType: string) => {
    try {
      let totalComments = 0;
      
      // Fetch comments from the correct subcollection: postType/postId/Comments
      const commentsRef = collection(db, postType, postId, 'Comments');
      const commentsSnapshot = await getDocs(commentsRef);
      
      totalComments = commentsSnapshot.size; // Count direct comments
      
      // Count replies: postType/postId/Comments/commentId/Replies
      for (const commentDoc of commentsSnapshot.docs) {
        const repliesRef = collection(db, postType, postId, 'Comments', commentDoc.id, 'Replies');
        const repliesSnapshot = await getDocs(repliesRef);
        totalComments += repliesSnapshot.size; // Add reply counts
      }
      
      // Update only this specific post's comment count
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

  // ✅ FIXED: Fetch comments from correct subcollection structure
  const fetchCommentsCount = useCallback(async (posts: PostItem[]) => {
    try {
      console.log('Starting to fetch comments for', posts.length, 'posts');
      const commentsCount: { [key: string]: number } = {};
      
      // Process each post to count comments and replies
      const commentPromises = posts.map(async (post) => {
        try {
          let totalComments = 0;
          
          // ✅ FIXED: Use correct subcollection path
          const commentsRef = collection(db, post.postType, post.id, 'Comments');
          const commentsSnapshot = await getDocs(commentsRef);
          
          totalComments = commentsSnapshot.size; // Direct comments count
          
          // Count replies for each comment
          const replyPromises = commentsSnapshot.docs.map(async (commentDoc) => {
            const repliesRef = collection(db, post.postType, post.id, 'Comments', commentDoc.id, 'Replies');
            const repliesSnapshot = await getDocs(repliesRef);
            return repliesSnapshot.size;
          });
          
          const replyCounts = await Promise.all(replyPromises);
          totalComments += replyCounts.reduce((sum, count) => sum + count, 0);
          
          return { [post.id]: totalComments };
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
          return { [post.id]: 0 };
        }
      });
      
      const results = await Promise.all(commentPromises);
      results.forEach(result => Object.assign(commentsCount, result));
      
      setCommentsData(commentsCount);
      console.log('✅ Comments count fetched successfully:', commentsCount);
    } catch (error) {
      console.error('Error fetching comments count:', error);
    }
  }, []);

  // OPTIMIZED DATA FETCHING
  const handleFetchAllData = useCallback(async (forceRefresh: boolean = false) => {
    const currentTime = Date.now();
    const cacheValidTime = 5 * 60 * 1000; // 5 minutes cache
    
    if (!forceRefresh && isInitialized && fetchedData.length > 0 && 
        (currentTime - lastFetchTime) < cacheValidTime) {
      console.log('Using cached data, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      const postsXData: any = [];
      
      // Process X-Data
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
            liked: false,
            AuthorImageURL: postData.AuthorImageURL,
            AuthorName: postData.AuthorName,
            ContentDate: postData.ContentDate,
            ContentDesc: postData.ContentDesc,
            ContentURL: postData.ContentURL,
            ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
            ContentLikeCount: postData.ContentLikeCount || 0,
            ContentRepostCount: postData.ContentRepostCount || 0,
            ContentCommentCount: postData.ContentCommentCount || 0,
            isApproved: true,
            postType: "X-Data",
            Liked: false,
            Reposted: false,
            createdAt: postData.createdAt || postData.ContentDate,
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
      // Process SentinelPosts
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
            liked: false,
            AuthorImageURL: postData.AuthorImageURL,
            AuthorName: postData.AuthorName,
            ContentDate: postData.ContentDate,
            ContentDesc: postData.ContentDesc,
            ContentURL: postData.ContentURL,
            ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
            ContentLikeCount: postData.ContentLikeCount || 0,
            ContentRepostCount: postData.ContentRepostCount || 0,
            ContentCommentCount: postData.ContentCommentCount || 0,
            isApproved: postData.isApproved || false,
            postType: "SentinelPosts",
            Liked: false,
            Reposted: false,
            createdAt: postData.createdAt || postData.ContentDate,
          });

        }

        setFetchedData(postsData.concat(postsXData));
      });
      
      setLastFetchTime(currentTime);
      console.log('All Data Fetched and Sorted', `Total: ${fetchedData.length} documents`);
      
      // ✅ Fetch comments count after posts are loaded
      await fetchCommentsCount(fetchedData);
      
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
  }, [fetchCommentsCount, isInitialized, fetchedData.length, lastFetchTime]);

  useEffect(() => {
    getItem();
    handleFetchAllData();
  }, []);

  // ✅ Smart comment update when returning from comments screen
  useFocusEffect(
    useCallback(() => {
      const checkCommentUpdate = async () => {
        try {
          const lastVisitedPost = await AsyncStorage.getItem('lastVisitedPost');
          const lastVisitedPostType = await AsyncStorage.getItem('lastVisitedPostType');
          
          if (lastVisitedPost && lastVisitedPostType && isInitialized) {
            console.log('🔄 Updating comments for visited post:', lastVisitedPost);
            // Only refresh comments for the specific post that was visited
            await fetchSinglePostComments(lastVisitedPost, lastVisitedPostType);
            
            // Clear the visited post data
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

  // TO OPEN COMMENTS MODAL (replace navigation to comments with this)
  const openCommentsModal = useCallback((item: PostItem) => {
    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setIsCommentModalVisible(true);
  }, []);

  // TO CLOSE COMMENTS MODAL
  const closeCommentsModal = useCallback(() => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
    setSelectedPostType(null);
  }, []);

  // ENHANCED REJECTION MODAL FUNCTIONS
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
      showCustomAlert(
        'warning',
        'Selection Required',
        'Please select at least one reason for rejection.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    try {
      // Update the post status to rejected
      await handleApprovalToggle(rejectionPostId, false);
      
      // Save the rejection reasons to your database
      await updateDoc(doc(db, 'SentinelPosts', rejectionPostId), {
        isApproved: false,
        rejectionReasons: selectedRejectionReasons,
        rejectedAt: new Date()
      });

      closeRejectionModal();
      
      // Show success notification
      showCustomAlert(
        'success',
        'Post Rejected',
        `Post has been rejected successfully with ${selectedRejectionReasons.length} reason(s).`,
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      
    } catch (error) {
      console.error('Error rejecting post:', error);
      showCustomAlert(
        'error',
        'Rejection Failed',
        'Failed to reject post. Please try again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
    }
  }, [selectedRejectionReasons, rejectionPostId, closeRejectionModal, showCustomAlert, hideModal]);

  // MEDIA MODAL CONTROLS
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

  const handleApprovalToggle = useCallback(async (postId: string, newStatus: boolean) => {
    console.log("Toggling post:", postId, "to:", newStatus ? "Approved" : "Rejected");

    setFetchedData(prevData => 
      prevData.map(item => 
        item.id === postId 
          ? { ...item, isApproved: newStatus }
          : item
      )
    );

    if (fullScreenCard && fullScreenCard.id === postId) {
      setFullScreenCard((prev: PostItem | null) => 
        prev ? { ...prev, isApproved: newStatus } : null
      );
    }

    try {
      await updateDoc(doc(db, 'SentinelPosts', postId), {
        isApproved: newStatus,
      });
      console.log("Post status updated successfully");
    } catch (error) {
      console.error("Error updating post status:", error);
      setFetchedData(prevData => 
        prevData.map(item => 
          item.id === postId 
            ? { ...item, isApproved: !newStatus }
            : item
        )
      );
      if (fullScreenCard && fullScreenCard.id === postId) {
        setFullScreenCard((prev: PostItem | null) => 
          prev ? { ...prev, isApproved: !newStatus } : null
        );
      }
    }
  }, [fullScreenCard]);

  const toggleLike = useCallback(async (postItem: PostItem) => {
    setFetchedData(prevData => 
      prevData.map(item => 
        item.uniqueId === postItem.uniqueId 
          ? { 
              ...item, 
              Liked: !item.Liked, 
              ContentLikeCount: item.Liked 
                ? item.ContentLikeCount - 1 
                : item.ContentLikeCount + 1
            } 
          : item
      )
    );

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
  }, [fullScreenCard]);

  const handleRepost = useCallback(async (postItem: PostItem) => {
    console.log("Repost pressed:", postItem.id);
    
    setFetchedData(prevData => 
      prevData.map(item => 
        item.uniqueId === postItem.uniqueId 
          ? { 
              ...item, 
              Reposted: !item.Reposted, 
              ContentRepostCount: item.Reposted 
                ? item.ContentRepostCount - 1 
                : item.ContentRepostCount + 1
            } 
          : item
      )
    );

    if (fullScreenCard && fullScreenCard.uniqueId === postItem.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Reposted: !prev.Reposted,
        ContentRepostCount: prev.Reposted 
          ? prev.ContentRepostCount - 1 
          : prev.ContentRepostCount + 1
      }) : null);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard]);

  const renderMediaContent = useCallback((item: PostItem) => {
    const mediaUrls = item.ContentURLs && item.ContentURLs.length > 0 ? item.ContentURLs : 
                     (item.ContentURL ? [item.ContentURL] : []);
    
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const primaryMediaUrl = mediaUrls[0];
    const mediaType = getMediaType(primaryMediaUrl);

    if (mediaType === 'image') {
      return (
        <View className="mb-6">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenImage(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View className="relative rounded-2xl overflow-hidden">
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{ width: '100%', height: 320 }}
                className="bg-gray-100"
                resizeMode="cover"
                onError={(error) => {
                  console.log("Image load error:", error.nativeEvent.error);
                }}
              />
              <View className="absolute top-4 right-4 p-3 rounded-full bg-black/50">
                <Ionicons name="expand-outline" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else if (mediaType === 'video') {
      return (
        <View className="mb-6">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenVideo(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View className="relative rounded-2xl overflow-hidden bg-black">
              <Video
                source={{ uri: primaryMediaUrl }}
                style={{ width: '100%', height: 320 }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={false}
                shouldPlay={false}
                isMuted={true}
                isLooping={false}
              />
              <View className="absolute top-4 right-4 p-3 rounded-full bg-black/50">
                <Ionicons name="play-outline" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else if (mediaType === 'gif') {
      return (
        <View className="mb-6">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenImage(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View className="relative rounded-2xl overflow-hidden">
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{ width: '100%', height: 320 }}
                className="bg-gray-100"
                resizeMode="cover"
              />
              <View className="absolute top-4 right-4 p-3 rounded-full bg-black/50">
                 <MaterialIcons name="gif" size={28} color="#666" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else if (mediaType === 'doc') {
      return (
        <View className="mb-6">
          <TouchableOpacity 
            onPress={(e) => {
              e?.stopPropagation?.();
              openFullScreenDoc(primaryMediaUrl);
            }}
            activeOpacity={0.95}
          >
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#EEF2F6',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
              }}>
              <Ionicons name="document-text-outline" size={48} color="#8B5CF6" />
              <Text numberOfLines={2} style={{ color: '#333', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }}>
                {primaryMediaUrl.split('/').pop() || 'Document'}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Tap to open</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return null;
    }
  }, [getMediaType, openFullScreenImage, openFullScreenVideo, openFullScreenDoc]);

  // OPTIMIZED REFRESH
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered');
    await handleFetchAllData(true);
    setRefreshing(false);
  }, [handleFetchAllData]);

  const ApprovalToggle = useCallback(({ isApproved, onToggle, postId, isFullScreen = false }: { 
    isApproved: boolean; 
    onToggle: (approved: boolean) => void;
    postId: string;
    isFullScreen?: boolean;
  }) => {
    const handleRejectClick = () => {
      openRejectionModal(postId);
    };

    return (
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => onToggle(true)}
          className={`px-4 py-2.5 rounded-full border-2 flex-row items-center ${
            isApproved 
              ? 'bg-green-500 border-green-500' 
              : 'bg-white border-green-300'
          }`}
          activeOpacity={0.8}
          style={{
            shadowColor: isApproved ? '#22c55e' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isApproved ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: isApproved ? 4 : 2,
            marginRight: 16,
          }}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={isFullScreen ? 20 : 18} 
            color={isApproved ? "white" : "#22c55e"} 
          />
          <Text className={`ml-2 font-semibold ${isFullScreen ? 'text-base' : 'text-sm'} ${
            isApproved ? 'text-white' : 'text-green-600'
          }`}>
            Approve
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRejectClick}
          className={`px-4 py-2.5 rounded-full border-2 flex-row items-center ${
            !isApproved 
              ? 'bg-red-500 border-red-500' 
              : 'bg-white border-red-300'
          }`}
          activeOpacity={0.8}
          style={{
            shadowColor: !isApproved ? '#ef4444' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: !isApproved ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: !isApproved ? 4 : 2,
            marginLeft: 16,
          }}
        >
          <Ionicons 
            name="close-circle" 
            size={isFullScreen ? 20 : 18} 
            color={!isApproved ? "white" : "#ef4444"} 
          />
          <Text className={`ml-2 font-semibold ${isFullScreen ? 'text-base' : 'text-sm'} ${
            !isApproved ? 'text-white' : 'text-red-600'
          }`}>
            Reject
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [openRejectionModal]);

  const EnhancedCard = useCallback(({ children, postId }: { children: React.ReactNode, postId: string }) => {
    const animValue = cardAnimations[postId] || new Animated.Value(0);
    
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
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
          }
        ]}
        className="mx-4 mb-6 bg-white rounded-3xl overflow-hidden border border-gray-100"
      >
        {children}
      </Animated.View>
    );
  }, [cardAnimations]);

  // ✅ Helper function to get actual comment counts
  const getCommentsCount = useCallback((postId: string) => {
    return commentsData[postId] || 0;
  }, [commentsData]);

  const renderFlipCardFront = useCallback((item: PostItem) => (
    <View style={{ 
      flex: 1, 
      backgroundColor: 'white', 
      borderRadius: 24, 
      overflow: 'hidden' 
    }}>
      <View className="px-6 py-5 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="relative">
            <View className="w-16 h-16 rounded-full mr-4 overflow-hidden border-2 border-white shadow-lg">
              <Image
                source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-xl">{item.AuthorName}</Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-gray-500 text-base mr-3">{getTimeAgo(item.ContentDate)}</Text>
              {item.postType === 'X-Data' && (
                <View className="bg-blue-100 px-3 py-2 rounded-full">
                  <Text className="text-blue-600 text-sm font-semibold">𝕏 POST</Text>
                </View>
              )}
            </View>
          </View>
          <View className="flex-col items-center">
            <TouchableOpacity 
              className="p-3 rounded-full bg-blue-100 mb-2"
              onPress={handleFlipCard}
              disabled={isFlipping}
              style={{ opacity: isFlipping ? 0.6 : 1 }}
            >
              <Ionicons name="repeat" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <Text className="text-xs text-blue-600 font-medium">Flip</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-gray-800 text-lg leading-8 mb-6 font-normal">{item.ContentDesc}</Text>
          
          {renderMediaContent(item)}

          <View className="flex-row items-center justify-between pt-6  mb-6">
            <TouchableOpacity
                className="flex-row items-center px-5 py-4"
                onPress={() => toggleLike(item)}
                activeOpacity={0.7}
              >
              <Ionicons
                name={item.Liked ? "heart" : "heart-outline"}
                size={24}
                color={item.Liked ? "#ef4444" : "#64748b"}
              />
              <Text className={`ml-3 text-lg font-semibold ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                {item.ContentLikeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-5 py-4"
              onPress={() => {
                closeFullScreenCard();
                openCommentsModal(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-3 text-lg font-semibold">{getCommentsCount(item.id)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-5 py-4 "
              onPress={() => handleRepost(item)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="repeat-outline" 
                size={24} 
                color={item.Reposted ? "#0ea5e9" : "#64748b"} 
              />
              <Text className={`ml-3 text-lg font-semibold ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.ContentRepostCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-4 "
              onPress={() => console.log("Share pressed:", item.id)}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  ), [getTimeAgo, handleFlipCard, isFlipping, renderMediaContent, toggleLike, handleRepost, getCommentsCount, dummyAuthorImage, closeFullScreenCard, openCommentsModal]);

  const renderFlipCardBack = useCallback((item: PostItem) => (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#667eea', 
      borderRadius: 24, 
      overflow: 'hidden'
    }}>
      <View style={{ 
        paddingHorizontal: 24, 
        paddingVertical: 20, 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.2)' 
      }}>
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="font-bold text-white text-xl">Post Analytics</Text>
            <Text className="text-white/80 text-base mt-1">Detailed insights</Text>
          </View>
          <View className="flex-col items-center">
            <TouchableOpacity 
              className="p-3 rounded-full mb-2" 
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              onPress={handleFlipCard}
              disabled={isFlipping}
            >
              <Ionicons name="repeat" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-xs text-white font-medium">Flip</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
          <View style={{ gap: 16 }}>
            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 16, 
              padding: 24 
            }}>
              <Text className="text-white font-bold text-lg mb-4">Engagement</Text>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="heart" size={20} color="#ff6b6b" />
                  <Text className="text-white ml-2">Likes</Text>
                </View>
                <Text className="text-white font-bold text-xl">{item.ContentLikeCount}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="repeat" size={20} color="#4ecdc4" />
                  <Text className="text-white ml-2">Reposts</Text>
                </View>
                <Text className="text-white font-bold text-xl">{item.ContentRepostCount}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="comment" size={20} color="#45b7d1" />
                  <Text className="text-white ml-2">Comments</Text>
                </View>
                <Text className="text-white font-bold text-xl">{getCommentsCount(item.id)}</Text>
              </View>
            </View>

            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 16, 
              padding: 24 
            }}>
              <Text className="text-white font-bold text-lg mb-4">Post Details</Text>
              <View style={{ gap: 12 }}>
                <View>
                  <Text className="text-white/70 text-sm">Post Type</Text>
                  <Text className="text-white font-semibold">{item.postType}</Text>
                </View>
                <View>
                  <Text className="text-white/70 text-sm">Status</Text>
                  <View className="flex-row items-center mt-1">
                    <View 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 6, 
                        marginRight: 8,
                        backgroundColor: item.isApproved ? '#4ade80' : '#f87171'
                      }} 
                    />
                    <Text className="text-white font-semibold">
                      {item.isApproved ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-white/70 text-sm">Published</Text>
                  <Text className="text-white font-semibold">{getTimeAgo(item.ContentDate)}</Text>
                </View>
              </View>
            </View>

            {userRole !== "User" && (
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: 16, 
                padding: 24 
              }}>
                <Text className="text-white font-bold text-lg mb-4">Admin Controls</Text>
                <Text className="text-white/80 text-sm mb-4">
                  Manage post visibility and approval status
                </Text>
                <ApprovalToggle
                  isApproved={item.isApproved}
                  onToggle={(approved) => handleApprovalToggle(item.id, approved)}
                  postId={item.id}
                  isFullScreen={true}
                />
              </View>
            )}

            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 16, 
              padding: 24 
            }}>
              <Text className="text-white font-bold text-lg mb-4">Quick Actions</Text>
              <View className="flex-row justify-between" style={{ gap: 12 }}>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 12, 
                    paddingVertical: 16, 
                    alignItems: 'center' 
                  }}
                  onPress={() => {
                    closeFullScreenCard();
                    openCommentsModal(item);
                  }}
                >
                  <MaterialCommunityIcons name="comment-plus" size={24} color="white" />
                  <Text className="text-white text-sm mt-2 font-medium">Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 12, 
                    paddingVertical: 16, 
                    alignItems: 'center' 
                  }}
                  onPress={() => console.log("Edit pressed:", item.id)}
                >
                  <Ionicons name="create-outline" size={24} color="white" />
                  <Text className="text-white text-sm mt-2 font-medium">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 12, 
                    paddingVertical: 16, 
                    alignItems: 'center' 
                  }}
                  onPress={() => console.log("Archive pressed:", item.id)}
                >
                  <Ionicons name="archive-outline" size={24} color="white" />
                  <Text className="text-white text-sm mt-2 font-medium">Archive</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  ), [handleFlipCard, isFlipping, getTimeAgo, userRole, ApprovalToggle, handleApprovalToggle, getCommentsCount, closeFullScreenCard, openCommentsModal]);

  const renderPostContent = useCallback((item: PostItem) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => openFullScreenCard(item)}
    >
      <EnhancedCard postId={item.uniqueId}>
        <View className="px-6 py-5 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-14 h-14 rounded-full mr-4 overflow-hidden border-2 border-white shadow-lg">
                <Image
                  source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-lg">{item.AuthorName}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500 text-sm mr-3">{getTimeAgo(item.ContentDate)}</Text>
                {item.postType === 'X-Data' && (
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity className="p-3 rounded-full bg-gray-100">
              <Ionicons name="ellipsis-horizontal" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 py-5">
          <Text className="text-gray-800 text-base leading-7 mb-5 font-normal">{item.ContentDesc}</Text>

          {renderMediaContent(item)}

          <View className="flex-row items-center justify-between pt-5">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
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
              <Text className={`ml-2 text-sm font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                {item.ContentLikeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={(e) => {
                e.stopPropagation();
                openCommentsModal(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={20}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-2 text-sm font-medium">{getCommentsCount(item.id)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3 "
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
              <Text className={`ml-2 text-sm font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.ContentRepostCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-3"
              onPress={(e) => {
                e.stopPropagation();
                console.log("Share pressed:", item.id);
              }}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {userRole !== "User" && item.postType === "SentinelPosts" && (
            <TouchableOpacity
              onPress={(e) => e.stopPropagation()}
              activeOpacity={1}
            >
              <View className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <View className="mb-4">
                  <Text className="font-bold text-gray-900 text-lg">Post Status</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {item.isApproved 
                      ? 'This post is approved and visible to users' 
                      : 'This post is rejected and not visible to users'
                    }
                  </Text>
                </View>
                
                <ApprovalToggle
                  isApproved={item.isApproved}
                  onToggle={(approved) => handleApprovalToggle(item.id, approved)}
                  postId={item.id}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </EnhancedCard>
    </TouchableOpacity>
  ), [openFullScreenCard, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, ApprovalToggle, handleApprovalToggle, dummyAuthorImage, userRole, getCommentsCount, openCommentsModal]);

  const renderPostUserContent = useCallback((item: PostItem) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => openFullScreenCard(item)}
    >
      <EnhancedCard postId={item.uniqueId}>
        <View className="px-6 py-5 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-12 h-12 rounded-full mr-3 overflow-hidden border-2 border-white shadow-md">
                <Image
                  source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-base">{item.AuthorName}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500 text-sm mr-3">{getTimeAgo(item.ContentDate)}</Text>
                {item.postType === 'X-Data' && (
                  <View className="bg-blue-100 px-2 py-1 rounded-full">
                    <Text className="text-blue-600 text-xs font-medium">𝕏 POST</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity className="p-2 rounded-full bg-gray-100">
              <Ionicons name="ellipsis-horizontal" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 py-5">
          <Text className="text-gray-800 text-base leading-6 mb-5">{item.ContentDesc}</Text>

          {renderMediaContent(item)}

          <View className="flex-row items-center justify-between pt-4 ">
            <TouchableOpacity
              className="flex-row items-center px-3 py-2"
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
              <Text className={`ml-2 text-sm font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                {item.ContentLikeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-3 py-2 "
              onPress={(e) => {
                e.stopPropagation();
                openCommentsModal(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={20}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-2 text-sm font-medium">{getCommentsCount(item.id)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-3 py-2 "
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
              <Text className={`ml-2 text-sm font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.ContentRepostCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-2 "
              onPress={(e) => {
                e.stopPropagation();
                console.log("Share pressed:", item.id);
              }}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </EnhancedCard>
    </TouchableOpacity>
  ), [openFullScreenCard, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, dummyAuthorImage, getCommentsCount, openCommentsModal]);

  const renderFullScreenFlipCard = useCallback((item: PostItem) => (
    <View className="flex-1 bg-gray-900">
      <View style={{ paddingTop: Platform.OS === 'ios' ? 50 : 30 }} className="px-6 py-4 bg-gray-900/95 border-b border-gray-700">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold text-xl">Post Details</Text>
          <TouchableOpacity 
            className="p-3 rounded-full bg-red-500"
            onPress={closeFullScreenCard}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 justify-center px-4">
        <FlipCard
          ref={flipCardRef}
          style={{ width: screenWidth - 32, height: screenHeight * 0.75 }}
          friction={6}
          perspective={1000}
          flipHorizontal={true}
          flipVertical={false}
          flip={isFlipped}
          clickable={false}
        >
          {renderFlipCardFront(item)}
          {renderFlipCardBack(item)}
        </FlipCard>

        <View className="mt-6 bg-black/50 rounded-2xl p-4">
          <Text className="text-white text-center text-sm opacity-80">
            Use the flip button to see more details
          </Text>
        </View>
      </View>
    </View>
  ), [closeFullScreenCard, isFlipped, renderFlipCardFront, renderFlipCardBack]);

  const filteredData = useMemo(() => {
    return fetchedData.filter(item => {
      if (userRole === "User") {
        return item.isApproved;
      }
      return true;
    });
  }, [fetchedData, userRole]);

  const listItems = useMemo(() => {
    return filteredData.map((item) => {
      initializeCardAnimation(item.uniqueId);
      
      if (userRole === "User") {
        return (
          <React.Fragment key={item.uniqueId}>
            {renderPostUserContent(item)}
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment key={item.uniqueId}>
            {renderPostContent(item)}
          </React.Fragment>
        );
      }
    });
  }, [filteredData, userRole, initializeCardAnimation, renderPostUserContent, renderPostContent]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View className="bg-white border-b border-gray-200 pt-5">
        <View 
          className="px-6 py-4 flex-row items-center justify-between"
          style={{ paddingTop: Platform.OS === 'ios' ? 20 : 20 }}
        >
          <View>
            <Text className="text-3xl font-bold text-gray-900">Sentinel</Text>
            <Text className="text-gray-500 text-sm mt-1">Your social feed</Text>
          </View>
          <TouchableOpacity className="p-3 rounded-full bg-gray-100 shadow-sm">
            <Image
              source={require("../../assets/images/Union.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 20, 
          paddingBottom: 30,
        }}
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
            <View className="bg-white p-8 rounded-2xl shadow-lg">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-600 mt-4 text-base font-medium text-center">Loading posts...</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">This won't take long</Text>
            </View>
          </View>
        ) : listItems.length > 0 ? (
          listItems
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="document-outline" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-700 text-xl font-bold mb-2">No posts yet</Text>
              <Text className="text-gray-500 text-center text-base px-4 leading-6">
                Be the first to share something amazing with the community!
              </Text>
            </View>
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

      {/* VIDEO MODAL */}
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
              <Video
                source={{ uri: fullScreenVideo }}
                style={{ width: screenWidth, height: screenHeight - 100 }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
                isLooping={false}
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

      {/* CARD MODAL */}
      <Modal
        visible={isCardModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={closeFullScreenCard}
        statusBarTranslucent
      >
        {fullScreenCard && renderFullScreenFlipCard(fullScreenCard)}
      </Modal>

      {/* ENHANCED REJECTION REASON MODAL */}
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
            {/* Header */}
            <View className="bg-red-50 px-6 py-5 border-b border-red-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="close-circle" size={28} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900 text-xl">Reject Post</Text>
                    <Text className="text-red-600 text-sm mt-1">Select rejection reasons</Text>
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

            {/* Content */}
            <ScrollView style={{ maxHeight: screenHeight * 0.6 }} showsVerticalScrollIndicator={false}>
              <View className="px-6 py-6">
                <Text className="text-gray-700 text-base mb-6 leading-6">
                  Please select one or more reasons why this post is being rejected. This will help the user understand our community guidelines.
                </Text>

                {/* Enhanced Checkbox Options */}
                <View style={{ gap: 12 }}>
                  {rejectionReasons.map((reason, index) => {
                    const isSelected = selectedRejectionReasons.includes(reason);
                    return (
                      <TouchableOpacity
                        key={index}
                        className={`flex-row items-center py-4 px-5 rounded-2xl border-2 ${
                          isSelected 
                            ? 'bg-red-50 border-red-300' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onPress={() => toggleRejectionReason(reason)}
                        activeOpacity={0.7}
                        style={{
                          shadowColor: isSelected ? '#ef4444' : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSelected ? 0.1 : 0,
                          shadowRadius: 4,
                          elevation: isSelected ? 2 : 0,
                        }}
                      >
                        {/* Enhanced Checkbox */}
                        <View 
                          className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-4 ${
                            isSelected 
                              ? 'bg-red-500 border-red-500' 
                              : 'bg-white border-gray-300'
                          }`}
                          style={{
                            shadowColor: isSelected ? '#ef4444' : 'transparent',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 2,
                            elevation: isSelected ? 1 : 0,
                          }}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>
                        
                        {/* Enhanced Text */}
                        <Text 
                          className={`flex-1 text-base leading-6 font-medium ${
                            isSelected ? 'text-red-700' : 'text-gray-700'
                          }`}
                        >
                          {reason}
                        </Text>
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <View className="ml-2">
                            <Ionicons name="checkmark-circle" size={20} color="#ef4444" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selection Summary */}
                {selectedRejectionReasons.length > 0 && (
                  <View className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-200">
                    <Text className="text-red-700 font-semibold text-sm">
                      {selectedRejectionReasons.length} reason{selectedRejectionReasons.length > 1 ? 's' : ''} selected
                    </Text>
                    <Text className="text-red-600 text-xs mt-1">
                      The user will receive notification about these specific issues
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
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
                        ? 'bg-red-500' 
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

      {/* COMMENTS MODAL */}
      <CommentsModal
        visible={isCommentModalVisible}
        onClose={closeCommentsModal}
        postId={selectedPostId}
        postType={selectedPostType}
        postData={fetchedData.find(item => item.id === selectedPostId)}
      />

      {/* CUSTOM ALERT MODAL */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />
    </SafeAreaView>
  );
}
