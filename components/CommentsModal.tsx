import { db } from '@/FirebaseConfig';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TotalSentiment from './TotalSentiment'; // Import the new page

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

interface CommentScreenProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postType: string | null;
  postData: PostData | undefined;
}

// Response options matching the image design
const RESPONSE_OPTIONS = [
  { id: 'agree', label: 'Agree', icon: '👍', color: '#34C759' },
  { id: 'disagree', label: 'Disagree', icon: '🚫', color: '#FF3B30' },
  { id: 'support', label: 'I Support This', icon: '⭐', color: '#FF9500' },
  { id: 'hate', label: 'Hate Speech', icon: '😡', color: '#FF3B30' }
];

export default function CommentScreen({ 
  visible, 
  onClose, 
  postId, 
  postType, 
  postData
}: CommentScreenProps) {
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSentimentPage, setShowSentimentPage] = useState(false);

  const getItem = async () => {
    try {
      const fetchuserName = await AsyncStorage.getItem('userName');
      if(fetchuserName !== null) {
        setUserName(fetchuserName);
      }
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  }

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(selectedOption === optionId ? null : optionId);
  };

  // Handle structured comment submission
  const handleSubmitResponse = async () => {
    if (!selectedOption || !postId || !postType) return;

    setIsSubmitting(true);
    
    try {
      const selectedOptionData = RESPONSE_OPTIONS.find(opt => opt.id === selectedOption);
      const commentText = selectedOptionData?.label || '';
      
      const commentRef = collection(db, postType, postId, 'Comments');
      const postDocRef = await addDoc(commentRef, {
        AuthorImageURL: "",
        AuthorName: userName,
        CommentDate: new Date(),
        Comment: commentText,
        selectedOptions: [selectedOption],
        commentType: 'structured'
      });
      
      console.log('Response submitted with ID: ', postDocRef.id);
      
      // Reset and close
      setSelectedOption(null);
      onClose();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGraphPress = () => {
    setShowSentimentPage(true);
  };

  const handleSentimentClose = () => {
    setShowSentimentPage(false);
  };

  const handleAddResponseFromSentiment = () => {
    setShowSentimentPage(false);
    // Response selection modal stays open
  };

  useEffect(() => {
    if (visible && postId && postType) {
      getItem();
    }
    
    if (!visible) {
      setSelectedOption(null);
      setIsSubmitting(false);
      setShowSentimentPage(false);
    }
  }, [visible, postId, postType, postData]);

  return (
    <>
      {/* Response Selection Modal */}
      <Modal
        visible={visible && !showSentimentPage}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#000',
                textAlign: 'center'
              }}>
                Select Your Response
              </Text>
              
              {/* Graph Icon */}
              <TouchableOpacity 
                style={{ padding: 4, marginLeft: 60 }}
                onPress={handleGraphPress}
                activeOpacity={0.7}
              >
                <Feather name="bar-chart-2" size={21} color="#000" />
              </TouchableOpacity>
              
              {/* Close Icon */}
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Response Options Grid */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginBottom: 24
            }}>
              {RESPONSE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleOptionSelect(option.id)}
                  style={{
                    width: '48%',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 16,
                    paddingVertical: 24,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    borderWidth: selectedOption === option.id ? 3 : 0,
                    borderColor: selectedOption === option.id ? '#000000' : 'transparent',
                    shadowColor: selectedOption === option.id ? '#000000' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedOption === option.id ? 0.1 : 0,
                    shadowRadius: 4,
                    elevation: selectedOption === option.id ? 4 : 0,
                  }}
                >
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>
                    {option.icon}
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000',
                    textAlign: 'center'
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitResponse}
              disabled={isSubmitting || !selectedOption}
              style={{
                backgroundColor: selectedOption ? '#FF3B30' : '#E5E5E5',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: (isSubmitting || !selectedOption) ? 0.6 : 1
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{
                  color: selectedOption ? '#fff' : '#999',
                  fontSize: 18,
                  fontWeight: '600'
                }}>
                  {selectedOption 
                    ? `Submit "${RESPONSE_OPTIONS.find(opt => opt.id === selectedOption)?.label}"` 
                    : 'Select Your Response'
                  }
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Total Sentiment Page */}
      <TotalSentiment
        visible={showSentimentPage}
        onClose={handleSentimentClose}
        postId={postId}
        postType={postType}
        postData={postData}
        onAddResponse={handleAddResponseFromSentiment}
      />
    </>
  );
}
