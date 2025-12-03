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
            <Text className="text-lg font-semibold text-gray-900">Privacy Policy</Text>
            <View className="w-10" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Hero section with gradient background */}
          <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  IronExSafe Privacy Policy
                </Text>
                <Text className="text-sm text-gray-600">
                  Effective Date: October 7, 2025
                </Text>
                <Text className="text-sm text-gray-600">
                  Last Updated: October 7, 2025
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6">
              IronExSafe ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect information when you use the IronExSafe platform ("Platform").
            </Text>
          </View>

          {/* Privacy sections with enhanced styling */}
          <View className="space-y-4">
            {/* Section 1 */}
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
                  <Text className="text-base font-medium text-gray-900 mb-2">Account Information:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    When you register, we collect your name, email, and other basic account details.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">User Submissions:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    If you submit a report, we collect the content of that report and any supporting information you provide.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Device & Usage Data:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    We may collect IP addresses, browser type, operating system, and log data to help us operate and secure the Platform.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Cookies & Tracking:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    We use cookies and similar technologies to improve your user experience.
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  How We Use Your Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  We use the information we collect to:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Provide, maintain, and improve the Platform.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Review reports for compliance with our Terms of Use.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Communicate with you about your account, updates, and services.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforce our Terms of Use and comply with applicable law.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Analyze usage trends and enhance security.</Text>
                </View>
                <Text className="text-base text-gray-900 font-medium mt-4">
                  We do not sell your personal information to third parties.
                </Text>
              </View>
            </View>

            {/* Section 3 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  How We Share Your Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  We may share your information only in the following cases:
                </Text>
                <View className="space-y-4">
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-2">With Service Providers:</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      Trusted vendors who help us operate the Platform (e.g., hosting, analytics, payment processing, if applicable).
                    </Text>
                  </View>
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-2">For Legal Reasons:</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      To comply with a legal obligation, protect against fraud or security issues, or defend the rights of IronExSafe, our users, or the public.
                    </Text>
                  </View>
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-2">With Your Consent:</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      If you explicitly authorize us to share specific information.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 4 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Public Reporting and Anonymity
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • Reports you submit may be approved and posted publicly on the IronExSafe timeline.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Identifying information is not displayed publicly unless you choose to include it.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • You may submit reports anonymously.
                </Text>
              </View>
            </View>

            {/* Section 5 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Data Retention
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  We retain personal information only as long as necessary to provide the Platform, comply with legal obligations, resolve disputes, and enforce agreements.
                </Text>
              </View>
            </View>

            {/* Section 6 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Your Rights
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Depending on where you live, you may have specific rights under privacy laws:
                </Text>
                <View className="space-y-4">
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-2">GDPR (EU/UK):</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      Right to access, correct, delete, restrict processing, and data portability.
                    </Text>
                  </View>
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-2">CCPA (California):</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      Right to know, delete, and opt out of the sale of personal information.
                    </Text>
                  </View>
                  <View>
                    <Text className="text-base font-medium text-gray-900 mb-2">General:</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      You may request account deletion at any time by contacting us.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 7 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Children's Privacy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  IronExSafe is not directed to children under 13 (or 16 in the EU/UK). We do not knowingly collect personal information from children.
                </Text>
              </View>
            </View>

            {/* Section 8 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Data Security
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  We use reasonable administrative, technical, and physical safeguards to protect personal information. However, no system is completely secure, and we cannot guarantee absolute protection.
                </Text>
              </View>
            </View>

            {/* Section 9 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  International Users
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  If you are located outside the United States, your information may be processed and stored in the United States. As a registered User and using IronExSafe, you consent to this.
                </Text>
              </View>
            </View>

            {/* Section 10 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Changes to this Policy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  We may update this Privacy Policy from time to time. We will post the updated version on this page and update the effective date.
                </Text>
              </View>
            </View>

            {/* Section 11 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Contact Us
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-4">
                  If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at:
                </Text>
                <View className="bg-gray-50 rounded-lg p-4">
                  <View className="mb-2">
                                    <Text className="text-base text-gray-900 font-medium">
                                      📧 Email:{' '}
                                      <Text 
                                        className="text-base text-blue-600 underline"
                                        onPress={() => {
                                          const email = 'SentinelTerms@gmail.com';
                                          const subject = 'Terms of Use Inquiry';
                                          const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
                                          Linking.openURL(url).catch(err => console.error('Error opening email:', err));
                                        }}
                                      >
                                        SentinelTerms@gmail.com
                                      </Text>
                                    </Text>
                                  </View>
                  <Text className="text-base text-gray-700 mb-2">
                    📍 Address: C/O David J. Hart PA
                  </Text>
                  <Text className="text-base text-gray-700">
                    7300 Biscayne Blvd Suite 200, Miami FL 33138 USA
                  </Text>
                </View>
              </View>
            </View>

            {/* Important Privacy Notice */}
            <View className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                <Text className="text-lg font-semibold text-blue-800 ml-2">
                  Your Privacy Matters
                </Text>
              </View>
              <Text className="text-base text-blue-700 leading-6">
                We are committed to protecting your privacy and being transparent about how we collect and use your information. Your trust is important to us.
              </Text>
            </View>

            {/* Data Protection Notice */}
            <View className="bg-green-50 rounded-xl p-6 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="lock-closed" size={20} color="#059669" />
                <Text className="text-lg font-semibold text-green-800 ml-2">
                  Data Protection
                </Text>
              </View>
              <Text className="text-base text-green-700 leading-6 mb-3">
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.
              </Text>
              <Text className="text-base text-green-700 leading-6">
                However, please remember that no method of transmission over the internet or electronic storage is 100% secure.
              </Text>
            </View>

            {/* Rights Notice */}
            <View className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="person-circle" size={20} color="#7C3AED" />
                <Text className="text-lg font-semibold text-purple-800 ml-2">
                  Know Your Rights
                </Text>
              </View>
              <Text className="text-base text-purple-700 leading-6">
                You have the right to access, correct, or delete your personal information. Contact us if you wish to exercise any of these rights or have questions about your data.
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