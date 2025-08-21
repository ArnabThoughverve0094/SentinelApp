import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import React, { Key, useCallback, useReducer, useState } from 'react';
import { FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CommentScreen() {
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const [userId, setUserId] = useState("1");
  const [userName, setUserName] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemID, setItemID] = useState("");
  const [postType, setPostType] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

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
        handleFetchComment(item, type);
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

  // FETCH: Get documents
  const handleFetchComment = async (item: any, type: any) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, type, item, 'Comments'));
      const responseDBs: React.SetStateAction<any[]> = [];
      querySnapshot.forEach((doc) => {
        responseDBs.push({ id: doc.id, ...doc.data(), replies: [] });
      });
      // setComments(responseDBs);

      console.log('Comments Fetched', `Fetched ${responseDBs.length} document`);

      handleFetchReply(item, type, responseDBs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // FETCH: Get Reply documents
  const handleFetchReply = async (postItem: any, type: any, commentList: any[]) => {
    setLoading(true);
    try {
      
      commentList.forEach(async (item) => {
       const querySnapshot = await getDocs(collection(db, type, postItem, 'Comments', item.id, 'Replies'));
        querySnapshot.forEach((doc) => {
          item.replies.push({ id: doc.id, ...doc.data() });
        });

        console.log('Comments Fetched', `Item: ${item.id} Replies: ${item.replies.length}`);
        setComments(commentList);
        setInput(``);
        forceRerender(); // Ensure UI refresh
      })

      console.log('Replies Fetched');
      
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
    setLoading(true);
    if (replyingTo) {
      console.log("Reply post");
      try {
        //Reference: SentinelPosts -> Item -> Comments -> CommentID -> Replies -> autoRepliesID
        const repliesRef = collection(db, postType, itemID, 'Comments', replyingTo, 'Replies');
        const postDocRef = await addDoc(repliesRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: input
        });
        console.log('Replies Post ID: ', postDocRef.id);
        setInput('');
        handleFetchComment(itemID, postType);
  
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
      setReplyingTo(null);
    }
    else {
      console.log("Comment post");
      try {
        //Reference: SentinelPosts -> Item -> Comments -> autoCommentID
        const commentRef = collection(db, postType, itemID, 'Comments');
        const postDocRef = await addDoc(commentRef, {
          AuthorImageURL: "",
          AuthorName: userName,
          CommentDate: new Date(),
          Comment: input
        });
        console.log('Comment Post ID: ', postDocRef.id);
        setInput('');
        handleFetchComment(itemID, postType);
  
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
  };


  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setInput(`@${username} `);
  };
  

  useFocusEffect(
    useCallback(() => {
      getItem();
    }, [])
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header with back button */}
      <View className="px-6 pt-4 pb-8">
        <Link href="/(tabs)" asChild>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
        </Link>
      </View>

      
      <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="bg-white border-b border-gray-100 px-4 py-4" key={item.id}>
            <View className="bg-white border-b border-gray-100 px-4 py-4">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
                  <Image
                    source={{ uri: item?.AuthorImageURL ? item.AuthorImageURL : dummyAuthorImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                    width={50}
                    height={50}
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
              <Text className="text-gray-900 mb-3 leading-5">{item.Comment}</Text>

              <TouchableOpacity onPress={() => handleReplyToComment(item.id, item.AuthorName)}>
                <Text className="text-gray-400 text-xs font-medium">
                  Reply
                </Text>
              </TouchableOpacity>
            </View>

            {item.replies.length > 0 && (
              <View style={styles.results}>
                {item.replies.map((itemReply: {
                  [x: string]: Key | null | undefined; AuthorImageURL: string | undefined; AuthorName: string ; Comment: string  | undefined; 
}) => 
                  <View className="bg-white border-b border-gray-100 px-4 py-4" key={itemReply.id}>
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
                      <Image
                        source={{ uri: itemReply?.AuthorImageURL ? itemReply.AuthorImageURL : dummyAuthorImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                        width={50}
                        height={50}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{itemReply.AuthorName}</Text>
                    </View>
                    <Text className="text-gray-400 text-sm mr-2">2hr</Text>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-900 mb-3 leading-5">{itemReply.Comment}</Text>
    
                </View>
                )}
              </View>
            )}

          </View>
          
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a comment..."
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
      
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  commentBubble: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendText: { color: '#fff', fontWeight: 'bold' },
  results: { 
    marginTop: 5,
    marginStart: 50, 
    width: '100%' 
  },
});
