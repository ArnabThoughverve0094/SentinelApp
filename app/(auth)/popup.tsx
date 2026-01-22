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
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AuthLanding(): React.JSX.Element {
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
    height: height * 0.5, // 50% of screen for pattern
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#EFFAAB',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.08, // 8% padding
    paddingTop: height * 0.04, // 4% top padding
    paddingBottom: height * 0.06, // 6% bottom padding
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: width * 0.095, // Dynamic font size (9.5% of width)
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    lineHeight: width * 0.115, // Dynamic line height
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: width * 0.037, // Dynamic subtitle size
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginTop: height * 0.02,
    fontWeight: '400',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: height * 0.025, // Dynamic gap
  },
  createAccountButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    width: width * 0.5, // 50% of screen width
    maxWidth: 250,
    minWidth: 180,
    height: height * 0.06, // 6% of screen height
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
    fontSize: width * 0.042, // Dynamic button text size
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
    fontSize: width * 0.042, // Dynamic sign-in text size
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 6,
  },
});
