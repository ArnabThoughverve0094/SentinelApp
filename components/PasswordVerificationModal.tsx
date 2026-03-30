import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const clientId = 'u2868f22cqiddetr6db89237d';
const cognitoDomain = 'https://us-east-27yy7pjbe8.auth.us-east-2.amazoncognito.com';

const discovery = {
  authorizationEndpoint: `${cognitoDomain}/oauth2/authorize`,
  tokenEndpoint: `${cognitoDomain}/oauth2/token`,
  revocationEndpoint: `${cognitoDomain}/oauth2/revoke`,
};

const LOGIN_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/login';

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

interface PasswordVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordVerificationModal({
  visible,
  onClose,
  onSuccess,
}: PasswordVerificationModalProps): React.JSX.Element {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // ✅ Three separate loading states — one per action
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isAppleLoading, setIsAppleLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  // Disable all buttons if any one flow is active
  const isAnyLoading = isVerifyingPassword || isGoogleLoading || isAppleLoading;

  const hasHandledResponse = useRef<boolean>(false);

  const redirectUri = makeRedirectUri({
    scheme: 'frontend',
    path: 'AuthCallback',
    preferLocalhost: true,
  });

  const [, googleResponse, promptGoogle] = useAuthRequest(
    {
      clientId,
      responseType: ResponseType.Code,
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'aws.cognito.signin.user.admin'],
      usePKCE: false,
      extraParams: { identity_provider: 'Google' },
    },
    discovery
  );

  const [, appleResponse, promptApple] = useAuthRequest(
    {
      clientId,
      responseType: ResponseType.Code,
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'aws.cognito.signin.user.admin'],
      usePKCE: false,
      extraParams: { identity_provider: 'SignInWithApple' },
    },
    discovery
  );

  // ✅ Reset all state whenever modal opens
  useEffect(() => {
    if (visible) {
      setPassword('');
      setShowPassword(false);
      setPasswordError('');
      setIsVerifyingPassword(false);
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
      hasHandledResponse.current = false;
    }
  }, [visible]);

  // ✅ Shared token storage helper
  const storeTokens = async (data: LoginResponse): Promise<boolean> => {
    const accessToken = data.tokens?.accessToken ?? data.accessToken;
    const refreshToken = data.tokens?.refreshToken ?? data.refreshToken;
    const idToken = data.tokens?.idToken ?? data.idToken;

    if (!accessToken) return false;

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

    const expiryTime = data.decodedClaims?.exp
      ? data.decodedClaims.exp * 1000
      : Date.now() + 60 * 60 * 1000;

    items.push(['tokenExpiry', expiryTime.toString()]);
    await AsyncStorage.multiSet(items);
    return true;
  };

 const handleVerifyPassword = async (): Promise<void> => {
  if (!password.trim()) {
    setPasswordError('Please enter your password');
    return;
  }

  setPasswordError(''); // clear any previous error
  setIsVerifyingPassword(true);

  try {
    const userEmail = await AsyncStorage.getItem('userEmail');

    if (!userEmail) {
      setPasswordError('Email not found. Please login again.');
      setIsVerifyingPassword(false);
      return;
    }

    let res: Response;
    try {
      res = await fetch(LOGIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password }),
      });
    } catch (networkErr) {
      setPasswordError('Network error. Please check your connection.');
      setIsVerifyingPassword(false);
      return;
    }

    let data: LoginResponse;
    try {
      data = await res.json();
    } catch {
      setPasswordError('Unexpected server response. Please try again.');
      setIsVerifyingPassword(false);
      return;
    }

    if (!res.ok) {
      // Shows Cognito's actual message e.g. "Incorrect username or password."
      setPasswordError(data.message || 'Invalid password. Please try again.');
      setIsVerifyingPassword(false);
      setPassword('');
      return;
    }

    const stored = await storeTokens(data);

    if (!stored) {
      setPasswordError('Failed to save session. Please try again.');
      setIsVerifyingPassword(false);
      return;
    }

    setPassword('');
    setPasswordError('');
    setIsVerifyingPassword(false);
    hasHandledResponse.current = false;
    onSuccess();
    onClose();
  } catch (error) {
    console.error('❌ [PasswordVerify] Unexpected error:', error);
    setPasswordError('Something went wrong. Please try again.');
    setIsVerifyingPassword(false);
  }
};

  const handleClose = (): void => {
    setPassword('');
    setShowPassword(false);
    setPasswordError('');
    setIsVerifyingPassword(false);
    setIsGoogleLoading(false);
    setIsAppleLoading(false);
    hasHandledResponse.current = false;
    onClose();
  };

  const exchangeCodeSocialLogin = async (
    code: string,
    setLoading: (v: boolean) => void
  ): Promise<void> => {
    setLoading(true);

    try {
      const res = await fetch(
        'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/exchangeCode',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );

      const data: LoginResponse = await res.json();

      if (!res.ok || data.message !== 'Login successful') {
        Alert.alert('Error', data.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      const stored = await storeTokens(data);

      if (!stored) {
        Alert.alert('Error', 'Failed to save session. Please try again.');
        setLoading(false);
        return;
      }

      setPassword('');
      setLoading(false);
      hasHandledResponse.current = false;
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Exchange code social login error:', err);
      Alert.alert('Error', 'Network error. Please try again.');
      setLoading(false);
    }
  };

  // ✅ Google response — passes its own setter
  useEffect(() => {
    if (googleResponse?.type === 'success' && !hasHandledResponse.current) {
      hasHandledResponse.current = true;
      const { code } = googleResponse.params;
      exchangeCodeSocialLogin(code, setIsGoogleLoading);
    }
  }, [googleResponse]);

  // ✅ Apple response — passes its own setter
  useEffect(() => {
    if (appleResponse?.type === 'success' && !hasHandledResponse.current) {
      hasHandledResponse.current = true;
      const { code } = appleResponse.params;
      exchangeCodeSocialLogin(code, setIsAppleLoading);
    }
  }, [appleResponse]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            style={styles.cardShadow}
          >
            {/* Header */}
            <View className="px-6 pt-6 pb-4">
              <Text className="text-xl font-bold text-gray-900">
                Verify Your Identity
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                For security, please enter your password to continue editing your profile.
              </Text>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              {/* Password input */}
              <View className="mb-3">
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    passwordError ? { borderWidth: 1, borderColor: '#EF4444' } : {},
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  editable={!isAnyLoading}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isAnyLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

                {/* ✅ Inline red error — inside the mb-3 View, after inputWrapper closes */}
                {passwordError ? (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 }}>
                    {passwordError}
                  </Text>
                ) : null}
            </View>

              {/* Forgot password */}
              <View className="items-end mb-5">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity disabled={isAnyLoading}>
                    <Text className="text-sm text-gray-700 underline">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View className="flex-row mb-5">
                <TouchableOpacity
                  className="flex-1 bg-gray-100 rounded-lg items-center py-3.5 mr-2"
                  onPress={handleClose}
                  disabled={isAnyLoading}
                >
                  <Text className="text-base font-semibold text-gray-800">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-gray-900 rounded-lg items-center py-3.5 ml-2"
                  onPress={handleVerifyPassword}
                  disabled={isAnyLoading}
                >
                  {isVerifyingPassword ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-base font-semibold text-white">
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="flex-row items-center mb-5">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="px-4 text-sm text-gray-500">Or</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Social login buttons */}
              <View className="gap-3">
                {/* Google */}
                <TouchableOpacity
                  className={`flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-gray-200 shadow-sm ${
                    isAnyLoading ? 'opacity-50' : ''
                  }`}
                  disabled={isAnyLoading}
                  onPress={() => promptGoogle()}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : (
                    <Image
                      source={{
                        uri: 'https://developers.google.com/identity/images/g-logo.png',
                      }}
                      className="w-5 h-5"
                      resizeMode="contain"
                    />
                  )}
                  <Text className="ml-3 text-base font-medium text-gray-700">
                    {isGoogleLoading ? 'Logging in...' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>

                {/* Apple */}
                <TouchableOpacity
                  className={`flex-row items-center justify-center bg-white/95 py-4 px-6 rounded-xl border border-gray-200 shadow-sm ${
                    isAnyLoading ? 'opacity-50' : ''
                  }`}
                  disabled={isAnyLoading}
                  onPress={() => promptApple()}
                >
                  {isAppleLoading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : (
                    <Ionicons name="logo-apple" size={20} color="#000" />
                  )}
                  <Text className="ml-3 text-base font-medium text-gray-700">
                    {isAppleLoading ? 'Logging in...' : 'Continue with Apple'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  inputWrapper: {
    position: 'relative',
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
};
