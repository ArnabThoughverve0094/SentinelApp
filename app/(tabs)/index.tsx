import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import { VideoView, useVideoPlayer } from 'expo-video';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView, Share, StatusBar, StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View, useWindowDimensions
} from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
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
  isAnonymous: boolean;
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
            Published Posts
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
            Educational
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
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

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

  let AuthorName = "";
  let AuthorImage = "";
  if (post.isAnonymous) {
    AuthorName = "Anonymous";
    AuthorImage = dummyAuthorImage;
  } else {
    AuthorName = post.AuthorName;
    AuthorImage = post.AuthorImageURL;
  }

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
                  // source={{ uri: post.AuthorImageURL }}
                  source={{uri: AuthorImage || dummyAuthorImage}}
                  className="w-8 h-8 rounded-full mr-2"
                  resizeMode="cover"
                  resizeMethod="resize"
                />
                <Text className="font-semibold text-gray-900 text-sm">{AuthorName}</Text>
              </View>
              <Text className="text-gray-700 text-sm" numberOfLines={2}>
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

// Custom Modal Component with better UI
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
          className="bg-white rounded-3xl p-6 items-center w-full max-w-sm shadow-2xl"
        >
          {/* Icon */}
          <View className={`w-16 h-16 ${modalStyle.iconBg} rounded-full items-center justify-center mb-4`}>
            <Ionicons name={modalStyle.iconName} size={32} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
            {message}
          </Text>

          {/* Better Button Layout */}
          <View className="w-full space-y-3">
            {/* For image picker modal, show vertical button layout */}
            {title === 'Update Profile Picture' ? (
              <>
                {/* Camera Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-black py-4 px-6 rounded-xl shadow-sm mb-5"
                  onPress={buttons.find(b => b.text === 'Camera')?.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold text-base">Take Photo</Text>
                </TouchableOpacity>

                {/* Gallery Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-black py-4 px-6 rounded-xl shadow-sm mb-5"
                  onPress={buttons.find(b => b.text === 'Gallery')?.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold text-base">Choose from Gallery</Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-gray-200 py-4 px-6 rounded-xl"
                  onPress={buttons.find(b => b.text === 'Cancel')?.onPress}
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Default button layout for other modals */
              buttons.length === 1 ? (
                <TouchableOpacity
                  className={`py-4 px-8 rounded-xl items-center w-full shadow-lg ${
                    buttons[0].style === 'cancel' 
                      ? 'bg-gray-200' 
                      : buttons[0].style === 'destructive'
                      ? 'bg-red-500'
                      : 'bg-black'
                  }`}
                  onPress={buttons[0].onPress}
                  activeOpacity={0.8}
                >
                  <Text className={`text-lg font-semibold ${
                    buttons[0].style === 'cancel' 
                      ? 'text-gray-700' 
                      : 'text-white'
                  }`}>
                    {buttons[0].text}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row" style={{ gap: 12 }}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`flex-1 py-4 px-6 rounded-xl items-center shadow-lg ${
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
              )
            )}
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
  const [notificationDetails, setNotificationDetails] = useState<any[]>([]);
  const [postUserDocId, setPostUserDocId] = useState('');
  const [postUserIdNotify, setPostUserIdNotify] = useState('');
  const [postUserDeviceToken, setPostUserDeviceToken] = useState('');

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

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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
        
        // const sentinelUsersRef = collection(db, 'SentinelUsers');
        // const q = query(sentinelUsersRef, where('userID', '==', fetchuserID));
        
        // const unsubscribe = onSnapshot(q, (snapshot) => {
        //   if (!snapshot.empty) {
        //     const userDoc = snapshot.docs[0];
        //     const userData = userDoc.data();
        //     setCurrentUserDocId(userDoc.id);
        //     const following = userData.Following || [];
        //     setFollowingUserIds(following);
        //     console.log('✅ Following list updated:', following);
        //     const notification = userData.Notification || [];
        //     setNotificationDetails(notification);
        //     console.log('✅ Notification list updated:', notification);
        //   } else {
        //     console.log('📱 No user document found');
        //     setFollowingUserIds([]);
        //     setCurrentUserDocId('');
        //   }
        // });

        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(sentinelUsersRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const snapshotDataArr = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          }))

          const notificationlist = [];

          for (const doc of snapshotDataArr) {
            const postData = doc.data;
            const postId = doc.id;

            if (postData.userID == fetchuserID) {
              setCurrentUserDocId(postId);
                
              const following = postData.Following || [];
              setFollowingUserIds(following);
              console.log('✅ Following list updated:', following);
            }

            notificationlist.push({
              docID: postId,
              userID: postData.userID,
            })
          }

          console.log('✅ Notification list updated:', notificationlist);
          setNotificationDetails(notificationlist);
          
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
            CommentTemplate: postData.CommentTemplate || "Sentinel Default Template",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: false,
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
            CommentTemplate: postData.CommentTemplate || "Sentinel Default Template",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: postData.isAnonymous || false,
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
      // const collCommentTempPost = collection(db, 'SentimentTemplates');
      const collCommentTempPost = collection(db, 'templates');
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

            const result: Array<{ index: string; id: string; icon: string; label: string; color: string }> = [];
            
            optionsField.map((nestedOption, index) => {
              // Get the key (e.g., "option1") and the value (the {icon, title} map)
              const optionKey = Object.keys(nestedOption)[0];
              const optionDetails = nestedOption[optionKey];

              result.push({
                index: optionKey,
                id: typeof optionDetails.title === "string" ? optionDetails.title : "",
                icon: typeof optionDetails.icon === "string" ? optionDetails.icon : "",
                label: typeof optionDetails.title === "string" ? optionDetails.title : "",
                color: '#34C759'
              })
            })

            // for (const key in optionsField) {
            //   if (Object.prototype.hasOwnProperty.call(optionsField, key)) {
            //     const maybeOption = (optionsField as any)[key];
            //     if (maybeOption && typeof maybeOption === "object") {
            //       const icon = (maybeOption as any).icon;
            //       const title = (maybeOption as any).title;
            //       result.push({
            //         key,
            //         icon: typeof icon === "string" ? icon : "",
            //         title: typeof title === "string" ? title : "",
            //       });
            //     }
            //   }
            // }
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

  const fetchUpdate = useCallback(async () => {
    try {
      const collSentinelUpdate = collection(db, 'SentinelUpdate');
      console.log("Sentinel Update Called");

      // 1. Fetch the user-facing version name (e.g., "1.0.0")
      const currentVersion = Application.nativeApplicationVersion ?? '1.0.0';
      console.log("Sentinel Current version: ", currentVersion);

      const unsubscribeSentinelUpdate = onSnapshot(collSentinelUpdate, updateSnapshot => {
        const updateDataArr = updateSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        for (const doc of updateDataArr) {
          const updateData = doc.data;
          const updateId = doc.id;
          console.log("Update ID: ", updateId);
          console.log("Sentinel Updated version: ", updateData.version);

          if(updateData.forceLogout || false){
            console.log("Force Logout: true");
            if(currentVersion != updateData.version) {
              confirmForceLogout();
            }
          } else {
            if(updateData.logout || false){
              console.log("Logout: true");
              if(currentVersion != updateData.version) {
                confirmLogout();
              }
            } else{
              console.log("Logout: false");
              console.log("Force Logout: false");
            }
          }
          
        }

      })

      return () => {
        unsubscribeSentinelUpdate();
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
      fetchUpdate();
    }, [isInitialized, fetchSinglePostComments])
  );

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

  // Modal states
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

  const confirmLogout = () => {
    showCustomAlert(
      'warning',
      'Update Required',
      "We've released an important update to improve your experience and security. To ensure you get the latest features and fixes, please log out and log back in. Would you like to log out now?",
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: hideModal
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            hideModal();
            handleLogout();
          }
        }
      ]
    );
  };

  const confirmForceLogout = () => {
    showCustomAlert(
      'warning',
      'Critical Update Required',
      "A critical update is now available. To apply essential security and feature improvements, your current session must end. Please tap logout and then log back in immediately to continue using the app.",
      [
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            hideModal();
            handleLogout();
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 Logging out user...');
      
      await AsyncStorage.multiRemove([
        'userToken',
        'accessToken',
        'userRefreshToken', 
        'refreshToken',
        'userIdToken',
        'idToken',
        'userEmail',
        'userName',
        'userNickName',
        'userId',
        'userRole',
        'tokenExpiry',
        'userData',
        'profilePicUrl',
      ]);
      console.log('✅ User data cleared');

      showCustomAlert(
        'success',
        'Logout Successful',
        'You have been logged out successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              hideModal();
              router.replace('/(auth)');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      showCustomAlert(
        'error',
        'Logout Failed',
        'Failed to logout. Please try again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
    }
  };

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
        position: 'bottom',
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
        position: 'bottom',
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
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      await handleApprovalToggle(rejectionPostId, false, false, "");
      
      closeRejectionModal();

      await updateDoc(doc(db, 'SentinelPosts', rejectionPostId), {
        isApproved: false,
        isNew: false,
        rejectionReasons: selectedRejectionReasons,
        rejectedAt: new Date()
      });
      
      Toast.show({
        type: 'success',
        text1: 'Post Rejected',
        text2: `Post has been rejected successfully with ${selectedRejectionReasons.length} reason(s).`,
        position: 'bottom',
        visibilityTime: 3000,
      });

      // Create Notification
      if (postUserDocId) {
        const userRef = doc(db, "SentinelUsers", postUserDocId);
        await updateDoc(userRef, {
          Notification: arrayUnion({
            AuthorImageURL: "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
            AuthorName: 'Admin',
            AuthorUserID: await AsyncStorage.getItem('userId'),
            ContentDate: new Date(),
            NotifyType: 'post_rejected',
            ShowButtons: false,
            Status: 'rejected',
            Description: 'Post has been rejected with '+ selectedRejectionReasons.length + ' reason(s).',
            isRead: false,
          }),
        });
        console.log(`✅ Rejected post`);
      } else {
        // Create new document if it doesn't exist
        await addDoc(collection(db, 'SentinelUsers'), {
          userID: postUserIdNotify,
          Notification: [{
            AuthorImageURL: "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
            AuthorName: 'Admin',
            AuthorUserID: await AsyncStorage.getItem('userId'),
            ContentDate: new Date(),
            NotifyType: 'post_rejected',
            ShowButtons: false,
            Status: 'rejected',
            Description: 'Post has been rejected with '+ selectedRejectionReasons.length + ' reason(s).',
            isRead: false,
          }],
        });
        console.log(`✅ Created new user document and notification`);
      }

      // Create a new Expo client instance
      // let expo = new Expo();

      // // Assume this token was retrieved from your database
      // let targetToken = postUserDeviceToken; 

      // // Check that the push token is valid
      // if (!Expo.isExpoPushToken(targetToken)) {
      //   console.error(`Push token ${targetToken} is not a valid Expo push token`);
      // }

      // // Construct the notification message
      // let messages = [{
      //   to: targetToken,
      //   sound: 'default',
      //   title: 'Post Rejected',
      //   body: 'Post has been rejected successfully with '+ selectedRejectionReasons.length + ' reason(s).',
      //   data: { withSome: 'data' }, // Data for your app to handle when the user taps
      // }];

      // // Send the message
      // try {
      //   let ticket = await expo.sendPushNotificationsAsync(messages);
      //   console.log("Push notification sent, ticket:", ticket);

      //   // You should save the 'ticket' ID to check the receipt later for errors.
      // } catch (error) {
      // console.error(error);
      // }
      
    } catch (error) {
      console.error('Error rejecting post:', error);
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: 'Failed to reject post. Please try again.',
        position: 'bottom',
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

  //Post options
  const handleThreeDotsPress = (item: PostItem, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedPostId(item.id);
    setMenuPosition({ x: pageX - 120, y: pageY + 10 });
    setShowMenuModal(true);
  };

  const handleDeletePost = async (postId: string) => {
     Alert.alert(
      "Delete Post",
      "Are you sure you want to delete your post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const postRef = doc(db, "SentinelPosts", postId);
              await deleteDoc(postRef);
              console.log('Comment deleted successfully');
              
              setShowMenuModal(false);
              setSelectedPostId(null);
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert("Error", "Failed to delete response. Please try again.");
            }
          }
        }
      ]
    );
  };

  // APPROVAL TOGGLE WITH TOAST
  const handleApprovalToggle = useCallback(async (postId: string, newApprovedStatus: boolean, newIsNew: boolean = false, postUserID: string) => {
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
      
      let postDocID = '';
      for (const docUserID of notificationDetails){
        console.log('PostAuthorUserID: ', postUserID);
        console.log('doc PostAuthorUserID: ', docUserID.userID);
        if (docUserID.userID == postUserID) {
          postDocID = docUserID.docID;
          setPostUserDocId(docUserID.docID);
          setPostUserIdNotify(postUserID);
          // setPostUserDeviceToken(doc.docDeviceToken);
        }
      }

      // Show toast for approval
      if (newApprovedStatus && !newIsNew) {
        Toast.show({
          type: 'success',
          text1: 'Post Approved',
          text2: 'Post has been approved and is now visible to users!',
          position: 'bottom',
          visibilityTime: 3000,
        });

        let tempFound=false;
        // for (const docNoti of notificationDetails){
          // if (docNoti.userID == postUserID) {
          if (postDocID != '') {
            tempFound = true;
            setPostUserDocId(postDocID);
            setPostUserIdNotify(postUserID);

            //Create Notification
            const userRef = doc(db, "SentinelUsers", postDocID);
            await updateDoc(userRef, {
            Notification: arrayUnion({
              AuthorImageURL: "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
              AuthorName: 'Admin',
              AuthorUserID: await AsyncStorage.getItem('userId'),
              ContentDate: new Date(),
              Description: 'Great news! Your recent post has been approved and is now live.',
              NotifyType: 'post_approved',
              ShowButtons: false,
              Status: 'approved',
              isRead: false,
            }),
          });
          console.log(`✅ Approved post`);
          }
        // }
  
        // Create Notification
        if (!tempFound) {
          // Create new document if it doesn't exist
          await addDoc(collection(db, 'SentinelUsers'), {
            userID: postUserID,
            Notification: [{
              AuthorImageURL: "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
              AuthorName: 'Admin',
              AuthorUserID: await AsyncStorage.getItem('userId'),
              ContentDate: new Date(),
              Description: 'Great news! Your recent post has been approved and is now live.',
              NotifyType: 'post_approved',
              ShowButtons: false,
              Status: 'approved',
              isRead: false,
            }],
          });
          console.log(`✅ Created new user document and notification`);
        }

      }
      
    } catch (error) {
      console.error("Error updating post status:", error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update post status. Please try again.',
        position: 'bottom',
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
        position: 'bottom',
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
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    if (postItem.Reposted) {
      Toast.show({
        type: 'success',
        text1: 'Already Reposted',
        text2: 'You have already reposted this Post.',
        position: 'bottom',
        visibilityTime: 2000,
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
        // const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
        // await updateDoc(postRef, {
        //   ContentRepostCount: selectedRepostPost.ContentRepostCount - 1,
        //   RepostedBy: arrayRemove(fetchuserID),
        // });

        // setFetchedData(prevData => 
        //   prevData.map(item => 
        //     item.uniqueId === selectedRepostPost.uniqueId 
        //       ? { 
        //           ...item, 
        //           Reposted: false, 
        //           ContentRepostCount: item.ContentRepostCount - 1
        //         } 
        //       : item
        //   )
        // );

        Toast.show({
          type: 'success',
          text1: 'Already Reposted',
          text2: 'You have already reposted this Post.',
          position: 'bottom',
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
          CommentTemplate: selectedRepostPost.CommentTemplate || "Sentinel Default Template",
          isRepost: true,
          originalPost: {
            id: selectedRepostPost.id || '',
            AuthorUserID: selectedRepostPost.AuthorUserID || '',
            AuthorName: selectedRepostPost.AuthorName || 'Anonymous',
            AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
            ContentDesc: selectedRepostPost.ContentDesc || '',
            ContentDate: selectedRepostPost.ContentDate || new Date(),
            postType: selectedRepostPost.postType || 'Unknown',
            isAnonymous: selectedRepostPost.isAnonymous || false,
          },
          repostComment: '',
          repostedBy: fetchuserID,
          repostedAt: new Date(),
        });

        // setFetchedData(prevData => 
        //   prevData.map(item => 
        //     item.uniqueId === selectedRepostPost.uniqueId 
        //       ? { 
        //           ...item, 
        //           Reposted: true, 
        //           ContentRepostCount: item.ContentRepostCount + 1
        //         } 
        //       : item
        //   )
        // );

        Toast.show({
          type: 'success',
          text1: 'Reposted Successfully',
          text2: 'Post has been shared to your followers.',
          position: 'bottom',
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
        position: 'bottom',
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

      

      if (selectedRepostPost.Reposted) {
        Toast.show({
          type: 'success',
          text1: 'Already Reposted',
          text2: 'You have already reposted this Post.',
          position: 'bottom',
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
          CommentTemplate: selectedRepostPost.CommentTemplate || "Sentinel Default Template",
          isRepost: true,
          originalPost: {
            id: selectedRepostPost.id || '',
            AuthorUserID: selectedRepostPost.AuthorUserID || '',
            AuthorName: selectedRepostPost.AuthorName || 'Anonymous',
            AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
            ContentDesc: selectedRepostPost.ContentDesc || '',
            ContentDate: selectedRepostPost.ContentDate || new Date(),
            postType: selectedRepostPost.postType || 'Unknown',
            isAnonymous: selectedRepostPost.isAnonymous || false,
          },
          repostComment: comment || '',
          repostedBy: fetchuserID,
          repostedAt: new Date(),
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Quote Repost Created',
        text2: 'Your quote repost has been shared to your followers.',
        position: 'bottom',
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
        position: 'bottom',
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
        position: 'bottom',
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
        position: 'bottom',
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
        position: 'bottom',
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
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    try {
      if (postItem.isAnonymous) {
        await Share.share({
          message: `SENTINEL POST\n\nShared by Anonymous\n${postItem.ContentDesc}\n${postItem.ContentURL}\n\nPlease take a look.`,
        });
      } else {
        await Share.share({
          message: `SENTINEL POST\n\nShared by ${postItem.AuthorName}\n${postItem.ContentDesc}\n${postItem.ContentURL}\n\nPlease take a look.`,
        });
      }
      
      
    } catch (error) {
      console.log("Error sharing ", error);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Failed to share post',
        position: 'bottom',
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
              {/* Background Image (faded) */}
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{
                  width: '100%',
                  height: 200, // Fills the parent View
                  position: 'absolute', // Allows other content to layer on top
                  opacity: 0.2, // Adjust for desired transparency (0.0 to 1.0)
                }}
                className="bg-white" // This background will be visible if the image doesn't fill
                resizeMode="cover" // The background image usually covers the entire area
                blurRadius={5} // Optional: Add a blur effect to the background
                resizeMethod="resize"
              />

              {/* Foreground Image (main) */}
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{
                  width: '100%',
                  height: 200, // Fills the parent View
                }}
                // No className here, as the background image is now handled by the other Image
                resizeMode="contain" // Ensures the full foreground image is visible
                resizeMethod="resize"
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

    let AuthorName = "";
    let AuthorImage = "";
    if (item.originalPost.isAnonymous) {
      AuthorName = "Anonymous";
      AuthorImage = dummyAuthorImage;
    } else {
      AuthorName = item.originalPost.AuthorName;
      AuthorImage = item.originalPost.AuthorImageURL;
    }

    return (
      <View className="border border-gray-200 rounded-xl p-3 mt-2 bg-gray-50">
        <View className="flex-row items-center mb-2">
          <Image
            // source={{ uri: item.originalPost.AuthorImageURL || dummyAuthorImage }}
            source={{ uri: AuthorImage || dummyAuthorImage }}
            className="w-6 h-6 rounded-full mr-2"
            resizeMode="cover"
            resizeMethod="resize"
          />
          <Text className="font-semibold text-gray-900 text-sm">{AuthorName}</Text>
          <Text className="text-gray-500 text-xs ml-2">
            {getTimeAgo(item.originalPost.ContentDate)}
          </Text>
        </View>
        <Text className="text-gray-700 text-sm" numberOfLines={2}>
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

  const ApprovalToggle = useCallback(({ isApproved, isNew, onToggle, postId, postItem, isFullScreen = false }: { 
    isApproved: boolean; 
    isNew: boolean;
    onToggle: (approved: boolean, isNew: boolean) => void;
    postId: string;
    postItem: PostItem;
    isFullScreen?: boolean;
  }) => {
    const handleApproveClick = async () => {
      onToggle(true, false);
    };

    const handleRejectClick = () => {
      for (const docUserID of notificationDetails){
        console.log('PostAuthorUserID: ', postItem.AuthorUserID);
        console.log('doc PostAuthorUserID: ', docUserID.userID);
        if (docUserID.userID == postItem.AuthorUserID) {
          setPostUserDocId(docUserID.docID);
          setPostUserIdNotify(postItem.AuthorUserID);
          // setPostUserDeviceToken(doc.docDeviceToken);
        }
      }
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

  const renderPostContent = useCallback((item: PostItem, index: number) => {
    let AuthorName = "";
    let AuthorImage = "";
    if (item.isAnonymous) {
      AuthorName = "Anonymous";
      AuthorImage = dummyAuthorImage;
    } else {
      AuthorName = item.AuthorName;
      AuthorImage = item.AuthorImageURL;
    }

    return (
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
                    // source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                    source={{ uri: AuthorImage || dummyAuthorImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                    resizeMethod="resize"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-sm">{AuthorName}</Text>
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
              
              {item.AuthorUserID === userId && (
                <TouchableOpacity className="p-1.5 rounded-full bg-gray-100"
                onPress={(event) => handleThreeDotsPress(item, event)}>
                <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
              </TouchableOpacity>
              )}
            </View>
          </View>
  
          <View className="px-3 py-2.5">
            <Text className="text-gray-800 text-sm leading-5 mb-2 font-normal"
              numberOfLines={2}>
              {item.ContentDesc}
              </Text>
  
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
                  size={20}
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
                  size={20}
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
                  size={20} 
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
                <Feather name="bar-chart-2" size={20} color="#64748b" />
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
                  size={20} 
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
                <Feather name="share-2" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
  
            {userRole !== "User" && item.postType === "SentinelPosts" && (
              <TouchableOpacity
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
                <View className="mt-3 px-3 py-2.5 bg-white rounded-lg border border-gray-200">
                  {/* Single row with icon, text, and buttons */}
                  <View className="flex-row items-center justify-between">
                    {/* Left side: Icon + Post Status + Description */}
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="information-circle-outline"
                          size={18}
                          color="#64748b"
                        />
                        <Text className="font-semibold text-gray-900 text-sm ml-1.5">
                          Post Status
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-xs leading-4">
                        {item.isNew
                          ? "This post is new and awaiting review"
                          : item.isApproved
                          ? "This post is approved and visible to users"
                          : "This post is rejected and not visible to users"}
                      </Text>
                    </View>

                    {/* Right side: Buttons in a row */}
                    <View className="flex-row items-center gap-2">
                      {/* ✅ APPROVE BUTTON - Direct approval */}
                      <TouchableOpacity
                        onPress={() => handleApprovalToggle(item.id, true, false, item.AuthorUserID)}
                        className={`flex-row items-center justify-center px-3 py-1.5 rounded-lg ${
                          item.isApproved && !item.isNew
                            ? "bg-green-500"
                            : "bg-white border border-green-500"
                        }`}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={item.isApproved && !item.isNew ? "#fff" : "#22c55e"}
                        />
                        <Text
                          className={`ml-1 text-xs font-semibold ${
                            item.isApproved && !item.isNew
                              ? "text-white"
                              : "text-green-500"
                          }`}
                        >
                          Approve
                        </Text>
                      </TouchableOpacity>

                      {/* ✅ REJECT BUTTON - Opens rejection modal */}
                      <TouchableOpacity
                        onPress={() => openRejectionModal(item.id)}
                        className={`flex-row items-center justify-center px-3 py-1.5 rounded-lg ${
                          !item.isApproved && !item.isNew
                            ? "bg-red-500"
                            : "bg-white border border-red-500"
                        }`}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="close-circle"
                          size={14}
                          color={!item.isApproved && !item.isNew ? "#fff" : "#ef4444"}
                        />
                        <Text
                          className={`ml-1 text-xs font-semibold ${
                            !item.isApproved && !item.isNew
                              ? "text-white"
                              : "text-red-500"
                          }`}
                        >
                          Reject
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            {userRole !== "User" && item.postType === "SentinelPosts" && (
              <TouchableOpacity
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
                {/* <View className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
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
                </View> */}
                <View className="mt-2 px-3 py-2.5 bg-white rounded-lg border border-gray-200">
                  {/* Header Row */}
                  <View className="flex-row items-center justify-between">
                    {/* Left: Label with icon */}
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name="checkbox-outline"
                        size={18}
                        color="#64748b"
                      />
                      <Text className="font-semibold text-gray-900 text-sm ml-1.5">
                        Vote Option:
                      </Text>
                    </View>

                    {/* Right: Dropdown */}
                    <View className="flex-1 ml-3">
                      <Dropdown
                        data={fetchedCommentTemplate}
                        labelField="name"
                        valueField="name"
                        value={item.CommentTemplate}
                        onChange={(itemValue) =>
                          handleDropdownChange(itemValue, item)
                        }
                        placeholder="Select template"
                        placeholderStyle={{
                          fontSize: 13,
                          color: "#9CA3AF",
                        }}
                        selectedTextStyle={{
                          fontSize: 13,
                          color: "#1F2937",
                          fontWeight: "500",
                        }}
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                        containerStyle={{
                          borderRadius: 8,
                          marginTop: 4,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                        itemTextStyle={{
                          fontSize: 13,
                          color: "#374151",
                        }}
                        iconStyle={{
                          width: 20,
                          height: 20,
                          tintColor: "#6B7280",
                        }}
                        activeColor="#F3F4F6"
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </EnhancedCard>
      </TouchableOpacity>
    )
  }, [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, ApprovalToggle, handleApprovalToggle, dummyAuthorImage, userRole, getPostStatus, areInteractionsDisabled, openGraphModal, renderRepostContent]);

  const renderPostUserContent = useCallback((item: PostItem, index: number) => {
    let AuthorName = "";
    let AuthorImage = "";
    if (item.isAnonymous) {
      AuthorName = "Anonymous";
      AuthorImage = dummyAuthorImage;
    } else {
      AuthorName = item.AuthorName;
      AuthorImage = item.AuthorImageURL;
    }

    return (
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
                    // source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                    source={{ uri: AuthorImage || dummyAuthorImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                    resizeMethod="resize"
                  />
                </View>
              </View>
              <View className="flex-1">
              <Text className="font-bold text-gray-900 text-sm">{AuthorName}</Text>
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-gray-500 text-xs mr-2">{getTimeAgo(item.ContentDate)}</Text>
                  {item.postType === 'X-Data' && (
                    <View className="bg-blue-100 px-1.5 py-0.5 rounded-full">
                      <Text className="text-blue-600 text-xs font-medium">𝕏 POST</Text>
                    </View>
                  )}
                </View>
              </View>
              {item.AuthorUserID === userId && (
                <TouchableOpacity className="p-1.5 rounded-full bg-gray-100"
                onPress={(event) => handleThreeDotsPress(item, event)}>
                <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
              </TouchableOpacity>
              )}
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
  
            <Text className="text-gray-800 text-sm leading-5 mb-2"
              numberOfLines={2}>
              {item.ContentDesc}
              </Text>
  
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
                  size={20}
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
                  size={20}
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
                  size={20} 
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
                <Feather name="bar-chart-2" size={20} color="#64748b" />
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
                  size={20} 
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
                <Feather name="share-2" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </EnhancedCard>
      </TouchableOpacity>
    )
  }, [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, dummyAuthorImage, areInteractionsDisabled, openGraphModal, renderRepostContent]);

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
        Posts coming soon
      </Text>
      <Text className="text-gray-500 text-center leading-6 mb-4">
      The next level of knowledge starts soon.
      </Text>
      {/* <TouchableOpacity 
        className="bg-black px-6 py-3 rounded-xl"
        onPress={() => {
          router.push('/search');
        }}
      >
        <Text className="text-white font-semibold">Find People to Follow</Text>
      </TouchableOpacity> */}
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
          {/* <View>
            <Image
              source={require("../../assets/images/new_logo.png")}
              className="w-16 h-10"
              resizeMode="contain"
            />
          </View> */}
          {/* <Text className="text-3xl font-bold text-black-900">Sentinel</Text> */}
          <Link href="/" asChild>
              <TouchableOpacity className="flex-row items-center">
                <View className="ml-2">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 mr-0">
                      <Image
                        source={require("../../assets/images/new_logo.png")}
                        style={{ flex: 1, width: undefined, height: undefined }}
                        resizeMode="contain"
                      />
                    </View>
                    {/* Sentinel Text */}
                    <Text className="text-3xl font-extrabold text-[#281C20]">entinel</Text>
                  </View>
                  {/* Logo Icon */}
                  <Text className="text-sm text-[#281C20]">
                    Exposing Antisemitism
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>


          
          <TouchableOpacity 
              className="p-2 "
              onPress={() => router.push('/search')}
            >
              <MaterialCommunityIcons 
                name="magnify" 
                size={30} 
                color="#000000" 
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
        {/* {loading ? (
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
        )} */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <LoadingComponent visible={true} size="large" />
          </View>
        ) : activeTab === 'following' ? (
          renderEmptyFollowingState()
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
                style={{
                  width: '100%',
                  height: '100%', // Fills the parent View
                }}
                // No className here, as the background image is now handled by the other Image
                resizeMode="contain" // Ensures the full foreground image is visible
                resizeMethod="resize"
                onError={(error) => {
                  console.log("Image load error:", error.nativeEvent.error);
                }}
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

      {/* Custom Alert Modal */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />

      {/* Three Dots Menu Modal */}
      {showMenuModal && (
            <Modal
              visible={showMenuModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMenuModal(false)}
            >
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
                activeOpacity={1}
                onPress={() => setShowMenuModal(false)}
              >
                <View style={{
                  position: 'absolute',
                  top: menuPosition.y,
                  left: menuPosition.x,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  paddingVertical: 4,
                  minWidth: 140,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  {/* <TouchableOpacity
                    onPress={() => {
                      // const comment = comments.find(c => c.id === selectedCommentId);
                      // if (comment) handleEditComment(comment);
                      if(userExistingComment) handleEditComment(userExistingComment);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="#007AFF" />
                    <Text style={{ marginLeft: 10, fontSize: 14, color: '#007AFF' }}>
                      Edit
                    </Text>
                  </TouchableOpacity> */}
                  
                  <View style={{ height: 0.5, backgroundColor: '#e5e5e5', marginHorizontal: 8 }} />
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedPostId) handleDeletePost(selectedPostId);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="trash" size={16} color="#FF3B30" />
                    <Text style={{ marginLeft: 10, fontSize: 14, color: '#FF3B30' }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
     
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