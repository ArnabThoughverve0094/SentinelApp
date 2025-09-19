import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
}

// Response options matching the design
const RESPONSE_OPTIONS = [
  { id: 'agree', label: 'Agree', icon: '👍', color: '#34C759' },
  { id: 'disagree', label: 'Disagree', icon: '🚫', color: '#FF3B30' },
  { id: 'support', label: 'I Support This', icon: '⭐', color: '#FF9500' },
  { id: 'hate', label: 'Hate Speech', icon: '😡', color: '#FF3B30' }
];

export default function TotalSentiment({ 
  visible, 
  onClose, 
  postId, 
  postType, 
  postData,
  onAddResponse,
  userExistingComment,
  onEditComment
}: TotalSentimentProps) {
  const insets = useSafeAreaInsets();
  const [sentimentData, setSentimentData] = useState({
    agree: 0,
    disagree: 0,
    support: 0,
    hate: 0
  });
  const [loading, setLoading] = useState(false);

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
        }))

        const counts = { agree: 0, disagree: 0, support: 0, hate: 0 };
        let total = 0;
        
        for (const doc of commentDataArr) {
          const postData = doc.data;
          if (postData.selectedOptions && postData.selectedOptions.length > 0) {
            const option = postData.selectedOptions[0] as keyof typeof counts;
            if (counts.hasOwnProperty(option)) {
              counts[option]++;
              total++;
            }
          }
        }
        if (total > 0) {
          const percentages = {
            agree: Math.round((counts.agree / total) * 100),
            disagree: Math.round((counts.disagree / total) * 100),
            support: Math.round((counts.support / total) * 100),
            hate: Math.round((counts.hate / total) * 100)
          };
          setSentimentData(percentages);
        }
      })

      return () => {
        unsubscribeCommentData();
      };

    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
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
    if (visible && postId && postType) {
      fetchSentimentData();
    }
  }, [visible, postId, postType]);

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
            borderBottomColor: '#e5e5e5'
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
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
                
                {postData.ContentURL && (
                  <Image
                    source={{ uri: postData.ContentURL }}
                    style={{ 
                      width: '100%', 
                      height: 200, 
                      borderRadius: 12, 
                      backgroundColor: '#e8e8e8' 
                    }}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}

            {/* Sentiment Analysis */}
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>👍</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                  Agreeable post
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#8e8e93', marginBottom: 20 }}>
                Sentiment Rating
              </Text>

              {/* Sentiment Bars */}
              <View style={{ marginBottom: 30 }}>
                {RESPONSE_OPTIONS.map((option) => {
                  const percentage = sentimentData[option.id as keyof typeof sentimentData] || 0;
                  return (
                    <View key={option.id} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, marginRight: 8 }}>{option.icon}</Text>
                          <Text style={{ fontSize: 16, color: '#000', fontWeight: '500' }}>
                            {option.label}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16, color: '#000', fontWeight: 'bold' }}>
                          {percentage}%
                        </Text>
                      </View>
                      <View style={{ 
                        height: 8, 
                        backgroundColor: '#f0f0f0', 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <View style={{ 
                          height: '100%', 
                          backgroundColor: '#000', 
                          width: `${percentage}%`,
                          borderRadius: 4
                        }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Add Response Button */}
        <View style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 20, 
          left: 16, 
          right: 16 
        }}>
          <TouchableOpacity
            onPress={handleAddResponse}
            style={{
              backgroundColor: userExistingComment ? '#000000' : '#FF3B30',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
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
    </Modal>
  );
}
