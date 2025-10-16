import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import { VideoView, useVideoPlayer } from 'expo-video';
import { arrayRemove, arrayUnion, collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentsModal from '../../components/CommentsModal';
import { LoadingComponent } from '../../components/LoadingComponent';
import { showToast } from '../../utils/toast';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  bookmarkedAt?: any;
  CommentTemplate: string;
}

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
  const videoRefs = useRef<{ [key: string]: any }>({});
  const [fetchedXData, setFetchedXData] = useState<any>([]);

  // ------- COMMENT MODAL STATE -------
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedCommentTemplate, setSelectedCommentTemplate] = useState<string | null>(null);

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // State to track the URI of the video that is currently the 'primary' in view
  const [activeVideoUri, setActiveVideoUri] = useState<string | null>(null);

  // 1. Create a single VideoPlayer instance for the list
  const player = useVideoPlayer(activeVideoUri || null, (p) => {
    p.loop = true;
    p.play();
  });

  // 2. Define the viewability config (e.g., must be 50% visible)
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // 3. Callback function to update the active URI when viewability changes
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Find the first item that is currently in view
      const firstViewableItem = viewableItems.find(item => item.isViewable);

      if (firstViewableItem && firstViewableItem.item.uri !== activeVideoUri) {
        // Update the state, which triggers a re-render and updates the player source
        setActiveVideoUri(firstViewableItem.item.uri);
      } else if (!firstViewableItem && activeVideoUri) {
         // Optionally pause the player if no video is in view
         setActiveVideoUri(null);
      }
    },
    [activeVideoUri]
  );

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

  const handleShare = useCallback(async (postItem: PostItem) => {
    console.log("Share pressed:", postItem.id);
    
    // first check if sharing is available
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      showToast.error("Sharing is not available on this device");
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
      showToast.error("Failed to share post");
    }

    await new Promise(r => setTimeout(r, 200));
  }, []);

  // FIXED: Fetch bookmarked posts without problematic queries
  const handleFetchBookmarkedPosts = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    
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

          if(postData.BookmarkedBy?.includes(fetchuserID)) {
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

          if(postData.BookmarkedBy?.includes(fetchuserID)) {
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

        }

        const allData = postsData.concat(postsXData);
        setBookmarkedPosts(allData);
        console.log('OnSnapshot Fetched and Sorted', `Total: ${allData.length} documents`);

        allData.forEach(post => {
          //Fetching Comment and Reply Count
          onSnapshot(
            collection(doc(db, post.postType, post.id), 'Comments'),
            commentsSnap => {
              let totalComments = 0;
              totalComments = commentsSnap.size;
              
              commentsSnap.forEach(comment =>
                onSnapshot(
                  collection(doc(db, post.postType, post.id, 'Comments', comment.id), 'Replies'),
                  repliesSnap => {
                    totalComments += repliesSnap.size;
                    setBookmarkedPosts(prev =>
                      prev.map(p =>
                        p.id === post.id
                        ? { ...p, ContentCommentCount: totalComments }
                        : p
                      )
                    );
                  }
                )
              );
            }
          )

        });
        
      });
      
      return () => {
        unsubscribeSentinel();
        unsubscribeXData();
      };
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [dummyAuthorImage]);

  useEffect(() => {
    getItem();
    handleFetchBookmarkedPosts();
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

    await new Promise(r => setTimeout(r, 200));
  }, []);

  const handleRepost = useCallback(async (postItem: PostItem) => {
    console.log("Repost pressed:", postItem.id);
    
    setBookmarkedPosts(prevData => 
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

    await new Promise(r => setTimeout(r, 200));
  }, []);

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

  // OPTIMIZED MEDIA CONTENT
  const renderMediaContent = useCallback((item: PostItem, index?: number) => {
    const mediaUrls = item.ContentURLs && item.ContentURLs.length > 0 ? item.ContentURLs : 
                     (item.ContentURL ? [item.ContentURL] : []);
    
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const primaryMediaUrl = mediaUrls[0];
    const mediaType = getMediaType(primaryMediaUrl);
    const isActive = primaryMediaUrl === activeVideoUri;

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
            {isActive ? (
                // Only the currently active video renders the actual VideoView
                <VideoView 
                style={styles.video}
                player={player}
                allowsPictureInPicture
                nativeControls={true}
              />
              ) : (
                // Non-active videos show a static placeholder or thumbnail
                <View style={styles.video}>
                  {/*  */}
                  <Text style={styles.video}>Video: {item.id}</Text>
                </View>
              )}
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
    await handleFetchBookmarkedPosts(true);
    setRefreshing(false);
  }, [handleFetchBookmarkedPosts]);

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

  const renderBookmarkedPost = useCallback((item: PostItem, index: number) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => openCommentsModal(item)}
    >
        <EnhancedCard postId={item.uniqueId}>
      <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
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
              </View>
            </View>
          </View>
          <TouchableOpacity 
            className="p-1.5"
            onPress={() => handleRemoveBookmark(item)}
          >
            <Ionicons name="bookmark" size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-3 py-2.5">
        <Text className="text-gray-800 text-sm leading-5 mb-2 font-normal">{item.ContentDesc}</Text>

        {renderMediaContent(item, index)}

        <View className="flex-row items-center justify-between pt-1.5">
          <TouchableOpacity
            className="flex-row items-center px-1.5 py-1"
            onPress={(e) => {
              e.stopPropagation();
              toggleLike(item);
            }}
            activeOpacity={0.7}
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
            className="flex-row items-center px-1.5 py-1"
            onPress={(e) => {
              e.stopPropagation();
              openCommentsModal(item);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="thumbs-up-down"
              size={14}
              color="#000000"
            />
            <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-1.5 py-1 "
            onPress={(e) => {
              e.stopPropagation();
              handleRepost(item);
            }}
            activeOpacity={0.7}
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
              className="p-1.5"
              onPress={() => console.log("Graph pressed:", item.id)}
              activeOpacity={0.7}
            >
              <Feather name="bar-chart-2" size={16} color="#64748b" />
            </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-1.5 py-1"
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveBookmark(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="bookmark" 
              size={14} 
              color="#000" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            className="p-1"
            onPress={(e) => {
              e.stopPropagation();
              handleShare(item);
            }}
            activeOpacity={0.7}
          >
            <Feather name="share-2" size={12} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </EnhancedCard>
    </TouchableOpacity>
    
  ), [EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleRemoveBookmark, dummyAuthorImage, openCommentsModal]);

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
              <Text className="text-2xl font-bold text-gray-900 pt-3">Bookmarks</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {bookmarkedPosts.length} saved post{bookmarkedPosts.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="bookmark" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter Section */}
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
              <VideoView 
                style={styles.video}
                player={player}
                allowsPictureInPicture
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

      {/* COMMENTS MODAL */}
      <CommentsModal
        visible={isCommentModalVisible}
        onClose={closeCommentsModal}
        postId={selectedPostId}
        postType={selectedPostType}
        postData={bookmarkedPosts.find(item => item.id === selectedPostId)}
        commentTemplate={selectedCommentTemplate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * (9 / 16), // Example: 16:9 aspect ratio
  },
})