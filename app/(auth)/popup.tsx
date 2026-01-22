import { db } from "@/FirebaseConfig";
import { NotificationProvider, useNotification } from "@/context/NotificationContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResponseType, TokenResponse, makeRedirectUri, useAuthRequest } from "expo-auth-session";
import * as Notifications from "expo-notifications";
import { Link, router } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { getApps, initializeApp } from 'firebase/app';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const firebaseConfig = {
  // apiKey: "AIzaSyBqIija1Tc4xntwPLuvEqvci5KEQwYd7Y0",
  apiKey: "AIzaSyAwdi3Iw2Qo5ES1BEmHR8-8adsqOO4Om4E",
  authDomain: "fanday-6370e.firebaseapp.com",
  projectId: "fanday-6370e",
  storageBucket: "fanday-6370e.firebasestorage.app",
  messagingSenderId: "822870332363",
  // appId: "1:822870332363:web:354efd0437f90b0d631c4e",
  measurementId: "G-M9PXN77EHD"
};

// Initialize Firebase
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

// Allows the browser to close after auth
WebBrowser.maybeCompleteAuthSession();

// Cognito Configuration
const clientId = "u2868f22cqiddetr6db89237d";
const cognitoDomain = "https://us-east-27yy7pjbe8.auth.us-east-2.amazoncognito.com";
const discovery = {
  authorizationEndpoint: `${cognitoDomain}/oauth2/authorize`,
  tokenEndpoint: `${cognitoDomain}/oauth2/token`,
  revocationEndpoint: `${cognitoDomain}/oauth2/revoke`,
};

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

export default function Index(): React.JSX.Element {
  const { notification, expoPushToken, error } = useNotification();
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);


  const handleTermsPress = () => {
    router.push('/(auth)/termsandconditions');
  };


  const handlePrivacyPress = () => {
    router.push('/(auth)/privacypolicy');
  };


  const handleClosePress = () => {
    router.back();
  };

  //Social Login
  const [tokens, setTokens] = useState<TokenResponse | null>(null);

  // Setup the redirect URI (this handles the "exp://" links back to your app)
  const redirectUri = makeRedirectUri({
    scheme: "frontend", // Set this in your app.json
    path: 'AuthCallback',
    preferLocalhost: true,
  });

  console.log("Redirect URI:", redirectUri);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      responseType: ResponseType.Code,
      redirectUri,
      scopes: ["openid", "profile", "email", "aws.cognito.signin.user.admin"],
      usePKCE: false,
    },
    discovery
  );

  const signOut = async () => {
    // const clientId = "u2868f22cqiddetr6db89237d";
    // const cognitoDomain = "https://us-east-27yy7pjbe8.auth.us-east-2.amazoncognito.com";
    
    // 1. Define the logout redirect (Must match AWS Console)
    const logoutUri = makeRedirectUri({
      scheme: "frontend", 
    });
  
    // 2. Construct the Logout URL
    const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  
    try {
      // 3. Open the browser to clear the Cognito session
      // This will prompt "App wants to use amazon-auth... to Sign In" 
      // (This is normal for iOS/Android OIDC logout flows)
      await WebBrowser.openAuthSessionAsync(logoutUrl, logoutUri, {preferEphemeralSession: true});
      
      // 4. Clear your local state
      // setTokens(null); 
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      // You would typically exchange the 'code' for tokens here
      console.log("Social Login Success! Code:", code);
      exchangeCodeSocialLogin(code);
    } else {
      console.log("Social Login Failed! Code: ", response);
    }

    console.log("Expo push token: ", expoPushToken);
    console.log("Expo notification: ", JSON.stringify(notification, null, 2));

  }, [response]);

  const exchangeCodeSocialLogin = async (code: string) => {
    setLoading(true);

    console.log("Exchange body: ", JSON.stringify({ code }));

    try {
      const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/exchangeCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      try {
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
        } else {
          items.push(['userNickName', ""]);
        }
        if (data.userAttributes.sub) {
          items.push(['userId', data.userAttributes.sub]);
          fetchUserData(data.userAttributes.sub);
        }
        if (data.userAttributes.role) {
          items.push(['userRole', data.userAttributes.role]);
        } else {
          items.push(['userRole', 'User']);
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
        console.error('Login failed');
      }
      } catch (error) {
        console.log('❌ Error during exchange code response:', error);
      }
      
      
    } catch (err) {
      console.error('Network error. Please try again.');
    }

    setLoading(false);
  };

  const fetchUserData = useCallback((userId: string) => {
    if (!userId) return;
  
    const sentinelUsersRef = collection(db, 'SentinelUsers');
    const q = query(sentinelUsersRef, where('userID', '==', userId));
  
    // 1. Setup the Real-time Listener
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // 2. Handle missing user (Create)
        try {
          await addDoc(collection(db, 'SentinelUsers'), {
            userID: userId,
            deviceToken: expoPushToken || '',
            createdAt: new Date()
          });
          console.log('📱 New user created');
        } catch (err) {
          console.error("Error creating user:", err);
        }
      } else {
        // 3. Handle existing user
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
  
        // Only update if the token has actually changed to avoid loops
        if (userData.deviceToken !== expoPushToken) {
          const userRef = doc(db, "SentinelUsers", userDoc.id);
          await updateDoc(userRef, { deviceToken: expoPushToken || '' });
          console.log('✅ Device token synced');
        }
      }
    }, (error) => {
      console.error('Snapshot error:', error);
    });
  
    return unsubscribe;
  }, [expoPushToken]); // Dependency on token ensures listener updates if token changes

  return (
    <NotificationProvider>
      <SafeAreaView className="flex-1">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <ImageBackground
        source={require("../../assets/images/redbg.png")}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Header with back button and close icon */}
        <View className="px-6 pt-10 pb-8 flex-row justify-between items-center">
          {/* <Link href="/(auth)" asChild>
            <TouchableOpacity className="w-14 h-14">
              <Ionicons name="arrow-back" size={25} color="#000000" />
            </TouchableOpacity>
          </Link> */}
          <View className="flex-1" />
          {/* Close icon on the right */}
          <TouchableOpacity 
            className="w-10 h-10 justify-center items-right"
            onPress={handleClosePress}
          >
            <Ionicons name="close" size={30} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 justify-center pt-56">
          {/* Logo positioned above welcome text */}
          <Link href="/" asChild>
          <TouchableOpacity className="items-start mb-8">
            <View className="w-14 h-14 rounded-xl bg-transparent justify-center items-center">
              <Image
                source={require("../../assets/images/new_logo.png")}
                className="w-14 h-14"
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
          </Link>

          {/* Welcome text section */}
          <View className="mb-10">
            <Text className="text-3xl font-bold text-black mb-3 leading-tight">
              Welcome{"\n"}to IronExSafe™
            </Text>
            <Text className="text-base text-black/80 leading-6">
              Connect with your community and stay updated every time,
              everywhere.
            </Text>
          </View>

          {/* Authentication buttons */}
          <View className="gap-3">
            <TouchableOpacity 
              className={`flex-row items-center justify-center bg-white/95 py-4 px-6 mb-2 rounded-xl border border-white/10 shadow-lg ${loading ? 'opacity-50' : ''}`}
              onPress={() => {
                promptAsync();
              }}>
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-base text-gray-700 font-medium ml-3">
                {loading ? 'Logging in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>


            <TouchableOpacity 
                className={`flex-row items-center justify-center bg-white/95 py-4 px-6 mb-2 rounded-xl border border-white/10 shadow-lg ${loading ? 'opacity-50' : ''}`}
                onPress={() => {
                  promptAsync();
                }}>
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="text-base text-gray-700 font-medium ml-3">
                  {loading ? 'Logging in...' : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>

            {/* Continue with Cognito */}  
            {/* <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg"
                onPress={() => {
                  promptAsync();
                }}>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  className="w-5 h-5 mr-2"
                  resizeMode="contain"
                />
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="text-base text-gray-700 font-medium ml-3">Continue with Social</Text>
            </TouchableOpacity> */}

            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity className="bg-red-700 py-4 px-6 rounded-xl items-center shadow-lg">
                <Text className="text-base text-white font-semibold">
                  Continue with email
                </Text>
              </TouchableOpacity>
            </Link>

            <View className="mb-8">
              <TouchableOpacity 
                className="flex-row items-start"
                onPress={() => {
                  setAgreeToTerms(!agreeToTerms);
                }}
              >
                <View className="flex-1">
                  <Text className="text-sm text-black/70 leading-5">
                    By creating an account, you agree to our{' '}
                    <Text 
                      className="text-red-700 font-medium underline" 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTermsPress();
                      }}
                    >
                      Terms & Conditions
                    </Text>
                    {' '}and{' '}
                    <Text 
                      className="text-red-700 font-medium underline" 
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePrivacyPress();
                      }}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
    </NotificationProvider>
  );
}