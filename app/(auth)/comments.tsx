import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import React, { Key, useCallback, useReducer, useState } from 'react';
import { 
  FlatList, 
  Image, 
  StatusBar, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  ScrollView 
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
  replies: Reply[];
}

interface Reply {
  id: string;
  AuthorName: string;
  AuthorImageURL?: string;
  Comment: string;
  CommentDate: any;
  likes?: number;
  isLiked?: boolean;
}

export default function CommentScreen() {
  const insets = useSafeAreaInsets();
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const [userId, setUserId] = useState("1");
  const [userName, setUserName] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemID, setItemID] = useState("");
  const [postType, setPostType] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // Time calculation utility function
  const getTimeAgo = (timestamp: any): string => {
    if (!timestamp) return '2h'; // fallback
    
    const now = Date.now();
    const commentTime = timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
    const diff = now - commentTime;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getItem = async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserName = await AsyncStorage.getItem('userName');
      const item = await AsyncStorage.getItem('item');
      const type = await AsyncStorage.getItem('postType');
      
      if(fetchuserID !== null && fetchuserName !== null) {
        console.log("userID: ", fetchuserID);
        console.log("userName: ", fetchuserName);
        setUserId(fetchuserID);
        setUserName(fetchuserName);
      }
      
      if(item !== null && type !== null) {
        console.log("Item: ", item);
        console.log("type: ", type);
        setItemID(item);
        setPostType(type);
        handleFetchComment(item, type);
      }
    } catch (error) {
      console.log("Error retriving item", error);
    }
  }

  // ✅ UPDATED: Fetch and sort comments with latest on top
  const handleFetchComment = async (item: any, type: any) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, type, item, 'Comments'));
      const responseDBs: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        responseDBs.push({
          id: doc.id,
          AuthorName: data.AuthorName ?? "",
          AuthorImageURL: data.AuthorImageURL ?? "",
          Comment: data.Comment ?? "",
          CommentDate: data.CommentDate ?? new Date(),
          replies: [],
          likes: 0,
          isLiked: false
        });
      });

      // ✅ ADDED: Sort comments by date (latest first)
      const sortedComments = responseDBs.sort((a, b) => {
        const getTimestamp = (commentDate: any) => {
          if (commentDate && typeof commentDate === 'object' && commentDate.toDate) {
            return commentDate.toDate().getTime();
          } else if (commentDate) {
            return new Date(commentDate).getTime();
          }
          return 0;
        };
        
        return getTimestamp(b.CommentDate) - getTimestamp(a.CommentDate); // Descending order (latest first)
      });

      console.log('Comments Fetched and Sorted', `Fetched ${sortedComments.length} documents`);
      handleFetchReply(item, type, sortedComments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Fetch and sort replies with latest on top
  const handleFetchReply = async (postItem: any, type: any, commentList: Comment[]) => {
    setLoading(true);
    try {
      const updatedComments = [...commentList];
      
      for (const item of updatedComments) {
        const querySnapshot = await getDocs(collection(db, type, postItem, 'Comments', item.id, 'Replies'));
        const replies: Reply[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          replies.push({ 
            id: doc.id, 
            ...data,
            likes: 0,
            isLiked: false
          } as Reply);
        });

        // ✅ ADDED: Sort replies by date (latest first)
        const sortedReplies = replies.sort((a, b) => {
          const getTimestamp = (replyDate: any) => {
            if (replyDate && typeof replyDate === 'object' && replyDate.toDate) {
              return replyDate.toDate().getTime();
            } else if (replyDate) {
              return new Date(replyDate).getTime();
            }
            return 0;
          };
          
          return getTimestamp(b.CommentDate) - getTimestamp(a.CommentDate); // Descending order (latest first)
        });

        item.replies = sortedReplies;
        console.log('Replies Fetched and Sorted', `Item: ${item.id} Replies: ${item.replies.length}`);
      }

      setComments(updatedComments);
      console.log('All comments and replies fetched and sorted by latest first');
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (input.trim() !== '') {
      console.log('handlePostComment called');
      handlePostComment();
    }
  };

  const handlePostComment = async () => {
    setIsSubmitting(true);
    if (replyingTo) {
      console.log("Reply post");
      try {
        const repliesRef = collection(db, postType, itemID, 'Comments', replyingTo, 'Replies');
        const postDocRef = await addDoc(repliesRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: input
        });
        console.log('Replies Post ID: ', postDocRef.id);
        setInput('');
        // ✅ Refresh comments to show new reply at top
        handleFetchComment(itemID, postType);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
      setReplyingTo(null);
    } else {
      console.log("Comment post");
      try {
        const commentRef = collection(db, postType, itemID, 'Comments');
        const postDocRef = await addDoc(commentRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: input
        });
        console.log('Comment Post ID: ', postDocRef.id);
        setInput('');
        // ✅ Refresh comments to show new comment at top
        handleFetchComment(itemID, postType);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setInput(`@${username} `);
  };

  const handleLikeComment = (commentId: string, isReply: boolean = false, parentCommentId?: string) => {
    if (isReply && parentCommentId) {
      setComments(prev => prev.map(comment => 
        comment.id === parentCommentId 
          ? {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId 
                  ? { 
                      ...reply, 
                      isLiked: !reply.isLiked,
                      likes: reply.isLiked ? (reply.likes || 0) - 1 : (reply.likes || 0) + 1
                    }
                  : reply
              )
            }
          : comment
      ));
    } else {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? (comment.likes || 0) - 1 : (comment.likes || 0) + 1
            }
          : comment
      ));
    }
  };

  const handleEmojiPress = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  useFocusEffect(
    useCallback(() => {
      getItem();
    }, [])
  )

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
        backgroundColor: 'white'
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link href="/(tabs)" asChild>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        </Link>
        <Text className="text-lg font-semibold text-gray-900">Comments</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Comments List */}
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text className="text-gray-500 text-lg mt-4">Loading comments...</Text>
          </View>
        ) : comments.length === 0 ? (
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
                      source={{ uri: comment.AuthorImageURL || dummyAuthorImage }} 
                      className="w-full h-full" 
                      resizeMode="cover" 
                    />
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row items-start">
                      <Text className="font-semibold text-gray-900 mr-1 text-sm">
                        {comment.AuthorName}
                      </Text>
                      <Text className="text-gray-900 text-sm leading-4 flex-1">
                        {comment.Comment}
                      </Text>
                      <View className="flex-row items-center ml-2">
                        <TouchableOpacity 
                          onPress={() => handleLikeComment(comment.id, false)} 
                          className="p-1"
                        >
                          <Ionicons 
                            name={comment.isLiked ? "heart" : "heart-outline"} 
                            size={14} 
                            color={comment.isLiked ? "#EF4444" : "#9CA3AF"} 
                          />
                        </TouchableOpacity>
                        {(comment.likes || 0) > 0 && (
                          <Text className="text-gray-400 text-xs ml-1">{comment.likes}</Text>
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mt-2">
                      <Text className="text-gray-400 text-xs mr-4">
                        {getTimeAgo(comment.CommentDate)}
                      </Text>
                      <TouchableOpacity onPress={() => handleReplyToComment(comment.id, comment.AuthorName)}>
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
                            source={{ uri: reply.AuthorImageURL || dummyAuthorImage }} 
                            className="w-full h-full" 
                            resizeMode="cover" 
                          />
                        </View>
                        
                        <View className="flex-1">
                          <View className="flex-row items-start">
                            <Text className="font-semibold text-gray-900 mr-1 text-xs">
                              {reply.AuthorName}
                            </Text>
                            <Text className="text-gray-900 text-xs leading-4 flex-1">
                              {reply.Comment}
                            </Text>
                            <View className="flex-row items-center ml-2">
                              <TouchableOpacity 
                                onPress={() => handleLikeComment(reply.id, true, comment.id)} 
                                className="p-1"
                              >
                                <Ionicons 
                                  name={reply.isLiked ? "heart" : "heart-outline"} 
                                  size={12} 
                                  color={reply.isLiked ? "#EF4444" : "#9CA3AF"} 
                                />
                              </TouchableOpacity>
                              {(reply.likes || 0) > 0 && (
                                <Text className="text-gray-400 text-xs ml-1">{reply.likes}</Text>
                              )}
                            </View>
                          </View>
                          
                          <View className="flex-row items-center mt-1">
                            <Text className="text-gray-400 text-xs mr-3">
                              {getTimeAgo(reply.CommentDate)}
                            </Text>
                            <TouchableOpacity onPress={() => handleReplyToComment(comment.id, reply.AuthorName)}>
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
                Replying to {input.split(' ')[0]}
              </Text>
              <TouchableOpacity onPress={() => {
                setReplyingTo(null);
                setInput('');
              }}>
                <Ionicons name="close" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View className="flex-row items-center px-4 py-3">
          <View className="w-8 h-8 rounded-full mr-3 overflow-hidden bg-gray-300 items-center justify-center">
            <Image 
              source={{ uri: dummyAuthorImage }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
          </View>

          <View className="flex-1 flex-row items-center">
            <TextInput
              className="flex-1 text-sm text-gray-900 mr-3"
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline={false}
              style={{ fontSize: 14 }}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={isSubmitting || !input.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#0ea5e9" />
              ) : (
                <Text
                  className={`font-semibold text-sm ${
                    input.trim() ? "text-blue-500" : "text-gray-400"
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
    </View>
  );
}
