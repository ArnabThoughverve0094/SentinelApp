import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs,
  limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter,
  updateDoc, where, writeBatch
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView, Share, StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View, useWindowDimensions
} from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  [x: string]: any;
  AuthorBio: string;
  id: string;
  uniqueId: string;
  AuthorImageURL: string;
  AuthorName: string;
  AuthorNickName?: string
  AuthorUserID?: string;
  AuthorEmail?: string;
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
  contentType: string;
  isEducational: boolean;
moderationData?: {
  categories?: {
    harassment?: boolean;
    'harassment/threatening'?: boolean;
    hate?: boolean;
    'hate/threatening'?: boolean;
    illicit?: boolean;
    'illicit/violent'?: boolean;
    'self-harm'?: boolean;
    'self-harm/instructions'?: boolean;
    'self-harm/intent'?: boolean;
    sexual?: boolean;
    'sexual/minors'?: boolean;
    violence?: boolean;
    'violence/graphic'?: boolean;
  };
  checkedAt?: any;
  flagged?: boolean;
  violations?: string[];
};
ContentViewCount?: number;
ViewedBy?: string[];
isReported?: boolean;
  reportedAt?: any;
  reportReasons?: string[];
  reportedBy?: string[];
  moderationStatus?: string;
}

interface MediaCarouselProps {
  mediaUrls: string[];
  postId: string;
  onImagePress: (url: string) => void;
  onVideoPress: (url: string) => void;
  onDocPress: (url: string) => void;
  getMediaType: (url: string) => string;
  index?: number;
   currentVideoIndex: number;
}

type EmailResponse = {
  status: string;
  userName: string;
  email: string;
};

type ShortURLResponse = {
  shortURL: string;
  id: any;
};

interface VideoPlayerProps {
  videoUrl: string;
  index?: number;
  currentVideoIndex: number;
}

const VideoPlayerItem = React.memo(({ videoUrl, index, currentVideoIndex }: VideoPlayerProps) => {
  const isActive = currentVideoIndex === index;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  
  useEffect(() => {
    if (!player) return;
    // Small delay lets the native player finish attaching
    const timer = setTimeout(() => {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }, 150); // 150ms is enough for both Android & iOS
    return () => clearTimeout(timer);
  }, [isActive, player]);

  return (
    <View className="relative rounded-xl overflow-hidden bg-black">
      <VideoView
        player={player}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="cover"
        nativeControls={false}
      />
      {!isActive && (
        <View className="absolute inset-0 bg-black/20 items-center justify-center">
          <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center">
            <Ionicons name="play" size={20} color="white" />
          </View>
        </View>
      )}
    </View>
  );
});
const ironExBg = require('../../assets/images/ironex-bg.png');
// ✅ ExpandableText — fully self-contained, auto See More/See Less
  const ExpandableText = React.memo(({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [measured, setMeasured] = useState(false);

  if (!text) return null;

  return (
    <View>
      {/* Hidden text to measure actual line count */}
      {!measured && (
        <Text
          style={{ position: 'absolute', opacity: 0, fontSize: 14, lineHeight: 20 }}
          numberOfLines={0}
          onTextLayout={e => {
            if (!measured) {
              setShowButton(e.nativeEvent.lines.length > 3);
              setMeasured(true);
            }
          }}
        >
          {text}
        </Text>
      )}

      {/* Visible text */}
      <Text
        style={{ color: '#111827', fontSize: 14, lineHeight: 20, marginBottom: 4, fontWeight: '400' }}
        numberOfLines={expanded ? undefined : 3}
      >
        {renderStyledPostText(text)}
      </Text>

      {showButton && (
        <TouchableOpacity
          onPress={e => { e.stopPropagation(); setExpanded(prev => !prev); }}
          activeOpacity={0.7}
          style={{ marginBottom: 4 }}
        >
          <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>
            {expanded ? 'See Less' : 'See More'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});


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
  index,
  currentVideoIndex
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
          // ✅ CRITICAL SNAP PROPS
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          // Other props
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const offset = event.nativeEvent.contentOffset.x;
            const activeSlide = Math.min(
              Math.max(Math.round(offset / ITEM_WIDTH), 0),
              mediaUrls.length - 1
            );
            setCurrentSlide(activeSlide);
          }}
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
                      <View className="absolute top-2 right-6 p-1.5 rounded-full bg-black/50">
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
                     <VideoPlayerItem
                      videoUrl={mediaUrl}
                      index={index}
                      currentVideoIndex={currentVideoIndex}  // pass from parent
                    />
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
      {/* Media Counter Badge */}
      {mediaUrls.length > 1 && (
        <View className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70">
          <Text className="text-white text-xs font-semibold">
            {currentSlide + 1}/{mediaUrls.length}
          </Text>
        </View>
      )}
    </View>
  );
});

// Tab Header Component
// Update the type definitions
const TabHeader: React.FC<{
  activeTab: 'forYou' | 'following' | 'educational';
  onTabChange: (tab: 'forYou' | 'following' | 'educational') => void;
}> = ({ activeTab, onTabChange }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const tabWidth = screenWidth * 0.33;

  const tabIndexMap: Record<string, number> = {
    forYou: 0,
    educational: 1,
    following: 2,
  };

  const saveLastTab = useCallback(async (tab: string) => {
    try {
      await AsyncStorage.setItem('createType', tab);
    } catch (error) {
      console.error('Error saving tab name:', error);
    }
  }, []);

  useEffect(() => {
    // ✅ Stop any in-progress animation before starting new one — key for rapid tapping
    slideAnim.stopAnimation(() => {
      Animated.timing(slideAnim, {
        toValue: tabIndexMap[activeTab],
        duration: 60,              // ⚡ Ultra-fast: barely noticeable delay
        easing: Easing.linear,      // ⚡ No ease-in/out lag, starts instantly
        useNativeDriver: true,      // ⚡ Off JS thread = no bridge overhead
      }).start();
    });

    if (scrollViewRef.current) {
      const scrollX = activeTab === 'following' ? tabWidth : 0;
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }

    // ✅ Never blocks the animation — deferred to after interaction settles
    InteractionManager.runAfterInteractions(() => {
      saveLastTab(activeTab);
    });
  }, [activeTab]);

  const indicatorStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, tabWidth, tabWidth * 2],
        }),
      },
    ],
  };

  return (
    <View className="bg-white border-b border-gray-200">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        <View className="flex-row">
          {/* Published Posts Tab */}
          <TouchableOpacity
            className={`py-4 items-center justify-center ${
              activeTab === 'forYou' ? 'bg-white' : 'bg-gray-50'
            }`}
            style={{ width: tabWidth }}
            onPress={() => onTabChange('forYou')}
            activeOpacity={0.6}
          >
            <Text className={`text-base font-semibold ${
              activeTab === 'forYou' ? 'text-black' : 'text-gray-500'
            }`}>
              React
            </Text>
          </TouchableOpacity>

          {/* Educational Tab — pill UI unchanged ✅ */}
          <TouchableOpacity
            className="py-3 items-center justify-center bg-gray-50"
            style={{ width: tabWidth }}
            onPress={() => onTabChange('educational')}
            activeOpacity={0.6}
          >
            <View
              style={{
                backgroundColor: activeTab === 'educational' ? '#EFFAAB' : 'transparent',
                borderRadius: activeTab === 'educational' ? 999 : 0,
                paddingVertical: activeTab === 'educational' ? 6 : 0,
                paddingHorizontal: activeTab === 'educational' ? 18 : 0,
                alignSelf: 'center',
              }}
            >
              <Text className={`text-base font-semibold ${
                activeTab === 'educational' ? 'text-black' : 'text-gray-500'
              }`}>
                Learn
              </Text>
            </View>
          </TouchableOpacity>

          {/* Following Tab */}
          <TouchableOpacity
            className={`py-4 items-center justify-center ${
              activeTab === 'following' ? 'bg-white' : 'bg-gray-50'
            }`}
            style={{ width: tabWidth }}
            onPress={() => onTabChange('following')}
            activeOpacity={0.6}
          >
            <Text className={`text-base font-semibold ${
              activeTab === 'following' ? 'text-black' : 'text-gray-500'
            }`}>
              Following
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Animated Indicator */}
      <View style={{ height: 2 }}>
        <Animated.View style={[{
          position: 'absolute',
          bottom: 0,
          height: 2,
          width: tabWidth,
          backgroundColor: '#000000',
        }, indicatorStyle]} />
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
  const insets = useSafeAreaInsets();
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dark backdrop — tap outside to close */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* White card — sits ABOVE the backdrop */}
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: 'white',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            marginHorizontal: 16,
            marginBottom: insets.bottom + 24, // ✅ lifts card above nav bar/back button
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 12,
          },
        ]}
      >
        {/* ── Header ── */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
              Share this post
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 8,
                borderRadius: 999,
                backgroundColor: '#F3F4F6',
              }}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>

          {/* Post preview */}
          <View
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Image
                source={{ uri: AuthorImage || dummyAuthorImage }}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                resizeMode="cover"
                resizeMethod="resize"
              />
              <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>
                {AuthorName}
              </Text>
            </View>
            <ExpandableText text={post.ContentDesc} />
          </View>

          {/* Quote text input (only in quote mode) */}
          {isQuoteMode && (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 12,
                  padding: 12,
                  color: '#111827',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Add your comment..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={repostComment}
                onChangeText={setRepostComment}
                maxLength={280}
              />
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' }}>
                {repostComment.length}/280
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>

            {/* Repost button */}
            <TouchableOpacity
              onPress={handleSimpleRepost}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="repeat" size={18} color="#64748b" />
                <Text style={{ marginLeft: 8, color: '#374151', fontWeight: '600' }}>
                  Repost
                </Text>
              </View>
            </TouchableOpacity>

            {/* Quote button (only in quote mode) */}
            {isQuoteMode && (
              <TouchableOpacity
                onPress={handleQuoteRepost}
                activeOpacity={0.8}
                disabled={!repostComment.trim()}
                style={{
                  flex: 1,
                  backgroundColor: repostComment.trim() ? '#000' : '#D1D5DB',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="comment-quote"
                    size={18}
                    color={repostComment.trim() ? 'white' : '#9CA3AF'}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontWeight: '600',
                      color: repostComment.trim() ? 'white' : '#6B7280',
                    }}
                  >
                    Quote
                  </Text>
                </View>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </Animated.View>

    </KeyboardAvoidingView>
  </Modal>
);
};

// Custom Modal Component with better UI
interface CustomModalProps {
  visible: boolean;
  loading?: boolean;
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
  loading = false, // Default to false
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
                  {/* {buttons.map((button, index) => (
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
                  ))} */}
                  {buttons.map((button, index) => {
                    // Check if THIS specific button is the action button (not Cancel)
                    const isActionButton = button.style !== 'cancel';
                    const showLoader = loading && isActionButton;

                    return (
                      <TouchableOpacity
                        key={index}
                        disabled={loading} // Disable ALL buttons while loading
                        className={`flex-1 py-4 px-6 rounded-xl items-center shadow-lg ${
                          button.style === 'cancel' 
                            ? 'bg-gray-200' 
                            : button.style === 'destructive'
                            ? 'bg-red-500'
                            : 'bg-black'
                        } ${loading ? 'opacity-70' : ''}`} // Dim the buttons while loading
                        onPress={button.onPress}
                        activeOpacity={0.8}
                      >
                        {showLoader ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className={`text-lg font-semibold ${
                            button.style === 'cancel' ? 'text-gray-700' : 'text-white'
                          }`}>
                            {button.text}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
  function buildInterleavedFeed<T extends { postType: string; ContentDate: string; createdAt?: any }>(
    sentinelPosts: T[],
    xPosts: T[],
    sentinelChunk: number = 20,
    xChunk: number = 10
  ): T[] {
    const toMs = (date: any): number => {
      if (!date) return 0;
      if (typeof date === 'object' && date?.toDate) return date.toDate().getTime();
      if (date instanceof Date) return date.getTime();
      return new Date(date).getTime();
    };

    const sentinels = [...sentinelPosts].sort(
      (a, b) => toMs(b.createdAt ?? b.ContentDate) - toMs(a.createdAt ?? a.ContentDate)
    );
    const xData = [...xPosts].sort(
      (a, b) => toMs(b.createdAt ?? b.ContentDate) - toMs(a.createdAt ?? a.ContentDate)
    );

    const result: T[] = [];
    let si = 0;
    let xi = 0;

    while (si < sentinels.length || xi < xData.length) {
      for (let i = 0; i < sentinelChunk && si < sentinels.length; i++, si++) {
        result.push(sentinels[si]);
      }
      for (let i = 0; i < xChunk && xi < xData.length; i++, xi++) {
        result.push(xData[xi]);
      }
    }

    return result;
  }

  /**
   * Returns the best time window (in ms) that contains at least `minCount` posts.
   * Automatically scales from 24 hours all the way to "all time".
   */
  function getAdaptiveTimeWindow(
    posts: { createdAt?: any; ContentDate?: any }[],
    minCount: number = 5
  ): number {
    const now = Date.now();

    const WINDOWS_MS = [
      24, 48, 72, 96, 120, 144,
      24 * 7,
      24 * 14,
      24 * 30,
      24 * 90,
      24 * 180,
      24 * 365,
      Infinity,
    ].map(h => h === Infinity ? Infinity : h * 60 * 60 * 1000);

    const toMs = (date: any): number => {
      if (!date) return 0;
      if (typeof date === 'object' && date?.toDate) return date.toDate().getTime();
      if (date instanceof Date) return date.getTime();
      return new Date(date).getTime();
    };

    for (const windowMs of WINDOWS_MS) {
      const cutoff = now - windowMs;
      const count = posts.filter(p => toMs(p.createdAt ?? p.ContentDate) >= cutoff).length;
      if (count >= minCount || windowMs === Infinity) return windowMs;
    }

    return Infinity;
  }

export default function SentinelFeed(): React.JSX.Element {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userNickName, setUserNickName] = useState<string>("");
  const [userProfilePicURL, setUserProfilePicURL] = useState<string>("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [fetchedData, setFetchedData] = useState<PostItem[]>([]);
  const [sentinelData, setSentinelData] = useState<PostItem[]>([]);
  const [fetchedXData, setFetchedXData] = useState<PostItem[]>([]);
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

  const [activeTab, setActiveTab] = useState<'forYou' | 'following' | 'educational'>('forYou');
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
  const [selectedPostUserId, setSelectedPostUserId] = useState<string | null>(null);

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

  //Lasy loading
  const [lastVisible, setLastVisible] = useState<any>(null); // Use the correct Snapshot type if possible
  const [hasMore, setHasMore] = useState(true); // To check if there are more documents to load
  const BATCH_SIZE = 20; // Define your lazy load batch size
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleteUserModalVisible, setIsDeleteUserModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [selectedReportReasons, setSelectedReportReasons] = useState<string[]>([]);

  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const [blockUserEmail, setBlockUserEmail] = useState<string | null>(null);
  const [blockUserName, setBlockUserName] = useState<string | null>(null);
  const [allBlockedIds, setAllBlockedIds] = useState<any>([]);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  

  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const viewTrackingTimeout = useRef<NodeJS.Timeout | number | null>(null);
  const lastTrackedPost = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const [sharingId, setSharingId] = useState(null);
  const initializeAllViewCounts = async () => {
  try {
    console.log('🔧 Starting view count initialization...');
    
    // const collections = ['SentinelPosts', 'X-Data']; // single collection for all
    const collections = ['SentinelPosts'];
    let totalUpdated = 0;
    
    for (const collectionName of collections) {
      const postsRef = collection(db, collectionName);
      const snapshot = await getDocs(postsRef);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        
        // Only update if missing view count fields
        if (!('ContentViewCount' in data)) {
          batch.update(docSnap.ref, {
            ContentViewCount: 0,
            ViewedBy: [],
            lastViewUpdate: serverTimestamp()
          });
          batchCount++;
        }
      });
      
      if (batchCount > 0) {
        await batch.commit();
        totalUpdated += batchCount;
        console.log(`✅ Initialized ${batchCount} posts in ${collectionName}`);
      }
    }
    
    console.log(`✅ Total posts initialized: ${totalUpdated}`);
    
    if (totalUpdated === 0) {
      console.log('✅ All posts already have view counts!');
    }
    
  } catch (error) {
    console.error('❌ Error initializing view counts:', error);
  }
};

// Call this ONCE when app loads (add to useEffect)
useEffect(() => {
  const runOnce = async () => {
    const hasInitialized = await AsyncStorage.getItem('viewCountsInitialized');
    if (!hasInitialized) {
      await initializeAllViewCounts();
      await AsyncStorage.setItem('viewCountsInitialized', 'true');
    }
  };
  runOnce();
}, []);

  const handleNavigateToProfile = useCallback((
  targetUserId: string,
  authorName: string,
  authorImageUrl: string,
  isAnonymous?: boolean   // ← add this new param
) => {
  // 🔒 Block profile open for anonymous users
  if (isAnonymous) {
    Toast.show({
      type: 'info',
      text1: 'Anonymous User',
      text2: 'This user posted anonymously. Profile is hidden.',
      position: 'bottom',
      visibilityTime: 2500,
    });
    return;
  }

  router.push({
    pathname: "/profile/[userId]",
    params: { userId: targetUserId, authorName, authorImageUrl, isAnonymous: 'false' },
  });
}, [router]);

     
    
const trackPostView = useCallback(async (postId: string, postType: string) => {
  try {
    if (!userId || !postId) return;
    if (viewedPosts.has(postId)) return;

    // const collectionName = postType === 'X-Data' ? 'X-Data' : 'SentinelPosts'; //single collection for all
    const collectionName = 'SentinelPosts';
    
    // ✅ FIX: Strip 'x-' prefix if present (uniqueId vs id mismatch)
    const cleanPostId = postId.startsWith('x-') ? postId.replace('x-', '') : postId;
    
    console.log('📊 Tracking view for:', { postId, cleanPostId, postType, collectionName });

    const postRef = doc(db, collectionName, cleanPostId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.warn(`❌ Post ${cleanPostId} not found in ${collectionName}`);
      return;
    }

    const postData = postDoc.data();
    const currentViewCount = postData.ContentViewCount || 0;
    const newCount = currentViewCount + 1;
    const currentViewedBy = postData.ViewedBy || [];
    const hasViewed = currentViewedBy.includes(userId);

    await updateDoc(postRef, {
      ContentViewCount: newCount,
      ViewedBy: hasViewed ? currentViewedBy : arrayUnion(userId),
      lastViewUpdate: new Date()
    });

    console.log(`✅ View tracked: ${collectionName}/${cleanPostId} → ${newCount} views`);

    // Optimistic UI update - use original postId to match local state
    setFetchedData(prev =>
      prev.map(p =>
        p.id === postId || p.id === cleanPostId
          ? { ...p, ContentViewCount: newCount }
          : p
      )
    );

    // if (postType === 'X-Data') {
    //   setFetchedXData(prev =>
    //     prev.map(p =>
    //       p.id === postId || p.id === cleanPostId
    //         ? { ...p, ContentViewCount: newCount }
    //         : p
    //     )
    //   );
    // }

    setViewedPosts(prev => new Set(prev).add(postId));

  } catch (error) {
    console.error('❌ Error tracking view:', error);
  }
}, [userId, viewedPosts]);





    useEffect(() => {
    // Reset viewed posts when switching tabs
    setViewedPosts(new Set());
    console.log(`🔄 Reset viewed posts for tab: ${activeTab}`);
  }, [activeTab]);
  // Add this temporarily to check your Firebase collections
const debugFirebaseCollections = async () => {
  try {
    // Check X-Data collection
    // const xDataRef = collection(db, 'X-Data');
    // const xDataSnapshot = await getDocs(query(xDataRef, limit(1)));
    
    // if (!xDataSnapshot.empty) {
    //   const sampleDoc = xDataSnapshot.docs[0];
    //   console.log('✅ X-Data Collection Structure:', {
    //     id: sampleDoc.id,
    //     data: sampleDoc.data(),
    //     hasViewCount: 'ContentViewCount' in sampleDoc.data(),
    //     hasViewedBy: 'ViewedBy' in sampleDoc.data()
    //   });
    // } else {
    //   console.log('❌ X-Data collection is empty');
    // }

    // Check SentinelPosts collection
    const sentinelRef = collection(db, 'SentinelPosts');
    const sentinelSnapshot = await getDocs(query(sentinelRef, limit(1)));
    
    if (!sentinelSnapshot.empty) {
      const sampleDoc = sentinelSnapshot.docs[0];
      console.log('✅ SentinelPosts Collection Structure:', {
        id: sampleDoc.id,
        data: sampleDoc.data(),
        hasViewCount: 'ContentViewCount' in sampleDoc.data(),
        hasViewedBy: 'ViewedBy' in sampleDoc.data()
      });
    }
  } catch (error) {
    console.error('❌ Error checking Firebase collections:', error);
  }
};

// Call this in useEffect once
useEffect(() => {
  debugFirebaseCollections();
}, []);






    const reportReasons = [
    'Spam or misleading content',
    'Harassment or bullying',
    'Hate speech or discrimination',
    'Violence or dangerous content',
    'False information',
    'Inappropriate content',
    'Copyright violation',
    'Other'
    ];
    const closeReportModal = useCallback(() => {
      setIsReportModalVisible(false);
      setReportPostId(null);
      setSelectedReportReasons([]);
    }, []);

    const toggleReportReason = useCallback((reason: string) => {
      setSelectedReportReasons(prev => {
        if (prev.includes(reason)) {
          return prev.filter(r => r !== reason);
        } else {
          return [...prev, reason];
        }
      });
    }, []);

    const handleReportSubmit = useCallback(async () => {
      if (selectedReportReasons.length === 0 || !reportPostId) {
        Toast.show({
          type: "error",
          text1: "Selection Required",
          text2: "Please select at least one reason for reporting.",
          position: "bottom",
          visibilityTime: 3000,
        });
        return;
      }

      try {
        const postRef = doc(db, "SentinelPosts", reportPostId);
    
        // ✅ CHECK IF USER ALREADY REPORTED THIS POST
        const currentPost = fetchedData.find((item) => item.id === reportPostId);
        if (currentPost?.reportedBy?.includes(userId)) {
          Toast.show({
            type: "info",
            text1: "Already Reported",
            text2: "You have already reported this post.",
            position: "bottom",
            visibilityTime: 3000,
          });
          closeReportModal();
          return;
        }

        // Data objects for the arrays
        const reporterData = {
          userId: userId,
          userEmail: userEmail || '',
          userName: userName || '',
          userNickName: userNickName || '',
          profilePicUrl: userProfilePicURL || ''
        };

        // Update the post with report flag and details
        await updateDoc(postRef, {
          isReported: true,
          reportedAt: new Date(),
          reportReasons: arrayUnion(...selectedReportReasons),
          reportedBy: arrayUnion(userId),
          reporterData: arrayUnion(reporterData),
          isNew: true,
          isApproved: false,
          moderationStatus: "pending-review",
        });

        // Update local state...
        setFetchedData((prevData) =>
          prevData.map((item) =>
            item.id === reportPostId
              ? {
                ...item,
                isReported: true,
                reportedAt: new Date(),
                reportReasons: [
                  ...(item.reportReasons || []),
                  ...selectedReportReasons,
                ],
                reportedBy: [...(item.reportedBy || []), userId],
                isNew: true,
              isApproved: false,
              moderationStatus: "pending-review",
            }
          : item
          )
        );

        closeReportModal();

        Toast.show({
          type: "success",
          text1: "Report Submitted",
          text2: "Thank you for helping keep our community safe.",
          position: "bottom",
          visibilityTime: 3000,
        });

        console.log("Post reported successfully:", reportPostId);
        console.log("Report reasons:", selectedReportReasons);
        console.log("Reported by:", userId);
        // ✅ NEW: Notify the post author that their post was reported
        try {
          const reportedPost = fetchedData.find(item => item.id === reportPostId);
          const postAuthorId = reportedPost?.AuthorUserID;

          if (postAuthorId && postAuthorId !== userId) { // Don't notify if user reports own post
            const reportNotifyPayload = {
              id: `post_reported_${reportPostId}_${Date.now()}`,
              AuthorImageURL: 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg',
              AuthorName: 'IronEx Safety',
              AuthorUserID: userId,
              ContentDate: new Date(),
              NotifyType: 'post_reported',
              ShowButtons: false,
              Status: 'reported',
              Description: `🚩 Your post has been reported by a community member.Your post is now under admin review and may be temporarily hidden until reviewed.\n\nReason(s):\n• ${selectedReportReasons.join('\n• ')}.\n\n`,
              isRead: false,
            };

            let reportNotifSent = false;
            for (const docUser of notificationDetails) {
              if (docUser.userID === postAuthorId) {
                await updateDoc(doc(db, 'SentinelUsers', docUser.docID), {
                  Notification: arrayUnion(reportNotifyPayload),
                });
                reportNotifSent = true;
                console.log('Report notification sent to post author:', postAuthorId);
                break;
              }
            }
            if (!reportNotifSent) {
              await addDoc(collection(db, 'SentinelUsers'), {
                userID: postAuthorId,
                Notification: [reportNotifyPayload],
              });
            }
          }
        } catch (reportNotifError) {
          console.error('Report notification error (non-critical):', reportNotifError);
        }
      } catch (error) {
      console.error("Error reporting post:", error);
      Toast.show({
        type: "error",
        text1: "Report Failed",
        text2: "Failed to submit report. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
    }, [selectedReportReasons, reportPostId, userId, closeReportModal, fetchedData]);

    const closeBlockUserModal = useCallback(() => {
      setIsBlockModalVisible(false);
      setBlockUserId(null);
    }, []);



        const openUserProfile = useCallback((item: PostItem) => {
          // 🔒 Block profile open for anonymous posts
          if (item.isAnonymous) {
            Toast.show({
              type: 'info',
              text1: 'Anonymous Post',
              text2: 'This user posted anonymously. Profile is not available.',
              position: 'bottom',
              visibilityTime: 2500,
            });
            return;
          }

          const authorId = item.AuthorUserID || item.repostedBy;
          if (!authorId) return;

          router.push({
            pathname: "/profile/[userId]",
            params: {
              userId: authorId || '12345',
              userEmail: item.AuthorEmail ?? '',
              authorName: item.AuthorName || 'Anonymous',
              userNickName: item.AuthorNickName ?? '',
              authorImageUrl: item.AuthorImageURL,
              isAnonymous: 'false',
              userBio: item.AuthorBio ?? '',
            },
          });
        }, [router]);


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
    if (item.postType.includes('X-Data')) {
      return false;
    } else {
      if (item.isApproved) {
        return false;
      } else {
        return true;
      }
    }
    // return !item.isApproved || !item.isNew;
  }, []);

  const fetchUserFollowing = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if (fetchuserID === "") {
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }

      if (fetchuserID) {
        console.log('👤 Fetching following list for user:', fetchuserID);

        const userDocRef = doc(db, 'IronExUsers', fetchuserID);

        const unsubscribeFollowing = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();

            // 1. Get the Array of following objects
            const followingList: any[] = data.Following || [];
            const idOnlyList: string[] = followingList.map(item => item.userId);

            console.log(`✅ Displaying ${followingList.length} following`);
            setFollowingUserIds(idOnlyList);
          }
        }, (error) => {
          console.error("❌ Real-time listener failed:", error);
          setFollowingUserIds([]);
        });

        return unsubscribeFollowing;
      }
    } catch (error) {
      console.error('❌ Error fetching following list:', error);
      setFollowingUserIds([]);
    }
  }, [userId]);

    // const fetchAllUsersForNotifications = useCallback(async () => {
    //   try {
    //     const sentinelUsersRef = collection(db, 'SentinelUsers');
    //     const q = query(sentinelUsersRef);

    //     const unsubscribe = onSnapshot(q, (snapshot) => {
    //       const notificationlist = snapshot.docs.map(doc => ({
    //         docID: doc.id,
    //         userID: doc.data().userID,
    //       }));

    //       console.log('✅ All users notification list updated:', notificationlist);
    //       setNotificationDetails(notificationlist);
    //     }, (error) => {
    //       console.error('❌ Error fetching all users:', error);
    //       setNotificationDetails([]);
    //     });

    //     return unsubscribe;
    //   } catch (error) {
    //     console.error('❌ Error in fetchAllUsersForNotifications:', error);
    //     setNotificationDetails([]);
    //   }
    // }, []);

    useEffect(() => {
      let unsubFollowing: (() => void) | undefined;
      let unsubNotifications: (() => void) | undefined;
      let mounted = true;

      (async () => {
        try {
          const u1 = await fetchUserFollowing();
          if (mounted) unsubFollowing = u1;
          // const u2 = await fetchAllUsersForNotifications();
          // if (mounted) unsubNotifications = u2;
        } catch (err) {
          console.error('Error initializing listeners:', err);
        }
      })();

      return () => {
        mounted = false;
        if (unsubFollowing) unsubFollowing();
        // if (unsubNotifications) unsubNotifications();
      };
    }, [fetchUserFollowing]);
  // }, [fetchUserFollowing, fetchAllUsersForNotifications]);




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
      // } else if (diffInWeeks < 4) {
      //   return `${diffInWeeks}w ago`;
      // } else if (diffInMonths < 12) {
      //   return `${diffInMonths}mo ago`;
      } else {
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
        // return `${diffInYears}y ago`;
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
      const fetchuserName = await AsyncStorage.getItem('userName');
      const fetchuserEmail = await AsyncStorage.getItem('userEmail');
      if(fetchuserID !== null) {
        setUserId(fetchuserID);
      }
      if(fetchuserRole !== null) {
        setUserRole(fetchuserRole);
      }
      if(fetchuserName !== null) {
        setUserName(fetchuserName);
      }
      if(fetchuserEmail !== null) {
        setUserEmail(fetchuserEmail);
      }
      const fetchUserNickName = await AsyncStorage.getItem("userNickName") || '';
      if (fetchUserNickName !== null) setUserNickName(fetchUserNickName);

      const fetchUserProfilePicURL = await AsyncStorage.getItem("profilePicUrl") || '';
      if (fetchUserProfilePicURL !== null) setUserProfilePicURL(fetchUserProfilePicURL);
    } catch (error) {
      console.log("Error retrieving userId", error);
    }
  }, []);

  const fetchSinglePostComments = useCallback(async (postId: string, postType: string) => {
    try {
      let totalComments = 0;
      
      const commentsRef = collection(db, "SentinelPosts", postId, 'Comments');
      const commentsSnapshot = await getDocs(commentsRef);
      
      totalComments = commentsSnapshot.size;
      
      for (const commentDoc of commentsSnapshot.docs) {
        const repliesRef = collection(db, "SentinelPosts", postId, 'Comments', commentDoc.id, 'Replies');
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

  const sentinelUnsubscribeRef = useRef(null);

  const handleFetchAllData = useCallback(async (forceRefresh: boolean = false) => {
    const currentTime = Date.now();
    
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    // if (!forceRefresh && isInitialized && (currentTime - lastFetchTime < 10000)) {
    //   return;
    // }

    if (sentinelUnsubscribeRef.current) {
      sentinelUnsubscribeRef.current();
  }

    setLoading(true);
    try {
      const collSentinelRefPost = collection(db, 'SentinelPosts');
      let querySentinel;
      if (activeTab === 'educational') {
        querySentinel = query(
          collSentinelRefPost,
          where('isEducational', '==', true),
          orderBy('ContentDate', 'desc'),
          limit(BATCH_SIZE)
        );
      } else {
        querySentinel = query(
          collSentinelRefPost,
          orderBy('ContentDate', 'desc'),
          limit(BATCH_SIZE)
        );
      }

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
            AuthorImageURL: postData.AuthorImageURL|| '',
            AuthorName: postData.AuthorName|| '',
            AuthorNickName: postData.AuthorNickName|| '',
            AuthorEmail: postData.AuthorEmail|| '',
            AuthorBio: postData.AuthorBio || postData.Bio || '',  // ✅ ADD THIS
            AuthorUserID: postData.AuthorUserID || postData.repostedBy || '123456',
            ContentDate: postData.ContentDate|| '',
            ContentDesc: postData.ContentDesc|| '',
            ContentURL: postData.ContentURL|| '',
            ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
            ContentLikeCount: postData.ContentLikeCount || 0,
            ContentRepostCount: postData.ContentRepostCount || 0,
            ContentCommentCount: postData.ContentCommentCount || 0,
            isApproved: postData.isApproved || false,
            isNew: postData.isNew !== undefined ? postData.isNew : true,
            postType: postData.postType || "SentinelPosts",
            Liked: (postData.LikedBy?.includes(fetchuserID) || false),
            Reposted: (postData.RepostedBy?.includes(fetchuserID) || false),
            Bookmarked: (postData.BookmarkedBy?.includes(fetchuserID) || false),
            createdAt: postData.createdAt || postData.ContentDate,
            CommentTemplate: postData.CommentTemplate || "Standard Template",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: postData.isAnonymous || false,
            contentType: postData.contentType ?? 'My Thoughts',
            isEducational: postData.isEducational === true || postData.contentType === 'Educational',
            moderationData: postData.moderationData || null,
            isReported: postData.isReported || false,
            reportedAt: postData.reportedAt || null,
            reportReasons: postData.reportReasons || [],
            reportedBy: postData.reportedBy || [],
            moderationStatus: postData.moderationStatus || "",
            ContentViewCount: postData.ContentViewCount || 0,
            ViewedBy: postData.ViewedBy || [],

          });
        }

        // 1. Get the last document snapshot
        const lastDoc = sentinelSnapshot.docs[sentinelSnapshot.docs.length - 1];
            
        // 2. Set the last visible state for subsequent fetches
        // This is crucial for the lazy loading of the next batch
        setLastVisible(lastDoc); 

        // 3. Set the posts data (Initial batch)
        setSentinelData(postsData);
        setFetchedData(postsData);
        
        setHasMore(sentinelSnapshot.docs.length === BATCH_SIZE); // Check if more data exists
        
      });
      
      
      setLastFetchTime(currentTime);
      console.log('All Data Fetched and Sorted', `Total: ${fetchedData.length} documents`);
      
      setIsInitialized(true);

      // Store the unsubscribe function in the ref
      sentinelUnsubscribeRef.current = unsubscribeSentinel;

      return () => {
        console.log('unsubscribeSentinel');
        unsubscribeSentinel();
      };
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isInitialized, fetchedData.length, lastFetchTime, userId]);

  const handleLoadMore = useCallback(async () => {
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    if (!hasMore || loading || isFetchingMore || !lastVisible) return; // Prevent multiple fetches or fetching if no more data

    setIsFetchingMore(true); // Use a separate loading state if needed for 'loading more' indicator
    try {
        const collSentinelRefPost = collection(db, 'SentinelPosts');
        let queryNext = query(
            collSentinelRefPost,
            orderBy('ContentDate', 'desc'),
            startAfter(lastVisible), // Start after the last document fetched
            limit(BATCH_SIZE)
        );
        // if (activeTab === 'educational') {
        //   queryNext = query(
        //       collSentinelRefPost,
        //       where('contentType', '==', 'Educational'),
        //       orderBy('ContentDate', 'desc'),
        //       startAfter(lastVisible),
        //       limit(BATCH_SIZE)
        //   );
        // }
        // if (activeTab === 'following') {
        //   if (!followingUserIds || followingUserIds.length === 0) {
        //     console.log("User is not following anyone. Skipping query.");
        //     return [];
        //   } else {
        //     queryNext = query(
        //       collSentinelRefPost,
        //       where("AuthorUserID", "in", followingUserIds),
        //       orderBy('ContentDate', 'desc'),
        //       startAfter(lastVisible),
        //       limit(BATCH_SIZE)
        //     );
        //   }
        // }

        if (activeTab === 'following') {
          // GUARD: If not following anyone, stop immediately
          if (!followingUserIds || followingUserIds.length === 0) {
            console.log("User is not following anyone. Skipping query.");
            setHasMore(false);
            setIsFetchingMore(false);
            return; 
          }
          
          queryNext = query(
            collSentinelRefPost,
            where("AuthorUserID", "in", followingUserIds),
            orderBy('ContentDate', 'desc'),
            startAfter(lastVisible),
            limit(BATCH_SIZE)
          );
        } else if (activeTab === 'educational') {
          queryNext = query(
              collSentinelRefPost,
              where('contentType', '==', 'Educational'),
              orderBy('ContentDate', 'desc'),
              startAfter(lastVisible),
              limit(BATCH_SIZE)
          );
        } else {
          // Default (Global Feed)
          queryNext = query(
              collSentinelRefPost,
              orderBy('ContentDate', 'desc'),
              startAfter(lastVisible),
              limit(BATCH_SIZE)
          );
        }

        // *** Use getDocs for the lazy load to avoid a new onSnapshot listener ***
        const nextSnapshot = await getDocs(queryNext);

        if (nextSnapshot.empty) {
            setHasMore(false);
            setIsFetchingMore(false);
            return;
        }
        
        // ... (Map nextSnapshot.docs to postsData and append) ...
        const nextPostsData = nextSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }))

        const postsData = [];
        for (const doc of nextPostsData) {
          const postData = doc.data;
          const postId = doc.id;

          postsData.push({
            uniqueId: `sentinel-${postId}`,
            id: postId,
            AuthorImageURL: postData.AuthorImageURL || '',
            AuthorName: postData.AuthorName || '',
            AuthorNickName: postData.AuthorNickName|| '',
            AuthorEmail: postData.AuthorEmail|| '',
            AuthorBio: postData.AuthorBio || postData.Bio || '',  // ✅ ADD THIS
            AuthorUserID: postData.AuthorUserID || postData.repostedBy || '123456',
            ContentDate: postData.ContentDate,
            ContentDesc: postData.ContentDesc,
            ContentURL: postData.ContentURL,
            ContentURLs: postData.ContentURLs || (postData.ContentURL ? [postData.ContentURL] : []),
            ContentLikeCount: postData.ContentLikeCount || 0,
            ContentRepostCount: postData.ContentRepostCount || 0,
            ContentCommentCount: postData.ContentCommentCount || 0,
            isApproved: postData.isApproved || false,
            isNew: postData.isNew !== undefined ? postData.isNew : true,
            postType: postData.postType || "SentinelPosts",
            Liked: (postData.LikedBy?.includes(fetchuserID) || false),
            Reposted: (postData.RepostedBy?.includes(fetchuserID) || false),
            Bookmarked: (postData.BookmarkedBy?.includes(fetchuserID) || false),
            createdAt: postData.createdAt || postData.ContentDate,
            CommentTemplate: postData.CommentTemplate || "Standard Template",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: postData.isAnonymous || false,
            contentType: postData.contentType ?? 'My Thoughts',
            isEducational: postData.isEducational === true || postData.contentType === 'Educational',
            moderationData: postData.moderationData || null,
            isReported: postData.isReported || false,
            reportedAt: postData.reportedAt || null,
            reportReasons: postData.reportReasons || [],
            reportedBy: postData.reportedBy || [],
            moderationStatus: postData.moderationStatus || "",
            ContentViewCount: postData.ContentViewCount || 0, 
            ViewedBy: postData.ViewedBy || [],  

          });
        }

        setFetchedData(prevData => [...prevData, ...postsData]); // Append new data

        fetchPostComments();


        const newLastDoc = nextSnapshot.docs[nextSnapshot.docs.length - 1];
        setLastVisible(newLastDoc);
        setHasMore(nextSnapshot.docs.length === BATCH_SIZE); // Check if this batch filled the limit

    } catch (error) {
        console.error('Error loading more data:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, loading, lastVisible, isFetchingMore]);

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

  const cleanupSubscriptions = useCallback(() => {
    unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') {
        unsub();
      }
    });
    setUnsubscribers([]);
}, [unsubscribers]);

  const fetchPostComments = useCallback(async () => {
  try {
    // Cleanup previous listeners
    cleanupSubscriptions();
    
    const newUnsubscribers: (() => void)[] = [];

    console.log('fetchPostComments', `Total: ${fetchedData.length} posts`);
    
    fetchedData.forEach(post => {
      const unsubscribe = onSnapshot(
        collection(doc(db, "SentinelPosts", post.id), 'Comments'),
        (commentsSnap) => {
          const totalComments = commentsSnap.size;
          
          setFetchedData(prev =>
            prev.map(p =>
              p.id === post.id
              ? { ...p, ContentCommentCount: totalComments }
              : p
            )
          );
        },
        (error) => {
          console.error(`Error listening to comments for post ${post.id}:`, error);
        }
      );
      
      newUnsubscribers.push(unsubscribe);
    });
    
    setUnsubscribers(newUnsubscribers);

  } catch (error) {
    console.error('Error setting up comment listeners:', error);
  }
}, [cleanupSubscriptions]);


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

  const fetchDeletedUser = useCallback(async () => {
  try {
    const collSentinelDeletedUsers = collection(db, 'UserDeletionAudit');
    const unsubscribeSentinelDeletedUsers = onSnapshot(
      collSentinelDeletedUsers,
      async (updateSnapshot) => {
        const deletedIds: string[] = [];

        let fetchuserID = userId;
        if (!fetchuserID) fetchuserID = await AsyncStorage.getItem('userId');
        if (fetchuserID) setUserId(fetchuserID);

        for (const docSnap of updateSnapshot.docs) {
          const deletedData = docSnap.data();

          // ✅ Collect all deleted user IDs for feed filtering
          if (deletedData.userId) {
            deletedIds.push(deletedData.userId);
          }

          // ✅ FIX: Only logout if the CURRENT logged-in user is the deleted one
          if (fetchuserID && deletedData.userId === fetchuserID) {
            confirmAccDeletedLogout();
          }
        }

        setDeletedUserIds(deletedIds);
      }
    );
    return unsubscribeSentinelDeletedUsers;
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [userId]);

  const fetchBlockedUser = useCallback(async () => {
    try {
      let fetchuserID = "";
      if(fetchuserID === ""){
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }
      console.log("userId Data: ", fetchuserID);

      // Reference the collection
      const collSentinelBlockedUsers = collection(db, 'UserBlocked');
      // Create the query
      const queryBlockedUser = query(collSentinelBlockedUsers, where("userid", "==", fetchuserID));
      console.log("Sentinel Blocked Users Called");

      const unsubscribeSentinelDeletedUsers = onSnapshot(queryBlockedUser, async updateSnapshot => {
        // 1. Collect ALL blocked IDs from all documents into one Set (for O(1) lookup)
        const newBlockedIds = new Set();
        
        updateSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.blockedList) {
            data.blockedList.forEach((item: any) => {
              if (item.postauthoruserid) {
                newBlockedIds.add(item.postauthoruserid);
              }
            });
          }
        });

        setAllBlockedIds(newBlockedIds);
        console.log("Unique Blocked IDs found:", newBlockedIds.size);

      })

      return () => {
        unsubscribeSentinelDeletedUsers();
      };

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  },[]);

  const blockUser = async () => {
    console.log("BlockUser called");
    let fetchuserID = userId || '';
    if (fetchuserID === "") {
      fetchuserID = await AsyncStorage.getItem('userId') || "";
    }
    let fetchuserEmail = userEmail || '';
    if (fetchuserEmail === '') {
      fetchuserEmail = await AsyncStorage.getItem('userEmail') || "";
    }
    let fetchuserName = userName || '';
    if (fetchuserName === '') {
      fetchuserName = await AsyncStorage.getItem('userName') || "";
    }
    // Reference the document specifically for the current user
    const userBlockDocRef = doc(db, 'UserBlocked', fetchuserID);
  
    try {
      let haveEmail = false;
      let blockUserEmailFetch = blockUserEmail;
      if (blockUserEmailFetch == null || blockUserEmailFetch == '') {
        blockUserEmailFetch = await handleGetEmail();
        setBlockUserEmail(blockUserEmailFetch);
        haveEmail=true;
      } else {
        haveEmail=true;
      }

      if (haveEmail) {
        await setDoc(userBlockDocRef, {
          userid: fetchuserID,
          UserEmail: fetchuserEmail || '',
          UserName: fetchuserName || '',
          // arrayUnion adds the new object to the existing 'blockedList' array
          blockedList: arrayUnion({
            postauthoruserid: blockUserId,
            AuthorEmail: blockUserEmailFetch || '',
            AuthorName: blockUserName || '',
            blockedat: new Date() // Or use a standard JS Date for array objects
          })
        }, { merge: true }); // 'merge: true' ensures we don't delete other fields
        
        console.log("User added to your blocked list.");
  
        Toast.show({
          type: 'success',
          text1: 'User Blocked',
          text2: 'User blocked successfully',
          position: 'bottom',
          visibilityTime: 3000,
        });
  
        setIsBlockModalVisible(false);
        setShowMenuModal(false);
        setSelectedPostUserId(null);
        setBlockUserId(null);
        setBlockUserEmail(null);
        setBlockUserName(null);
        setIsBlockLoading(false);
        // ✅ NEW: Notify the blocked user
        try {
          const blockerName = userName || (await AsyncStorage.getItem('userName')) || 'A user';
          const blockNotifyPayload = {
            id: `user_blocked_${fetchuserID}_${Date.now()}`,
            AuthorImageURL: 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg',
            AuthorName: 'IronEx Safety',
            AuthorUserID: fetchuserID,
            ContentDate: new Date(),
            NotifyType: 'user_blocked',
            ShowButtons: false,
            Status: 'blocked',
            Description: "🚫 Your account has been restricted by a fellow community member. You may have limited interaction till this is reviewed by the admin team. If you believe this is a mistake, please contact our support team by sending an email to ironexsafe@gmail.com.",
            isRead: false,
          };
  
          // Find blocked user's Firestore doc and send
          let blockNotifSent = false;
          for (const docUser of notificationDetails) {
            if (docUser.userID === blockUserId) {
              await updateDoc(doc(db, 'SentinelUsers', docUser.docID), {
                Notification: arrayUnion(blockNotifyPayload),
              });
              blockNotifSent = true;
              console.log('Block notification sent to user:', blockUserId);
              break;
            }
          }
          if (!blockNotifSent) {
            await addDoc(collection(db, 'SentinelUsers'), {
              userID: blockUserId,
              Notification: [blockNotifyPayload],
            });
          }
        } catch (blockNotifError) {
          console.error('Block notification error (non-critical):', blockNotifError);
        }
        
      }

    } catch (error) {
      console.error("Error updating blocked list: ", error);
      setIsBlockModalVisible(false);
      setShowMenuModal(false);
      setSelectedPostUserId(null);
      setBlockUserId(null);
      setBlockUserEmail(null);
      setBlockUserName(null);
      setIsBlockLoading(false);
    } finally {
      setIsBlockLoading(false);
    }
  };

  const handleGetEmail = async (): Promise<string | null> => {
    
    try {
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/get-user-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "userName": blockUserId }),
      });

      const data: EmailResponse = await response.json();
      
      if (response.ok && data.status === "success") {
        if (data.email === null) {
          return '';
        } else {
          return data.email; // Return the actual string
        }
        
      } 
      return null;
    } catch (err) {
      console.error('❌ Email response error:', err);
      return null;
    }
  };

  useEffect(() => {
    // getItem();
    // fetchUserFollowing();
    // // fetchAllUsersForNotifications();
    // handleFetchAllData();
    // fetchCommentTemplate();
    // fetchDeletedUser();
    // fetchBlockedUser();

  
  const loadData = async () => {
    try {
      setFetchedData([]);     // Clear list
      setLastVisible(null);   // Reset pagination
      setHasMore(true);       // Reset more-data flag

      // Group your initial fetches
      await Promise.all([
        getItem(),
        fetchUserFollowing(),
        // fetchAllUsersForNotifications();
        // handleFetchAllData(),
        fetchCommentTemplate(),
        fetchDeletedUser(),
        fetchBlockedUser(),
      ]);

      await handleFetchAllData(true);
    } catch (error) {
      console.error("Failed to fetch tab data", error);
    }
  };

  loadData();

  return () => {
    if (sentinelUnsubscribeRef.current) {
      sentinelUnsubscribeRef.current();
    }
  };

  }, [activeTab]);

  useEffect(() => {
    fetchPostComments();

  }, [fetchedData.map(p => p.id).join(',')]);
  

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
      // fetchPostComments();

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

  const confirmAccDeletedLogout = () => {
    showCustomAlert(
      'warning',
      'Account Deactivated',
      "Your account has been closed by an administrator. If you believe this is a mistake, please contact our support team.",
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
    const postRef = doc(db, "SentinelPosts", postItem.id);
    await updateDoc(postRef, {
      CommentTemplate: item.name,
    });
  };
  
  const openCommentsModal = useCallback((item: PostItem) => {
    if (areInteractionsDisabled(item)) {
    if (item.isNew) {
      Toast.show({
        type: 'warning',
        text1: 'Post Under Review',
        text2: 'Comments are disabled until this post is approved by moderators.',
        position: 'bottom',
        visibilityTime: 1000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Post Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'bottom',
        visibilityTime: 1000,
      });
    }
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
    if (item.isNew) {
      Toast.show({
        type: 'warning',
        text1: 'Post Under Review',
        text2: 'Sentiment analysis is available after moderation approval.',
        position: 'bottom',
        visibilityTime: 1000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Post Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'bottom',
        visibilityTime: 1000,
      });
    }
    return;
  }

    console.log("Graph ID: ", item.id);
    setSelectedGraphPostId(item.id);
    setSelectedGraphPostType(item.postType);
    setIsGraphModalVisible(true);
    // setSelectedPostId(item.id);
    // setSelectedPostType(item.postType);
    // setIsCommentModalVisible(false);
    // setSelectedCommentTemplate(item.CommentTemplate);
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
          // ✅ Notify the post author - same pattern as handleReportSubmit
        try {
          const rejectedPost = fetchedData.find(item => item.id === rejectionPostId);
          const postAuthorId = rejectedPost?.AuthorUserID;

          if (postAuthorId) {
            const rejectNotifyPayload = {
              id: `post_rejected_${rejectionPostId}_${Date.now()}`,
              AuthorImageURL: 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg',
              AuthorName: 'Admin',
              AuthorUserID: await AsyncStorage.getItem('userId'),
              ContentDate: new Date(),
              NotifyType: 'post_rejected',
              ShowButtons: false,
              Status: 'rejected',
              Description: `❌ Your post has been reviewed and rejected by our admin team.Please review our community guidelines and feel free to create posts which are appropriate for the community. If you believe this is a mistake, please contact our support team by sending an email to ironexsafe@gmail.com.\n\nReason(s):\n• ${selectedRejectionReasons.join('\n• ')}.\n\n`,
              isRead: false,
            };

            let rejectNotifSent = false;
            for (const docUser of notificationDetails) {
              if (docUser.userID === postAuthorId) {
                await updateDoc(doc(db, 'SentinelUsers', docUser.docID), {
                  Notification: arrayUnion(rejectNotifyPayload),
                });
                rejectNotifSent = true;
                console.log('Rejection notification sent to post author:', postAuthorId);
                break;
              }
            }
            if (!rejectNotifSent) {
              await addDoc(collection(db, 'SentinelUsers'), {
                userID: postAuthorId,
                Notification: [rejectNotifyPayload],
              });
              console.log('Rejection notification: created new doc for user:', postAuthorId);
            }
          }
        } catch (rejectNotifError) {
          console.error('Rejection notification error (non-critical):', rejectNotifError);
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
    setSelectedPostUserId(item.AuthorUserID);
    setBlockUserName(item.AuthorName);
    setBlockUserEmail(item.AuthorEmail);
    setMenuPosition({ x: pageX - 120, y: pageY + 10 });
    setShowMenuModal(true);
  };

    const handleDeletePost = async (postId: string) => {
      setPostToDelete(postId);
      setIsDeleteModalVisible(true);
    };

    const handleDeleteUser = async (postUserId: string) => {
      setUserToDelete(postUserId);
      setIsDeleteUserModalVisible(true);
    };

    const confirmDeletePost = async () => {
      if (!postToDelete) return;

      try {
        // Step 1: Get the post data to find its associated template
        const postRef = doc(db, 'SentinelPosts', postToDelete);
        const postSnap = await getDoc(postRef);

        let templateNameToDelete: string | null = null;

        if (postSnap.exists()) {
          const postData = postSnap.data();
          const commentTemplate = postData?.CommentTemplate;

          // Only delete if it's NOT a Standard Template (i.e., AI-generated custom template)
          if (commentTemplate && commentTemplate !== 'Standard Template') {
            templateNameToDelete = commentTemplate;
          }
        }

        // Step 2: Delete the post
        await deleteDoc(postRef);
        console.log('Post deleted successfully');

        // Step 3: Delete the associated template from the 'templates' collection
        if (templateNameToDelete) {
          try {
            const templatesRef = collection(db, 'templates');
            const templateQuery = query(
              templatesRef,
              where('name', '==', templateNameToDelete)
            );
            const templateSnapshot = await getDocs(templateQuery);

            if (!templateSnapshot.empty) {
              const deletePromises = templateSnapshot.docs.map((templateDoc) =>
                deleteDoc(doc(db, 'templates', templateDoc.id))
              );
              await Promise.all(deletePromises);
              console.log(`Template "${templateNameToDelete}" deleted successfully`);
            } else {
              console.log(`No template found with name "${templateNameToDelete}"`);
            }
          } catch (templateError) {
            // Non-critical: post is already deleted, just log template deletion error
            console.error('Error deleting template (non-critical):', templateError);
          }
        }

        // Step 4: Cleanup UI state
        setIsDeleteModalVisible(false);
        setShowMenuModal(false);
        setSelectedPostId(null);
        setPostToDelete(null);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Post and its template deleted successfully',
          position: 'top',
          visibilityTime: 3000,
        });

      } catch (error) {
        console.error('Error deleting post:', error);
        setIsDeleteModalVisible(false);
        setShowMenuModal(false);
        setSelectedPostId(null);
        setPostToDelete(null);
        Toast.show({
          type: 'error',
          text1: 'Delete Failed',
          text2: 'Failed to delete post. Please try again.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    };


    const confirmDeleteUser = async () => {
      if (!userToDelete) return;
      
      try {

        callDeleteAccount();
       
      } catch (error) {
        console.error('Error deleting user:', error);
        setIsDeleteUserModalVisible(false);
        setShowMenuModal(false);
        setSelectedPostUserId(null);
        setUserToDelete(null);
        
        // Show error with CustomModal
        setIsDeleteUserModalVisible(true);
      }
    };

    const callDeleteAccount = async () => {
      try {
        console.log('Call Delete Account...');
        
        const response = await fetch(
          'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/user-access/status',
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              "username" : selectedPostUserId,
              "enabled" : false
            })
          }
        );
    
        if (!response.ok) {
          // Optional: Show success message
          Toast.show({
            type: 'error',
            text1: 'Failed',
            text2: 'User deletion failed',
            position: 'bottom',
            visibilityTime: 3000,
          });
          
          setIsDeleteUserModalVisible(false);
          setShowMenuModal(false);
          setSelectedPostUserId(null);
          setUserToDelete(null);

        } else {
          // await addDoc(collection(db, 'DeletedUsers'), {
          //   DeletedUserId: selectedPostUserId,
          //   DeletedOn: new Date(),
          //   DeletedById: userId,
          //   DeletedBy: userName
          // });
          
          setIsDeleteUserModalVisible(false);
          setShowMenuModal(false);
          setSelectedPostUserId(null);
          setUserToDelete(null);
    
          const data = await response.json();
        
          console.log('✅ Delete Account Complete:', data);

          // Optional: Show success message
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'User deleted successfully',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }

        
        
      } catch (error) {
        console.error('❌ Error Delete Account:', error);

        setIsDeleteUserModalVisible(false);
        setShowMenuModal(false);
        setSelectedPostUserId(null);
        setUserToDelete(null);

      } finally {
        // setIsDeleting(false); // Stop loading
      }
    };

  // APPROVAL TOGGLE WITH TOAST
  const handleApprovalToggle = useCallback(
  async (
    postId: string,
    newApprovedStatus: boolean,
    newIsNew: boolean = false,
    postUserID: string
  ) => {
    console.log("Toggling post", postId, "to approved:", newApprovedStatus, "isNew:", newIsNew);

    // Update local state immediately
    setFetchedData((prevData) =>
      prevData.map((item) =>
        item.id === postId
          ? {
              ...item,
              isApproved: newApprovedStatus,
              isNew: newIsNew,
              // ✅ CLEAR REPORT DATA WHEN APPROVED
              ...(newApprovedStatus && !newIsNew
                ? {
                    isReported: false,
                    reportedAt: null,
                    reportReasons: [],
                    reportedBy: [],
                    moderationStatus: "approved",
                  }
                : {}),
            }
          : item
      )
    );

    if (fullScreenCard && fullScreenCard.id === postId) {
      setFullScreenCard((prev: PostItem | null) =>
        prev
          ? {
              ...prev,
              isApproved: newApprovedStatus,
              isNew: newIsNew,
              // ✅ CLEAR REPORT DATA WHEN APPROVED
              ...(newApprovedStatus && !newIsNew
                ? {
                    isReported: false,
                    reportedAt: null,
                    reportReasons: [],
                    reportedBy: [],
                    moderationStatus: "approved",
                  }
                : {}),
            }
          : null
      );
    }

    try {
      // ✅ UPDATE FIREBASE - CLEAR REPORT DATA WHEN APPROVED
      if (newApprovedStatus && !newIsNew) {
        // Post is being APPROVED - clear all report data
        await updateDoc(doc(db, "SentinelPosts", postId), {
          isApproved: newApprovedStatus,
          isNew: newIsNew,
          // ✅ Clear report fields
          isReported: false,
          reportedAt: null,
          reportReasons: [],
          reportedBy: [],
          moderationStatus: "approved",
        });

        console.log("✅ Post approved and report data cleared");
      } else {
        // Post is being REJECTED or set to pending - keep report data
        await updateDoc(doc(db, "SentinelPosts", postId), {
          isApproved: newApprovedStatus,
          isNew: newIsNew,
        });
      }

      console.log("Post status updated successfully");

      // Find user doc for notifications
      let postDocID = "";
      for (const docUserID of notificationDetails) {
        console.log("PostAuthorUserID ", postUserID);
        console.log("doc PostAuthorUserID ", docUserID.userID);
        if (docUserID.userID === postUserID) {
          postDocID = docUserID.docID;
          setPostUserDocId(docUserID.docID);
          setPostUserIdNotify(postUserID);
          setPostUserDeviceToken(docUserID.docDeviceToken || "");
          break;
        }
      }

      // Show toast for approval
      if (newApprovedStatus && !newIsNew) {
        Toast.show({
          type: "success",
          text1: "Post Approved",
          text2: "Post has been approved and report cleared!",
          position: "bottom",
          visibilityTime: 3000,
        });

        // Send notification to post author
        let tempFound = false;
        for (const docNoti of notificationDetails) {
          if (docNoti.userID === postUserID) {
            if (postDocID !== "") {
              tempFound = true;
              setPostUserDocId(postDocID);
              setPostUserIdNotify(postUserID);

              // Create Notification
              const userRef = doc(db, "SentinelUsers", postDocID);
              await updateDoc(userRef, {
                Notification: arrayUnion({
                  AuthorImageURL:
                    "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
                  AuthorName: "Admin",
                  AuthorUserID: await AsyncStorage.getItem("userId"),
                  ContentDate: new Date(),
                  Description: "🎉 Great news! Your recent post has been approved and is now live.",
                  NotifyType: "postapproved",
                  ShowButtons: false,
                  Status: "approved",
                  isRead: false,
                }),
              });
              console.log("Approved post notification sent");
            }
          }
        }

        if (!tempFound) {
          // Create new document if it doesn't exist
          await addDoc(collection(db, "SentinelUsers"), {
            userID: postUserID,
            Notification: [
              {
                AuthorImageURL:
                  "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
                AuthorName: "Admin",
                AuthorUserID: await AsyncStorage.getItem("userId"),
                ContentDate: new Date(),
                Description: "Great news! Your recent post has been approved and is now live.",
                NotifyType: "postapproved",
                ShowButtons: false,
                Status: "approved",
                isRead: false,
              },
            ],
          });
          console.log("Created new user document and notification");
        }
      }
    } catch (error) {
      console.error("Error updating post status:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Failed to update post status. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });

      // Revert state on error
      setFetchedData((prevData) =>
        prevData.map((item) =>
          item.id === postId
            ? {
                ...item,
                isApproved: !newApprovedStatus,
                isNew: !newIsNew,
              }
            : item
        )
      );

      if (fullScreenCard && fullScreenCard.id === postId) {
        setFullScreenCard((prev: PostItem | null) =>
          prev
            ? {
                ...prev,
                isApproved: !newApprovedStatus,
                isNew: !newIsNew,
              }
            : null
        );
      }
    }
  },
  [fullScreenCard, notificationDetails]
);


  const toggleLike = useCallback(async (postItem: PostItem) => {
  if (areInteractionsDisabled(postItem)) {
    if (postItem.isNew) {
      Toast.show({
        type: 'warning',
        text1: 'Post Under Review',
        text2: 'This post is awaiting moderation. Interactions will be enabled once approved.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Post Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
    return;
  }

    console.log("Like pressed:", postItem.id);
  
  let fetchuserID = userId;
  if(fetchuserID === ""){
    fetchuserID = await AsyncStorage.getItem('userId') || "";
    setUserId(fetchuserID);
  }

  const postRef = doc(db, "SentinelPosts", postItem.id);
  
  try {
    if(postItem.Liked) {
      // UNLIKE: Update state immediately with correct count
      setFetchedData(prevData =>
        prevData.map(item =>
          item.id === postItem.id
            ? { 
                ...item, 
                Liked: false, 
                ContentLikeCount: Math.max(0, item.ContentLikeCount - 1) // Prevent negative
              }
            : item
        )
      );

      // Then update Firebase
      await updateDoc(postRef, {
        ContentLikeCount: Math.max(0, postItem.ContentLikeCount - 1),
        LikedBy: arrayRemove(fetchuserID),
        ContentCommentCount: postItem.ContentCommentCount,
      });
    } else {
      // LIKE: Update state immediately with correct count
      setFetchedData(prevData =>
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
        ContentCommentCount: postItem.ContentCommentCount,
      });
    }

    // Update fullscreen card if open
    if (fullScreenCard && fullScreenCard.id === postItem.id) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Liked: !prev.Liked,
        ContentLikeCount: prev.Liked 
          ? Math.max(0, prev.ContentLikeCount - 1)
          : prev.ContentLikeCount + 1
      }) : null);
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    
    // Revert state on error
    setFetchedData(prevData =>
      prevData.map(item =>
        item.id === postItem.id
          ? { 
              ...item, 
              Liked: postItem.Liked, // Restore original state
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
}, [fullScreenCard, areInteractionsDisabled, userId]);

  const openRepostModal = useCallback((postItem: PostItem) => {
    if (areInteractionsDisabled(postItem)) {
    if (postItem.isNew) {
      Toast.show({
        type: 'warning',
        text1: 'Post Under Review',
        text2: 'Reposting is disabled until this post is approved by moderators.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Action Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
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
    const userImage = await AsyncStorage.getItem('profilePicUrl') || dummyAuthorImage;

    // Check if already reposted - EXIT EARLY
    if (selectedRepostPost.Reposted) {
      Toast.show({
        type: 'success',
        text1: 'Already Reposted',
        text2: 'You have already reposted this Post.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return; // ✅ Exit early - don't do anything else
    }

    // ✅ Update state FIRST with new count (optimistic update)
    setFetchedData(prevData =>
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

    // ✅ Update Firebase - increment repost count
    const postRef = doc(db, "SentinelPosts", selectedRepostPost.id);
    await updateDoc(postRef, {
      ContentRepostCount: selectedRepostPost.ContentRepostCount + 1,
      RepostedBy: arrayUnion(fetchuserID),
    });

    // ✅ Create new repost document
    await addDoc(collection(db, 'SentinelPosts'), {
      AuthorImageURL: userImage,
      AuthorName: userInfo,
      AuthorUserID: fetchuserID,
      ContentDate: new Date(),
      ContentDesc: selectedRepostPost.ContentDesc || '',
      ContentURL: selectedRepostPost.postType === 'X-Data' ? "" : (selectedRepostPost.ContentURL || ''),
      ContentURLs: selectedRepostPost.postType === 'X-Data' ? [] : (selectedRepostPost.ContentURLs || []),
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
        postType: selectedRepostPost.postType || "SentinelPosts",
        isAnonymous: selectedRepostPost.isAnonymous || false,
        contentType: selectedRepostPost.contentType || 'My Thoughts'
      },
      repostComment: '',
      repostedBy: fetchuserID,
      repostedAt: new Date(),
      isAnonymous: false,
      contentType: 'Found Online'
    });

    // ✅ Update fullscreen card if open
    if (fullScreenCard && fullScreenCard.uniqueId === selectedRepostPost.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Reposted: true,
        ContentRepostCount: prev.ContentRepostCount + 1
      }) : null);
    }

    // ✅ Show success message
    Toast.show({
      type: 'success',
      text1: 'Reposted Successfully',
      text2: 'Post has been shared to your followers.',
      position: 'bottom',
      visibilityTime: 2000,
    });

  } catch (error) {
    console.error('Error handling repost:', error);
    
    // ✅ Revert state on error (rollback optimistic update)
    if (selectedRepostPost) {
      setFetchedData(prevData =>
        prevData.map(item =>
          item.id === selectedRepostPost.id
            ? { 
                ...item, 
                Reposted: selectedRepostPost.Reposted, // Restore original state
                ContentRepostCount: selectedRepostPost.ContentRepostCount // Restore original count
              }
            : item
        )
      );
    }
    
    // ✅ Show error message
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
      const userImage = await AsyncStorage.getItem('profilePicUrl') || dummyAuthorImage;

      

      if (selectedRepostPost.Reposted) {
        Toast.show({
          type: 'success',
          text1: 'Already Reposted',
          text2: 'You have already reposted this Post.',
          position: 'bottom',
          visibilityTime: 2000,
        });
        return;
      } else {
        const postRef = doc(db, "SentinelPosts", selectedRepostPost.id);
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
          CommentTemplate: selectedRepostPost.CommentTemplate || "Standard Template",
          isRepost: true,
          originalPost: {
            id: selectedRepostPost.id || '',
            AuthorUserID: selectedRepostPost.AuthorUserID || '',
            AuthorName: selectedRepostPost.AuthorName || 'Anonymous',
            AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
            ContentDesc: selectedRepostPost.ContentDesc || '',
            ContentDate: selectedRepostPost.ContentDate || new Date(),
            postType: selectedRepostPost.postType || "SentinelPosts",
            isAnonymous: selectedRepostPost.isAnonymous || false,
            contentType: selectedRepostPost.contentType || 'My Thoughts'
          },
          repostComment: comment || '',
          repostedBy: fetchuserID,
          repostedAt: new Date(),
          isAnonymous: false,
          contentType: 'Found Online'
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
    if (postItem.isNew) {
      Toast.show({
        type: 'warning',
        text1: 'Post Under Review',
        text2: 'Bookmarking is disabled until this post is approved by moderators.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Action Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
    return;
  }

    console.log("Bookmark pressed:", postItem.id);
    
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    const postRef = doc(db, "SentinelPosts", postItem.id);
    if(postItem.Bookmarked) {
      console.log("itemID: ", postItem.id);
      console.log("item Bookmarked: ", postItem.Bookmarked);
      
      setFetchedData(prevData => 
        prevData.map(item => 
          item.id === postItem.id 
            ? { ...item, Bookmarked: false }
            : item
        )
      );

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

      setFetchedData(prevData => 
        prevData.map(item => 
          item.id === postItem.id 
            ? { ...item, Bookmarked: true }
            : item
        )
      );

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
    // setFetchedData(prevData => 
    //   prevData.map(item => 
    //     item.id === postItem.id 
    //       ? { ...item, Bookmarked: !item.Bookmarked }
    //       : item
    //   )
    // );

    if (fullScreenCard && fullScreenCard.uniqueId === postItem.uniqueId) {
      setFullScreenCard((prev: PostItem | null) => prev ? ({
        ...prev,
        Bookmarked: !prev.Bookmarked
      }) : null);
    }

    await new Promise(r => setTimeout(r, 200));
  }, [fullScreenCard, areInteractionsDisabled, userId]);

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
          index={index}
          currentVideoIndex={currentVideoIndex}
        />
      );
    }, [getMediaType, openFullScreenImage, openFullScreenVideo, openFullScreenDoc, currentVideoIndex]);



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
          {/* <Text className="text-gray-500 text-xs ml-2">
            {getTimeAgo(item.originalPost.ContentDate)}
          </Text> */}
        </View>
        <ExpandableText text={item.ContentDesc} />
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
    const blockedSet = new Set(allBlockedIds ?? []);
    // Remove blocked users
    const sourceData = fetchedData.filter(
      item => !blockedSet?.has(item.AuthorUserID)
    );

    // ONE WEEK window constant for data eligibility
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const toMs = (date: any): number => {
      if (!date) return 0;
      if (typeof date === 'object' && date?.toDate) return date.toDate().getTime();
      if (date instanceof Date) return date.getTime();
      return new Date(date).getTime();
    };

    // Base approved data
    const baseData = sourceData.filter(item => {
      if (userRole === 'User') {
        return (
          item.postType.includes('X-Data') ||
          (item.isApproved && !item.isNew)
        );
      }
      return true;
    });

    // Educational data
    // Educational data — loose matching to handle missing/inconsistent fields
    const educationalData = sourceData.filter(item => {
      const isEdu =
        item.contentType === 'Educational' ||
        item.isEducational === true ||
        item.postType?.toLowerCase().includes('educational');

      if (userRole === 'User') {
        // X-Data posts are never educational; Sentinel posts need approval
        if (item.postType.includes('X-Data')) return false;
          return (item.isApproved && !item.isNew) && isEdu;
      }
      // Admin/Mod: show all educational posts regardless of approval
      return isEdu;
    });

    const allApprovedData = sourceData.filter(item => {
      const isXData = item.postType.includes('X-Data');

      if (userRole === 'User') {
        // ✅ Explicitly hide reported posts for regular users
        if (item.isReported && item.moderationStatus === 'pending-review') return false;
        return isXData
          ? (item.isApproved && !item.isNew)
          : (item.isApproved && !item.isNew);
      }
      // Admins/Mods see everything (intentional)
      return true;
    });

    const deletedSet = new Set(deletedUserIds); // O(1) lookups

    const followingData = allApprovedData.filter(item => {
        
      if (item.isAnonymous) return false;

      const authorId = item.repostedBy || item.AuthorUserID;

      if (authorId && deletedSet.has(authorId)) return false;

      return authorId && followingUserIds.includes(authorId);
    });

  
    const publishedData = sourceData.filter(item => {
      const isXData = item.postType.includes('X-Data');

      if (userRole === 'User') {
        // ✅ Explicitly hide reported posts for regular users
        if (item.isReported && item.moderationStatus === 'pending-review') return false;
        return isXData
          ? (item.isApproved && !item.isNew)
          : (item.isApproved && !item.isNew && item.contentType !== 'Educational' && !item.isEducational);
      }
      // Admins/Mods see everything (intentional)
      return item.contentType !== 'Educational' && !item.isEducational;
    });

    // ── FOLLOWING TAB ──────────────────────────────────────────────────────────
      if (activeTab === 'following') {
        // const deletedSet = new Set(deletedUserIds); // O(1) lookups

        // const followingData = allApprovedData.filter(item => {
        
        //   if (item.isAnonymous) return false;

        //   const authorId = item.repostedBy || item.AuthorUserID;

        //   if (authorId && deletedSet.has(authorId)) return false;

        //   return authorId && followingUserIds.includes(authorId);
        // });

        if (followingData.length < 4) handleLoadMore();
        return followingData;
      }

    // ── EDUCATIONAL TAB ────────────────────────────────────────────────────────
    if (activeTab === 'educational') {
      if (educationalData.length < 4) handleLoadMore();
      return educationalData;
    }

    // ── FOR YOU TAB ────────────────────────────────────────────────────────────
    if (activeTab === 'forYou') {
      // 1. Separate Sentinel and X-Data posts
      const allSentinels = publishedData.filter(
        item => !item.postType.includes('X-Data')
      );
      const allXData = publishedData.filter(
        item => item.postType.includes('X-Data')
      );

      // 2. BOTH pools limited to last 1 week for relevancy
      const weekSentinels = allSentinels.filter(
        p => now - toMs(p.createdAt ?? p.ContentDate) <= ONE_WEEK_MS
      );
      const weekXData = allXData.filter(
        p => now - toMs(p.createdAt ?? p.ContentDate) <= ONE_WEEK_MS
      );

      // 3. Older posts (beyond 1 week) as fallback pool
      const olderSentinels = allSentinels.filter(
        p => now - toMs(p.createdAt ?? p.ContentDate) > ONE_WEEK_MS
      );
      const olderXData = allXData.filter(
        p => now - toMs(p.createdAt ?? p.ContentDate) > ONE_WEEK_MS
      );

      // 4. Within the 1-week pool, get adaptive window for "fresh" Sentinel boost
      const windowMs = getAdaptiveTimeWindow(weekSentinels, 5);
      const freshSentinels = weekSentinels.filter(
        p => now - toMs(p.createdAt ?? p.ContentDate) <= windowMs
      );
      const recentSentinels = weekSentinels.filter(
        p => now - toMs(p.createdAt ?? p.ContentDate) > windowMs
      );

      // 5. Build interleaved blocks for the 1-week pool
      //    Pattern: [recentSentinels 20] [weekXData 10] repeating
      const interleavedWeek = buildInterleavedFeed(recentSentinels, weekXData, 20, 10);

      // 6. Build interleaved blocks for older posts (beyond 1 week) as tail
      const interleavedOlder = buildInterleavedFeed(olderSentinels, olderXData, 20, 10);

      console.log(
        `[Feed] Window: ${windowMs / 3600000}h | Fresh: ${freshSentinels.length} | Week Sentinels: ${weekSentinels.length} | Week X: ${weekXData.length} | Older: ${olderSentinels.length + olderXData.length}`
      );

      // Final order:
      // 1. Fresh Sentinels (latest within adaptive window) — always top
      // 2. Interleaved 1-week posts (20S/10X pattern)
      // 3. Interleaved older posts as infinite tail
      return [...freshSentinels, ...interleavedWeek, ...interleavedOlder];
    }

    return publishedData;

  }, [fetchedData, userRole, activeTab, followingUserIds, allBlockedIds,deletedUserIds]);


    const handleScroll = useCallback((event: any) => {
      try {
        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const currentScrollY = contentOffset.y;
        const viewHeight = layoutMeasurement.height;

        // Lazy loading
        const isCloseToBottom = 
          contentOffset.y + layoutMeasurement.height >= contentSize.height * 0.9;
        
        if (isCloseToBottom && hasMore && !loading && !isFetchingMore) {
          handleLoadMore();
        }

        // Clear previous timeout
        if (viewTrackingTimeout.current) {
          clearTimeout(viewTrackingTimeout.current);
        }

        // ✅ FIXED: Single setTimeout for view tracking
        viewTrackingTimeout.current = setTimeout(() => {
          filteredData.forEach((item, index) => {
            try {
              const itemY = index * 450;
              const itemHeight = 450;
              const itemTop = itemY;
              const itemBottom = itemY + itemHeight;

              // Calculate visibility
              const visibleTop = Math.max(itemTop, currentScrollY);
              const visibleBottom = Math.min(itemBottom, currentScrollY + viewHeight);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const visibilityPercentage = (visibleHeight / itemHeight) * 100;
              const isVisible = visibilityPercentage >= 50;

              // Track view if visible and not already tracked
              if (isVisible && !viewedPosts.has(item.id)) {
                console.log('Tracking view:', {
                  postId: item.id,
                  postType: item.postType,
                  visibility: `${visibilityPercentage.toFixed(0)}%`
                });
                trackPostView(item.id, item.postType);
              }

              // Video handling (without nested setTimeout)
              const mediaUrls = 
                item.ContentURLs?.length > 0 
                  ? item.ContentURLs 
                  : item.ContentURL 
                  ? [item.ContentURL] 
                  : [];
              
              if (mediaUrls.length > 0 && getMediaType(mediaUrls[0]) === 'video') {
                const itemCenter = itemY + itemHeight / 2;
                const viewCenter = currentScrollY + viewHeight / 2;
                const distance = Math.abs(viewCenter - itemCenter);
                
                if (distance < 100 && currentVideoIndex !== index) {
                  setCurrentVideoIndex(index);
                }
              }
            } catch (itemError) {
              console.error(`Error processing item ${item.id}:`, itemError);
            }
          });
        }, 800); // Single 800ms debounce
        
      } catch (error) {
        console.error('Error in handleScroll:', error);
      }
    }, [
      filteredData, 
      getMediaType, 
      currentVideoIndex, 
      hasMore, 
      loading, 
      isFetchingMore, 
      handleLoadMore, 
      viewedPosts, 
      trackPostView
    ]);




    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (viewTrackingTimeout.current) {
          clearTimeout(viewTrackingTimeout.current);
        }
      };
    }, []);

    const setupViewCountListeners = useCallback(() => {
      // Only setup listeners for visible posts (first 10-20 posts)
      const visiblePosts = filteredData.slice(0, 20);
      const unsubscribers: (() => void)[] = [];

      visiblePosts.forEach(post => {
        // const collectionName = post.postType === 'X-Data' ? 'X-Data' : 'SentinelPosts';  // Single Collection for all
        const postRef = doc(db, 'SentinelPosts', post.id);
        
        const unsubscribe = onSnapshot(postRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const newViewCount = data.ContentViewCount || 0;
            
            // Only update if count actually changed
            setFetchedData(prev =>
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
    }, [filteredData.map(p => p.id).join(',')]);

    // Update useEffect to only setup when tab changes or data loads
        useEffect(() => {
      if (filteredData.length > 0) {
        const cleanup = setupViewCountListeners();
        return cleanup;
      }
    }, [activeTab, setupViewCountListeners]); 



    const formatViewCount = useCallback((count: number): string => {
      if (!count || count === 0) return '0';
      
      if (count < 1000) {
        return count.toString();
      } else if (count < 10000) {
        // For 1K-9.9K, show 1 decimal place
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else if (count < 1000000) {
        // For 10K-999K, show no decimals
        return Math.floor(count / 1000) + 'K';
      } else if (count < 10000000) {
        // For 1M-9.9M, show 1 decimal place
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      } else if (count < 1000000000) {
        // For 10M-999M, show no decimals
        return Math.floor(count / 1000000) + 'M';
      } else {
        return (count / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
      }
    }, []);




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
   const isIronExPost = item.AuthorName === 'IronEx';
    const isIronExEducational = isIronExPost && item.isEducational === true;
    const isIronExPublished = isIronExPost && !item.isEducational;


    return (
      <View>
        {userRole !== "User" &&
          item.isReported === true &&
          item.reportedBy &&
          item.reportedBy.length > 0 &&
          !(item.isApproved === true && item.isNew === false) && (
            <View
              style={{
                position: 'absolute',
                top: 37,
                right: 20,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EF4444',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 20,
                zIndex: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
            >
              <Ionicons name="flag" size={8} color="white" />
              <Text
                style={{
                  color: 'white',
                  fontSize: 5,
                  fontWeight: '700',
                  marginLeft: 3,
                  letterSpacing: 0.3,
                }}
              >
                Reported
              </Text>
            </View>
          )}


   <EnhancedCard postId={item.uniqueId}>

  {isIronExPost ? (
    <>
      {/* ===== HEADER ===== */}
      <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity activeOpacity={0.8} onPress={() => openUserProfile(item)}>
            <View className="w-8 h-8 rounded-full mr-2 overflow-hidden border-2 border-white shadow-sm">
              <Image
                source={{ uri: AuthorImage || dummyAuthorImage }}
                className="w-full h-full"
                resizeMode="cover"
                resizeMethod="resize"
              />
            </View>
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-sm">{AuthorName}</Text>
            <View className="flex-row items-center mt-0.5">
              {item.postType !== 'X-Data' && (
                <View className="bg-blue-100 px-1 py-0.5 rounded-full mr-1.5">
                  <Text className="text-blue-600 text-xs">• {item.contentType}</Text>
                </View>
              )}
              {item.postType === 'X-Data' && (
                <View className="bg-blue-100 px-0.5 py-0.5 rounded-full mr-1.5">
                  <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                </View>
              )}
              {userRole !== 'User' && item.postType === 'SentinelPosts' && (
                <View className={`px-2 py-1 rounded-full ${getPostStatus(item).bgColor}`}>
                  <Text className="text-xs font-semibold" style={{ color: getPostStatus(item).color }}>
                    {getPostStatus(item).text}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text className="text-gray-500 text-xs mr-5">{getTimeAgo(item.ContentDate)}</Text>
          <TouchableOpacity
            className="p-1.5 rounded-full bg-gray-100"
            onPress={(event) => handleThreeDotsPress(item, event)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== BODY ===== */}
      <View style={{ paddingBottom: 10 }}>

        {/* ✅ BANNER — full width, no gray gap, beautiful radius */}
        <ImageBackground
          source={
            isIronExEducational
              ? require('../../assets/images/education-bg1.png')
              : require('../../assets/images/ironex-bg1.png')
          }
          resizeMode="cover"
          style={{
            width: '100%',
            minHeight: 170,
            marginBottom: 10,
            overflow: 'hidden',
            borderBottomLeftRadius: 14,   // ← only bottom corners rounded
            borderBottomRightRadius: 14,  // ← top flush with header
          }}
          imageStyle={{
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
          }}
        >
          <View
            style={{
              flex: 1,
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 25,
              paddingRight: '35%',
              justifyContent: 'center',
              minHeight: 160,
            }}
          >
            <ExpandableText text={item.ContentDesc} />

            {item.ContentTagline ? (
              <Text
                style={{
                  fontSize: 11,
                  color: isIronExEducational ? '#4b5563' : '#d1d5db',
                  lineHeight: 15,
                  marginTop: 5,
                }}
                numberOfLines={2}
              >
                {item.ContentTagline}
              </Text>
            ) : null}
          </View>
        </ImageBackground>

        {/* ===== Rest of content with padding ===== */}
        <View className="px-3">
          {renderRepostContent(item)}
          {item.postType !== "X-Data" && renderMediaContent(item, index)}

          {/* ===== REACTION ICONS ===== */}
          <View className="flex-row items-center">
            <View className="flex-1">
              <View className="flex-row items-center mt-1.5">

                <TouchableOpacity
                  className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                  onPress={(e) => { e.stopPropagation(); toggleLike(item); }}
                  activeOpacity={0.7}
                  disabled={areInteractionsDisabled(item)}
                >
                  <Ionicons name={item.Liked ? "heart" : "heart-outline"} size={20} color={item.Liked ? "#ef4444" : "#64748b"} />
                  <Text className={`ml-1 text-xs font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                    {item.ContentLikeCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                  onPress={(e) => { e.stopPropagation(); openCommentsModal(item); }}
                  activeOpacity={0.7}
                  disabled={areInteractionsDisabled(item)}
                >
                  <MaterialCommunityIcons name="thumbs-up-down" size={20} color="#000000" />
                  <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                  onPress={(e) => { e.stopPropagation(); handleRepost(item); }}
                  activeOpacity={0.7}
                  disabled={areInteractionsDisabled(item)}
                >
                  <Ionicons name="repeat-outline" size={20} color={item.Reposted ? "#0ea5e9" : "#64748b"} />
                  <Text className={`ml-1 text-xs font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                    {item.ContentRepostCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center mr-4 px-1.5 py-1"
                  style={areInteractionsDisabled(item) ? { opacity: 0.5 } : {}}
                  onPress={(e) => { e.stopPropagation(); openGraphModal(item); }}
                  activeOpacity={0.7}
                  disabled={areInteractionsDisabled(item)}
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
                className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                onPress={(e) => { e.stopPropagation(); handleBookmark(item); }}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
              >
                <Ionicons name={item.Bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={item.Bookmarked ? "#000000" : "#64748b"} />
              </TouchableOpacity>

              <TouchableOpacity
                className={`mr-2 p-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                onPress={(e) => { e.stopPropagation(); handleShare(item); }}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
              >
                {sharingId != null ? (
                  <ActivityIndicator size={20} color="#64748b" />
                ) : (
                  <Feather name="share-2" size={20} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== ADMIN: POST STATUS ===== */}
          {userRole !== "User" && (
            <TouchableOpacity onPress={(e) => e.stopPropagation()} activeOpacity={1}>
              <View className="mt-3 px-3 py-3 bg-white rounded-lg border border-gray-200">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="information-circle-outline" size={18} color="#64748b" />
                  <Text className="font-semibold text-gray-900 text-sm ml-1.5">Post Status</Text>
                </View>
                <Text className="text-gray-500 text-xs leading-4 mb-2">
                  {item.isNew
                    ? "This post is new and awaiting review"
                    : item.isApproved
                    ? "This post is approved and visible to users"
                    : "This post is rejected and not visible to users"}
                </Text>
                {item.isNew && item.moderationData?.violations && item.moderationData.violations.length > 0 && (
                  <View className="flex-row items-center mb-3 bg-amber-50 px-2 py-1.5 rounded-lg">
                    <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                    <Text className="text-xs text-gray-600 ml-1 flex-1">
                      <Text className="text-amber-700 font-medium">
                        This post is flagged for: {item.moderationData.violations.join(", ")}
                      </Text>
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => handleApprovalToggle(item.id, true, false, item.AuthorUserID)}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${item.isApproved && !item.isNew ? "bg-green-500" : "bg-white border border-green-500"}`}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-circle" size={14} color={item.isApproved && !item.isNew ? "#fff" : "#22c55e"} />
                    <Text className={`ml-1 text-xs font-semibold ${item.isApproved && !item.isNew ? "text-white" : "text-green-500"}`}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openRejectionModal(item.id)}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${!item.isApproved && !item.isNew ? "bg-red-500" : "bg-white border border-red-500"}`}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={14} color={!item.isApproved && !item.isNew ? "#fff" : "#ef4444"} />
                    <Text className={`ml-1 text-xs font-semibold ${!item.isApproved && !item.isNew ? "text-white" : "text-red-500"}`}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ===== ADMIN: REPORTED BADGE ===== */}
          {userRole !== "User" && item.isReported === true && item.reportedBy && item.reportedBy.length > 0 && !(item.isApproved === true && item.isNew === false) && (
            <View className="mb-3 mt-3 px-3 py-3 bg-red-50 border border-red-200 rounded-lg">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="flag" size={16} color="#EF4444" />
                  <Text className="text-red-600 text-sm font-bold ml-2">
                    Reported by {item.reportedBy.length} user(s)
                  </Text>
                </View>
                {item.reportReasons && item.reportReasons.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      const reasonsList = item.reportReasons?.map((reason: string, idx: number) => `${idx + 1}. ${reason}`).join("\n");
                      Toast.show({ type: "info", text1: "Report Reasons", text2: reasonsList, position: "bottom", visibilityTime: 1000 });
                    }}
                    className="px-3 py-1.5 bg-red-100 rounded-md"
                  >
                    <Text className="text-red-600 text-xs font-semibold">
                      View Reasons ({item.reportReasons.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {item.reportedAt && (
                <Text className="text-red-500 text-xs">Reported {getTimeAgo(item.reportedAt)}</Text>
              )}
            </View>
          )}

          {/* ===== ADMIN: VOTE OPTION DROPDOWN ===== */}
          {userRole !== "User" && (
            <TouchableOpacity onPress={(e) => e.stopPropagation()} activeOpacity={1}>
              <View className="mt-2 px-3 py-2.5 bg-white rounded-lg border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="checkbox-outline" size={18} color="#64748b" />
                    <Text className="font-semibold text-gray-900 text-sm ml-1.5">Vote Option:</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Dropdown
                      data={fetchedCommentTemplate}
                      labelField="name"
                      valueField="name"
                      value={item.CommentTemplate}
                      onChange={(itemValue) => handleDropdownChange(itemValue, item)}
                      placeholder="Select template"
                      placeholderStyle={{ fontSize: 13, color: "#9CA3AF" }}
                      selectedTextStyle={{ fontSize: 13, color: "#1F2937", fontWeight: "500" }}
                      style={{ backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#E5E7EB" }}
                      containerStyle={{ borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: "#E5E7EB" }}
                      itemTextStyle={{ fontSize: 13, color: "#374151" }}
                      iconStyle={{ width: 20, height: 20, tintColor: "#6B7280" }}
                      activeColor="#F3F4F6"
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>

  ) : (

    // ✅ All other users — original layout unchanged
    <>
      {/* ===== HEADER ===== */}
      <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="relative">
            <TouchableOpacity activeOpacity={0.8} onPress={() => openUserProfile(item)}>
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
              {item.postType != 'X-Data' && !item.isEducational && (
                <View className="bg-blue-100 px-1 py-0.5 rounded-full mr-1.5">
                  <Text className="text-blue-600 text-xs font-regular">• {item.contentType}</Text>
                </View>
              )}
              {item.postType === 'X-Data' && (
                <View className="bg-blue-100 px-0.5 py-0.5 rounded-full mr-1.5">
                  <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                </View>
              )}
              {userRole !== 'User' && item.postType === 'SentinelPosts' && (
                <View className={`px-2 py-1 rounded-full ${getPostStatus(item).bgColor}`}>
                  <Text className="text-xs font-semibold" style={{ color: getPostStatus(item).color }}>
                    {getPostStatus(item).text}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text className="text-gray-500 text-xs mr-5">{getTimeAgo(item.ContentDate)}</Text>
          <TouchableOpacity
            className="p-1.5 rounded-full bg-gray-100"
            onPress={(event) => handleThreeDotsPress(item, event)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== BODY ===== */}
      <View className="px-3 py-2.5">
        <ExpandableText text={item.ContentDesc} />

        {renderRepostContent(item)}
        {item.postType !== "X-Data" && renderMediaContent(item, index)}

        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center mt-1.5">
              <TouchableOpacity
                className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                onPress={(e) => { e.stopPropagation(); toggleLike(item); }}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
              >
                <Ionicons name={item.Liked ? "heart" : "heart-outline"} size={20} color={item.Liked ? "#ef4444" : "#64748b"} />
                <Text className={`ml-1 text-xs font-medium ${item.Liked ? 'text-red-500' : 'text-gray-600'}`}>
                  {item.ContentLikeCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                onPress={(e) => { e.stopPropagation(); openCommentsModal(item); }}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
              >
                <MaterialCommunityIcons name="thumbs-up-down" size={20} color="#000000" />
                <Text className="text-gray-600 ml-1 text-xs font-medium">{item.ContentCommentCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                onPress={(e) => { e.stopPropagation(); handleRepost(item); }}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
              >
                <Ionicons name="repeat-outline" size={20} color={item.Reposted ? "#0ea5e9" : "#64748b"} />
                <Text className={`ml-1 text-xs font-medium ${item.Reposted ? 'text-blue-500' : 'text-gray-600'}`}>
                  {item.ContentRepostCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center mr-4 px-1.5 py-1"
                style={areInteractionsDisabled(item) ? { opacity: 0.5 } : {}}
                onPress={(e) => { e.stopPropagation(); openGraphModal(item); }}
                activeOpacity={0.7}
                disabled={areInteractionsDisabled(item)}
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
              className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => { e.stopPropagation(); handleBookmark(item); }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              <Ionicons name={item.Bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={item.Bookmarked ? "#000000" : "#64748b"} />
            </TouchableOpacity>

            <TouchableOpacity
              className={`mr-2 p-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
              onPress={(e) => { e.stopPropagation(); handleShare(item); }}
              activeOpacity={0.7}
              disabled={areInteractionsDisabled(item)}
            >
              {sharingId != null ? (
                <ActivityIndicator size={20} color="#64748b" />
              ) : (
                <Feather name="share-2" size={20} color="#64748b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== ADMIN: POST STATUS ===== */}
        {userRole !== "User" && (
          <TouchableOpacity onPress={(e) => e.stopPropagation()} activeOpacity={1}>
            <View className="mt-3 px-3 py-3 bg-white rounded-lg border border-gray-200">
              <View className="flex-row items-center mb-1">
                <Ionicons name="information-circle-outline" size={18} color="#64748b" />
                <Text className="font-semibold text-gray-900 text-sm ml-1.5">Post Status</Text>
              </View>
              <Text className="text-gray-500 text-xs leading-4 mb-2">
                {item.isNew
                  ? "This post is new and awaiting review"
                  : item.isApproved
                  ? "This post is approved and visible to users"
                  : "This post is rejected and not visible to users"}
              </Text>
              {item.isNew && item.moderationData?.violations && item.moderationData.violations.length > 0 && (
                <View className="flex-row items-center mb-3 bg-amber-50 px-2 py-1.5 rounded-lg">
                  <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                  <Text className="text-xs text-gray-600 ml-1 flex-1">
                    <Text className="text-amber-700 font-medium">
                      This post is flagged for: {item.moderationData.violations.join(", ")}
                    </Text>
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => handleApprovalToggle(item.id, true, false, item.AuthorUserID)}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${item.isApproved && !item.isNew ? "bg-green-500" : "bg-white border border-green-500"}`}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={14} color={item.isApproved && !item.isNew ? "#fff" : "#22c55e"} />
                  <Text className={`ml-1 text-xs font-semibold ${item.isApproved && !item.isNew ? "text-white" : "text-green-500"}`}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openRejectionModal(item.id)}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${!item.isApproved && !item.isNew ? "bg-red-500" : "bg-white border border-red-500"}`}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={14} color={!item.isApproved && !item.isNew ? "#fff" : "#ef4444"} />
                  <Text className={`ml-1 text-xs font-semibold ${!item.isApproved && !item.isNew ? "text-white" : "text-red-500"}`}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ===== ADMIN: REPORTED BADGE ===== */}
        {userRole !== "User" && item.isReported === true && item.reportedBy && item.reportedBy.length > 0 && !(item.isApproved === true && item.isNew === false) && (
          <View className="mb-3 mt-3 px-3 py-3 bg-red-50 border border-red-200 rounded-lg">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="flag" size={16} color="#EF4444" />
                <Text className="text-red-600 text-sm font-bold ml-2">
                  Reported by {item.reportedBy.length} user(s)
                </Text>
              </View>
              {item.reportReasons && item.reportReasons.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    const reasonsList = item.reportReasons?.map((reason: string, idx: number) => `${idx + 1}. ${reason}`).join("\n");
                    Toast.show({ type: "info", text1: "Report Reasons", text2: reasonsList, position: "bottom", visibilityTime: 1000 });
                  }}
                  className="px-3 py-1.5 bg-red-100 rounded-md"
                >
                  <Text className="text-red-600 text-xs font-semibold">
                    View Reasons ({item.reportReasons.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {item.reportedAt && (
              <Text className="text-red-500 text-xs">Reported {getTimeAgo(item.reportedAt)}</Text>
            )}
          </View>
        )}

        {/* ===== ADMIN: VOTE OPTION DROPDOWN ===== */}
        {userRole !== "User" && (
          <TouchableOpacity onPress={(e) => e.stopPropagation()} activeOpacity={1}>
            <View className="mt-2 px-3 py-2.5 bg-white rounded-lg border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="checkbox-outline" size={18} color="#64748b" />
                  <Text className="font-semibold text-gray-900 text-sm ml-1.5">Vote Option:</Text>
                </View>
                <View className="flex-1 ml-3">
                  <Dropdown
                    data={fetchedCommentTemplate}
                    labelField="name"
                    valueField="name"
                    value={item.CommentTemplate}
                    onChange={(itemValue) => handleDropdownChange(itemValue, item)}
                    placeholder="Select template"
                    placeholderStyle={{ fontSize: 13, color: "#9CA3AF" }}
                    selectedTextStyle={{ fontSize: 13, color: "#1F2937", fontWeight: "500" }}
                    style={{ backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#E5E7EB" }}
                    containerStyle={{ borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: "#E5E7EB" }}
                    itemTextStyle={{ fontSize: 13, color: "#374151" }}
                    iconStyle={{ width: 20, height: 20, tintColor: "#6B7280" }}
                    activeColor="#F3F4F6"
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </>
  )}

</EnhancedCard>






      </View>
    )
  }, [openCommentsModal, EnhancedCard, getTimeAgo, renderMediaContent, toggleLike, handleRepost, handleBookmark, ApprovalToggle, handleApprovalToggle, dummyAuthorImage, userRole, getPostStatus, areInteractionsDisabled, openGraphModal, renderRepostContent]);

 
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
      
      // if (userRole === "User") {
      //   return (
      //     <React.Fragment key={uniqueKey}>
      //       {renderPostContent(item, index)}
      //     </React.Fragment>
      //   );
      // } else {
        return (
          <React.Fragment key={uniqueKey}>
            {renderPostContent(item, index)}
          </React.Fragment>
        );
      // }
    });
  }, [filteredData, userRole, initializeCardAnimation, renderPostContent, activeTab]);

  const renderEmptyState = () => {
  if (activeTab === 'educational') {
    return (
      <View className="flex-1 justify-center items-center py-20 px-8">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="school-outline" size={40} color="#9CA3AF" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
          Learn feed is waiting
        </Text>
        <Text className="text-gray-500 text-center leading-6 mb-4">
          Learn content will be available here. Stay tuned for learning materials and resources!
        </Text>
      </View>
    );
  }
  else {
    // Following tab empty state
  return (
    <View className="flex-1 justify-center items-center py-20 px-8 bg-white">
  {/* Icon Container - Larger with subtle background */}
      <View className="w-32 h-32 bg-gray-50 rounded-full items-center justify-center mb-8">
        <MaterialCommunityIcons 
          name="account-heart-outline" 
          size={64} 
          color="#D1D5DB" 
        />
      </View>
      
      {/* Heading - Larger and bolder */}
      <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
        Your feed is waiting
      </Text>
      
      {/* Description - More spacing */}
      <Text className="text-base text-gray-500 text-center leading-6 mb-8 px-4">
        Start following creators and friends to fill this space.
      </Text>
      
      {/* Button - Red/Pink color to match Figma */}
      <TouchableOpacity 
        className="bg-red-600 px-8 py-3.5 rounded-lg shadow-sm"
        onPress={() => {
          router.push('/search');
        }}
        activeOpacity={0.8}
      >
        <Text className="text-white font-semibold text-base">Search Now</Text>
      </TouchableOpacity>
    </View>

  );
  }

};


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
                    {/* <Text className="text-3xl font-extrabold text-[#281C20]">entinel</Text> */}
                    <Text className="text-3xl font-extrabold text-[#281C20]">IronExSafe™</Text>
                  </View>
                  {/* Logo Icon */}
                  <Text className="text-lg text-[#281C20]">
                    Report. Expose. Educate.
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
        // key={`feed-${activeTab}-${filteredData.length}`}
        key={`feed-${activeTab}`}
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
            colors={['#3b82f6']}
            tintColor="#3b82f6"
            title="Pull to refresh"
            titleColor="#64748b"
          />
        }
        onScroll={handleScroll} 
        scrollEventThrottle={16}
      >
        {/* {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <LoadingComponent visible={true} size="large" />
          </View>
        ) : (activeTab === 'following' || activeTab === 'educational') && listItems.length === 0 ? (
          renderEmptyState()
        ) : listItems.length > 0 ? (
          listItems
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <LoadingComponent visible={true} size="large" />
          </View>
        )} */}

        {loading && !isFetchingMore ? (
            // Full-screen loader for initial/refresh load
            <View className="flex-1 justify-center items-center py-20">
                <LoadingComponent visible={true} size="large" />
            </View>
        ) : (activeTab === 'following' || activeTab === 'educational') && listItems.length === 0 ? (
            renderEmptyState()
        ) : listItems.length > 0 ? (
            // The list of items
            listItems
        ) : (
             // Fallback loader if list is empty after initial load (optional)
            <View className="flex-1 justify-center items-center py-20">
                <LoadingComponent visible={true} size="large" />
            </View>
        )}

        {/* 👇 5. Small Loader for Pagination */}
        {isFetchingMore && (
            <View className="py-4 justify-center items-center">
                <LoadingComponent visible={true} size="small" /> 
            </View>
        )}

        {/* 👇 6. "No More Data" Indicator (Optional) */}
        {!hasMore && listItems.length > BATCH_SIZE && (
            <View className="py-4 justify-center items-center">
                <Text className="text-gray-500">You've reached the end of the feed.</Text>
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
      
      
        {/* Report Modal */}
        {isReportModalVisible && (
          <Modal
            visible={isReportModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={closeReportModal}
            statusBarTranslucent
          >
            <View className="flex-1 bg-black/50 justify-end">
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: windowHeight * 0.80,       // ✅ Dynamic: 85% of real screen height
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 16, // ✅ Above nav bar
                  }}
              >
                {/* Header */}
                <View className="px-6 pt-6 pb-4 border-b border-gray-200">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-2xl font-bold text-gray-900">Report Post</Text>
                    <TouchableOpacity
                      onPress={closeReportModal}
                      className="p-2 rounded-full bg-gray-100"
                    >
                      <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-600 text-sm mt-2">
                    Help us understand the problem with this post
                  </Text>
                </View>

                {/* Reasons List */}
                <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                  {reportReasons.map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleReportReason(reason)}
                      className={`flex-row items-center p-4 mb-3 rounded-xl border-2 ${
                        selectedReportReasons.includes(reason)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      activeOpacity={0.7}
                    >
                      <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                          selectedReportReasons.includes(reason)
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selectedReportReasons.includes(reason) && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <Text
                        className={`flex-1 text-sm ${
                          selectedReportReasons.includes(reason)
                            ? 'text-orange-600 font-semibold'
                            : 'text-gray-700 font-medium'
                        }`}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Submit Button */}
                <View className="px-6 py-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={handleReportSubmit}
                    className={`py-4 rounded-xl items-center ${
                      selectedReportReasons.length > 0
                        ? 'bg-orange-500'
                        : 'bg-gray-300'
                    }`}
                    disabled={selectedReportReasons.length === 0}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selectedReportReasons.length > 0
                          ? 'text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      Submit Report
                    </Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </Modal>
        )}


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
      {/* DELETE POST MODAL */}
        <CustomModal
          visible={isDeleteModalVisible}
          type="warning"
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setIsDeleteModalVisible(false);
                setPostToDelete(null);
                setShowMenuModal(false); 
              }
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: confirmDeletePost
            }
          ]}
          onClose={() => {
            setIsDeleteModalVisible(false);
            setPostToDelete(null);
            setShowMenuModal(false);
          }}
        />

        {/* DELETE USER MODAL */}
        <CustomModal
          visible={isDeleteUserModalVisible}
          type="warning"
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setIsDeleteUserModalVisible(false);
                setUserToDelete(null);
                setShowMenuModal(false); 
              }
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: confirmDeleteUser
            }
          ]}
          onClose={() => {
            setIsDeleteUserModalVisible(false);
            setUserToDelete(null);
            setShowMenuModal(false);
          }}
        />

        {/* BLOCK USER MODAL */}
        <CustomModal
          visible={isBlockModalVisible}
          loading={isBlockLoading}
          type="warning"
          title="Block User"
          message="You will no longer see their posts. This user will also be reported to our moderation team for review."
          buttons={[
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setIsBlockModalVisible(false);
                setBlockUserId(null);
                setBlockUserEmail(null);
                setBlockUserName(null);
                setShowMenuModal(false); 
                setIsBlockLoading(false);
              }
            },
            {
              text: "Block",
              style: "destructive",
              onPress: async() => {
                if (!isBlockLoading) {
                  setIsBlockLoading(true); 
                  try {
                    await blockUser(); 
                    // Usually, you close the modal here after success
                    setIsBlockModalVisible(false);
                  } catch (error) {
                    console.error("Block failed", error);
                  } finally {
                    setIsBlockLoading(false);
                  }
                }
              }
            }
          ]}
          onClose={() => {
            setIsBlockModalVisible(false);
            setBlockUserId(null);
            setBlockUserEmail(null);
            setBlockUserName(null)
            setShowMenuModal(false);
            setIsBlockLoading(false);
          }}
        />


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
  commentTemplate={selectedCommentTemplate}
  postData={fetchedData.find(item => item.id === selectedPostId)}
  // ✅ ADD THIS — navigation happens here, outside the modal
  onNavigateToProfile={handleNavigateToProfile}
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
              style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              activeOpacity={1}
              onPress={() => setShowMenuModal(false)}
            >
              <View style={{
                position: 'absolute',
                top: menuPosition.y,
                right: 16, // ✅ Fixed to right edge
                backgroundColor: '#fff',
                borderRadius: 12,
                paddingVertical: 8,
                minWidth: 180,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 10,
              }}>
                {/* Report Option - FOR ALL USERS */}
                {fetchedData.find(post => post.id === selectedPostId)?.AuthorUserID !== userId &&
                    !fetchedData.find(post => post.id === selectedPostId)?.isNew && (
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedPostId) {
                          setReportPostId(selectedPostId);
                          setShowMenuModal(false);
                          setIsReportModalVisible(true);
                        }
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Ionicons name="flag" size={18} color="#FF9500" />
                      <Text style={{ 
                        marginLeft: 12, 
                        fontSize: 15, 
                        color: '#FF9500', 
                        fontWeight: '600' 
                      }}>
                        Report
                      </Text>
                    </TouchableOpacity>
                )}

                {/* Block Option - FOR ALL USERS */}
                {fetchedData.find((post) => post.id === selectedPostId)?.AuthorUserID !==
                  userId && (
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedPostUserId) {
                          setBlockUserId(selectedPostUserId);
                          setShowMenuModal(false);
                          setIsBlockModalVisible(true);
                        }
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Ionicons name="ban" size={18} color="#FF3B30" />
                      <Text style={{ 
                        marginLeft: 12, 
                        fontSize: 15, 
                        color: '#FF3B30', 
                        fontWeight: '600' 
                      }}>
                        Block User
                      </Text>
                    </TouchableOpacity>
                )}
                
                {/* Divider - Only if user owns post */}
                {fetchedData.find(post => post.id === selectedPostId)?.AuthorUserID === userId && (
                  <View style={{ 
                    height: 1, 
                    backgroundColor: '#e5e5e5', 
                    marginHorizontal: 12,
                    marginVertical: 4 
                  }} />
                )}
                
                {/* Delete Option - ONLY FOR POST OWNER */}
                {fetchedData.find(post => post.id === selectedPostId)?.AuthorUserID === userId && (
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedPostId) {
                        setShowMenuModal(false);
                        handleDeletePost(selectedPostId);
                      }
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="trash" size={18} color="#FF3B30" />
                    <Text style={{ 
                      marginLeft: 12, 
                      fontSize: 15, 
                      color: '#FF3B30', 
                      fontWeight: '600' 
                    }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
                {userRole != 'User' && (
                  <TouchableOpacity
                    onPress={() => {
                    if (selectedPostUserId) {
                      setShowMenuModal(false);
                      handleDeleteUser(selectedPostUserId);
                    }
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                  <Text style={{ 
                    marginLeft: 12, 
                    fontSize: 15, 
                    color: '#FF3B30', 
                    fontWeight: '600' 
                  }}>
                    Delete User
                  </Text>
                </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </Modal>
        )}


     
    </SafeAreaView>
  );
}

