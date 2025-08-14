import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get('window');

export default function CreatePost(): React.JSX.Element {
  const router = useRouter();
  const [postText, setPostText] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  // Extended suggested images (more than 3)
  const suggestedImages = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop'
  ];

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handlePost = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: "https://tse1.mm.bing.net/th/id/OIP.3Kzmgs5IGnuIVL7SHDcYmgHaF7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        AuthorName: "Arnab Das",
        ContentDate: new Date(),
        ContentDesc: postText,
        ContentLikeCount: 0,
        isLiked: false,
        ContentURL: ""
      });
      setPostText('');
      // Alert.alert('Success', 'Post added to Firestore');
    } catch (error) {
      console.error(error);
      // Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const addSuggestedImage = (imageUri: string) => {
    setSelectedImages(prev => [...prev, imageUri]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostNow = async () => {
    setLoading(true);
    try {
      console.log("Post Text:", postText);
      console.log("Selected Images:", selectedImages);
      handlePost();
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error("Post creation failed:", error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
            <Text 
              className="font-bold text-black"
              style={{ fontSize: 18, lineHeight: 24 }}
            >
              Create post
            </Text>
            
            <View className="flex-row items-center">
              {loading && (
                <ActivityIndicator 
                  size="small" 
                  color="#8B5CF6" 
                  style={{ marginRight: 12 }}
                />
              )}
              
              <TouchableOpacity 
                onPress={() => router.back()}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="close" size={26} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable content area */}
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile section with text input */}
            <View className="flex-row items-start px-4 py-4 bg-white">
              {/* Profile Image - Using actual profile image instead of person icon */}
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }}
                className="w-10 h-10 rounded-full mr-3 mt-1"
                style={{
                  backgroundColor: '#F3F4F6' // Fallback background
                }}
                resizeMode="cover"
              />
              
              {/* Text input area */}
              <View className="flex-1">
                <TextInput
                  className="text-base text-black"
                  placeholder="Type your message here..."
                  placeholderTextColor="#9CA3AF"
                  value={postText}
                  onChangeText={setPostText}
                  multiline={true}
                  textAlignVertical="top"
                  style={{ 
                    fontSize: 16, 
                    lineHeight: 22,
                    minHeight: 80,
                    maxHeight: 120,
                    paddingTop: 0,
                    paddingBottom: 10
                  }}
                />
              </View>
            </View>

            {/* Selected images display - ALWAYS full screen, never compact */}
            {selectedImages.length > 0 && (
              <View className="px-4 pb-4">
                <View className="flex-row flex-wrap">
                  {selectedImages.map((uri, index) => (
                    <View 
                      key={index} 
                      className="relative mb-2"
                      style={{ 
                        width: selectedImages.length === 1 ? screenWidth - 32 : (screenWidth - 48) / 2,
                        marginRight: selectedImages.length === 1 ? 0 : (index % 2 === 0 ? 8 : 0),
                        marginLeft: selectedImages.length === 1 ? 0 : (index % 2 === 1 ? 8 : 0)
                      }}
                    >
                      <Image 
                        source={{ uri }}
                        style={{
                          width: '100%',
                          height: selectedImages.length === 1 ? 300 : 180,
                          borderRadius: 12,
                          backgroundColor: '#F3F4F6' // Fallback background to prevent white images
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                        onPress={() => removeImage(index)}
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          elevation: 5,
                        }}
                      >
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom section - Always visible */}
          <View className="bg-white border-t border-gray-200">
            {/* Image suggestions and add button */}
            <View className="flex-row px-4 py-3">
              <TouchableOpacity
                className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mr-2"
                onPress={pickImages}
              >
                <Ionicons name="add" size={20} color="#666666" />
              </TouchableOpacity>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggestedImages.map((imageUri, index) => (
                  <TouchableOpacity
                    key={index}
                    className="mr-2"
                    onPress={() => addSuggestedImage(imageUri)}
                  >
                    <Image 
                      source={{ uri: imageUri }}
                      className="w-12 h-12 rounded-lg"
                      style={{
                        backgroundColor: '#F3F4F6' // Fallback background
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bottom toolbar */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <TouchableOpacity className="mr-5" onPress={pickImages}>
                  <Ionicons name="image-outline" size={24} color="#666666" />
                </TouchableOpacity>
                
                <TouchableOpacity className="mr-5">
                  <Text className="text-base font-bold text-gray-600">GIF</Text>
                </TouchableOpacity>
              </View>
              <View />
            </View>

            {/* Post Now Button - Always visible */}
            <View className="px-4 pb-4">
              <TouchableOpacity
                className={`py-4 px-6 rounded-xl items-center ${
                  loading ? "opacity-50" : ""
                }`}
                style={{ backgroundColor: '#8B5CF6' }}
                disabled={loading}
                onPress={handlePostNow}
              >
                <Text className="text-white text-base font-semibold">
                  {loading ? "Posting..." : "Post Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
