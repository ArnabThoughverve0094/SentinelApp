import React, { useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* Header with Back Button */}
        <View className="px-6 pt-10 pb-8">
          <Link href="/(auth)/email-login" asChild>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Main content */}
        <View className="flex-1 px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              Forgot Password
            </Text>
            <Text className="text-base text-gray-600">
              Enter your email address and we’ll send you a link to reset your password.
            </Text>
          </View>

          {!emailSent ? (
            <>
              {/* Email input */}
              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email address
                </Text>
                <TextInput
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-900"
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
                className={`py-4 px-6 rounded-xl items-center shadow-sm mb-8 ${
                  email.trim() ? 'bg-violet-500' : 'bg-gray-300'
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
                <Ionicons name="checkmark-circle" size={60} color="#7C3AED" />
              </View>
              <Text className="text-base text-center text-gray-700 mb-4">
                If an account with <Text className="font-semibold">{email}</Text> exists, we have sent a password reset link to your email.
              </Text>
              <Text className="text-sm text-center text-gray-400">
                Please check your inbox and follow the instructions.
              </Text>
            </View>
          )}

          {/* Go back link (only if email was sent) */}
          {emailSent && (
            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="mt-2 items-center">
                <Text className="text-violet-500 font-medium">Back to Login</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}