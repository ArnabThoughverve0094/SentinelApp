import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";


export default function Index(): React.JSX.Element {
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);


  const handleTermsPress = () => {
    router.push('/(auth)/termsandconditions');
  };


  const handlePrivacyPress = () => {
    router.push('/(auth)/privacypolicy');
  };


  const handleClosePress = () => {
    router.back();
  };


  return (
    <SafeAreaView className="flex-1">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <ImageBackground
        source={require("../../assets/images/redbg.png")}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Header with back button and close icon */}
        <View className="px-6 pt-10 pb-8 flex-row justify-between items-center">
          {/* <Link href="/(auth)" asChild>
            <TouchableOpacity className="w-14 h-14">
              <Ionicons name="arrow-back" size={25} color="#000000" />
            </TouchableOpacity>
          </Link> */}
          <View className="flex-1" />
          {/* Close icon on the right */}
          <TouchableOpacity 
            className="w-10 h-10 justify-center items-right"
            onPress={handleClosePress}
          >
            <Ionicons name="close" size={30} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 justify-center pt-56">
          {/* Logo positioned above welcome text */}
          <View className="items-start mb-8">
            <View className="w-14 h-14 rounded-xl bg-transparent justify-center items-center">
              <Image
                source={require("../../assets/images/new_logo.png")}
                className="w-14 h-14"
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Welcome text section */}
          <View className="mb-16">
            <Text className="text-3xl font-bold text-black mb-3 leading-tight">
              Welcome{"\n"}to IronExSafe
            </Text>
            <Text className="text-base text-black/80 leading-6">
              Connect with your community and stay updated every time,
              everywhere.
            </Text>
          </View>

          {/* Authentication buttons */}
          <View className="gap-3">
            <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/10 shadow-lg">
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-base text-gray-700 font-medium ml-3">
                Continue with Google
              </Text>
            </TouchableOpacity>


            <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/10 shadow-lg">
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text className="text-base text-gray-700 font-medium ml-3">
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="bg-red-700 py-4 px-6 rounded-xl items-center shadow-lg">
                <Text className="text-base text-white font-semibold">
                  Continue with email
                </Text>
              </TouchableOpacity>
            </Link>

            <View className="mb-8">
              <TouchableOpacity 
                className="flex-row items-start"
                onPress={() => {
                  setAgreeToTerms(!agreeToTerms);
                }}
              >
                <View className="flex-1">
                  <Text className="text-sm text-black/70 leading-5">
                    By creating an account, you agree to our{' '}
                    <Text 
                      className="text-red-700 font-medium underline" 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTermsPress();
                      }}
                    >
                      Terms & Conditions
                    </Text>
                    {' '}and{' '}
                    <Text 
                      className="text-red-700 font-medium underline" 
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePrivacyPress();
                      }}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}