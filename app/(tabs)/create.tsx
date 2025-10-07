import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

// **ENHANCED: File size limits and helpers**
const FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// **ENHANCED: Comprehensive error message handler**
const getErrorDetails = (error: any, fileName: string = ''): { title: string; message: string; icon: string } => {
  const errorString = String(error).toLowerCase();
  const fileNameDisplay = fileName ? `"${fileName}"` : 'your file';
  
  // File size errors (HTTP 413)
  if (errorString.includes('413') || errorString.includes('content length exceeded')) {
    const sizeLimit = formatFileSize(FILE_SIZE_LIMIT_BYTES);
    return {
      title: 'File Too Large',
      message: `${fileNameDisplay} is too large. Please choose a file smaller than ${sizeLimit}.\n\nTip: Try compressing your video or image before uploading.`,
      icon: 'warning'
    };
  }
  
  // Network timeout errors
  if (errorString.includes('timeout') || errorString.includes('network request timed out')) {
    return {
      title: 'Upload Timeout',
      message: `Upload of ${fileNameDisplay} timed out. This usually happens with large files or slow connections.\n\nTry:\n• Using a smaller file\n• Checking your internet connection\n• Trying again later`,
      icon: 'time-outline'
    };
  }
  
  // Network connection errors
  if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('connection')) {
    return {
      title: 'Connection Error',
      message: `Unable to connect to the server while uploading ${fileNameDisplay}.\n\nPlease:\n• Check your internet connection\n• Try again in a few moments`,
      icon: 'wifi-outline'
    };
  }
  
  // File format/corruption errors
  if (errorString.includes('format') || errorString.includes('corrupt') || errorString.includes('invalid')) {
    return {
      title: 'Invalid File',
      message: `${fileNameDisplay} appears to be corrupted or in an unsupported format.\n\nTry:\n• Choosing a different file\n• Converting to a common format (JPG, PNG, MP4)`,
      icon: 'document-text-outline'
    };
  }
  
  // Server errors (5xx)
  if (errorString.includes('500') || errorString.includes('502') || errorString.includes('503') || errorString.includes('server error')) {
    return {
      title: 'Server Temporarily Unavailable',
      message: `Our servers are experiencing issues processing ${fileNameDisplay}.\n\nPlease try uploading again in a few minutes.`,
      icon: 'server-outline'
    };
  }
  
  // Permission/authorization errors
  if (errorString.includes('401') || errorString.includes('403') || errorString.includes('unauthorized')) {
    return {
      title: 'Upload Permission Error',
      message: `You don't have permission to upload ${fileNameDisplay}.\n\nTry logging out and back in, then try again.`,
      icon: 'lock-closed-outline'
    };
  }
  
  // Generic upload error
  return {
    title: 'Upload Failed',
    message: `Failed to upload ${fileNameDisplay}. This could be due to:\n\n• File size too large\n• Network connectivity issues\n• Temporary server problems\n\nPlease try again with a smaller file.`,
    icon: 'cloud-upload-outline'
  };
};

// **ENHANCED: Better Custom Modal Component**
interface CustomModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
  customIcon?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  buttons,
  onClose,
  customIcon
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const getModalStyle = () => {
  switch (type) {
    case 'success':
      return {
        iconName: (customIcon || 'checkmark-circle') as any,
        iconColor: '#22C55E',
        iconBg: '#F0FDF4',
      };
    case 'error':
      return {
        iconName: (customIcon || 'close-circle') as any,
        iconColor: '#EF4444',
        iconBg: '#FEF2F2',
      };
    case 'warning':
      return {
        iconName: (customIcon || 'warning') as any,
        iconColor: '#F59E0B',
        iconBg: '#FFFBEB',
      };
    default:
      return {
        iconName: (customIcon || 'information-circle') as any,
        iconColor: '#3B82F6',
        iconBg: '#EFF6FF',
      };
  }
};

  const modalStyle = getModalStyle();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}>
        <Animated.View 
          style={[
            { transform: [{ scale: scaleAnim }] },
            {
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              width: '100%',
              maxWidth: 360,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }
          ]}
        >
          {/* Icon */}
          <View style={{
            width: 70,
            height: 70,
            backgroundColor: modalStyle.iconBg,
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name={modalStyle.iconName} size={36} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            {title}
          </Text>

          {/* Message */}
          <Text style={{
            fontSize: 15,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={{ width: '100%' }}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  width: '100%',
                  marginBottom: index < buttons.length - 1 ? 10 : 0,
                  backgroundColor: '#000000', // All buttons now have black background
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: button.style === 'cancel' ? '#374151' : 'white',
                }}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

type SelectedMedia = { uri: string; name: string; type: string; size?: number };

export default function CreatePost() {
  const router = useRouter();
  const [postText, setPostText] = useState("");
  const [userImage, setUserImage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
    customIcon?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
    customIcon: undefined
  });

  // **ENHANCED: Better alert function**
  const showCustomAlert = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    customIcon?: string
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      buttons,
      customIcon
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  // **ENHANCED: File size validation**
  const validateFileSize = (size: number, fileName: string): boolean => {
    if (size > FILE_SIZE_LIMIT_BYTES) {
      const errorDetails = getErrorDetails(`File size ${size} exceeds limit`, fileName);
      showCustomAlert(
        'warning',
        errorDetails.title,
        errorDetails.message,
        [{ text: 'OK', onPress: hideModal }],
        errorDetails.icon
      );
      return false;
    }
    return true;
  };

  const suggestedImages: string[] = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400"
  ];

  const getItem = async () => {
    try {
      const fetchuserName = await AsyncStorage.getItem('userName');
      const fetchUserImage = await AsyncStorage.getItem('profilePicUrl');
      const fetchuserID = await AsyncStorage.getItem('userId');

      if(fetchuserName !== null) {
        console.log("userName: ", fetchuserName);
        setUserName(fetchuserName);
      }

      if(fetchUserImage !== null) {
        console.log("userImage: ", fetchUserImage);
        setUserImage(fetchUserImage);
      }

      if(fetchuserID !== null) {
        setUserId(fetchuserID);
      }
      
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  }

  // **ENHANCED: Pick images with validation**
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'Please grant camera roll permissions to select images.',
          [{ text: 'OK', onPress: hideModal }],
          'camera-outline'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const validAssets: SelectedMedia[] = [];
        const invalidFiles: string[] = [];

        for (const asset of result.assets) {
          const fileSize = asset.fileSize || 0;
          const fileName = asset.fileName || 'image.jpg';

          if (fileSize > 0 && fileSize > FILE_SIZE_LIMIT_BYTES) {
            invalidFiles.push(`${fileName} (${formatFileSize(fileSize)})`);
          } else {
            validAssets.push({
              uri: asset.uri,
              name: fileName,
              type: asset.mimeType || 'image/jpeg',
              size: fileSize,
            });
          }
        }

        if (invalidFiles.length > 0) {
          const errorDetails = getErrorDetails('413 content length exceeded', 'selected images');
          showCustomAlert(
            'warning',
            'Some Files Too Large',
            `The following files exceed the ${formatFileSize(FILE_SIZE_LIMIT_BYTES)} limit:\n\n${invalidFiles.join('\n')}\n\nPlease compress these images or choose smaller ones.`,
            [{ text: 'OK', onPress: hideModal }],
            'warning'
          );
        }

        if (validAssets.length > 0) {
          setSelectedMedia((curr) => [...curr, ...validAssets]);
        }
      }
    } catch (error) {
      const errorDetails = getErrorDetails(error, 'images');
      showCustomAlert('error', errorDetails.title, errorDetails.message, [
        { text: 'OK', onPress: hideModal }
      ], errorDetails.icon);
    }
  };

  // **ENHANCED: Pick video with validation**
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'Please grant camera roll permissions to select videos.',
          [{ text: 'OK', onPress: hideModal }],
          'videocam-outline'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        const fileSize = asset.fileSize || 0;
        const fileName = asset.fileName || 'video.mp4';

        if (!validateFileSize(fileSize, fileName)) {
          return; // validateFileSize shows the error
        }

        setSelectedMedia((curr) => [...curr, {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || 'video/mp4',
          size: fileSize,
        }]);
      }
    } catch (error) {
      const errorDetails = getErrorDetails(error, 'video');
      showCustomAlert('error', errorDetails.title, errorDetails.message, [
        { text: 'OK', onPress: hideModal }
      ], errorDetails.icon);
    }
  };

  // **ENHANCED: Pick document with validation**
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        const fileSize = asset.size || 0;
        const fileName = asset.name || 'file';

        if (!validateFileSize(fileSize, fileName)) {
          return; // validateFileSize shows the error
        }

        setSelectedMedia((curr) => [
          ...curr,
          {
            uri: asset.uri,
            name: fileName,
            type: asset.mimeType || 'application/octet-stream',
            size: fileSize,
          },
        ]);
      }
    } catch (error) {
      const errorDetails = getErrorDetails(error, 'document');
      showCustomAlert('error', errorDetails.title, errorDetails.message, [
        { text: 'OK', onPress: hideModal }
      ], errorDetails.icon);
    }
  };

  const addSuggestedImage = (uri: string) => {
    setSelectedMedia((curr) => [
      ...curr,
      { uri, name: uri.split('/').pop() || 'remote.jpg', type: 'image/jpeg' },
    ]);
  };

  const removeMedia = (idx: number) => {
    setSelectedMedia((curr) => curr.filter((_, i) => i !== idx));
  };

  // **ENHANCED: Upload function with detailed error handling**
  const uploadMediaFile = async (file: SelectedMedia): Promise<string> => {
    if (Platform.OS === "web") {
      throw new Error("File upload not supported on web platform");
    }

    console.log("📤 Uploading file:", file.name, "Size:", formatFileSize(file.size || 0));
    setUploadProgress(true);
    
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    try {
      console.log("🚀 Starting upload to API...");
      const res = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile',
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log("📊 Upload response status:", res.status);
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Upload failed:", res.status, errText);
        
        // Create detailed error based on status
        let errorMessage = `HTTP status ${res.status}: ${errText}`;
        if (res.status === 413) {
          errorMessage = `File size ${formatFileSize(file.size || 0)} exceeds 10MB limit`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.fileUrl || data.fileUrl.trim() === '') {
        throw new Error("Server did not return a valid file URL");
      }
      
      console.log("✅ Upload successful:", data.fileUrl);
      return data.fileUrl;
    } catch (e) {
      console.error("❌ Upload error:", e);
      throw e;
    } finally {
      setUploadProgress(false);
    }
  };

  // **ENHANCED: Post handler with better error management**
  const handlePostNow = async () => {
    if (!postText.trim() && selectedMedia.length === 0) {
      showCustomAlert(
        'warning',
        'Empty Post',
        'Please add some content or media before posting.',
        [{ text: 'OK', onPress: hideModal }],
        'create-outline'
      );
      return;
    }

    setLoading(true);
    let uploadedUrls: string[] = [];
    let failedUploads: string[] = [];

    try {
      // Upload each media file with individual error handling
      for (let i = 0; i < selectedMedia.length; i++) {
        const asset = selectedMedia[i];
        console.log(`📤 Processing ${i + 1}/${selectedMedia.length}: ${asset.name}`);
        
        try {
          if (!asset.uri.startsWith("http")) {
            const url = await uploadMediaFile(asset);
            if (url && url.trim() !== '') {
              uploadedUrls.push(url);
              console.log(`✅ Uploaded: ${asset.name}`);
            }
          } else {
            uploadedUrls.push(asset.uri);
            console.log(`✅ Added remote URL: ${asset.uri}`);
          }
        } catch (uploadError) {
          console.error(`❌ Failed to upload ${asset.name}:`, uploadError);
          failedUploads.push(asset.name);
          
          // Show detailed error for each failed upload
          const errorDetails = getErrorDetails(uploadError, asset.name);
          
          return new Promise<void>((resolve) => {
            showCustomAlert(
              'error',
              errorDetails.title,
              `${errorDetails.message}\n\nWould you like to continue posting without this file?`,
              [
                {
                  text: 'Cancel Post',
                  style: 'cancel',
                  onPress: () => {
                    hideModal();
                    setLoading(false);
                    resolve();
                  }
                },
                {
                  text: 'Continue',
                  onPress: async () => {
                    hideModal();
                    // Continue with remaining uploads and post creation
                    await continueWithRemainingUploads(i + 1, uploadedUrls, failedUploads);
                    resolve();
                  }
                }
              ],
              errorDetails.icon
            );
          });
        }
      }

      // All uploads completed successfully
      await createPost(uploadedUrls, failedUploads);

    } catch (e) {
      console.error("❌ Post creation error:", e);
      const errorDetails = getErrorDetails(e);
      showCustomAlert('error', errorDetails.title, errorDetails.message, [
        { text: 'OK', onPress: hideModal }
      ], errorDetails.icon);
    } finally {
      setLoading(false);
    }
  };

  // **NEW: Continue with remaining uploads**
  const continueWithRemainingUploads = async (startIndex: number, uploadedUrls: string[], failedUploads: string[]) => {
    try {
      // Process remaining files
      for (let i = startIndex; i < selectedMedia.length; i++) {
        const asset = selectedMedia[i];
        try {
          if (!asset.uri.startsWith("http")) {
            const url = await uploadMediaFile(asset);
            if (url) uploadedUrls.push(url);
          } else {
            uploadedUrls.push(asset.uri);
          }
        } catch (err) {
          failedUploads.push(asset.name);
        }
      }
      
      await createPost(uploadedUrls, failedUploads);
    } catch (error) {
      console.error("❌ Error continuing uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  // **NEW: Separated post creation**
  const createPost = async (uploadedUrls: string[], failedUploads: string[]) => {
    try {
      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
        AuthorName: userName,
        AuthorUserID: userId,
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
      
      // Show success message with details
      let successMessage = `Post submitted successfully! Kindly await admin review.`;
      if (uploadedUrls.length > 0) {
        successMessage += `\n\n✅ ${uploadedUrls.length} file(s) uploaded successfully`;
      }
      if (failedUploads.length > 0) {
        successMessage += `\n⚠️ ${failedUploads.length} file(s) couldn't be uploaded due to size/connection issues`;
      }
      
      showCustomAlert(
        'success',
        'Post Submitted!',
        successMessage,
        [
          {
            text: 'Continue',
            onPress: () => {
              hideModal();
              setTimeout(() => router.back(), 500);
            }
          }
        ],
        'checkmark-circle'
      );
    } catch (e) {
      console.error("❌ Firebase error:", e);
      showCustomAlert(
        'error',
        'Post Creation Failed',
        'Failed to save your post to the server. Please check your internet connection and try again.',
        [{ text: 'OK', onPress: hideModal }],
        'cloud-offline-outline'
      );
    }
  };

  useEffect(() => {
    getItem();
  }, []);

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
            marginTop: 16,
            borderBottomWidth: 1, 
            borderColor: "#eee" 
          }}>
            <Text className="text-2xl font-bold text-gray-900 pt-3">Create post</Text>
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
                          {obj.size && (
                            <Text style={{ 
                              fontSize: 10, 
                              color: "#666", 
                              textAlign: "center" 
                            }}>
                              {formatFileSize(obj.size)}
                            </Text>
                          )}
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

          {/* Bottom toolbar */}
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
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

              <View style={{ 
                flex: 1, 
                flexDirection: "row", 
                justifyContent: "space-between" 
              }}>
                {suggestedImages.slice(0, 4).map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: (screenWidth - 65 - 8 - 32 - 24) / 4,
                      height: 65,
                      marginLeft: idx === 0 ? 0 : 6,
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
                  backgroundColor: "#FF3B30",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: loading ? 0.5 : 1,
                }}
                disabled={loading}
                onPress={handlePostNow}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                  {loading ? "Posting..." : "Submit Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Enhanced Custom Modal */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
        customIcon={modalConfig.customIcon}
      />
    </SafeAreaView>
  );
}