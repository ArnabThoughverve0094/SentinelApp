import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  KeyboardAvoidingView, 
  Modal, 
  Platform, 
  StatusBar, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
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
                    : 'bg-black'
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


  // Validation function
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


  // Handle input changes
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
    const isValid = validateForm();
    
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
        if (data.message) {
          if (data.message.includes('invalid code') || data.message.includes('expired') || data.message.includes('verification')) {
            setFieldErrors(prev => ({ ...prev, code: 'Invalid or expired verification code' }));
          } else if (data.message.includes('password')) {
            setFieldErrors(prev => ({ ...prev, newPassword: 'Password does not meet requirements' }));
          } else {
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
  const goBack = useCallback(() => router.back(), [router]);


  return (
    <SafeAreaView className="flex-1 bg-[#ECEDEE]" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ECEDEE" />
      
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            {/* Back Button - Fixed at top */}
            <View className="px-6 pt-2 pb-4">
              <TouchableOpacity 
                onPress={goBack}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ 
                flexGrow: 1,
                paddingHorizontal: 24,
                paddingBottom: 32
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Title */}
              <Text className="text-2xl font-bold text-black mb-3">
                Reset Password
              </Text>
              
              {/* Subtitle */}
              <Text className="text-sm text-gray-600 mb-8 leading-5">
                Enter the verification code sent to <Text className="font-semibold">{email}</Text> and create a new password.
              </Text>

              {/* Verification Code Input */}
              <View className="mb-5">
                <Text className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
                  VERIFICATION CODE
                </Text>
                <View className="border-b border-gray-300">
                  <TextInput
                    className="text-base text-black py-3"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChangeText={handleCodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                </View>
                {fieldErrors.code && (
                  <Text className="text-red-500 text-xs mt-1">{fieldErrors.code}</Text>
                )}
              </View>

              {/* New Password Input */}
              <View className="mb-5">
                <Text className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
                  NEW PASSWORD
                </Text>
                <View className="border-b border-gray-300 flex-row items-center">
                  <TextInput
                    className="text-base text-black py-3 flex-1"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="ml-2"
                  >
                    <Text className="text-xs text-gray-500 uppercase">
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {fieldErrors.newPassword && (
                  <Text className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View className="mb-6">
                <Text className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
                  CONFIRM PASSWORD
                </Text>
                <View className="border-b border-gray-300 flex-row items-center">
                  <TextInput
                    className="text-base text-black py-3 flex-1"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="ml-2"
                  >
                    <Text className="text-xs text-gray-500 uppercase">
                      {showConfirmPassword ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {fieldErrors.confirmPassword && (
                  <Text className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</Text>
                )}
              </View>
              
              {/* Spacer to push buttons down */}
              <View className="flex-1 min-h-[20px]" />

              {/* Reset Password Button */}
              <TouchableOpacity
                className={`py-4 rounded-xl items-center mb-4 ${
                  isLoading ? 'bg-gray-300 opacity-50' : 'bg-black'
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

              {/* Back to Login Link */}
              <View className="items-center">
                <Link href="/(auth)/email-login" asChild>
                  <TouchableOpacity>
                    <Text className="text-black text-base underline">
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
