import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import SentinelFAQ from '../../components/SentinelFAQ';

// Toast Notification Component
interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        zIndex: 1000,
      }}
      className={`${getToastStyle()} px-6 py-4 rounded-xl shadow-lg`}
    >
      <Text className="text-white font-semibold text-center text-base">
        {message}
      </Text>
    </Animated.View>
  );
};

// Custom Modal Component with better UI
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
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  buttons,
  onClose
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
          iconName: 'checkmark-circle' as const,
          iconColor: '#22C55E',
          iconBg: 'bg-green-100',
        };
      case 'error':
        return {
          iconName: 'close-circle' as const,
          iconColor: '#EF4444',
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          iconName: 'warning' as const,
          iconColor: '#F59E0B',
          iconBg: 'bg-yellow-100',
        };
      default:
        return {
          iconName: 'information-circle' as const,
          iconColor: '#3B82F6',
          iconBg: 'bg-blue-100',
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
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <Animated.View 
          style={[{ transform: [{ scale: scaleAnim }] }]}
          className="bg-white rounded-3xl p-6 items-center w-full max-w-sm shadow-2xl"
        >
          {/* Icon */}
          <View className={`w-16 h-16 ${modalStyle.iconBg} rounded-full items-center justify-center mb-4`}>
            <Ionicons name={modalStyle.iconName} size={32} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
            {message}
          </Text>

          {/* Better Button Layout */}
          <View className="w-full space-y-3">
            {/* For image picker modal, show vertical button layout */}
            {title === 'Update Profile Picture' ? (
              <>
                {/* Camera Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-black py-4 px-6 rounded-xl shadow-sm mb-5"
                  onPress={buttons.find(b => b.text === 'Camera')?.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold text-base">Take Photo</Text>
                </TouchableOpacity>

                {/* Gallery Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-black py-4 px-6 rounded-xl shadow-sm mb-5"
                  onPress={buttons.find(b => b.text === 'Gallery')?.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold text-base">Choose from Gallery</Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-gray-200 py-4 px-6 rounded-xl"
                  onPress={buttons.find(b => b.text === 'Cancel')?.onPress}
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Default button layout for other modals */
              buttons.length === 1 ? (
                <TouchableOpacity
                  className={`py-4 px-8 rounded-xl items-center w-full shadow-lg ${
                    buttons[0].style === 'cancel' 
                      ? 'bg-gray-200' 
                      : buttons[0].style === 'destructive'
                      ? 'bg-red-500'
                      : 'bg-black'
                  }`}
                  onPress={buttons[0].onPress}
                  activeOpacity={0.8}
                >
                  <Text className={`text-lg font-semibold ${
                    buttons[0].style === 'cancel' 
                      ? 'text-gray-700' 
                      : 'text-white'
                  }`}>
                    {buttons[0].text}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row" style={{ gap: 12 }}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`flex-1 py-4 px-6 rounded-xl items-center shadow-lg ${
                        button.style === 'cancel' 
                          ? 'bg-gray-200' 
                          : button.style === 'destructive'
                          ? 'bg-red-500'
                          : 'bg-black'
                      }`}
                      onPress={button.onPress}
                      activeOpacity={0.8}
                    >
                      <Text className={`text-lg font-semibold ${
                        button.style === 'cancel' 
                          ? 'text-gray-700' 
                          : 'text-white'
                      }`}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showFAQModal, setShowFAQModal] = useState<boolean>(false);
  const [userId, setUserId] = useState("1");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userNickName, setUserNickName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success'
  });

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
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: []
  });

  // Load user data from stored tokens
  useEffect(() => {
    loadUserData();
  }, []);

  // Helper: Convert path to full URL for display
  const getFullImageUrl = (profilePath: string): string => {
    if (!profilePath) return '';
    
    // If it's already a full URL, return as is
    if (profilePath.startsWith('http')) {
      return profilePath;
    }
    
    // If it's a relative path, construct full URL
    return `https://sentinal-uploads.s3.us-west-2.amazonaws.com/${profilePath}`;
  };

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Hide toast function
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Custom Alert function
  const showCustomAlert = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      buttons
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  // Load user data function
  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data from AsyncStorage...');
      
      const [
        fetchuserID,
        fetchuserEmail,
        fetchuserName,
        fetchuserNickName,
        fetchProfilePic,
        fetchAccessToken
      ] = await AsyncStorage.multiGet([
        'userId',
        'userEmail', 
        'userName',
        'userNickName',
        'profilePicUrl',
        'userToken'
      ]);
      
      // Log what we found
      console.log('📊 AsyncStorage data loaded:');
      console.log('- userId:', fetchuserID[1] ? '✅' : '❌');
      console.log('- userEmail:', fetchuserEmail[1] ? '✅' : '❌');
      console.log('- userName:', fetchuserName[1] ? '✅' : '❌');
      console.log('- userNickName:', fetchuserNickName[1] ? '✅' : '❌');
      console.log('- profilePicUrl:', fetchProfilePic[1] ? `✅ ${fetchProfilePic[1]}` : '❌');
      console.log('- accessToken:', fetchAccessToken[1] ? '✅ Found' : '❌ Missing');
      
      if (fetchuserID[1]) {
        setUserId(fetchuserID[1]);
        console.log("✅ userId loaded:", fetchuserID[1]);
      }
      if (fetchuserEmail[1]) {
        setUserEmail(fetchuserEmail[1]);
        console.log("✅ userEmail loaded:", fetchuserEmail[1]);
      }
      if (fetchuserName[1]) {
        setUserName(fetchuserName[1]);
        console.log("✅ userName loaded:", fetchuserName[1]);
      }
      if (fetchuserNickName[1]) {
        setUserNickName(fetchuserNickName[1]);
        console.log("✅ userNickName loaded:", fetchuserNickName[1]);
      }
      if (fetchProfilePic[1]) {
        setProfilePicUrl(fetchProfilePic[1]);
        console.log("✅ profilePicUrl loaded and set:", fetchProfilePic[1]);
      }

      if (!fetchAccessToken[1]) {
        console.error('❌ No access token found before upload');
      } else {
        console.log('✅ Access token exists for API calls');
      }

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      showCustomAlert(
        'error',
        'Error',
        'Failed to load user data. Please try again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
    }
  };

  // Upload image to AWS with shorter filename
  const uploadImageFile = async (imageUri: string): Promise<string> => {
    if (Platform.OS === "web") {
      console.warn("File upload not supported on web.");
      return '';
    }

    console.log("📤 Uploading image:", imageUri);
    
    // Generate shorter filename to reduce URL length
    const timestamp = Date.now();
    const shortUserId = userId.substring(0, 8);
    const fileName = `p_${shortUserId}_${timestamp}.jpg`;
    const fileType = 'image/jpeg';

    console.log('📝 Generated filename:', fileName, `(${fileName.length} chars)`);

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: fileName,
      type: fileType,
    } as any);

    try {
      console.log("🚀 Starting upload to AWS...");
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
        console.error("❌ Upload failed with status:", res.status, "Error:", errText);
        throw new Error(`HTTP status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("✅ Upload response data:", data);
      
      if (!data.fileUrl || data.fileUrl.trim() === '') {
        throw new Error("No valid fileUrl returned from API");
      }
      
      console.log("✅ Upload successful. URL:", data.fileUrl);
      console.log("📏 URL length:", data.fileUrl.length, "characters");
      
      return data.fileUrl;
    } catch (e) {
      console.error("❌ Upload error:", e);
      throw e;
    }
  };

  // Updated updateProfilePicture function to handle 100-char limit
  const updateProfilePicture = async (imageUrl: string) => {
    try {
      console.log('🔐 Getting access token for profile update...');
      
      const accessToken = await AsyncStorage.getItem('userToken');
      
      if (!accessToken) {
        console.error('❌ No access token found in AsyncStorage');
        throw new Error('Access token not found. Please login again.');
      }

      console.log('✅ Access token found');
      console.log('🔄 Original image URL:', imageUrl);
      console.log('🔄 Original URL length:', imageUrl.length, 'characters');
      
      // Extract relative path from S3 URL to stay under 100 characters
      const baseUrl = 'https://sentinal-uploads.s3.us-west-2.amazonaws.com/';
      let profilePath = imageUrl;
      
      if (imageUrl.startsWith(baseUrl)) {
        profilePath = imageUrl.replace(baseUrl, '');
      }
      
      console.log('🔄 Shortened path for API:', profilePath);
      console.log('🔄 Path length:', profilePath.length, 'characters');
      
      // Additional check to ensure we're under 100 characters
      if (profilePath.length > 100) {
        console.warn('⚠️ Path still too long, using filename only');
        const urlParts = profilePath.split('/');
        profilePath = urlParts[urlParts.length - 1];
        console.log('🔄 Final shortened path:', profilePath);
        console.log('🔄 Final length:', profilePath.length, 'characters');
      }
      
      const response = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/update-profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: accessToken,
            profilePicUrl: profilePath
          }),
        }
      );

      console.log("📊 Profile update response status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Profile update failed:", response.status, errText);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please login again.');
        }
        
        throw new Error(`Failed to update profile: ${errText}`);
      }

      const data = await response.json();
      console.log("✅ Profile update successful:", data);

      // Store the FULL URL locally for display purposes
      setProfilePicUrl(imageUrl);
      await AsyncStorage.setItem('profilePicUrl', imageUrl);
      
      showToast('Profile picture updated successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
      showToast(errorMessage, 'error');
      
      if (errorMessage.includes('login again')) {
        setTimeout(() => {
          router.replace('/(auth)/email-login');
        }, 2000);
      }
      
      throw error;
    }
  };

  // Handle profile picture selection and upload
  const handleProfilePictureUpload = async () => {
    try {
      console.log('🔐 Pre-flight access token check...');
      
      const accessToken = await AsyncStorage.getItem('userToken');
      
      if (!accessToken) {
        console.error('❌ No access token found before upload');
        
        showCustomAlert(
          'error',
          'Authentication Required',
          'Please login again to update your profile picture.',
          [
            {
              text: 'Login',
              onPress: () => {
                hideModal();
                router.replace('/(auth)/email-login');
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: hideModal
            }
          ]
        );
        return;
      }

      console.log('✅ Access token verified before upload');

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'We need access to your photo library to update your profile picture.',
          [
            {
              text: 'OK',
              onPress: hideModal
            }
          ]
        );
        return;
      }

      // Show better image picker options
      showCustomAlert(
        'info',
        'Update Profile Picture',
        'Choose how you want to update your profile picture:',
        [
          {
            text: 'Camera',
            onPress: () => {
              hideModal();
              openCamera();
            }
          },
          {
            text: 'Gallery',
            onPress: () => {
              hideModal();
              openImagePicker();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: hideModal
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error handling profile picture upload:', error);
      showToast('Failed to start upload process', 'error');
    }
  };

  // Open camera
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'warning',
          'Permission Required',
          'We need camera access to take a photo.',
          [
            {
              text: 'OK',
              onPress: hideModal
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error opening camera:', error);
      showToast('Failed to open camera', 'error');
    }
  };

  // Open image picker
  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error opening image picker:', error);
      showToast('Failed to open gallery', 'error');
    }
  };

  // Process selected image
  const processSelectedImage = async (imageUri: string) => {
    try {
      setIsUploading(true);
      console.log("🔄 Processing selected image:", imageUri);
      
      // Double-check access token before proceeding
      const accessToken = await AsyncStorage.getItem('userToken');
      if (!accessToken) {
        throw new Error('Access token not found. Please login again.');
      }
      console.log('✅ Access token confirmed before processing');
      
      // Upload image to AWS
      console.log("📤 Starting AWS upload...");
      const uploadedUrl = await uploadImageFile(imageUri);
      
      if (uploadedUrl) {
        console.log("✅ AWS upload successful, updating profile...");
        // Update profile with new image URL
        await updateProfilePicture(uploadedUrl);
        console.log("✅ Profile update complete!");
      } else {
        throw new Error('Failed to get upload URL from AWS');
      }
      
    } catch (error) {
      console.error('❌ Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
      showToast(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 Logging out user...');
      await AsyncStorage.multiRemove([
        'userToken',
        'accessToken',
        'userRefreshToken', 
        'refreshToken',
        'userIdToken',
        'idToken',
        'userEmail',
        'userName',
        'userNickName',
        'userId',
        'userRole',
        'tokenExpiry',
        'userData',
        'profilePicUrl',
      ]);
      console.log('✅ User data cleared');
      setShowAccountModal(false);
      
      showCustomAlert(
        'success',
        'Logout Successful',
        'You have been logged out successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              hideModal();
              router.replace('/(auth)');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      showCustomAlert(
        'error',
        'Logout Failed',
        'Failed to logout. Please try again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
    }
  };

  const confirmLogout = () => {
    setShowAccountModal(false);
    showCustomAlert(
      'warning',
      'Logout Confirmation',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: hideModal
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            hideModal();
            handleLogout();
          }
        }
      ]
    );
  };

  const handleProfileSettings = () => {
    setShowAccountModal(false);
    showCustomAlert(
      'info',
      'Coming Soon',
      'Profile settings feature is under development and will be available soon.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  const handleAppSettings = () => {
    setShowAccountModal(false);
    showCustomAlert(
      'info',
      'Coming Soon',
      'App settings feature is under development and will be available soon.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  const handleHelpSupport = () => {
    setShowAccountModal(false);
    showCustomAlert(
      'info',
      'Help & Support',
      'Need help? Please contact our support team at support@sentinel.com or visit our FAQ section.',
      [
        {
          text: 'Contact Support',
          onPress: () => {
            hideModal();
            console.log('Contact support');
          }
        },
        {
          text: 'View FAQ',
          onPress: () => {
            hideModal();
            handleFAQ();
          }
        }
      ]
    );
  };

  const handleFAQ = () => {
    setShowAccountModal(false);
    setShowFAQModal(true);
  };

  const handleEditProfile = () => {
    showCustomAlert(
      'info',
      'Edit Profile',
      'Profile editing feature is coming soon! You will be able to update your profile picture, bio, and other details.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  const handleShareProfile = () => {
    showCustomAlert(
      'success',
      'Share Profile',
      'Your profile link has been copied to clipboard! You can now share it with others.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  const handleThreeDots = () => {
    showCustomAlert(
      'info',
      'Profile Options',
      'Additional profile options will be available here soon.',
      [
        {
          text: 'OK',
          onPress: hideModal
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header with improved styling */}
      <View className="bg-white px-6 py-4 flex-row items-center justify-between shadow-sm border-b border-gray-100 pt-10">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="settings-outline" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section - NEW HORIZONTAL LAYOUT */}
        <View className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100">
          <View className="px-6 py-8">
            {/* Profile Header - Horizontal Layout with Image on Left */}
            <View className="flex-row items-center mb-6">
              {/* Profile Picture - Left Side */}
              <TouchableOpacity
                onPress={handleProfilePictureUpload}
                disabled={isUploading}
                className="relative mr-4"
              >
                <View className="w-20 h-20 rounded-full overflow-hidden bg-black items-center justify-center shadow-lg">
                  {profilePicUrl ? (
                    <Image 
                      source={{ uri: getFullImageUrl(profilePicUrl) }}
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                    />
                  ) : (
                    <Ionicons name="person" size={32} color="white" />
                  )}
                  
                  {/* Loading overlay */}
                  {isUploading && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  )}
                </View>
                
                {/* Edit icon - smaller for horizontal layout */}
                <View className="absolute -bottom-1 -right-1 w-7 h-7 bg-black rounded-full items-center justify-center border-2 border-white shadow-md">
                  {isUploading ? (
                    <ActivityIndicator size={14} color="white" />
                  ) : (
                    <Ionicons name="pencil" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Name and Username - Next to Image */}
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 mb-1">
                  {userName || 'Rajesh Francis'}
                </Text>
                <Text className="text-gray-500 text-base">
                  @{userNickName || 'rajesh.francis'}
                </Text>
              </View>

              {/* Three Dots Menu - Right Side */}
              {/* <TouchableOpacity
                onPress={handleThreeDots}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center ml-2"
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
              </TouchableOpacity> */}
            </View>

            {/* Stats Section - Below Profile Header */}
            <View className="flex-row justify-around py-4 border-t border-b border-gray-100 mb-6">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">212</Text>
                <Text className="text-gray-500 text-sm mt-1">Posts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">453</Text>
                <Text className="text-gray-500 text-sm mt-1">Followers</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">245</Text>
                <Text className="text-gray-500 text-sm mt-1">Following</Text>
              </View>
            </View>

            {/* Bio Section - Below Stats */}
            <View className="mb-6">
              <Text className="text-gray-700 leading-6 text-justify">
                Welcome to my profile! I love sharing moments and connecting with amazing people. 
              Let's create something beautiful together! ✨
              </Text>
            </View>

            {/* Action Buttons - Below Bio */}
            <View className="flex-row space-x-4 mb-4">
              <TouchableOpacity 
                className="flex-1 bg-gray-900 py-4 px-6 rounded-xl mr-4"
                onPress={handleEditProfile}
              >
                <Text className="text-white font-semibold text-center text-base ">Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 border-2 border-gray-200 py-4 px-6 rounded-xl bg-white"
                onPress={handleShareProfile}
              >
                <Text className="text-gray-900 font-semibold text-center text-base">Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* My Posts Section - Below Profile Section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100">
          <View className="px-6 py-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">My Posts</Text>
            
            {/* Sample Post */}
            <View className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full overflow-hidden bg-black items-center justify-center mr-3">
                  {profilePicUrl ? (
                    <Image 
                      source={{ uri: getFullImageUrl(profilePicUrl) }}
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                    />
                  ) : (
                    <Ionicons name="person" size={20} color="white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">@{userNickName || 'rajesh.francis'}</Text>
                  <Text className="text-gray-500 text-sm">2m</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
              </View>
              
              <Text className="text-gray-900 mb-3">
                Some text will come here some text will come here some text will come here
              </Text>
              
              {/* Sample Image */}
              <View className="bg-gray-300 rounded-xl h-48 mb-4 items-center justify-center">
                <Ionicons name="image" size={40} color="#9CA3AF" />
              </View>
              
              {/* Post Actions */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-6">
                  <View className="flex-row items-center">
                    <Ionicons name="heart-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">23</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">12</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="repeat-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">31</Text>
                  </View>
                </View>
                <Ionicons name="bookmark-outline" size={18} color="#6B7280" />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Account Modal - same as before */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">Account</Text>
                <TouchableOpacity 
                  onPress={() => setShowAccountModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            <View className="px-6 pb-6">
              {/* User Info Section */}
              <View className="flex-row items-center mb-6 p-4 bg-gray-50 rounded-xl">
                <View className="w-12 h-12 rounded-full overflow-hidden bg-black items-center justify-center mr-4">
                  {profilePicUrl ? (
                    <Image 
                      source={{ uri: getFullImageUrl(profilePicUrl) }}
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                    />
                  ) : (
                    <Ionicons name="person" size={24} color="white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-base">{userName || 'User Name'}</Text>
                  <Text className="text-gray-500 text-sm">{userEmail || 'user@email.com'}</Text>
                </View>
              </View>

              {/* Menu Options */}
              <View className="space-y-2">
                <TouchableOpacity 
                  onPress={handleProfileSettings}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="person-outline" size={20} color="#3B82F6" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">Profile Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleAppSettings}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="settings-outline" size={20} color="#10B981" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">App Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleHelpSupport}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">Help & Support</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                {/* FAQ Option */}
                <TouchableOpacity 
                  onPress={handleFAQ}
                  className="flex-row items-center p-4 rounded-xl active:bg-gray-50"
                >
                  <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="help-outline" size={20} color="#8B5CF6" />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">F A Q</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                {/* Divider */}
                <View className="h-px bg-gray-200 my-2" />
                {/* Logout Button */}
                <TouchableOpacity 
                  onPress={confirmLogout}
                  className="flex-row items-center p-4 rounded-xl bg-red-50 active:bg-red-100"
                >
                  <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="flex-1 text-red-600 font-medium">Logout</Text>
                  <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen FAQ Modal */}
      <Modal
        visible={showFAQModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFAQModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          {/* FAQ Header with close icon and FAQ title */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-2xl font-bold text-black">F A Q</Text>
            <TouchableOpacity 
              onPress={() => setShowFAQModal(false)}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          {/* FAQ Content */}
          <ScrollView className="flex-1 px-5 py-6">
            {/* FAQ Title + Subtitle */}
            <SentinelFAQ showHeader={true} />
            {/* Contact Support Section */}
            <View className="mt-8 bg-violet-50 rounded-xl p-6 border border-violet-100">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Still need help?
              </Text>
              <Text className="text-sm text-gray-600 mb-4 leading-6">
                Can't find what you're looking for? Our support team is ready to assist you with any questions or concerns.
              </Text>
              <TouchableOpacity 
                className="bg-black py-3 px-6 rounded-lg items-center mb-8"
                onPress={() => {
                  showCustomAlert(
                    'info',
                    'Contact Support',
                    'You can reach our support team at support@sentinel.com or through our in-app chat feature.',
                    [
                      {
                        text: 'OK',
                        onPress: hideModal
                      }
                    ]
                  );
                }}
              >
                <Text className="text-white font-semibold text-sm">Contact Support</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
});
