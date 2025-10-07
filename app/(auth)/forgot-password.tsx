import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Modal Component
interface CustomModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  buttons,
  onClose
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const getModalStyle = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-circle' as const,
          iconColor: '#22C55E',
          iconBg: 'bg-green-100',
        };
      case 'error':
        return {
          iconName: 'close-circle' as const,
          iconColor: '#EF4444',
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          iconName: 'warning' as const,
          iconColor: '#F59E0B',
          iconBg: 'bg-yellow-100',
        };
      default:
        return {
          iconName: 'information-circle' as const,
          iconColor: '#3B82F6',
          iconBg: 'bg-blue-100',
        };
    }
  };

  const modalStyle = getModalStyle();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <Animated.View 
          style={[{ transform: [{ scale: scaleAnim }] }]}
          className="bg-white rounded-3xl p-8 items-center w-full max-w-sm shadow-2xl"
        >
          {/* Icon */}
          <View className={`w-20 h-20 ${modalStyle.iconBg} rounded-full items-center justify-center mb-6`}>
            <Ionicons name={modalStyle.iconName} size={48} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            {message}
          </Text>

          {/* Buttons */}
          <View className="w-full space-y-3">
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                className={`py-4 px-8 rounded-xl items-center w-full shadow-lg ${
                  button.style === 'cancel' 
                    ? 'bg-gray-200' 
                    : button.style === 'destructive'
                    ? 'bg-red-500'
                    : 'bg-red-700'
                }`}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text className={`text-lg font-semibold ${
                  button.style === 'cancel' 
                    ? 'text-gray-700' 
                    : 'text-white'
                }`}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function ForgotPassword(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  
  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: []
  });

  // Custom Alert function (only for API success/network errors)
  const showCustomAlert = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      buttons
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  // Email validation function
  const validateEmail = (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  // Handle email input change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  // Handle email field blur
  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const onSendLink = async () => {
    // Validate email before API call
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Only show success modal - no field errors
        showCustomAlert(
          'success',
          'Verification Code Sent!',
          `A password reset code has been sent to ${email.trim().toLowerCase()}. Please check your inbox and follow the instructions.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                hideModal();
                // Navigate to reset password screen
                setTimeout(() => {
                  router.push({
                    pathname: '/(auth)/reset-password',
                    params: { email: email.trim().toLowerCase() }
                  });
                }, 300);
              }
            }
          ]
        );
      } else {
        // Handle API errors as field errors
        if (data.message) {
          if (data.message.includes('not found') || data.message.includes('does not exist')) {
            setEmailError('No account found with this email address');
          } else if (data.message.includes('rate limit') || data.message.includes('too many')) {
            setEmailError('Too many requests. Please wait a moment before trying again');
          } else {
            setEmailError(data.message);
          }
        } else {
          setEmailError('Failed to send reset code. Please try again');
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Network errors as modal (not field errors)
      let errorMessage = 'Network error. Please check your connection and try again.';
      if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      showCustomAlert(
        'error',
        'Connection Error',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: hideModal
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image */}
      {/* <ImageBackground 
        source={require('../../assets/images/page-bg.jpg')}
        className="flex-1"
        resizeMode="cover"
      > */}
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
                Enter your email address and we'll send you a verification code to reset your password.
              </Text>
            </View>

            {/* Email input with error handling */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-black/90 mb-2">
                Email address <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                  emailError ? 'border-red-500' : 'border-white/30'
                }`}
                placeholder="username@gmail.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                editable={!isLoading}
              />
              {emailError ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">{emailError}</Text>
              ) : null}
            </View>
            
            {/* Send Code Button */}
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl items-center shadow-lg mb-8 ${
                email.trim() && !emailError && !isLoading ? 'bg-red-700' : 'bg-gray-300/90'
              }`}
              disabled={!email.trim() || !!emailError || isLoading}
              onPress={onSendLink}
            >
              <Text className={`text-base font-semibold ${
                email.trim() && !emailError && !isLoading ? 'text-white' : 'text-gray-500'
              }`}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>

            {/* Back to Login link */}
            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="mt-2 items-center">
                <Text className="text-red-700 font-medium">Back to Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </KeyboardAvoidingView>
      {/* </ImageBackground> */}

      {/* Custom Modal - Only for success and network errors */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />
    </SafeAreaView>
  );
}