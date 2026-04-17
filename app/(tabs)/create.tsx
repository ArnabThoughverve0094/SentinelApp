import { db } from "@/FirebaseConfig";
import compressImage from "@/components/CompressImage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from 'expo-document-picker';
import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { addDoc, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getMediaType } from '../../utils/mediaHelpers';
const MAX_CHARACTERS = 2000;

  // Returns styled, clickable React Native text from input value
  const renderStyledText = (text) => {
    if (!text) return null;

    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const hashtagPattern = /(^|\s)(#[a-zA-Z0-9_]+)/g;

    const urlMatches = [];
    const hashtagMatches = [];

    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      urlMatches.push({
        type: "url",
        text: match[0],
        index: match.index,
        length: match[0].length,
      });
    }

    while ((match = hashtagPattern.exec(text)) !== null) {
      hashtagMatches.push({
        type: "hashtag",
        text: match[2],
        index: match.index + match[1].length,
        length: match[2].length,
      });
    }

    const allMatches = [...urlMatches, ...hashtagMatches].sort((a, b) => a.index - b.index);
    if (allMatches.length === 0) {
      return <Text style={{ color: "#111827" }}>{text}</Text>;
    }

    const components = [];
    let lastIndex = 0;

    allMatches.forEach((match, i) => {
      if (match.index > lastIndex) {
        components.push(
          <Text key={`text-${i}`} style={{ color: "#111827" }}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }

      if (match.type === "url") {
        components.push(
          <Text
            key={`url-${i}`}
            style={{
              color: "#2563EB",
              textDecorationLine: "underline",
              fontWeight: "600",
            }}
            onPress={() => {
              const url = match.text.startsWith("http") ? match.text : `https://${match.text}`;
              Linking.openURL(url);
            }}
          >
            {match.text}
          </Text>
        );
      } else if (match.type === "hashtag") {
        components.push(
          <TouchableOpacity
            key={`hashtag-${i}`}
            onPress={() => {
              // Add navigation/filter logic per hashtag
              alert("Hashtag tapped: " + match.text);
            }}
          >
            <Text
              style={{
                color: "#E6161A",
                fontWeight: "bold",
                backgroundColor: "#FFF0F3",
                paddingHorizontal: 2,
                borderRadius: 3,
              }}
            >
              {match.text}
            </Text>
          </TouchableOpacity>
        );
      }
      lastIndex = match.index + match.length;
    });

    if (lastIndex < text.length) {
      components.push(
        <Text key="end" style={{ color: "#111827" }}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return components;
  };


import { sendPushNotification } from "@/context/NotificationContext";
import { Video } from 'react-native-compressor';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

// **ENHANCED: File size limits and helpers**
const FILE_SIZE_LIMIT_BYTES = 121 * 1024 * 1024; // 151MB
const FILE_SIZE_LIMIT_MB = 121; // For display purposes

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
  
  // Network timeout errors (now more specific)
  if (errorString.includes('timeout') || errorString.includes('network request timed out')) {
    return {
      title: 'Upload Timeout ⏱️',
      message: `Upload of ${fileNameDisplay} timed out after 10 minutes.\n\nThis usually happens with:\n• Very large files (>100MB)\n• Slow internet connections\n• Weak mobile signal\n\nTry:\n• Compressing your video/image\n• Using a smaller file\n• Connecting to faster WiFi\n• Trying again later`,
      icon: 'time-outline'
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
    message: `Failed to upload ${fileNameDisplay}. This could be due to:\n\n• File size too large (limit: ${FILE_SIZE_LIMIT_MB}MB)\n• Network connectivity issues\n• Temporary server problems\n• Upload timeout (files >100MB may fail)\n\nPlease try again with a smaller or compressed file.`,
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
interface TemplateResponseType
 {
  success: boolean;
  message: string;
  templateName?: string;
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
                  backgroundColor: button.style === 'cancel' ? '#F3F4F6' : '#000000',
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

// Define the type for the radio button options
type PostType = 'My Thoughts' | 'Witnessed' | 'Found Online';

// --- Custom Radio Button Component ---
interface RadioButtonProps {
  label: PostType;
  selected: boolean;
  onSelect: (value: PostType) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ label, selected, onSelect }) => (
  <TouchableOpacity
    // 1. Ensure the whole touchable area is a row and centered
    className="flex-row items-center p-2" 
    onPress={() => onSelect(label)}
    activeOpacity={0.7}
  >
    {/* Outer Circle (The Radio) */}
    <View
      className={`w-4 h-4 rounded-full border-2 ${
        selected ? 'border-red-500' : 'border-gray-400'
      } items-center justify-center`}
    >
      {/* Inner Dot (Selected state) */}
      {selected && (
        <View className="w-2 h-2 rounded-full bg-red-500" />
      )}
    </View>
    
    {/* Label Text */}
    <Text className={`ml-2 text-sm ${selected ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function CreatePost() {
  const router = useRouter();
  const [postText, setPostText] = useState("");
  const [userImage, setUserImage] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userNickName, setUserNickName] = useState("");
  const [userId, setUserId] = useState("");
  const [userDeviceToken, setUserDeviceToken] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [currentUserDocId, setCurrentUserDocId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEducationalEnabled, setIsEducationalEnabled] = useState<boolean>(false);
  const scaleFactor = 0.7; // Smaller: 0.7 (70% of original size)
  const [inputHeight, setInputHeight] = useState(50); // Initial small height


  // Handler function to invert the state when the switch is toggled.
  const toggleSwitch = () => {
    setIsEducationalEnabled(previousState => !previousState);
    if(isEducationalEnabled){
      saveLastTab("");
    } else {
      saveLastTab("educational");
    }
    
  }

  //Radio button
  const [selectedType, setSelectedType] = useState<PostType>('My Thoughts');
  const options: PostType[] = ['My Thoughts', 'Witnessed', 'Found Online'];
  // Add to your state declarations
    const [uploadingFiles, setUploadingFiles] = useState<{
      fileName: string;
      progress: number;
    }[]>();


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

  // **ENHANCED: File size validation with detailed messaging**
  const validateFileSize = (size: number, fileName: string, fileType: 'image' | 'video' | 'document'): boolean => {
    if (size > FILE_SIZE_LIMIT_BYTES) {
      const actualSize = formatFileSize(size);
      const maxSize = formatFileSize(FILE_SIZE_LIMIT_BYTES);
      
      let fileTypeText = fileType;
      let compressionTip = '';
      
      if (fileType === 'video') {
        compressionTip = '\n\n💡 Tips for videos:\n• Use a video compressor app\n• Reduce video quality/resolution\n• Trim unnecessary parts\n• Convert to MP4 format';
      } else if (fileType === 'image') {
        compressionTip = '\n\n💡 Tips for images:\n• Use an image compressor\n• Reduce image resolution\n• Convert to JPG format';
      }
      
      showCustomAlert(
        'warning',
        `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} Too Large ⚠️`,
        `File: "${fileName}"\nSize: ${actualSize}\nMax allowed: ${maxSize}\n\nYour ${fileType} exceeds the maximum file size limit of ${FILE_SIZE_LIMIT_MB}MB.${compressionTip}\n\nPlease choose or compress to a smaller file.`,
        [{ text: 'OK', onPress: hideModal, style: 'default' }],
        'alert-circle-outline'
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
      const fetchuserName = (await AsyncStorage.getItem('userName') || '');
      const fetchUserImage = (await AsyncStorage.getItem('profilePicUrl') || '');
      const fetchuserID = (await AsyncStorage.getItem('userId') || '1234');
      const fetchCreateType = (await AsyncStorage.getItem('createType') || '');
      const fetchuseNickrName = (await AsyncStorage.getItem('userNickName') || '');
      const fetchuserDeviceToken = (await AsyncStorage.getItem('deviceToken') || '');

      setUserEmail(await AsyncStorage.getItem('userEmail') || '');

      if(fetchuserName !== null) {
        console.log("userName: ", fetchuserName);
        setUserName(fetchuserName);
      }

      if(fetchUserImage !== null) {
        console.log("userImage: ", fetchUserImage);
        setUserImage(fetchUserImage);
      }

      if(fetchuserID !== null) {
        console.log("userID: ", fetchuserID);
        setUserId(fetchuserID);
      }

      if(fetchCreateType !== null) {
        if(fetchCreateType == "educational"){
          setIsEducationalEnabled(true);
        } else {
          setIsEducationalEnabled(false);
        }
      } else {
        setIsEducationalEnabled(false);
      }

      if(fetchuseNickrName !== null) {
        console.log("userNickName: ", fetchuseNickrName);
        setUserNickName(fetchuseNickrName);
      }

      if(fetchuserDeviceToken !== null) {
        console.log("userDeviceToken: ", fetchuserDeviceToken);
        setUserDeviceToken(fetchuserDeviceToken);
      }
      
    } catch (error) {
      console.log("Error retrieving item", error);
    }
  }

  const saveLastTab = async (tabName: string) => {
    try {
      await AsyncStorage.setItem('createType', tabName);
      console.log(`Tab **${tabName}** saved to AsyncStorage.`);
    } catch (error) {
      console.error('Error saving tab name:', error);
    }
  };

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
          const assetUri = await compressImage(asset.uri);
          const fileSize = asset.fileSize || 0;
          const fileName = asset.fileName || 'image.jpg';

          if (fileSize > 0 && !validateFileSize(fileSize, fileName, 'image')) {
            invalidFiles.push(`${fileName} (${formatFileSize(fileSize)})`);
            // Don't add to validAssets, validation already showed error
          } else {
            validAssets.push({
              uri: assetUri,
              name: fileName,
              type: asset.mimeType || 'image/jpeg',
              size: fileSize,
            });
          }
        }

        // Only show bulk error if multiple files and some were invalid
        if (invalidFiles.length > 1) {
          showCustomAlert(
            'warning',
            'Multiple Files Too Large',
            `${invalidFiles.length} images exceed the ${FILE_SIZE_LIMIT_MB}MB limit:\n\n${invalidFiles.join('\n')}\n\n💡 Please compress or choose smaller images.`,
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

  // **ENHANCED: Pick video with detailed validation**
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
      return handleVideoMediaSelection(asset);
    }
  } catch (error) {
    const errorDetails = getErrorDetails(error, 'video');
    showCustomAlert('error', errorDetails.title, errorDetails.message, [
      { text: 'OK', onPress: hideModal }
    ], errorDetails.icon);
  }
};

// Assuming this is inside a function that handles selecting and processing media
const handleVideoMediaSelection = async (asset) => { // <<< MUST BE ASYNC
  // 1. Await the compression result
  // The 'assetUri' is now the actual local file path (a string), not a Promise.
  const assetUri = await compressAndGetUrl(asset.uri);
  const fileSize = asset.fileSize || 0;
      const fileName = asset.fileName || 'video.mp4';

      console.log(`📹 Selected video: ${fileName}, Size: ${formatFileSize(fileSize)}`);

      if (!validateFileSize(fileSize, fileName, 'video')) {
        return;
      }

      // **NEW: Warn about large files that may take time to upload**
      const fileSizeMB = fileSize / (1024 * 1024);
      if (fileSizeMB > 100) {
        showCustomAlert(
          'warning',
          'Large Video Selected',
          `This video is ${formatFileSize(fileSize)}. Uploading may take several minutes depending on your internet connection.\n\n💡 Tip: For faster uploads, compress the video before uploading.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: hideModal
            },
            {
              text: 'Continue Anyway',
              onPress: () => {
                hideModal();
                setSelectedMedia((curr) => [...curr, {
                  uri: assetUri,
                  name: fileName,
                  type: asset.mimeType || 'video/mp4',
                  size: fileSize,
                }]);
                console.log(`✅ Video added successfully: ${fileName}`);
              }
            }
          ],
          'time-outline'
        );
        return;
      } else {
        setSelectedMedia((curr) => [...curr, {
          uri: assetUri,
          name: fileName,
          type: asset.mimeType || 'video/mp4',
          size: fileSize,
        }]);
        
        console.log(`✅ Video added successfully: ${fileName}`);
      }

  
};

//Compress Video
const compressAndGetUrl = async (localUri) => {
  setUploadProgress(true);
  try {
    const compressedUri = await Video.compress(
      localUri,
      {
        compressionMethod: 'manual', //auto
        maxHeight: 854, // Target 480p/540p resolution
        maxWidth: 480,
        bitrate: 1500000, // Very low 1.5 Mbps
      }as any,
      (progress) => {
        console.log('Compression Progress:', progress);
      }
    );

    // After compression, you would typically upload 'compressedUri' to your server
    // to get the public URL for playback.
    // For example: const finalUrl = await uploadToServer(compressedUri);

    console.log(`Compression successful.`);

    return compressedUri; // Return the compressed local URI for testing/upload
  } catch (error) {
    console.error('Video Compression Error:', error);
    return localUri; // Return original if compression fails
  } finally {
    setUploadProgress(false);
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

        console.log(`📄 Selected document: ${fileName}, Size: ${formatFileSize(fileSize)}`);

        if (!validateFileSize(fileSize, fileName, 'document')) {
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
        
        console.log(`✅ Document added successfully: ${fileName}`);
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
  // **UPDATED: Upload function using presigned URL**
  // Add this enhanced version with progress tracking
  const uploadMediaFile = async (file: SelectedMedia): Promise<string> => {
  if (Platform.OS === "web") {
    throw new Error("File upload not supported on web platform");
  }

  console.log("📤 Uploading file:", file.name, "Size:", formatFileSize(file.size || 0));
  
  try {
    // Step 1: Get presigned URL
    console.log("🔗 Requesting presigned URL for:", file.name);
    
    const fileExtension = file.name.split('.').pop() || 
                        file.type.split('/').pop() || 
                        'png';
    
    const requestBody = {
      fileName: file.name,
      fileType: fileExtension
    };

    const presignedResponse = await fetch(
      'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/upload-file-using-presignedUrl',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!presignedResponse.ok) {
      const errText = await presignedResponse.text();
      console.error("❌ Presigned URL request failed:", presignedResponse.status, errText);
      throw new Error(`Failed to get upload URL: ${presignedResponse.status}`);
    }

    const presignedData = await presignedResponse.json();
    console.log("✅ Presigned URL received for:", file.name);

    const uploadUrl = presignedData.uploadUrl || presignedData.url;
    
    if (!uploadUrl) {
      throw new Error("Server did not return a valid upload URL");
    }

    // Step 2: Upload to S3
    console.log("🚀 Uploading to S3:", file.name);

    const uploadResult = await uploadAsync(uploadUrl, file.uri, {
      httpMethod: 'PUT',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': file.type,
      },
    });

    console.log("📊 Upload result for", file.name, "- Status:", uploadResult.status);

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      const finalUrl = uploadUrl.split('?')[0];
      console.log("✅ Upload successful:", file.name, "URL:", finalUrl);
      return finalUrl;
    } else {
      console.error("❌ S3 upload failed:", uploadResult.status, uploadResult.body);
      throw new Error(`Upload failed with status ${uploadResult.status}`);
    }

  } catch (e: any) {
    console.error("❌ Upload error for", file.name, ":", e);
    throw e;
  }
};

  const fetchUserData = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if(fetchuserID === "") {
        fetchuserID = await AsyncStorage.getItem('userId') || "";
        setUserId(fetchuserID);
      }

      if (fetchuserID) {
        console.log('🔄 Fetching following list for user:', fetchuserID);
        
        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(sentinelUsersRef, where('userID', '==', fetchuserID));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            setCurrentUserDocId(userDoc.id);
            console.log('✅ Current user doc updated');
          } else {
            console.log('📱 No user document found');
            setCurrentUserDocId('');
          }
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching following list:', error);
      setCurrentUserDocId('');
    }
  }, [userId]);

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

  try {
    // ✅ PARALLEL UPLOAD: Upload all files at once
    const uploadPromises = selectedMedia.map(async (asset, index) => {
      console.log(`📤 Starting upload ${index + 1}/${selectedMedia.length}: ${asset.name}`);
      
      try {
        if (!asset.uri.startsWith("http")) {
          const url = await uploadMediaFile(asset);
          if (url && url.trim() !== '') {
            console.log(`✅ Uploaded ${index + 1}/${selectedMedia.length}`);
            return { success: true, url, fileName: asset.name };
          }
        } else {
          return { success: true, url: asset.uri, fileName: asset.name };
        }
        return { success: false, fileName: asset.name };
      } catch (uploadError) {
        console.error(`❌ Failed to upload ${asset.name}:`, uploadError);
        return { success: false, error: uploadError, fileName: asset.name };
      }
    });

    console.log(`⏳ Uploading ${uploadPromises.length} files in parallel...`);
    const results = await Promise.allSettled(uploadPromises);

    // Separate successful and failed uploads
    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.success) {
        uploadedUrls.push(result.value.url);
      } else {
        const fileName = result.status === 'fulfilled' 
          ? result.value?.fileName 
          : selectedMedia[index]?.name || `File ${index + 1}`;
        failedUploads.push(fileName);
      }
    });

    console.log(`✅ ${uploadedUrls.length} succeeded, ${failedUploads.length} failed`);

    if (uploadedUrls.length === 0 && failedUploads.length > 0) {
      showCustomAlert(
        'error',
        'All Uploads Failed',
        `Failed to upload all files. Please check your connection.`,
        [{ text: 'OK', onPress: hideModal }],
        'cloud-offline-outline'
      );
      return;
    }

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
  // **NEW: Generate thumbnail for video posts**
    const generateThumbnail = async (videoUrl: string): Promise<string | null> => {
      try {
        console.log('🖼️ Generating thumbnail for video:', videoUrl);

        const response = await fetch(
          'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/create-thumbnail-pic',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoUrl }),
          }
        );

        if (!response.ok) {
          console.warn('⚠️ Thumbnail API returned error:', response.status);
          return null;
        }

        const data = await response.json();

        if (data?.thumbnailUrl) {
          console.log('✅ Thumbnail generated:', data.thumbnailUrl);
          return data.thumbnailUrl;
        }

        return null;
      } catch (error) {
        console.error('❌ Thumbnail generation failed:', error);
        return null; // Non-blocking: post will still be created without thumbnail
      }
    };



  // **NEW: Separated post creation**
 const createPost = async (uploadedUrls: string[], failedUploads: string[]) => {
  try {
    const hasVideo = uploadedUrls.some(url => getMediaType(url) === 'video');

    // Generate thumbnail if post contains a video
    let videoThumbnailUrl: string | null = null;
    if (hasVideo) {
      const videoUrl = uploadedUrls.find(url => getMediaType(url) === 'video');
      if (videoUrl) {
        videoThumbnailUrl = await generateThumbnail(videoUrl);
      }
    }

    let isContentApproved = false;
    let isPostRelevant = true;  // ✅ FIX: Declare at outer scope
    let isFlagged = false;
    let moderationResult: any = null;

    if (hasVideo) {
      console.log("📹 Video content detected - Skipping AI moderation, flagging for manual admin review");
      isContentApproved = false;
      isFlagged = true;
      moderationResult = {
        postStatus: 'pending_manual_review',
        flagged: true,
        violations: ['video content requires manual review'],
        categories: { video_content: true },
        checkedAt: new Date(),
        videoSkipped: true
      };

      // Save video post to Firestore
      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
        AuthorName: userName,
        AuthorNickName: userNickName,
        AuthorEmail: userEmail,
        AuthorUserID: userId,
        ContentDate: new Date(),
        ContentDesc: postText,
        ContentURL: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        ContentURLs: uploadedUrls,
        ContentLikeCount: 0,
        ContentRepostCount: 0,
        CommentTemplate: "Standard Template",
        isApproved: false,
        isLiked: false,
        isNew: true,
        isAnonymous: isAnonymous,
        contentType: selectedType,
        isEducational: isEducationalEnabled,
        thumbnailUrl: videoThumbnailUrl,
        moderationData: {
          flagged: true,
          violations: ['video content requires manual review'],
          categories: { video_content: true },
          checkedAt: new Date(),
          videoSkipped: true,
          requiresManualReview: true
        }
      });

    } else {
      // No video — proceed with AI moderation
      console.log("✅ No video detected - Proceeding with AI moderation");

      const nonVideoUrl = uploadedUrls.find(url => {
        const mediaType = getMediaType(url);
        return mediaType === 'image' || mediaType === 'gif' || mediaType === 'doc';
      }) || null;

      console.log("📹 Filtered media for moderation:", nonVideoUrl ? "Using non-video media" : "Only text will be checked");

      moderationResult = await checkPostContent(postText, nonVideoUrl);
      console.log("🤖 AI Moderation Result:", moderationResult);
      console.log("🚦 Post status:", moderationResult.postStatus);

      isContentApproved = moderationResult.postStatus === 'approved';
      isFlagged = moderationResult.flagged;

      let generatedTemplateName = "Standard Template";

      if (isContentApproved) {
        try {
          const response = await fetch(
            'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/opinion-generator-ai',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postText, uploadedUrls })
            }
          );
          const templateResponse: TemplateResponseType = await response.json();
          if (templateResponse?.success) {
            generatedTemplateName = templateResponse.templateName || "Standard Template";
            // Save approved post
            await addDoc(collection(db, 'SentinelPosts'), {
              AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
              AuthorName: userName,
              AuthorNickName: userNickName,
              AuthorEmail: userEmail,
              AuthorUserID: userId,
              ContentDate: new Date(),
              ContentDesc: postText,
              ContentURL: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
              ContentURLs: uploadedUrls,
              ContentLikeCount: 0,
              ContentRepostCount: 0,
              CommentTemplate: generatedTemplateName,
              isApproved: isContentApproved,
              isLiked: false,
              isNew: !isContentApproved,
              isAnonymous: isAnonymous,
              contentType: selectedType,
              isEducational: isEducationalEnabled,
              thumbnailUrl: videoThumbnailUrl || null,
              moderationData: {
                flagged: isFlagged,
                violations: moderationResult?.violations || [],
                categories: moderationResult?.categories || {},
                checkedAt: new Date(),
                videoSkipped: hasVideo,
                requiresManualReview: hasVideo || isFlagged
              }
            });
          } else {
            // ✅ FIX: Template API returned failure — mark as irrelevant and SAVE to Firestore
            isPostRelevant = false;
            await addDoc(collection(db, 'SentinelPosts'), {
              AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
              AuthorName: userName,
              AuthorNickName: userNickName,
              AuthorEmail: userEmail,
              AuthorUserID: userId,
              ContentDate: new Date(),
              ContentDesc: postText,
              ContentURL: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
              ContentURLs: uploadedUrls,
              ContentLikeCount: 0,
              ContentRepostCount: 0,
              CommentTemplate: generatedTemplateName,
              isApproved: false,
              isLiked: false,
              isNew: true,
              isAnonymous: isAnonymous,
              contentType: selectedType,
              isEducational: isEducationalEnabled,
              thumbnailUrl: videoThumbnailUrl || null,
              moderationData: {
                flagged: true,
                violations: ['Irrelevant content or media detected'],
                categories: { irrelevant_content: true },
                checkedAt: new Date(),
                videoSkipped: hasVideo,
                requiresManualReview: true
              }
            });
          }
        } catch (error) {
          console.error("❌ Error generating comment template:", error);
        }
      } else {
        // ✅ FIX: Post flagged by AI — MUST save to Firestore for Admin review & MyPosts
        console.log("Skipping template generation - Post flagged by AI");
        await addDoc(collection(db, 'SentinelPosts'), {
          AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
          AuthorName: userName,
          AuthorNickName: userNickName,
          AuthorUserID: userId,
          ContentDate: new Date(),
          ContentDesc: postText,
          ContentURL: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
          ContentURLs: uploadedUrls,
          ContentLikeCount: 0,
          ContentRepostCount: 0,
          CommentTemplate: generatedTemplateName,
          isApproved: false,
          isLiked: false,
          isNew: true,  // Marks it as pending review for Admin page
          isAnonymous: isAnonymous,
          contentType: selectedType,
          isEducational: isEducationalEnabled,
          thumbnailUrl: videoThumbnailUrl || null,
          moderationData: {
            flagged: true,
            violations: moderationResult?.violations || [],
            categories: moderationResult?.categories || {},
            checkedAt: new Date(),
            videoSkipped: false,
            requiresManualReview: true
          }
        });
      }
    }

    console.log("Using comment template: Standard Template");
    console.log("Post saved with status:", isContentApproved ? "Approved - Published" : hasVideo ? "Video - Pending Manual Review" : "Flagged - Pending Review");

    setPostText('');
    setSelectedMedia([]);

    // ✅ ALL notification and success message logic below — unchanged from your current code
    let successTitle = '';
    let successMessage = '';
    let notificationDescription = '';
    let notificationStatus = '';

    if (isContentApproved && isPostRelevant) {
      successTitle = 'Post Published!';
      successMessage = 'Your post has been published successfully!';
      notificationDescription = '🎉 Great news! Your post has been reviewed by our AI moderator and published successfully. Your community can now see it!';
      notificationStatus = 'approved';

    } else if (isContentApproved && !isPostRelevant) {
      successTitle = 'Post Submitted!';
      successMessage = 'Your post was flagged as potentially irrelevant. It will be reviewed by our team.';
      notificationDescription = '⚠️ Your post was submitted but our AI moderator flagged it as potentially irrelevant to the community. An admin will manually review it shortly. Reason: Irrelevant content or media detected.';
      notificationStatus = 'pending';

    } else if (hasVideo) {
      successTitle = 'Post Submitted!';
      successMessage = 'Your video post has been submitted successfully! Video content requires manual admin review before publishing.';
      notificationDescription = '🎥 Your video post has been submitted and is pending review. Video content is always reviewed manually by our admin before publishing, to ensure quality and safety.';
      notificationStatus = 'video_review_pending';

    } else {
      successTitle = 'Post Submitted!';
      successMessage = 'Post submitted successfully! Kindly await admin review.';
      notificationDescription = `⏳ Your post has been submitted but flagged by our AI content moderator. An admin will manually review it shortly. Reason(s): ${moderationResult?.violations?.join(', ') || 'Content policy check failed'}.`;
      notificationStatus = 'pending';
    }

    if (uploadedUrls.length > 0) successMessage += `\n\n✅ ${uploadedUrls.length} file(s) uploaded successfully`;
    if (failedUploads.length > 0) successMessage += `\n⚠️ ${failedUploads.length} file(s) couldn't be uploaded due to size/connection issues`;

    showCustomAlert('success', successTitle, successMessage, [{
      text: 'Continue',
      onPress: () => { hideModal(); setTimeout(() => router.back(), 500); }
    }], 'checkmark-circle');

    // Step 8: Create Notification — original, untouched
    if (currentUserDocId) {
      const userRef = doc(db, "SentinelUsers", currentUserDocId);
      await updateDoc(userRef, {
        Notification: arrayUnion({
          AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
          AuthorName: userName,
          AuthorUserID: await AsyncStorage.getItem('userId'),
          ContentDate: new Date(),
          Description: notificationDescription,
          NotifyType: (isContentApproved && isPostRelevant)
            ? 'post_approved'
            : hasVideo
            ? 'post_pending'
            : 'post_pending',
          ShowButtons: false,
          Status: notificationStatus,
          isRead: false,
          isApproved: isContentApproved,
        }),
      });
      console.log(isContentApproved ? 'Published' : hasVideo ? 'Video submitted for manual review' : 'Submitted for review', 'post');
      if (userDeviceToken) {
        // notifyUser(userDeviceToken, "Post Status", isContentApproved ? 'Published' : hasVideo ? 'Video submitted for manual review' : 'Submitted for review');
        sendPushNotification(userDeviceToken, "Post Status", isContentApproved ? 'Published' : hasVideo ? 'Video submitted for manual review' : 'Submitted for review');
      }
    } else {
      await addDoc(collection(db, 'SentinelUsers'), {
        userID: await AsyncStorage.getItem('userId'),
        Notification: [{
          AuthorImageURL: userImage || "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg",
          AuthorName: userName,
          AuthorUserID: await AsyncStorage.getItem('userId'),
          ContentDate: new Date(),
          Description: notificationDescription,
          NotifyType: hasVideo ? 'video_post_submitted' : 'post_submitted',
          ShowButtons: false,
          Status: notificationStatus,
          isRead: false,
          isApproved: isContentApproved,
        }]
      });
      console.log('Created new user document and notification');

      if (userDeviceToken) {
        // notifyUser(userDeviceToken, "Post Status", isContentApproved ? 'Published' : hasVideo ? 'Video submitted for manual review' : 'Submitted for review');
        sendPushNotification(userDeviceToken, "Post Status", isContentApproved ? 'Published' : hasVideo ? 'Video submitted for manual review' : 'Submitted for review');
      }
    }

  } catch (e) {
    console.error("❌ Error creating post:", e);
    showCustomAlert('error', 'Post Creation Failed',
      'Failed to save your post to the server. Please check your internet connection and try again.',
      [{ text: 'OK', onPress: hideModal }], 'cloud-offline-outline');
  }
};

// Helper function remains the same - not called for video posts
const checkPostContent = async (postText: string, imageUrl: string | null) => {
  try {
    console.log('🔍 Checking content with AI moderation...');
    console.log('📝 Text:', postText ? 'Present' : 'Empty');
    console.log('🖼️ Image URL:', imageUrl ? 'Present (non-video)' : 'None');
    
    const response = await fetch(
      'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/ai-based-post-analysis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postText: postText,
          imageUrl: imageUrl
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Moderation check complete:', data);
    
    return {
      postStatus: data.postStatus, // "approved" or "inappropriate"
      flagged: data.flagged,
      violations: data.violations || [],
      categories: data.categories || {}
    };
  } catch (error) {
    console.error('❌ Error checking post content:', error);
    // Fallback: if API fails, flag for manual review for safety
    return {
      postStatus: 'inappropriate',
      flagged: true,
      violations: ['api_error'],
      categories: {}
    };
  }
};



  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(() => {
    getItem();
  })
  const goBack = useCallback(() => router.back(), [router]);

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

            {/* 2. MIDDLE/RIGHT ITEMS: Group Toggle and Close Button together */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* The Educational Toggle (Switch + Text) */}
              <View style={styles.container}> 
                <Text style={[styles.statusText, { marginRight: 4 }]}> 
                  Learn 
                </Text>
                <Switch
                  value={isEducationalEnabled}
                  onValueChange={toggleSwitch}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isEducationalEnabled ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  // --- 💡 This is the key change to decrease size ---
                  style={{ 
                    transform: [
                      { scaleX: scaleFactor }, // Scale horizontally
                      { scaleY: scaleFactor }  // Scale vertically
                    ],
                    // Note: On Android, you might need to adjust margin 
                    // after scaling to align it correctly, but start without it.
                  }}
                  // ----------------------------------------------------
                />
              </View>

              {/* Spacer (Optional, adjust as needed) */}
              <View style={{ width: 10 }} />

                {/* The Close Button */}
                <TouchableOpacity 
                  onPress={goBack}
                  style={{
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 6,
                    // Padding/Margin adjustment might be needed to align with other elements
                  }}
                >
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
              <View style={{ flexDirection: "row", alignItems: "flex-start", paddingTop: 10, paddingLeft: 16, paddingRight: 16, paddingBottom: 5 }}>
                <Image
                  source={{ uri: userImage || 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg' }}
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
                  <View style={{
                    // minHeight: 50,
                    // maxHeight: 280,
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    marginBottom: 2,
                    // justifyContent: "flex-start",
                    // overflow: 'hidden'
                  }}>
                    <TextInput
                      multiline
                      scrollEnabled={true}
                      // maxLength={MAX_CHARACTERS}
                      value={postText}
                      onChangeText={setPostText}
                      onContentSizeChange={(e) => {
                        // setInputHeight(Math.min(280, Math.max(50, e.nativmeEvent.contentSize.height)));
                        setInputHeight(e.nativeEvent.contentSize.height);
                      }}
                      style={{
                        // height: inputHeight,
                        // height: Math.max(50, inputHeight),
                        minHeight: 60,
                        maxHeight: 180,
                        fontSize: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 2,
                        color: "#333",
                        backgroundColor: "#fff",
                        borderRadius: 18,
                        textAlignVertical: "top",
                        textAlign: "left",
                        // lineHeight: 26,
                      }}
                      placeholder="Type your message here..."
                      placeholderTextColor="#B7BAC3"
                    />
                  </View>
                  <Text style={{
                    fontSize: 11,
                    color: postText.length >= MAX_CHARACTERS ? "#f44336" : "#A1A1AA",
                    marginLeft: 8,
                    marginTop: 2
                  }}>
                    {postText.length}/{MAX_CHARACTERS} characters
                  </Text>
                </View>
              </View>

              {/* Upload Progress Indicator - Add this in your render method */}
              {loading && selectedMedia.length > 0 && (
                <View style={{
                  position: 'absolute',
                  bottom: 100,
                  left: 16,
                  right: 16,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  paddingTop: 5, paddingLeft: 16, paddingRight: 16, paddingBottom: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                    <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#333' }}>
                      Uploading {selectedMedia.length} file(s)...
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Please wait while your media is being uploaded
                  </Text>
                </View>
              )}


            {/* Upload Progress Indicator - Add this in your render method */}
              {loading && selectedMedia.length > 0 && (
                <View style={{
                  position: 'absolute',
                  bottom: 100,
                  left: 16,
                  right: 16,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                    <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#333' }}>
                      Uploading {selectedMedia.length} file(s)...
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Please wait while your media is being uploaded
                  </Text>
                </View>
              )}


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
                            textAlign: "center",
                            paddingHorizontal: 8
                          }} numberOfLines={2}>
                            {obj.name}
                          </Text>
                          {obj.size && (
                            <Text style={{ 
                              fontSize: 10, 
                              color: "#666", 
                              textAlign: "center",
                              marginTop: 4
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
              <View 
                style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  // 👇 ADDED: Pushes content to the edges
                  justifyContent: "space-between", 
                  width: "100%" // Ensure the parent View takes full width
                }}
              >
                <View style={styles.anonymousOptionContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                  >
                    {/* 💡 Renders a checkmark if isAnonymous is true */}
                    {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsAnonymous(!isAnonymous)} >
                    <Text style={styles.anonymousText}>Post anonymously</Text>
                  </TouchableOpacity>
                  
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
                  <TouchableOpacity
                    style={{ 
                      width: 24, 
                      height: 24, 
                      alignItems: "center", 
                      justifyContent: "center", 
                      marginRight: 10 
                    }}
                    onPress={pickImages}
                  >  
                    <Ionicons name="images-sharp" size={20} color="#666" />
                  </TouchableOpacity>

                  {/* <TouchableOpacity
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
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={{ 
                      width: 24, 
                      height: 24, 
                      alignItems: "center", 
                      justifyContent: "center", 
                      marginRight: 10 
                    }}
                    onPress={pickVideo}
                  >
                  <Ionicons name="videocam" size={20} color="#666" />
                  </TouchableOpacity>

                  {(loading || uploadProgress) && (
                  <View style={{ 
                    backgroundColor: "#f0f0f0", 
                    borderRadius: 20, 
                    padding: 8, 
                  }}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  </View>
                  )}

                </View>
              </View>
              
            </View>

            {/* Plus icon and suggested images row */}
            {/* <View style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              paddingHorizontal: 16, 
              paddingBottom: 16,
              marginTop: 10, 
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
            </View> */}

            {/* // The key to the horizontal layout is flex-row */}
            {isEducationalEnabled === false && (
              <View className="flex-row justify-around items-center w-full mt-4 mb-4">
                {options.map((option) => (
                  <RadioButton
                    key={option}
                    label={option}
                    selected={selectedType === option}
                    onSelect={setSelectedType}
                  />
                ))}
              </View>
            )}

            {/* Post Now Button */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#E6161A",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: loading ? 0.5 : 1,
                }}
                disabled={loading}
                onPress={handlePostNow}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                  {loading ? "Submitting..." : "Submit Now"}
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

const styles = StyleSheet.create({
  // ... existing styles ...

  anonymousOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'white',
  },
  checkmark: {
    color: 'black',
    fontSize: 10,
    fontWeight: 'bold',
  },
  anonymousText: {
    fontSize: 14,
    color: '#333',
  },
  container: { 
    flexDirection: 'row', // Make content go horizontal
    alignItems: 'center', // Align them vertically in the center
    // No need for flex: 1, padding, or justify here
    marginTop: 10,
  },
  statusText: {
    // Keep your font styles, and add a small right margin to separate it from the switch
    marginRight: 8, 
    fontSize: 14, // Smaller text size for the header row
  },
});