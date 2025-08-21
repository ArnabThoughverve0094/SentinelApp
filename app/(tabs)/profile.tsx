import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [userId, setUserId] = useState("1");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userNickName, setUserNickName] = useState("");

  // Load user data from stored tokens
  useEffect(() => {
    loadUserData();
  }, []);

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
      
      // Close modal first
      setShowAccountModal(false);
      
      // Navigate to auth page (not directly to login)
      router.replace('/(auth)');
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  };

  const handleProfileSettings = () => {
    setShowAccountModal(false);
    // Navigate to profile settings page
    // router.push('/profile/settings');
    console.log('Navigate to Profile Settings');
  };

  const handleAppSettings = () => {
    setShowAccountModal(false);
    // Navigate to app settings page
    // router.push('/settings');
    console.log('Navigate to App Settings');
  };

  const handleHelpSupport = () => {
    setShowAccountModal(false);
    // Navigate to help & support page
    // router.push('/help');
    console.log('Navigate to Help & Support');
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
            <Text className="text-xl font-bold text-gray-900 mb-2">{userName}</Text>
            <Text className="text-gray-500">@{userNickName}</Text>
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
            <TouchableOpacity className="bg-violet-500 py-4 px-6 rounded-2xl mb-4 shadow-sm">
              <Text className="text-white font-semibold text-center text-base">Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="border-2 border-gray-200 py-4 px-6 rounded-2xl bg-white">
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
                  <Text className="font-semibold text-gray-900 text-base">{userName}</Text>
                  <Text className="text-gray-500 text-sm">{userEmail}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  results: { 
    marginTop: 20, 
    width: '100%' 
  },
});