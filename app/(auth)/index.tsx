import { db } from '@/FirebaseConfig';
import { LoadingComponent } from '@/components/LoadingComponent';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';

import { router } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Linking, Modal, Platform, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import FlipCard from 'react-native-flip-card';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  Bookmarked?: boolean;
  createdAt?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Index(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fetchedData, setFetchedData] = useState<PostItem[]>([]);
  const [fetchedXData, setFetchedXData] = useState<any>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [commentsData, setCommentsData] = useState<{ [key: string]: number }>({});
  const [userRole, setUserRole] = useState("User");
  const [cardAnimations, setCardAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [fullScreenDoc, setFullScreenDoc] = useState<string | null>(null);
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [fullScreenCard, setFullScreenCard] = useState<PostItem | null>(null);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  
  // ✅ NEW: State for confirmation modal
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  
  const flipCardRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // ✅ MOVE filteredData EARLY - Before any usage
  const filteredData = useMemo(() => {
    return fetchedData.filter(item => {
      if (userRole === "User") {
        return item.isApproved;
      }
      return true;
    });
  }, [fetchedData, userRole]);

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

  // ✅ FIXED: Fetch comments from correct subcollection structure
  const fetchCommentsCount = useCallback(async (posts: PostItem[]) => {
    try {
      console.log('Starting to fetch comments for', posts.length, 'posts');
      const commentsCount: { [key: string]: number } = {};
      
      const commentPromises = posts.map(async (post) => {
        try {
          let totalComments = 0;
          
          const commentsRef = collection(db, post.postType, post.id, 'Comments');
          const commentsSnapshot = await getDocs(commentsRef);
          
          totalComments = commentsSnapshot.size;
          
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

  // ✅ ADDED: Bookmark function
  const handleBookmark = useCallback(async (postItem: PostItem) => {
    console.log("Bookmark pressed:", postItem.id);
    
    setFetchedData(prevData => 
      prevData.map(item => 
        item.uniqueId === postItem.uniqueId 
          ? { ...item, Bookmarked: !item.Bookmarked } 
          : item
      )
    );

    if (fullScreenCard && fullScreenCard.uniqueId === postItem.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Bookmarked: !prev.Bookmarked
      }) : null);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard]);

  // OPTIMIZED DATA FETCHING
  const handleFetchAllData = useCallback(async (forceRefresh: boolean = false) => {
    const currentTime = Date.now();
    const cacheValidTime = 5 * 60 * 1000;

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
            Bookmarked: false,
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
            Bookmarked: false,
            createdAt: postData.createdAt || postData.ContentDate,
          });
        }

        const allData = postsData.concat(postsXData);
        setFetchedData(allData);
        console.log('OnSnapshot Fetched and Sorted', `Total: ${allData.length} documents`);

        allData.forEach(post =>
          onSnapshot(
            collection(doc(db, post.postType, post.id), 'Comments'),
            commentsSnap => {
              setFetchedData(prev =>
                prev.map(p =>
                  p.id === post.id
                    ? { ...p, ContentCommentCount: commentsSnap.size }
                    : p
                )
              );
            }
          )
        );
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

  const getCommentsCount = useCallback((postId: string) => {
    return commentsData[postId] || 0;
  }, [commentsData]);
  
  // ✅ NEW: Show confirmation modal
  const showConfirmationModal = useCallback(() => {
    setIsConfirmationModalVisible(true);
  }, []);

  // ✅ NEW: Handle confirmation modal "Yes" button
  const handleConfirmYes = useCallback(() => {
    setIsConfirmationModalVisible(false);
    // Redirect to registration screen
    try {
      router.push("/(auth)/email-login");
    } catch (error) {
      console.error("error, ", error);
    }
  }, []);

  // ✅ NEW: Handle confirmation modal "No" button
  const handleConfirmNo = useCallback(() => {
    setIsConfirmationModalVisible(false);
  }, []);

  // Navigate to login screen (kept for backward compatibility, but now uses confirmation modal)
  const loginScreen = async () => {
    showConfirmationModal();
  }

  useEffect(() => {
    handleFetchAllData();
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

  // OPTIMIZED REFRESH
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered');
    await handleFetchAllData(true);
    setRefreshing(false);
  }, [handleFetchAllData]);
  
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
                style={{
                  width: '100%',
                  height: 200,
                  position: 'absolute',
                  opacity: 0.4,
                }}
                className="bg-white"
                resizeMode="cover"
                blurRadius={5}
              />
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{
                  width: '100%',
                  height: 200,
                }}
                resizeMode="contain"
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
              <Ionicons name="document-text-outline" size={32} color="#8B5CF6" />
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

  // ✅ ADDED: Graph/Analytics modal function
  const openGraphModal = useCallback((item: PostItem) => {
    console.log("Graph/Analytics pressed:", item.id);
    loginScreen();
  }, [loginScreen]);

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
          },
          {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
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

  const renderPostUserContent = useCallback((item: PostItem, index: number) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => openFullScreenCard(item)}
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

          <View className="flex-row items-center justify-between pt-1.5 ">
            <TouchableOpacity
              className="flex-row items-center px-1.5 py-1 "
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
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
              className="flex-row items-center px-1.5 py-1 "
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="thumbs-up-down"
                size={14}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-1.5 py-1 "
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
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
              onPress={() => {
                closeFullScreenCard();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <Feather name="bar-chart-2" size={16} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-1.5 py-1"
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                size={14} 
                color={item.Bookmarked ? "#f59e0b" : "#64748b"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-1"
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={12} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </EnhancedCard>
    </TouchableOpacity>
  ), [openFullScreenCard, EnhancedCard, getTimeAgo, renderMediaContent, dummyAuthorImage, loginScreen]);

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
            {renderPostUserContent(item, index)}
          </React.Fragment>
        );
      }
    });
  }, [filteredData, userRole, initializeCardAnimation, renderPostUserContent]);

  const handleFlipCard = useCallback(() => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setIsFlipped(!isFlipped);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 800);
  }, [isFlipped, isFlipping]);

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
                <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
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

          <View className="flex-row items-center justify-between pt-3  mb-3">
            <TouchableOpacity
              className="flex-row items-center px-2 py-1.5 "
              onPress={() => loginScreen()}
              activeOpacity={0.7}
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
              className="flex-row items-center px-2 py-1.5 "
              onPress={() => {
                closeFullScreenCard();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="thumbs-up-down"
                size={18}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-2 text-sm font-semibold">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-2 py-1.5 "
              onPress={() => loginScreen()}
              activeOpacity={0.7}
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
              className="p-1.5"
              onPress={() => {
                closeFullScreenCard();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <Feather name="bar-chart-2" size={16} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-2 py-1.5"
              onPress={() => loginScreen()}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                size={18} 
                color={item.Bookmarked ? "#f59e0b" : "#64748b"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-1.5"
              onPress={() => loginScreen()}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  ), [getTimeAgo, handleFlipCard, isFlipping, renderMediaContent, getCommentsCount, dummyAuthorImage, loginScreen, closeFullScreenCard]);

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
                  <MaterialCommunityIcons name="thumbs-up-down" size={16} color="#45b7d1" />
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
                        backgroundColor: item.isApproved ? '#4ade80' : '#f87171'
                      }} 
                    />
                    <Text className="text-white font-semibold text-sm">
                      {item.isApproved ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-white/70 text-xs">Published</Text>
                  <Text className="text-white font-semibold text-sm">{getTimeAgo(item.ContentDate)}</Text>
                </View>
              </View>
            </View>

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
                    alignItems: 'center' 
                  }}
                  onPress={() => {
                    closeFullScreenCard();
                    loginScreen();
                  }}
                >
                  <MaterialCommunityIcons name="thumbs-up-down" size={18} color="white" />
                  <Text className="text-white text-xs mt-1 font-medium">Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 8, 
                    paddingVertical: 10, 
                    alignItems: 'center' 
                  }}
                  onPress={() => {
                    closeFullScreenCard();
                    loginScreen();
                  }}
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
                    alignItems: 'center' 
                  }}
                  onPress={() => {
                    closeFullScreenCard();
                    loginScreen();
                  }}
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
  ), [handleFlipCard, isFlipping, getTimeAgo, userRole, getCommentsCount, closeFullScreenCard, loginScreen]);

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View className="bg-white border-b border-gray-200 pt-5">
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
          
          <TouchableOpacity className="p-2 rounded-full bg-gray-100 shadow-sm"
          onPress={(e) => {
            loginScreen();
          }}>
            <Image
              source={require("../../assets/images/Union.png")}
              className="w-5 h-5"
              resizeMode="contain"
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
      
      {/* ✅ NEW: CONFIRMATION MODAL */}
      <Modal
        visible={isConfirmationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleConfirmNo}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {/* Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="lock-closed" size={32} color="#3b82f6" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-900 text-center mb-3">
              Registration Required
            </Text>

            {/* Message */}
            <Text className="text-base text-gray-600 text-center mb-6 leading-6">
              You must be a registered user to interact with this post. Please register to proceed.
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-3">
              {/* No Button */}
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-3.5 rounded-xl"
                onPress={handleConfirmNo}
                activeOpacity={0.8}
              >
                <Text className="text-gray-700 font-semibold text-center text-base">
                  No
                </Text>
              </TouchableOpacity>

              {/* Yes Button */}
              <TouchableOpacity
                className="flex-1 bg-red-700 py-3.5 rounded-xl shadow-lg"
                onPress={handleConfirmYes}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-center text-base">
                  Yes, Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      {/* CARD MODAL */}
      {/* <Modal
        visible={isCardModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={closeFullScreenCard}
        statusBarTranslucent
      >
        {fullScreenCard && renderFullScreenFlipCard(fullScreenCard)}
      </Modal> */}
    </SafeAreaView>
  );
}
