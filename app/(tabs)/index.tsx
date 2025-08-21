import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomPostLike from '../components/CustomPostLike';
import CustomSwitch from '../components/CustomSwitch';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PostItem {
  id: string;
  liked: boolean;
}

export default function SentinelFeed(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("1");
  const [userRole, setUserRole] = useState("User");
  const [fetchedData, setFetchedData] = useState<any[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [status, setStatus] = useState(1 ? true : false);
  const [likeStatus, setLikeStatus] = useState<PostItem[]>([]);
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  //get Async Storage Data
  const getItem = async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserRole = await AsyncStorage.getItem('userRole');
      if(fetchuserID !== null) {
        console.log("userId: ", fetchuserID);
        setUserId(fetchuserID);
      }
      if(fetchuserRole !== null) {
        console.log("userRole: ", fetchuserRole);
        setUserRole(fetchuserRole);
      }
    } catch (error) {
      console.log("Error retriving userId", error);
    }
  }

  // FETCH: Get documents
  const handleFetch = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'SentinelPosts'));
      const responseDBs: React.SetStateAction<any[]> = [];
      querySnapshot.forEach((doc) => {
        responseDBs.push({ id: doc.id, ...doc.data() });
      });

      const postsData = [];
      for (const doc of querySnapshot.docs) {

        const postData = doc.data();
        const postId = doc.id;

        postsData.push({
          id: postId,
          AuthorImageURL: postData.AuthorImageURL,
          AuthorName: postData.AuthorName,
          ContentDate: postData.ContentDate,
          ContentDesc: postData.ContentDesc,
          ContentURL: postData.ContentURL,
          ContentLikeCount: postData.ContentLikeCount || 0,
          isApproved: postData.isApproved || false,
          postType: "SentinelPosts",
          Liked: false,
        });
      }
      
      // const postsData = [];
      // for (const doc of querySnapshot.docs) {
      //   const postData = doc.data();
      //   const postId = doc.id;

      //   // Check if user liked this post
      //   const likesRef = collection(db, 'SentinelPosts', postId, 'Likes');
      //   const q = query(likesRef, where("userId", "==", userId));
      //   var liked = false;
      //   var likedId = "";

      //   const querySnapshotLike = await getDocs(q);

      //   for (const doc of querySnapshotLike.docs) {
      //     likedId = doc.id;
      //   }
      //   if (!querySnapshotLike.empty) {
      //     console.log("✅ User has liked (found in list)");
      //     liked = true;
      //   } else {
      //     console.log("❌ User has not liked");
      //     liked = false;
      //   }

      //   postsData.push({
      //     id: postId,
      //     AuthorImageURL: postData.AuthorImageURL,
      //     AuthorName: postData.AuthorName,
      //     ContentDate: postData.ContentDate,
      //     ContentDesc: postData.ContentDesc,
      //     ContentURL: postData.ContentURL,
      //     LikeCount: postData.ContentLikeCount || 0,
      //     Liked: liked,
      //     LikedId: likedId
      //   });
      // }
      
      setFetchedData(postsData);
      console.log('Data Fetched', `Fetched ${postsData.length} document`);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
    handleFetchXData();
  };

  // FETCH: X-Data
  const handleFetchXData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'X-Data'));
      const responseDBs: React.SetStateAction<any[]> = [];
      querySnapshot.forEach((doc) => {
        responseDBs.push({ id: doc.id, ...doc.data() });
      });

      const postsData: { id: string; AuthorImageURL: any; AuthorName: any; ContentDate: any; ContentDesc: any; ContentURL: any; ContentLikeCount: any; isApproved: boolean; postType: string; }[] = [];
      for (const doc of querySnapshot.docs) {

        const postData = doc.data();
        const postId = doc.id;

        postsData.push({
          id: postId,
          AuthorImageURL: postData.AuthorImageURL,
          AuthorName: postData.AuthorName,
          ContentDate: postData.ContentDate,
          ContentDesc: postData.ContentDesc,
          ContentURL: postData.ContentURL,
          ContentLikeCount: postData.ContentLikeCount || 0,
          isApproved: true,
          postType: "X-Data",
        });
      }
      
      setFetchedData(prevData => [...prevData, ...postsData]);
      console.log('XData Fetched', `Fetched ${postsData.length} document`);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateLikePost = async (item: any) => {
    console.log("userId: ", userId);

    const postRef = item.id;

    console.log("received Liked: ", item.Liked);
    
    try {
      if (item.Liked) {
        // Unlike
        await deleteDoc(doc(db, 'SentinelPosts', item.id, 'Likes', item.likedId));
        await updateDoc(doc(db, 'SentinelPosts', item.id), {
          ContentLikeCount: (item.ContentLikeCount - 1),
        });
      } else {
        const likeRef = collection(db, 'SentinelPosts', item.id, 'Likes');
        // Like
        const postDocRef = await addDoc(likeRef, {
          userId: userId,
        });
        console.log('Post Like ID: ', postDocRef.id);
        await updateDoc(doc(db, 'SentinelPosts', item.id), {
          ContentLikeCount: (item.ContentLikeCount + 1),
        });
      }

    } catch (error) {
      console.error(error);
    }
  }

  const nextScreen = async (item: any) => {
    try {
      await AsyncStorage.setItem('item', item.id);
      await AsyncStorage.setItem('postType', item.postType);
      console.log("Item stored");
      router.push("/comments");
    } catch (error) {
      console.error("Item store error, ", error);
    }
  }

  // Function to open image in full screen
  const openFullScreenImage = (imageUrl: string) => {
    setFullScreenImage(imageUrl);
    setIsModalVisible(true);
  };

  // Function to close full screen image
  const closeFullScreenImage = () => {
    setIsModalVisible(false);
    setFullScreenImage(null);
  };

  const handleToggle = async (val: number, postID: string) => {
    const newStatus = val === 1 ? true : false;
    const newPostID = postID || '';
    setStatus(newStatus);

    console.log("Toggle: ", newStatus);
    console.log("Toggle: PostID: ", newPostID);

    // Optional: Update backend or Firestore here
    // firestore().collection('posts').doc(post.id).update({ approved: val === 1 });
    await updateDoc(doc(db, 'SentinelPosts', newPostID), {
      isApproved: (newStatus),
    });
  };

  const toggleLike = async (postItem: any) => {
    // setLoadingIds(prev => [...prev, itemId]);

    // Simulate backend call delay (replace with real API call)
    await new Promise(r => setTimeout(r, 500));

    setLikeStatus(prev => {
      if (!Array.isArray(prev)) {
        console.error("Expected array but got:", prev);
        return prev; // Or consider returning a default array
      }
    
      return prev.map(item =>
        item.id === postItem.id ? { ...item, Liked: !item.liked } : item
      );
    });
    // setLoadingIds((prev: any[]) => prev.filter((id: any) => id !== itemId));
  };

  useFocusEffect(
    useCallback(() => {
      getItem();
      handleFetch();
    }, [])
  )
  
  function postItemCheck(item: any) {
    if (userRole === "User") {
      if(item.isApproved)
        return renderPostUserContent(item);
      else
        return;
    } else {
      return renderPostContent(item);
    }
  }

  // FIXED: Component to render post content with better image handling
  const renderPostContent = (item: any) => (
    <View className="bg-white border-b border-gray-100 px-4 py-4" key={item.id}>
      <View className="flex-row items-center mb-3">
        <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
          <Image
            source={{ uri: item?.AuthorImageURL ? item.AuthorImageURL : dummyAuthorImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{item.AuthorName}</Text>
        </View>
        <Text className="text-gray-400 text-sm mr-2">2hr</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text className="text-gray-900 mb-3 leading-5">{item.ContentDesc}</Text>

      {/* FIXED: Handle multiple images with better error handling */}
      {/* {item.ContentURLs && item.ContentURLs.length > 0 && (
        <View className="mb-3">
          {item.ContentURLs
            .filter((url: string) => url && url.trim() !== '')
            .map((imageUrl: string, index: number) => (
              <PostImage
                key={`${item.id}-${index}`}
                imageUrl={imageUrl}
                onPress={() => openFullScreenImage(imageUrl)}
                style={{ marginBottom: index < item.ContentURLs.length - 1 ? 8 : 0 }}
              />
            ))}
        </View>
      )} */}

      {/* FALLBACK: Support old ContentURL field */}
      {!item.ContentURLs && item.ContentURL && (
        <PostImage
          imageUrl={item.ContentURL}
          onPress={() => openFullScreenImage(item.ContentURL)}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Engagement Row */}
      <View className="flex-row items-center">
        {/* <TouchableOpacity className="flex-row items-center mr-6"
          onPress={() => toggleLike(item) }
          >
          <Ionicons
            name={item.Liked ? "heart" : "heart-outline"}
            size={28}
            color={item.Liked ? "red" : "gray"}
            style={{ marginRight: 10 }}
          />
          <Text className="text-gray-600 ml-1 text-sm">{item.ContentLikeCount}</Text>
        </TouchableOpacity> */}

        <CustomPostLike />
        <Text className="text-gray-600 ml-1 text-sm">{item.ContentLikeCount}</Text>

        <TouchableOpacity className="flex-row items-center mr-auto"
          onPress={() => nextScreen(item) }>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="text-gray-600 ml-1 text-sm">0</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center">
        <Text className="flex-row items-center mr-auto">Post Current Status: </Text>
        <CustomSwitch
          selectionMode={item.isApproved ? 1 : 2}
          option1="Approve"
          option2="Reject"
          selectionColor="#0066FF"
          onSelectSwitch={handleToggle}
          postID={item.id}
        />
      </View>
    </View>
  );

  const renderPostUserContent = (item: any) => (
    <View className="bg-white border-b border-gray-100 px-4 py-4" key={item.id}>
      <View className="flex-row items-center mb-3">
        <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
          <Image
            source={{ uri: item?.AuthorImageURL ? item.AuthorImageURL : dummyAuthorImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{item.AuthorName}</Text>
        </View>
        <Text className="text-gray-400 text-sm mr-2">2hr</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text className="text-gray-900 mb-3 leading-5">{item.ContentDesc}</Text>

      {/* FIXED: Handle multiple images with better error handling */}
      {/* {item.ContentURLs && item.ContentURLs.length > 0 && (
        <View className="mb-3">
          {item.ContentURLs
            .filter((url: string) => url && url.trim() !== '')
            .map((imageUrl: string, index: number) => (
              <PostImage
                key={`${item.id}-${index}`}
                imageUrl={imageUrl}
                onPress={() => openFullScreenImage(imageUrl)}
                style={{ marginBottom: index < item.ContentURLs.length - 1 ? 8 : 0 }}
              />
            ))}
        </View>
      )} */}

      {/* FALLBACK: Support old ContentURL field */}
      {!item.ContentURLs && item.ContentURL && (
        <PostImage
          imageUrl={item.ContentURL}
          onPress={() => openFullScreenImage(item.ContentURL)}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Engagement Row */}
      <View className="flex-row items-center">
        {/* <TouchableOpacity className="flex-row items-center mr-6"
          onPress={() => toggleLike(item) }
          >
          <Ionicons
            name={item.Liked ? "heart" : "heart-outline"}
            size={28}
            color={item.Liked ? "red" : "gray"}
            style={{ marginRight: 10 }}
          />
          <Text className="text-gray-600 ml-1 text-sm">{item.ContentLikeCount}</Text>
        </TouchableOpacity> */}

        <CustomPostLike />
        <Text className="text-gray-600 ml-1 text-sm">{item.ContentLikeCount}</Text>

        <TouchableOpacity className="flex-row items-center mr-auto"
          onPress={() => nextScreen(item) }>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="text-gray-600 ml-1 text-sm">0</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
    </View>
  );


  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Sentinel</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {fetchedData.length > 0 && (
        
        <View style={styles.results}>
            {fetchedData.map((item) => postItemCheck(item))}
          </View>
        
      )}
      
      
      {fetchedData.length === 0 && !loading && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666' }}>No posts yet. Create your first post!</Text>
          </View>
      )}
      </ScrollView>
      
      {/* Full Screen Image Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenImage}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeFullScreenImage}
          >
            {/* <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeFullScreenImage}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity> */}

            <View style={styles.imageContainer}>
              {fullScreenImage && (
                <Image
                  source={{ 
                    uri: fullScreenImage,
                    headers: {
                      'Cache-Control': 'no-cache',
                    }
                  }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// FIXED: Custom PostImage Component with better error handling
const PostImage = ({ imageUrl, onPress, style }: { 
  imageUrl: string; 
  onPress: () => void; 
  style?: any; 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = (error: any) => {
    console.error('Image load failed:', imageUrl, error.nativeEvent?.error);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', imageUrl);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(false);
    setImageError(false);
  };

  if (imageError) {
    return (
      <View style={[{
        width: '100%',
        height: 200,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }, style]}>
        <Ionicons name="image-outline" size={48} color="#9ca3af" />
        <Text style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>
          Failed to load image
        </Text>
        <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }}>
          {imageUrl.substring(0, 50)}...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={style}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ 
            uri: imageUrl,
            headers: {
              'Cache-Control': 'no-cache',
              'Accept': 'image/*',
            }
          }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: 8,
            backgroundColor: '#f3f4f6',
          }}
          resizeMode="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
          onLoadStart={handleImageLoadStart}
        />
        {imageLoading && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(243, 244, 246, 0.8)',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    zIndex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight - 100,
    maxWidth: screenWidth,
    maxHeight: screenHeight - 100,
  },
});

///Fianl home screen code