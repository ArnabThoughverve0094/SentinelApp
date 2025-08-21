// Create a new file: app/AuthCheck.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthCheck() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [userToken, tokenExpiry] = await AsyncStorage.multiGet([
        'userToken',
        'tokenExpiry',
      ]);

      const token = userToken[1];
      const expiry = tokenExpiry[1];

      if (token && expiry) {
        const currentTime = Date.now();
        const expiryTime = parseInt(expiry);

        if (currentTime < expiryTime) {
          // Token exists and is valid
          console.log('Valid session found, redirecting to tabs');
          router.replace('/(tabs)');
        } else {
          // Token expired, clear storage and go to login
          console.log('Token expired, clearing storage');
          await AsyncStorage.multiRemove([
            'userToken',
            'userRefreshToken', 
            'userIdToken',
            'userEmail',
            'tokenExpiry',
            'userData',
          ]);
          router.replace('/(auth)/email-login');
        }
      } else {
        // No token found, go to login
        console.log('No valid session, redirecting to login');
        router.replace('/(auth)/email-login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      router.replace('/(auth)/email-login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-violet-500 items-center justify-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white text-lg mt-4">Loading...</Text>
      </View>
    );
  }

  return null;
}
