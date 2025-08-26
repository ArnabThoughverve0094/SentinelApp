import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  username: string;
  displayName?: string;
  profileImage?: string;
  text: string;
  timeAgo: string;
  timestamp: number; // Add timestamp for proper time calculation
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface Post {
  id: string;
  username: string;
  displayName?: string;
  profileImage?: string;
  text: string;
  timeAgo: string;
  hashtags?: string[];
  media?: {
    uri: string;
    type: 'image' | 'video';
    watermark?: string;
  };
}

interface CommentsModalProps {
  selectedPost: Post | null;
  onClose: () => void;
}

// Dummy profile images array
const dummyProfiles = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b332c48c?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop&crop=face',
];

// Time calculation utility function
const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

// Function to get random profile image
const getRandomProfile = (): string => {
  return dummyProfiles[Math.floor(Math.random() * dummyProfiles.length)];
};

// Function to generate random username
const generateRandomUsername = (): string => {
  const prefixes = ['user', 'dev', 'cool', 'awesome', 'super', 'pro', 'tech', 'creative'];
  const suffixes = ['_123', '_dev', '_pro', '2024', '_official', '_real', '_new'];
  const numbers = Math.floor(Math.random() * 999);
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${numbers}${suffix}`;
};

// Mock comments data with timestamps
const mockComments: { [key: string]: Comment[] } = {
  '1': [
    {
      id: 'c1',
      username: 'abdulrashid__18',
      profileImage: dummyProfiles[0],
      text: 'First comment 🔥',
      timeAgo: '3m',
      timestamp: Date.now() - (3 * 60 * 1000), // 3 minutes ago
      likes: 1,
      isLiked: false,
      replies: []
    },
    {
      id: 'c2',
      username: '_cumst4r_nitya',
      profileImage: dummyProfiles[1],
      text: '😍',
      timeAgo: '3m',
      timestamp: Date.now() - (3 * 60 * 1000), // 3 minutes ago
      likes: 1,
      isLiked: false,
      replies: []
    },
    {
      id: 'c3',
      username: '_cumst4r_nitya',
      profileImage: dummyProfiles[1],
      text: '😍❤️😍',
      timeAgo: '3m',
      timestamp: Date.now() - (3 * 60 * 1000), // 3 minutes ago
      likes: 1,
      isLiked: false,
      replies: []
    },
    {
      id: 'c4',
      username: 'official___nitu__gupta07',
      profileImage: dummyProfiles[2],
      text: '😘❤️😍😍❤️❤️❤️',
      timeAgo: '3m',
      timestamp: Date.now() - (3 * 60 * 1000), // 3 minutes ago
      likes: 1,
      isLiked: false,
      replies: []
    },
    {
      id: 'c5',
      username: '_mukesh_chaudhary_8',
      profileImage: dummyProfiles[3],
      text: 'Mi will make new legend',
      timeAgo: '3m',
      timestamp: Date.now() - (3 * 60 * 1000), // 3 minutes ago
      likes: 10,
      isLiked: false,
      replies: []
    }
  ],
  '2': [
    {
      id: 'c6',
      username: 'alice_wonder',
      profileImage: dummyProfiles[4],
      text: 'Awesome work Tarun! Keep it up 👏',
      timeAgo: '30m',
      timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
      likes: 5,
      isLiked: false,
      replies: []
    }
  ]
};

const CommentsModal = ({ selectedPost, onClose }: CommentsModalProps) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(
    selectedPost ? mockComments[selectedPost.id] || [] : []
  );

  // Update timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setComments(prevComments => 
        prevComments.map(comment => ({
          ...comment,
          timeAgo: getTimeAgo(comment.timestamp),
          replies: comment.replies?.map(reply => ({
            ...reply,
            timeAgo: getTimeAgo(reply.timestamp)
          }))
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    onClose();
    setCommentText('');
    setReplyingTo(null);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    setIsSubmitting(true);
    
    try {
      const currentTimestamp = Date.now();
      const newUsername = generateRandomUsername();
      const newProfileImage = getRandomProfile();

      if (replyingTo) {
        // Handle reply to comment
        const newReply: Comment = {
          id: `r${currentTimestamp}`,
          username: newUsername,
          profileImage: newProfileImage,
          text: commentText.trim(),
          timeAgo: 'now',
          timestamp: currentTimestamp,
          likes: 0,
          isLiked: false,
          replies: []
        };

        setComments(prev => prev.map(comment => 
          comment.id === replyingTo 
            ? { ...comment, replies: [...(comment.replies || []), newReply] }
            : comment
        ));
        setReplyingTo(null);
      } else {
        // Handle new comment
        const newComment: Comment = {
          id: `c${currentTimestamp}`,
          username: newUsername,
          profileImage: newProfileImage,
          text: commentText.trim(),
          timeAgo: 'now',
          timestamp: currentTimestamp,
          likes: 0,
          isLiked: false,
          replies: []
        };

        setComments(prev => [newComment, ...prev]);
      }
      
      setCommentText('');
      
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: string, isReply: boolean = false) => {
    if (isReply) {
      // Handle reply like
      setComments(prev => prev.map(comment => ({
        ...comment,
        replies: comment.replies?.map(reply => 
          reply.id === commentId 
            ? { 
                ...reply, 
                isLiked: !reply.isLiked,
                likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1
              }
            : reply
        )
      })));
    } else {
      // Handle main comment like
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
            }
          : comment
      ));
    }
  };

  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setCommentText(`@${username} `);
  };

  const handleEmojiPress = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  const renderPostProfileImage = (post: Post) => {
    if (post.profileImage) {
      return (
        <View className="w-12 h-12 rounded-full mr-3 overflow-hidden">
          <Image 
            source={{ uri: post.profileImage }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
        </View>
      );
    }
    
    return (
      <View className="w-12 h-12 bg-black rounded-full mr-3 items-center justify-center">
        <Ionicons name="close" size={20} color="white" />
      </View>
    );
  };

  const renderPostMedia = (media: Post['media']) => {
    if (!media) return null;
    
    return (
      <View className="relative mb-3">
        <Image
          source={{ uri: media.uri }}
          className={`w-full rounded-xl ${media.type === 'video' ? 'h-48' : 'h-40'}`}
          resizeMode="cover"
        />
        {media.type === 'video' && (
          <>
            <View className="absolute inset-0 bg-black/20 rounded-xl items-center justify-center">
              <View className="w-12 h-12 bg-white/80 rounded-full items-center justify-center">
                <Ionicons name="play" size={20} color="#000" style={{ marginLeft: 2 }} />
              </View>
            </View>
            {media.watermark && (
              <View className="absolute bottom-2 left-2">
                <Text className="text-white text-xs">{media.watermark}</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderPostText = (post: Post) => {
    if (post.hashtags?.length) {
      return (
        <Text className="text-gray-900 mb-3 leading-5">
          {post.text} <Text className="text-purple-500">{post.hashtags.join(' ')}</Text>
        </Text>
      );
    }
    return <Text className="text-gray-900 mb-3 leading-5">{post.text}</Text>;
  };

  if (!selectedPost) return null;

  return (
    <Modal 
      visible={!!selectedPost} 
      animationType="slide" 
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Modal Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Comments</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Original Post */}
          <View className="border-b border-gray-100 bg-white px-4 py-4">
            <View className="flex-row">
              {renderPostProfileImage(selectedPost)}
              
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Text className="font-semibold text-gray-900 mr-1">
                    {selectedPost.displayName || selectedPost.username}
                  </Text>
                  {selectedPost.displayName && (
                    <Text className="text-gray-500 text-sm">{selectedPost.username}</Text>
                  )}
                  <Text className="text-gray-400 text-sm ml-auto">{selectedPost.timeAgo}</Text>
                </View>

                {renderPostText(selectedPost)}
                {renderPostMedia(selectedPost.media)}
              </View>
            </View>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No comments yet</Text>
              <Text className="text-gray-400 text-sm">Be the first to comment!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id}>
                {/* Main Comment */}
                <View className="bg-white px-4 py-3">
                  <View className="flex-row">
                    <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
                      <Image 
                        source={{ uri: comment.profileImage }} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-start">
                        <Text className="font-semibold text-gray-900 mr-1 text-sm">
                          {comment.username}
                        </Text>
                        <Text className="text-gray-900 text-sm leading-4 flex-1">
                          {comment.text}
                        </Text>
                        <View className="flex-row items-center ml-2">
                          <TouchableOpacity onPress={() => handleLikeComment(comment.id, false)} className="p-1">
                            <Ionicons 
                              name={comment.isLiked ? "heart" : "heart-outline"} 
                              size={14} 
                              color={comment.isLiked ? "#EF4444" : "#9CA3AF"} 
                            />
                          </TouchableOpacity>
                          {comment.likes > 0 && (
                            <Text className="text-gray-400 text-xs ml-1">{comment.likes}</Text>
                          )}
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mt-2">
                        <Text className="text-gray-400 text-xs mr-4">
                          {getTimeAgo(comment.timestamp)}
                        </Text>
                        <TouchableOpacity onPress={() => handleReplyToComment(comment.id, comment.username)}>
                          <Text className="text-gray-400 text-xs font-medium">
                            Reply
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <View className="ml-8">
                    {comment.replies.map((reply) => (
                      <View key={reply.id} className="bg-white px-4 py-2">
                        <View className="flex-row">
                          <View className="w-6 h-6 rounded-full mr-3 overflow-hidden">
                            <Image 
                              source={{ uri: reply.profileImage }} 
                              className="w-full h-full" 
                              resizeMode="cover" 
                            />
                          </View>
                          
                          <View className="flex-1">
                            <View className="flex-row items-start">
                              <Text className="font-semibold text-gray-900 mr-1 text-xs">
                                {reply.username}
                              </Text>
                              <Text className="text-gray-900 text-xs leading-4 flex-1">
                                {reply.text}
                              </Text>
                              <View className="flex-row items-center ml-2">
                                <TouchableOpacity onPress={() => handleLikeComment(reply.id, true)} className="p-1">
                                  <Ionicons 
                                    name={reply.isLiked ? "heart" : "heart-outline"} 
                                    size={12} 
                                    color={reply.isLiked ? "#EF4444" : "#9CA3AF"} 
                                  />
                                </TouchableOpacity>
                                {reply.likes > 0 && (
                                  <Text className="text-gray-400 text-xs ml-1">{reply.likes}</Text>
                                )}
                              </View>
                            </View>
                            
                            <View className="flex-row items-center mt-1">
                              <Text className="text-gray-400 text-xs mr-3">
                                {getTimeAgo(reply.timestamp)}
                              </Text>
                              <TouchableOpacity onPress={() => handleReplyToComment(comment.id, reply.username)}>
                                <Text className="text-gray-400 text-xs font-medium">
                                  Reply
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Comment Input */}
        <View className="border-t border-gray-100 bg-white">
          {replyingTo && (
            <View className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">
                  Replying to {commentText.split(' ')[0]}
                </Text>
                <TouchableOpacity onPress={() => {
                  setReplyingTo(null);
                  setCommentText('');
                }}>
                  <Ionicons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View className="flex-row items-center px-4 py-3">
            <View className="w-8 h-8 rounded-full mr-3 overflow-hidden bg-gray-300 items-center justify-center">
              <Image 
                source={{ uri: getRandomProfile() }} 
                className="w-full h-full" 
                resizeMode="cover" 
              />
            </View>

            <View className="flex-1 flex-row items-center">
              <TextInput
                className="flex-1 text-sm text-gray-900 mr-3"
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline={false}
                style={{ fontSize: 14 }}
              />

              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <Text
                    className={`font-semibold text-sm ${
                      commentText.trim() ? "text-blue-500" : "text-gray-400"
                    }`}
                  >
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Emoji row */}
          <View className="flex-row items-center justify-center px-4 pb-3">
            {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((emoji, index) => (
              <TouchableOpacity 
                key={index} 
                className="mr-4"
                onPress={() => handleEmojiPress(emoji)}
              >
                <Text className="text-2xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default CommentsModal;
