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
  TextInput,
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

// Updated interface to include postData
interface CommentScreenProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postType: string | null;
  postData: PostData | undefined; // Added this property
}

// Updated component signature to accept postData
export default function CommentScreen({ 
  visible, 
  onClose, 
  postId, 
  postType, 
  postData // Added this parameter
}: CommentScreenProps) {
  const insets = useSafeAreaInsets();
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const [userId, setUserId] = useState("1");
  const [userName, setUserName] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [postDataState, setPostDataState] = useState<PostData | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        
        // Use passed postData if available, otherwise fetch from database
        if (postData) {
          convertPostData(postData);
        } else {
          await fetchPostData(postId, postType);
        }
        
        // handleFetchComment(postId, postType);
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
      // Process Comment Fetch
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
            isLiked: false
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
          // Process Comment Fetch
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
                isLiked: false
              });
            }

            // setComments((prev) =>
            // prev.map((c) =>
            //   c.id === comment.id ? { ...c, replyData } : c
            //   )
            // );
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

      const sortedComments = responseDBs.sort((a, b) => {
        const getTimestamp = (commentDate: any) => {
          if (commentDate && typeof commentDate === 'object' && commentDate.toDate) {
            return commentDate.toDate().getTime();
          } else if (commentDate) {
            return new Date(commentDate).getTime();
          }
          return 0;
        };
        
        return getTimestamp(b.CommentDate) - getTimestamp(a.CommentDate);
      });

      console.log('Comments Fetched and Sorted', `Fetched ${sortedComments.length} documents`);
      handleFetchReply(item, type, sortedComments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchReply = async (postItem: any, type: any, commentList: Comment[]) => {
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

        const sortedReplies = replies.sort((a, b) => {
          const getTimestamp = (replyDate: any) => {
            if (replyDate && typeof replyDate === 'object' && replyDate.toDate) {
              return replyDate.toDate().getTime();
            } else if (replyDate) {
              return new Date(replyDate).getTime();
            }
            return 0;
          };
          
          return getTimestamp(b.CommentDate) - getTimestamp(a.CommentDate);
        });

        item.replies = sortedReplies;
      }

      setComments(updatedComments);
    } catch (error) {
      console.error(error);
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
        const repliesRef = collection(db, postType!, postId!, 'Comments', replyingTo, 'Replies');
        const postDocRef = await addDoc(repliesRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: input
        });
        console.log('Replies Post ID: ', postDocRef.id);
        setInput('');
        // handleFetchComment(postId, postType);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
      setReplyingTo(null);
    } else {
      console.log("Comment post");
      try {
        const commentRef = collection(db, postType!, postId!, 'Comments');
        const postDocRef = await addDoc(commentRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: input
        });
        console.log('Comment Post ID: ', postDocRef.id);
        setInput('');
        // handleFetchComment(postId, postType);
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

  // Updated useEffect to handle postData prop
  useEffect(() => {
    if (visible && postId && postType) {
      getItem();
    }
    
    if (!visible) {
      setComments([]);
      setPostDataState(null);
      setInput('');
      setReplyingTo(null);
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
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
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
                No comments yet
              </Text>
              <Text style={{ color: '#8e8e93', fontSize: 16, marginTop: 8 }}>
                Be the first to comment!
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
                        <TouchableOpacity 
                          onPress={() => handleLikeComment(comment.id, false)}
                          style={{ marginLeft: 'auto' }}
                        >
                          <Ionicons 
                            name={comment.isLiked ? "heart" : "heart-outline"} 
                            size={16} 
                            color={comment.isLiked ? "#ff3040" : "#8e8e93"} 
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={{ fontSize: 14, color: '#000', lineHeight: 18, marginBottom: 8 }}>
                        {comment.Comment}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                      </View>
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
                            
                            <Text style={{ fontSize: 13, color: '#000', lineHeight: 16, marginBottom: 6 }}>
                              {reply.Comment}
                            </Text>
                            
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

        {/* Comment input */}
        <View style={{ 
          borderTopWidth: 0.5, 
          borderTopColor: '#e5e5e5', 
          backgroundColor: '#fff' 
        }}>
          {replyingTo && (
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: '#f8f8f8',
              borderBottomWidth: 0.5,
              borderBottomColor: '#e5e5e5'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#8e8e93', fontWeight: '500' }}>
                  Replying to {input.split(' ')[0]}
                </Text>
                <TouchableOpacity onPress={() => {
                  setReplyingTo(null);
                  setInput('');
                }} style={{ padding: 4 }}>
                  <Ionicons name="close" size={16} color="#8e8e93" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12
          }}>
            <Image 
              source={{ uri: dummyAuthorImage }} 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                marginRight: 12,
                backgroundColor: '#e8e8e8' 
              }}
              resizeMode="cover" 
            />

            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: '#f2f2f2',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              minHeight: 40
            }}>
              <TextInput
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                placeholderTextColor="#8e8e93"
                value={input}
                onChangeText={setInput}
                multiline={true}
                style={{ 
                  flex: 1, 
                  fontSize: 15, 
                  color: '#000',
                  maxHeight: 100,
                  paddingVertical: 4
                }}
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={isSubmitting || !input.trim()}
                style={{ 
                  marginLeft: 8,
                  opacity: (isSubmitting || !input.trim()) ? 0.5 : 1
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <Text style={{ 
                    color: input.trim() ? "#007aff" : "#8e8e93",
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Emoji row */}
        </View>
      </View>
    </Modal>
  );
}
