//app/splash.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen(): React.JSX.Element {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBegin = () => {
    router.push('/(auth)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <View style={styles.content}>
        {/* Logo Section - Centered */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/ironex-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Begin Button - Bottom */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            onPress={handleBegin}
            style={styles.beginButton}
            activeOpacity={0.85}
          >
            <Text style={styles.beginButtonText}>Begin</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 186,
    height: 31.5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: height * 0.18,
    alignItems: 'center',
  },
  beginButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    width: 150,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  beginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
