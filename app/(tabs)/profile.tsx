import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoView, useVideoPlayer } from 'expo-video';

import AppInfoModal from '@/components/AppInfoModal'; // Add this line
import EditProfileScreen from '@/components/EditProfileScreen';
import HelpScreen from '@/components/HelpScreen';
import LoadingDeleteOverlay from '@/components/LoadingDeleteOverlaym';
import PasswordVerificationModal from '@/components/PasswordVerificationModal';
import { makeRedirectUri } from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import CommentsModal from '../../components/CommentsModal';
import SentinelFAQ from '../../components/SentinelFAQ';
import TotalSentiment from '../../components/TotalSentiment';
 // Adjust path to your toastConfig file

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// const { width: screenWidth } = Dimensions.get('window');

// PostItem interface from landing page
interface PostItem {
  id: string;
  uniqueId: string;
  AuthorUserID?: string;
  AuthorImageURL: string;
  AuthorName: string;
  AuthorBio: string;
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
  isRepost?: boolean;
  originalPost?: PostItem;
  repostComment?: string;
  repostedBy?: string;
  repostedAt?: any;
  isAnonymous: boolean;
  contentType: string;
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
    const activeSlide = Math.round(offset / ITEM_WIDTH);
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


// Your Custom LoadingComponent with Sentinel Logo (Smaller Size)
const LoadingComponent: React.FC<{ visible?: boolean; size?: 'small' | 'medium' | 'large' }> = ({
  visible = true,
  size = 'medium'
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Enhanced entrance animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      );

      // Pulse animation for the logo
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, rotateAnim, scaleAnim, opacityAnim, pulseAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          logo: { width: 40, height: 40 },
        };
      case 'medium':
        return {
          logo: { width: 50, height: 50 },
        };
      default: // large
        return {
          logo: { width: 60, height: 60 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 20,
      }}
    >
      {/* Animated Logo Container */}
      <Animated.View
        style={{
          transform: [
            { rotate: rotateInterpolate },
            { scale: pulseAnim }
          ],
          zIndex: 10,
        }}
      >
        <View
          style={{
            width: sizeStyles.logo.width,
            height: sizeStyles.logo.height,
            borderRadius: sizeStyles.logo.width / 2,
            overflow: 'hidden',
            borderWidth: 4,
            borderColor: '#ffffff',
            backgroundColor: '#ffffff',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Image
            source={require('../../assets/images/new_logo.png')}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            resizeMethod="resize"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Enhanced Full Screen Loading Overlay Component
const LoadingOverlay: React.FC<{ visible?: boolean; size?: 'small' | 'medium' | 'large' }> = (props) => {
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (props.visible) {
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [props.visible, backdropAnim]);

  if (!props.visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backdropAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)'],
        }),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        opacity: backdropAnim,
      }}
    >
      <LoadingComponent {...props} />
    </Animated.View>
  );
};

// Skeleton Loading Component for List Items
const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={`skeleton-${index}`}
          style={{ 
            opacity: shimmerOpacity,
            marginBottom: 16,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View style={{ width: 96, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 4 }} />
              <View style={{ width: 64, height: 12, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
            </View>
          </View>
          <View style={{ width: '100%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '75%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 12 }} />
          <View style={{ width: '100%', height: 160, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
        </Animated.View>
      ))}
    </View>
  );
};

// Toast Notification Component
interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onHide: () => void;
}

const AppToast: React.FC<ToastProps> = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        zIndex: 1000,
      }}
      className={`${getToastStyle()} px-6 py-4 rounded-xl shadow-lg`}
    >
      <Text className="text-white font-semibold text-center text-base">
        {message}
      </Text>
    </Animated.View>
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

// **ENHANCED: File size limits and helpers**
const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB
const FILE_SIZE_LIMIT_MB = 5; // For display purposes

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// **ENHANCED: Comprehensive error message handler**
const getErrorDetails = (error: any, fileName: string = ''): { title: string; message: string; icon: string } => {
  const errorString = String(error).toLowerCase();
  const fileNameDisplay = fileName ? `"${fileName}"` : 'your file';
  
  // File size errors (HTTP 413)
  if (errorString.includes('413') || errorString.includes('content length exceeded')) {
    const sizeLimit = formatFileSize(FILE_SIZE_LIMIT_BYTES);
    return {
      title: 'File Too Large ⚠️',
      message: `${fileNameDisplay} is too large. Please choose a file smaller than ${sizeLimit}.\n\nTip: Try compressing your video or image before uploading.`,
      icon: 'warning'
    };
  }
  
  // Network timeout errors
  if (errorString.includes('timeout') || errorString.includes('network request timed out')) {
    return {
      title: 'Upload Timeout',
      message: `Upload of ${fileNameDisplay} timed out. This usually happens with large files or slow connections.\n\nTry:\n• Using a smaller file\n• Checking your internet connection\n• Trying again later`,
      icon: 'time-outline'
    };
  }
  
  // Network connection errors
  if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('connection')) {
    return {
      title: 'Connection Error',
      message: `Unable to connect to the server while uploading ${fileNameDisplay}.\n\nPlease:\n• Check your internet connection\n• Try again in a few moments`,
      icon: 'wifi-outline'
    };
  }
  
  // File format/corruption errors
  if (errorString.includes('format') || errorString.includes('corrupt') || errorString.includes('invalid')) {
    return {
      title: 'Invalid File',
      message: `${fileNameDisplay} appears to be corrupted or in an unsupported format.\n\nTry:\n• Choosing a different file\n• Converting to a common format (JPG, PNG, MP4)`,
      icon: 'document-text-outline'
    };
  }
  
  // Server errors (5xx)
  if (errorString.includes('500') || errorString.includes('502') || errorString.includes('503') || errorString.includes('server error')) {
    return {
      title: 'Server Temporarily Unavailable',
      message: `Our servers are experiencing issues processing ${fileNameDisplay}.\n\nPlease try uploading again in a few minutes.`,
      icon: 'server-outline'
    };
  }
  
  // Permission/authorization errors
  if (errorString.includes('401') || errorString.includes('403') || errorString.includes('unauthorized')) {
    return {
      title: 'Upload Permission Error',
      message: `You don't have permission to upload ${fileNameDisplay}.\n\nTry logging out and back in, then try again.`,
      icon: 'lock-closed-outline'
    };
  }
  
  // Generic upload error
  return {
    title: 'Upload Failed',
    message: `Failed to upload ${fileNameDisplay}. This could be due to:\n\n• File size too large\n• Network connectivity issues\n• Temporary server problems\n\nPlease try again with a smaller file.`,
    icon: 'cloud-upload-outline'
  };
};

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showFAQModal, setShowFAQModal] = useState<boolean>(false);
  const [userId, setUserId] = useState("1");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userNickName, setUserNickName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
    const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [userBio, setUserBio] = useState("");
  

  // Posts related states
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  // const videoRefs = useRef<{ [key: string]: any }>({});

  // Loading states for pagination
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Comment modal states
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedCommentTemplate, setSelectedCommentTemplate] = useState<string | null>(null);

  // Graph modal states
  const [isGraphModalVisible, setIsGraphModalVisible] = useState(false);
  const [selectedGraphPostId, setSelectedGraphPostId] = useState<string | null>(null);
  const [selectedGraphPostType, setSelectedGraphPostType] = useState<string | null>(null);

  //Repost modal
  const [isRepostModalVisible, setIsRepostModalVisible] = useState(false);
  const [selectedRepostPost, setSelectedRepostPost] = useState<PostItem | null>(null);

  //Post menu options
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editPostData, setEditPostData] = useState<PostItem | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [fetchedData, setFetchedData] = useState<PostItem[]>([]);
  const currentPost = userPosts.find(item => item.id === selectedPostId);
  const [fullScreenDoc, setFullScreenDoc] = useState<string | null>(null);
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);
  const [isAppInfoModalVisible, setIsAppInfoModalVisible] = useState(false);
  const [showPasswordVerify, setShowPasswordVerify] = useState<boolean>(false);
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Add this function in your ProfilePage component
const loadProfileData = async () => {
  try {
    console.log("🔄 [Profile] Reloading profile data from AsyncStorage...");
    const [name, nickname, email, country, bio, profilePic] = await AsyncStorage.multiGet([
      'userName',
      'userNickName',
      'userEmail',
      'userCountry',
      'userBio',
      'profilePicUrl',
    ]);
    
    if (name[1]) {
      setUserName(name[1]);
      console.log("✅ [Profile] Name updated:", name[1]);
    }
    if (nickname[1]) {
      setUserNickName(nickname[1]);
      console.log("✅ [Profile] Nickname updated:", nickname[1]);
    }
    if (email[1]) {
      setUserEmail(email[1]);
      console.log("✅ [Profile] Email updated:", email[1]);
    }
    if (profilePic[1]) {
      setProfilePicUrl(profilePic[1]);
      console.log("✅ [Profile] Profile pic updated:", profilePic[1]);
    }
    if (bio[1]){ 
      setUserBio(bio[1]);
      console.log("✅ [Profile] Bio updated:", bio[1]);
    }
    if (country[1]) {
      // If you have a country state, update it here
      // setUserCountry(country[1]);
      console.log("✅ [Profile] Country updated:", country[1]);
    }
    
    console.log("✅ [Profile] All profile data reloaded successfully");
  } catch (error) {
    console.error("❌ [Profile] Error reloading profile data:", error);
  }
};


  const [editVisible, setEditVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const fetchUserProfile = async () => {
    // Replace with your actual endpoint/token logic
    const res = await fetch("https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/get-profile"); 
    const data = await res.json();
    setUserData(data); // Should include name, email, nickname, country, bio, ageConfirmed, profilePicUrl etc.
  };
  useEffect(() => { fetchUserProfile(); }, []);
  
  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setEditPostData(null);
    setEditPostContent("");
  };

  const handleEditPost = (postId: string) => {
  const post = userPosts.find(item => item.id === postId);
  
  if (!post) {
    Toast.show({
      type: 'error',
      text1: 'Post Not Found',
      text2: 'Unable to find the post to edit.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    return;
  }

  // Check if post is in "new" status
  if (!post.isNew) {
    Toast.show({
      type: 'warning',
      text1: 'Cannot Edit Post',
      text2: 'You can only edit posts with "New" status.',
      position: 'bottom',
      visibilityTime: 3000,
    });
    return;
  }

  // Open edit modal with current post data
  setEditPostData(post);
  setEditPostContent(post.ContentDesc);
  setIsEditModalVisible(true);
  setShowMenuModal(false);
  setSelectedPostId(null);
};



  const handleSaveEditPost = async () => {
    if (!editPostData) return;

    if (!editPostContent.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Empty Content',
        text2: 'Post content cannot be empty.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    try {
      // ✅ STEP 1: Validate post description with AI
      console.log('🤖 Validating edited post description with AI...');
      
      const moderationResult = await checkPostContent(editPostContent.trim(), null);
      console.log('✅ AI Moderation Result:', moderationResult);
      
      // ✅ STEP 2: Check if content is approved
      if (moderationResult.postStatus !== 'approved' || moderationResult.flagged) {
        console.warn('❌ Post description does not meet content guidelines');
        
        // Build rejection reason message
        let rejectionReason = 'Your post description does not meet our community guidelines.';
        
        if (moderationResult.violations && moderationResult.violations.length > 0) {
          rejectionReason += `\n\nReasons:\n• ${moderationResult.violations.join('\n• ')}`;
        }
        
        // Show error alert with rejection reason
        showCustomAlert(
          'error',
          'Post Content Not Acceptable',
          rejectionReason + '\n\nPlease revise your post description and try again.',
          [
            {
              text: 'Edit Again',
              onPress: () => {
                hideModal();
                // Keep edit modal open
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                hideModal();
                setIsEditModalVisible(false);
                setEditPostData(null);
                setEditPostContent('');
              }
            }
          ]
        );
        
        return; // Stop execution if validation fails
      }

      // ✅ STEP 3: Content approved - proceed with update
      console.log('✅ Post description validated successfully!');
      
      const postRef = doc(db, editPostData.postType, editPostData.id);
      
      await updateDoc(postRef, {
        ContentDesc: editPostContent.trim(),
        isApproved: true, // ✅ Mark as approved since AI validated it
        isNew: false,      // ✅ No longer needs admin review
        updatedAt: new Date(),
        // Store moderation data for record
        moderationData: {
          flagged: false,
          violations: [],
          categories: moderationResult.categories || {},
          checkedAt: new Date(),
          validatedBy: 'AI'
        }
      });

      // Update local state
      setUserPosts((prevData) =>
        prevData.map((item) =>
          item.id === editPostData.id
            ? {
                ...item,
                ContentDesc: editPostContent.trim(),
                isApproved: true,
                isNew: false
              }
            : item
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Post Updated & Approved!',
        text2: 'Your post has been updated and approved by AI.',
        position: 'bottom',
        visibilityTime: 3000,
      });

      // Close modal and reset
      setIsEditModalVisible(false);
      setEditPostData(null);
      setEditPostContent('');
      
    } catch (error) {
      console.error('❌ Error updating post:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update post. Please try again.',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  };
  // Helper function to call the AI moderation API
  const checkPostContent = async (postText: string, imageUrl: string | null) => {
    try {
      console.log('🔍 Checking content with AI moderation...');
      console.log('📝 Text:', postText ? 'Present' : 'Empty');
      console.log('🖼️ Image URL:', imageUrl ? 'Present' : 'None');
      
      const response = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/ai-based-post-analysis',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postText: postText,
            imageUrl: imageUrl // Will be null for edit post (only checking text)
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Moderation check complete:', data);
      
      return {
        postStatus: data.postStatus, // "approved" or "inappropriate"
        flagged: data.flagged,
        violations: data.violations || [],
        categories: data.categories || {}
      };
    } catch (error) {
      console.error('❌ Error checking post content:', error);
      // Fallback: if API fails, flag for manual review for safety
      return {
        postStatus: 'inappropriate',
        flagged: true,
        violations: ['api_error'],
        categories: {}
      };
    }
  };
    const handleDeleteAccount = async () => {
      setShowAccountModal(false);
      
      showCustomAlertLoad(
        'warning',
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              hideModal();
            }
          },
          {
            text: 'Continue',
            style: 'destructive',
            // Pass the loading state if your showCustomAlert supports it
            isLoading: false, 
            onPress: async () => {
              setIsDeleting(true); // Start loading
              try {
                console.log('✅ userId:', userId);
                await callDeleteAccount(); // Ensure this is awaited
                hideModal();
              } catch (error) {
                console.error('Error:', error);
              }
        
            }
          }
        ]
      );
    };

    const callDeleteAccount = async () => {
      try {
        console.log('Call Delete Account...');
        
        const response = await fetch(
          'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/delete-self-data',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              "userName" : userId
            })
          }
        );
    
        if (!response.ok) {
          setIsDeleting(false);
          hideModal();
          showCustomAlert(
            'error',
            'Account Deleted Failed',
            'Failed to delete account. Please try again.',
            [
              {
                text: 'OK',
                onPress: hideModal
              }
            ]
          );
        } else {
          setIsDeleting(false);
          hideModal();
          handleDeleteLogout();
        }
    
        const data = await response.json();
        
        console.log('✅ Delete Account Complete:', data);
        
      } catch (error) {
        console.error('❌ Error Delete Account:', error);
      } finally {
        setIsDeleting(false); // Stop loading
      }
    };

    const handleDeleteLogout = async () => {
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
        setShowAccountModal(false);
        // socialSignOut();
        
        showCustomAlert(
          'success',
          'Account Deleted Successfully',
          'Your account has been deleted successfully.',
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
        console.error('❌ Error during Account Deleted:', error);
        showCustomAlert(
          'error',
          'Account Deleted Failed',
          'Failed to delete account. Please try again.',
          [
            {
              text: 'OK',
              onPress: hideModal
            }
          ]
        );
      }
    };



  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success'
  });

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

  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // Helper function to check if interactions should be disabled
const areInteractionsDisabled = useCallback((item: PostItem) => {
  // Disable interactions for rejected posts (not approved and not new)
  // AND disable interactions for new posts (waiting for approval)
  return (!item.isApproved && !item.isNew) || item.isNew;
}, []);


  // Load user data from stored tokens
  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userName || userNickName) {
        fetchUserPosts();
      }
    }, [userName, userNickName])
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

  const fetchUserPosts = useCallback(async (forceRefresh: boolean = false) => {
    let fetchuserID = userId;
    if(fetchuserID === ""){
      fetchuserID = await AsyncStorage.getItem('userId') || "";
      setUserId(fetchuserID);
    }

    setLoading(true);
    try {
      const collSentinelRefPost = collection(db, 'SentinelPosts');
      const querySentinel = query(
        collSentinelRefPost,
        where('AuthorUserID', '==', fetchuserID),
        // orderBy('ContentDate', 'desc')
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
            CommentTemplate: postData.CommentTemplate || "Standard Template",
            isRepost: postData.isRepost || false,
            originalPost: postData.originalPost || null,
            repostComment: postData.repostComment || '',
            repostedBy: postData.repostedBy || '',
            repostedAt: postData.repostedAt || null,
            isAnonymous: postData.isAnonymous || false,
            contentType: postData.contentType || 'My Thoughts'
          });
        }

        // Final sort of all combined posts
      const sortedPosts = postsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

        setUserPosts(sortedPosts);
        console.log('OnSnapshot Fetched and Sorted', `Total: ${postsData.length} documents`);

        // ✅ IMPROVED VERSION with error handling
        postsData.forEach(post => {
          onSnapshot(
            collection(doc(db, post.postType, post.id), 'Comments'),
            (commentsSnap) => {
              const totalComments = commentsSnap.size;
              
              setUserPosts(prev =>
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
        });
      });

      return () => {
        unsubscribeSentinel();
      };
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userPosts.length, userId]);

  // Load more posts when scrolling
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMorePosts && userPosts.length > 0) {
      // For now, just prevent infinite loading
      console.log('Load more requested');
    }
  }, [loadingMore, hasMorePosts, userPosts.length]);

  // Helper: Convert path to full URL for display
  const getFullImageUrl = (profilePath: string): string => {
    if (!profilePath) return '';
    
    // If it's already a full URL, return as is
    if (profilePath.startsWith('http')) {
      return profilePath;
    }
    
    // If it's a relative path, construct full URL
    return `https://sentinal-uploads.s3.us-west-2.amazonaws.com/${profilePath}`;
  };

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Hide toast function
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

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

  // Custom Alert function
  const showCustomAlertLoad = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
      isLoading?: boolean; // Add this
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

  const openFullScreenDoc = useCallback((docUrl: string) => {
      setFullScreenDoc(docUrl);
      setIsDocModalVisible(true);
    }, []);

  // Load user data function
  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data from AsyncStorage...');
      
      const [
        fetchuserID,
        fetchuserEmail,
        fetchuserName,
        fetchuserNickName,
        fetchProfilePic,
        fetchUserBio,
        fetchAccessToken
      ] = await AsyncStorage.multiGet([
        'userId',
        'userEmail', 
        'userName',
        'userNickName',
        'profilePicUrl',
        'userBio',
        'userToken'
      ]);
      
      if (fetchuserID[1]) {
        setUserId(fetchuserID[1]);
        console.log("✅ userId loaded:", fetchuserID[1]);
      }
      if (fetchuserEmail[1]) {
        setUserEmail(fetchuserEmail[1]);
        console.log("✅ userEmail loaded:", fetchuserEmail[1]);
      }
      if (fetchuserName[1]) {
        setUserName(fetchuserName[1]);
        console.log("✅ userName loaded:", fetchuserName[1]);
      }
      if (fetchuserNickName[1]) {
        setUserNickName(fetchuserNickName[1]);
        console.log("✅ userNickName loaded:", fetchuserNickName[1]);
      }
      if (fetchProfilePic[1]) {
        setProfilePicUrl(fetchProfilePic[1]);
        console.log("✅ profilePicUrl loaded and set:", fetchProfilePic[1]);
      }
      if (fetchUserBio[1]) {
        setUserBio(fetchUserBio[1]);
        console.log("✅ userBio loaded and set:", fetchUserBio[1]);
      }

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      showCustomAlert(
        'error',
        'Error',
        'Failed to load user data. Please try again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
    }
  };

  // Upload image to AWS with shorter filename
  const uploadImageFile = async (imageUri: string): Promise<string> => {
    if (Platform.OS === "web") {
      console.warn("File upload not supported on web.");
      return '';
    }

    console.log("📤 Uploading image:", imageUri);
    
    // Generate shorter filename to reduce URL length
    const timestamp = Date.now();
    const shortUserId = userId.substring(0, 8);
    const fileName = `p_${shortUserId}_${timestamp}.jpg`;
    const fileType = 'image/jpeg';

    console.log('📝 Generated filename:', fileName, `(${fileName.length} chars)`);

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: fileName,
      type: fileType,
    } as any);

    try {
      console.log("🚀 Starting upload to AWS...");
      const res = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile',
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log("📊 Upload response status:", res.status);
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Upload failed with status:", res.status, "Error:", errText);
        throw new Error(`HTTP status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("✅ Upload response data:", data);
      
      if (!data.fileUrl || data.fileUrl.trim() === '') {
        throw new Error("No valid fileUrl returned from API");
      }
      
      console.log("✅ Upload successful. URL:", data.fileUrl);
      console.log("📏 URL length:", data.fileUrl.length, "characters");
      
      return data.fileUrl;
    } catch (e) {
      console.error("❌ Upload error:", e);
      throw e;
    }
  };

  // Updated updateProfilePicture function to handle 100-char limit
  const updateProfilePicture = async (imageUrl: string) => {
    try {
      console.log('🔐 Getting access token for profile update...');
      
      const accessToken = await AsyncStorage.getItem('userToken');
      
      if (!accessToken) {
        console.error('❌ No access token found in AsyncStorage');
        throw new Error('Access token not found. Please login again.');
      }

      console.log('✅ Access token found');
      
      // Step 1: Check profile picture with AI moderation
      console.log('🤖 Validating profile picture with AI...');
      const moderationResult = await checkProfilePicture(imageUrl);
      console.log('🤖 AI Moderation Result:', moderationResult);
      
      // Step 2: If image doesn't satisfy parameters, show error and use dummy image
      if (moderationResult.postStatus !== 'approved' || moderationResult.flagged) {
        console.warn('⚠️ Profile picture does not meet requirements');
        
        showCustomAlert(
          'error',
          'Profile Picture Not Acceptable',
          'The selected image does not meet our community guidelines. Please choose another image that:\n\n• Shows a clear profile picture\n• Contains no offensive content\n• Meets quality standards\n\nPlease select a different image.',
          [{ text: 'OK', onPress: hideModal }]
        );
        
        // Set dummy/placeholder image
        const dummyImageUrl = "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg";
        setProfilePicUrl(dummyImageUrl);
        await AsyncStorage.setItem('profilePicUrl', dummyImageUrl);
        
        return; // Exit without updating to backend
      }
      
      // Step 3: If validation passes, show green checkmark and proceed
      console.log('✅ Profile picture validation passed!');
      showToast('Image validation successful! ✓', 'success');
      
      console.log('🔄 Original image URL:', imageUrl);
      console.log('🔄 Original URL length:', imageUrl.length, 'characters');
      
      // Extract relative path from S3 URL to stay under 100 characters
      const baseUrl = 'https://sentinal-uploads.s3.us-west-2.amazonaws.com/';
      let profilePath = imageUrl;
      
      if (imageUrl.startsWith(baseUrl)) {
        profilePath = imageUrl.replace(baseUrl, '');
      }
      
      console.log('🔄 Shortened path for API:', profilePath);
      console.log('🔄 Path length:', profilePath.length, 'characters');
      
      // Additional check to ensure we're under 100 characters
      if (profilePath.length > 100) {
        console.warn('⚠️ Path still too long, using filename only');
        const urlParts = profilePath.split('/');
        profilePath = urlParts[urlParts.length - 1];
        console.log('🔄 Final shortened path:', profilePath);
        console.log('🔄 Final length:', profilePath.length, 'characters');
      }
      
      // Step 4: Update profile on backend
      const response = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/update-profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: accessToken,
            profilePicUrl: profilePath
          }),
        }
      );

      console.log("📊 Profile update response status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Profile update failed:", response.status, errText);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please login again.');
        }
        
        throw new Error(`Failed to update profile: ${errText}`);
      }

      const data = await response.json();
      console.log("✅ Profile update successful:", data);

      // Store the FULL URL locally for display purposes
      setProfilePicUrl(imageUrl);
      await AsyncStorage.setItem('profilePicUrl', imageUrl);
      
      // Show success with green checkmark
        showCustomAlert(
        'success',
        'Profile Picture Updated! ✓',
        'Your profile picture has been updated successfully and meets all our community guidelines.',
        [{ text: 'Done', onPress: hideModal }]
      );
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
      showToast(errorMessage, 'error');
      
      if (errorMessage.includes('login again')) {
        setTimeout(() => {
          router.replace('/(auth)/email-login');
        }, 2000);
      }
      
      throw error;
    }
  };

// Helper function to check profile picture with AI moderation
const checkProfilePicture = async (imageUrl: string) => {
  try {
    console.log('🔍 Checking profile picture with AI moderation...');
    console.log('🖼️ Image URL:', imageUrl);
    
    const response = await fetch(
      'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/ai-based-post-analysis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postText: null, // Always null for profile pictures
          imageUrl: imageUrl
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Profile picture moderation check complete:', data);
    
    return {
      postStatus: data.postStatus, // "approved" or "inappropriate"
      flagged: data.flagged,
      violations: data.violations || [],
      categories: data.categories || {}
    };
  } catch (error) {
    console.error('❌ Error checking profile picture:', error);
    // Fallback: if API fails, flag for safety
    return {
      postStatus: 'inappropriate',
      flagged: true,
      violations: ['api_error'],
      categories: {}
    };
  }
};


  // Handle profile picture selection and upload
  const handleProfilePictureUpload = async () => {
    try {
      console.log('🔐 Pre-flight access token check...');
      
      const accessToken = await AsyncStorage.getItem('userToken');
      
      if (!accessToken) {
        console.error('❌ No access token found before upload');
        
        showCustomAlert(
          'error',
          'Authentication Required',
          'Please login again to update your profile picture.',
          [
            {
              text: 'Login',
              onPress: () => {
                hideModal();
                router.replace('/(auth)/email-login');
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: hideModal
            }
          ]
        );
        return;
      }

      console.log('✅ Access token verified before upload');

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'We need access to your photo library to update your profile picture.',
          [
            {
              text: 'OK',
              onPress: hideModal
            }
          ]
        );
        return;
      }

      // Show better image picker options
      showCustomAlert(
        'info',
        'Update Profile Picture',
        'Choose how you want to update your profile picture:',
        [
          {
            text: 'Camera',
            onPress: () => {
              hideModal();
              openCamera();
            }
          },
          {
            text: 'Gallery',
            onPress: () => {
              hideModal();
              openImagePicker();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: hideModal
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error handling profile picture upload:', error);
      showToast('Failed to start upload process', 'error');
    }
  };

  // Open camera
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'We need camera access to take a photo.',
          [
            {
              text: 'OK',
              onPress: hideModal
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error opening camera:', error);
      showToast('Failed to open camera', 'error');
    }
  };

  // Open image picker
  const openImagePicker = async () => {
    // try {
    //   const result = await ImagePicker.launchImageLibraryAsync({
    //     mediaTypes: ['images'],
    //     allowsEditing: true,
    //     aspect: [1, 1],
    //     quality: 0.8,
    //   });

    //   if (!result.canceled && result.assets[0]) {
    //     await processSelectedImage(result.assets[0].uri);
    //   }
    // } catch (error) {
    //   console.error('❌ Error opening image picker:', error);
    //   showToast('Failed to open gallery', 'error');
    // }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'Please grant camera roll permissions to select images.',
          [{ text: 'OK', onPress: hideModal }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        await processSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      const errorDetails = getErrorDetails(error, 'images');
      showCustomAlert('error', errorDetails.title, errorDetails.message, [
        { text: 'OK', onPress: hideModal }
      ]);
    }
  };

  // Process selected image
  const processSelectedImage = async (imageUri: string) => {
    try {
      setIsUploading(true);
      console.log("🔄 Processing selected image:", imageUri);
      
      // Double-check access token before proceeding
      const accessToken = await AsyncStorage.getItem('userToken');
      if (!accessToken) {
        throw new Error('Access token not found. Please login again.');
      }
      console.log('✅ Access token confirmed before processing');
      
      // Upload image to AWS
      console.log("📤 Starting AWS upload...");
      const uploadedUrl = await uploadImageFile(imageUri);
      
      if (uploadedUrl) {
        console.log("✅ AWS upload successful, updating profile...");
        // Update profile with new image URL
        await updateProfilePicture(uploadedUrl);
        console.log("✅ Profile update complete!");
      } else {
        throw new Error('Failed to get upload URL from AWS');
      }
      
    } catch (error) {
      console.error('❌ Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
      showToast(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

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

  // TO OPEN COMMENTS MODAL
  const openCommentsModal = useCallback((item: PostItem) => {
  // Check if post is new (waiting for approval)
  if (item.isNew) {
    Toast.show({
      type: 'warning',
      text1: 'Pending Approval',
      text2: 'This post is waiting for admin approval. You can perform actions after approval.',
      position: 'bottom',
      visibilityTime: 3000,
    });
    return;
  }

  // Check if interactions are disabled for rejected posts
  if (areInteractionsDisabled(item)) {
    Toast.show({
      type: 'warning',
      text1: 'Post Not Available',
      text2: 'This post has been rejected and interactions are disabled.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    return;
  }

  setSelectedPostId(item.id);
  setSelectedPostType(item.postType);
  setSelectedCommentTemplate(item.CommentTemplate);
  setIsCommentModalVisible(true);
}, [areInteractionsDisabled]);

  // TO CLOSE COMMENTS MODAL
  const closeCommentsModal = useCallback(() => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
    setSelectedPostType(null);
    setSelectedCommentTemplate(null);
    // Refresh posts to get updated comment counts
    // fetchUserPosts();
  }, []);

  // TO OPEN GRAPH MODAL
  const openGraphModal = useCallback((item: PostItem) => {
  // Check if post is new (waiting for approval)
  if (item.isNew) {
    Toast.show({
      type: 'warning',
      text1: 'Pending Approval',
      text2: 'This post is waiting for admin approval. You can perform actions after approval.',
      position: 'bottom',
      visibilityTime: 3000,
    });
    return;
  }

  // Check if interactions are disabled for rejected posts
  if (areInteractionsDisabled(item)) {
    Toast.show({
      type: 'warning',
      text1: 'Post Not Available',
      text2: 'This post has been rejected and interactions are disabled.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    return;
  }

  console.log('Graph ID ', item.id);
  setSelectedGraphPostId(item.id);
  setSelectedGraphPostType(item.postType);
  setIsGraphModalVisible(true);
  setSelectedPostId(item.id);
  setSelectedPostType(item.postType);
  setSelectedCommentTemplate(item.CommentTemplate);
  setIsCommentModalVisible(false);
}, [areInteractionsDisabled]);

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

    const toggleLike = useCallback(async (postItem: PostItem) => {
    // Check if post is pending approval
    if (postItem.isNew) {
      Toast.show({
        type: 'warning',
        text1: 'Pending Approval',
        text2: 'This post is waiting for admin approval. You can perform actions after approval.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    // Check if interactions are disabled
    if (areInteractionsDisabled(postItem)) {
      Toast.show({
        type: 'warning',
        text1: 'Action Not Available',
        text2: 'This post has been rejected and interactions are disabled.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    try {
      let fetchuserID = userId;
      if (!fetchuserID) {
        fetchuserID = await AsyncStorage.getItem('userId') || '';
        setUserId(fetchuserID);
      }

      const postRef = doc(db, postItem.postType, postItem.id);

      if (postItem.Liked) {
        // ✅ UNLIKE: Update state FIRST
        setUserPosts(prevPosts =>
          prevPosts.map(post =>
            post.uniqueId === postItem.uniqueId
              ? {
                  ...post,
                  Liked: false,
                  ContentLikeCount: Math.max(0, post.ContentLikeCount - 1)
                }
              : post
          )
        );

        // Then update Firebase
        await updateDoc(postRef, {
          ContentLikeCount: Math.max(0, postItem.ContentLikeCount - 1),
          LikedBy: arrayRemove(fetchuserID),
        });
      } else {
        // ✅ LIKE: Update state FIRST
        setUserPosts(prevPosts =>
          prevPosts.map(post =>
            post.uniqueId === postItem.uniqueId
              ? {
                  ...post,
                  Liked: true,
                  ContentLikeCount: post.ContentLikeCount + 1
                }
              : post
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
      setUserPosts(prevPosts =>
        prevPosts.map(post =>
          post.uniqueId === postItem.uniqueId
            ? {
                ...post,
                Liked: postItem.Liked,
                ContentLikeCount: postItem.ContentLikeCount
              }
            : post
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
  }, [userId, areInteractionsDisabled]);

  // SIMPLE REPOST WITH TOAST
  const handleSimpleRepost = useCallback(async () => {
  if (!selectedRepostPost) return;

  try {
    let fetchuserID = userId;
    if (!fetchuserID) {
      fetchuserID = await AsyncStorage.getItem('userId') || '';
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
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.uniqueId === selectedRepostPost.uniqueId
          ? {
              ...post,
              Reposted: true,
              ContentRepostCount: post.ContentRepostCount + 1
            }
          : post
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
      ContentDesc: renderStyledPostText(selectedRepostPost.ContentDesc) || '',
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
      CommentTemplate: selectedRepostPost.CommentTemplate || 'Standard Template',
      isRepost: true,
      originalPost: {
        id: selectedRepostPost.id || '',
        AuthorUserID: selectedRepostPost.AuthorUserID || '',
        AuthorName: selectedRepostPost.AuthorName || 'Anonymous',
        AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
        ContentDesc: renderStyledPostText(selectedRepostPost.ContentDesc) || '',
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
      setUserPosts(prevPosts =>
        prevPosts.map(post =>
          post.uniqueId === selectedRepostPost.uniqueId
            ? {
                ...post,
                Reposted: selectedRepostPost.Reposted,
                ContentRepostCount: selectedRepostPost.ContentRepostCount
              }
            : post
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
    if (!fetchuserID) {
      fetchuserID = await AsyncStorage.getItem('userId') || '';
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
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.uniqueId === selectedRepostPost.uniqueId
          ? {
              ...post,
              Reposted: true,
              ContentRepostCount: post.ContentRepostCount + 1
            }
          : post
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
      CommentTemplate: selectedRepostPost.CommentTemplate || 'Standard Template',
      isRepost: true,
      originalPost: {
        id: selectedRepostPost.id || '',
        AuthorUserID: selectedRepostPost.AuthorUserID || '',
        AuthorName: selectedRepostPost.AuthorName || 'Anonymous',
        AuthorImageURL: selectedRepostPost.AuthorImageURL || dummyAuthorImage,
        ContentDesc: renderStyledPostText(selectedRepostPost.ContentDesc) || '',
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
      setUserPosts(prevPosts =>
        prevPosts.map(post =>
          post.uniqueId === selectedRepostPost.uniqueId
            ? {
                ...post,
                Reposted: selectedRepostPost.Reposted,
                ContentRepostCount: selectedRepostPost.ContentRepostCount
              }
            : post
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
  // Check if post is new (waiting for approval)
  if (postItem.isNew) {
    Toast.show({
      type: 'warning',
      text1: 'Pending Approval',
      text2: 'This post is waiting for admin approval. You can perform actions after approval.',
      position: 'bottom',
      visibilityTime: 3000,
    });
    return;
  }

  // Check if interactions are disabled for rejected posts
  if (areInteractionsDisabled(postItem)) {
    Toast.show({
      type: 'warning',
      text1: 'Action Not Available',
      text2: 'This post has been rejected and interactions are disabled.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    return;
  }

  console.log('Repost pressed', postItem.id);
  openRepostModal(postItem);
  }, [areInteractionsDisabled]);

  const handleBookmark = useCallback(async (postItem: PostItem) => {
  // Check if post is new (waiting for approval)
  if (postItem.isNew) {
    Toast.show({
      type: 'warning',
      text1: 'Pending Approval',
      text2: 'This post is waiting for admin approval. You can perform actions after approval.',
      position: 'bottom',
      visibilityTime: 3000,
    });
    return;
  }

  // Check if interactions are disabled for rejected posts
  if (areInteractionsDisabled(postItem)) {
    Toast.show({
      type: 'warning',
      text1: 'Action Not Available',
      text2: 'This post has been rejected and interactions are disabled.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    return;
  }

  try {
    console.log('Bookmark pressed', postItem.id);
    let fetchuserID = userId;
    if(!fetchuserID){
      fetchuserID = await AsyncStorage.getItem('userId');
      setUserId(fetchuserID);
    }

    const postRef = doc(db, postItem.postType, postItem.id);
    
    if(postItem.Bookmarked) {
      console.log('Removing bookmark', postItem.id);
      await updateDoc(postRef, {
        BookmarkedBy: arrayRemove(fetchuserID),
      });
    } else {
      console.log('Adding bookmark', postItem.id);
      await updateDoc(postRef, {
        BookmarkedBy: arrayUnion(fetchuserID),
      });
    }

    setUserPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.uniqueId === postItem.uniqueId
          ? { ...post, Bookmarked: !post.Bookmarked }
          : post
      )
    );

    await new Promise((r) => setTimeout(r, 200));
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    Toast.show({
      type: 'error',
      text1: 'Action Failed',
      text2: 'Failed to update bookmark. Please try again.',
      position: 'bottom',
      visibilityTime: 2000,
    });
  }
  }, [userId, areInteractionsDisabled]);

  const handleSharePost = useCallback(async (postItem: PostItem) => {
  // Check if post is new (waiting for approval)
  if (postItem.isNew) {
    Toast.show({
      type: 'warning',
      text1: 'Pending Approval',
      text2: 'This post is waiting for admin approval. You can perform actions after approval.',
      position: 'bottom',
      visibilityTime: 3000,
    });
    return;
  }

  // Check if interactions are disabled for rejected posts
  if (areInteractionsDisabled(postItem)) {
    Toast.show({
      type: 'warning',
      text1: 'Action Not Available',
      text2: 'This post has been rejected and interactions are disabled.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    return;
  }

  try {
    // const shareContent = {
    //   title: `Post by ${postItem.AuthorName}`,
    //   message: `Check out this post: ${renderStyledPostText(postItem.ContentDesc.substring(0, 100))}${postItem.ContentDesc.length > 100 ? '...' : ''}`,
    //   url: postItem.ContentURL || undefined,
    // };
    // await Share.share(shareContent);
    // Toast.show({
    //   type: 'success',
    //   text1: 'Post Shared',
    //   text2: 'Post shared successfully!',
    //   position: 'bottom',
    //   visibilityTime: 2000,
    // });

    const postUrl = `https://ironex.app/post/${postItem?.id}`;

    const shareMessage = `🔗 Tap to view on ironex:
      ${postUrl}`;

      await Share.share({
        message: `${shareMessage}\n${postUrl}`,
        url: postUrl,
        title: '✨ Check out this Sentinel post',
      });

  } catch (error) {
    console.error('Error sharing post:', error);
    Toast.show({
      type: 'error',
      text1: 'Share Failed',
      text2: 'Failed to share post. Please try again.',
      position: 'bottom',
      visibilityTime: 2000,
    });
  }
  }, [areInteractionsDisabled]);


  //Post options
  const handleThreeDotsPress = (item: PostItem, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedPostId(item.id);
    setMenuPosition({ x: pageX - 120, y: pageY + 10 });
    setShowMenuModal(true);
  };

  const handleDeletePost = async (postId: string) => {
  setPostToDelete(postId);
  setIsDeleteModalVisible(true);
};

const confirmDeletePost = async () => {
  if (!postToDelete) return;
  
  try {
    const postRef = doc(db, "SentinelPosts", postToDelete);
    await deleteDoc(postRef);
    console.log('Post deleted successfully');
    
    setIsDeleteModalVisible(false);
    setShowMenuModal(false);
    setSelectedPostId(null);
    setPostToDelete(null);
    
    // Optional: Show success message
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Post deleted successfully',
      position: 'top',
      visibilityTime: 3000,
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    setIsDeleteModalVisible(false);
     setShowMenuModal(false);
    
    // Show error with CustomModal
    setIsDeleteModalVisible(true);
  }
};

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

  // OPTIMIZED MEDIA CONTENT - REDUCED SIZES
  // OPTIMIZED MEDIA CONTENT WITH INSTAGRAM CAROUSEL
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



  // UPDATED: Get post status for display - FIXED to show REJECTED instead of PENDING
  const getPostStatus = (item: PostItem) => {
    if (item.postType === 'X-Data') {
      return {
        text: '𝕏 POST',
        color: '#1DA1F2',
        bgColor: 'bg-blue-100'
      };
    }
    
    if (item.isNew) {
      return {
        text: 'NEW',
        color: '#F59E0B',
        bgColor: 'bg-yellow-100'
      };
    } else if (item.isApproved) {
      return {
        text: 'APPROVED',
        color: '#10B981',
        bgColor: 'bg-green-100'
      };
    } else {
      // FIXED: Changed from 'PENDING' to 'REJECTED'
      return {
        text: 'REJECTED',
        color: '#EF4444',
        bgColor: 'bg-red-100'
      };
    }
  };

  // UPDATED: Render post content with DISABLED BUTTONS for rejected posts
  const renderPostContent = useCallback((item: PostItem, index: number) => (
    <TouchableOpacity 
      key={`post-${item.uniqueId}-${index}`}
      activeOpacity={0.95}
      onPress={() => openCommentsModal(item)}
      className="bg-white mx-4 mb-3 rounded-2xl shadow-sm border border-gray-100"
    >
      <View className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="relative">
            <View className="w-8 h-8 rounded-full mr-2 overflow-hidden border-2 border-white shadow-sm">
              <Image
                source={{ uri: item?.AuthorImageURL || profilePicUrl || dummyAuthorImage }}
                className="w-full h-full"
                resizeMode="cover"
                resizeMethod="resize"
              />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-sm">{item.AuthorName}</Text>
            <View className="flex-row items-center mt-0.5">
              {item.postType !== 'X-Data' && (
                <View className="bg-blue-100 px-1 py-0.5 rounded-full mr-1.5">
                  <Text className="text-blue-600 text-xs font-regular">• {item.contentType}</Text>
                </View>
              )}
              {item.postType === 'X-Data' && (
                <View className="bg-blue-100 px-0.5 py-0.5 rounded-full mr-1.5">
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
              
          <Text className="text-gray-500 text-xs mr-5">{getTimeAgo(item.ContentDate)}</Text>
          <TouchableOpacity className="p-1.5 rounded-full bg-gray-100"
            onPress={(event) => handleThreeDotsPress(item, event)}>
            <Ionicons name="ellipsis-horizontal" size={12} color="#64748b" />
          </TouchableOpacity>
        </View>

      </View>

      <View className="px-3 py-2.5">
        <Text className="text-gray-800 text-sm leading-5 mb-2 font-normal">{renderStyledPostText(item.ContentDesc)}</Text>

        {renderRepostContent(item)}

        {renderMediaContent(item, index)}

        {/* UPDATED: Post Actions with DISABLED STATE for rejected posts */}
        <View className="flex-row items-center">
              <View className="flex-1"> 
                <View className="flex-row items-center mt-1.5">

                  <TouchableOpacity
                    className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
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
                    className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
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
                    className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
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
                    className={`mr-2 p-1.5 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                    onPress={(e) => {
                      e.stopPropagation();
                      openGraphModal(item);
                    }}
                    activeOpacity={0.7}
                    disabled={areInteractionsDisabled(item)}
                  >
                    <Feather name="bar-chart-2" size={20} color="#64748b" />
                  </TouchableOpacity>

                </View>
          
              </View>

              <View className="flex-row items-center mt-1.5">
                <TouchableOpacity
                  className={`flex-row items-center mr-5 px-1.5 py-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
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
                  className={`mr-2 p-1 ${areInteractionsDisabled(item) ? 'opacity-50' : ''}`}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSharePost(item);
                  }}
                  activeOpacity={0.7}
                  disabled={areInteractionsDisabled(item)}
                >
                  <Feather name="share-2" size={20} color="#64748b" />
                </TouchableOpacity>
                </View>

            </View>
      </View>
    </TouchableOpacity>
  ), [openCommentsModal, toggleLike, handleRepost, handleBookmark, handleSharePost, openGraphModal, renderMediaContent, getTimeAgo, getPostStatus, profilePicUrl, dummyAuthorImage, areInteractionsDisabled, renderRepostContent]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserPosts();
    setRefreshing(false);
  }, [fetchUserPosts]);

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
      setShowAccountModal(false);
      // socialSignOut();
      
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

  const confirmLogout = () => {
    setShowAccountModal(false);
    showCustomAlert(
      'warning',
      'Logout Confirmation',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: hideModal
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            hideModal();
            handleLogout();
          }
        }
      ]
    );
  };

  const handleProfileSettings = () => {
    setShowAccountModal(false);
    showCustomAlert(
      'info',
      'Coming Soon',
      'Profile settings feature is under development and will be available soon.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  const handleAppSettings = () => {
  setShowAccountModal(false);
  hideModal();
  setShowAppInfo(true); // Open App Info Modal
};
  const handleHelpSupport = () => {
    setShowAccountModal(false);
    hideModal();
    setShowHelpScreen(true); // open App Guide
  };


  // const handleHelpSupport = () => {
  // setShowAccountModal(false);
  // showCustomAlert(
  //   'info',
  //   'Help & Support',
  //   'Need help? Please contact our support team at IronExSafe@gmail.com or visit our FAQ section.',
  //   [
  //     {
  //       text: 'Contact Support',
  //       onPress: () => {
  //         hideModal();
  //         // Show the contact support alert
  //         showCustomAlert(
  //           'info',
  //           'Contact Support',
  //           'You can reach our support team at IronExSafe@gmail.com',
  //           [
  //             {
  //               text: 'OK',
  //               onPress: hideModal
  //             }
  //           ]
  //         );
  //       }
  //     },
  //     {
  //       text: 'View FAQ',
  //       onPress: () => {
  //         hideModal();
  //         handleFAQ();
  //       }
  //     }
  //   ]
  // );
  // };


  const handleFAQ = () => {
    setShowAccountModal(false);
    setShowFAQModal(true);
  };

  const handlePasswordVerified = () => {
  console.log('✅ [Profile] Password verified, opening edit profile...');
  setEditVisible(true); // Now open the edit profile modal
  };

  const handleEditProfile = () => {
  console.log('📝 [Profile] Opening password verification...');
  setShowPasswordVerify(true); // Show password verification first
  };

  const handleShareProfile = () => {
    showCustomAlert(
      'info',
      'Share Profile',
      'Sharing feature is coming soon! You will be able to share your profile with others via social media and messaging apps.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  const handleThreeDots = () => {
    showCustomAlert(
      'info',
      'Profile Options',
      'Additional profile options will be available here soon.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  // Get selected post data for modals
  const selectedPostData = useMemo(() => {
    return userPosts.find(post => post.id === selectedPostId && post.postType === selectedPostType);
  }, [userPosts, selectedPostId, selectedPostType]);

  const selectedGraphPostData = useMemo(() => {
    return userPosts.find(post => post.id === selectedGraphPostId && post.postType === selectedGraphPostType);
  }, [userPosts, selectedGraphPostId, selectedGraphPostType]);

  const socialSignOut = async () => {
    const clientId = "u2868f22cqiddetr6db89237d";
    const cognitoDomain = "https://us-east-27yy7pjbe8.auth.us-east-2.amazoncognito.com";
    
    // 1. Define the logout redirect (Must match AWS Console)
    const logoutUri = makeRedirectUri({
      scheme: "frontend", 
    });
  
    // 2. Construct the Logout URL
    const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  
    try {
      // 3. Open the browser to clear the Cognito session
      // This will prompt "App wants to use amazon-auth... to Sign In" 
      // (This is normal for iOS/Android OIDC logout flows)
      await WebBrowser.openAuthSessionAsync(logoutUrl, logoutUri, {preferEphemeralSession: true});
      
      // 4. Clear your local state
      // setTokens(null); 
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header with improved styling */}
      <View className="bg-white px-6 py-4 flex-row items-center justify-between shadow-sm border-b border-gray-100 pt-10">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="settings-outline" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View style={{ flex: 1 }}>
        {/* Your normal screen content */}
          <View>
            {/* Profile Section - NEW HORIZONTAL LAYOUT */}
            <View className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100">
              <View className="px-6 py-8">
              {/* Profile Header - Horizontal Layout with Image on Left */}
                <View className="flex-row items-center mb-6">
                {/* Profile Picture - Left Side */}
                  <TouchableOpacity
                    onPress={handleProfilePictureUpload}
                    disabled={isUploading}
                    className="relative mr-4"
                  >
                    <View className="w-20 h-20 rounded-full overflow-hidden bg-black items-center justify-center shadow-lg">
                      {profilePicUrl ? (
                        <Image 
                          source={{ uri: getFullImageUrl(profilePicUrl) }}
                          className="w-full h-full"
                          style={{ resizeMode: 'cover' }}
                          resizeMethod="resize"
                        />
                      ) : (
                        <Ionicons name="person" size={32} color="white" />
                      )}
                  
                      {/* Loading overlay */}
                      {isUploading && (
                        <View className="absolute inset-0 bg-black/50 items-center justify-center">
                          <ActivityIndicator size="small" color="white" />
                        </View>
                      )}
                    </View>
                
                    {/* Edit icon - smaller for horizontal layout */}
                    <View className="absolute -bottom-1 -right-1 w-7 h-7 bg-black rounded-full items-center justify-center border-2 border-white shadow-md">
                      {isUploading ? (
                        <ActivityIndicator size={14} color="white" />
                      ) : (
                        <Ionicons name="pencil" size={14} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Name and Username - Next to Image */}
                  <View className="flex-1 mr-2">
                    <Text className="text-xl font-bold text-gray-900 mb-1">
                      {userName || userNickName || 'User'}
                    </Text>
                    <Text className="text-gray-500 text-base">
                      @{userNickName || userName || 'username'}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row space-x-2">
                    <View className="flex-row space-x-2">
                      <View>
                        <TouchableOpacity 
                          className="flex-1 bg-gray-900 py-2 px-3 rounded-xl"
                          onPress={handleEditProfile}  // ✅ Correct - Opens password modal first
                        >
                          <Text className="text-white font-semibold text-center text-base">
                            Edit Profile
                          </Text>
                        </TouchableOpacity>

                        {/* Password Verification Modal */}
                        <PasswordVerificationModal
                          visible={showPasswordVerify}
                          onClose={() => setShowPasswordVerify(false)}
                          onSuccess={handlePasswordVerified}
                        />

                        {/* Edit Profile Screen - Opens after password verification */}
                        {userData && (
                          <EditProfileScreen
                            visible={editVisible}
                            onClose={() => setEditVisible(false)}
                            onSuccess={(data) => {
                              console.log('Profile updated, refreshing display...');
                              loadProfileData();
                              Toast.show({
                                type: 'success',
                                text1: 'Profile Updated',
                                text2: 'Your profile has been updated successfully.',
                                position: 'bottom',
                                visibilityTime: 2000,
                              });
                            }}
                          />
                        )}
                      </View>
                      
                    </View>
                  </View>
                </View>

            {/* Stats Section - Below Profile Header */}
            {/* <View className="flex-row justify-around py-4 border-t border-b border-gray-100 mb-6">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">{userPosts.length}</Text>
                <Text className="text-gray-500 text-sm mt-1">Posts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">453</Text>
                <Text className="text-gray-500 text-sm mt-1">Followers</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">245</Text>
                <Text className="text-gray-500 text-sm mt-1">Following</Text>
              </View>
            </View> */}

            {/* Bio Section - Below Stats */}
            <View className="mb-1">
              <Text className="text-gray-700 leading-6 text-justify">
                {userBio || "Welcome to my profile! I love sharing moments and connecting with amazing people. Let's create something beautiful together! ✨"}
              </Text>
            </View>
          </View>
        </View>

        {/* My Posts Section */}
        <View className="mt-4">
          <View className="px-4 mb-3">
            <Text className="text-lg font-bold text-gray-900">My Posts</Text>
            {userPosts.length > 0 && (
              <Text className="text-gray-500 text-sm mt-1">{userPosts.length} posts</Text>
            )}
          </View>
          
          {/* Loading at Top */}
          {loading && !refreshing && (
            <LoadingComponent visible={true} size="medium" />
          )}
          
          {loading && !refreshing ? (
            <SkeletonLoader count={3} />
          ) : userPosts.length === 0 && !loading ? (
            <View className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 py-12">
              <View className="items-center">
                <Ionicons name="create-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-semibold mt-4">No posts yet</Text>
                <Text className="text-gray-400 text-sm mt-2 text-center px-6">
                  Start sharing your thoughts and moments with your followers!
                </Text>
              </View>
            </View>
          ) : (
            <>
              {userPosts.map((item, index) => renderPostContent(item, index))}
              
              {/* Loading at Bottom */}
              {loadingMore && (
                <LoadingComponent visible={true} size="small" />
              )}
            </>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
          </View>
        <LoadingDeleteOverlay visible={isDeleting} message="Deleting Account..." />
        </View>
        
      </ScrollView>

      <RepostModal
        visible={isRepostModalVisible}
        onClose={closeRepostModal}
        post={selectedRepostPost}
        onSimpleRepost={handleSimpleRepost}
        onQuoteRepost={handleQuoteRepost}
      />

      {/* Comments Modal */}
      {selectedPostId && selectedPostType && selectedPostData && (
        <CommentsModal
          visible={isCommentModalVisible}
          onClose={closeCommentsModal}
          postId={selectedPostId}
          postType={selectedPostType}
          postData={selectedPostData}
          commentTemplate={selectedCommentTemplate}
        />
      )}

      {/* Graph Modal */}
      {selectedGraphPostId && selectedGraphPostType && selectedGraphPostData && (
        <TotalSentiment
          visible={isGraphModalVisible}
          onClose={closeGraphModal}
          postId={selectedGraphPostId}
          postType={selectedGraphPostType}
          postData={selectedGraphPostData}
          userExistingComment={null}
          onEditComment={() => {}}
          onAddResponse={addResponseGraphModal}
          commentTemplate={selectedCommentTemplate}
        />
      )}

      {/* Account Modal - same as before */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">Account</Text>
                <TouchableOpacity 
                  onPress={() => setShowAccountModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            <View className="px-6 pb-6">
              {/* User Info Section */}
              <View className="flex-row items-center mb-6 p-4 bg-gray-50 rounded-xl">
                <View className="w-12 h-12 rounded-full overflow-hidden bg-black items-center justify-center mr-4">
                  {profilePicUrl ? (
                    <Image 
                      source={{ uri: getFullImageUrl(profilePicUrl) }}
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                      resizeMethod="resize"
                    />
                  ) : (
                    <Ionicons name="person" size={24} color="white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-base">{userName || 'User Name'}</Text>
                  <Text className="text-gray-500 text-sm">{userEmail || 'user@email.com'}</Text>
                </View>
              </View>

              {/* Menu Options */}
              <View className="space-y-2">
                {/* <TouchableOpacity 
                  onPress={handleProfileSettings}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="person-outline" size={20} color="#3B82F6" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">Profile Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity> */}
                <TouchableOpacity 
                  onPress={handleAppSettings}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="settings-outline" size={20} color="#10B981" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">App Info</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleHelpSupport}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">
                    App Guide
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                { /* FAQ Option */ }
                <TouchableOpacity 
                  onPress={handleFAQ}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="help-outline" size={20} color="#8B5CF6" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">F A Q</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                {/* Delete/Deactivate Account Option */}
                <TouchableOpacity 
                  onPress={handleDeleteAccount}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">Delete Account</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Divider */}
                <View className="h-px bg-gray-200 my-2" />
                {/* Logout Button */}
                <TouchableOpacity 
                  onPress={confirmLogout}
                  className="flex-row items-center p-4 rounded-xl bg-red-50 active:bg-red-100"
                >
                  <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="flex-1 text-red-600 font-medium">Logout</Text>
                  <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen FAQ Modal */}
      <Modal
        visible={showFAQModal}
        animationType="slide"
        // presentationStyle="fullScreen"
        onRequestClose={() => setShowFAQModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          {/* FAQ Header with close icon and FAQ title */}
          <View className="flex-row items-center justify-between px-5 pt-20 border-b border-gray-100">
            <Text className="text-2xl font-bold text-black">F A Q</Text>
            <TouchableOpacity 
              onPress={() => setShowFAQModal(false)}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          {/* FAQ Content */}
          <ScrollView className="flex-1 px-5 py-6">
            {/* FAQ Title + Subtitle */}
            <SentinelFAQ showHeader={true} />
            {/* Contact Support Section */}
            <View className="mt-8 bg-violet-50 rounded-xl p-6 border border-violet-100">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Still need help?
              </Text>
              <Text className="text-sm text-gray-600 mb-4 leading-6">
                Can't find what you're looking for? Our support team is ready to assist you with any questions or concerns.
              </Text>
              <TouchableOpacity 
                className="bg-black py-3 px-6 rounded-lg items-center mb-8"
                onPress={() => {
                  setShowFAQModal(false);
                  showCustomAlert(
                    'info',
                    'Contact Support',
                    'You can reach our support team at IronExSafe@gmail.com',
                    [
                      {
                        text: 'OK',
                        onPress: hideModal
                      }
                    ]
                  );
                }}
              >
                <Text className="text-white font-semibold text-sm">Contact Support</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />
      <Modal
        visible={showHelpScreen}
        animationType="slide"
        // presentationStyle="fullScreen"
        onRequestClose={() => setShowHelpScreen(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
         <HelpScreen onClose={() => setShowHelpScreen(false)} />
        </SafeAreaView>
        
      </Modal>
      <PasswordVerificationModal
        visible={showPasswordVerify}
        onClose={() => setShowPasswordVerify(false)}
        onSuccess={handlePasswordVerified}
      />

      {/* Toast Notification */}
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Three Dots Menu Modal */}
      {/* Three Dots Menu Modal */}
      {/* Three Dots Menu Modal */}
      {showMenuModal && (
        <Modal
          visible={showMenuModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenuModal(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            activeOpacity={1}
            onPress={() => setShowMenuModal(false)}
          >
            <View
              style={{
                position: 'absolute',
                top: menuPosition.y,
                left: menuPosition.x,
                backgroundColor: '#fff',
                borderRadius: 12,
                paddingVertical: 8,
                minWidth: 160,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {/* Edit Button - Only show if post is "new" */}
              {(() => {
                const currentPost = userPosts.find(item => item.id === selectedPostId);
                if (currentPost?.isNew) {
                  return (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          if (selectedPostId) {
                            handleEditPost(selectedPostId);
                          }
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="pencil" size={16} color="#007AFF" />
                        <Text style={{ marginLeft: 10, fontSize: 14, color: '#007AFF' }}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <View style={{ height: 0.5, backgroundColor: '#e5e5e5', marginHorizontal: 8 }} />
                    </>
                  );
                }
                return null;
              })()}

              {/* Delete Button */}
              <TouchableOpacity
                onPress={() => {
                  if (selectedPostId) {
                    handleDeletePost(selectedPostId);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
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

      {/* Edit Post Modal */}
        <Modal
          visible={isEditModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancelEdit}
          statusBarTranslucent
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl" style={{ maxHeight: screenHeight * 0.85 }}>
              {/* Header */}
              <View className="px-6 py-4 border-b border-gray-200 flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  className="p-2"
                >
                  <Text className="text-blue-500 font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
                
                <Text className="text-lg font-bold text-gray-900">Edit Post</Text>
                
                <TouchableOpacity
                  onPress={handleSaveEditPost}
                  className="p-2"
                >
                  <Text className="text-blue-500 font-semibold text-base">Save</Text>
                </TouchableOpacity>
              </View>

              {/* Edit Status Badge */}
              <View className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={18} color="#F59E0B" />
                  <Text className="ml-2 text-yellow-700 text-sm font-medium">
                    Editing "New" Status Post
                  </Text>
                </View>
                <Text className="text-yellow-600 text-xs mt-1 ml-7">
                  Once approved, this post cannot be edited
                </Text>
              </View>

              {/* Content Editor */}
              <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                <Text className="text-gray-700 font-semibold mb-2">Post Content</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl p-4 text-gray-900 min-h-[200px]"
                  placeholder="Write your post content..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={editPostContent}
                  onChangeText={setEditPostContent}
                  maxLength={2000}
                  autoFocus
                />
                <View className="flex-row justify-between mt-2">
                  <Text className="text-xs text-gray-500">
                    {editPostContent.length}/2000 characters
                  </Text>
                  {editPostData && editPostContent !== editPostData.ContentDesc && (
                    <Text className="text-xs text-blue-500 font-medium">
                      * Modified
                    </Text>
                  )}
                </View>

                {/* Original Media Preview (Read-only) */}
                {editPostData && (editPostData.ContentURL || editPostData.ContentURLs) && (
                  <View className="mt-4">
                    <Text className="text-gray-700 font-semibold mb-2">Attached Media</Text>
                    <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <View className="flex-row items-center">
                        <Ionicons name="image-outline" size={20} color="#64748B" />
                        <Text className="ml-2 text-gray-600 text-sm">
                          Media cannot be edited
                        </Text>
                      </View>
                      {renderMediaContent(editPostData)}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Action Buttons */}
              <View className="px-6 py-4 border-t border-gray-200">
                <View className="flex-row" style={{ gap: 12 }}>
                  <TouchableOpacity
                    className="flex-1 py-4 px-6 rounded-xl bg-gray-200"
                    onPress={handleCancelEdit}
                    activeOpacity={0.8}
                  >
                    <Text className="text-gray-700 font-semibold text-center text-base">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 py-4 px-6 rounded-xl ${
                      editPostContent.trim() === "" ? "bg-gray-300" : "bg-black"
                    }`}
                    onPress={handleSaveEditPost}
                    activeOpacity={0.8}
                    disabled={editPostContent.trim() === ""}
                    style={{
                      shadowColor: editPostContent.trim() !== "" ? "#000" : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: editPostContent.trim() !== "" ? 6 : 0,
                    }}
                  >
                    <Text
                      className={`font-semibold text-center text-base ${
                        editPostContent.trim() === "" ? "text-gray-500" : "text-white"
                      }`}
                    >
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
        <AppInfoModal 
        visible={showAppInfo} 
        onClose={() => setShowAppInfo(false)} 
      />

    {/* <Toast config={toastConfig} /> */}
    

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
});

function setUserCountry(arg0: string) {
  throw new Error('Function not implemented.');
}
