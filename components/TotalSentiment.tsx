import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { collection, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InstagramMediaCarousel } from './MediaCarousel';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Comment {
  id: string;
  AuthorName: string;
  AuthorImageURL?: string;
  Comment: string;
  CommentDate: any;
  likes?: number;
  isLiked?: boolean;
  replies: any[];
  selectedOptions?: string[];
  commentType: 'structured' | 'text';
  userId?: string;
}

interface PostData {
  id: string;
  AuthorImageURL: string;
  AuthorName: string;
  AuthorUsername?: string;
  ContentDate: string;
  ContentDesc: string;
  ContentURL: string;
  ContentURLs?: string[];
  ContentLikeCount: number;
  ContentRepostCount: number;
  ContentCommentCount?: number;
  postType: string;
  Liked: boolean;
  Reposted: boolean;
  CommentTemplate: string;
  isAnonymous: boolean;
  contentType: string;
}

interface TotalSentimentProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postType: string | null;
  postData: PostData | undefined;
  onAddResponse: () => void;
  userExistingComment: Comment | null;
  onEditComment: (comment: Comment) => void;
  commentTemplate: string | null;
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

// Response options matching the design
let RESPONSE_OPTIONS: any[] = [];

// Sentiment API Response
interface SentimentAPIResponse {
  data: {
    summary: string;
  };
}

export default function TotalSentiment({ 
  visible, 
  onClose, 
  postId, 
  postType, 
  postData,
  onAddResponse,
  userExistingComment,
  onEditComment,
  commentTemplate
}: TotalSentimentProps) {
  const insets = useSafeAreaInsets();
  const [sentimentData, setSentimentData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [totalResponses, setTotalResponses] = useState(0);

  // NEW: Full screen media states
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  // NEW: Real-time timestamp state
  const [postTimeAgo, setPostTimeAgo] = useState('');

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

  // NEW: Update time ago every minute
  useEffect(() => {
    if (postData?.ContentDate) {
      // Initial calculation
      setPostTimeAgo(getTimeAgo(postData.ContentDate));
      
      // Update every minute
      const interval = setInterval(() => {
        setPostTimeAgo(getTimeAgo(postData.ContentDate));
      }, 60000); // Update every 60 seconds
      
      return () => clearInterval(interval);
    }
  }, [postData?.ContentDate, getTimeAgo]);

  // Determine media type based on URL
  const getMediaType = useCallback((url: string) => {
    if (!url) return 'unknown';
    
    const lower = url.toLowerCase();
    const urlPath = lower.split(/[?#]/)[0];
    
    if (urlPath.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/)) return 'video';
    if (urlPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return 'image';
    
    if (lower.includes('video') || lower.includes('youtube') || lower.includes('vimeo')) {
      return 'video';
    }
    
    return 'image';
  }, []);

  // Check if current post is a video
  const isVideoPost = postData?.ContentURL ? getMediaType(postData.ContentURL) === 'video' : false;
  
  // Video player setup - only for video posts
  const videoPlayer = useVideoPlayer(
    isVideoPost && postData?.ContentURL ? postData.ContentURL : '', 
    (player) => {
      if (isVideoPost && postData?.ContentURL) {
        player.loop = true;
        player.muted = true;
      }
    }
  );

  // Full screen video player
  const fullScreenVideoPlayer = useVideoPlayer(fullScreenVideo || '', (player) => {
    player.loop = false;
    player.play();
  });

  // Full screen handlers
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

  // Color palette for pie chart
  const CHART_COLORS = [
    '#FF3B30', // Red
    '#FFD60A', // Yellow
    '#007AFF', // Blue
    '#34C759', // Green
    '#FF9500', // Orange
    '#5856D6', // Purple
    '#FF2D55', // Pink
    '#32ADE6', // Cyan
  ];

  const fetchCommentTemplate = useCallback(async () => {
    try {
      const collCommentTempPost = collection(db, 'templates');
      // const collCommentTempPost = collection(db, 'SentimentTemplates');
      console.log("Comment Template Called");

      const unsubscribeCommentTemp = onSnapshot(collCommentTempPost, commentTempSnapshot => {
        const commentTempdataArr = commentTempSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        RESPONSE_OPTIONS = [];
        for (const doc of commentTempdataArr) {
          const postData = doc.data;
          const postId = doc.id;
          console.log("Comment Template Passed: ", commentTemplate);
          console.log("Comment Template Fetched: ", postData);

          if(commentTemplate == postData.name) {
            const optionsField = postData.options;

            optionsField.map((nestedOption, index) => {
              // Get the key (e.g., "option1") and the value (the {icon, title} map)
              const optionKey = Object.keys(nestedOption)[0];
              const optionDetails = nestedOption[optionKey];

              RESPONSE_OPTIONS.push({
                id: typeof optionDetails.title === "string" ? optionDetails.title : "",
                label: typeof optionDetails.title === "string" ? optionDetails.title : "",
                icon: typeof optionDetails.icon === "string" ? optionDetails.icon : "",
                color: '#34C759'
              })
            })

          }

         
        }
        console.log("RESPONSE_OPTIONS loaded:", RESPONSE_OPTIONS);
      })

      return () => {
        unsubscribeCommentTemp();
      };

    } catch (error) {
      console.error(error);
    }
  },[commentTemplate]);

  // Fetch sentiment analysis from API
  const fetchSentimentAnalysis = async () => {
    if (!postId) return;
    
    try {
      console.log('Fetching sentiment analysis for postId:', postId);
      
      const response = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/sentiment-analysis',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: postId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SentimentAPIResponse = await response.json();
      console.log('Sentiment API Response:', result);
      
      if (result.data && result.data.summary) {
        setAiSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Error fetching sentiment analysis:', error);
      setAiSummary('Unable to generate sentiment analysis at this time.');
    }
  };
  
  // Fetch sentiment data from Firestore
  const fetchSentimentData = async () => {
    if (!postId || !postType) return;

    setLoading(true);
    try {
      const commentsRef = collection(db, postType, postId, 'Comments');

      const unsubscribeCommentData = onSnapshot(commentsRef, commentsSnapshot => {
        const commentDataArr = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        console.log("Comments fetched:", commentDataArr.length);

        // Initialize counts object dynamically based on RESPONSE_OPTIONS
        const counts: any = {};
        RESPONSE_OPTIONS.forEach(option => {
          counts[option.id] = 0;
        });

        let total = 0;
        
        // Count responses
        for (const doc of commentDataArr) {
          const commentData = doc.data;
          if (commentData.selectedOptions && commentData.selectedOptions.length > 0) {
            const option = commentData.selectedOptions[0];
            if (counts.hasOwnProperty(option)) {
              counts[option]++;
              total++;
            }
          }
        }

        console.log("Counts:", counts);
        console.log("Total responses:", total);

        setTotalResponses(total);

        if (total > 0) {
          // Calculate percentages
          const percentages: any = {};
          Object.keys(counts).forEach(key => {
            percentages[key] = Math.round((counts[key] / total) * 100);
          });

          console.log("Percentages:", percentages);
          setSentimentData(percentages);

          // Generate pie chart data
          const chartData = RESPONSE_OPTIONS.map((option, index) => {
            const count = counts[option.id] || 0;
            const percentage = percentages[option.id] || 0;
            
            return {
              value: count,
              color: CHART_COLORS[index % CHART_COLORS.length],
              text: `${percentage}%`,
              label: option.label,
              icon: option.icon,
              focused: false,
              textColor: 'white',
              textSize: 16,
              fontWeight: 'bold',
            };
          }).filter(item => item.value > 0); // Only show non-zero values

          console.log("Chart Data:", chartData);
          setPieChartData(chartData);
        } else {
          setSentimentData({});
          setPieChartData([]);
        }

        setLoading(false);
      });

      return () => {
        unsubscribeCommentData();
      };

    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      setLoading(false);
    }
  };

  const handleAddResponse = () => {
    onClose(); // Close sentiment page
    
    // Check if user already has a comment
    if (userExistingComment) {
      Alert.alert(
        "Edit Your Response",
        "You have already responded to this post. Would you like to edit your existing response?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Edit", 
            onPress: () => {
              onEditComment(userExistingComment);
            }
          }
        ]
      );
    } else {
      onAddResponse(); // Open response selection
    }
  };

  useEffect(() => {
    if (commentTemplate !== null) {
      fetchCommentTemplate();
    }
  }, [commentTemplate]);

  useEffect(() => {
    if (visible && postId && postType && RESPONSE_OPTIONS.length > 0) {
      fetchSentimentData();
      fetchSentimentAnalysis();
    }
  }, [visible, postId, postType, RESPONSE_OPTIONS]);

  // Cleanup video player when modal closes
  useEffect(() => {
    if (!visible && videoPlayer && isVideoPost) {
      videoPlayer.pause();
    }
    // Close full screen modals
    if (!visible) {
      closeFullScreenImage();
      closeFullScreenVideo();
    }
  }, [visible, isVideoPost]);

  // Render pie chart legend
  const renderLegend = () => {
    return (
      <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 }}>
          Legend
        </Text>
        {pieChartData.map((item, index) => (
          <View 
            key={index}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 12,
              backgroundColor: '#f8f9fa',
              padding: 10,
              borderRadius: 8
            }}
          >
            <View 
              style={{ 
                width: 20, 
                height: 20, 
                backgroundColor: item.color, 
                borderRadius: 4,
                marginRight: 12 
              }} 
            />
            {item.icon && (
              <Image
                source={{ uri: item.icon }}
                style={{ width: 30, height: 30, marginRight: 8 }}
                resizeMode="contain"
                resizeMethod="resize"
              />
            )}
            <Text style={{ fontSize: 15, color: '#000', flex: 1, fontWeight: '500' }}>
              {item.label}
            </Text>
            <Text style={{ fontSize: 15, color: '#000', fontWeight: 'bold' }}>
              {item.value} ({item.text})
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Render media content with full screen on tap
  const renderMediaContent = () => {
    if (!postData?.ContentURL) return null;

    const mediaType = getMediaType(postData.ContentURL);

    if (mediaType === 'video') {
      return (
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity 
            onPress={() => openFullScreenVideo(postData.ContentURL)}
            activeOpacity={0.95}
          >
            <View style={{ 
              position: 'relative', 
              borderRadius: 12, 
              overflow: 'hidden', 
              backgroundColor: '#000' 
            }}>
              <VideoView
                player={videoPlayer}
                style={{ width: '100%', height: 200 }}
                contentFit="contain"
                nativeControls={false}
              />
              <View style={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                padding: 6, 
                borderRadius: 20, 
                backgroundColor: 'rgba(0,0,0,0.5)' 
              }}>
                <Ionicons name="play-outline" size={14} color="white" />
              </View>
              <View style={{ 
                position: 'absolute', 
                bottom: 8, 
                right: 8, 
                padding: 6, 
                borderRadius: 20, 
                backgroundColor: 'rgba(0,0,0,0.5)' 
              }}>
                <Ionicons name="expand-outline" size={14} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // Image content with full screen on tap
    return (
      <TouchableOpacity 
        onPress={() => openFullScreenImage(postData.ContentURL)}
        activeOpacity={0.95}
      >
        <View style={{ position: 'relative', marginBottom: 12 }}>
          <Image
            source={{ uri: postData.ContentURL }}
            style={{ 
              width: '100%', 
              height: 200, 
              borderRadius: 12, 
              backgroundColor: '#e8e8e8'
            }}
            resizeMode="cover"
            resizeMethod="resize"
          />
          <View style={{ 
            position: 'absolute', 
            bottom: 8, 
            right: 8, 
            padding: 6, 
            borderRadius: 20, 
            backgroundColor: 'rgba(0,0,0,0.5)' 
          }}>
            <Ionicons name="expand-outline" size={14} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={false}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          
          {/* Header */}
          <View 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: Platform.OS === 'ios' ? insets.top + 12 : insets.top + 20,
              paddingBottom: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: '#e5e5e5',
              backgroundColor: '#fff'
            }}
          >
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginLeft: 8 }}>
              Total Sentiment
            </Text>
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF3B30" />
              <Text style={{ marginTop: 16, color: '#8e8e93' }}>Loading sentiment data...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={true}
              >
                {/* Post Preview */}
                {postData && (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Image
                        source={{ uri: postData.AuthorImageURL || 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg' }}
                        style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 20, 
                          marginRight: 12,
                          backgroundColor: '#e8e8e8' 
                        }}
                        resizeMode="cover"
                        resizeMethod="resize"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                          {(postData.isAnonymous) ? 'Anonymous' : postData.AuthorName}
                        </Text>
                        {/* UPDATED: Real-time timestamp */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          {postData.postType != 'X-Data' && (
                            <View className="bg-blue-100 px-1 py-0.5 rounded-full mr-1.5">
                              <Text className="text-blue-600 text-xs font-regular">• {postData.contentType}</Text>
                            </View>
                          )}
                          {postData.postType === 'X-Data' && (
                            <View className="bg-blue-100 px-0.5 py-0.5 rounded-full mr-1.5">
                              <Text className="text-blue-600 text-xs font-semibold">𝕏 POST</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 14, color: '#8e8e93', marginLeft: 8 }}>
                            {getTimeAgo(postData.ContentDate)}
                          </Text>
                        </View>
                        {/* <Text style={{ fontSize: 14, color: '#8e8e93' }}>
                          {postTimeAgo || 'now'}
                        </Text> */}
                      </View>
                    </View>
                    
                    <Text style={{ fontSize: 15, color: '#000', lineHeight: 20, marginBottom: 12 }}>
                      {renderStyledPostText(postData.ContentDesc)}
                    </Text>
                    
                    <InstagramMediaCarousel
                      mediaUrls={postData?.ContentURLs || (postData?.ContentURL ? [postData.ContentURL] : [])}
                      onPressMedia={(url, type) => {
                        if (type === "image") openFullScreenImage(url);
                        else openFullScreenVideo(url);
                      }}
                    />

                  </View>
                )}

                {/* AI Sentiment Summary */}
                {aiSummary && (
                  <View style={{ 
                    paddingHorizontal: 16, 
                    marginTop: 20,
                    backgroundColor: '#f8f9fa',
                    marginHorizontal: 16,
                    padding: 16,
                    borderRadius: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#007AFF'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="analytics" size={20} color="#007AFF" />
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000', marginLeft: 8 }}>
                        AI Sentiment Analysis
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#333', lineHeight: 20 }}>
                      {aiSummary}
                    </Text>
                  </View>
                )}

                {/* Pie Chart Section */}
                {pieChartData.length > 0 ? (
                  <View style={{ marginTop: 30, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>📊</Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                        Sentiment Distribution
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#8e8e93', marginBottom: 20 }}>
                      Total Sentiments: {totalResponses}
                    </Text>
                    
                    <PieChart
                      data={pieChartData}
                      donut
                      radius={130}
                      innerRadius={70}
                      showText
                      textColor="white"
                      textSize={14}
                      fontWeight="bold"
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#000' }}>
                            {totalResponses}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#8e8e93', marginTop: 4 }}>
                            Votes
                          </Text>
                        </View>
                      )}
                      focusOnPress
                      sectionAutoFocus
                      strokeColor="white"
                      strokeWidth={2}
                    />
                  </View>
                ) : (
                  <View style={{ 
                    paddingHorizontal: 16, 
                    marginTop: 30,
                    alignItems: 'center',
                    paddingVertical: 40
                  }}>
                    <Ionicons name="pie-chart-outline" size={64} color="#e5e5e5" />
                    <Text style={{ fontSize: 16, color: '#8e8e93', marginTop: 16, textAlign: 'center' }}>
                      No responses yet.{'\n'}Be the first to share your sentiment!
                    </Text>
                  </View>
                )}

                {/* Sentiment Breakdown */}
                {RESPONSE_OPTIONS.length > 0 && (
                  <View style={{ paddingHorizontal: 16, marginTop: 40 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>👍</Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                        Sentiment Breakdown
                      </Text>
                    </View>

                    {/* Sentiment Bars */}
                    <View style={{ marginBottom: 30 }}>
                      {RESPONSE_OPTIONS.map((option, index) => {
                        const percentage = sentimentData[option.id] || 0;
                        return (
                          <View key={option.id} style={{ marginBottom: 16 }}>
                            {/* Icon and Label */}
                            <View style={{ 
                              flexDirection: 'row', 
                              alignItems: 'flex-start', 
                              marginBottom: 6
                            }}>
                              {option.icon && (
                                <Image
                                  source={{ uri: option.icon}}
                                  style={{ 
                                    width: 24, 
                                    height: 24, 
                                    marginRight: 8,
                                    flexShrink: 0
                                  }}
                                  resizeMode="contain"
                                  resizeMethod="resize"
                                />
                              )}
                              <Text 
                                style={{ 
                                  fontSize: 15, 
                                  color: '#000', 
                                  fontWeight: '500',
                                  flex: 1,
                                  lineHeight: 22,
                                  marginRight: 8
                                }}
                              >
                                {option.label}
                              </Text>
                            </View>
                            
                            {/* Progress bar with percentage at the right end */}
                            <View style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center'
                            }}>
                              {/* Progress bar container */}
                              <View style={{ 
                                flex: 1,
                                height: 8, 
                                backgroundColor: '#f0f0f0', 
                                borderRadius: 4,
                                overflow: 'hidden',
                                marginRight: 8
                              }}>
                                <View style={{ 
                                  height: '100%', 
                                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length], 
                                  width: `${percentage}%`,
                                  borderRadius: 4
                                }} />
                              </View>
                              
                              {/* Percentage text at the right */}
                              <Text style={{ 
                                fontSize: 15, 
                                color: '#000', 
                                fontWeight: 'bold',
                                textAlign: 'right'
                              }}>
                                {percentage}%
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}


              </ScrollView>

              {/* Fixed Add/Edit Response Button at Bottom */}
              <View style={{ 
                position: 'absolute', 
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20,
                paddingTop: 12,
                paddingHorizontal: 16,
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#e5e5e5',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 10,
              }}>
                <TouchableOpacity
                  onPress={handleAddResponse}
                  style={{
                    backgroundColor: userExistingComment ? '#000000' : '#FF3B30',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  <Ionicons 
                    name={userExistingComment ? "pencil" : "add"} 
                    size={20} 
                    color="#fff" 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={{
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: '600'
                  }}>
                    {userExistingComment ? 'Edit Response' : 'Add Response'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* IMAGE FULL SCREEN MODAL */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenImage}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              top: Platform.OS === 'ios' ? 50 : 20, 
              right: 24, 
              zIndex: 10, 
              padding: 12, 
              borderRadius: 25, 
              backgroundColor: 'rgba(0,0,0,0.6)' 
            }}
            onPress={closeFullScreenImage}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={1}
            onPress={closeFullScreenImage}
          >
            {fullScreenImage && (
              <Image
                source={{ uri: fullScreenImage }}
                style={{ 
                  width: '100%', 
                  maxWidth: '100%',
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

      {/* VIDEO FULL SCREEN MODAL */}
      <Modal
        visible={isVideoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenVideo}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              top: Platform.OS === 'ios' ? 50 : 20, 
              right: 24, 
              zIndex: 10, 
              padding: 12, 
              borderRadius: 25, 
              backgroundColor: 'rgba(0,0,0,0.6)' 
            }}
            onPress={closeFullScreenVideo}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    </>
  );
}
