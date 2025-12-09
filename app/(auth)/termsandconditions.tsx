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

export default function TermsOfUse(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header with gradient background */}
      <View className="bg-white shadow-sm pt-5 pb-3 border-b border-gray-200">
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Terms of Use</Text>
            <View className="w-10" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Hero section */}
          <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  IronEx Terms of Use
                </Text>
                <Text className="text-sm text-gray-600">
                  Last Updated: December 9, 2025
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              These Terms of Use ("Terms") govern your use of the IronEx website, mobile application, and related services ("Service"). By accessing or using IronEx, you agree to be bound by these Terms.
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
                onPress={() => Linking.openURL('mailto:IronEx@gmail.com')}
              >
                IronEx@gmail.com
              </Text>
            </View>
          </View>

          {/* Terms sections */}
          <View className="space-y-4">
            {/* Section 1: Acceptance of Terms */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-blue-600 font-bold text-sm">1</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Acceptance of These Terms
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  If you do not agree to these Terms, do not use the Service.
                </Text>
              </View>
            </View>

            {/* Section 2: Eligibility */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Eligibility
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You must be at least 18 years old to use IronEx. By using the Service, you represent that:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• You are 18 or older</Text>
                  <Text className="text-base text-gray-700 leading-6">• You have legal capacity to enter into these Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• If using on behalf of an organization, you are authorized to do so</Text>
                </View>
              </View>
            </View>

            {/* Section 3: Description of Service */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Description of the Service
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx provides a sentiment-driven educational platform designed for safe engagement around antisemitism, antizionism, anti-Israel, and related topics. Features may include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Educational content and modules</Text>
                  <Text className="text-base text-gray-700 leading-6">• Sentiment-selection engagement tools</Text>
                  <Text className="text-base text-gray-700 leading-6">• Live or scheduled digital events</Text>
                  <Text className="text-base text-gray-700 leading-6">• Aggregated analytics</Text>
                  <Text className="text-base text-gray-700 leading-6">• AI-powered safety and content classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• Third-party integrations</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  We may modify, suspend, or discontinue any part of the Service at any time, in our sole discretion.
                </Text>
              </View>
            </View>

            {/* Section 4: Account Security */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Account Security
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You will need to create an account to access certain features. You agree to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Provide accurate information</Text>
                  <Text className="text-base text-gray-700 leading-6">• Keep your password confidential (do not share)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Notify us immediately of unauthorized use</Text>
                  <Text className="text-base text-gray-700 leading-6">• Accept responsibility for all activities under your account</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  We may suspend or terminate accounts violating these Terms.
                </Text>
              </View>
            </View>

            {/* Section 5: Acceptable Use */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Acceptable Use
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You agree NOT to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Use IronEx unlawfully or to harm others</Text>
                  <Text className="text-base text-gray-700 leading-6">• Send abusive, hateful, or threatening inputs</Text>
                  <Text className="text-base text-gray-700 leading-6">• Attempt to bypass sentiment-only interactions</Text>
                  <Text className="text-base text-gray-700 leading-6">• Use bots or scrapers without written consent</Text>
                  <Text className="text-base text-gray-700 leading-6">• Reverse engineer or modify IronEx systems</Text>
                  <Text className="text-base text-gray-700 leading-6">• Interfere with the Service's functionality or security</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Violation may result in termination.
                </Text>
              </View>
            </View>

            {/* Section 6: Intellectual Property */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Intellectual Property Rights
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base font-medium text-gray-900 mb-2">6.1 IronEx Content</Text>
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  All platform content, including text, graphics, logos, data, software, and designs, belongs to Token Land, LLC, or under license from a third party. You may use IronEx content solely for personal, non-commercial purposes.
                </Text>
                
                <Text className="text-base font-medium text-gray-900 mb-2">6.2 User Content</Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  When submitting content (e.g., sentiment selections), you grant IronEx a worldwide, royalty-free, sublicensable license to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Use, store, process, and display such content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Analyze it, including in anonymized or aggregated forms</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  You represent your submissions are lawful and do not violate third-party rights, including trademark or other intellectual property rights.
                </Text>
              </View>
            </View>

            {/* Section 7: Third-Party Links */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Third-Party Links
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  IronEx may link to third-party websites or services. We are not responsible for their content or privacy practices.
                </Text>
              </View>
            </View>

            {/* Section 8: No Professional Advice */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  No Professional Advice
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  Content on IronEx is informational only and does not constitute legal, medical, or professional advice.
                </Text>
              </View>
            </View>

            {/* Section 9: Disclaimer of Warranties */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Disclaimer of Warranties
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx is provided "AS IS" and "AS AVAILABLE", without warranties of any kind, including:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Accuracy</Text>
                  <Text className="text-base text-gray-700 leading-6">• Uninterrupted service</Text>
                  <Text className="text-base text-gray-700 leading-6">• Security</Text>
                  <Text className="text-base text-gray-700 leading-6">• Compatibility</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Use is at your own risk.
                </Text>
              </View>
            </View>

            {/* Section 10: Limitation of Liability */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Limitation of Liability
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  To the fullest extent permitted by law, Token Land, LLC shall not be liable for:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Indirect, incidental, or consequential damages</Text>
                  <Text className="text-base text-gray-700 leading-6">• Loss of profits, data, or goodwill</Text>
                  <Text className="text-base text-gray-700 leading-6">• Unauthorized access to your data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Errors or omissions in the Service</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Maximum liability is the greater of: amounts paid by you in the prior 12 months, OR $100 USD.
                </Text>
              </View>
            </View>

            {/* Section 11: Indemnification */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Indemnification
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You agree to indemnify and hold harmless Token Land, LLC from claims arising out of:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Your use of IronEx</Text>
                  <Text className="text-base text-gray-700 leading-6">• Your violation of these Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Your violation of any rights of others</Text>
                </View>
              </View>
            </View>

            {/* Section 12: Changes to Terms */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Changes to Terms
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  We may update these Terms at any time. Continued use signifies acceptance.
                </Text>
              </View>
            </View>

            {/* Section 13: Termination */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Termination
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  We may suspend or terminate access to the Service immediately if you violate these Terms.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Upon termination, all rights granted to you cease.
                </Text>
              </View>
            </View>

            {/* Section 14: Governing Law */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-rose-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-rose-600 font-bold text-sm">14</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Governing Law
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  These Terms are governed by the laws of Florida, with exclusive jurisdiction in Miami-Dade County courts.
                </Text>
              </View>
            </View>

            {/* Section 15: Contact */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-sky-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-sky-600 font-bold text-sm">15</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Contact
                </Text>
              </View>
              <View className="ml-11">
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text 
                    className="text-base text-blue-600 underline mb-2"
                    onPress={() => Linking.openURL('mailto:IronExSafe@gmail.com')}
                  >
                    📧 IronExSafe@gmail.com
                  </Text>
                  <Text className="text-base text-gray-700">
                    📍 7300 Biscayne Blvd, Suite 200, Miami, FL 33138, USA
                  </Text>
                </View>
              </View>
            </View>

            {/* Notice Boxes */}
            <View className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text className="text-lg font-semibold text-blue-800 ml-2">
                  Important Notice
                </Text>
              </View>
              <Text className="text-base text-blue-700 leading-6">
                By using IronEx, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.
              </Text>
            </View>

            <View className="bg-green-50 rounded-xl p-6 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text className="text-lg font-semibold text-green-800 ml-2">
                  Safe Platform
                </Text>
              </View>
              <Text className="text-base text-green-700 leading-6">
                IronEx is committed to providing a safe, educational environment for discussing sensitive topics with sentiment-based engagement.
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
