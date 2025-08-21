import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Data = {
  token?: {
    AccessToken?: string;
    RefreshToken?: string;
    IdToken?: string;
    ExpiresIn?: number;
  };
  userAttributes?: {
    email?: string;
    name?: string;
    nickname?: string;
    birthdate?: string;
    country?: string;
    sub?: string;
  };
};

export default function EmailLogin(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);


  // Email regex validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  // Validate form fields
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setEmailError(null);
    setPasswordError(null);
    setError(null);


    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }


    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }


    return isValid;
  };


  const handleLogin = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }


    setLoading(true);
    setError(null);


    try {
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });


      const data = await response.json();
      console.log('Login response:', data);
      
      if (response.ok && (data.message === "Login successful" || data.token?.AccessToken)) {
        // Save tokens and user data to AsyncStorage
        const now = Date.now();
        const items: [string, string][] = [];

        if (data.token?.AccessToken !== undefined && data.token?.AccessToken != null) {
          items.push(['userToken', data.token.AccessToken]);
        }
        if (data.token?.RefreshToken !== undefined && data.token?.RefreshToken != null) {
          items.push(['userRefreshToken', data.token.RefreshToken]);
        }
        if (data.token?.IdToken !== undefined && data.token?.IdToken != null) {
          items.push(['userIdToken', data.token.IdToken]);
        }
        if (data.userAttributes?.email !== undefined && data.userAttributes?.email != null) {
          items.push(['userEmail', data.userAttributes.email]);
        }
        if (data.userAttributes?.name !== undefined && data.userAttributes?.name != null) {
          items.push(['userName', data.userAttributes.name]);
        }
        if (data.userAttributes?.nickname !== undefined && data.userAttributes?.nickname != null) {
          items.push(['userNickName', data.userAttributes.nickname]);
        }
        if (data.userAttributes?.sub !== undefined && data.userAttributes?.sub != null) {
          items.push(['userId', data.userAttributes.sub]);
        }
        if (data.userAttributes?.role !== undefined && data.userAttributes?.role != null) {
          items.push(['userRole', data.userAttributes.role]);
        } else{
          items.push(['userRole', "User"]);
        }
        if (data.token?.ExpiresIn !== undefined && data.token?.ExpiresIn != null) {
          items.push(['tokenExpiry', (now + data.token.ExpiresIn * 1000).toString()]);
        }
        if (data.userAttributes !== undefined && data.userAttributes != null) {
          items.push(['userData', JSON.stringify(data.userAttributes)]);
        }

        try {
          await AsyncStorage.multiSet(items);
          console.log('Successfully stored', items.map(([k]) => k).join(', '));
        } catch (error) {
          console.error('Error during multiSet:', error);
        }

        // await AsyncStorage.multiSet([
        //   ['userToken', data.token?.AccessToken],
        //   ['userRefreshToken', data.token.RefreshToken],
        //   ['userIdToken', data.token.IdToken],
        //   ['userEmail', data.userAttributes.email],
        //   ['userName', data.userAttributes.name],
        //   ['tokenExpiry', (Date.now() + (data.token.ExpiresIn * 1000)).toString()], // Calculate expiry time
        //   ['userData', JSON.stringify(data.userAttributes)], // Store full token data if needed
        // ]);


        console.log('Login successful, tokens saved, redirecting to tabs...');
        router.replace("/(tabs)");
      } else {
        // Handle error cases
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    }


    setLoading(false);
  };


  // Clear email error when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError(null);
    }
  };


  // Clear password error when user starts typing
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError(null);
    }
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header with back button */}
          <View className="px-6 pt-10 pb-8">
            <Link href="/(auth)" asChild>
              <TouchableOpacity className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-sm border border-white/30">
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
            </Link>
          </View>


          {/* Main content */}
          <View className="flex-1 px-6">
            {/* Title section */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-black mb-3 leading-tight">
                Log In to Your{'\n'}Account
              </Text>
              <Text className="text-base text-black">
                Your community awaits
              </Text>
            </View>


            {/* Form section */}
            <View className="mb-8">
              {/* Email input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-black/80 mb-2">
                  Email <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 ${
                    emailError ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="username@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError && (
                  <Text className="text-red-500 text-sm mt-1">{emailError}</Text>
                )}
              </View>


              {/* Password input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-black/80 mb-2">
                  Password <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <TextInput
                    className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 pr-12 ${
                      passwordError ? 'border-red-500' : 'border-white/30'
                    }`}
                    placeholder="••••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-3.5"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {passwordError && (
                  <Text className="text-red-500 text-sm mt-1">{passwordError}</Text>
                )}
              </View>


              {/* Forgot password */}
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="mb-8">
                  <Text className="text-violet-500 font-medium text-right">Forgot Password ?</Text>
                </TouchableOpacity>
              </Link>
            </View>


            {/* Display error message if any */}
            {error && (
              <View className="mb-4">
                <Text className="text-red-500 text-center">{error}</Text>
              </View>
            )}


            {/* Login button with loading state */}
            <TouchableOpacity
              className={`bg-violet-500 py-4 px-6 rounded-xl items-center shadow-lg mb-6 ${loading ? 'opacity-50' : ''}`}
              disabled={loading}
              onPress={handleLogin}
            >
              <Text className="text-base text-white font-semibold">
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>


            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-black/20" />
              <Text className="px-4 text-black/70 text-sm">Or</Text>
              <View className="flex-1 h-px bg-black/20" />
            </View>


            {/* Social login buttons */}
            <View className="gap-3 mb-6">
              {/* Continue with Google */}
              <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg">
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-base text-gray-700 font-medium ml-3">Continue with Google</Text>
              </TouchableOpacity>


              {/* Continue with Apple */}
              <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg">
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="text-base text-gray-700 font-medium ml-3">Continue with Apple</Text>
              </TouchableOpacity>
            </View>


            {/* Sign up link */}
            <View className="flex-row justify-center">
              <Text className="text-black/70">Don't have an account? </Text>
              <Link href={"/(auth)/register" as any} asChild>
                <TouchableOpacity>
                  <Text className="text-violet-500 font-medium">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}
