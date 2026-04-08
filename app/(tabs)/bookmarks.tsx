import { db } from '@/FirebaseConfig';
import TotalSentiment from '@/components/TotalSentiment';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import { VideoView, useVideoPlayer } from 'expo-video';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView, Share, StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import CommentsModal from '../../components/CommentsModal';
import { LoadingComponent } from '../../components/LoadingComponent';
import { showToast } from '../../utils/toast';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PostItem {
  id: string;
  uniqueId: string;
  AuthorUserID?: string;
  AuthorImageURL: string;
  AuthorName: string;
  AuthorEmail: string;
  AuthorBio?: string;
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
  bookmarkedAt?: any;
  CommentTemplate: string;
  isRepost?: boolean;
  originalPost?: PostItem;
  repostComment?: string;
  repostedBy?: string;
  repostedAt?: any;
  isAnonymous: boolean;
  contentType: string;
  ContentViewCount?: number;
  ViewedBy?: string[];
}

// Repost Modal Component
interface RepostModalProps {
  visible: boolean;
  onClose: () => void;
  post: PostItem | null;
  onSimpleRepost: () => void;
  onQuoteRepost: (comment: string) => void;
}

interface MediaCarouselProps {
  mediaUrls: string[];
  postId: string;
  onImagePress: (url: string) => void;
  onVideoPress: (url: string) => void;
  onDocPress: (url: string) => void;
  getMediaType: (url: string) => string;
  VideoPlayer: any;
  index?: number;
}
type ShortURLResponse = {
  shortURL: string;
  id: any;
};
const renderStyledPostText = (text) => {
  if (!text) return null;

  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const hashtagPattern = /(^|\s)(#[a-zA-Z0-9_]+)/g;

  const urlMatches = [];
  const hashtagMatches = [];
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    urlMatches.push({
      type: "url",
      text: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  while ((match = hashtagPattern.exec(text)) !== null) {
    hashtagMatches.push({
      type: "hashtag",
      text: match[2],
      index: match.index + match[1].length,
      length: match[2].length,
    });
  }

  const allMatches = [...urlMatches, ...hashtagMatches].sort((a, b) => a.index - b.index);

  if (allMatches.length === 0) {
    return <Text style={{ color: "#111827" }}>{text}</Text>;
  }

  const components = [];
  let lastIndex = 0;

  allMatches.forEach((match, i) => {
    if (match.index > lastIndex) {
      components.push(
        <Text key={`text-${i}`} style={{ color: "#111827" }}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }

    if (match.type === "url") {
      components.push(
        <Text
          key={`url-${i}`}
          style={{ color: "#2563EB", textDecorationLine: "underline", fontWeight: "500" }}
          onPress={() => {
            const url = match.text.startsWith("http") ? match.text : `https://${match.text}`;
            Linking.openURL(url);
          }}
        >
          {match.text}
        </Text>
      );
    } else if (match.type === "hashtag") {
      components.push(
        <TouchableOpacity
          key={`hashtag-${i}`}
          onPress={() => {
            alert("Hashtag tapped: " + match.text);
            // Or custom navigation/filter
          }}
        >
          <Text
            style={{
              color: "#E6161A",
              fontWeight: "bold",
              backgroundColor: "#FEE2E2",
              paddingHorizontal: 2,
              borderRadius: 2,
            }}
          >
            {match.text}
          </Text>
        </TouchableOpacity>
      );
    }
    lastIndex = match.index + match.length;
  });

  if (lastIndex < text.length) {
    components.push(
      <Text key="end" style={{ color: "#111827" }}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return components;
};

const MediaCarousel: React.FC<MediaCarouselProps> = React.memo(({ 
  mediaUrls,
  postId,
  onImagePress,
  onVideoPress,
  onDocPress,
  getMediaType,
  VideoPlayer,
  index
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // ✅ CRITICAL: Calculate exact width for perfect snapping
  const CARD_PADDING = 12; // Total horizontal padding (6px each side)
  const ITEM_WIDTH = screenWidth - (CARD_PADDING * 2);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const handleScroll = (event: any) => {
      const offset = event.nativeEvent.contentOffset.x;
      // ✅ clamp to valid range to prevent out-of-bound values
      const activeSlide = Math.min(
        Math.max(Math.round(offset / ITEM_WIDTH), 0),
        mediaUrls.length - 1
      );
      setCurrentSlide(activeSlide);
    };

  return (
    <View className="mb-2 relative">
      {/* ✅ Gesture handling wrapper */}
      <View 
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => false}
        onMoveShouldSetResponderCapture={(evt) => {
          return Math.abs(evt.nativeEvent.pageX - evt.nativeEvent.locationX) > 10;
        }}
        onResponderTerminationRequest={() => false}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false} // ✅ Changed to false, using snapToInterval instead
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          // ✅ CRITICAL SNAP PROPS
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          onMomentumScrollEnd={(event) => {
            const offset = event.nativeEvent.contentOffset.x;
            const activeSlide = Math.min(
              Math.max(Math.round(offset / ITEM_WIDTH), 0),
              mediaUrls.length - 1
            );
            setCurrentSlide(activeSlide);
          }}
          // Other props
          nestedScrollEnabled={true}
          scrollEnabled={true}
          removeClippedSubviews={false}
          contentContainerStyle={{ paddingRight: CARD_PADDING }}
        >
          {mediaUrls.map((mediaUrl, mediaIndex) => {
            const mediaType = getMediaType(mediaUrl);

            return (
              <View 
                key={`${postId}-media-${mediaIndex}`}
                style={{ 
                  width: ITEM_WIDTH,
                  marginRight: mediaIndex < mediaUrls.length - 1 ? 0 : 0 
                }}
              >
                {mediaType === 'image' && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onImagePress(mediaUrl);
                    }}
                    activeOpacity={0.95}
                  >
                    <View className="relative rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        source={{ uri: mediaUrl }}
                        style={{ width: '100%', aspectRatio: 16 / 9 }}
                        resizeMode="cover"
                        resizeMethod="resize"
                        progressiveRenderingEnabled={true}
                        fadeDuration={300}
                      />
                      <View className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50">
                        <Ionicons name="expand-outline" size={14} color="white" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {mediaType === 'video' && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onVideoPress(mediaUrl);
                    }}
                    activeOpacity={0.95}
                  >
                    <VideoPlayer videoUrl={mediaUrl} index={index} />
                  </TouchableOpacity>
                )}

                {mediaType === 'gif' && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onImagePress(mediaUrl);
                    }}
                    activeOpacity={0.95}
                  >
                    <View className="relative rounded-xl overflow-hidden">
                      <Image
                        source={{ uri: mediaUrl }}
                        style={{ width: '100%', aspectRatio: 16 / 9 }}
                        resizeMode="cover"
                        progressiveRenderingEnabled={true}
                      />
                      <View className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50">
                        <MaterialIcons name="gif" size={20} color="white" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {mediaType === 'doc' && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onDocPress(mediaUrl);
                    }}
                    activeOpacity={0.95}
                  >
                    <View
                      style={{
                        borderRadius: 12,
                        backgroundColor: '#8B5CF6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        aspectRatio: 16 / 9,
                        width: '100%',
                      }}
                    >
                      <Ionicons name="document-text-outline" size={32} color="#FFFFFF" />
                      <Text 
                        numberOfLines={1}
                        style={{
                          color: '#FFF',
                          marginTop: 4,
                          textAlign: 'center',
                          paddingHorizontal: 12,
                          fontSize: 11,
                        }}
                      >
                        {mediaUrl.split('/').pop()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Instagram-Style Pagination Dots */}
      {mediaUrls.length > 1 && (
        <View className="flex-row justify-center items-center mt-2" style={{ gap: 6 }}>
          {mediaUrls.map((_, dotIndex) => (
            <TouchableOpacity
              key={`dot-${dotIndex}`}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  x: dotIndex * ITEM_WIDTH,
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: currentSlide === dotIndex ? 8 : 6,
                  height: currentSlide === dotIndex ? 8 : 6,
                  borderRadius: currentSlide === dotIndex ? 4 : 3,
                  backgroundColor: currentSlide === dotIndex ? '#3b82f6' : '#d1d5db',
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Media Counter Badge (1/5) */}
      {mediaUrls.length > 1 && (
        <View className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70">
          <Text className="text-white text-xs font-semibold">
            {currentSlide + 1}/{mediaUrls.length}
          </Text>
        </View>
      )}
    </View>
  );
});


// Continue with RepostModal...


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
          <View className="px-6 pt-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Share this post</Text>
                {/* <Text className="text-gray-500 text-sm mt-1">Add your thoughts or share as is</Text> */}
              </View>
              <TouchableOpacity 
                className="p-2 rounded-full bg-gray-100"
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-2 py-0">
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
              <Text className="text-gray-700 text-sm" numberOfLines={3}>
                {renderStyledPostText(post.ContentDesc)}
              </Text>
            </View>

            {/* <View className="flex-row items-center justify-between mb-4">
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
            </View> */}

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

export default function BookmarksPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<PostItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'likes'>('recent');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [fullScreenDoc, setFullScreenDoc] = useState<string | null>(null);
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [cardAnimations, setCardAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  // const videoRefs = useRef<{ [key: string]: any }>({});
  const [fetchedXData, setFetchedXData] = useState<any>([]);

  // ------- COMMENT MODAL STATE -------
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedCommentTemplate, setSelectedCommentTemplate] = useState<string | null>(null);

  // ------- GRAPH MODAL STATE -------
  const [isGraphModalVisible, setIsGraphModalVisible] = useState(false);
  const [selectedGraphPostId, setSelectedGraphPostId] = useState<string | null>(null);
  const [selectedGraphPostType, setSelectedGraphPostType] = useState<string | null>(null);

  //Repost modal
  const [isRepostModalVisible, setIsRepostModalVisible] = useState(false);
  const [selectedRepostPost, setSelectedRepostPost] = useState<PostItem | null>(null);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const viewTrackingTimeout = useRef<NodeJS.Timeout | number | null>(null);
  const lastTrackedPost = useRef<string | null>(null);
  const [sharingId, setSharingId] = useState(null);
  const [selectedPostUserId, setSelectedPostUserId] = useState<string | null>(null);
  const [isDeleteUserModalVisible, setIsDeleteUserModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const bookmarkUnsubscribersRef = useRef<(() => void)[]>([]);
  
  

  const formatViewCount = useCallback((count: number): string => {
    if (!count || count === 0) return '0';
    
    if (count < 1000) {
      return count.toString();
    } else if (count < 10000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else if (count < 1000000) {
      return Math.floor(count / 1000) + 'K';
    } else if (count < 10000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (count < 1000000000) {
      return Math.floor(count / 1000000) + 'M';
    } else {
      return (count / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
  }, []);
  
  
    // ✅ TRACK POST VIEW
    const trackPostView = useCallback(async (postId: string, postType: string) => {
      try {
        if (!userId || !postId || viewedPosts.has(postId)) {
          return;
        }

        const collectionName = postType === 'X-Data' ? 'X-Data' : 'SentinelPosts';
        const postRef = doc(db, collectionName, postId);
        
        const postDoc = await getDoc(postRef);
        
        if (!postDoc.exists()) {
          return;
        }

        const postData = postDoc.data();
        const currentViewedBy = postData.ViewedBy || [];
        const currentViewCount = postData.ContentViewCount || 0;
        const hasViewed = currentViewedBy.includes(userId);
        
        const newCount = currentViewCount + 1;
        
        await updateDoc(postRef, {
          ContentViewCount: newCount,
          ViewedBy: hasViewed ? currentViewedBy : arrayUnion(userId),
          lastViewUpdate: new Date()
        });
        
        // Optimistic UI update
        setBookmarkedPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { 
                  ...p, 
                  ContentViewCount: newCount,
                  ViewedBy: hasViewed ? p.ViewedBy : [...(p.ViewedBy || []), userId]
                }
              : p
          )
        );
        
        setViewedPosts(prev => new Set(prev).add(postId));
        
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }, [userId, viewedPosts]);
    // Reset viewed posts when page loads
    useEffect(() => {
      setViewedPosts(new Set());
    }, []);

    const handleScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const viewHeight = layoutMeasurement.height;

    if (viewTrackingTimeout.current) {
      clearTimeout(viewTrackingTimeout.current);
    }

    viewTrackingTimeout.current = setTimeout(() => {
      filteredAndSortedPosts.forEach((item, index) => {
        const itemY = index * 450;
        const itemHeight = 450;
        const itemTop = itemY;
        const itemBottom = itemY + itemHeight;
        
        const visibleTop = Math.max(itemTop, currentScrollY);
        const visibleBottom = Math.min(itemBottom, currentScrollY + viewHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibilityPercentage = (visibleHeight / itemHeight) * 100;
        
        const isVisible = visibilityPercentage >= 50;
        
        if (isVisible && !viewedPosts.has(item.id)) {
          trackPostView(item.id, item.postType);
        }
      });
    }, 800);
  }, [bookmarkedPosts, viewedPosts, trackPostView]);
  


  

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';
  
  const openUserProfile = (item: PostItem) => {
    const authorId = item.AuthorUserID || item.repostedBy; // choose what you consider profile id
    if (!authorId) return;

    router.push({
      pathname: "/profile/[userId]",
      params: {
        userId: authorId,                 // item.AuthorUserID
        authorName: item.AuthorName,      // from post
        authorImageUrl: item.AuthorImageURL, // from post
        isAnonymous: item.isAnonymous ? 'true' : 'false', // ✅ ADD THIS LINE
        userBio: item.AuthorBio || '',  // ✅ ADD THIS LINE
      },
    });
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

      // Return relative time for recent posts
      if (diffInSeconds < 60) {
        return diffInSeconds <= 0 ? 'Just now' : `${diffInSeconds}s ago`;
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        // For older posts (beyond normal relative time), show formatted date
        const dateObj = new Date(postDate.getTime());

        // 1. Month names array
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // 2. Extract components
        const month   = monthNames[dateObj.getMonth()];
        const day     = String(dateObj.getDate()).padStart(2, '0');
        const year    = dateObj.getFullYear();
        const hours   = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');

        // 3. Format string: "Feb 02, 2026 21:30"
        const formatted = `${month} ${day}, ${year} ${hours}:${minutes}`;

        return formatted;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Just now';
    }
  }, []);
  const fullScreenVideoPlayer = useVideoPlayer(fullScreenVideo || '', (player) => {
    player.loop = false;
    player.play();
  });
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
          style={{ 
            width: '100%', 
            aspectRatio: 16 / 9  // Changed from fixed height to responsive aspectRatio
          }}
          contentFit="cover"  // Changed from "contain" to "cover" for full-area display
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

    const handleShare = useCallback(async (postItem: PostItem) => {
      console.log("Share pressed:", postItem?.id);
      
      setSharingId(postItem.id); // Start loading
      
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Toast.show({
          type: 'error',
          text1: 'Sharing Not Available',
          text2: 'Sharing is not available on this device',
          position: 'bottom',
          visibilityTime: 2000,
        });
        setSharingId(null); // Stop loading
        return;
      }
  
      try {
        const postUrl = `https://ironex.app/post/${postItem?.id}`;
        
        // const shareMessage = postItem.isAnonymous
        //   ? `✨ SENTINEL POST ✨
  
        // 👤 Shared by Anonymous
  
        // 💭 ${postItem.ContentDesc}
  
        // 🔗 Tap to view this amazing post:
        // ${postUrl}
  
        // ━━━━━━━━━━━━━━━
        // 📱 Join the conversation on Sentinel and discover more!`
        //   : `✨ SENTINEL POST ✨
  
        // 🌟 Shared by ${postItem.AuthorName}
  
        // 💭 ${postItem.ContentDesc}
  
        // 🔗 Tap to view this amazing post:
        // ${postUrl}
  
        // ━━━━━━━━━━━━━━━
        // 📱 Join the conversation on Sentinel and discover more!`;
  
        // const shareMessage = `🔗 Tap to view on IronExSafe™:
        // ${postUrl}`;
  
        // await Share.share({
        //   message: `${shareMessage}\n${postUrl}`,
        //   url: postUrl,
        //   title: '✨ Check out this IronExSafe™ post',
        // });
  
        callShortUrl(postUrl);
        
      } catch (error) {
        console.log("Error sharing ", error);
        Toast.show({
          type: 'error',
          text1: 'Share Failed',
          text2: 'Failed to share post',
          position: 'bottom',
          visibilityTime: 2000,
        });
        setSharingId(null); // Stop loading
      } 
  
      await new Promise(r => setTimeout(r, 200));
    }, []);
  
    const callShortUrl = async (postUrl: string) => {
      try {
        console.log('Call Short Url...');
        
        const response = await fetch(
          'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/shorten-url',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              "originalURL" : postUrl
            })
          }
        );
    
        if (!response.ok) {
          // Optional: Show success message
          Toast.show({
            type: 'error',
            text1: 'Share Failed',
            text2: 'Failed to share post',
            position: 'bottom',
            visibilityTime: 2000,
          });
        } else {
          const data: ShortURLResponse = await response.json();
          console.log('Short URL response:', data);
  
          const shareMessage = `🔗 Tap to view on IronExSafe™: ${data.shortURL}`;
  
          await Share.share({
            message: `${shareMessage}`,
            title: '✨ Check out this IronExSafe™ post',
          });
        }
        
      } catch (error) {
        console.error('❌ Error Short URL:', error);
  
        setIsDeleteUserModalVisible(false);
        setShowMenuModal(false);
        setSelectedPostUserId(null);
        setUserToDelete(null);
  
      } finally {
        setSharingId(null); // Stop loading
      }
    };

  // FIXED: Fetch bookmarked posts without problematic queries
  

// ✅ Replace handleFetchBookmarkedPosts with this
const setupBookmarkListeners = useCallback((fetchuserID: string) => {
  // Clean up previous listeners first
  bookmarkUnsubscribersRef.current.forEach(unsub => unsub());
  bookmarkUnsubscribersRef.current = [];

  setLoading(true);

  // Track posts from both collections separately
  let sentinelBookmarks: PostItem[] = [];
  let xDataBookmarks: PostItem[] = [];
  let sentinelLoaded = false;
  let xDataLoaded = false;

  const mergeAndSet = () => {
    if (sentinelLoaded && xDataLoaded) {
      const all = [...sentinelBookmarks, ...xDataBookmarks];
      setBookmarkedPosts(all);
      setLoading(false);
    }
  };

  // ── 1. Real-time listener for SentinelPosts ──
  const sentinelRef = collection(db, 'SentinelPosts');
  const sentinelQuery = query(sentinelRef, orderBy('ContentDate', 'desc'));

  const unsubSentinel = onSnapshot(sentinelQuery, (snapshot) => {
    sentinelBookmarks = snapshot.docs
      .filter(doc => doc.data().BookmarkedBy?.includes(fetchuserID))
      .map(doc => {
        const postData = doc.data();
        return {
          uniqueId: `sentinel-${doc.id}`,
          id: doc.id,
          AuthorImageURL: postData.AuthorImageURL,
          AuthorName: postData.AuthorName,
          AuthorEmail: postData.AuthorEmail || '',
          AuthorBio: postData.AuthorBio || '',
          AuthorUserID: postData.AuthorUserID || postData.repostedBy || '123456',
          ContentDate: postData.ContentDate,
          ContentDesc: postData.ContentDesc,
          ContentURL: postData.ContentURL,
          ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
          ContentLikeCount: postData.ContentLikeCount || 0,
          ContentRepostCount: postData.ContentRepostCount || 0,
          ContentCommentCount: postData.ContentCommentCount || 0,
          ContentViewCount: postData.ContentViewCount || 0,
          ViewedBy: postData.ViewedBy || [],
          isApproved: postData.isApproved || false,
          isNew: postData.isNew !== undefined ? postData.isNew : true,
          postType: postData.postType || 'SentinelPosts',
          Liked: postData.LikedBy?.includes(fetchuserID) || false,
          Reposted: postData.RepostedBy?.includes(fetchuserID) || false,
          Bookmarked: true,
          createdAt: postData.createdAt || postData.ContentDate,
          bookmarkedAt: postData.bookmarkedAt || new Date(),
          CommentTemplate: postData.CommentTemplate || 'Standard Template',
          isRepost: postData.isRepost || false,
          originalPost: postData.originalPost || null,
          repostComment: postData.repostComment || '',
          repostedBy: postData.repostedBy || '',
          repostedAt: postData.repostedAt || null,
          isAnonymous: postData.isAnonymous || false,
          contentType: postData.contentType || 'My Thoughts',
        } as PostItem;
      });

    sentinelLoaded = true;
    mergeAndSet();
  }, (error) => {
    console.error('Error listening to SentinelPosts bookmarks:', error);
    sentinelLoaded = true;
    mergeAndSet();
  });

  // ── 2. Real-time listener for X-Data ──
  const xDataRef = collection(db, 'X-Data');
  const xDataQuery = query(xDataRef, orderBy('ContentDate', 'desc'));

  const unsubXData = onSnapshot(xDataQuery, (snapshot) => {
    xDataBookmarks = snapshot.docs
      .filter(doc => doc.data().BookmarkedBy?.includes(fetchuserID))
      .map(doc => {
        const postData = doc.data();
        return {
          uniqueId: `xdata-${doc.id}`,
          id: doc.id,
          AuthorImageURL: postData.AuthorImageURL,
          AuthorName: postData.AuthorName,
          AuthorEmail: postData.AuthorEmail || '',
          AuthorBio: postData.AuthorBio || '',
          AuthorUserID: postData.AuthorUserID,
          ContentDate: postData.ContentDate,
          ContentDesc: postData.ContentDesc,
          ContentURL: postData.ContentURL,
          ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
          ContentLikeCount: postData.ContentLikeCount || 0,
          ContentRepostCount: postData.ContentRepostCount || 0,
          ContentCommentCount: postData.ContentCommentCount || 0,
          ContentViewCount: postData.ContentViewCount || 0,
          ViewedBy: postData.ViewedBy || [],
          isApproved: true,
          isNew: false,
          postType: 'X-Data',
          Liked: postData.LikedBy?.includes(fetchuserID) || false,
          Reposted: postData.RepostedBy?.includes(fetchuserID) || false,
          Bookmarked: true,
          createdAt: postData.createdAt || postData.ContentDate,
          bookmarkedAt: postData.bookmarkedAt || new Date(),
          CommentTemplate: postData.CommentTemplate || 'Standard Template',
          isAnonymous: false,
          contentType: postData.contentType || 'My Thoughts',
        } as PostItem;
      });

    xDataLoaded = true;
    mergeAndSet();
  }, (error) => {
    console.error('Error listening to X-Data bookmarks:', error);
    xDataLoaded = true;
    mergeAndSet();
  });

  bookmarkUnsubscribersRef.current = [unsubSentinel, unsubXData];
}, []);

useEffect(() => {
  const init = async () => {
    let fetchuserID = userId;
    if (!fetchuserID) {
      fetchuserID = await AsyncStorage.getItem('userId');
      if (fetchuserID) setUserId(fetchuserID);
    }
    const fetchuserRole = await AsyncStorage.getItem('userRole');
    if (fetchuserRole) setUserRole(fetchuserRole as any);

    if (fetchuserID) {
      setupBookmarkListeners(fetchuserID);
    }
  };
  init();

  // ✅ Cleanup listeners when component unmounts
  return () => {
    bookmarkUnsubscribersRef.current.forEach(unsub => unsub());
  };
}, []);

  const openRepostModal = useCallback((postItem: PostItem) => {
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
  }, []);

  const closeRepostModal = useCallback(() => {
    setIsRepostModalVisible(false);
    setSelectedRepostPost(null);
  }, []);

  // TO OPEN COMMENTS MODAL
  const openCommentsModal = useCallback((item: PostItem) => {
    setSelectedPostId(item.id);
    setSelectedPostType(item.postType);
    setSelectedCommentTemplate(item.CommentTemplate);
    setIsCommentModalVisible(true);
  }, []);

  // TO CLOSE COMMENTS MODAL
  const closeCommentsModal = useCallback(() => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
    setSelectedPostType(null);
    setSelectedCommentTemplate(null);
  }, []);

  // TO OPEN GRAPH MODAL
  const openGraphModal = useCallback((item: PostItem) => {
    console.log("Graph ID: ", item.id);
    setSelectedGraphPostId(item.id);
    setSelectedGraphPostType(item.postType);
    setIsGraphModalVisible(true);
    // setSelectedPostId(item.id);
    // setSelectedPostType(item.postType);
    // setIsCommentModalVisible(false);
    // setSelectedCommentTemplate(item.CommentTemplate);
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

    const toggleLike = useCallback(async (postItem: PostItem) => {
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    const postRef = doc(db, postItem.postType, postItem.id);
    
    try {
      if(postItem.Liked) {
        // ✅ UNLIKE: Update state FIRST
        setBookmarkedPosts(prevData =>
          prevData.map(item =>
            item.id === postItem.id
              ? { 
                  ...item, 
                  Liked: false, 
                  ContentLikeCount: Math.max(0, item.ContentLikeCount - 1)
                }
              : item
          )
        );

        // Then update Firebase
        await updateDoc(postRef, {
          ContentLikeCount: Math.max(0, postItem.ContentLikeCount - 1),
          LikedBy: arrayRemove(fetchuserID),
        });
      } else {
        // ✅ LIKE: Update state FIRST
        setBookmarkedPosts(prevData =>
          prevData.map(item =>
            item.id === postItem.id
              ? { 
                  ...item, 
                  Liked: true, 
                  ContentLikeCount: item.ContentLikeCount + 1
                }
              : item
          )
        );

        // Then update Firebase
        await updateDoc(postRef, {
          ContentLikeCount: postItem.ContentLikeCount + 1,
          LikedBy: arrayUnion(fetchuserID),
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // ✅ Revert state on error
      setBookmarkedPosts(prevData =>
        prevData.map(item =>
          item.id === postItem.id
            ? { 
                ...item, 
                Liked: postItem.Liked,
                ContentLikeCount: postItem.ContentLikeCount
              }
            : item
        )
      );
      
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'Failed to update like. Please try again.',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  }, [userId]);


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
    const userImage = await AsyncStorage.getItem('profilePicUrl') || dummyAuthorImage;

    // ✅ Early return check
    if (selectedRepostPost.Reposted) {
      Toast.show({
        type: 'success',
        text1: 'Already Reposted',
        text2: 'You have already reposted this Post.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return; // ✅ Exit early
    }

    // ✅ Update state FIRST (optimistic update)
    setBookmarkedPosts(prevData =>
      prevData.map(item =>
        item.id === selectedRepostPost.id
          ? { 
              ...item, 
              Reposted: true,
              ContentRepostCount: item.ContentRepostCount + 1
            }
          : item
      )
    );

    // Update Firebase
    const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
    await updateDoc(postRef, {
      ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
      RepostedBy: arrayUnion(fetchuserID),
    });

    // Create repost document
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
      CommentTemplate: selectedRepostPost.CommentTemplate || "Standard Template",
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
        contentType: selectedRepostPost.contentType || 'My Thoughts'
      },
      repostComment: '',
      repostedBy: fetchuserID,
      repostedAt: new Date(),
      isAnonymous: false,
      contentType: 'Found Online'
    });

    Toast.show({
      type: 'success',
      text1: 'Reposted Successfully',
      text2: 'Post has been shared to your followers.',
      position: 'bottom',
      visibilityTime: 2000,
    });

  } catch (error) {
    console.error('Error handling repost:', error);
    
    // ✅ Revert state on error
    if (selectedRepostPost) {
      setBookmarkedPosts(prevData =>
        prevData.map(item =>
          item.id === selectedRepostPost.id
            ? { 
                ...item, 
                Reposted: selectedRepostPost.Reposted,
                ContentRepostCount: selectedRepostPost.ContentRepostCount
              }
            : item
        )
      );
    }
    
    Toast.show({
      type: 'error',
      text1: 'Repost Failed',
      text2: 'Failed to repost. Please try again.',
      position: 'bottom',
      visibilityTime: 3000,
    });
  }
}, [selectedRepostPost, userId]);


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
    const userImage = await AsyncStorage.getItem('profilePicUrl') || dummyAuthorImage;

    // ✅ Early return check
    if (selectedRepostPost.Reposted) {
      Toast.show({
        type: 'success',
        text1: 'Already Reposted',
        text2: 'You have already reposted this Post.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return; // ✅ Exit early
    }

    // ✅ Update state FIRST (optimistic update)
    setBookmarkedPosts(prevData =>
      prevData.map(item =>
        item.id === selectedRepostPost.id
          ? { 
              ...item, 
              Reposted: true,
              ContentRepostCount: item.ContentRepostCount + 1
            }
          : item
      )
    );

    // Update Firebase
    const postRef = doc(db, selectedRepostPost.postType, selectedRepostPost.id);
    await updateDoc(postRef, {
      ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
      RepostedBy: arrayUnion(fetchuserID),
    });

    // Create quote repost document
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
      CommentTemplate: selectedRepostPost.CommentTemplate || "Standard Template",
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
        contentType: selectedRepostPost.contentType || 'My Thoughts'
      },
      repostComment: comment || '',
      repostedBy: fetchuserID,
      repostedAt: new Date(),
      isAnonymous: false,
      contentType: 'Found Online'
    });

    Toast.show({
      type: 'success',
      text1: 'Quote Repost Created',
      text2: 'Your quote repost has been shared to your followers.',
      position: 'bottom',
      visibilityTime: 2000,
    });

  } catch (error) {
    console.error('Error creating quote repost:', error);
    
    // ✅ Revert state on error
    if (selectedRepostPost) {
      setBookmarkedPosts(prevData =>
        prevData.map(item =>
          item.id === selectedRepostPost.id
            ? { 
                ...item, 
                Reposted: selectedRepostPost.Reposted,
                ContentRepostCount: selectedRepostPost.ContentRepostCount
              }
            : item
        )
      );
    }
    
    Toast.show({
      type: 'error',
      text1: 'Quote Repost Failed',
      text2: 'Failed to create quote repost. Please try again.',
      position: 'bottom',
      visibilityTime: 3000,
    });
  }
}, [selectedRepostPost, userId]);


  const handleRepost = useCallback(async (postItem: PostItem) => {
    openRepostModal(postItem);
  }, [openRepostModal]);

  const handleRemoveBookmark = useCallback(async (postItem: PostItem) => {
    try {
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
      showToast.success('Post has been removed from your bookmarks.', 'Bookmark Removed');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      showToast.error('Failed to remove bookmark. Please try again.', 'Error');
    }
  }, []);

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
        <Text className="text-gray-700 text-sm" numberOfLines={3}>
          {renderStyledPostText(item.originalPost.ContentDesc)}
        </Text>
      </View>
    );
  }, [getTimeAgo, dummyAuthorImage]);

  // OPTIMIZED MEDIA CONTENT
    // OPTIMIZED MEDIA CONTENT WITH CAROUSEL
const renderMediaContent = useCallback((item: PostItem, index?: number) => {
  const mediaUrls = item.ContentURLs && item.ContentURLs.length > 0 
    ? item.ContentURLs 
    : (item.ContentURL ? [item.ContentURL] : []);

  return (
    <MediaCarousel
      mediaUrls={mediaUrls}
      postId={item.id}
      onImagePress={openFullScreenImage}
      onVideoPress={openFullScreenVideo}
      onDocPress={openFullScreenDoc}
      getMediaType={getMediaType}
      VideoPlayer={VideoPlayer}
      index={index}
    />
  );
}, [getMediaType, openFullScreenImage, openFullScreenVideo, openFullScreenDoc, VideoPlayer]);



  // OPTIMIZED REFRESH
  // ✅ Update onRefresh
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  let fetchuserID = userId;
  if (!fetchuserID) {
    fetchuserID = await AsyncStorage.getItem('userId');
    if (fetchuserID) setUserId(fetchuserID);
  }
  if (fetchuserID) {
    setupBookmarkListeners(fetchuserID);
  }
  setRefreshing(false);
}, [userId, setupBookmarkListeners]);

  // Filter and sort bookmarked posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = bookmarkedPosts;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(post => 
        post.ContentDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.AuthorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.bookmarkedAt || b.ContentDate).getTime() - new Date(a.bookmarkedAt || a.ContentDate).getTime();
        case 'oldest':
          return new Date(a.bookmarkedAt || a.ContentDate).getTime() - new Date(b.bookmarkedAt || b.ContentDate).getTime();
        case 'likes':
          return b.ContentLikeCount - a.ContentLikeCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookmarkedPosts, searchQuery, sortBy]);
  // SETUP REAL-TIME VIEW COUNT LISTENERS
    const setupViewCountListeners = useCallback(() => {
      // Only setup listeners for first 10 posts to save resources
      const visiblePosts = filteredAndSortedPosts.slice(0, 10);
      const unsubscribers: (() => void)[] = [];

      visiblePosts.forEach((post) => {
        const collectionName = post.postType === 'X-Data' ? 'X-Data' : 'SentinelPosts';
        const postRef = doc(db, collectionName, post.id);
        
        const unsubscribe = onSnapshot(postRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const newViewCount = data.ContentViewCount || 0;
            
            // Only update if count actually changed
            setBookmarkedPosts(prev =>
              prev.map(p =>
                p.id === post.id && p.ContentViewCount !== newViewCount
                  ? { ...p, ContentViewCount: newViewCount }
                  : p
              )
            );
          }
        }, (error) => {
          console.error(`Error listening to post ${post.id}:`, error);
        });
        
        unsubscribers.push(unsubscribe);
      });

      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    }, [filteredAndSortedPosts]);

    // Add to useEffect
    useEffect(() => {
      if (filteredAndSortedPosts.length > 0) {
        const cleanup = setupViewCountListeners();
        return cleanup;
      }
    }, [filteredAndSortedPosts.length, setupViewCountListeners]);


  // Enhanced Card Component
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

  const renderBookmarkedPost = useCallback((item: PostItem, index: number) =>{
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
      <View>
          <EnhancedCard postId={item.uniqueId}>
        <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="relative">
                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() => openUserProfile(item)}
                                >
                                  <View className="w-8 h-8 rounded-full mr-2 overflow-hidden border-2 border-white shadow-sm">
                                    <Image
                                      source={{ uri: AuthorImage || dummyAuthorImage }}
                                      className="w-full h-full"
                                      resizeMode="cover"
                                      resizeMethod="resize"
                                    />
                                  </View>
                                </TouchableOpacity>
                              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-sm">{AuthorName}</Text>
                <View className="flex-row items-center mt-0.5">
                  {item.postType != 'X-Data' && (
                    <View className="bg-blue-100 px-1 py-0.5 rounded-full mr-1.5">
                      <Text className="text-blue-600 text-xs font-regular">• {item.contentType}</Text>
                    </View>
                  )}
                  {item.postType === 'X-Data' && (
                    <View className="bg-blue-100 px-0.5 py-0.5 rounded-full mr-1.5">
                      <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                    </View>
                  )}
                  <Text className="text-gray-500 text-xs mr-2">{getTimeAgo(item.ContentDate)}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              className="p-1.5"
              onPress={() => handleRemoveBookmark(item)}
            >
              <Ionicons name="bookmark" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
  
        <View className="px-3 py-2.5">
          <Text className="text-gray-800 text-sm leading-5 mb-2 font-normal" numberOfLines={3}>{renderStyledPostText(item.ContentDesc)}</Text>
  
          {renderRepostContent(item)}

          {item.postType !== "X-Data" && renderMediaContent(item, index)}
          <View className="flex-row items-center">
              <View className="flex-1"> 
                <View className="flex-row items-center mt-1.5">

                  <TouchableOpacity
                    className={`flex-row items-center mr-5 px-1.5 py-1`}
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
                    <Text className={`ml-1 text-xs font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                      {item.ContentLikeCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-row items-center mr-5 px-1.5 py-1`}
                    onPress={(e) => {
                      e.stopPropagation();
                      openCommentsModal(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="thumbs-up-down"
                      size={20}
                      color="#000000"
                    />
                    <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
                  </TouchableOpacity>
  
                  <TouchableOpacity
                    className={`flex-row items-center mr-5 px-1.5 py-1`}
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
                    <Text className={`ml-1 text-xs font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                      {item.ContentRepostCount}
                    </Text>
                  </TouchableOpacity>

                  {/* ✅ GRAPH WITH VIEW COUNT (LIKE X/TWITTER) */}
              <TouchableOpacity
                className="flex-row items-center mr-4 px-1.5 py-1"
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedGraphPostId(item.id);
                  setSelectedGraphPostType(item.postType);
                  setIsGraphModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Feather name="bar-chart-2" size={20} color="#64748b" />
                {item.ContentViewCount !== undefined && item.ContentViewCount > 0 && (
                  <Text className="text-gray-600 ml-1.5 text-xs font-medium">
                    {formatViewCount(item.ContentViewCount)}
                  </Text>
                )}
              </TouchableOpacity>

                </View>
          
              </View>

              <View className="flex-row items-center mt-1.5">
                <TouchableOpacity
                  className={`flex-row items-center mr-5 px-1.5 py-1`}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveBookmark(item);
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
                  className={`mr-2 p-1`}
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
      </EnhancedCard>
      </View>
      
    )
  } , [EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleRemoveBookmark, dummyAuthorImage, openCommentsModal, renderRepostContent]);

  const listItems = useMemo(() => {
    return filteredAndSortedPosts.map((item, index) => {
      initializeCardAnimation(item.uniqueId);
      
      return (
        <React.Fragment key={item.uniqueId}>
          {renderBookmarkedPost(item, index)}
        </React.Fragment>
      );
    });
  }, [filteredAndSortedPosts, initializeCardAnimation, renderBookmarkedPost]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-5">
        <View 
          className="px-4 py-2 flex-row items-center justify-between"
          style={{ paddingTop: Platform.OS === 'ios' ? 12 : 12 }}
        >
          <View className="flex-row items-center">
            <View>
              <Text className="text-3xl font-extrabold text-gray-900 pt-3">Bookmarks</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {bookmarkedPosts.length} saved post{bookmarkedPosts.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="bookmark" size={25} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter Section */}
        {false && (
          <View className="px-4 pb-4 mt-3">
          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
              <Ionicons name="search" size={20} color="#9ca3af" />
              <Text 
                className="flex-1 ml-3 text-gray-700 text-base"
                onPress={() => {
                  // You can implement a proper search input here
                  console.log("Search functionality to be implemented");
                }}
              >
                Search bookmarks...
              </Text>
              <Ionicons 
                name="filter" 
                size={20} 
                color="#9ca3af"
                onPress={() => {
                  // Implement sorting/filtering functionality here
                  console.log("Sort/filter functionality to be implemented");
                }}
              />
            </View>

          {/* Filter Buttons */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
          </ScrollView>
        </View>
        )}
        
      </View>

      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 6, 
          paddingBottom: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f59e0b']}
            tintColor="#f59e0b"
            title="Pull to refresh"
            titleColor="#64748b"
          />
        }
        onScroll={handleScroll}          
        scrollEventThrottle={16}    
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <LoadingComponent visible={true} size="large" />
          </View>
        ) : listItems.length > 0 ? (
          listItems
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <View className="bg-white p-8 rounded-2xl shadow-lg items-center max-w-sm mx-4">
              <View className="w-20 h-20 bg-black rounded-full items-center justify-center mb-6">
                <Ionicons name="bookmark-outline" size={36} color="#000" />
              </View>
              <Text className="text-gray-700 text-xl font-bold mb-3 text-center">No Bookmarks Yet</Text>
              <Text className="text-gray-500 text-center text-sm px-2 leading-6 mb-6">
                Start saving posts you love by tapping the bookmark icon on any post. They'll appear here for easy access later.
              </Text>
              <TouchableOpacity 
                className="bg-black px-6 py-3 rounded-xl flex-row items-center"
                onPress={() => router.push('/')}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Explore Posts</Text>
              </TouchableOpacity>
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

      <RepostModal
        visible={isRepostModalVisible}
        onClose={closeRepostModal}
        post={selectedRepostPost}
        onSimpleRepost={handleSimpleRepost}
        onQuoteRepost={handleQuoteRepost}
      />

      {/* COMMENTS MODAL */}
      <CommentsModal
        visible={isCommentModalVisible}
        onClose={closeCommentsModal}
        postId={selectedPostId}
        postType={selectedPostType}
        postData={bookmarkedPosts.find(item => item.id === selectedPostId) as (PostItem & { AuthorBio: string }) | undefined}
        commentTemplate={selectedCommentTemplate}
      />

      {/* GRAPH MODAL */}
      <TotalSentiment
        visible={isGraphModalVisible}
        onClose={closeGraphModal}
        postId={selectedGraphPostId}
        postType={selectedGraphPostType}
        postData={
          bookmarkedPosts.find(item => item.id === selectedGraphPostId)
            ? {
                ...(bookmarkedPosts.find(item => item.id === selectedGraphPostId)!),
                AuthorBio: bookmarkedPosts.find(item => item.id === selectedGraphPostId)!.AuthorBio ?? '',
                id: bookmarkedPosts.find(item => item.id === selectedGraphPostId)!.id // Ensure id is present
              }
            : undefined
        }
        onAddResponse={addResponseGraphModal} 
        userExistingComment={undefined} 
        onEditComment={undefined}
        commentTemplate={selectedCommentTemplate}
        />
    </SafeAreaView>
  );
}