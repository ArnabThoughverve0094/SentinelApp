import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CommentScreen() {
  const [comments, setComments] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemID, setItemID] = useState("");
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  const getItem = async () => {
    try {
      const item = await AsyncStorage.getItem('item');
      if(item !== null) {
        console.log("Item: ", item);
        setItemID(item);
        handleFetchComment(item);
      }
    } catch (error) {
      console.log("Error retriving item", error);
    }
   
  }

  const handleSend = async () => {
    if (input.trim() !== '') {
      console.log('handlePostComment called');
      handlePostComment();
    }
  };

  const handlePostComment = async () => {
    setLoading(true);
    try {
      //Reference: SentinelPosts -> Item -> Comments -> autoCommentID
      const commentRef = collection(db, 'SentinelPosts', itemID, 'Comments');
      const postDocRef = await addDoc(commentRef, {
        AuthorImageURL: "",
        AuthorName: "Arnab Das",
        CommentDate: new Date(),
        Comment: input
      });
      console.log('Comment Post ID: ', postDocRef.id);
      setInput('');
      handleFetchComment(itemID);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // FETCH: Get documents
  const handleFetchComment = async (item: any) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'SentinelPosts', item, 'Comments'));
      const responseDBs: React.SetStateAction<any[]> = [];
      querySnapshot.forEach((doc) => {
        responseDBs.push({ id: doc.id, ...doc.data() });
      });
      setComments(responseDBs);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
});
