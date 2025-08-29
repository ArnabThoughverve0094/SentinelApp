import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Linking, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import FlipCard from 'react-native-flip-card';

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
  const flipCardRef = useRef<any>(null);

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

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
    
    // if (!forceRefresh && isInitialized && fetchedData.length > 0 && 
    //     (currentTime - lastFetchTime) < cacheValidTime) {
    //   console.log('Using cached data, skipping fetch');
    //   return;
    // }

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
      
      // ✅ Fetch comments count after posts are loaded
      // await fetchCommentsCount(fetchedData);
      
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

  // ✅ Helper function to get actual comment counts
  const getCommentsCount = useCallback((postId: string) => {
    return commentsData[postId] || 0;
  }, [commentsData]);
  
  // Navigate to comments screen
  const loginScreen = async () => {
    try {
      router.push("/(auth)/email-login");
    } catch (error) {
      console.error("error, ", error);
    }
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
              height: 4,
            },
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
              {/* <View className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" /> */}
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
              className="flex-row items-center px-3 py-2 "
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
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
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={20}
                color="#64748b"
              />
              {/* ✅ FIXED: Shows actual comment count */}
              <Text className="text-gray-600 ml-2 text-sm font-medium">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-3 py-2 "
              onPress={(e) => {
                e.stopPropagation();
                loginScreen();
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
              className="p-2"
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
  ), [openFullScreenCard, EnhancedCard, getTimeAgo, renderMediaContent, dummyAuthorImage]);

  const filteredData = useMemo(() => {
    return fetchedData.filter(item => {
      if (userRole === "User") {
        return item.isApproved;
      }
      return true;
    });
  }, [fetchedData, userRole]);

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
            {renderPostUserContent(item)}
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
            {/* <View className="absolute top-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" /> */}
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
              className="flex-row items-center px-5 py-4 "
              onPress={() => loginScreen()}
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
              className="flex-row items-center px-5 py-4 "
              onPress={() => {
                closeFullScreenCard();
                loginScreen();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color="#64748b"
              />
              {/* ✅ FIXED: Shows actual comment count */}
              <Text className="text-gray-600 ml-3 text-lg font-semibold">{item.ContentCommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-5 py-4 "
              onPress={() => loginScreen()}
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
              className="p-4"
              onPress={() => console.log("Share pressed:", item.id)}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  ), [getTimeAgo, handleFlipCard, isFlipping, renderMediaContent, getCommentsCount, dummyAuthorImage]);

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
                {/* ✅ FIXED: Shows actual comment count */}
                <Text className="text-white font-bold text-xl">{item.ContentCommentCount}</Text>
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
                    loginScreen();
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
  ), [handleFlipCard, isFlipping, getTimeAgo, userRole, getCommentsCount]);

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

  
  // return (
  //   <SafeAreaView className="flex-1">
  //     <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
  //     {/* Background Image */}
  //     <ImageBackground 
  //       source={require('../../assets/images/page-bg.jpg')}
  //       className="flex-1"
  //       resizeMode="cover"
  //     >
  //       {/* Main content - NO OVERLAY */}
  //       <View className="flex-1 px-6 justify-center pt-64">
  //         {/* Logo positioned above welcome text */}
  //         <View className="items-start mb-8">
  //           <View className="w-14 h-14 rounded-xl bg-transparent justify-center items-center ">
  //             <Image 
  //               source={require('../../assets/images/Sentinal-logo-big.png')}
  //               className="w-12 h-12"
  //               resizeMode="contain"
  //             />
  //           </View>
  //         </View>

  //         {/* Welcome text section */}
  //         <View className="mb-16">
  //           <Text className="text-3xl font-bold text-black mb-3 leading-tight">
  //             Welcome to{'\n'}Sentinel
  //           </Text>
  //           <Text className="text-base text-black/80 leading-6">
  //             Connect with your community and stay updated every time, everywhere.
  //           </Text>
  //         </View>

  //         {/* Authentication buttons */}
  //         <View className="gap-3">
  //           <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg">
  //             <Image
  //               source={{ uri: 'https://developers.google.com/identity/images/g-logo.png'}}
  //               className="w-5 h-5"
  //               resizeMode="contain"
  //             />
  //             <Text className="text-base text-gray-700 font-medium ml-3">Continue with Google</Text>
  //           </TouchableOpacity>

  //           <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg">
  //             <Ionicons name="logo-apple" size={20} color="#000" />
  //             <Text className="text-base text-gray-700 font-medium ml-3">Continue with Apple</Text>
  //           </TouchableOpacity>

  //           <Link href="/(auth)/email-login" asChild>
  //             <TouchableOpacity className="bg-violet-500 py-4 px-6 rounded-xl items-center shadow-lg">
  //               <Text className="text-base text-white font-semibold">Continue with email</Text>
  //             </TouchableOpacity>
  //           </Link>

  //           <Text className="text-xs text-black/70 text-center mt-4 px-4">
  //             By continuing, you agree to the Sentinel's{' '}
  //             <Text className="text-violet-500 underline">Terms & Conditions</Text>
  //           </Text>
  //         </View>
  //       </View>
  //     </ImageBackground>
  //   </SafeAreaView>
  // );

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
          <TouchableOpacity className="p-3 rounded-full bg-gray-100 shadow-sm"
          onPress={(e) => {
            loginScreen();
          }}>
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
      {/* COMMENTS MODAL */}
      
    </SafeAreaView>
  );
}
