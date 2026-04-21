import { db } from '@/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResponseType, TokenResponse, makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { doc, writeBatch } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '../services/notifications';

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
    profilePic?: string; 
    bio?: string;
    expoToken?: string;
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

  const [tokens, setTokens] = useState<TokenResponse | null>(null);

  const redirectUri = makeRedirectUri({
    scheme: "frontend",
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

  const savePushToken = async () => {

    try {
      console.log("Firebase New Generated token called ");
      const token = await registerForPushNotificationsAsync() || '';
      console.log("Firebase New Generated token: ", token);
      setExpoPushToken(token);
    } catch (error) {
      console.log("Firebase New Generated token Error: ", error);
    }
    
  
  };

  useEffect(() => {
    savePushToken();

    if (response?.type === "success") {
      const { code } = response.params;
      console.log("Social Login Success! Code:", code);
      exchangeCodeSocialLogin(code);
    } else {
      console.log("Social Login Failed! Code: ", response);
    }
  }, [response]);

  const exchangeCodeSocialLogin = async (code: string) => {
    setLoading(true);
    setError(null);

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
          await storeUserData(data);
          console.log('✅ Login successful, tokens saved, redirecting to tabs...');
          router.replace("/(tabs)");
        } else {
          setError(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.log('❌ Error during exchange code response:', error);
        setError('Failed to process login. Please try again.');
      }
    } catch (err) {
      console.error('❌ Exchange code social login error:', err);
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    setEmailError(null);
    setPasswordError(null);
    setError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const storeUserData = async (data: LoginResponse) => {
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
    fetchUserData(data);
  }
  if (data.userAttributes.role) {
    items.push(['userRole', data.userAttributes.role]);
  } else {
    items.push(['userRole', 'User']);
  }

  if (expoPushToken) {
    items.push(['expoToken', expoPushToken]);
  } else if (data.userAttributes.expoToken) {
    items.push(['expoToken', data.userAttributes.expoToken]);
  } else {
    items.push(['expoToken', '']);
  }

  // ✅ COUNTRY - Check all possible locations
  const userCountry = data.userAttributes.country || 
                      data.decodedClaims?.country ||
                      data.decodedClaims?.['custom:country'] || 
                      '';
  items.push(['userCountry', userCountry]);
  console.log('✅ Country stored from login:', userCountry || 'Empty');

  // ✅ BIO - Check all possible locations
  const userBio = data.userAttributes.bio || 
                data.userAttributes['custom:bio'] ||
                data.decodedClaims?.bio ||
                data.decodedClaims?.['custom:bio'] ||
                data.decodedClaims?.['profile'] ||  // some Cognito setups use this
                '';
  items.push(['userBio', userBio]);
  console.log('✅ Bio stored from login:', userBio || 'Empty');

  // ✅ PROFILE PICTURE - Always store a value (even if empty)
  const profilePicFromResponse = data.userAttributes.profilePic || 
                                 data.decodedClaims?.profilePic ||
                                 data.decodedClaims?.['custom:profilePic'] || 
                                 '';
  
  if (profilePicFromResponse && profilePicFromResponse.trim() !== '') {
    // Construct full URL if it's just a filename
    const profilePicUrl = profilePicFromResponse.startsWith('http') 
      ? profilePicFromResponse 
      : `https://sentinal-uploads.s3.us-west-2.amazonaws.com/${profilePicFromResponse}`;
    
    items.push(['profilePicUrl', profilePicUrl]);
    console.log('✅ Profile picture stored from login:', profilePicUrl);
  } else {
    // ✅ IMPORTANT: Store empty string if no profile picture
    items.push(['profilePicUrl', '']);
    console.log('ℹ️ No profile picture - stored empty string');
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
    
    // ✅ DEBUG: Log what was stored for country and bio
    console.log('🔍 DEBUG - Stored values:');
    console.log('  Country:', userCountry || '(empty)');
    console.log('  Bio:', userBio || '(empty)');
  } catch (error) {
    console.error('❌ Error during multiSet:', error);
    throw new Error('Failed to save login data');
  }
  if (!userBio && data.userAttributes.sub) {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'IronExUsers', data.userAttributes.sub);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const firestoreData = snap.data();
        const firestoreBio = firestoreData.bio 
                          || firestoreData.userBio 
                          || firestoreData.Bio 
                          || '';
        if (firestoreBio) {
          await AsyncStorage.setItem('userBio', firestoreBio);
          console.log('✅ Bio fetched from Firestore fallback:', firestoreBio);
        }
      }
    } catch (e) {
      console.error('❌ Firestore bio fallback error:', e);
    }
    }
  };


  const handleLogin = async () => {
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
        await storeUserData(data);
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

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError(null);
    }
  };

  const fetchUserData = useCallback(async (userData: LoginResponse) => {
    if (!userData.userAttributes.sub) return;
  
    // const sentinelUsersRef = collection(db, 'SentinelUsers');
    // const q = query(sentinelUsersRef, where('userID', '==', userId));
  
    // const unsubscribe = onSnapshot(q, async (snapshot) => {
    //   if (snapshot.empty) {
    //     try {
    //       await addDoc(collection(db, 'SentinelUsers'), {
    //         userID: userId,
    //         deviceToken: expoPushToken || '',
    //         createdAt: new Date()
    //       });
    //       console.log('📱 New user created');
    //     } catch (err) {
    //       console.error("Error creating user:", err);
    //     }
    //   } else {
    //     const userDoc = snapshot.docs[0];
    //     const userData = userDoc.data();
  
    //     if (userData.deviceToken !== expoPushToken) {
    //       const userRef = doc(db, "SentinelUsers", userDoc.id);
    //       await updateDoc(userRef, { deviceToken: expoPushToken || '' });
    //       console.log('✅ Device token synced');
    //     }
    //   }
    // }, (error) => {
    //   console.error('Snapshot error:', error);
    // });
  
    // return unsubscribe;

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'IronExUsers', userData.userAttributes.sub);
    
    try {
      batch.set(userDocRef, {
        userID: userData.userAttributes.sub,
        userEmail: userData.userAttributes.email || '',
        userName: userData.userAttributes.name || '',
        userNickName: userData.userAttributes.nickname || '',
        profilePicUrl: userData.userAttributes.profilePic || '',
        expoToken: expoPushToken || '',
        bio: userData.userAttributes.bio || '',
        userBio: userData.userAttributes.bio || '',
        Bio: userData.userAttributes.bio || '',
      }, { merge: true });
  
      // Commit both updates at once
      await batch.commit();
  
    } catch (error) {
      console.error("❌ User Error:", error);
    }

  }, [expoPushToken]);

  const goBack = useCallback(() => router.back(), [router]);

  return (
    <SafeAreaView className="flex-1 bg-[#ECEDEE]">
      <StatusBar barStyle="dark-content" backgroundColor="#ECEDEE" />
      
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back Button */}
        <View className="px-6 pt-2 pb-4">
          <TouchableOpacity 
            onPress={goBack}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6">
          {/* Title */}
          <Text className="text-2xl font-bold text-black mb-10">
            Log in
          </Text>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
              YOUR EMAIL
            </Text>
            <View className="border-b border-gray-300">
              <TextInput
                className="text-base text-black py-3"
                placeholder=""
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9CA3AF"
                style={{ fontSize: 16, lineHeight: 20 }}
              />
            </View>
            {emailError && (
              <Text className="text-red-500 text-xs mt-1">{emailError}</Text>
            )}
          </View>

          {/* Password Input */}
          <View className="mb-8">
            <Text className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
              PASSWORD
            </Text>
            <View className="border-b border-gray-300 flex-row items-center">
              <TextInput
                className="text-base text-black py-3 flex-1"
                placeholder=""
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9CA3AF"
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
            {passwordError && (
              <Text className="text-red-500 text-xs mt-1">{passwordError}</Text>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4">
              <Text className="text-red-500 text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            className={`bg-black py-4 rounded-xl items-center mb-4 ${loading ? 'opacity-50' : ''}`}
            disabled={loading}
            onPress={handleLogin}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Logging in...' : 'Log in'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center mb-3">
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-black text-base">
                  Sign Up <Ionicons name="arrow-forward" size={16} color="#000" />
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Trouble Logging In */}
          <View className="items-center mb-6">
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text className="text-black text-base underline">
                  Trouble logging in?
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="px-4 text-gray-500 text-sm">Or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

            {/* Social login buttons */}
            <View className="gap-3 mb-6">
              {/* Continue with Google */}
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

              {/* Continue with Apple */}
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
            </View>

          </View>
        </KeyboardAvoidingView>
    
    </SafeAreaView>
  );
}
