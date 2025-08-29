import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated
} from "react-native";
import SentinelFAQ from '../../components/SentinelFAQ'; // Import your FAQ component

// Custom Modal Component
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
          className="bg-white rounded-3xl p-8 items-center w-full max-w-sm shadow-2xl"
        >
          {/* Icon */}
          <View className={`w-20 h-20 ${modalStyle.iconBg} rounded-full items-center justify-center mb-6`}>
            <Ionicons name={modalStyle.iconName} size={48} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            {message}
          </Text>

          {/* Buttons with Proper Spacing */}
          <View className="w-full">
            {buttons.length === 1 ? (
              // Single button - full width
              <TouchableOpacity
                className={`py-4 px-8 rounded-xl items-center w-full shadow-lg ${
                  buttons[0].style === 'cancel' 
                    ? 'bg-gray-200' 
                    : buttons[0].style === 'destructive'
                    ? 'bg-red-500'
                    : 'bg-violet-500'
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
              // Multiple buttons - side by side with spacing
              <View className="flex-row" style={{ gap: 12 }}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`flex-1 py-4 px-6 rounded-xl items-center shadow-lg ${
                      button.style === 'cancel' 
                        ? 'bg-gray-200' 
                        : button.style === 'destructive'
                        ? 'bg-red-500'
                        : 'bg-violet-500'
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

  const loadUserData = async () => {
    try {
      const fetchuserID = await AsyncStorage.getItem('userId');
      const fetchuserEmail = await AsyncStorage.getItem('userEmail');
      const fetchuserName = await AsyncStorage.getItem('userName');
      const fetchuserNickName = await AsyncStorage.getItem('userNickName');
      if(fetchuserID !== null) {
        console.log("userId: ", fetchuserID);
        setUserId(fetchuserID);
      }
      if(fetchuserEmail !== null) {
        console.log("userEmail: ", fetchuserEmail);
        setUserEmail(fetchuserEmail);
      }
      if(fetchuserName !== null) {
        console.log("userName: ", fetchuserName);
        setUserName(fetchuserName);
      }
      if(fetchuserNickName !== null) {
        console.log("userNickName: ", fetchuserNickName);
        setUserNickName(fetchuserNickName);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      // Clear all stored user data and tokens
      await AsyncStorage.multiRemove([
        'userToken',
        'userRefreshToken', 
        'userIdToken',
        'userEmail',
        'userName',
        'userNickName',
        'userId',
        'userRole',
        'tokenExpiry',
        'userData',
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
              // Navigate to auth page (not directly to login)
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
    console.log('Navigate to Profile Settings');
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
    console.log('Navigate to App Settings');
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
            // You can add email or phone functionality here
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
    console.log('Navigate to Help & Support');
  };

  const handleFAQ = () => {
    setShowAccountModal(false);
    setShowFAQModal(true);
    console.log('Opening FAQ');
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.results} />
      {/* Header with Account Button */}
      <View className="flex-row items-center justify-between px-5 py-4 pt-10 border-b border-gray-100">
        <Text className="text-2xl font-bold text-black">Profile</Text>
        {/* Account Settings Button */}
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="settings-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Profile content */}
      <ScrollView className="flex-1">
        {/* Profile Info Section */}
        <View className="px-5 py-6">
          {/* Profile Picture */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-violet-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">{userName || 'User Name'}</Text>
            <Text className="text-gray-500">@{userNickName || 'username'}</Text>
          </View>

          {/* Profile Stats */}
          <View className="flex-row justify-around py-6 border-t border-b border-gray-100">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">123</Text>
              <Text className="text-gray-500 text-sm">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">456</Text>
              <Text className="text-gray-500 text-sm">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">789</Text>
              <Text className="text-gray-500 text-sm">Following</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View className="py-6">
            <Text className="text-gray-900 leading-6">
              Welcome to my profile! I love sharing moments and connecting with amazing people. 
              Let's create something beautiful together! ✨
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="px-2">
            <TouchableOpacity 
              className="bg-violet-500 py-4 px-6 rounded-2xl mb-4 shadow-sm"
              onPress={handleEditProfile}
            >
              <Text className="text-white font-semibold text-center text-base">Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="border-2 border-gray-200 py-4 px-6 rounded-2xl bg-white"
              onPress={handleShareProfile}
            >
              <Text className="text-gray-900 font-semibold text-center text-base">Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Grid or List can go here */}
        <View className="px-5 py-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">My Posts</Text>
          {/* Your posts grid/list component */}
        </View>
      </ScrollView>

      {/* Account Modal */}
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
                <View className="w-12 h-12 bg-violet-500 rounded-full items-center justify-center mr-4">
                  <Ionicons name="person" size={24} color="white" />
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
                className="bg-violet-500 py-3 px-6 rounded-lg items-center mb-8"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
});
