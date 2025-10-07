import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useReducer, useState } from 'react';
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
import TotalSentiment from './TotalSentiment';

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
  userId?: string;
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
  CommentTemplate: string,
}

interface CommentScreenProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postType: string | null;
  postData: PostData | undefined;
  commentTemplate: string | null;
}

// Response options matching the image design
let RESPONSE_OPTIONS = [
  // { id: 'agree', label: 'Agree', icon: '👍', color: '#34C759' },
  // { id: 'disagree', label: 'Disagree', icon: '🚫', color: '#FF3B30' },
  // { id: 'support', label: 'I Support This', icon: '⭐', color: '#FF9500' },
  // { id: 'hate', label: 'Hate Speech', icon: '😡', color: '#FF3B30' }
];

export default function CommentScreen({ 
  visible, 
  onClose, 
  postId, 
  postType, 
  postData,
  commentTemplate
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showSentimentPage, setShowSentimentPage] = useState(false);
  
  // New states for user comment management
  const [userExistingComment, setUserExistingComment] = useState<Comment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

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

  // Check if user already has a comment on this post
  const checkUserExistingComment = async (itemId: string, itemType: string, currentUserId: string) => {
    try {
      const commentsRef = collection(db, itemType, itemId, 'Comments');
      const userCommentQuery = query(
        commentsRef,
        where('userId', '==', currentUserId)
      );
      
      const snapshot = await getDocs(userCommentQuery);
      if (!snapshot.empty) {
        const commentDoc = snapshot.docs[0];
        const commentData = commentDoc.data();
        
        const existingComment: Comment = {
          id: commentDoc.id,
          AuthorName: commentData.AuthorName ?? "",
          AuthorImageURL: commentData.AuthorImageURL ?? "",
          Comment: commentData.Comment ?? "",
          CommentDate: commentData.CommentDate ?? new Date(),
          replies: [],
          likes: 0,
          isLiked: false,
          selectedOptions: commentData.selectedOptions || [],
          commentType: commentData.commentType || 'text',
          userId: commentData.userId
        };
        
        setUserExistingComment(existingComment);
        return existingComment;
      }
      
      setUserExistingComment(null);
      return null;
    } catch (error) {
      console.error('Error checking user existing comment:', error);
      return null;
    }
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
          CommentTemplate: data.CommentTemplate || 'Template1',
        });
        fetchCommentTemplate(data.CommentTemplate || 'Template1');
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
      CommentTemplate: passedPostData.CommentTemplate || 'Template1'
    });
    fetchCommentTemplate(passedPostData.CommentTemplate || 'Template1');
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
        
        // Check if user already has a comment
        if (fetchuserID) {
          await checkUserExistingComment(postId, postType, fetchuserID);
        }
        
        fetchCommentFirestore(postId, postType);
      }
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  }

  const fetchCommentTemplate = useCallback(async (passedCommentTemplate: any) => {
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
          console.log("Comment Template Passed: ", passedCommentTemplate);

          if(passedCommentTemplate == postId){
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

      })

      return () => {
        unsubscribeCommentTemp();
      };

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  },[RESPONSE_OPTIONS]);

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
            commentType: postData.commentType || 'text',
            userId: postData.userId
          });
        }

        setComments(commentData);

        // Set up listeners for replies per comment
        // commentData.forEach((comment) => {
        //   const collReplyRefPost = collection(db, type, item, 'Comments', comment.id, 'Replies');
        //   const queryReply = query(
        //     collReplyRefPost,
        //     orderBy('CommentDate', 'desc')
        //   );
        //   console.log("Replies OnSnapshot");
          
        //   onSnapshot(queryReply, replySnapshot => {
        //     const replydataArr = replySnapshot.docs.map(doc => ({
        //       id: doc.id,
        //       data: doc.data(),
        //     }));
    
        //     const replyData: Reply[] = [];
        //     for (const doc of replydataArr) {
        //       const postData = doc.data;
        //       const postId = doc.id;
        //       replyData.push({
        //         id: postId,
        //         AuthorName: postData.AuthorName ?? "",
        //         AuthorImageURL: postData.AuthorImageURL ?? "",
        //         Comment: postData.Comment ?? "",
        //         CommentDate: postData.CommentDate ?? new Date(),
        //         likes: 0,
        //         isLiked: false,
        //         selectedOptions: postData.selectedOptions || [],
        //         commentType: postData.commentType || 'text',
        //         userId: postData.userId
        //       });
        //     }

        //     setComments(prevComments =>
        //       prevComments.map(c =>
        //         c.id === comment.id
        //           ? {
        //               ...c,
        //               replies: replyData,
        //             }
        //           : c
        //       )
        //     );
        //   })
        // })
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

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(selectedOption === optionId ? null : optionId);
  };

  // Handle structured comment submission (new or edit)
  const handleSubmitResponse = async () => {
    if (!selectedOption || !postId || !postType) return;

    setIsSubmitting(true);
    
    try {
      const selectedOptionData = RESPONSE_OPTIONS.find(opt => opt.id === selectedOption);
      const commentText = selectedOptionData?.label || '';
      
      if (isEditMode && userExistingComment) {
        // Edit existing comment
        const commentRef = doc(db, postType, postId, 'Comments', userExistingComment.id);
        await updateDoc(commentRef, {
          Comment: commentText,
          selectedOptions: [selectedOption],
          commentType: 'structured'
        });
        console.log('Comment updated successfully');
        setIsEditMode(false);
      } else if (replyingTo) {
        // Add reply
        const repliesRef = collection(db, postType, postId, 'Comments', replyingTo, 'Replies');
        const postDocRef = await addDoc(repliesRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: commentText,
          selectedOptions: [selectedOption],
          commentType: 'structured',
          userId: userId
        });
        console.log('Structured Reply Post ID: ', postDocRef.id);
      } else {
        // Add new comment
        const commentRef = collection(db, postType, postId, 'Comments');
        const postDocRef = await addDoc(commentRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: commentText,
          selectedOptions: [selectedOption],
          commentType: 'structured',
          userId: userId
        });
        console.log('Response submitted with ID: ', postDocRef.id);
      }
      
      // Reset and close
      setSelectedOption(null);
      setShowResponseModal(false);
      setReplyingTo(null);
      
      // Refresh user existing comment check
      if (postId && postType) {
        await checkUserExistingComment(postId, postType, userId);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!postId || !postType) return;

    Alert.alert(
      "Delete Response",
      "Are you sure you want to delete your response? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const commentRef = doc(db, postType, postId, 'Comments', commentId);
              await deleteDoc(commentRef);
              console.log('Comment deleted successfully');
              
              // Reset user existing comment
              setUserExistingComment(null);
              setShowMenuModal(false);
              setSelectedCommentId(null);
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert("Error", "Failed to delete response. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Handle edit comment
  const handleEditComment = (comment: Comment) => {
    setSelectedOption(comment.selectedOptions?.[0] || null);
    setIsEditMode(true);
    setShowMenuModal(false);
    setShowResponseModal(true);
  };

  // Handle three dots menu press with position
  const handleThreeDotsPress = (commentId: string, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedCommentId(commentId);
    setMenuPosition({ x: pageX - 120, y: pageY + 10 }); // Adjust position
    setShowMenuModal(true);
  };

  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setShowResponseModal(true);
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

  const handleGraphPress = () => {
    setShowSentimentPage(true);
  };

  const handleSentimentClose = () => {
    setShowSentimentPage(false);
  };

  const handleAddResponseFromSentiment = () => {
    setShowSentimentPage(false);
    
    // Check if user already has a comment
    if (userExistingComment) {
      Alert.alert(
        "Edit Your Response",
        "You have already responded to this post. Would you like to edit your existing response?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Edit", 
            onPress: () => handleEditComment(userExistingComment)
          }
        ]
      );
    } else {
      setShowResponseModal(true);
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
        <View style={{ marginTop: 12, marginBottom: 16 }}>
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
        <View style={{ marginTop: 12, marginBottom: 16 }}>
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
        <View style={{ marginTop: 12, marginBottom: 16 }}>
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

  // Render structured comment content
  const renderStructuredComment = (comment: Comment | Reply) => {
    if (comment.commentType === 'structured' && comment.selectedOptions && comment.selectedOptions.length > 0) {
      return (
        <View style={{ marginTop: 4 }}>
          {comment.selectedOptions.map((option, index) => {
            const optionData = RESPONSE_OPTIONS.find(opt => opt.id === option);
            return (
              <View 
                key={index}
                style={{
                  backgroundColor: '#f0f8ff',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginBottom: 4,
                  borderLeftWidth: 3,
                  borderLeftColor: '#007aff',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                {/* <Text style={{ fontSize: 16, marginRight: 8 }}>
                  {optionData?.icon || '✓'}
                </Text> */}
                <Image
                    source={{ uri: optionData?.icon}}
                    className="w-16 h-10"
                    resizeMode="contain"
                  />
                <Text style={{ fontSize: 13, color: '#007aff', fontWeight: '500' }}>
                  {optionData?.label || option}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }
    
    return (
      <Text style={{ fontSize: 14, color: '#000', lineHeight: 18, marginBottom: 8 }}>
        {comment.Comment}
      </Text>
    );
  };

  useEffect(() => {
    if (visible && postId && postType) {
      getItem();
    }
    
    if (!visible) {
      setComments([]);
      setPostDataState(null);
      setSelectedOption(null);
      setShowResponseModal(false);
      setReplyingTo(null);
      setShowSentimentPage(false);
      setUserExistingComment(null);
      setIsEditMode(false);
      setShowMenuModal(false);
      setSelectedCommentId(null);
    }
  }, [visible, postId, postType, postData]);

  return (
    <>
      {/* Main Comment Screen */}
      <Modal
        visible={visible && !showResponseModal && !showSentimentPage}
        transparent={false}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={false}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          {/* Header with close button */}
          <View 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: Platform.OS === 'ios' ? insets.top + 12 : insets.top + 20,
              paddingBottom: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: '#e5e5e5'
            }}
          >
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
              Comments
            </Text>
            <TouchableOpacity 
              style={{ padding: 4 }}
              onPress={handleGraphPress}
              activeOpacity={0.7}
            >
              <Feather name="bar-chart-2" size={21} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* POST CONTENT SECTION */}
            {postLoading ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
              </View>
            ) : postDataState ? (
              <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 20 }}>
                {/* Post Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Image
                    source={{ uri: postDataState.AuthorImageURL || dummyAuthorImage }}
                    style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 24, 
                      marginRight: 12,
                      backgroundColor: '#e8e8e8' 
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                      {postDataState.AuthorName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={{ fontSize: 14, color: '#8e8e93' }}>
                        {postDataState.AuthorUsername}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#8e8e93', marginLeft: 8 }}>
                        {getTimeAgo(postDataState.ContentDate)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Post Content */}
                <Text style={{ fontSize: 15, color: '#000', lineHeight: 20, marginBottom: 8 }}>
                  {postDataState.ContentDesc}
                </Text>
                
                {/* Media Content */}
                {renderMediaContent(postDataState)}
              </View>
            ) : null}

            {/* COMMENTS SECTION */}
            {loading ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50 }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text style={{ color: '#8e8e93', fontSize: 16, marginTop: 12 }}>Loading comments...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
                <Ionicons name="chatbubble-outline" size={60} color="#c7c7cc" />
                <Text style={{ fontSize: 20, color: '#000', fontWeight: 'bold', marginTop: 16 }}>
                  No responses yet
                </Text>
                <Text style={{ color: '#8e8e93', fontSize: 16, marginTop: 8 }}>
                  Be the first to respond!
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: '#fff' }}>
                {comments.map((comment) => (
                  <View key={comment.id}>
                    {/* Main Comment */}
                    <View style={{
                      flexDirection: 'row',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      alignItems: 'flex-start'
                    }}>
                      <Image 
                        source={{ uri: comment.AuthorImageURL || dummyAuthorImage }} 
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
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#000', marginRight: 12 }}>
                            {comment.AuthorName}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#8e8e93' }}>
                            {getTimeAgo(comment.CommentDate)}
                          </Text>
                          
                          {/* Three dots menu for user's own comments */}
                          {comment.userId === userId ? (
                            <TouchableOpacity 
                              onPress={(event) => handleThreeDotsPress(comment.id, event)}
                              style={{ marginLeft: 'auto', padding: 4 }}
                            >
                              <MaterialIcons name="more-vert" size={16} color="#8e8e93" />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              // onPress={() => handleLikeComment(comment.id, false)}
                              style={{ marginLeft: 'auto' }}
                            >
                              {/* <Ionicons 
                                name={comment.isLiked ? "heart" : "heart-outline"} 
                                size={16} 
                                color={comment.isLiked ? "#ff3040" : "#8e8e93"} 
                              /> */}
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        {renderStructuredComment(comment)}
                        
                        {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {(comment.likes || 0) > 0 && (
                            <Text style={{ fontSize: 12, color: '#8e8e93', marginRight: 16 }}>
                              {comment.likes} likes
                            </Text>
                          )}
                          <TouchableOpacity 
                            onPress={() => handleReplyToComment(comment.id, comment.AuthorName)}
                          >
                            <Text style={{ fontSize: 12, color: '#8e8e93', fontWeight: '500' }}>
                              Reply
                            </Text>
                          </TouchableOpacity>
                        </View> */}
                      </View>
                    </View>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View style={{ marginLeft: 60, borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }}>
                        {comment.replies.map((reply) => (
                          <View 
                            key={reply.id}
                            style={{
                              flexDirection: 'row',
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              alignItems: 'flex-start'
                            }}
                          >
                            <Image 
                              source={{ uri: reply.AuthorImageURL || dummyAuthorImage }} 
                              style={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: 14, 
                                marginRight: 8,
                                backgroundColor: '#e8e8e8' 
                              }}
                              resizeMode="cover" 
                            />
                            
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000', marginRight: 8 }}>
                                  {reply.AuthorName}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#8e8e93' }}>
                                  {getTimeAgo(reply.CommentDate)}
                                </Text>
                                <TouchableOpacity 
                                  onPress={() => handleLikeComment(reply.id, true, comment.id)}
                                  style={{ marginLeft: 'auto' }}
                                >
                                  <Ionicons 
                                    name={reply.isLiked ? "heart" : "heart-outline"} 
                                    size={14} 
                                    color={reply.isLiked ? "#ff3040" : "#8e8e93"} 
                                  />
                                </TouchableOpacity>
                              </View>
                              
                              {renderStructuredComment(reply)}
                              
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {(reply.likes || 0) > 0 && (
                                  <Text style={{ fontSize: 11, color: '#8e8e93', marginRight: 12 }}>
                                    {reply.likes} likes
                                  </Text>
                                )}
                                <TouchableOpacity 
                                  onPress={() => handleReplyToComment(comment.id, reply.AuthorName)}
                                >
                                  <Text style={{ fontSize: 11, color: '#8e8e93', fontWeight: '500' }}>
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

          {/* Add Response Button Fixed at Bottom */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: '#e5e5e5',
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: insets.bottom + 12
          }}>
            <TouchableOpacity
              onPress={() => {
                if (userExistingComment) {
                  Alert.alert(
                    "Edit Your Response",
                    "You have already responded to this post. Would you like to edit your existing response?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Edit", 
                        onPress: () => handleEditComment(userExistingComment)
                      }
                    ]
                  );
                } else {
                  setShowResponseModal(true);
                }
              }}
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

          {/* Compact Three Dots Menu Modal - positioned on comment */}
          {showMenuModal && (
            <Modal
              visible={showMenuModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMenuModal(false)}
            >
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
                activeOpacity={1}
                onPress={() => setShowMenuModal(false)}
              >
                <View style={{
                  position: 'absolute',
                  top: menuPosition.y,
                  left: menuPosition.x,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  paddingVertical: 4,
                  minWidth: 140,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      const comment = comments.find(c => c.id === selectedCommentId);
                      if (comment) handleEditComment(comment);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="#007AFF" />
                    <Text style={{ marginLeft: 10, fontSize: 14, color: '#007AFF' }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={{ height: 0.5, backgroundColor: '#e5e5e5', marginHorizontal: 8 }} />
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedCommentId) handleDeleteComment(selectedCommentId);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
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
        </View>
      </Modal>

      {/* Response Selection Modal */}
      <Modal
        visible={showResponseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowResponseModal(false);
          setSelectedOption(null);
          setReplyingTo(null);
          setIsEditMode(false);
        }}
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
                {isEditMode ? 'Edit Your Response' : (replyingTo ? 'Reply with Response' : 'Select Your Response')}
              </Text>
              
              {/* Graph Icon */}
              <TouchableOpacity 
                style={{ padding: 4, marginLeft: 60 }}
                onPress={() => {
                  setShowResponseModal(false);
                  handleGraphPress();
                }}
                activeOpacity={0.7}
              >
                <Feather name="bar-chart-2" size={21} color="#000" />
              </TouchableOpacity>
              
              {/* Close Icon */}
              <TouchableOpacity 
                onPress={() => {
                  setShowResponseModal(false);
                  setSelectedOption(null);
                  setReplyingTo(null);
                  setIsEditMode(false);
                }} 
                style={{ padding: 4 }}
              >
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
                  {/* <Text style={{ fontSize: 40, marginBottom: 8 }}>
                    {option.icon}
                  </Text> */}
                  <Image
                    source={{ uri: option.icon}}
                    className="w-16 h-10"
                    resizeMode="contain"
                  />
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
                    ? `${isEditMode ? 'Update' : 'Submit'} "${RESPONSE_OPTIONS.find(opt => opt.id === selectedOption)?.label}"` 
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
        postData={postDataState ?? undefined}
        onAddResponse={handleAddResponseFromSentiment}
        userExistingComment={userExistingComment}
        onEditComment={handleEditComment}
        commentTemplate={commentTemplate}
      />
    </>
  );
}