import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-gifted-charts';
import { useVideoPlayer, VideoView } from 'expo-video';

const screenWidth = Dimensions.get('window').width;

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
      const collCommentTempPost = collection(db, 'SentimentTemplates');
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
          console.log("Graph Template Passed: ", commentTemplate);

          if(commentTemplate == postId){
            const optionsField = postData.options;

            // Convert map to array:
            for (const key in optionsField) {
              if (Object.prototype.hasOwnProperty.call(optionsField, key)) {
                const maybeOption = (optionsField as any)[key];
                if (maybeOption && typeof maybeOption === "object") {
                  const icon = (maybeOption as any).icon;
                  const title = (maybeOption as any).title;
                  RESPONSE_OPTIONS.push({
                    id: typeof title === "string" ? title : "",
                    label: typeof title === "string" ? title : "",
                    icon: typeof icon === "string" ? icon : "",
                    color: '#34C759'
                  })
                }
              }
            }    
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

  // Render media content (image or video) - matching landing page implementation
  const renderMediaContent = () => {
    if (!postData?.ContentURL) return null;

    const mediaType = getMediaType(postData.ContentURL);

    if (mediaType === 'video') {
      return (
        <View style={{ marginBottom: 12 }}>
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
          </View>
        </View>
      );
    }

    // Image content
    return (
      <Image
        source={{ uri: postData.ContentURL }}
        style={{ 
          width: '100%', 
          height: 200, 
          borderRadius: 12, 
          backgroundColor: '#e8e8e8',
          marginBottom: 12
        }}
        resizeMode="cover"
      />
    );
  };

  return (
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
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                        {postData.AuthorName}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#8e8e93' }}>
                        21m
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={{ fontSize: 15, color: '#000', lineHeight: 20, marginBottom: 12 }}>
                    {postData.ContentDesc}
                  </Text>
                  
                  {renderMediaContent()}
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
                      Response Distribution
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#8e8e93', marginBottom: 20 }}>
                    Total Responses: {totalResponses}
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
                  
                  {renderLegend()}
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
                  <Text style={{ fontSize: 14, color: '#8e8e93', marginBottom: 20 }}>
                    Detailed Rating
                  </Text>

                  {/* Sentiment Bars */}
                  <View style={{ marginBottom: 30 }}>
                    {RESPONSE_OPTIONS.map((option, index) => {
                      const percentage = sentimentData[option.id] || 0;
                      return (
                        <View key={option.id} style={{ marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              {option.icon && (
                                <Image
                                  source={{ uri: option.icon}}
                                  style={{ width: 40, height: 25, marginRight: 8 }}
                                  resizeMode="contain"
                                />
                              )}
                              <Text style={{ fontSize: 16, color: '#000', fontWeight: '500' }}>
                                {option.label}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 16, color: '#000', fontWeight: 'bold' }}>
                              {percentage}%
                            </Text>
                          </View>
                          <View style={{ 
                            height: 10, 
                            backgroundColor: '#f0f0f0', 
                            borderRadius: 5,
                            overflow: 'hidden'
                          }}>
                            <View style={{ 
                              height: '100%', 
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length], 
                              width: `${percentage}%`,
                              borderRadius: 5
                            }} />
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
  );
}
