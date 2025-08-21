import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

export default function Index(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image */}
      <ImageBackground 
        source={require('../../assets/images/page-bg.jpg')}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Main content - NO OVERLAY */}
        <View className="flex-1 px-6 justify-center pt-64">
          {/* Logo positioned above welcome text */}
          <View className="items-start mb-8">
            <View className="w-14 h-14 rounded-xl bg-transparent justify-center items-center ">
              <Image 
                source={require('../../assets/images/Sentinal-logo-big.png')}
                className="w-12 h-12"
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Welcome text section */}
          <View className="mb-16">
            <Text className="text-3xl font-bold text-black mb-3 leading-tight">
              Welcome to{'\n'}Sentinel
            </Text>
            <Text className="text-base text-black/80 leading-6">
              Connect with your community and stay updated every time, everywhere.
            </Text>
          </View>

          {/* Authentication buttons */}
          <View className="gap-3">
            <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg">
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png'}}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-base text-gray-700 font-medium ml-3">Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg">
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text className="text-base text-gray-700 font-medium ml-3">Continue with Apple</Text>
            </TouchableOpacity>

            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="bg-violet-500 py-4 px-6 rounded-xl items-center shadow-lg">
                <Text className="text-base text-white font-semibold">Continue with email</Text>
              </TouchableOpacity>
            </Link>

            <Text className="text-xs text-black/70 text-center mt-4 px-4">
              By continuing, you agree to the Sentinel's{' '}
              <Text className="text-violet-500 underline">Terms & Conditions</Text>
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
