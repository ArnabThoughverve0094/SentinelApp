import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function UserDetails(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  // Simple validation - only check if username is filled
  const isFormValid = username.trim() !== "";

  const handleContinue = async () => {
    setLoading(true);
    try {
      console.log("Username:", username);
      setTimeout(() => {
        router.push("/(auth)/profile-picture");
      }, 1000);
    } catch (error) {
      console.error("Submission failed:", error);
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
          <View className="flex-row items-center pt-4 pb-8 px-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView 
            className="flex-1 px-6" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="flex-1">
              {/* Title and description */}
              <View className="mb-8">
                <Text className="text-2xl font-bold text-black mb-4">
                  Enter you details
                </Text>
                <Text className="text-base text-gray-600 leading-6">
                  Input your personal details to get started.
                </Text>
              </View>

              {/* Username input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Username *
                </Text>
                <TextInput
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-base text-gray-900"
                  placeholder="@ Username"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
                
                {/* Helper text */}
                <Text className="text-xs text-gray-500 mt-2 ml-1">
                  Your username is how others will find you
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Continue Button - Fixed at bottom */}
          <View className="px-6 pb-8">
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl items-center ${
                loading || !isFormValid ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: '#8B5CF6' }}
              disabled={loading || !isFormValid}
              onPress={handleContinue}
            >
              <Text className="text-white text-base font-semibold">
                {loading ? "Processing..." : "Continue"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
