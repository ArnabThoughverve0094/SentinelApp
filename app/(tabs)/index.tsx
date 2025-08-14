import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SentinelFeed(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<any[]>([]);
  const [fetchedXData, setFetchedXData] = useState<any[]>([]);
  const dummyAuthorImage = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // FETCH: Get documents
  const handleFetch = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'SentinelPosts'));
      const responseDBs: React.SetStateAction<any[]> = [];
      querySnapshot.forEach((doc) => {
        responseDBs.push({ id: doc.id, ...doc.data() });
      });
      setFetchedData(responseDBs);
      console.log('Data Fetched', `Fetched ${responseDBs.length} document`);
      
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
      setFetchedXData(responseDBs);
      console.log('XData Fetched', `Fetched ${responseDBs.length} document`);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateLikePost = async (item: any) => {
    
    try {
      const postDocRef = doc(db, 'SentinelPosts', item.id);

      //update only specific Field
      if(item.isLike){
        await updateDoc(postDocRef, {
          isLike: true,
          ContentLikeCount: (item.ContentLikeCount + 1)
        })
      } else {
        await updateDoc(postDocRef, {
          isLike: false,
          ContentLikeCount: (item.ContentLikeCount - 1)
        })
      }

    } catch (error) {
      console.error(error);
    }
  }

  const nextScreen = async (item: any) => {
    try {
      await AsyncStorage.setItem('item', item.id);
      console.log("Item stored");
      router.push("/comments");
    } catch (error) {
      console.error("Item store error, ", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      handleFetch();
    }, [])
  )

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
          {fetchedData.map((item) => (
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
          
                <Text className="text-gray-900 mb-3 leading-5">{item.ContentDesc}</Text>
          
                {/* Abstract Image Post */}
                {item.ContentURL && (
                  <View className="mb-3">
                  <Image
                    source={{ uri: item.ContentURL }}
                    className="w-full h-40 rounded-lg"
                    resizeMode="cover"
                    height={350}
                  />
                </View>
                )}
          
                {/* Engagement Row */}
                <View className="flex-row items-center">
                  <TouchableOpacity className="flex-row items-center mr-6">
                    <Ionicons name="heart-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 ml-1 text-sm">{item.ContentLikeCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center mr-auto"
                  onPress={() => nextScreen(item) }>
                    <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 ml-1 text-sm">0</Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity className="flex-row items-center mr-auto">
                    <Ionicons name="repeat-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 ml-1 text-sm">31</Text>
                  </TouchableOpacity> */}
                  <TouchableOpacity>
                    <Ionicons name="share-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        
      )}
      {fetchedXData.length > 0 && (
        <View style={styles.results}>
          {fetchedXData.map((item) => (
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
          
                <Text className="text-gray-900 mb-3 leading-5">{item.ContentDesc}</Text>
          
                {/* Abstract Image Post */}
                {item.ContentURL && (
                  <View className="mb-3">
                  <Image
                    source={{ uri: item.ContentURL }}
                    className="w-full h-40 rounded-lg"
                    resizeMode="cover"
                    height={350}
                  />
                </View>
                )}
          
                {/* Engagement Row */}
                <View className="flex-row items-center">
                  <TouchableOpacity className="flex-row items-center mr-6">
                    <Ionicons name="heart-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 ml-1 text-sm">{item.ContentLikeCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center mr-auto"
                  onPress={() => nextScreen(item) }>
                    <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 ml-1 text-sm">0</Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity className="flex-row items-center mr-auto">
                    <Ionicons name="repeat-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 ml-1 text-sm">31</Text>
                  </TouchableOpacity> */}
                  <TouchableOpacity>
                    <Ionicons name="share-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        
      )}
      

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: 20 },
  rowContainer: {
    flexDirection: 'row',
    marginTop: 20
  },
  button: {
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
  results: { marginTop: 20, width: '100%' },
  resultText: { fontSize: 16, marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingBottom: 4 },
});