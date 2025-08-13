import React, { useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Link ,useRouter} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EmailLogin(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('https://1k88r2xs75.execute-api.us-east-2.amazonaws.com/dev/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('Login response:', data);
    if (response.ok && (data.message === "Login successful" || data.AccessToken)) {
      console.log('Login successful, redirecting to tabs...');
      router.push("/(tabs)");
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with back button */}
        <View className="px-6 pt-4 pb-8">
          <Link href="/(auth)" asChild>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Main content */}
        <View className="flex-1 px-6">
          {/* Title section */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              Log in to your{'\n'}account
            </Text>
          </View>

          {/* Form section */}
          <View className="mb-8">
            {/* Email input */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-900"
                placeholder="username@gmail.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <View className="relative">
                <TextInput
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-900 pr-12"
                  placeholder="••••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
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
            className={`bg-violet-500 py-4 px-6 rounded-xl items-center shadow-sm mb-6 ${loading ? 'opacity-50' : ''}`}
            disabled={loading}
            onPress={handleLogin}
          >
            <Text className="text-base text-white font-semibold">
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="px-4 text-gray-500 text-sm">Or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social login buttons */}
          <View className="gap-3 mb-6">
            {/* Continue with Google */}
            <TouchableOpacity className="flex-row items-center justify-center bg-white py-4 px-6 rounded-xl border border-gray-200 shadow-sm">
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-base text-gray-700 font-medium ml-3">Continue with Google</Text>
            </TouchableOpacity>

            {/* Continue with Apple */}
            <TouchableOpacity className="flex-row items-center justify-center bg-white py-4 px-6 rounded-xl border border-gray-200 shadow-sm">
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text className="text-base text-gray-700 font-medium ml-3">Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Link href={"/(auth)/register" as any} asChild>
              <TouchableOpacity>
                <Text className="text-violet-500 font-medium">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
