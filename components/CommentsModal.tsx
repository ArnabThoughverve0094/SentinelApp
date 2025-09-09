import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Comment {
  id: string;
  AuthorName: string;
  AuthorImageURL?: string;
  Comment: string;
  CommentDate: any;
  likes?: number;
  isLiked?: boolean;
  replies: Reply[];
  selectedOptions?: string[];
  commentType: 'structured' | 'text';
}

interface Reply {
  id: string;
  AuthorName: string;
  AuthorImageURL?: string;
  Comment: string;
  CommentDate: any;
  likes?: number;
  isLiked?: boolean;
  selectedOptions?: string[];
  commentType: 'structured' | 'text';
  replyToUser?: string; // New field to track who this reply is addressing
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

interface CommentScreenProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postType: string | null;
  postData: PostData | undefined;
}

// Enhanced response options with unique icons and colors
const RESPONSE_OPTIONS = [
  { text: 'I agree completely', color: '#34C759', icon: 'thumbs-up', bgColor: '#E8F5E8' },
  { text: 'I disagree completely', color: '#FF3B30', icon: 'thumbs-down', bgColor: '#FFEAEA' },
  { text: 'I consider this to be hate speech and it has no place in society', color: '#FF9500', icon: 'warning', bgColor: '#FFF4E6' },
  { text: 'I consider myself to be an antisemite and I support this conduct/speech', color: '#8E4EC6', icon: 'person-circle', bgColor: '#F3ECFF' },
  { text: 'I consider myself to be an anti-zionist and I support this conduct/speech', color: '#8E4EC6', icon: 'flag', bgColor: '#F3ECFF' },
  { text: 'I consider myself to be anti-Israel and I support this conduct/speech', color: '#8E4EC6', icon: 'location', bgColor: '#F3ECFF' },
  { text: 'I consider myself to be anti-Israel government (current) and I support this conduct/speech', color: '#8E4EC6', icon: 'business', bgColor: '#F3ECFF' },
  { text: 'I consider myself to be anti-Jewish and I support this conduct/speech', color: '#8E4EC6', icon: 'people', bgColor: '#F3ECFF' },
  { text: 'None of the above', color: '#8E8E93', icon: 'close-circle', bgColor: '#F5F5F5' }
];

export default function CommentScreen({ 
  visible, 
  onClose, 
  postId, 
  postType, 
  postData
}: CommentScreenProps) {
  const insets = useSafeAreaInsets();
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const [userId, setUserId] = useState("1");
  const [userName, setUserName] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [postDataState, setPostDataState] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null); // New state for user being replied to
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [dropdownAnimation] = useState(new Animated.Value(0));
  
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // Animate dropdown
  const animateDropdown = (show: boolean) => {
    Animated.timing(dropdownAnimation, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Time calculation utility function
  const getTimeAgo = (timestamp: any): string => {
    if (!timestamp) return '2h';
    
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

  // Media type detection
  const getMediaType = (url: string) => {
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
    
    return urlPath.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/) ? 'doc' : 'image';
  };

  // Fetch post data (only used as fallback if postData is not provided)
  const fetchPostData = async (itemId: string, itemType: string) => {
    setPostLoading(true);
    try {
      const postDoc = await getDoc(doc(db, itemType, itemId));
      if (postDoc.exists()) {
        const data = postDoc.data();
        setPostDataState({
          id: itemId,
          AuthorImageURL: data.AuthorImageURL || '',
          AuthorName: data.AuthorName || '',
          AuthorUsername: data.AuthorUsername || '@' + (data.AuthorName || '').toLowerCase().replace(/\s+/g, ''),
          ContentDate: data.ContentDate || '',
          ContentDesc: data.ContentDesc || '',
          ContentURL: data.ContentURL || '',
          ContentURLs: data.ContentURLs || (data.ContentURL ? [data.ContentURL] : []),
          ContentLikeCount: data.ContentLikeCount || 0,
          ContentRepostCount: data.ContentRepostCount || 0,
          ContentCommentCount: data.ContentCommentCount || 0,
          postType: itemType,
          Liked: false,
          Reposted: false,
        });
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
    } finally {
      setPostLoading(false);
    }
  };

  // Convert passed postData to local state format
  const convertPostData = (passedPostData: PostData) => {
    setPostDataState({
      id: passedPostData.id,
      AuthorImageURL: passedPostData.AuthorImageURL || '',
      AuthorName: passedPostData.AuthorName || '',
      AuthorUsername: passedPostData.AuthorUsername || '@' + (passedPostData.AuthorName || '').toLowerCase().replace(/\s+/g, ''),
      ContentDate: passedPostData.ContentDate || '',
      ContentDesc: passedPostData.ContentDesc || '',
      ContentURL: passedPostData.ContentURL || '',
      ContentURLs: passedPostData.ContentURLs || (passedPostData.ContentURL ? [passedPostData.ContentURL] : []),
      ContentLikeCount: passedPostData.ContentLikeCount || 0,
      ContentRepostCount: passedPostData.ContentRepostCount || 0,
      ContentCommentCount: passedPostData.ContentCommentCount || 0,
      postType: postType || '',
      Liked: passedPostData.Liked || false,
      Reposted: passedPostData.Reposted || false,
    });
  };

  const getItem = async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserName = await AsyncStorage.getItem('userName');
      
      if(fetchuserID !== null && fetchuserName !== null) {
        console.log("userID: ", fetchuserID);
        console.log("userName: ", fetchuserName);
        setUserId(fetchuserID);
        setUserName(fetchuserName);
      }
      
      if(postId && postType) {
        console.log("Item: ", postId);
        console.log("type: ", postType);
        
        if (postData) {
          convertPostData(postData);
        } else {
          await fetchPostData(postId, postType);
        }
        
        fetchCommentFirestore(postId, postType);
      }
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  }

  const fetchCommentFirestore = async (item: any, type: any) => {
    setLoading(true);
    try {
      const collCommentRefPost = collection(db, type, item, 'Comments');
      const queryComment = query(
        collCommentRefPost,
        orderBy('CommentDate', 'desc')
      );
      console.log("Comment OnSnapshot");
      
      const unsubscribeComment = onSnapshot(queryComment, commentSnapshot => {
        const commentdataArr = commentSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        const commentData: Comment[] = [];
        for (const doc of commentdataArr) {
          const postData = doc.data;
          const postId = doc.id;

          commentData.push({
            id: postId,
            AuthorName: postData.AuthorName ?? "",
            AuthorImageURL: postData.AuthorImageURL ?? "",
            Comment: postData.Comment ?? "",
            CommentDate: postData.CommentDate ?? new Date(),
            replies: [],
            likes: 0,
            isLiked: false,
            selectedOptions: postData.selectedOptions || [],
            commentType: postData.commentType || 'text'
          });
        }

        setComments(commentData);

        // Set up listeners for replies per comment
        commentData.forEach((comment) => {
          const collReplyRefPost = collection(db, type, item, 'Comments', comment.id, 'Replies');
          const queryReply = query(
            collReplyRefPost,
            orderBy('CommentDate', 'desc')
          );
          console.log("Replies OnSnapshot");
          
          onSnapshot(queryReply, replySnapshot => {
            const replydataArr = replySnapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data(),
            }));
    
            const replyData: Reply[] = [];
            for (const doc of replydataArr) {
              const postData = doc.data;
              const postId = doc.id;

              replyData.push({
                id: postId,
                AuthorName: postData.AuthorName ?? "",
                AuthorImageURL: postData.AuthorImageURL ?? "",
                Comment: postData.Comment ?? "",
                CommentDate: postData.CommentDate ?? new Date(),
                likes: 0,
                isLiked: false,
                selectedOptions: postData.selectedOptions || [],
                commentType: postData.commentType || 'text',
                replyToUser: postData.replyToUser || null // Get the user being replied to
              });
            }

            setComments(prevComments =>
              prevComments.map(c =>
                c.id === comment.id
                  ? {
                      ...c,
                      replies: replyData,
                    }
                  : c
              )
            );
          })
        })
      })

      return () => {
        unsubscribeComment();
      };

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Handle option selection with animation
  const handleOptionSelect = (optionText: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionText)) {
        return prev.filter(opt => opt !== optionText);
      } else {
        return [...prev, optionText];
      }
    });
  };

  // Handle structured comment submission
  const handleSubmitStructuredComment = async () => {
    if (selectedOptions.length === 0) return;

    setIsSubmitting(true);
    
    try {
      const commentText = selectedOptions.join('; ');
      
      if (replyingTo) {
        const repliesRef = collection(db, postType!, postId!, 'Comments', replyingTo, 'Replies');
        const postDocRef = await addDoc(repliesRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: commentText,
          selectedOptions: selectedOptions,
          commentType: 'structured',
          replyToUser: replyingToUser // Store who this reply is addressing
        });
        console.log('Structured Reply Post ID: ', postDocRef.id);
      } else {
        const commentRef = collection(db, postType!, postId!, 'Comments');
        const postDocRef = await addDoc(commentRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: commentText,
          selectedOptions: selectedOptions,
          commentType: 'structured'
        });
        console.log('Structured Comment Post ID: ', postDocRef.id);
      }
      
      setSelectedOptions([]);
      setShowDropdown(false);
      animateDropdown(false);
      setReplyingTo(null);
      setReplyingToUser(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated reply handler to store both comment ID and username
  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setReplyingToUser(username);
    setShowDropdown(true);
    animateDropdown(true);
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

  // Render media content for the post
  const renderMediaContent = (post: PostData) => {
    const mediaUrls = post.ContentURLs && post.ContentURLs.length > 0 ? post.ContentURLs : 
                     (post.ContentURL ? [post.ContentURL] : []);
    
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const primaryMediaUrl = mediaUrls[0];
    const mediaType = getMediaType(primaryMediaUrl);

    if (mediaType === 'image') {
      return (
        <View style={{ 
          marginTop: 12, 
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Image
            source={{ uri: primaryMediaUrl }}
            style={{ 
              width: '100%', 
              height: 240, 
              borderRadius: 16, 
              backgroundColor: '#e8e8e8' 
            }}
            resizeMode="cover"
          />
        </View>
      );
    } else if (mediaType === 'video') {
      return (
        <View style={{ 
          marginTop: 12, 
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Video
            source={{ uri: primaryMediaUrl }}
            style={{ 
              width: '100%', 
              height: 240, 
              borderRadius: 16, 
              backgroundColor: '#000' 
            }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls={false}
            shouldPlay={false}
            isMuted={true}
            isLooping={false}
          />
        </View>
      );
    } else if (mediaType === 'gif') {
      return (
        <View style={{ 
          marginTop: 12, 
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Image
            source={{ uri: primaryMediaUrl }}
            style={{ 
              width: '100%', 
              height: 240, 
              borderRadius: 16, 
              backgroundColor: '#e8e8e8' 
            }}
            resizeMode="cover"
          />
        </View>
      );
    }
    
    return null;
  };

  // Enhanced structured comment rendering with beautiful badges
  const renderStructuredComment = (comment: Comment | Reply, isReply: boolean = false) => {
    if (comment.commentType === 'structured' && comment.selectedOptions && comment.selectedOptions.length > 0) {
      return (
        <View style={{ marginTop: 8, marginBottom: 4 }}>
          {/* Instagram-style reply indicator for structured comments */}
          {isReply && 'replyToUser' in comment && comment.replyToUser && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              {/* <Text style={{ fontSize: 12, color: '#8e8e93', marginRight: 4 }}>Replying to</Text> */}
              <Text style={{ fontSize: 12, color: '#007aff', fontWeight: '600' }}>
                @{comment.replyToUser}
              </Text>
            </View>
          )}
          
          {comment.selectedOptions.map((option, index) => {
            const optionData = RESPONSE_OPTIONS.find(opt => opt.text === option);
            return (
              <View 
                key={index}
                style={{
                  backgroundColor: optionData?.bgColor || '#f0f8ff',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginBottom: 6,
                  marginRight: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  shadowColor: optionData?.color || '#007aff',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: optionData?.color || '#007aff'
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: optionData?.color || '#007aff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8
                }}>
                  <Ionicons 
                    name={optionData?.icon as any || 'checkmark'} 
                    size={12} 
                    color="white"
                  />
                </View>
                <Text style={{ 
                  fontSize: 12, 
                  color: optionData?.color || '#007aff', 
                  fontWeight: '600',
                  lineHeight: 16
                }}>
                  {option}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }
    
    return (
      <View>
        {isReply && 'replyToUser' in comment && comment.replyToUser && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            {/* <Text style={{ fontSize: 12, color: '#8e8e93', marginRight: 4 }}>Replying to</Text> */}
            <Text style={{ fontSize: 12, color: '#007aff', fontWeight: '600' }}>
              @{comment.replyToUser}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 14, color: '#000', lineHeight: 20, marginBottom: 8 }}>
          {comment.Comment}
        </Text>
      </View>
    );
  };

  const toggleDropdown = () => {
    const newState = !showDropdown;
    setShowDropdown(newState);
    animateDropdown(newState);
  };

  useEffect(() => {
    if (visible && postId && postType) {
      getItem();
    }
    
    if (!visible) {
      setComments([]);
      setPostDataState(null);
      setSelectedOptions([]);
      setShowDropdown(false);
      setReplyingTo(null);
      setReplyingToUser(null);
      dropdownAnimation.setValue(0);
    }
  }, [visible, postId, postType, postData]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Enhanced Header */}
        <View 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'ios' ? insets.top + 16 : insets.top + 24,
            paddingBottom: 20,
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}
        >
          <TouchableOpacity 
            onPress={onClose} 
            style={{ 
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#f8f8f8'
            }}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>
              Comments
            </Text>
            <Text style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Enhanced POST CONTENT SECTION */}
          {postLoading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <ActivityIndicator size="large" color="#007aff" />
              <Text style={{ color: '#8e8e93', fontSize: 16, marginTop: 16 }}>Loading post...</Text>
            </View>
          ) : postDataState ? (
            <View style={{ 
              backgroundColor: '#fff', 
              paddingHorizontal: 20, 
              paddingVertical: 24,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1
            }}>
              {/* Enhanced Post Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}>
                  <Image
                    source={{ uri: postDataState.AuthorImageURL || dummyAuthorImage }}
                    style={{ 
                      width: 52, 
                      height: 52, 
                      borderRadius: 26, 
                      marginRight: 14,
                      backgroundColor: '#e8e8e8',
                      borderWidth: 2,
                      borderColor: '#fff'
                    }}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#000' }}>
                    {postDataState.AuthorName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 15, color: '#007aff' }}>
                      {postDataState.AuthorUsername}
                    </Text>
                    <View style={{ 
                      width: 4, 
                      height: 4, 
                      borderRadius: 2, 
                      backgroundColor: '#c7c7cc', 
                      marginHorizontal: 8 
                    }} />
                    <Text style={{ fontSize: 15, color: '#8e8e93' }}>
                      {getTimeAgo(postDataState.ContentDate)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Enhanced Post Content */}
              <Text style={{ 
                fontSize: 16, 
                color: '#000', 
                lineHeight: 24, 
                marginBottom: 12,
                letterSpacing: 0.3
              }}>
                {postDataState.ContentDesc}
              </Text>
              
              {/* Media Content */}
              {renderMediaContent(postDataState)}
            </View>
          ) : null}

          {/* Enhanced COMMENTS SECTION */}
          {loading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <ActivityIndicator size="large" color="#007aff" />
              <Text style={{ color: '#8e8e93', fontSize: 16, marginTop: 16 }}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 120,
              backgroundColor: '#fff',
              marginHorizontal: 16,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 1
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#f8f8f8',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}>
                <Ionicons name="chatbubble-outline" size={40} color="#c7c7cc" />
              </View>
              <Text style={{ fontSize: 22, color: '#000', fontWeight: 'bold', marginBottom: 8 }}>
                No comments yet
              </Text>
              <Text style={{ color: '#8e8e93', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }}>
                Be the first to share your response!
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#fff', marginHorizontal: 8, borderRadius: 16 }}>
              {comments.map((comment, commentIndex) => (
                <View key={comment.id}>
                  {/* Enhanced Main Comment */}
                  <View style={{
                    flexDirection: 'row',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    alignItems: 'flex-start',
                    borderBottomWidth: commentIndex < comments.length - 1 ? 1 : 0,
                    borderBottomColor: '#f5f5f5'
                  }}>
                    <View style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1
                    }}>
                      <Image 
                        source={{ uri: comment.AuthorImageURL || dummyAuthorImage }} 
                        style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 18, 
                          marginRight: 14,
                          backgroundColor: '#e8e8e8',
                          borderWidth: 2,
                          borderColor: '#fff'
                        }}
                        resizeMode="cover" 
                      />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#000', marginRight: 8 }}>
                          {comment.AuthorName}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#8e8e93' }}>
                          {getTimeAgo(comment.CommentDate)}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => handleLikeComment(comment.id, false)}
                          style={{ 
                            marginLeft: 'auto',
                            padding: 6,
                            // borderRadius: 16,
                            // backgroundColor: comment.isLiked ? '#ffe6e6' : 'transparent'
                          }}
                        >
                          <Ionicons 
                            name={comment.isLiked ? "heart" : "heart-outline"} 
                            size={18} 
                            color={comment.isLiked ? "#ff3040" : "#8e8e93"} 
                          />
                        </TouchableOpacity>
                      </View>
                      
                      {renderStructuredComment(comment, false)}
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        {(comment.likes || 0) > 0 && (
                          <Text style={{ fontSize: 13, color: '#8e8e93', marginRight: 20 }}>
                            {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                          </Text>
                        )}
                        <TouchableOpacity 
                          onPress={() => handleReplyToComment(comment.id, comment.AuthorName)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            // borderRadius: 16,
                            // backgroundColor: '#f8f8f8'
                          }}
                        >
                          <Text style={{ fontSize: 13, color: '#007aff', fontWeight: '600' }}>
                            Reply
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Enhanced Replies with Instagram-style User Tagging */}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={{ 
                      marginLeft: 80
                    }}>
                      {comment.replies.map((reply, replyIndex) => (
                        <View 
                          key={reply.id}
                          style={{
                            flexDirection: 'row',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            alignItems: 'flex-start',
                            borderBottomWidth: replyIndex < comment.replies.length - 1 ? 1 : 0,
                            borderBottomColor: '#f5f5f5'
                          }}
                        >
                          <Image 
                            source={{ uri: reply.AuthorImageURL || dummyAuthorImage }} 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: 16, 
                              marginRight: 12,
                              backgroundColor: '#e8e8e8'
                            }}
                            resizeMode="cover" 
                          />
                          
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#000', marginRight: 8 }}>
                                {reply.AuthorName}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#8e8e93' }}>
                                {getTimeAgo(reply.CommentDate)}
                              </Text>
                              <TouchableOpacity 
                                onPress={() => handleLikeComment(reply.id, true, comment.id)}
                                style={{ 
                                  marginLeft: 'auto',
                                  padding: 4,
                                  borderRadius: 12,
                                  backgroundColor: reply.isLiked ? '#ffe6e6' : 'transparent'
                                }}
                              >
                                <Ionicons 
                                  name={reply.isLiked ? "heart" : "heart-outline"} 
                                  size={16} 
                                  color={reply.isLiked ? "#ff3040" : "#8e8e93"} 
                                />
                              </TouchableOpacity>
                            </View>
                            
                            {renderStructuredComment(reply, true)}
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                              {(reply.likes || 0) > 0 && (
                                <Text style={{ fontSize: 12, color: '#8e8e93', marginRight: 16 }}>
                                  {reply.likes} {reply.likes === 1 ? 'like' : 'likes'}
                                </Text>
                              )}
                              <TouchableOpacity 
                                onPress={() => handleReplyToComment(comment.id, reply.AuthorName)}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  // borderRadius: 12,
                                  // backgroundColor: '#f8f8f8'
                                }}
                              >
                                <Text style={{ fontSize: 12, color: '#007aff', fontWeight: '600' }}>
                                  Reply
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Enhanced Comment Input Section */}
        <View style={{ 
          borderTopWidth: 1, 
          borderTopColor: '#f0f0f0', 
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3
        }}>
          {replyingTo && (
            <View style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: '#f8f9fa',
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="return-down-forward" size={16} color="#007aff" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, color: '#007aff', fontWeight: '600' }}>
                    Replying to @{replyingToUser}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setReplyingTo(null);
                    setReplyingToUser(null);
                    setShowDropdown(false);
                    animateDropdown(false);
                    setSelectedOptions([]);
                  }} 
                  style={{ 
                    padding: 6,
                    borderRadius: 12,
                    backgroundColor: '#e0e0e0'
                  }}
                >
                  <Ionicons name="close" size={16} color="#8e8e93" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Enhanced Comment Button */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: showDropdown ? 16 : insets.bottom + 16
          }}>
            <View style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}>
              <Image 
                source={{ uri: dummyAuthorImage }} 
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 18, 
                  marginRight: 14,
                  backgroundColor: '#e8e8e8',
                  borderWidth: 2,
                  borderColor: '#fff'
                }}
                resizeMode="cover" 
              />
            </View>

            <TouchableOpacity
              onPress={toggleDropdown}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8f9fa',
                borderRadius: 24,
                paddingHorizontal: 20,
                paddingVertical: 14,
                minHeight: 48,
                borderWidth: 1,
                borderColor: selectedOptions.length > 0 ? '#007aff' : '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  color: selectedOptions.length > 0 ? '#007aff' : '#8e8e93',
                  fontWeight: selectedOptions.length > 0 ? '600' : 'normal'
                }}>
                  {selectedOptions.length > 0 
                    ? `${selectedOptions.length} response${selectedOptions.length > 1 ? 's' : ''} selected`
                    : (replyingTo ? `Replying to @${replyingToUser}...` : "Add your response...")
                  }
                </Text>
              </View>
              <View style={{
                backgroundColor: showDropdown ? '#007aff' : '#e0e0e0',
                borderRadius: 16,
                padding: 6
              }}>
                <Ionicons 
                  name={showDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={showDropdown ? '#fff' : '#8e8e93'}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Enhanced Animated Dropdown Options - Beautiful Card Design */}
          <Animated.View style={{
            maxHeight: dropdownAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 400]
            }),
            opacity: dropdownAnimation,
            overflow: 'hidden'
          }}>
            {showDropdown && (
              <View style={{
                paddingHorizontal: 20,
                paddingBottom: insets.bottom + 16
              }}>
                <ScrollView 
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {RESPONSE_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleOptionSelect(option.text)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor: selectedOptions.includes(option.text) ? option.bgColor : '#ffffff',
                        borderRadius: 16,
                        marginBottom: 8,
                        borderWidth: selectedOptions.includes(option.text) ? 2 : 1,
                        borderColor: selectedOptions.includes(option.text) ? option.color : '#f0f0f0',
                        shadowColor: selectedOptions.includes(option.text) ? option.color : '#000',
                        shadowOffset: { width: 0, height: selectedOptions.includes(option.text) ? 3 : 1 },
                        shadowOpacity: selectedOptions.includes(option.text) ? 0.15 : 0.05,
                        shadowRadius: selectedOptions.includes(option.text) ? 6 : 2,
                        elevation: selectedOptions.includes(option.text) ? 4 : 1
                      }}
                    >
                      {/* Icon Circle */}
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: selectedOptions.includes(option.text) ? option.color : '#f5f5f5',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        shadowColor: option.color,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: selectedOptions.includes(option.text) ? 0.3 : 0,
                        shadowRadius: 2,
                        elevation: selectedOptions.includes(option.text) ? 2 : 0
                      }}>
                        <Ionicons 
                          name={option.icon as any} 
                          size={18} 
                          color={selectedOptions.includes(option.text) ? 'white' : option.color}
                        />
                      </View>
                      
                      {/* Text */}
                      <Text style={{
                        fontSize: 14,
                        color: selectedOptions.includes(option.text) ? option.color : '#333',
                        fontWeight: selectedOptions.includes(option.text) ? '600' : '500',
                        flex: 1,
                        lineHeight: 20
                      }}>
                        {option.text}
                      </Text>

                      {/* Selected Indicator */}
                      {selectedOptions.includes(option.text) && (
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: option.color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8
                        }}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Enhanced Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmitStructuredComment}
                  disabled={isSubmitting || selectedOptions.length === 0}
                  style={{
                    backgroundColor: selectedOptions.length > 0 ? '#007aff' : '#d0d0d0',
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: 'center',
                    marginTop: 16,
                    shadowColor: selectedOptions.length > 0 ? '#007aff' : '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: selectedOptions.length > 0 ? 0.3 : 0.1,
                    shadowRadius: 6,
                    elevation: selectedOptions.length > 0 ? 4 : 1,
                    opacity: (isSubmitting || selectedOptions.length === 0) ? 0.6 : 1
                  }}
                >
                  {isSubmitting ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                        {replyingTo ? 'Posting Reply...' : 'Submitting...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: '600'
                      }}>
                        {replyingTo ? `Reply to @${replyingToUser} (${selectedOptions.length})` : `Submit Response (${selectedOptions.length})`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
