import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Constants from 'expo-constants';
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
import { Link, useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginResponse = {
  message: string;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  userAttributes: {
    email: string;
    name: string;
    nickname: string;
    birthdate: string;
    country: string;
    sub: string;
    role: string;
    termsAccepted: string;
    profilePic?: string; // **ADDED: Profile picture field**
  };
  decodedClaims: any;
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
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [currentUserDocId, setCurrentUserDocId] = useState('');

  // 1. Set how notifications behave when the app is in the foreground
  // Notifications.setNotificationHandler({
  //   handleNotification: async () => ({
  //     // Your original settings:
  //     shouldShowAlert: true,
  //     shouldPlaySound: false,
  //     shouldSetBadge: false,
      
  //     // ADDED to satisfy the 'NotificationBehavior' type:
  //     shouldShowBanner: false, // You may set this to false if you don't want a banner
  //     shouldShowList: false,   // You may set this to false if you don't want it in the list
  //   }),
  // });

  // --- MAIN FUNCTION TO GET THE TOKEN ---
// async function registerForPushNotificationsAsync() {
//   let token;
//   const projectId = Constants.expoConfig?.extra?.eas?.projectId; // Get the project ID

//   if (Platform.OS === 'android') {
//     // Required on Android to create a notification channel
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: '#FF231F7C',
//     });
//   }

//   if (Device.isDevice) {
//     // 1. Request User Permission
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
    
//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       alert('Failed to get push token for push notification!');
//       return;
//     }

//     // 2. Get the Expo Push Token
//     // Pass the projectId to ensure the token is correctly attributed to your project
//     token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    
//     console.log('Expo Push Token:', token);

//   } else {
//     // Only physical devices can register for a token
//     alert('Must use physical device for Push Notifications');
//   }

//   return token;
// }

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

      const data: LoginResponse = await response.json();
      console.log('Login response:', data);
      
      if (response.ok && data.message === "Login successful" && data.tokens?.accessToken) {
        const items: [string, string][] = [];

        // Store access token (main token for API calls)
        if (data.tokens.accessToken) {
          items.push(['userToken', data.tokens.accessToken]);
          items.push(['accessToken', data.tokens.accessToken]);
          console.log('✅ Access token stored:', data.tokens.accessToken.substring(0, 50) + '...');
        }

        // Store other tokens
        if (data.tokens.refreshToken) {
          items.push(['userRefreshToken', data.tokens.refreshToken]);
          items.push(['refreshToken', data.tokens.refreshToken]);
        }
        if (data.tokens.idToken) {
          items.push(['userIdToken', data.tokens.idToken]);
          items.push(['idToken', data.tokens.idToken]);
        }

        // Store user attributes
        if (data.userAttributes.email) {
          items.push(['userEmail', data.userAttributes.email]);
        }
        if (data.userAttributes.name) {
          items.push(['userName', data.userAttributes.name]);
        }
        if (data.userAttributes.nickname) {
          items.push(['userNickName', data.userAttributes.nickname]);
        }
        if (data.userAttributes.sub) {
          items.push(['userId', data.userAttributes.sub]);
          fetchUserData(data.userAttributes.sub);
        }
        if (data.userAttributes.role) {
          items.push(['userRole', data.userAttributes.role]);
        } else {
          items.push(['userRole', 'user']);
        }

        // **FIXED: Store profile picture from login response**
        const profilePicFromResponse = data.userAttributes.profilePic || 
                                     data.decodedClaims?.['custom:profilePic'] || 
                                     null;
        
        if (profilePicFromResponse) {
          // Construct full URL if it's just a filename
          const profilePicUrl = profilePicFromResponse.startsWith('http') 
            ? profilePicFromResponse 
            : `https://sentinal-uploads.s3.us-west-2.amazonaws.com/${profilePicFromResponse}`;
          
          items.push(['profilePicUrl', profilePicUrl]);
          console.log('✅ Profile picture stored from login:', profilePicUrl);
        } else {
          console.log('ℹ️ No profile picture found in login response');
        }

        // Store additional data
        if (data.userAttributes) {
          items.push(['userData', JSON.stringify(data.userAttributes)]);
        }

        // Calculate token expiry from decoded claims
        if (data.decodedClaims?.exp) {
          const expiryTime = data.decodedClaims.exp * 1000;
          items.push(['tokenExpiry', expiryTime.toString()]);
          console.log('✅ Token expiry set:', new Date(expiryTime));
        } else {
          const expiryTime = Date.now() + (60 * 60 * 1000);
          items.push(['tokenExpiry', expiryTime.toString()]);
        }

        try {
          await AsyncStorage.multiSet(items);
          console.log('✅ Successfully stored all login data:', items.map(([k]) => k).join(', '));
        } catch (error) {
          console.error('❌ Error during multiSet:', error);
          throw new Error('Failed to save login data');
        }

        console.log('✅ Login successful, tokens saved, redirecting to tabs...');
        router.replace("/(tabs)");
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
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

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      if (userId) {
        console.log('🔄 Fetching following list for user:', userId);
        
        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(sentinelUsersRef, where('userID', '==', userId));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            
            // const userRef = doc(db, "SentinelUsers", userDoc.id);
            // await updateDoc(userRef, {
            //   deviceToken: expoPushToken,
            // });
            console.log('✅ Current user doc updated');

          } else {
            await addDoc(collection(db, 'SentinelUsers'), {
              userID: userId,
              // deviceToken: expoPushToken,
            });
            console.log('📱 No user document found');
          }
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching following list:', error);
    }
  }, []);

  // useEffect(() => {
  //   registerForPushNotificationsAsync().then(token => {
  //     setExpoPushToken(token);
  //   });
  // }, []);

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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header with back button */}
          <View className="px-6 pt-5 pb-4 flex-row items-center justify-between">
              {/* Left: Logo and Text */}
              <Link href="/(auth)" asChild>
                <TouchableOpacity className="flex-row items-center">
                  {/* Gear Icon */}
                  <View className="w-8 h-8 mr-2">
                    <Image
                      source={require("../../assets/images/new_logo.png")}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </View>
                  
                  {/* Sentinel Text */}
                  <Text className="text-2xl font-extrabold text-[#281C20]">
                    Sentinel
                  </Text>
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


          {/* Main content */}
          <View className="flex-1 px-6">
            {/* Title section */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-black mb-3 leading-tight">
                Log In to Your{'\n'}Account
              </Text>
              {/* Sign up link */}
            <View className="flex-row">
              <Text className="text-black/70">Don't have an account? </Text>
              <Link href={"/(auth)/register" as any} asChild>
                <TouchableOpacity>
                  <Text className="text-red-700 font-medium">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
              {/* <Text className="text-base text-black font-sans">
                Your community awaits
              </Text> */}
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
                  style={{ fontSize: 16, lineHeight: 20 }}
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
                {passwordError && (
                  <Text className="text-red-500 text-sm mt-1">{passwordError}</Text>
                )}
              </View>

              {/* Forgot password */}
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="mb-20">
                  <Text className="text-red-700 font-medium text-right">Forgot Password ?</Text>
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
              className={`bg-red-700 py-4 px-6  rounded-xl items-center shadow-lg mb-6 ${loading ? 'opacity-50' : ''}`}
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

          </View>
        </KeyboardAvoidingView>
      {/* </ImageBackground> */}
    </SafeAreaView>
  );
}