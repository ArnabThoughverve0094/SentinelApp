import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

export default function ProfilePicture(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Select Profile Picture",
      "Choose an option",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // No validation required - can complete with or without image
  const handleComplete = async () => {
    setLoading(true);
    try {
      console.log("Profile Image:", profileImage);
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8F9FF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center pt-4 pb-0 px-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Main content */}
          <View className="flex-1 px-6 pt-16">
            {/* Title and description */}
            <View className="mb-20">
              <Text className="text-2xl font-bold text-black mb-4">
                Enter you details
              </Text>
              <Text className="text-base text-gray-600 leading-6">
                Let the community see who you are - choose a{"\n"}profile pic.
              </Text>
            </View>

            {/* Profile Picture Section */}
            <View className="items-start">
              <TouchableOpacity 
                onPress={showImageOptions}
                className="relative"
              >
                {/* Profile Picture Circle */}
                <View 
                  className="w-40 h-40 rounded-full items-center justify-center ml-8"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    borderWidth: 3,
                    borderColor: '#F3F4F6'
                  }}
                >
                  {profileImage ? (
                    <Image 
                      source={{ uri: profileImage }}
                      className="w-full h-full rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={60} color="#D1D5DB" />
                  )}
                </View>

                {/* Edit/Add Icon */}
                <View 
                  className="absolute bottom-1 right-7 w-12 h-12 rounded-full items-center justify-center"
                  style={{ 
                    backgroundColor: '#8B5CF6',
                    borderWidth: 3,
                    borderColor: '#FFFFFF'
                  }}
                >
                  <Ionicons name="pencil" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Complete Button - No validation required */}
          <View className="px-6 pb-8">
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl items-center ${
                loading ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: '#8B5CF6' }}
              disabled={loading}
              onPress={handleComplete}
            >
              <Text className="text-white text-base font-semibold">
                {loading ? "Saving..." : "Complete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
