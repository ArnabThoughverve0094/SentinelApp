//app/auth/popup.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AuthLanding(): React.JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Top Pattern Section */}
      <View style={styles.patternSection}>
        <Image
          source={require('../../assets/images/pattern-bg.png')}
          style={styles.patternImage}
          resizeMode="cover"
        />
        
        {/* Close Button - Positioned on top of pattern */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Bottom Content Section */}
      <SafeAreaView style={styles.contentSection} edges={['bottom']}>
        <View style={styles.contentWrapper}>
          
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Structured</Text>
            <Text style={styles.title}>Antisemitism</Text>
            <Text style={styles.title}>Reporting</Text>
            
            <Text style={styles.subtitle}>
              Access is limited and moderated.
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonsContainer}>
            
            {/* Create Account Button */}
            <Link href={"/(auth)/register" as any} asChild>
              <TouchableOpacity
                style={styles.createAccountButton}
                activeOpacity={0.85}
              >
                <Text style={styles.createAccountText}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Sign In Link */}
            <Link href="/(auth)/email-login" asChild>
              <TouchableOpacity
                style={styles.signInButton}
                activeOpacity={0.7}
              >
                <Text style={styles.signInText}>Sign In</Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={18} 
                  color="#000" 
                  style={styles.arrow}
                />
              </TouchableOpacity>
            </Link>

          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  patternSection: {
    width: width,
    height: height * 0.5,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative', // Added for absolute positioning of close button
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#EFFAAB',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.08,
    paddingTop: height * 0.04,
    paddingBottom: height * 0.06,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: width * 0.095,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    lineHeight: width * 0.115,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: width * 0.037,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginTop: height * 0.02,
    fontWeight: '400',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: height * 0.025,
  },
  createAccountButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    width: width * 0.5,
    maxWidth: 250,
    minWidth: 180,
    height: height * 0.06,
    maxHeight: 54,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  createAccountText: {
    color: '#fff',
    fontSize: width * 0.042,
    fontWeight: '600',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
  },
  signInText: {
    color: '#000',
    fontSize: width * 0.042,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 6,
  },
});
