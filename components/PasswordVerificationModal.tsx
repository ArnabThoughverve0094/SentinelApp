import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResponseType, makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

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

const LOGIN_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/login';

// Define the response type from your login API
type LoginResponse = {
  message: string;
  tokens?: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  userAttributes?: any;
  decodedClaims?: any;
};

// Define props interface for the component
interface PasswordVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordVerificationModal({ 
  visible, 
  onClose, 
  onSuccess 
}: PasswordVerificationModalProps): React.JSX.Element {
  const [password, setPassword] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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

  const handleVerifyPassword = async (): Promise<void> => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsVerifying(true);
    console.log('🔐 [PasswordVerify] Starting verification...');

    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!userEmail) {
        Alert.alert('Error', 'Email not found. Please login again.');
        setIsVerifying(false);
        return;
      }

      // Call your login API to verify password and get fresh tokens
      const response = await fetch(LOGIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: password,
        }),
      });

      const data: LoginResponse = await response.json();
      console.log('✅ [PasswordVerify] Response:', data);

      // Handle both response formats (nested tokens or direct)
      const accessToken = data.tokens?.accessToken || data.accessToken;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      const idToken = data.tokens?.idToken || data.idToken;

      if (!response.ok || !accessToken) {
        Alert.alert('Error', data.message || 'Invalid password. Please try again.');
        setIsVerifying(false);
        setPassword('');
        return;
      }

      // Store the new tokens
      const items: [string, string][] = [
        ['userToken', accessToken],
        ['accessToken', accessToken],
      ];

      if (refreshToken) {
        items.push(['userRefreshToken', refreshToken]);
        items.push(['refreshToken', refreshToken]);
      }

      if (idToken) {
        items.push(['userIdToken', idToken]);
        items.push(['idToken', idToken]);
      }

      // Calculate and store token expiry
      if (data.decodedClaims?.exp) {
        const expiryTime = data.decodedClaims.exp * 1000;
        items.push(['tokenExpiry', expiryTime.toString()]);
        console.log('✅ Token expiry updated:', new Date(expiryTime));
      } else {
        // Default to 1 hour if no expiry provided
        const expiryTime = Date.now() + (60 * 60 * 1000);
        items.push(['tokenExpiry', expiryTime.toString()]);
      }

      await AsyncStorage.multiSet(items);
      console.log('✅ [PasswordVerify] Tokens refreshed successfully');
      
      setPassword('');
      setIsVerifying(false);
      onSuccess(); // Open the edit profile modal
      onClose();
      
    } catch (error) {
      console.error('❌ [PasswordVerify] Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleClose = (): void => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  const exchangeCodeSocialLogin = async (code: string) => {
    setIsVerifying(true);

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
        // Handle both response formats (nested tokens or direct)
      const accessToken = data.tokens?.accessToken || data.accessToken;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      const idToken = data.tokens?.idToken || data.idToken;

      if (!response.ok || !accessToken) {
        Alert.alert('Error', data.message || 'Invalid password. Please try again.');
        setIsVerifying(false);
        setPassword('');
        return;
      }

      // Store the new tokens
      const items: [string, string][] = [
        ['userToken', accessToken],
        ['accessToken', accessToken],
      ];

      if (refreshToken) {
        items.push(['userRefreshToken', refreshToken]);
        items.push(['refreshToken', refreshToken]);
      }

      if (idToken) {
        items.push(['userIdToken', idToken]);
        items.push(['idToken', idToken]);
      }

      // Calculate and store token expiry
      if (data.decodedClaims?.exp) {
        const expiryTime = data.decodedClaims.exp * 1000;
        items.push(['tokenExpiry', expiryTime.toString()]);
        console.log('✅ Token expiry updated:', new Date(expiryTime));
      } else {
        // Default to 1 hour if no expiry provided
        const expiryTime = Date.now() + (60 * 60 * 1000);
        items.push(['tokenExpiry', expiryTime.toString()]);
      }

      await AsyncStorage.multiSet(items);
      console.log('✅ [PasswordVerify] Tokens refreshed successfully');
      
      setPassword('');
      setIsVerifying(false);
      onSuccess(); // Open the edit profile modal
      onClose();
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
        setIsVerifying(false);
      }
      } catch (error) {
        console.log('❌ Error during exchange code response:', error);
        setIsVerifying(false);
      }
      
      
    } catch (err) {
      console.error('❌ Exchange code social login error:', err);
      setIsVerifying(false);
    }

    setIsVerifying(false);
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
  }, [response]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Text style={styles.title}>
              Verify Your Identity
            </Text>
            <Text style={styles.description}>
              For security, please enter your password to continue editing your profile.
            </Text>

            {/* Password Input with Eye Icon */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isVerifying}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleVerifyPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isVerifying}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isVerifying}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerifyPassword}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Social login buttons */}
            <View className="gap-3 mb-6">
              {/* Continue with Google */}
              <TouchableOpacity 
                className={`flex-row items-center justify-center bg-white/95 py-4 px-6 mt-2 rounded-xl border border-white/10 shadow-lg ${isVerifying ? 'opacity-50' : ''}`}
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
                  {isVerifying ? 'Logging in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* Cognito Sign out */}  
               {/* <TouchableOpacity className="flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-white/30 shadow-lg"
                onPress={() => {
                  signOut();
                }}>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  className="w-5 h-5 mr-2"
                  resizeMode="contain"
                />
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="text-base text-gray-700 font-medium ml-3">Social Sign out</Text>
              </TouchableOpacity> */}

              {/* Continue with Apple */}
              <TouchableOpacity 
                className={`flex-row items-center justify-center bg-white/95 py-4 px-6 mb-2 rounded-xl border border-white/10 shadow-lg ${isVerifying ? 'opacity-50' : ''}`}
                onPress={() => {
                  promptAsync();
                }}>
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="text-base text-gray-700 font-medium ml-3">Continue with Apple</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Enhanced Styles with eye button positioning
const styles = {
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  } as ViewStyle,
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  } as ViewStyle,
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  } as TextStyle,
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  } as TextStyle,
  inputWrapper: {
    position: 'relative',
    marginBottom: 20,
  } as ViewStyle,
  input: {
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    padding: 12,
    paddingRight: 45,
    fontSize: 16,
    color: '#111',
  } as TextStyle,
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  } as ViewStyle,
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  } as ViewStyle,
  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  } as TextStyle,
  verifyButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  verifyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  } as TextStyle,
};
