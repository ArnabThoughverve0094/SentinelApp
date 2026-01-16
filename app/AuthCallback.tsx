// import { getCurrentUser } from '@aws-amplify/auth';
// import { Amplify } from 'aws-amplify';
// import * as Linking from 'expo-linking';
// import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
// import 'react-native-get-random-values';
// import 'react-native-url-polyfill/auto';

// const redirectUrl = Linking.createURL('AuthCallback');

// This ensures the browser window closes correctly on mobile
// WebBrowser.maybeCompleteAuthSession();

// Amplify.configure({
//   Auth: {
//     Cognito: {
//       userPoolId: 'us-east-2_7yy7pjbe8',
//       userPoolClientId: 'u2868f22cqiddetr6db89237d',
//       loginWith: {
//         oauth: {
//           domain: 'https://us-east-27yy7pjbe8.auth.us-east-2.amazoncognito.com/oauth2/authorize?response_type=code&client_id=u2868f22cqiddetr6db89237d&redirect_uri=frontend://AuthCallback',
//           scopes: ['email', 'openid', 'profile'],
//           redirectSignIn: [redirectUrl],
//           redirectSignOut: [redirectUrl],
//           responseType: 'code',
//         }
//       }
//     }
//   }
// });

// Define a type for our User state
interface UserState {
    username: string;
    userId: string;
  }

export default function AuthCallback() {
    const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    console.log("AuthCallback screen called");
    router.replace('/(auth)');
    // checkUser();
  }, []);

  // const checkUser = async () => {
  //   try {
  //     const { username, userId } = await getCurrentUser();
  //     setUser({ username, userId });
  //   } catch (err) {
  //     setUser(null);
  //   }
  // };
}