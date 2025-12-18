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
                  IronEx Privacy Policy
                </Text>
                <Text className="text-sm text-gray-600">
                  Last Updated: [Insert Date]{'\n'}
                  Effective Date: [Insert Date]
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              This Privacy Policy explains how IronEx ("we," "us," "our") collects, uses, shares, and protects personal information when you use the IronEx mobile application and related services (collectively, the "App").
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              IronEx is an educational and safety-focused platform designed to help users understand and document incidents involving antisemitism. We take user privacy seriously and collect only the minimum information necessary to operate the App responsibly under our IronExSafe moderation framework.
            </Text>
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
                  <Text className="text-base font-medium text-gray-900 mb-2">A. Information You Provide Directly</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Account Information:</Text> Email address, password, or third-party login credentials</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">User Submissions:</Text> Incident reports, media (images, text), suggested educational content, or contextual descriptions</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Voluntary Location Information:</Text> If you manually attach a location to a submission</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Communications:</Text> Emails or messages you send to our support team</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">B. Automatically Collected Information</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Device Information:</Text> Device model, operating system, app version</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">App Usage Data:</Text> Button clicks, session length, navigation patterns</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Diagnostics:</Text> Crash logs, performance metrics</Text>
                    <Text className="text-base text-gray-700 leading-6">• Non-identifying analytics to improve user experience</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 mt-3 italic">
                    We do not collect biometric data, financial information, or other sensitive categories unless voluntarily included in a user submission.
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
                  How We Use Your Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">We use the information collected to:</Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Review and moderate user submissions under IronExSafe</Text>
                  <Text className="text-base text-gray-700 leading-6">• Provide educational content and display curated materials</Text>
                  <Text className="text-base text-gray-700 leading-6">• Operate and improve the App and its features</Text>
                  <Text className="text-base text-gray-700 leading-6">• Ensure community safety and prevent harmful content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Respond to user support requests</Text>
                  <Text className="text-base text-gray-700 leading-6">• Comply with legal obligations</Text>
                </View>
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-base font-semibold text-gray-900 mb-2">
                    We do not use your information for:
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Advertising</Text>
                    <Text className="text-base text-gray-700 leading-6">• Political targeting</Text>
                    <Text className="text-base text-gray-700 leading-6">• Selling personal data</Text>
                    <Text className="text-base text-gray-700 leading-6">• Automated decision-making that produces legal effects</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION 3: Legal Basis for Processing (GDPR) */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Legal Basis for Processing (GDPR)
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  If you are located in the EU, UK, or EEA, we process your information on the following legal bases:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Consent</Text> (e.g., when you create an account or submit content)</Text>
                  <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Legitimate Interests</Text> (e.g., improving security, moderating harmful content)</Text>
                  <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Performance of a Contract</Text> (e.g., delivering App functionality)</Text>
                  <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Compliance with Legal Obligations</Text></Text>
                </View>
              </View>
            </View>

            {/* SECTION 4: Sharing Information */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Sharing Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  We do not sell or rent your personal information.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-3">We may share information only with:</Text>
                
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">A. Service Providers</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">Trusted partners that help us operate the App, including:</Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Cloud hosting services</Text>
                    <Text className="text-base text-gray-700 leading-6">• App analytics providers</Text>
                    <Text className="text-base text-gray-700 leading-6">• Content moderation tools</Text>
                    <Text className="text-base text-gray-700 leading-6">• Error logging services</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 italic">
                    All service providers are bound by confidentiality and may not use your data for independent purposes.
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">B. Legal Compliance</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">We may disclose information if required by:</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Law enforcement</Text>
                    <Text className="text-base text-gray-700 leading-6">• Court order</Text>
                    <Text className="text-base text-gray-700 leading-6">• Applicable regulations</Text>
                    <Text className="text-base text-gray-700 leading-6">• To prevent harm or abuse</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">C. Safety & Abuse Prevention</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    If a submission indicates credible harm, threats, or dangerous illegal activity, we may act to ensure safety.
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 5: User-Generated Content */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User-Generated Content (UGC)
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">All content submitted to IronEx is:</Text>
                <View className="space-y-1 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Reviewed by moderators</Text>
                  <Text className="text-base text-gray-700 leading-6">• Assessed under IronExSafe standards</Text>
                  <Text className="text-base text-gray-700 leading-6">• Potentially anonymized to protect user identity</Text>
                  <Text className="text-base text-gray-700 leading-6">• Displayed only in educational context</Text>
                </View>
                <Text className="text-base font-medium text-gray-900 mb-2">We reserve the right to:</Text>
                <View className="space-y-1">
                  <Text className="text-base text-gray-700 leading-6">• Remove harmful submissions</Text>
                  <Text className="text-base text-gray-700 leading-6">• Decline to publish inappropriate content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Edit metadata for clarity (but never alter your words without notice)</Text>
                </View>
              </View>
            </View>

            {/* SECTION 6: International Data Transfers */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  International Data Transfers
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">Your information may be processed in:</Text>
                <View className="space-y-1 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• The United States</Text>
                  <Text className="text-base text-gray-700 leading-6">• The European Union</Text>
                  <Text className="text-base text-gray-700 leading-6">• The United Kingdom</Text>
                  <Text className="text-base text-gray-700 leading-6">• Australia</Text>
                  <Text className="text-base text-gray-700 leading-6">• Other jurisdictions where our service providers operate</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  We use standard contractual clauses (SCCs) or equivalent safeguards for GDPR compliance.
                </Text>
              </View>
            </View>

            {/* SECTION 7: Data Retention */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Data Retention
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">We retain your information only as long as necessary to:</Text>
                <View className="space-y-1 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Operate the App</Text>
                  <Text className="text-base text-gray-700 leading-6">• Provide educational context</Text>
                  <Text className="text-base text-gray-700 leading-6">• Comply with legal obligations</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  You may request deletion of your data at any time (see Section 9).
                </Text>
              </View>
            </View>

            {/* SECTION 8: Children's Privacy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Children's Privacy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  IronEx is not intended for users under the age of 18.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We do not knowingly collect personal information from minors. If we learn a minor has provided personal information, we will delete it promptly.
                </Text>
              </View>
            </View>

            {/* SECTION 9: Your Rights */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Your Rights
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Depending on your jurisdiction, you may have the right to:
                </Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Access your personal information</Text>
                  <Text className="text-base text-gray-700 leading-6">• Correct inaccurate information</Text>
                  <Text className="text-base text-gray-700 leading-6">• Request deletion</Text>
                  <Text className="text-base text-gray-700 leading-6">• Withdraw consent</Text>
                  <Text className="text-base text-gray-700 leading-6">• Request data portability</Text>
                  <Text className="text-base text-gray-700 leading-6">• Object to processing (GDPR)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Opt out of data sale (CCPA — IronEx does not sell data)</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Requests may be submitted at:
                </Text>
                <Text 
                  className="text-base text-blue-600 underline"
                  onPress={() => Linking.openURL('mailto:info@ironex.app')}
                >
                  info@ironex.app
                </Text>
              </View>
            </View>

            {/* SECTION 10: Security Measures */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Security Measures
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">We use:</Text>
                <View className="space-y-1 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Encryption in transit and at rest</Text>
                  <Text className="text-base text-gray-700 leading-6">• Access controls</Text>
                  <Text className="text-base text-gray-700 leading-6">• Separation of personal data from content data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Manual review of sensitive submissions</Text>
                  <Text className="text-base text-gray-700 leading-6">• Regular monitoring for vulnerabilities</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 italic">
                  No system is 100% secure, but we take industry-standard steps to protect your information.
                </Text>
              </View>
            </View>

            {/* SECTION 11: Third-Party Links */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Third-Party Links
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  IronEx may include links to educational resources hosted on external websites.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We are not responsible for the privacy practices of third-party sites.
                </Text>
              </View>
            </View>

            {/* SECTION 12: Changes to This Policy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Changes to This Policy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  We may update this Privacy Policy occasionally.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Changes will be posted within the App and on our website with the "Last Updated" date.
                </Text>
              </View>
            </View>

            {/* SECTION 13: Contact Us */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Contact Us
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  For privacy questions or requests:
                </Text>
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">IronEx Privacy Team</Text>
                  <Text 
                    className="text-base text-blue-600 underline mb-2"
                    onPress={() => Linking.openURL('mailto:info@ironex.app')}
                  >
                    📧 info@ironex.app
                  </Text>
                  <Text 
                    className="text-base text-blue-600 underline mb-2"
                    onPress={() => Linking.openURL('https://ironex.app')}
                  >
                    🌐 ironex.app
                  </Text>
                  <Text className="text-base text-gray-700">
                    📍 C/O David J Hart PA{'\n'}7300 Biscayne Blvd Suite 200{'\n'}Miami, FL 33138, USA
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
                We are committed to protecting your privacy and being transparent about how we collect and use your information. Your trust is important to us.
              </Text>
            </View>

            <View className="bg-green-50 rounded-xl p-6 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="lock-closed" size={20} color="#059669" />
                <Text className="text-lg font-semibold text-green-800 ml-2">
                  Data Security
                </Text>
              </View>
              <Text className="text-base text-green-700 leading-6 mb-3">
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.
              </Text>
              <Text className="text-base text-green-700 leading-6">
                However, please remember that no method of transmission over the internet or electronic storage is 100% secure.
              </Text>
            </View>

            <View className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={20} color="#7C3AED" />
                <Text className="text-lg font-semibold text-purple-800 ml-2">
                  Educational Purpose
                </Text>
              </View>
              <Text className="text-base text-purple-700 leading-6">
                IronEx is designed as an educational and safety-focused platform. All user submissions are reviewed and used responsibly to document and understand incidents of antisemitism.
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
