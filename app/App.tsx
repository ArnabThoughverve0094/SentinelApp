import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function App() {
    // Automatically creates a prefix depending on environment (Dev vs Production)
    const prefix = Linking.createURL('/');

    useEffect(() => {
        // 1. Handle URL if app was closed
        const getInitialUrl = async () => {
          const url = await Linking.getInitialURL();
          if (url) handleUrl(url);
        };
    
        // 2. Handle URL if app was in background
        const subscription = Linking.addEventListener('url', (event) => {
          handleUrl(event.url);
        });
    
        getInitialUrl();
        return () => subscription.remove();
    }, []);

    const handleUrl = (url: string) => {
        // Use expo-linking to parse the URL into a readable object
        const { hostname, path, queryParams } = Linking.parse(url);
    
        console.log(
            `Linked to app with hostname: ${hostname}, path: ${path}, and data: ${JSON.stringify(queryParams)}`
        );
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Your callback URL prefix is: {prefix}</Text>
        </View>
    );
}