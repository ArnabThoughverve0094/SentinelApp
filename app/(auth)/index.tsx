import { db } from '@/FirebaseConfig';
import { LoadingComponent } from '@/components/LoadingComponent';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Linking, Modal, Platform, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
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
  isRepost?: boolean;
  originalPost?: PostItem;
  repostComment?: string;
  repostedBy?: string;
  repostedAt?: any;
  isAnonymous: boolean;
  contentType: string;
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

  //Repost modal
  const [isRepostModalVisible, setIsRepostModalVisible] = useState(false);
  const [selectedRepostPost, setSelectedRepostPost] = useState<PostItem | null>(null);
  
  // ✅ NEW: Scroll tracking and auth popup states
  const [scrollCount, setScrollCount] = useState(0);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const popupAnimation = useRef(new Animated.Value(0)).current;
  
  const flipCardRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

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
        style={{ 
          width: '100%', 
          aspectRatio: 16 / 9  // Changed from fixed height to aspectRatio
        }}
        contentFit="cover"  // Changed from "contain" to "cover"
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


  const navigateToAuthScreen = useCallback(() => {
    try {
      router.push("/popup");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, []);

  // ✅ NEW: Show popup animation
  useEffect(() => {
    if (showAuthPopup) {
      Animated.spring(popupAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(popupAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showAuthPopup]);

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
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: false,
            contentType: postData.contentType || 'My Thoughts',
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
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: postData.isAnonymous || false,
            contentType: postData.contentType || 'My Thoughts',
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

  useEffect(() => {
    handleFetchAllData();
  }, []);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered');
    await handleFetchAllData(true);
    setRefreshing(false);
  }, [handleFetchAllData]);
  
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
      } else {
        const dateObj = new Date(postDate.getTime());
        const year  = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const day   = String(dateObj.getDate()).padStart(2, '0');
        const hours   = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');

        // Example formatted string: "YYYY-MM-DD HH:mm"
        const formatted = `${year}-${month}-${day} ${hours}:${minutes}`;
        return `${formatted}`;
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
          <View className="relative rounded-xl overflow-hidden bg-gray-100">
            {/* Single Full-Width Image - No Blur Background */}
            <Image
              source={{ uri: primaryMediaUrl }}
              style={{
                width: '100%',
                aspectRatio: 16 / 9, // Adjust based on your preference (e.g., 4/3, 1/1)
              }}
              resizeMode="cover" // Changed from 'contain' to fill the entire area
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
          <View className="relative rounded-xl overflow-hidden bg-gray-100">
            {/* GIF - Full Width with Cover */}
            <Image
              source={{ uri: primaryMediaUrl }}
              style={{ 
                width: '100%', 
                aspectRatio: 16 / 9 
              }}
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


  // ✅ NEW: Handle scroll with counter for popup trigger
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const viewHeight = layoutMeasurement.height;
    const viewCenter = currentScrollY + viewHeight / 2;

    // Track scroll direction and count
    if (currentScrollY > lastScrollY + 100) {
      setScrollCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 2 && !showAuthPopup) { // Trigger after 2 scrolls
          setShowAuthPopup(true);
        }
        return newCount;
      });
      setLastScrollY(currentScrollY);
    }

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
  }, [filteredData, getMediaType, currentVideoIndex, lastScrollY, showAuthPopup]);

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
                  // source={{ uri: item?.AuthorImageURL || dummyAuthorImage }}
                  source={{uri: item?.AuthorImageURL || dummyAuthorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                  resizeMethod="resize"
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-sm">{(item.isAnonymous) ? 'Anonymous' : item.AuthorName}</Text>
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
              </View>
            </View>
              
            <Text className="text-gray-500 text-xs mr-5">{getTimeAgo(item.ContentDate)}</Text>

          </View>
        </View>

        <View className="px-3 py-2.5">
          <Text className="text-gray-800 text-sm leading-5 mb-2"  numberOfLines={2}>{item.ContentDesc}</Text>

          {renderRepostContent(item)}

          {renderMediaContent(item, index)}

          <View className="flex-row items-center">
              <View className="flex-1"> 
                <View className="flex-row items-center mt-1.5">

                  <TouchableOpacity
                    className="flex-row items-center px-1.5 py-1 mr-5"
                    onPress={(e) => {
                      e.stopPropagation();
                      navigateToAuthScreen();
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
                    className="flex-row items-center mr-5 px-1.5 py-1 "
                    onPress={(e) => {
                      e.stopPropagation();
                      navigateToAuthScreen();
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="thumbs-up-down"
                      size={20}
                      color="#64748b"
                    />
                    <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center mr-5 px-1.5 py-1 "
                    onPress={(e) => {
                      e.stopPropagation();
                      navigateToAuthScreen();
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
            
                  <TouchableOpacity 
                    className="mr-5 p-1.5"
                    onPress={(e) => {
                      e.stopPropagation();
                      navigateToAuthScreen();
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="bar-chart-2" size={20} color="#64748b" />
                  </TouchableOpacity>

                </View>
          
              </View>

              <View className="flex-row items-center mt-1.5">
                <TouchableOpacity
                  className="flex-row items-center mr-5 px-1.5 py-1"
                  onPress={(e) => {
                    e.stopPropagation();
                    navigateToAuthScreen();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={item.Bookmarked ? "#f59e0b" : "#64748b"} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  className="p-1"
                  onPress={(e) => {
                   e.stopPropagation();
                    navigateToAuthScreen();
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="share-2" size={20} color="#64748b" />
                </TouchableOpacity>
              
              </View>

            </View>

          {/* <View className="flex-row items-center justify-between pt-1.5 ">
            <TouchableOpacity
              className="flex-row items-center px-1.5 py-1 "
              onPress={(e) => {
                e.stopPropagation();
                navigateToAuthScreen();
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
              className="flex-row items-center px-1.5 py-1 "
              onPress={(e) => {
                e.stopPropagation();
                navigateToAuthScreen();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="thumbs-up-down"
                size={20}
                color="#64748b"
              />
              <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-1.5 py-1 "
              onPress={(e) => {
                e.stopPropagation();
                navigateToAuthScreen();
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
            
            <TouchableOpacity 
              className="p-1.5"
              onPress={(e) => {
                e.stopPropagation();
                navigateToAuthScreen();
              }}
              activeOpacity={0.7}
            >
              <Feather name="bar-chart-2" size={20} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-1.5 py-1"
              onPress={(e) => {
                e.stopPropagation();
                navigateToAuthScreen();
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={item.Bookmarked ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={item.Bookmarked ? "#f59e0b" : "#64748b"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-1"
              onPress={(e) => {
                e.stopPropagation();
                navigateToAuthScreen();
              }}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={20} color="#64748b" />
            </TouchableOpacity>
          </View> */}
        </View>
      </EnhancedCard>
    </TouchableOpacity>
  ), [openFullScreenCard, EnhancedCard, getTimeAgo, renderMediaContent, dummyAuthorImage, navigateToAuthScreen, renderRepostContent]);

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
      
      return (
        <React.Fragment key={item.uniqueId}>
          {renderPostUserContent(item, index)}
        </React.Fragment>
      );
    });
  }, [filteredData, initializeCardAnimation, renderPostUserContent]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View className="bg-white border-b border-gray-200">
        <View 
          className="px-4 py-3 flex-row items-center justify-between"
          style={{ paddingTop: Platform.OS === 'ios' ? 10 : 10 }}
        >
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
            className="p-2 rounded-full"
            onPress={navigateToAuthScreen}
          >
            <Ionicons name="search" size={30} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 6, 
          paddingBottom: 90, // Space for bottom nav + popup
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
      
      {/* ✅ FIXED BOTTOM NAVIGATION */}
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View className="flex-row items-center justify-around px-2 py-2">
          <TouchableOpacity 
            className="items-center justify-center"
            onPress={navigateToAuthScreen}
            style={{ flex: 1 }}
          >
            {/* <Ionicons name="home" size={26} color="#000" /> */}
            <MaterialIcons
              name="home"
              size={28}
              color="#000000"
            />
            <Text className="text-xs text-black mt-1 font-medium">Home</Text>
                        
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center justify-center"
            onPress={navigateToAuthScreen}
            style={{ flex: 1 }}
          >
            <Ionicons name="bookmark-outline" size={26} color="#64748b" />
            <Text className="text-xs text-gray-500 mt-1">Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center justify-center"
            onPress={navigateToAuthScreen}
            style={{ flex: 1 }}
          >
            <Ionicons name="add-circle-outline" size={26} color="#64748b" />
            <Text className="text-xs text-gray-500 mt-1">Create</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center justify-center"
            onPress={navigateToAuthScreen}
            style={{ flex: 1 }}
          >
            <Ionicons name="notifications-outline" size={26} color="#64748b" />
            <Text className="text-xs text-gray-500 mt-1">Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center justify-center"
            onPress={navigateToAuthScreen}
            style={{ flex: 1 }}
          >
            <Ionicons name="person-circle-outline" size={26} color="#64748b" />
            <Text className="text-xs text-gray-500 mt-1">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ AUTH POPUP - Appears after 2-3 scrolls */}
      {showAuthPopup && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 95 : 85,
            left: 16,
            right: 16,
            transform: [
              {
                translateY: popupAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                }),
              },
            ],
            opacity: popupAnimation,
          }}
        >
          <View className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <View className="bg-pink-50 px-5 py-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-bold text-gray-900">Welcome to Sentinel</Text>
                <TouchableOpacity onPress={() => setShowAuthPopup(false)}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 leading-5">
                Login now to stay updated with all the latest information near you
              </Text>
            </View>
            
            <View className="px-5 py-4 flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-black py-3 rounded-xl items-center"
                onPress={() => {
                  setShowAuthPopup(false);
                  router.push("/(auth)/register");
                }}
              >
                <Text className="text-white font-semibold text-sm">Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-1 bg-red-600 py-3 rounded-xl items-center"
                onPress={() => {
                  setShowAuthPopup(false);
                  router.push("/(auth)/email-login");
                }}
              >
                <Text className="text-white font-semibold text-sm">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
      
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
                resizeMethod="resize"
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
    </SafeAreaView>
  );
}