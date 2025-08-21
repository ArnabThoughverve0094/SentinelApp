import React, { useState, useRef, useEffect } from "react";
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyEmail(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string>("");
  
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
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits of the verification code.');
      return;
    }

    if (!userEmail || userEmail === "your-email@example.com") {
      Alert.alert('Error', 'Email not found. Please go back and register again.');
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
      
      Alert.alert(
        'Registration Successful!', 
        'Your account has been verified successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.push("/(auth)/email-login")
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
      
      Alert.alert(
        'Verification Failed', 
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              // Clear OTP fields and focus first input
              setOtp(["", "", "", "", "", ""]);
              otpRefs.current[0]?.focus();
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
      Alert.alert('Error', 'Email not found. Please go back and register again.');
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
      
      Alert.alert(
        'Code Sent!', 
        'A new verification code has been sent to your email address.'
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
      
      Alert.alert('Failed to Resend', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 pt-10">
          {/* Header with back button */}
          <View className="px-6 pt-4 pb-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100"
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
              {/* Title and description */}
              <View className="mb-8">
                <Text className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Verify email id
                </Text>
                <Text className="text-base text-gray-600 leading-6">
                  Enter the 6-digit verification code that we have sent to{"\n"}
                  <Text className="font-medium text-gray-900">{userEmail}</Text>
                </Text>
              </View>

              {/* OTP Input Boxes - 6 boxes in single horizontal line */}
              <View className="mb-8 px-4">
                <View className="flex-row justify-between items-center">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={ref => { otpRefs.current[index] = ref; }}
                      className={`w-12 h-14 bg-white border-2 rounded-lg text-center text-xl font-bold text-gray-900 ${
                        digit ? 'border-violet-500 bg-violet-50' : 'border-gray-300'
                      }`}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Resend code text */}
              <View className="mb-8 items-center">
                <Text className="text-sm text-gray-600 text-center mb-2">
                  Haven't got the code yet?
                </Text>
                <TouchableOpacity 
                  onPress={handleResendCode}
                  disabled={resendLoading}
                  className={resendLoading ? 'opacity-50' : ''}
                >
                  <Text className={`font-semibold text-base underline ${
                    resendLoading ? 'text-gray-400' : 'text-violet-500'
                  }`}>
                    {resendLoading ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Continue Button - Fixed at bottom */}
          <View className="px-6 pb-8">
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl items-center shadow-sm ${
                loading ? "opacity-50" : ""
              }`}
              style={{ 
                backgroundColor: isOtpComplete ? '#8B5CF6' : '#D1D5DB' 
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
    </SafeAreaView>
  );
}
