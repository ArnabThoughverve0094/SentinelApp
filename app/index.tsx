import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function Index() {
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

      if (token) {
        console.log('Valid session found, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('No valid session, redirecting to login');
        router.replace('/(auth)');
      }

      // if (token && expiry) {
      //   const currentTime = Date.now();
      //   const expiryTime = parseInt(expiry);

      //   if (currentTime < expiryTime) {
      //     console.log('Valid session found, redirecting to tabs');
      //     router.replace('/(tabs)');
      //   } else {
      //     console.log('Token expired, clearing storage');
      //     await AsyncStorage.multiRemove([
      //       'userToken',
      //       'userRefreshToken', 
      //       'userIdToken',
      //       'userEmail',
      //       'tokenExpiry',
      //       'userData',
      //     ]);
      //     router.replace('/(auth)/email-login');
      //   }
      // } else {
      //   console.log('No valid session, redirecting to login');
      //   router.replace('/(auth)/email-login');
      // }
    } catch (error) {
      console.error('Error checking auth status:', error);
      router.replace('/(auth)/email-login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-violet-500 items-center justify-center">
      <ActivityIndicator size="large" color="white" />
      <Text className="text-white text-lg mt-4 font-semibold">Sentinel</Text>
      <Text className="text-white text-sm mt-2">Loading your experience...</Text>
    </View>
  );
}