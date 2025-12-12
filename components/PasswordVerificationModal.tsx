import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
