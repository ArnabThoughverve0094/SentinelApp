import { db } from "@/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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

type SelectedMedia = { uri: string; name: string; type: string };

export default function CreatePost() {
  const router = useRouter();
  const [postText, setPostText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Updated with 5 suggested images to show exactly 4 full images
  const suggestedImages: string[] = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400"
  ];

  // Helper: Pick image from gallery
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const assets = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName || a.uri.split('/').pop() || 'file.jpg',
        type: a.mimeType || 'image/jpeg',
      }));
      setSelectedMedia((curr) => [...curr, ...assets]);
    }
  };

  // Helper: Pick video
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const assets = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName || a.uri.split('/').pop() || 'file.mp4',
        type: a.mimeType || 'video/mp4',
      }));
      setSelectedMedia((curr) => [...curr, ...assets]);
    }
  };

  // Helper: Pick GIF/ANY file
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        setSelectedMedia((curr) => [
          ...curr,
          {
            uri: asset.uri,
            name: asset.name || asset.uri.split('/').pop() || 'file',
            type: asset.mimeType || 'application/octet-stream',
          },
        ]);
      }
    } catch (e) {
      Alert.alert("Document picker error", String(e));
    }
  };

  // Helper: Add from suggestions (remote)
  const addSuggestedImage = (uri: string) => {
    setSelectedMedia((curr) => [
      ...curr,
      { uri, name: uri.split('/').pop() || 'remote.jpg', type: 'image/jpeg' },
    ]);
  };

  // Helper: Remove file
  const removeMedia = (idx: number) => {
    setSelectedMedia((curr) => curr.filter((_, i) => i !== idx));
  };

  // Upload function
  const uploadMediaFile = async (file: SelectedMedia): Promise<string> => {
    if (Platform.OS === "web") {
      console.warn("File upload not supported on web.");
      return '';
    }

    console.log("Uploading file:", file.name, "Type:", file.type);
    setUploadProgress(true);
    
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    try {
      console.log("Starting upload to API...");
      const res = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile',
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log("Upload response status:", res.status);
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("Upload failed with status:", res.status, "Error:", errText);
        throw new Error(`HTTP status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("Upload response data:", data);
      
      if (!data.fileUrl || data.fileUrl.trim() === '') {
        throw new Error("No valid fileUrl returned from API");
      }
      
      console.log("Upload successful. URL:", data.fileUrl);
      return data.fileUrl;
    } catch (e) {
      console.error("Upload error:", e);
      throw e;
    } finally {
      setUploadProgress(false);
    }
  };

  // Post Submit Handler
  const handlePostNow = async () => {
    if (!postText.trim() && selectedMedia.length === 0) {
      Alert.alert("Error", "Please add some content or media before posting.");
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      
      // Upload each media file
      for (let i = 0; i < selectedMedia.length; i++) {
        const asset = selectedMedia[i];
        console.log(`Processing media ${i + 1}/${selectedMedia.length}:`, asset.name);
        
        try {
          if (!asset.uri.startsWith("http")) {
            const url = await uploadMediaFile(asset);
            if (url && url.trim() !== '') {
              uploadedUrls.push(url);
              console.log(`Successfully uploaded ${asset.name}:`, url);
            } else {
              console.warn(`Upload failed for ${asset.name} - skipping`);
            }
          } else {
            uploadedUrls.push(asset.uri);
            console.log(`Added remote URL:`, asset.uri);
          }
        } catch (uploadError) {
          console.error(`Failed to upload ${asset.name}:`, uploadError);
          Alert.alert("Upload Error", `Failed to upload ${asset.name}. Continue anyway?`, [
            { text: "Cancel", style: "cancel", onPress: () => { setLoading(false); return; } },
            { text: "Continue", onPress: () => console.log("Continuing without this file") }
          ]);
        }
      }

      console.log("Final uploaded URLs:", uploadedUrls);

      // Save to Firebase with proper field names
      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
        AuthorName: "Arnab Das",
        ContentDate: new Date(),
        ContentDesc: postText,
        ContentURL: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        ContentURLs: uploadedUrls,
        ContentLikeCount: 0,
        ContentRepostCount: 0,
        isApproved: false,
        isLiked: false,
      });

      setPostText('');
      setSelectedMedia([]);
      Alert.alert("Success", `Post created successfully! ${uploadedUrls.length} media files uploaded.`);
      setTimeout(() => router.back(), 1000);
    } catch (e) {
      console.error("Post creation error:", e);
      Alert.alert('Error', 'Failed to create post: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            alignItems: "center", 
            padding: 16, 
            borderBottomWidth: 1, 
            borderColor: "#eee" 
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, color: "#000" }}>Create post</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ 
              width: 32, 
              height: 32, 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Post Input */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 16 }}>
              <Image
                source={{ uri: 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg' }}
                style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 20, 
                  marginRight: 12, 
                  backgroundColor: "#F3F4F6" 
                }}
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
                  placeholder="What's on your mind?"
                  placeholderTextColor="#9CA3AF"
                  value={postText}
                  onChangeText={setPostText}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Media Preview */}
            {selectedMedia.length > 0 && (
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
                          <Text style={{ 
                            marginTop: 8, 
                            fontSize: 12, 
                            color: "#333", 
                            textAlign: "center" 
                          }}>
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
            )}
          </ScrollView>

          {/* Bottom toolbar - Updated to match Figma design exactly */}
          <View style={{ backgroundColor: "white", borderTopWidth: 1, borderColor: "#eee" }}>
            {/* Media Picker Icons Row */}
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              alignItems: "center", 
              paddingHorizontal: 16, 
              paddingTop: 16,
              paddingBottom: 8
            }}>
              {/* Left side - Media picker buttons */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Image Picker - Updated icon to match Figma */}
                <TouchableOpacity
                  style={{ 
                    width: 40, 
                    height: 40, 
                    alignItems: "center", 
                    justifyContent: "center", 
                    marginRight: 30 
                  }}
                  onPress={pickImages}
                >
                  <Ionicons name="images-outline" size={30} color="#666" />
                </TouchableOpacity>

                {/* GIF Picker - Updated to show "GIF" text */}
                <TouchableOpacity
                  style={{ 
                    width: 50, 
                    height: 40, 
                    alignItems: "center", 
                    justifyContent: "center", 
                    marginRight: 30,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 8
                  }}
                  onPress={pickDocument}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: "bold", 
                    color: "#666" 
                  }}>
                    GIF
                  </Text>
                </TouchableOpacity>

                {/* Video Picker */}
                <TouchableOpacity
                  style={{ 
                    width: 40, 
                    height: 40, 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}
                  onPress={pickVideo}
                >
                  <Ionicons name="videocam" size={30} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Right side - Loading indicator */}
              {(loading || uploadProgress) && (
                <View style={{ 
                  backgroundColor: "#f0f0f0", 
                  borderRadius: 50, 
                  padding: 8 
                }}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                </View>
              )}
            </View>

            {/* Plus icon and suggested images row */}
            <View style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              paddingHorizontal: 16, 
              paddingBottom: 16 
            }}>
              {/* Large Plus button */}
              <TouchableOpacity
                style={{ 
                  width: 65, 
                  height: 65, 
                  backgroundColor: "#F3F4F6", 
                  borderRadius: 12, 
                  alignItems: "center", 
                  justifyContent: "center", 
                  marginRight: 8 
                }}
                onPress={pickImages}
              >
                <Ionicons name="add" size={32} color="#666" />
              </TouchableOpacity>

              {/* Suggested images - Adjusted to show exactly 4 full images */}
              <View style={{ 
                flex: 1, 
                flexDirection: "row", 
                justifyContent: "space-between" 
              }}>
                {suggestedImages.slice(0, 4).map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: (screenWidth - 65 - 8 - 32 - 24) / 4, // Adjusted calculation for 4 full images
                      height: 65,
                      marginLeft: idx === 0 ? 0 : 6, // Small gap between images
                    }}
                    onPress={() => addSuggestedImage(uri)}
                  >
                    <Image
                      source={{ uri }}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        borderRadius: 12, 
                        backgroundColor: "#F3F4F6" 
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Post Now Button */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#8B5CF6",
                  borderRadius: 16,
                  paddingVertical: 16,
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
//Final create post