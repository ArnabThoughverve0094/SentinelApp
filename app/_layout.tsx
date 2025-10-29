import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import '../global.css';
import { toastConfig } from '../utils/toastConfig';


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Custom toast configuration
// const toastConfig = {
//   success: (props: any) => (
//     <BaseToast
//       {...props}
//       style={{
//         borderLeftColor: '#10b981',
//         backgroundColor: '#ffffff',
//         borderRadius: 12,
//         borderWidth: 1,
//         borderColor: '#e5e7eb',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         elevation: 5,
//       }}
//       contentContainerStyle={{
//         paddingHorizontal: 15,
//       }}
//       text1Style={{
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         color: '#065f46',
//         marginBottom: 2,
//       }}
//       text2Style={{
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         color: '#047857',
//         lineHeight: 18,
//       }}
//     />
//   ),
  
//   error: (props: any) => (
//     <ErrorToast
//       {...props}
//       style={{
//         borderLeftColor: '#ef4444',
//         backgroundColor: '#ffffff',
//         borderRadius: 12,
//         borderWidth: 1,
//         borderColor: '#e5e7eb',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         elevation: 5,
//       }}
//       contentContainerStyle={{
//         paddingHorizontal: 15,
//       }}
//       text1Style={{
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         color: '#991b1b',
//         marginBottom: 2,
//       }}
//       text2Style={{
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         color: '#dc2626',
//         lineHeight: 18,
//       }}
//     />
//   ),
  
//   warning: (props: any) => (
//     <BaseToast
//       {...props}
//       style={{
//         borderLeftColor: '#f59e0b',
//         backgroundColor: '#ffffff',
//         borderRadius: 12,
//         borderWidth: 1,
//         borderColor: '#e5e7eb',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         elevation: 5,
//       }}
//       contentContainerStyle={{
//         paddingHorizontal: 15,
//       }}
//       text1Style={{
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         color: '#92400e',
//         marginBottom: 2,
//       }}
//       text2Style={{
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         color: '#d97706',
//         lineHeight: 18,
//       }}
//     />
//   ),
  
//   info: (props: any) => (
//     <BaseToast
//       {...props}
//       style={{
//         borderLeftColor: '#3b82f6',
//         backgroundColor: '#ffffff',
//         borderRadius: 12,
//         borderWidth: 1,
//         borderColor: '#e5e7eb',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         elevation: 5,
//       }}
//       contentContainerStyle={{
//         paddingHorizontal: 15,
//       }}
//       text1Style={{
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         color: '#1e40af',
//         marginBottom: 2,
//       }}
//       text2Style={{
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         color: '#2563eb',
//         lineHeight: 18,
//       }}
//     />
//   ),
// };

export default function RootLayout(): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsReady(true);
      if (fontsLoaded || fontError) {
        SplashScreen.hideAsync();
      }
    }
    
  }, [rootNavigationState?.key, fontsLoaded, fontError]);

  if (!isReady) {
    // You can return a Splash screen component here
    return <Text>Loading...</Text>;
  }

  if (!fontsLoaded && !fontError) {
    return <></>;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
      </Stack>
      
      {/* Toast component - MUST be at the bottom */}
      <Toast config={toastConfig} />
    </>
  );
}
//Layout