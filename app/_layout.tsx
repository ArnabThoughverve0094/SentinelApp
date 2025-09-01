// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import '../global.css';

export default function RootLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}