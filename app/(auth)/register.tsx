import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
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
import { CountryPicker } from "react-native-country-codes-picker";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Modal Component
interface CustomModalProps {
  visible: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
  }>;
  onClose?: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  buttons,
  onClose,
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
      case "success":
        return {
          iconName: "checkmark-circle" as const,
          iconColor: "#22C55E",
          iconBg: "bg-green-100",
        };
      case "error":
        return {
          iconName: "close-circle" as const,
          iconColor: "#EF4444",
          iconBg: "bg-red-100",
        };
      case "warning":
        return {
          iconName: "warning" as const,
          iconColor: "#F59E0B",
          iconBg: "bg-yellow-100",
        };
      default:
        return {
          iconName: "information-circle" as const,
          iconColor: "#3B82F6",
          iconBg: "bg-blue-100",
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
          <View
            className={`w-20 h-20 ${modalStyle.iconBg} rounded-full items-center justify-center mb-6`}
          >
            <Ionicons
              name={modalStyle.iconName}
              size={48}
              color={modalStyle.iconColor}
            />
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
                  button.style === "cancel"
                    ? "bg-gray-200"
                    : button.style === "destructive"
                    ? "bg-red-500"
                    : "bg-red-700"
                }`}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-lg font-semibold ${
                    button.style === "cancel" ? "text-gray-700" : "text-white"
                  }`}
                >
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


// Simplified Password Requirements Component - Single Line
const PasswordRequirements = ({ password }: { password: string }) => {
  if (!password) return null;

  const hasMinLength = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&\*()\_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasDigits = (password.match(/\d/g) || []).length >= 3;

  const allMet = hasMinLength && hasCapital && hasSpecial && hasDigits;

  return (
    <View className="mt-2 mb-2">
      <View className="flex-row items-center">
        <Ionicons
          name={allMet ? "checkmark-circle" : "information-circle"}
          size={14}
          color={allMet ? "#10B981" : "#6B7280"}
        />
        <Text
          className={`text-xs ml-2 ${
            allMet ? "text-green-600" : "text-gray-500"
          }`}
        >
          {allMet
            ? "Password requirements met"
            : "8+ chars, 1 capital, 1 special char, 3 digits"}
        </Text>
      </View>
    </View>
  );
};

export default function Register(): React.JSX.Element {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [aboveEighteen, setAboveEighteen] = useState<boolean>(false);
  const [country, setCountry] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] =
    useState<boolean>(false);


  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: "default" | "cancel" | "destructive";
    }>;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
    buttons: [],
  });

  // Error states
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    username?: string;
    aboveEighteen?: string;
    country?: string;
    terms?: string;
  }>({});

  // Custom Alert function
  const showCustomAlert = (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: "default" | "cancel" | "destructive";
    }>
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      buttons,
    });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  // Email existence check
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(
        "https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/check-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.exists || false;
      }
      return false;
    } catch (error) {
      console.log("Error checking email:", error);
      return false;
    }
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Updated password validation with single line error message
  const validatePassword = (
    password: string
  ): { isValid: boolean; error: string } => {
    const errors: string[] = [];

    // Check all requirements
    if (password.length < 8) {
      errors.push("8+ chars");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("1 capital");
    }

    if (!/[!@#$%^&\*()\_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("1 special char");
    }

    const digitCount = (password.match(/\d/g) || []).length;
    if (digitCount < 3) {
      errors.push("3 digits");
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? `Need: ${errors.join(", ")}` : "",
    };
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    } else {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        newErrors.email = "User already exists with this email";
      }
    }

    // Enhanced password validation with single line error
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.error;
      }
    }


    // Username validation
    if (!username.trim()) {
      newErrors.username = "Nickname is required";
    }
    // Age confirmation validation
    if (!aboveEighteen) {
      newErrors.aboveEighteen = "You must confirm that you are 18 years or older";
    }
    // Country validation
    if (!country.trim()) {
      newErrors.country = "Country is required";
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = "You must agree to Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle email change with debounced email checking
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.trim()) clearError("email");

    // Clear existing timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    // Set new timeout for email check
    if (validateEmail(text)) {
      const timeout = setTimeout(async () => {
        const exists = await checkEmailExists(text);
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            email: "User already exists with this email",
          }));
        }
      }, 1000);

      setEmailCheckTimeout(timeout);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);

    // Always validate form on submit attempt
    const isValid = await validateForm();

    if (!isValid) {
      setLoading(false);
      // Don't show popup alert, just let the field errors show
      return;
    }

    try {
      // Format data exactly as your API expects
      const registrationData = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        nickName: username.trim(),
        aboveEighteen: aboveEighteen ? "true" : "false", // Default to 18 years ago
        country: country.trim(),
        termsAccepted: "true",
        role: "User",
      };


      console.log("=== SENDING DATA IN EXACT API FORMAT ===");
      console.log("Registration data:", registrationData);

      const response = await fetch(
        "https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(registrationData),
        }
      );

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response from server");
      }

      console.log("Parsed response data:", responseData);

      if (!response.ok) {
        console.error("API Error:", responseData);

        // Handle specific error messages from API - only set email error, no popup
        if (
          responseData.error === "User already exists" ||
          responseData.message?.includes("already exists")
        ) {
          setErrors((prev) => ({
            ...prev,
            email: "User already exists with this email",
          }));
          setLoading(false);
          return;
        }

        throw new Error(
          responseData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Store email using AsyncStorage
      await AsyncStorage.setItem("userEmail", email.trim());
      console.log("Email stored in AsyncStorage:", email.trim());

      showCustomAlert(
        "success",
        "Success!",
        "Registration successful! Please check your email for verification code.",
        [
          {
            text: "Continue",
            onPress: () => {
              hideModal();
              setTimeout(() => router.push("/(auth)/verify-email"), 300);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Registration failed:", error);

      // Only show popup for network errors or unexpected errors
      if (
        error.message.includes("Network") ||
        error.message.includes("Invalid response")
      ) {
        let errorMessage = "Registration failed. Please try again.";

        if (error.message.includes("Network")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        }

        showCustomAlert("error", "Registration Failed", errorMessage, [
          {
            text: "OK",
            onPress: hideModal,
          },
        ]);
      } else if (
        error.message.includes("already exists") ||
        error.message.includes("User already exists")
      ) {
        // For user exists error, just set the field error without popup
        setErrors((prev) => ({
          ...prev,
          email: "User already exists with this email",
        }));
      } else {
        // For other API errors, show popup
        showCustomAlert(
          "error",
          "Registration Failed",
          error.message || "Registration failed. Please try again.",
          [
            {
              text: "OK",
              onPress: hideModal,
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-GB");
  };

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };
  // Navigate to Terms & Conditions page
  const handleTermsPress = () => {
    router.push("/(auth)/termsandconditions");
  };

  // Navigate to Privacy Policy page
  const handlePrivacyPress = () => {
    router.push("/(auth)/privacypolicy");
  };

  const getMaximumDate = () => {
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  return maxDate;
};

const validateAge = (birthDate) => {
  if (!birthDate) {
    return "Please select your date of birth";
  }

  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) {
    return "You must be at least 18 years old";
  }

  return null; // Valid
};

const handleCountrySelect = (selectedCountry: string) => {
  setCountry(selectedCountry);
  setShowCountryDropdown(false);
  if (errors.country) {
    setErrors((prev) => ({ ...prev, country: undefined }));
  }
};



  return (
    <SafeAreaView className="flex-1">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
              source={require("../../assets/images/white-bg.png")}
              className="flex-1"
              resizeMode="cover"
            >

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header with back button */}
        <View className="px-6 pt-5 pb-4 flex-row items-center justify-between">
          {/* Left: Logo and Text */}
          <Link href="/" asChild>
              <TouchableOpacity className="flex-row items-center">
                <View className="ml-2">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 mr-0">
                      <Image
                        source={require("../../assets/images/new_logo.png")}
                        style={{ flex: 1, width: undefined, height: undefined }}
                        resizeMode="contain"
                      />
                    </View>
                    {/* Sentinel Text */}
                    <Text className="text-3xl font-extrabold text-[#281C20]">entinel</Text>
                  </View>
                  {/* Logo Icon */}
                  <Text className="text-sm text-[#281C20]">
                    Exposing Antisemitism
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>

            {/* Right: Close Button */}
            <TouchableOpacity 
                onPress={() => router.back()} 
                style={{ 
                  width: 32, 
                  height: 32, 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}
              >
                <Ionicons name="close" size={26} color="#000" />
              </TouchableOpacity>
              
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Main content */}
          <View className="px-6">
            {/* Title section */}
            <View className="mb-2">
              <Text className="text-3xl font-bold text-black mb-3 leading-tight">
                Create New {'\n'}Account
              </Text>
              {/* Sign in link */}
              <View className="flex-row mb-8">
                <Text className="text-black/70">Already have an account? </Text>
                <Link href="/(auth)/email-login" asChild>
                  <TouchableOpacity>
                    <Text className="text-red-700 font-medium">Login</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* Form section */}
            <View className="mb-8">
              {/* Name input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-black/90 mb-2">
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                    errors.name ? "border-red-500" : "border-white/30"
                  } font-sans`}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (text.trim()) clearError("name");
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={{ fontSize: 16, lineHeight: 20 }}
                />
                {errors.name && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.name}
                  </Text>
                )}
              </View>

              {/* Email input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-black/90 mb-2">
                  Email <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                    errors.email ? "border-red-500" : "border-white/30"
                  } font-sans`}
                  placeholder="username@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ fontSize: 16, lineHeight: 20 }}
                />
                {errors.email && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Password input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-black/90 mb-2">
                  Password <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <TextInput
                    className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 pr-12 shadow-lg ${
                      errors.password ? "border-red-500" : "border-white/30"
                    } font-sans`}
                    placeholder="••••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (text.trim()) clearError("password");
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ fontSize: 16, lineHeight: 20 }}
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

                {/* Password requirements display - Single line */}
                <PasswordRequirements password={password} />

                {errors.password && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Nickname input */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-black/90 mb-2">
                  Nickname <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 bg-white/95 border rounded-xl text-base text-gray-900 shadow-lg ${
                    errors.username ? "border-red-500" : "border-white/30"
                  } font-sans`}
                  placeholder="Choose a nickname"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (text.trim()) clearError("username");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ fontSize: 16, lineHeight: 20 }}
                />
                {errors.username && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.username}
                  </Text>
                )}
              </View>
              {/* Age Confirmation Checkbox - 18+ */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-black/90 mb-3">
                    Age Confirmation <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    className="flex-row items-start"
                    onPress={() => {
                      setAboveEighteen(!aboveEighteen);
                      if (!aboveEighteen) clearError("aboveEighteen");
                    }}
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                        aboveEighteen
                          ? "bg-red-700 border-red-700"
                          : "border-gray-300 bg-white"
                      } font-sans`}
                    >
                      {aboveEighteen && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-black/70 leading-5">
                        I confirm that I am 18 years of age or older
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {errors.aboveEighteen && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.aboveEighteen}
                    </Text>
                  )}
                </View>

              {/* Country input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-black/90 mb-2">
                  Country <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  className={`w-full px-4 py-3 bg-white/95 border rounded-xl flex-row items-center justify-between shadow-lg ${
                    errors.country ? "border-red-500" : "border-white/30"
                  } font-sans`}
                  onPress={() => setShowCountryDropdown(true)}
                >
                  <Text
                    className={`text-base ${
                      country ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {country || "Select your country"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.country && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.country}
                  </Text>
                )}
              </View>


              {/* Terms & Conditions with clickable links */}
              <View className="mb-8">
                <TouchableOpacity
                  className="flex-row items-start"
                  onPress={() => {
                    setAgreeToTerms(!agreeToTerms);
                    if (!agreeToTerms) clearError("terms");
                  }}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                      agreeToTerms
                        ? "bg-red-700 border-red-700"
                        : "border-gray-300 bg-white"
                    } font-sans`}
                  >
                    {agreeToTerms && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-black/70 leading-5">
                      By creating an account, you agree to our{" "}
                      <Text
                        className="text-red-700 font-medium underline"
                        onPress={handleTermsPress}
                      >
                        Terms & Conditions
                      </Text>{" "}
                      and{" "}
                      <Text
                        className="text-red-700 font-medium underline"
                        onPress={handlePrivacyPress}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
                {errors.terms && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.terms}
                  </Text>
                )}
              </View>
            </View>

            {/* Sign Up button */}
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl items-center shadow-lg mb-6 ${
                loading ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: "#E6161A" }}
              disabled={loading}
              onPress={handleSignUp}
            >
              <Text className="text-white text-base font-semibold">
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Country Selection Modal with Search */}
          <CountryPicker
            show={showCountryDropdown}
            pickerButtonOnPress={(item) => {
              handleCountrySelect(item.name.en);
            }}
            onBackdropPress={() => setShowCountryDropdown(false)}
            style={{
              modal: {
                height: 500,
                backgroundColor: 'white',
              },
              textInput: {
                height: 50,
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: '#F3F4F6',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                marginHorizontal: 16,
                marginBottom: 16,
              },
              countryButtonStyles: {
                height: 60,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              },
              dialCode: {
                display: 'none', // Hide dial codes since you only need country names
              },
              countryName: {
                fontSize: 16,
                color: '#1F2937',
              },
              flag: {
                fontSize: 24,
                marginRight: 12,
              },
            }}
            searchMessage="Search for your country..."
            lang="en"
          />


        {/* Custom Modal */}
        <CustomModal
          visible={modalConfig.visible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          buttons={modalConfig.buttons}
          onClose={hideModal}
        />
      </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}