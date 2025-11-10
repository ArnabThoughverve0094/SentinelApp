import { db } from '@/FirebaseConfig';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoView, useVideoPlayer } from 'expo-video';
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
  Dimensions,
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  isAnonymous: boolean,
  contentType: string;
}

interface CommentScreenProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postType: string | null;
  postData: PostData | undefined;
  commentTemplate: string | null;
}

let RESPONSE_OPTIONS: any[] = [];

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
  const [userImage, setUserImage] = useState("");
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
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  
  // NEW: Full screen media states - SAME AS LANDING PAGE
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  const [userExistingComment, setUserExistingComment] = useState<Comment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [changedAuthorImage, setChangedAuthorImage] = useState<string | null>(null);
  const [changedAuthorName, setChangedAuthorName] = useState<string | null>(null);
  
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // NEW: Full screen video player - SAME AS LANDING PAGE
  const fullScreenVideoPlayer = useVideoPlayer(fullScreenVideo || '', (player) => {
    player.loop = false;
    player.play();
  });

  // NEW: Full screen handlers - SAME AS LANDING PAGE
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

  // UPDATED: VideoPlayer component - SAME AS LANDING PAGE
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

    useEffect(() => {
      if (currentVideoIndex === index) {
        player.play();
      } else {
        player.pause();
      }
    }, [currentVideoIndex, index, player]);

    return (
      <TouchableOpacity 
        onPress={() => openFullScreenVideo(videoUrl)}
        activeOpacity={0.95}
      >
        <View style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
          <VideoView
            player={player}
            style={{ width: '100%', height: 200 }}
            contentFit="contain"
            nativeControls={false}
          />
          <View style={{ position: 'absolute', top: 8, right: 8, padding: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <Ionicons name="play-outline" size={14} color="white" />
          </View>
          {currentVideoIndex !== index && (
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="play" size={20} color="white" />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [currentVideoIndex, openFullScreenVideo]);

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
          CommentTemplate: data.CommentTemplate || 'Sentinel Default Template',
          isAnonymous: data.isAnonymous || false,
          contentType: data.contentType || 'My Thoughts'
        });
        fetchCommentTemplate(data.CommentTemplate || 'Sentinel Default Template');

        if (data.isAnonymous || false) {
          setChangedAuthorImage(dummyAuthorImage);
          setChangedAuthorName("Anonymous");
        } else {
          setChangedAuthorImage(data.AuthorImageURL || dummyAuthorImage);
          setChangedAuthorName(data.AuthorName || "Anonymous");
        }
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
    } finally {
      setPostLoading(false);
    }
  };

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
      CommentTemplate: passedPostData.CommentTemplate || 'Sentinel Default Template',
      isAnonymous: passedPostData.isAnonymous || false,
      contentType: passedPostData.contentType || 'My Thoughts'

    });
    fetchCommentTemplate(passedPostData.CommentTemplate || 'Sentinel Default Template');

    if (passedPostData.isAnonymous || false) {
      setChangedAuthorImage(dummyAuthorImage);
      setChangedAuthorName("Anonymous");
    } else {
      setChangedAuthorImage(passedPostData.AuthorImageURL || dummyAuthorImage);
      setChangedAuthorName(passedPostData.AuthorName || "Anonymous");
    }

  };

  const getItem = async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserName = await AsyncStorage.getItem('userName');
      const fetchUserImage = await AsyncStorage.getItem('profilePicUrl');
      
      if(fetchuserID !== null && fetchuserName !== null) {
        console.log("userID: ", fetchuserID);
        console.log("userName: ", fetchuserName);
        setUserId(fetchuserID);
        setUserName(fetchuserName);
      }

      if(fetchUserImage !== null) {
        console.log("userImage: ", fetchUserImage);
        setUserImage(fetchUserImage);
      }
      
      if(postId && postType) {
        console.log("Item: ", postId);
        console.log("type: ", postType);
        
        if (postData) {
          convertPostData(postData);
        } else {
          await fetchPostData(postId, postType);
        }
        
        if (fetchuserID) {
          await checkUserExistingComment(postId, postType, fetchuserID);
        }
        
        fetchCommentFirestore(postId, postType);
      }
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  };

  const fetchCommentTemplate = useCallback(async (passedCommentTemplate: any) => {
    try {
      // const collCommentTempPost = collection(db, 'SentimentTemplates');
      const collCommentTempPost = collection(db, 'templates');
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
          console.log("Comment Template Fetched: ", postData);

          // if("Sentinel Default Template" == postData.name) {
          if(passedCommentTemplate == postData.name) {
            const optionsField = postData.options;

            optionsField.map((nestedOption, index) => {
              // Get the key (e.g., "option1") and the value (the {icon, title} map)
              const optionKey = Object.keys(nestedOption)[0];
              const optionDetails = nestedOption[optionKey];

              RESPONSE_OPTIONS.push({
                index: index,
                id: typeof optionDetails.title === "string" ? optionDetails.title : "",
                icon: typeof optionDetails.icon === "string" ? optionDetails.icon : "",
                label: typeof optionDetails.title === "string" ? optionDetails.title : "",
                color: '#34C759'
              })
            }) 
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

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(selectedOption === optionId ? null : optionId);
    handleSubmitResponse(optionId);
  };

  const handleSubmitResponse = async (optionId: string) => {
    // if (!selectedOption || !postId || !postType) return;

    setIsSubmitting(true);
    
    try {
      // const selectedOptionData = RESPONSE_OPTIONS.find(opt => opt.id === selectedOption);
      const selectedOptionData = RESPONSE_OPTIONS.find(opt => opt.id === optionId);
      const commentText = selectedOptionData?.label || '';
      
      if (isEditMode && userExistingComment) {
        const commentRef = doc(db, postType, postId, 'Comments', userExistingComment.id);
        await updateDoc(commentRef, {
          Comment: commentText,
          // selectedOptions: [selectedOption],
          selectedOptions: [optionId],
          commentType: 'structured'
        });
        console.log('Comment updated successfully');
        setIsEditMode(false);
      // } else if (replyingTo) {
      //   const repliesRef = collection(db, postType, postId, 'Comments', replyingTo, 'Replies');
      //   const postDocRef = await addDoc(repliesRef, {
      //     AuthorImageURL: userImage || dummyAuthorImage,
      //     AuthorName: userName,
      //     CommentDate: new Date(),
      //     Comment: commentText,
      //     selectedOptions: [selectedOption],
      //     commentType: 'structured',
      //     userId: userId
      //   });
      //   console.log('Structured Reply Post ID: ', postDocRef.id);
      } else {
        const commentRef = collection(db, postType, postId, 'Comments');
        const postDocRef = await addDoc(commentRef, {
          AuthorImageURL: userImage || dummyAuthorImage,
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: commentText,
          // selectedOptions: [selectedOption],
          selectedOptions: [optionId],
          commentType: 'structured',
          userId: userId
        });
        console.log('Response submitted with ID: ', postDocRef.id);
      }
      
      setSelectedOption(null);
      setShowResponseModal(false);
      setReplyingTo(null);
      
      if (postId && postType) {
        await checkUserExistingComment(postId, postType, userId);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleEditComment = (comment: Comment) => {
    setSelectedOption(comment.selectedOptions?.[0] || null);
    setIsEditMode(true);
    setShowMenuModal(false);
    setShowResponseModal(true);
  };

  const handleThreeDotsPress = (commentId: string, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedCommentId(commentId);
    setMenuPosition({ x: pageX - 120, y: pageY + 10 });
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

  // UPDATED: Render media content with click to fullscreen - SAME AS LANDING PAGE
  const renderMediaContent = (post: PostData) => {
    const mediaUrls = post.ContentURLs && post.ContentURLs.length > 0 ? post.ContentURLs : 
                     (post.ContentURL ? [post.ContentURL] : []);
    
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const primaryMediaUrl = mediaUrls[0];
    const mediaType = getMediaType(primaryMediaUrl);

    if (mediaType === 'image' || mediaType === 'gif') {
      return (
        <View style={{ marginTop: 12, marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => openFullScreenImage(primaryMediaUrl)}
            activeOpacity={0.95}
          >
            <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              {/* Background Image (faded) */}
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{
                  width: '100%',
                  height: 200,
                  position: 'absolute',
                  opacity: 0.4,
                }}
                className="bg-white"
                resizeMode="cover"
                blurRadius={5}
                resizeMethod="resize"
              />
              
              {/* Foreground Image (main) */}
              <Image
                source={{ uri: primaryMediaUrl }}
                style={{
                  width: '100%',
                  height: 200,
                }}
                resizeMode="contain"
                resizeMethod="resize"
                onError={(error) => {
                  console.log("Image load error:", error.nativeEvent.error);
                }}
              />
              
              <View style={{ 
                position: 'absolute', 
                top: 8, 
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
    } else if (mediaType === 'video') {
      return (
        <View style={{ marginTop: 12, marginBottom: 16 }}>
          <VideoPlayer videoUrl={primaryMediaUrl} />
        </View>
      );
    }
    
    return null;
  };

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
                <Image
                  source={{ uri: optionData?.icon}}
                  style={{ width: 64, height: 40 }}
                  resizeMode="contain"
                  resizeMethod="resize"
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
      // NEW: Close full screen modals
      closeFullScreenImage();
      closeFullScreenVideo();
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

          {/* Header */}
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
                    // source={{ uri: postDataState.AuthorImageURL || dummyAuthorImage }}
                    source={{ uri: changedAuthorImage }}
                    style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 24, 
                      marginRight: 12,
                      backgroundColor: '#e8e8e8' 
                    }}
                    resizeMode="cover"
                    resizeMethod="resize"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                      {/* {postDataState.AuthorName} */}
                      {changedAuthorName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      {/* <Text style={{ fontSize: 14, color: '#8e8e93' }}>
                        {postDataState.AuthorUsername}
                      </Text> */}
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
                        resizeMethod="resize"
                      />
                      
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#000', marginRight: 12 }}>
                            {comment.AuthorName}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#8e8e93' }}>
                            {getTimeAgo(comment.CommentDate)}
                          </Text>
                          
                          {comment.userId === userId && (
                            <TouchableOpacity 
                              onPress={(event) => handleThreeDotsPress(comment.id, event)}
                              style={{ marginLeft: 'auto', padding: 4 }}
                            >
                              <MaterialIcons name="more-vert" size={16} color="#8e8e93" />
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        {renderStructuredComment(comment)}
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
                              resizeMethod="resize"
                            />
                            
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000', marginRight: 8 }}>
                                  {reply.AuthorName}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#8e8e93' }}>
                                  {getTimeAgo(reply.CommentDate)}
                                </Text>
                              </View>
                              
                              {renderStructuredComment(reply)}
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

          {/* Add Response Button */}
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

          {/* Three Dots Menu Modal */}
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
                  {/* <TouchableOpacity
                    onPress={() => {
                      // const comment = comments.find(c => c.id === selectedCommentId);
                      // if (comment) handleEditComment(comment);
                      if(userExistingComment) handleEditComment(userExistingComment);
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
                  </TouchableOpacity> */}
                  
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

      {/* NEW: IMAGE MODAL - SAME AS LANDING PAGE */}
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

      {/* NEW: VIDEO MODAL - SAME AS LANDING PAGE */}
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
            {isSubmitting ? (
                    <ActivityIndicator size="large" color="#000" />
                  ) : (
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      marginBottom: 24
                    }}>
                      {RESPONSE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.index}
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
                          <Image
                            source={{ uri: option.icon}}
                            style={{ width: 64, height: 40 }}
                            resizeMode="contain"
                            resizeMethod="resize"
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
                  )}
            

            {/* Submit Button */}
            {/* <TouchableOpacity
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
            </TouchableOpacity> */}
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
