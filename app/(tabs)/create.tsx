import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get('window');
type SelectedMedia = {
  [x: string]: string; uri: string; name: string; type: string 
};

export default function CreatePost(): React.JSX.Element {
  const router = useRouter();
  const [userId, setUserId] = useState("1");
  const [userName, setUserName] = useState("");
  const [postText, setPostText] = useState<string>("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia>();
  const [loading, setLoading] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  // Extended suggested images (more than 3)
  const suggestedImages = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400'
  ];

  //get Async Storage Data
  const getItem = async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserName = await AsyncStorage.getItem('userName');
      if(fetchuserID !== null) {
        console.log("userId: ", fetchuserID);
        setUserId(fetchuserID);
      }
      if(fetchuserName !== null) {
        console.log("userName: ", fetchuserName);
        setUserName(fetchuserName);
      }
    } catch (error) {
      console.log("Error retriving userId", error);
    }
  }

  // Keyboard listeners
  useEffect(() => {
    getItem();
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

  // Helper: Pick image from gallery
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      // const assets = result.assets.map((a) => ({
      //   uri: a.uri,
      //   name: a.fileName || a.uri.split('/').pop() || 'file.jpg',
      //   type: a.mimeType || 'image/jpeg',
      // }));
      // setSelectedMedia((curr) => [...curr, ...assets]);
      const assets = {
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || result.assets[0].uri.split('/').pop() || 'file.jpg',
        type: result.assets[0].mimeType || 'image/jpeg',
      };
      setSelectedMedia(assets);
    }
  };

  // Helper: Pick ANY file (incl. video)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '/',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        // setSelectedMedia((curr) => [
        //   ...curr,
        //   {
        //     uri: asset.uri,
        //     name: asset.name || asset.uri.split('/').pop() || 'file',
        //     type: asset.mimeType || 'application/octet-stream',
        //   },
        // ]);
      }
    } catch (e) {
      Alert.alert("Document picker error", String(e));
    }
  };

  // Helper: Add from suggestions (remote)
  const addSuggestedImage = (uri: string) => {
    // setSelectedMedia((curr) => [
    //   ...curr,
    //   { uri, name: uri.split('/').pop() || 'remote.jpg', type: 'image/jpeg' },
    // ]);
    setSelectedMedia({ uri, name: uri.split('/').pop() || 'remote.jpg', type: 'image/jpeg' });
  };

  // Helper: Remove file
  // const removeMedia = (idx: number) => {
  //   setSelectedMedia((curr) => curr.filter((_, i) => i !== idx));
  // };
  const removeMedia = () => {
    setSelectedMedia({ uri: '', name: '', type: '' });
  };

  // FIXED: Actual upload function with better error handling
  const uploadMediaFile = async (file: any) => {
    if (Platform.OS === "web") {
      console.warn("File upload not supported on web.");
      return '';
    }

    const formattedUri =
    file.uri.startsWith('content://')
        ? file.uri.replace('content://', 'file://')
        : file.uri;

        const compressed = await ImageManipulator.manipulateAsync(
          formattedUri,
          [{ resize: { width: 800 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

    console.log("Uploading file:", file.name, "Type:", file.type);
    
    const formData = new FormData();
    formData.append("file", {
      uri: compressed.uri,
      name: Date.now().toString() + Math.random().toString().slice(2, 6) + 'compressed.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      console.log("Starting upload to API...");
      // const res = await fetch(
      //   'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile',
      //   {
      //     method: 'POST',
      //     body: formData,
      //   }
      // );
      const res = await axios.post('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile', formData, {
        headers: { Accept: 'application/json' },
      });

      console.log('Upload response:', res.data);
      console.log("Upload response status:", res.status);
      
      // if (!res.ok) {
      //   const errText = await res.text();
      //   console.error("Upload failed with status:", res.status, "Error:", errText);
      //   throw new Error(`HTTP status ${res.status}: ${errText}`);
      // }

      // const data = await res.json();
      // console.log("Upload response data:", data);
      
      // if (!data.fileUrl || data.fileUrl.trim() === '') {
      //   throw new Error("No valid fileUrl returned from API");
      // }
      
      // console.log("Upload successful. URL:", data.fileUrl);
      // return data.fileUrl;

      return res.data;
    } catch (e) {
      console.error("Upload error:", e);
      throw e; // Re-throw to handle in calling function
    }
  };

  // Post Submit Handler
  const handlePostNow = async () => {
    // Validation: Don't allow posting if text is empty and no media
    // if (!postText.trim() && selectedMedia.length === 0) {
    if (!postText.trim() && selectedMedia === null) {
      Alert.alert("Error", "Please add some content or media before posting.");
      return;
    }
    else{
      setLoading(true);
      try {
        var uploadedUrl: string = "";
        // Upload each media file
      // for (let i = 0; i < selectedMedia.length; i++) {
        // const asset = selectedMedia[i];
        // console.log(`Processing media ${i + 1}/${selectedMedia.length}:`, asset.name);
        const asset = selectedMedia;
        console.log(`Processing media:`, asset?.name);
        
        try {
          if (!asset?.uri.startsWith("http")) {
            // Local file - needs upload
            const url = await uploadMediaFile(asset);
            if (url && url.trim() !== '') {
              uploadedUrl = url;
              console.log(`Successfully uploaded ${asset?.name}:`, url);
            } else {
              console.warn(`Upload failed for ${asset?.name} - skipping`);
            }
          } else {
            // Remote URL - add directly
            uploadedUrl = asset?.uri;
            console.log(`Added remote URL:`, asset?.uri);
          }
          handlePost(uploadedUrl);
        } catch (uploadError) {
          console.error(`Failed to upload ${asset?.name}:`, uploadError);
          Alert.alert("Upload Error", `Failed to upload ${asset?.name}. Continue anyway?`, [
            { text: "Cancel", style: "cancel", onPress: () => { setLoading(false); return; } },
            { text: "Continue", onPress: () => {
              console.log("Continuing without this file");
              handlePost(uploadedUrl);
            } }
          ]);
        }
      // }

      console.log("Final uploaded URL:", uploadedUrl);
  
        
      } catch (e) {
        Alert.alert('Error', 'Failed to create post: ' + String(e));
      } finally {
        setLoading(false);
      }
    }
    
  };

  const handlePost = async (uploadedUrl: string) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: "",
        AuthorName: userName,
        ContentDate: new Date(),
        ContentDesc: postText,
        ContentLikeCount: 0,
        ContentURL: uploadedUrl,
        isApproved: false
      });
      setPostText('');
      // setSelectedMedia([]);
      setSelectedMedia({ uri: '', name: '', type: '' });
      setTimeout(() => router.back(), 1000);
      // Alert.alert('Success', 'Post added to Firestore');
    } catch (error) {
      console.error(error);
      // Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.results} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, color: "#000" }}>Create post</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {loading && <ActivityIndicator size="small" color="#8B5CF6" style={{ marginRight: 12 }} />}
              <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={26} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Post Input */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 16 }}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#F3F4F6" }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <TextInput
                  style={{
                    fontSize: 16,
                    color: "#000",
                    minHeight: 80,
                    maxHeight: 120,
                    lineHeight: 22,
                    paddingTop: 0,
                    paddingBottom: 10,
                  }}
                  placeholder="Type your message here..."
                  placeholderTextColor="#9CA3AF"
                  value={postText}
                  onChangeText={setPostText}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Media Preview */}
            {/* {selectedMedia.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {selectedMedia.map((obj, idx) => (
                    <View
                      key={idx}
                      style={{
                        position: "relative",
                        marginBottom: 8,
                        width: selectedMedia.length === 1 ? screenWidth - 32 : (screenWidth - 48) / 2,
                        marginRight: selectedMedia.length === 1 ? 0 : idx % 2 === 0 ? 8 : 0,
                        marginLeft: selectedMedia.length === 1 ? 0 : idx % 2 === 1 ? 8 : 0,
                      }}
                    >
                      {obj.type.startsWith("image/") ? (
                        <Image
                          source={{ uri: obj.uri }}
                          style={{
                            width: "100%",
                            height: selectedMedia.length === 1 ? 300 : 180,
                            borderRadius: 12,
                            backgroundColor: "#F3F4F6",
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: selectedMedia.length === 1 ? 300 : 180,
                            borderRadius: 12,
                            backgroundColor: "#E5E7EB",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="document-text" size={48} color="#8B5CF6" />
                          <Text style={{ marginTop: 8, fontSize: 12, color: "#333", textAlign: "center" }}>
                            {obj.name}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "red",
                          justifyContent: "center",
                          alignItems: "center",
                          elevation: 7,
                        }}
                        onPress={() => removeMedia(idx)}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )} */}
            {selectedMedia != null && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  
                <View
                      style={{
                        position: "relative",
                        marginBottom: 8,
                        width: screenWidth - 32,
                        marginRight: 0,
                        marginLeft: 0,
                      }}
                    >
                      {selectedMedia.type.startsWith("image/") ? (
                        <Image
                          source={{ uri: selectedMedia.uri }}
                          style={{
                            width: "100%",
                            height: 300,
                            borderRadius: 12,
                            backgroundColor: "#F3F4F6",
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: 300,
                            borderRadius: 12,
                            backgroundColor: "#E5E7EB",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="document-text" size={48} color="#8B5CF6" />
                          <Text style={{ marginTop: 8, fontSize: 12, color: "#333", textAlign: "center" }}>
                            {selectedMedia.name}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "red",
                          justifyContent: "center",
                          alignItems: "center",
                          elevation: 7,
                        }}
                        onPress={() => removeMedia()}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom toolbar */}
          <View style={{ backgroundColor: "white", borderTopWidth: 1, borderColor: "#eee" }}>
            <View style={{ flexDirection: "row", padding: 16 }}>
              <TouchableOpacity
                style={{ width: 48, height: 48, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 8 }}
                onPress={pickImages}
              >
                <Ionicons name="add" size={20} color="#666" />
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={{ width: 48, height: 48, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 8 }}
                onPress={pickDocument}
              >
                <Ionicons name="document-outline" size={20} color="#666" />
              </TouchableOpacity> */}
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggestedImages.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{ marginRight: 8 }}
                    onPress={() => addSuggestedImage(uri)}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "#F3F4F6" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ padding: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#8B5CF6",
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: loading ? 0.5 : 1,
                }}
                disabled={loading}
                onPress={handlePostNow}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
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

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
});