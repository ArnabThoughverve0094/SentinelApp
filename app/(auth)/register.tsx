import React, { useState } from 'react';
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
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Country list
const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Japan',
  'Brazil',
  'South Africa'
];

export default function Register(): React.JSX.Element {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [dob, setDob] = useState<Date | null>(null);
  const [country, setCountry] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  // Country dropdown state
  const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);
  
  // Error states
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    username?: string;
    dob?: string;
    country?: string;
    terms?: string;
  }>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Nickname is required';
    }

    // DOB validation
    if (!dob) {
      newErrors.dob = 'Date of birth is required';
    }

    // Country validation
    if (!country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    // Always validate form on submit attempt
    const isValid = validateForm();
    
    if (!isValid) {
      // Show alert with first error found
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    setLoading(true);
    
    try {
      // Format data exactly as your API expects
      const registrationData = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        nickName: username.trim(), // Changed from 'username' to 'nickName'
        confirmPassword: confirmPassword.trim(), // Added confirmPassword
        dob: dob?.toISOString().split('T')[0] || '', // Format: YYYY-MM-DD
        country: country.trim(),
        termsAccepted: "true" // Send as string, not boolean
      };

      console.log('=== SENDING DATA IN EXACT API FORMAT ===');
      console.log('Registration data:', registrationData);

      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('Parsed response data:', responseData);

      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // Store email using AsyncStorage
      await AsyncStorage.setItem('userEmail', email.trim());
      console.log('Email stored in AsyncStorage:', email.trim());
      
      Alert.alert(
        'Success!',
        'Registration successful! Please check your email for verification code.',
        [
          {
            text: 'Continue',
            onPress: () => router.push("/(auth)/verify-email")
          }
        ]
      );
      
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('All fields are required')) {
        errorMessage = 'Please fill in all required fields correctly.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDob(selectedDate);
      if (errors.dob) {
        setErrors(prev => ({ ...prev, dob: undefined }));
      }
    }
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setShowCountryDropdown(false);
    if (errors.country) {
      setErrors(prev => ({ ...prev, country: undefined }));
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB');
  };

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with back button */}
        <View className="px-6 pt-4 pb-4">
          <Link href="/(auth)/email-login" asChild>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
          </Link>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Main content */}
          <View className="px-6">
            {/* Title section */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                Create new{'\n'}account
              </Text>
            </View>

            {/* Form section */}
            <View className="mb-8">
              {/* Name input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-2">Name *</Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-gray-900 ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (text.trim()) clearError('name');
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {errors.name && (
                  <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
                )}
              </View>

              {/* Email input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-2">Email *</Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="username@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (text.trim()) clearError('email');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
                )}
              </View>

              {/* Password input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-2">Password *</Text>
                <View className="relative">
                  <TextInput
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-gray-900 pr-12 ${
                      errors.password ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="••••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (text.trim()) clearError('password');
                      if (confirmPassword && text === confirmPassword) {
                        clearError('confirmPassword');
                      }
                    }}
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
                {errors.password && (
                  <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password *</Text>
                <View className="relative">
                  <TextInput
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-gray-900 pr-12 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="••••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (text.trim()) clearError('confirmPassword');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-3.5"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Nickname input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-2">Nickname *</Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-gray-900 ${
                    errors.username ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Choose a nickname"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (text.trim()) clearError('username');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.username && (
                  <Text className="text-red-500 text-xs mt-1">{errors.username}</Text>
                )}
              </View>

              {/* Date of Birth input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-2">Date of Birth *</Text>
                <TouchableOpacity
                  className={`w-full px-4 py-3 bg-white border rounded-xl flex-row items-center justify-between ${
                    errors.dob ? 'border-red-500' : 'border-gray-200'
                  }`}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className={`text-base ${dob ? 'text-gray-900' : 'text-gray-400'}`}>
                    {dob ? formatDate(dob) : 'Select date of birth'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.dob && (
                  <Text className="text-red-500 text-xs mt-1">{errors.dob}</Text>
                )}
                
                {showDatePicker && (
                  <DateTimePicker
                    value={dob || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}
              </View>

              {/* Country input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">Country *</Text>
                <TouchableOpacity
                  className={`w-full px-4 py-3 bg-white border rounded-xl flex-row items-center justify-between ${
                    errors.country ? 'border-red-500' : 'border-gray-200'
                  }`}
                  onPress={() => setShowCountryDropdown(true)}
                >
                  <Text className={`text-base ${country ? 'text-gray-900' : 'text-gray-400'}`}>
                    {country || 'Select your country'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.country && (
                  <Text className="text-red-500 text-xs mt-1">{errors.country}</Text>
                )}
              </View>

              {/* Terms & Conditions */}
              <View className="mb-8">
                <TouchableOpacity 
                  className="flex-row items-start"
                  onPress={() => {
                    setAgreeToTerms(!agreeToTerms);
                    if (!agreeToTerms) clearError('terms');
                  }}
                >
                  <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                    agreeToTerms ? 'bg-violet-500 border-violet-500' : 'border-gray-300 bg-white'
                  }`}>
                    {agreeToTerms && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600 leading-5">
                      I agree to the{' '}
                      <Text className="text-violet-500 font-medium">Terms & Conditions</Text>
                      {' '}and{' '}
                      <Text className="text-violet-500 font-medium">Privacy Policy</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
                {errors.terms && (
                  <Text className="text-red-500 text-xs mt-1">{errors.terms}</Text>
                )}
              </View>
            </View>

            {/* Sign Up button */}
            <TouchableOpacity 
              className={`py-4 px-6 rounded-xl items-center shadow-sm mb-6 ${
                loading ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: '#8B5CF6' }}
              disabled={loading}
              onPress={handleSignUp}
            >
              <Text className="text-white text-base font-semibold">
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Sign in link */}
            <View className="flex-row justify-center mb-8">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/email-login" asChild>
                <TouchableOpacity>
                  <Text className="text-violet-500 font-medium">Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>

        {/* Country Selection Modal */}
        <Modal
          visible={showCountryDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCountryDropdown(false)}
        >
          <View className="flex-1 justify-end bg-black bg-opacity-50">
            <View className="bg-white rounded-t-3xl max-h-96">
              <View className="p-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-900">Select Country</Text>
                  <TouchableOpacity onPress={() => setShowCountryDropdown(false)}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={COUNTRIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="px-4 py-3 border-b border-gray-100"
                    onPress={() => handleCountrySelect(item)}
                  >
                    <Text className="text-base text-gray-900">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
