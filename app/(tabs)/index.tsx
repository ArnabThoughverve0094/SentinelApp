import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import { arrayRemove, arrayUnion, collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Share, StyleSheet, useWindowDimensions } from "react-native";
import { Dropdown } from 'react-native-element-dropdown';

import { ResizeMode, Video } from 'expo-av';
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
  TouchableOpacity,
  View
} from 'react-native';
import FlipCard from 'react-native-flip-card';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentsModal from '../../components/CommentsModal';
import { LoadingComponent } from '../../components/LoadingComponent';
import TotalSentiment from '../../components/TotalSentiment';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Option {
  icon: string;
  title: string;
  // you may have other fields, e.g. id, description, etc.
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
                    : 'bg-black'
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
  const { width } = useWindowDimensions(); // Get screen width
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
  const videoRefs = useRef<{ [key: string]: any }>({});
  const flipCardRef = useRef<any>(null);

  // ------- COMMENT MODAL STATE -------
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedCommentTemplate, setSelectedCommentTemplate] = useState<string | null>(null);
  const [fetchedCommentTemplate, setFetchedCommentTemplate] = useState<Template[]>([]);

    // ------- GRAPH MODAL STATE -------
    const [isGraphModalVisible, setIsGraphModalVisible] = useState(false);
    const [selectedGraphPostId, setSelectedGraphPostId] = useState<string | null>(null);
    const [selectedGraphPostType, setSelectedGraphPostType] = useState<string | null>(null);
    const [userExistingComment, setUserExistingComment] = useState<Comment | null>(null);

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

  // Helper function to check if interaction buttons should be disabled
  const areInteractionsDisabled = useCallback((item: PostItem) => {
    return !item.isApproved && !item.isNew;
  }, []);

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

  // OPTIMIZED DATA FETCHING
  const handleFetchAllData = useCallback(async (forceRefresh: boolean = false) => {
    const currentTime = Date.now();
    const cacheValidTime = 5 * 60 * 1000;
    
    let fetchuserID = userId;
    if(fetchuserID == ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
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
            Reposted: false,
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

          try {
            console.log("Liked By List: ", postData.LikedBy);
            console.log("UserID: ", fetchuserID);
            console.log("Liked By: ", (postData.LikedBy?.includes(fetchuserID) || false));
          } catch (error) {
            console.log(error);
          }

          postsData.push({
            uniqueId: `sentinel-${postId}`,
            id: postId,
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
            isNew: postData.isNew !== undefined ? postData.isNew : true,
            postType: "SentinelPosts",
            Liked: (postData.LikedBy?.includes(fetchuserID) || false),
            Reposted: false,
            Bookmarked: (postData.BookmarkedBy?.includes(fetchuserID) || false),
            createdAt: postData.createdAt || postData.ContentDate,
            CommentTemplate: postData.CommentTemplate || "Template1",
          });
        }

        const allData = postsData.concat(postsXData);
        setFetchedData(allData);
        console.log('OnSnapshot Fetched and Sorted', `Total: ${allData.length} documents`);

        allData.forEach(post => {
          //Fetching Comment and Reply Count
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
  }, [isInitialized, fetchedData.length, lastFetchTime]);

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

            // Convert map to array:
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

  // TO OPEN COMMENTS MODAL
  const openCommentsModal = useCallback((item: PostItem) => {
    // Check if interactions are disabled for rejected posts
    if (areInteractionsDisabled(item)) {
      showCustomAlert(
        'warning',
        'Post Not Available',
        'This post has been rejected and interactions are disabled.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setSelectedCommentTemplate(item.CommentTemplate);
    setIsCommentModalVisible(true);
  }, [areInteractionsDisabled, showCustomAlert, hideModal]);

  // TO CLOSE COMMENTS MODAL
  const closeCommentsModal = useCallback(() => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
    setSelectedPostType(null);
    setSelectedCommentTemplate(null);
  }, []);

  // TO OPEN GRAPH MODAL
  const openGraphModal = useCallback((item: PostItem) => {
    // Check if interactions are disabled for rejected posts
    if (areInteractionsDisabled(item)) {
      showCustomAlert(
        'warning',
        'Post Not Available',
        'This post has been rejected and interactions are disabled.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
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
  }, [areInteractionsDisabled, showCustomAlert, hideModal]);

  // TO CLOSE GRAPH MODAL
  const closeGraphModal = useCallback(() => {
    setIsGraphModalVisible(false);
    setSelectedGraphPostId(null);
    setSelectedGraphPostType(null);
  }, []);

  const addResponseGraphModal = useCallback(() => {
    setIsGraphModalVisible(false);
    setIsCommentModalVisible(true);
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
      await handleApprovalToggle(rejectionPostId, false, false);
      
      await updateDoc(doc(db, 'SentinelPosts', rejectionPostId), {
        isApproved: false,
        isNew: false,
        rejectionReasons: selectedRejectionReasons,
        rejectedAt: new Date()
      });

      closeRejectionModal();
      
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

  // ENHANCED APPROVAL TOGGLE FUNCTION
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
    } catch (error) {
      console.error("Error updating post status:", error);
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
    // Check if interactions are disabled for rejected posts
    if (areInteractionsDisabled(postItem)) {
      showCustomAlert(
        'warning',
        'Action Not Available',
        'This post has been rejected and interactions are disabled.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    let fetchuserID = userId;
    if(fetchuserID == ""){
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
  }, [fullScreenCard, areInteractionsDisabled, showCustomAlert, hideModal]);

  const handleRepost = useCallback(async (postItem: PostItem) => {
    // Check if interactions are disabled for rejected posts
    if (areInteractionsDisabled(postItem)) {
      showCustomAlert(
        'warning',
        'Action Not Available',
        'This post has been rejected and interactions are disabled.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

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
  }, [fullScreenCard, areInteractionsDisabled, showCustomAlert, hideModal]);

  const handleBookmark = useCallback(async (postItem: PostItem) => {
    // Check if interactions are disabled for rejected posts
    if (areInteractionsDisabled(postItem)) {
      showCustomAlert(
        'warning',
        'Action Not Available',
        'This post has been rejected and interactions are disabled.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    console.log("Bookmark pressed:", postItem.id);
    
    let fetchuserID = userId;
    if(fetchuserID == ""){
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
    } else {
      console.log("itemID: ", postItem.id);
      console.log("item Bookmarked: ", postItem.Bookmarked);
      await updateDoc(postRef, {
        BookmarkedBy: arrayUnion(fetchuserID),
      });
    }

    if (fullScreenCard && fullScreenCard.uniqueId === postItem.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Bookmarked: !prev.Bookmarked
      }) : null);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard, areInteractionsDisabled, showCustomAlert, hideModal]);

  const handleShare = useCallback(async (postItem: PostItem) => {
    console.log("Share pressed:", postItem.id);
    
    // first check if sharing is available
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      alert("Sharing is not available on this device");
      return;
    }

    try {
      // no image, just share text / link
      // you might use React Native's Share API
      
      await Share.share({
        message: `SENTINEL POST\n\nShared by ${postItem.AuthorName}\n${postItem.ContentDesc}\n${postItem.ContentURL}\n\nPlease take a look.`,
    });
      
    } catch (error) {
      console.log("Error sharing ", error);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard]);

  const handleDropdownChange = async (item: {name: string }, postItem: PostItem) => {
    setSelectedCommentTemplate(item.name);
    console.log('Selected option:', item.name);
    // Add any additional logic you want to execute on change
    const postRef = doc(db, postItem.postType, postItem.id);
    await updateDoc(postRef, {
      CommentTemplate: item.name,
    });
  };

  // OPTIMIZED MEDIA CONTENT - REDUCED SIZES
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
            <View className="relative rounded-xl overflow-hidden bg-black">
              <Video
                ref={(ref) => {
                  if (ref && index !== undefined) {
                    videoRefs.current[`video-${index}`] = ref;
                  }
                }}
                source={{ uri: primaryMediaUrl }}
                style={{ width: '100%', height: 200 }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={false}
                shouldPlay={currentVideoIndex === index}
                isMuted={true}
                isLooping={true}
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
  }, [getMediaType, openFullScreenImage, openFullScreenVideo, openFullScreenDoc, currentVideoIndex]);

  // OPTIMIZED REFRESH
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered');
    await handleFetchAllData(true);
    setRefreshing(false);
  }, [handleFetchAllData]);

  // Filtered data for posts
  const filteredData = useMemo(() => {
    return fetchedData.filter(item => {
      if (userRole === "User") {
        return item.isApproved && !item.isNew;
      }
      return true;
    });
  }, [fetchedData, userRole]);

  // AUTO PLAY VIDEO ON SCROLL
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

  // COMPACT APPROVAL TOGGLE COMPONENT
  const ApprovalToggle = useCallback(({ isApproved, isNew, onToggle, postId, isFullScreen = false }: { 
    isApproved: boolean; 
    isNew: boolean;
    onToggle: (approved: boolean, isNew: boolean) => void;
    postId: string;
    isFullScreen?: boolean;
  }) => {
    const handleNewClick = () => {
      onToggle(false, true);
    };

    const handleApproveClick = () => {
      onToggle(true, false);
    };

    const handleRejectClick = () => {
      openRejectionModal(postId);
    };

    return (
      <View className="flex-row items-center justify-center" style={{ gap: isFullScreen ? 8 : 4 }}>
        {/* Approve Button - Compact */}
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

        {/* Reject Button - Compact */}
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
  }, [cardAnimations]);

  // Helper function to get post status text and color
  const getPostStatus = useCallback((item: PostItem) => {
    if (item.isNew) {
      return { text: 'New', color: '#f97316', bgColor: 'bg-orange-100' };
    } else if (item.isApproved) {
      return { text: 'Approved', color: '#22c55e', bgColor: 'bg-green-100' };
    } else {
      return { text: 'Rejected', color: '#ef4444', bgColor: 'bg-red-100' };
    }
  }, []);

  const renderFlipCardFront = useCallback((item: PostItem) => (
    <View style={{ 
      flex: 1, 
      backgroundColor: 'white', 
      borderRadius: 24, 
      overflow: 'hidden' 
    }}>
      <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="relative">
            <View className="w-10 h-10 rounded-full mr-2.5 overflow-hidden border-2 border-white shadow-lg">
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
                <View className="bg-blue-100 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                </View>
              )}
              {item.postType === 'SentinelPosts' && (
                <View className={`px-2 py-0.5 rounded-full ${getPostStatus(item).bgColor}`}>
                  <Text className="text-xs font-semibold" style={{ color: getPostStatus(item).color }}>
                    {getPostStatus(item).text}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="flex-col items-center">
            <TouchableOpacity 
              className="p-1.5 rounded-full bg-blue-100 mb-1"
              onPress={handleFlipCard}
              disabled={isFlipping}
              style={{ opacity: isFlipping ? 0.6 : 1 }}
            >
              <Ionicons name="repeat" size={14} color="#3b82f6" />
            </TouchableOpacity>
            <Text className="text-xs text-blue-600 font-medium">Flip</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-3">
          <Text className="text-gray-800 text-sm leading-5 mb-3 font-normal">{item.ContentDesc}</Text>
          
          {renderMediaContent(item)}

          <View className="flex-row items-center justify-between pt-3 mb-3">
            <TouchableOpacity
                className={`flex-row items-center px-2 py-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                onPress={() => toggleLike(item)}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
              >
              <Ionicons
                name={item.Liked ? "heart" : "heart-outline"}
                size={18}
                color={item.Liked ? "#ef4444" : "#64748b"}
              />
              <Text className={`ml-2 text-sm font-semibold ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                {item.ContentLikeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-2 py-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={() => {
                closeFullScreenCard();
                openCommentsModal(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={18}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-2 text-sm font-semibold">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-2 py-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={() => handleRepost(item)}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons 
                name="repeat-outline" 
                size={18} 
                color={item.Reposted ? "#0ea5e9" : "#64748b"} 
              />
              <Text className={`ml-2 text-sm font-semibold ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.ContentRepostCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`p-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={() => {
                closeFullScreenCard();
                openGraphModal(item);
              }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Feather name="bar-chart-2" size={16} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center px-2 py-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={() => handleBookmark(item)}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons 
                name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                size={18} 
                color={item.Bookmarked ? "#000000" : "#64748b"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`p-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={() => handleShare(item)}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Feather name="share-2" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  ), [getTimeAgo, handleFlipCard, isFlipping, renderMediaContent, toggleLike, handleRepost, handleBookmark, dummyAuthorImage, closeFullScreenCard, openCommentsModal, getPostStatus, areInteractionsDisabled, openGraphModal]);

  const renderFlipCardBack = useCallback((item: PostItem) => (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#667eea', 
      borderRadius: 24, 
      overflow: 'hidden'
    }}>
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.2)' 
      }}>
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="font-bold text-white text-base">Post Analytics</Text>
            <Text className="text-white/80 text-sm mt-0.5">Detailed insights</Text>
          </View>
          <View className="flex-col items-center">
            <TouchableOpacity 
              className="p-1.5 rounded-full mb-1" 
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              onPress={handleFlipCard}
              disabled={isFlipping}
            >
              <Ionicons name="repeat" size={14} color="white" />
            </TouchableOpacity>
            <Text className="text-xs text-white font-medium">Flip</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View style={{ gap: 12 }}>
            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 14, 
              padding: 16 
            }}>
              <Text className="text-white font-bold text-sm mb-3">Engagement</Text>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="heart" size={16} color="#ff6b6b" />
                  <Text className="text-white ml-2 text-sm">Likes</Text>
                </View>
                <Text className="text-white font-bold text-base">{item.ContentLikeCount}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="repeat" size={16} color="#4ecdc4" />
                  <Text className="text-white ml-2 text-sm">Reposts</Text>
                </View>
                <Text className="text-white font-bold text-base">{item.ContentRepostCount}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="comment" size={16} color="#45b7d1" />
                  <Text className="text-white ml-2 text-sm">Comments</Text>
                </View>
                <Text className="text-white font-bold text-base">{item.ContentCommentCount}</Text>
              </View>
            </View>

            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 14, 
              padding: 16 
            }}>
              <Text className="text-white font-bold text-sm mb-3">Post Details</Text>
              <View style={{ gap: 8 }}>
                <View>
                  <Text className="text-white/70 text-xs">Post Type</Text>
                  <Text className="text-white font-semibold text-sm">{item.postType}</Text>
                </View>
                <View>
                  <Text className="text-white/70 text-xs">Status</Text>
                  <View className="flex-row items-center mt-1">
                    <View 
                      style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: 3, 
                        marginRight: 6,
                        backgroundColor: getPostStatus(item).color
                      }} 
                    />
                    <Text className="text-white font-semibold text-sm">
                      {getPostStatus(item).text}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-white/70 text-xs">Published</Text>
                  <Text className="text-white font-semibold text-sm">{getTimeAgo(item.ContentDate)}</Text>
                </View>
              </View>
            </View>

            {userRole !== "User" && item.postType === "SentinelPosts" && (
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: 14, 
                padding: 16 
              }}>
                <Text className="text-white font-bold text-sm mb-3">Admin Controls</Text>
                <Text className="text-white/80 text-xs mb-3">
                  Manage post visibility and approval status
                </Text>
                <ApprovalToggle
                  isApproved={item.isApproved}
                  isNew={item.isNew}
                  onToggle={(approved, isNew) => handleApprovalToggle(item.id, approved, isNew)}
                  postId={item.id}
                  isFullScreen={true}
                />
              </View>
            )}

            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 14, 
              padding: 16 
            }}>
              <Text className="text-white font-bold text-sm mb-3">Quick Actions</Text>
              <View className="flex-row justify-between" style={{ gap: 8 }}>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 8, 
                    paddingVertical: 10, 
                    alignItems: 'center',
                    opacity: areInteractionsDisabled(item) ? 0.5 : 1
                  }}
                  onPress={() => {
                    closeFullScreenCard();
                    openCommentsModal(item);
                  }}
                  disabled={areInteractionsDisabled(item)}
                >
                  <MaterialCommunityIcons name="comment-plus" size={18} color="white" />
                  <Text className="text-white text-xs mt-1 font-medium">Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 8, 
                    paddingVertical: 10, 
                    alignItems: 'center',
                    opacity: areInteractionsDisabled(item) ? 0.5 : 1
                  }}
                  onPress={() => console.log("Edit pressed:", item.id)}
                  disabled={areInteractionsDisabled(item)}
                >
                  <Ionicons name="create-outline" size={18} color="white" />
                  <Text className="text-white text-xs mt-1 font-medium">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 8, 
                    paddingVertical: 10, 
                    alignItems: 'center',
                    opacity: areInteractionsDisabled(item) ? 0.5 : 1
                  }}
                  onPress={() => handleShare(item)}
                  disabled={areInteractionsDisabled(item)}
                >
                  <Ionicons name="share-outline" size={18} color="white" />
                  <Text className="text-white text-xs mt-1 font-medium">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  ), [handleFlipCard, isFlipping, getTimeAgo, userRole, ApprovalToggle, handleApprovalToggle, closeFullScreenCard, openCommentsModal, getPostStatus, areInteractionsDisabled]);

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

          {renderMediaContent(item, index)}

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
                name="comment-outline"
                size={14}
                color="#64748b"
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
                    <Text style={styles.label}>Comment Template:</Text>
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
  ), [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, ApprovalToggle, handleApprovalToggle, dummyAuthorImage, userRole, openCommentsModal, getPostStatus, areInteractionsDisabled, openGraphModal]);

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
          <Text className="text-gray-800 text-sm leading-5 mb-2">{item.ContentDesc}</Text>

          {renderMediaContent(item, index)}

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
                name="comment-outline"
                size={14}
                color="#64748b"
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
  ), [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, dummyAuthorImage, openCommentsModal, areInteractionsDisabled, openGraphModal]);

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
      </View>
    </View>
  ), [closeFullScreenCard, isFlipped, renderFlipCardFront, renderFlipCardBack]);

  const listItems = useMemo(() => {
    return filteredData.map((item, index) => {
      initializeCardAnimation(item.uniqueId);
      
      if (userRole === "User") {
        return (
          <React.Fragment key={item.uniqueId}>
            {renderPostUserContent(item, index)}
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment key={item.uniqueId}>
            {renderPostContent(item, index)}
          </React.Fragment>
        );
      }
    });
  }, [filteredData, userRole, initializeCardAnimation, renderPostUserContent, renderPostContent]);

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
              onPress={() =>router.push('/search')} // Navigate to search page
            >
              <MaterialCommunityIcons 
                name="magnify" 
                size={30} 
                color="#374151" 
              />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
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
        ) : listItems.length > 0 ? (
          listItems
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
                        {/* Enhanced Checkbox */}
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
                        
                        {/* Enhanced Text */}
                        <Text 
                          className={`flex-1 text-base leading-6 font-medium ${
                            isSelected ? 'text-black' : 'text-gray-700'
                          }`}
                        >
                          {reason}
                        </Text>
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <View className="ml-2">
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selection Summary */}
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

      {/* COMMENTS MODAL */}
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