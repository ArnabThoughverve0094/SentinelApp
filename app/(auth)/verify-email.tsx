import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
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

export default function VerifyEmail(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string>("");
  
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
  
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const getStoredEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        setUserEmail(storedEmail || "your-email@example.com");
        console.log('Retrieved email from storage:', storedEmail);
      } catch (error) {
        console.error('Error getting stored email:', error);
        setUserEmail("your-email@example.com");
      }
    };
    
    getStoredEmail();
  }, []);

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

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const numericValue = value.replace(/[^0-9]/g, '');
    
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto focus next input
    if (numericValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Simple validation - check if all 6 digits are filled
  const isOtpComplete = otp.every(digit => digit !== "");

  // API call to verify OTP
  const verifyOtp = async (email: string, otpCode: string) => {
    try {
      const verificationData = {
        email: email,
        code: otpCode
      };

      console.log('Sending OTP verification request:', verificationData);
      
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/confirm-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      console.log('OTP verification response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('OTP verification response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      return data;
    } catch (error) {
      console.error('OTP verification API error:', error);
      throw error;
    }
  };

  // CORRECTED: Resend OTP function - Simplified to send only email
  const resendOtp = async (email: string) => {
    try {
      console.log('=== RESEND OTP REQUEST ===');
      console.log('Sending resend request for email:', email);
      
      // **FIXED**: Send only email without any additional flags
      const resendData = {
        email: email.trim()
      };
      
      console.log('Resend request payload:', resendData);
      
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(resendData),
      });

      console.log('Resend response status:', response.status);
      
      const responseText = await response.text();
      console.log('Resend raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse resend response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('Resend response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return data;
    } catch (error) {
      console.error('Resend OTP API error:', error);
      throw error;
    }
  };

  const handleContinue = async () => {
    if (!isOtpComplete) {
      showCustomAlert(
        'warning',
        'Incomplete OTP',
        'Please enter all 6 digits of the verification code.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    if (!userEmail || userEmail === "your-email@example.com") {
      showCustomAlert(
        'error',
        'Error',
        'Email not found. Please go back and register again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const otpCode = otp.join("");
      console.log("Verifying OTP:", otpCode, "for email:", userEmail);
      
      // Call OTP verification API
      const response = await verifyOtp(userEmail, otpCode);
      
      console.log('OTP verification successful:', response);
      
      // Clear stored email after successful verification
      await AsyncStorage.removeItem('userEmail');
      
      showCustomAlert(
        'success',
        'Registration Successful!',
        'Your account has been verified successfully. You can now access all features.',
        [
          {
            text: 'Continue to Login',
            onPress: () => {
              hideModal();
              setTimeout(() => router.push("/(auth)/email-login"), 300);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      
      let errorMessage = 'Invalid verification code. Please check and try again.';
      
      if (error.message.includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Verification code not found. Please request a new one.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert(
        'error',
        'Verification Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              hideModal();
              // Clear OTP fields and focus first input
              setOtp(["", "", "", "", "", ""]);
              setTimeout(() => otpRefs.current[0]?.focus(), 100);
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // IMPROVED: Better resend handler with proper error handling
  const handleResendCode = async () => {
    if (!userEmail || userEmail === "your-email@example.com") {
      showCustomAlert(
        'error',
        'Error',
        'Email not found. Please go back and register again.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      return;
    }

    // Prevent multiple resend attempts
    if (resendLoading) {
      return;
    }

    setResendLoading(true);
    try {
      console.log("=== RESEND OTP INITIATED ===");
      console.log("Resending OTP to:", userEmail);
      
      // Call resend OTP API
      await resendOtp(userEmail);
      
      // Clear current OTP and focus first input
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      
      showCustomAlert(
        'success',
        'Code Sent!',
        'A new verification code has been sent to your email address.',
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
      
    } catch (error: any) {
      console.error("Resend OTP failed:", error);
      
      let errorMessage = 'Could not resend verification code. Please try again.';
      
      if (error.message.includes('All fields are required')) {
        errorMessage = 'There was an issue with your request. Please try registering again.';
      } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        errorMessage = 'Please wait a moment before requesting another code.';
      } else if (error.message.includes('not found') || error.message.includes('invalid')) {
        errorMessage = 'Email not found. Please register again.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert(
        'error',
        'Failed to Resend',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: hideModal
          }
        ]
      );
    } finally {
      setResendLoading(false);
    }
  };
  const goBack = useCallback(() => router.back(), [router]);

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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 pt-16">
            {/* Header with back button */}
            <View className="px-6 pt-4 pb-4">
              <TouchableOpacity 
                onPress={goBack}
                className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-lg border border-white/30"
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Scrollable content */}
            <ScrollView 
              className="flex-1 px-6" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="flex-1">
                {/* Title and description - FIXED: 2 lines max */}
                <View className="mb-8">
                  <Text className="text-3xl font-bold text-black mb-4 leading-tight">
                    Verify email id
                  </Text>
                  <Text className="text-base text-black/80 leading-6">
                    Enter the verification code that we have sent to{"\n"}
                    <Text className="font-medium text-black">{userEmail}</Text>
                  </Text>
                </View>

                {/* OTP Input Boxes - 6 boxes in single horizontal line */}
                <View className="mb-8 px-2">
                  <View className="flex-row justify-between items-center">
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={ref => { otpRefs.current[index] = ref; }}
                        className={`w-12 h-14 bg-white/95 border-2 rounded-lg text-center text-xl font-bold text-gray-900 shadow-lg ${
                          digit ? 'border-red-700 bg-violet-50/95' : 'border-white/50'
                        }`}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                </View>

                {/* Resend code text */}
                <View className="mb-8 items-center">
                  <Text className="text-sm text-black/70 text-center mb-2">
                    Haven't got the code yet?
                  </Text>
                  <TouchableOpacity 
                    onPress={handleResendCode}
                    disabled={resendLoading}
                    className={`${resendLoading ? 'opacity-50' : ''} bg-white/95 px-4 py-2 rounded-lg shadow-lg border border-white/30`}
                  >
                    <Text className={`font-semibold text-base ${
                      resendLoading ? 'text-gray-400' : 'text-red-700'
                    }`}>
                      {resendLoading ? 'Sending...' : 'Resend'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Continue Button - Fixed at bottom */}
            <View className="px-6 pb-8">
              <TouchableOpacity
                className={`py-4 px-6 rounded-xl items-center shadow-lg ${
                  loading ? "opacity-50" : ""
                }`}
                style={{ 
                  backgroundColor: isOtpComplete ? '#E6161A' : '#D1D5DB90' 
                }}
                disabled={loading || !isOtpComplete}
                onPress={handleContinue}
              >
                <Text className={`text-base font-semibold ${
                  isOtpComplete ? 'text-white' : 'text-gray-500'
                }`}>
                  {loading ? "Verifying..." : "Continue"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      {/* </ImageBackground> */}

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