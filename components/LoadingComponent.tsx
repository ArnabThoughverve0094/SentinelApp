import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image, Dimensions } from 'react-native';

interface LoadingComponentProps {
  visible?: boolean;
  text?: string;
  subText?: string;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  textColor?: string;
  subTextColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  visible = true,
  text = "Loading posts...",
  subText = "This won't take long",
  size = 'medium',
  backgroundColor = 'white',
  textColor = '#4b5563', // gray-600
  subTextColor = '#9ca3af', // gray-400
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Start rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => {
        rotateAnimation.stop();
      };
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, rotateAnim, scaleAnim, opacityAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: 16, paddingVertical: 12 },
          logo: { width: 24, height: 24 },
          text: { fontSize: 12, marginTop: 8 },
          subText: { fontSize: 10, marginTop: 2 },
        };
      case 'large':
        return {
          container: { paddingHorizontal: 32, paddingVertical: 24 },
          logo: { width: 48, height: 48 },
          text: { fontSize: 16, marginTop: 12 },
          subText: { fontSize: 12, marginTop: 4 },
        };
      default: // medium
        return {
          container: { paddingHorizontal: 24, paddingVertical: 16 },
          logo: { width: 32, height: 32 },
          text: { fontSize: 14, marginTop: 10 },
          subText: { fontSize: 11, marginTop: 3 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
      className="flex-1 justify-center items-center"
    >
      <View
        style={[
          {
            backgroundColor,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
            alignItems: 'center',
          },
          sizeStyles.container,
        ]}
      >
        {/* Animated Logo */}
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
          }}
        >
          <Image
            source={require('../assets/images/Sentinal-logo-big.png')} // Update path as needed
            style={[
              sizeStyles.logo,
              {
                borderRadius: sizeStyles.logo.width / 2, // Make it circular
              },
            ]}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Loading Text */}
        {text && (
          <Text
            style={[
              {
                color: textColor,
                fontWeight: '600',
                textAlign: 'center',
              },
              sizeStyles.text,
            ]}
          >
            {text}
          </Text>
        )}

        {/* Sub Text */}
        {subText && (
          <Text
            style={[
              {
                color: subTextColor,
                textAlign: 'center',
              },
              sizeStyles.subText,
            ]}
          >
            {subText}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

// Full Screen Loading Overlay Component
export const LoadingOverlay: React.FC<LoadingComponentProps> = (props) => {
  if (!props.visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <LoadingComponent {...props} />
    </View>
  );
};

export default LoadingComponent;
