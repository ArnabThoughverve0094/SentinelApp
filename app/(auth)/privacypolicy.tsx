import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicy(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <View className="bg-white shadow-sm pt-5 pb-3 border-b border-gray-200">
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">Privacy Policy</Text>
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Hero section */}
          <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  Privacy Policy
                </Text>
                <Text className="text-sm text-gray-600">
                  Last Updated: February 12, 2026
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              By creating an account, installing, accessing, or using IronEx, you agree to this entire document.
            </Text>
            <View className="bg-white rounded-lg p-4">
              <Text className="text-sm text-gray-900 font-medium mb-1">
                "IronEx," "we," "us," and "our" refer to:
              </Text>
              <Text className="text-sm text-gray-700">Token Land, LLC</Text>
              <Text className="text-sm text-gray-700">7300 Biscayne Blvd, Suite 200</Text>
              <Text className="text-sm text-gray-700">Miami, FL 33138, USA</Text>
              <Text 
                className="text-sm text-blue-600 underline mt-1"
                onPress={() => Linking.openURL('mailto:ironexsafe@gmail.com')}
              >
                ironexsafe@gmail.com
              </Text>
            </View>
          </View>

          {/* Privacy sections */}
          <View className="space-y-4">
            {/* SECTION 1: Information We Collect */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-blue-600 font-bold text-sm">1</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Information We Collect
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.1 Information You Provide</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    We may collect:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Account information (email, password)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Sentiment selections</Text>
                    <Text className="text-base text-gray-700 leading-6">• Reports and flags</Text>
                    <Text className="text-base text-gray-700 leading-6">• Communications with support</Text>
                    <Text className="text-base text-gray-700 leading-6">• Optional profile information</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6">
                    IronEx does not require real names beyond credentials.
                  </Text>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.2 Automatically Collected Information</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    We may collect:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Device information</Text>
                    <Text className="text-base text-gray-700 leading-6">• IP address</Text>
                    <Text className="text-base text-gray-700 leading-6">• Log data</Text>
                    <Text className="text-base text-gray-700 leading-6">• Browser type</Text>
                    <Text className="text-base text-gray-700 leading-6">• Cookies</Text>
                    <Text className="text-base text-gray-700 leading-6">• Approximate location (IP-derived only)</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6">
                    We do not collect precise geolocation data.
                  </Text>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.3 Third-Party Sources</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    We may receive limited information from:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Authentication providers</Text>
                    <Text className="text-base text-gray-700 leading-6">• Analytics services</Text>
                    <Text className="text-base text-gray-700 leading-6">• Infrastructure and security providers</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6">
                    We do not purchase third-party data for advertising.
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 2: How We Use Information */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  How We Use Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  We use data to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Operate the Service</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enable engagement tools</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforce Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Detect and remove objectionable content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Improve platform functionality</Text>
                  <Text className="text-base text-gray-700 leading-6">• Ensure security</Text>
                  <Text className="text-base text-gray-700 leading-6">• Comply with law</Text>
                </View>
                <Text className="text-base font-medium text-gray-900">
                  IronEx does not use personal data for targeted advertising.
                </Text>
              </View>
            </View>

            {/* SECTION 3: AI Systems */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  AI Systems
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  IronEx uses AI-assisted systems for:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Safety screening</Text>
                  <Text className="text-base text-gray-700 leading-6">• Risk classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• Sentiment aggregation</Text>
                  <Text className="text-base text-gray-700 leading-6">• Platform optimization</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  AI outputs assist but do not replace human review.
                </Text>
                <Text className="text-base font-medium text-gray-900">
                  IronEx does not sell personal data for AI training.
                </Text>
              </View>
            </View>

            {/* SECTION 4: Sharing of Information */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Sharing of Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  We may share data:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• With trusted service providers</Text>
                  <Text className="text-base text-gray-700 leading-6">• With legal authorities if required</Text>
                  <Text className="text-base text-gray-700 leading-6">• With successors in a merger</Text>
                  <Text className="text-base text-gray-700 leading-6">• In anonymized or aggregated form</Text>
                </View>
                <Text className="text-base font-medium text-gray-900">
                  We do not sell personal data.
                </Text>
              </View>
            </View>

            {/* SECTION 5: Cookies */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Cookies
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Categories include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Strictly Necessary</Text>
                  <Text className="text-base text-gray-700 leading-6">• Analytics</Text>
                  <Text className="text-base text-gray-700 leading-6">• Functionality</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  EEA/UK users receive consent controls.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We honor CPRA-compliant Global Privacy Control signals.
                </Text>
              </View>
            </View>

            {/* SECTION 6: Data Retention */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Data Retention
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  We retain data as necessary to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Provide the Service</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforce Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Resolve disputes</Text>
                  <Text className="text-base text-gray-700 leading-6">• Comply with legal obligations</Text>
                </View>
                <Text className="text-base font-medium text-gray-900 mb-2">
                  Upon account deletion:
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Identifiable profile data will be deleted or anonymized. However, IronEx may retain archived copies of content, logs, moderation records, audit records, and security-related information for legal compliance, fraud prevention, dispute resolution, and safety enforcement purposes.
                </Text>
              </View>
            </View>

            {/* SECTION 7: Children's Privacy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Children's Privacy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  IronEx is not intended for users under 18. We do not knowingly collect data from minors.
                </Text>
              </View>
            </View>

            {/* SECTION 8: International Transfers */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  International Transfers
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Data may be processed in the United States.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Transfers rely on Standard Contractual Clauses where required.
                </Text>
              </View>
            </View>

            {/* SECTION 9: User Rights */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Rights
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Depending on jurisdiction, users may request:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Access</Text>
                  <Text className="text-base text-gray-700 leading-6">• Correction</Text>
                  <Text className="text-base text-gray-700 leading-6">• Deletion</Text>
                  <Text className="text-base text-gray-700 leading-6">• Restriction</Text>
                  <Text className="text-base text-gray-700 leading-6">• Portability</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-1">
                  Requests:
                </Text>
                <Text 
                  className="text-base text-blue-600 underline"
                  onPress={() => Linking.openURL('mailto:ironexsafe@gmail.com')}
                >
                  ironexsafe@gmail.com
                </Text>
              </View>
            </View>

            {/* SECTION 10: California Rights */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  California Rights (CCPA/CPRA)
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  California residents may request:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Access</Text>
                  <Text className="text-base text-gray-700 leading-6">• Deletion</Text>
                  <Text className="text-base text-gray-700 leading-6">• Correction</Text>
                  <Text className="text-base text-gray-700 leading-6">• Opt-out (we do not sell data)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Non-discrimination</Text>
                </View>
              </View>
            </View>

            {/* SECTION 11: GDPR Addendum */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">11</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  GDPR Addendum
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Legal bases include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Consent</Text>
                  <Text className="text-base text-gray-700 leading-6">• Contract</Text>
                  <Text className="text-base text-gray-700 leading-6">• Legitimate interest (platform safety)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Legal obligation</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx does not engage in automated decision-making producing legal effects.
                </Text>
              </View>
            </View>

            {/* SECTION 12: Changes */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Changes
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  We may update this document from time to time. Continued use constitutes acceptance.
                </Text>
              </View>
            </View>

            {/* SECTION 13: Contact */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-rose-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-rose-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Contact
                </Text>
              </View>
              <View className="ml-11">
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-base text-gray-700 mb-2">Token Land, LLC</Text>
                  <Text className="text-base text-gray-700 mb-2">7300 Biscayne Blvd, Suite 200</Text>
                  <Text className="text-base text-gray-700 mb-3">Miami, FL 33138, USA</Text>
                  <Text 
                    className="text-base text-blue-600 underline"
                    onPress={() => Linking.openURL('mailto:ironexsafe@gmail.com')}
                  >
                    ironexsafe@gmail.com
                  </Text>
                </View>
              </View>
            </View>

            {/* Notice Boxes */}
            <View className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                <Text className="text-lg font-semibold text-blue-800 ml-2">
                  Your Privacy Matters
                </Text>
              </View>
              <Text className="text-base text-blue-700 leading-6">
                IronEx does not sell personal data or use it for targeted advertising. We are committed to protecting your privacy and being transparent about data practices.
              </Text>
            </View>

            <View className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="sparkles" size={20} color="#7C3AED" />
                <Text className="text-lg font-semibold text-purple-800 ml-2">
                  AI & Safety
                </Text>
              </View>
              <Text className="text-base text-purple-700 leading-6">
                IronEx uses AI-assisted systems for safety screening and content moderation. AI outputs assist but do not replace human review. We do not sell data for AI training.
              </Text>
            </View>

            <View className="bg-green-50 rounded-xl p-6 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="globe" size={20} color="#059669" />
                <Text className="text-lg font-semibold text-green-800 ml-2">
                  Global Privacy Standards
                </Text>
              </View>
              <Text className="text-base text-green-700 leading-6">
                We comply with GDPR, CCPA/CPRA, and other privacy regulations. Users have rights to access, correct, delete, and control their personal data.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
