import React, { useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPassword(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const onSendLink = () => {
    // Implement your API call here!
    setEmailSent(true);
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image */}
      <ImageBackground 
        source={require('../../assets/images/page-bg.jpg')}
        className="flex-1"
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          {/* Header with Back Button */}
          <View className="px-6 pt-16 pb-8">
            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-lg border border-white/30">
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
            </Link>
          </View>

          {/* Main content */}
          <View className="flex-1 px-6">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-black mb-3 leading-tight">
                Forgot Password
              </Text>
              <Text className="text-base text-black/80">
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </View>

            {!emailSent ? (
              <>
                {/* Email input */}
                <View className="mb-8">
                  <Text className="text-sm font-medium text-black/90 mb-2">
                    Email address
                  </Text>
                  <TextInput
                    className="w-full px-4 py-3 bg-white/95 border border-white/30 rounded-xl text-base text-gray-900 shadow-lg"
                    placeholder="username@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                
                {/* Send Link Button */}
                <TouchableOpacity
                  className={`py-4 px-6 rounded-xl items-center shadow-lg mb-8 ${
                    email.trim() ? 'bg-violet-500' : 'bg-gray-300/90'
                  }`}
                  disabled={!email.trim()}
                  onPress={onSendLink}
                >
                  <Text className={`text-base font-semibold ${
                    email.trim() ? 'text-white' : 'text-gray-500'
                  }`}>
                    Send Reset Link
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="mb-8">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 rounded-full bg-white/95 items-center justify-center shadow-lg border border-white/30">
                    <Ionicons name="checkmark-circle" size={40} color="#7C3AED" />
                  </View>
                </View>
                <Text className="text-base text-center text-black/90 mb-4">
                  If an account with <Text className="font-semibold">{email}</Text> exists, we have sent a password reset link to your email.
                </Text>
                <Text className="text-sm text-center text-black/70">
                  Please check your inbox and follow the instructions.
                </Text>
              </View>
            )}

            {/* Go back link (only if email was sent) */}
            {emailSent && (
              <Link href="/(auth)/email-login" asChild>
                <TouchableOpacity className="mt-2 items-center bg-white/95 py-3 px-6 rounded-xl shadow-lg border border-white/30">
                  <Text className="text-violet-500 font-medium">Back to Login</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}