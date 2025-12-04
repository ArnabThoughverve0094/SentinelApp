import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface AppInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const AppInfoModal: React.FC<AppInfoModalProps> = ({ visible, onClose }) => {
  const APP_VERSION = '1.0.0';
  const BUILD_NUMBER = '100';

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
    onPress?: () => void; // MAKE IT OPTIONAL WITH ?
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
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6'
        }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
            App Info
          </Text>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {/* App Logo & Name */}
          <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 16 }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              backgroundColor: '#000',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5
            }}>
              <Ionicons name="shield-checkmark" size={48} color="#fff" />
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: '#111827',
              marginBottom: 4 
            }}>
              Sentinel
            </Text>
            <Text style={{ fontSize: 15, color: '#6B7280' }}>
              Your Voice, Verified
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

          {/* About */}
          <InfoSection title="About">
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16
            }}>
              <Text style={{ 
                fontSize: 15, 
                color: '#374151', 
                lineHeight: 24 
              }}>
                Sentinel is a community-driven platform where voices are verified and opinions matter. 
                Share your thoughts, participate in discussions, and help build a more transparent 
                and accountable digital space.
              </Text>
            </View>
          </InfoSection>

          {/* Legal & Support */}
          <InfoSection title="Legal & Support">
            <InfoItem 
              icon="document-text-outline" 
              label="Terms of Service" 
              value="Read our terms"
              onPress={() => handleLink('https://yourapp.com/terms')}
            />
            <InfoItem 
              icon="shield-outline" 
              label="Privacy Policy" 
              value="How we protect your data"
              onPress={() => handleLink('https://yourapp.com/privacy')}
            />
            <InfoItem 
              icon="help-circle-outline" 
              label="Help & Support" 
              value="Get assistance"
              onPress={() => handleLink('mailto:support@sentinel.com')}
            />
          </InfoSection>

          {/* Connect */}
          <InfoSection title="Connect With Us">
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => handleLink('https://twitter.com/yourapp')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#1DA1F2',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="logo-twitter" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleLink('https://instagram.com/yourapp')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#E1306C',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="logo-instagram" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleLink('https://facebook.com/yourapp')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#1877F2',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="logo-facebook" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleLink('https://yourapp.com')}
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
            <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              Made with ❤️ by Sentinel Team
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              © 2025 Sentinel. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default AppInfoModal;
