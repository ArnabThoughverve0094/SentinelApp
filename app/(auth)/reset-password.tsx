import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
                    : 'bg-violet-500'
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

export default function ResetPassword(): React.JSX.Element {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // Field errors state
  const [fieldErrors, setFieldErrors] = useState({
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  // Custom Alert function
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

  // Validation function - returns true if valid, false if errors found
  const validateForm = () => {
    const errors = {
      code: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Verification code validation
    if (!code.trim()) {
      errors.code = 'Verification code is required';
    } else if (!/^\d{6}$/.test(code.trim())) {
      errors.code = 'Verification code must be 6 digits';
    }

    // New password validation
    if (!newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (newPassword.trim() && confirmPassword.trim() && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return !errors.code && !errors.newPassword && !errors.confirmPassword;
  };

  // Handle input changes and clear errors when user types
  const handleCodeChange = (value: string) => {
    setCode(value);
    if (fieldErrors.code) {
      setFieldErrors(prev => ({ ...prev, code: '' }));
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (fieldErrors.newPassword) {
      setFieldErrors(prev => ({ ...prev, newPassword: '' }));
    }
    // Also clear confirm password error if passwords now match
    if (fieldErrors.confirmPassword && value === confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const onResetPassword = async () => {
    // Always validate form on button click
    const isValid = validateForm();
    
    // If validation fails, stop here (errors are already set)
    if (!isValid) {
      return;
    }

    if (!email) {
      showCustomAlert(
        'error',
        'Error',
        'Email address not found. Please go back and try again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/confirm-new-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code.trim(),
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showCustomAlert(
          'success',
          'Password Reset Successful!',
          'Your password has been reset successfully. You can now login with your new password.',
          [
            {
              text: 'Continue to Login',
              onPress: () => {
                hideModal();
                setTimeout(() => router.replace('/(auth)/email-login'), 300);
              }
            }
          ]
        );
      } else {
        // Handle API errors - show as field errors if they relate to specific fields
        if (data.message) {
          if (data.message.includes('invalid code') || data.message.includes('expired') || data.message.includes('verification')) {
            setFieldErrors(prev => ({ ...prev, code: 'Invalid or expired verification code' }));
          } else if (data.message.includes('password')) {
            setFieldErrors(prev => ({ ...prev, newPassword: 'Password does not meet requirements' }));
          } else {
            // Generic API error as modal
            showCustomAlert(
              'error',
              'Reset Failed',
              data.message,
              [
                {
                  text: 'Try Again',
                  onPress: hideModal
                }
              ]
            );
          }
        } else {
          showCustomAlert(
            'error',
            'Reset Failed',
            'Failed to reset password. Please try again.',
            [
              {
                text: 'Try Again',
                onPress: hideModal
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
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
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-lg border border-white/30">
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
            </Link>
          </View>

          {/* Main content */}
          <View className="flex-1 px-6">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-black mb-3 leading-tight">
                Reset Password
              </Text>
              <Text className="text-base text-black/80">
                Enter the verification code sent to <Text className="font-semibold">{email}</Text> and create a new password.
              </Text>
            </View>

            {/* Verification Code input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-black/90 mb-2">
                Verification Code <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                  fieldErrors.code ? 'border-red-500' : 'border-white/30'
                }`}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={handleCodeChange}
                editable={!isLoading}
              />
              {fieldErrors.code ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">{fieldErrors.code}</Text>
              ) : null}
            </View>

            {/* New Password input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-black/90 mb-2">
                New Password <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TextInput
                  className={`w-full px-4 py-3 pr-12 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                    fieldErrors.newPassword ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={newPassword}
                  onChangeText={handleNewPasswordChange}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.newPassword ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">{fieldErrors.newPassword}</Text>
              ) : null}
            </View>

            {/* Confirm Password input */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-black/90 mb-2">
                Confirm Password <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TextInput
                  className={`w-full px-4 py-3 pr-12 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">{fieldErrors.confirmPassword}</Text>
              ) : null}
            </View>
            
            {/* Reset Password Button - Always enabled except when loading */}
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl items-center shadow-lg mb-8 ${
                isLoading ? 'bg-gray-300/90' : 'bg-violet-500'
              }`}
              disabled={isLoading}
              onPress={onResetPassword}
            >
              <Text className={`text-base font-semibold ${
                isLoading ? 'text-gray-500' : 'text-white'
              }`}>
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>

            {/* Back to Login link */}
            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="mt-2 items-center">
                <Text className="text-violet-500 font-medium">Back to Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Custom Modal */}
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