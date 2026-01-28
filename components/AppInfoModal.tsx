import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const AppInfoModal: React.FC<AppInfoModalProps> = ({ visible, onClose }) => {
  const APP_VERSION = '1.0.0';
  const BUILD_NUMBER = '100';
  const router = useRouter();

  const handleLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const handleTermsPress = () => {
    onClose();
    setTimeout(() => {
      router.push('/(auth)/termsandconditions');
    }, 100);
  };

  const handlePrivacyPress = () => {
    onClose();
    setTimeout(() => {
      router.push('/(auth)/privacypolicy');
    }, 100);
  };

  interface InfoSectionProps {
    title: string;
    children: React.ReactNode;
  }

  const InfoSection: React.FC<InfoSectionProps> = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#111827',
        marginBottom: 12 
      }}>
        {title}
      </Text>
      {children}
    </View>
  );

  interface InfoItemProps {
    icon: string;
    label: string;
    value: string;
    onPress?: () => void;
  }

  const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 8
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
      }}>
        <Ionicons name={icon as any} size={20} color="#374151" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      // transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6'
          }}>
          
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
              App Info
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'flex-end',
                marginRight: 12
              }}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {/* App Logo & Name */}
          <View style={{ alignItems: 'center', marginBottom: 5, marginTop: 5 }}>
            <View style={{
              width: 100,
              height: 100,
              // borderRadius: 24,
              // backgroundColor: '#000',
              justifyContent: 'center',
              alignItems: 'center',
              // marginBottom: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5
            }}>
              <Image
                source={require("../assets/images/new_logo.png")}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: '#111827',
              marginBottom: 4 
            }}>
              IronExSafe™ 
            </Text>
            <Text style={{ fontSize: 15, color: '#6B7280' }}>
              Report. Expose. Educate.
            </Text>
          </View>


          {/* Version Info */}
          <InfoSection title="Version Information">
            <InfoItem 
              icon="information-circle-outline" 
              label="Version" 
              value={APP_VERSION}
            />
            <InfoItem 
              icon="code-slash-outline" 
              label="Build Number" 
              value={BUILD_NUMBER}
            />
          </InfoSection>

          {/* About IronEx */}
          <InfoSection title="About IronEx">
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12
            }}>
              <Text style={{ 
                fontSize: 15, 
                color: '#374151', 
                lineHeight: 24,
                marginBottom: 12
              }}>
                IronEx is a mobile-first platform built to help users document, understand, and respond to antisemitic, antizionist, and anti-Israel incidents—whether witnessed online or in the real world.
              </Text>
              <Text style={{ 
                fontSize: 15, 
                color: '#374151', 
                lineHeight: 24,
                marginBottom: 12
              }}>
                To protect users and maintain civility, IronEx does not allow comments or direct replies. Each verified report is published with pre-curated "sentiment choices," allowing viewers to express how they interpret content without triggering harassment.
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#6B7280', 
                lineHeight: 22,
                fontStyle: 'italic'
              }}>
                Every submission is reviewed before publication, anonymized when necessary, and presented in a structured format that encourages clarity and reflection.
              </Text>
            </View>
          </InfoSection>

          {/* Two Modes */}
          <InfoSection title="Two Modes">
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="newspaper-outline" size={20} color="#111827" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                  Published Posts (Live Feed)
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
                Verified incident reports revealing real-time patterns of antisemitism and anti-Israel hostility across online and offline environments.
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="school-outline" size={20} color="#111827" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                  Educational Mode (Learning Hub)
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 8 }}>
                A curated library to help users understand the historical, rhetorical, and ideological forces behind modern antisemitism and antizionism.
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
                Includes: Short explainers • Definitions of tropes and symbols • Video commentary from experts • Scholar-written essays • Practical guides for responding to misinformation
              </Text>
            </View>
          </InfoSection>

          {/* Expert Contributions */}
          <InfoSection title="Expert Contributions">
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16
            }}>
              <Text style={{ 
                fontSize: 15, 
                color: '#374151', 
                lineHeight: 24,
                marginBottom: 12
              }}>
                IronEx actively invites historians, journalists, academics, policy analysts, commentators, and subject-matter experts to submit essays, videos, analyses, and educational materials.
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#6B7280', 
                lineHeight: 22
              }}>
                Submissions that meet IronEx's standards for accuracy and relevance become part of the Learning Hub, ensuring users receive trusted, authoritative resources.
              </Text>
            </View>
          </InfoSection>

          {/* Legal & Support */}
          <InfoSection title="Legal & Support">
            <InfoItem 
              icon="document-text-outline" 
              label="Terms & Conditions" 
              value="Read our terms"
              onPress={handleTermsPress}
            />
            <InfoItem 
              icon="shield-outline" 
              label="Privacy Policy" 
              value="How we protect your data"
              onPress={handlePrivacyPress}
            />
            <InfoItem 
              icon="help-circle-outline" 
              label="Help & Support" 
              value="Get assistance"
              onPress={() => handleLink('mailto:IronExSafe@gmail.com')}
            />
          </InfoSection>

          {/* Connect */}
          <InfoSection title="Connect With Us">
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => handleLink('https://x.com/IronExHQ')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#1DA1F2',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="logo-x" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleLink('https://ironexsafe.com')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#6B7280',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="globe-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </InfoSection>

          {/* Developer Info */}
          <View style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>
              © 2026 Token Land, LLC (IronEx) All Rights Reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
      </SafeAreaView>
      
    </Modal>
  );
};

export default AppInfoModal;
