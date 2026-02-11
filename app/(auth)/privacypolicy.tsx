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
                  Last Updated: February 10, 2026
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              This Privacy Policy explains how IronEx ("IronEx," "we," "us," or "our") collects, uses, shares, and protects information when you access or use the IronEx mobile application, website, and related services (collectively, the "Service").
            </Text>
            <View className="bg-white rounded-lg p-4">
              <Text className="text-sm text-gray-900 font-medium mb-1">
                IronEx is operated by:
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
            <Text className="text-base text-gray-700 leading-6 mt-3">
              By using IronEx, you acknowledge and agree to the practices described in this Privacy Policy.
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
                  <Text className="text-base font-medium text-gray-900 mb-2">1.1 Information You Provide</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    We may collect information you choose to provide, including:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Account information (e.g., name, email address, password)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Sentiment selections, reports, and other user inputs</Text>
                    <Text className="text-base text-gray-700 leading-6">• Content reports, flags, and block actions</Text>
                    <Text className="text-base text-gray-700 leading-6">• Communications with IronEx support</Text>
                    <Text className="text-base text-gray-700 leading-6">• Optional profile information</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 italic">
                    IronEx does not require users to submit real names or identifying biographical data beyond account credentials.
                  </Text>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.2 Information Collected Automatically</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    When you use IronEx, we may automatically collect:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Device and application information</Text>
                    <Text className="text-base text-gray-700 leading-6">• IP address</Text>
                    <Text className="text-base text-gray-700 leading-6">• Browser or operating system type</Text>
                    <Text className="text-base text-gray-700 leading-6">• Log data (timestamps, pages viewed, error reports)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Cookies or similar technologies</Text>
                    <Text className="text-base text-gray-700 leading-6">• Approximate location (derived from IP address only)</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 italic">
                    We do not collect precise geolocation data.
                  </Text>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.3 Information from Third Parties</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    We may receive limited information from:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Authentication providers</Text>
                    <Text className="text-base text-gray-700 leading-6">• Analytics and crash-reporting services</Text>
                    <Text className="text-base text-gray-700 leading-6">• Infrastructure and security service providers</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 italic">
                    We do not receive or purchase third-party data for advertising or profiling purposes.
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
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  We use collected information to:
                </Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Provide, operate, and maintain IronEx</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enable sentiment-based engagement features</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforce our Terms of Use and zero-tolerance content policy</Text>
                  <Text className="text-base text-gray-700 leading-6">• Detect, filter, review, and remove objectionable content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enable user safety tools (flagging and blocking)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Review reports of abusive behavior</Text>
                  <Text className="text-base text-gray-700 leading-6">• Act on content reports within required timeframes</Text>
                  <Text className="text-base text-gray-700 leading-6">• Improve platform performance and functionality</Text>
                  <Text className="text-base text-gray-700 leading-6">• Conduct internal research and analytics (including anonymized aggregation)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Ensure security, integrity, and abuse prevention</Text>
                  <Text className="text-base text-gray-700 leading-6">• Comply with legal obligations</Text>
                </View>
                <Text className="text-base font-medium text-gray-900">
                  IronEx does not use personal data for targeted advertising.
                </Text>
              </View>
            </View>

            {/* SECTION 3: Content Moderation */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Content Moderation, Safety, and Enforcement
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx processes certain user inputs and interactions for platform safety and moderation, including:
                </Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Reports ("flags") submitted by users</Text>
                  <Text className="text-base text-gray-700 leading-6">• Blocking actions initiated by users</Text>
                  <Text className="text-base text-gray-700 leading-6">• Automated screening and risk classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• Human review of flagged content</Text>
                </View>
                <Text className="text-base font-medium text-gray-900 mb-2">
                  When objectionable content is reported or detected:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Content may be restricted, removed, or hidden</Text>
                  <Text className="text-base text-gray-700 leading-6">• Associated accounts may be suspended or terminated</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforcement actions are reviewed and applied within 24 hours</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Blocking another user immediately removes that user's content from the reporting user's feed and prevents further interaction.
                </Text>
              </View>
            </View>

            {/* SECTION 4: Use of AI */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Use of Artificial Intelligence (AI)
                </Text>
              </View>
              <View className="ml-11">
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">4.1 AI Systems</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    IronEx uses AI-assisted systems to support:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Safety screening and content classification</Text>
                    <Text className="text-base text-gray-700 leading-6">• Detection of abusive or objectionable behavior</Text>
                    <Text className="text-base text-gray-700 leading-6">• Sentiment aggregation and analytics</Text>
                    <Text className="text-base text-gray-700 leading-6">• Platform performance optimization</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 italic">
                    AI outputs are non-determinative and are used to assist, not replace, human oversight.
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">4.2 AI Processing of Data</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    AI systems may process:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Sentiment selections</Text>
                    <Text className="text-base text-gray-700 leading-6">• User interaction patterns</Text>
                    <Text className="text-base text-gray-700 leading-6">• Flagged content metadata</Text>
                    <Text className="text-base text-gray-700 leading-6">• Anonymized or pseudonymized usage data</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6">
                    We minimize the use of identifiable personal data in AI processing wherever possible.
                  </Text>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">4.3 No Sale of Data for AI Training</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    IronEx does not sell personal data or user content for third-party AI training or model development.
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 5: Sharing of Information */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Sharing of Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  We may share information only as follows:
                </Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• With trusted service providers who support platform operations</Text>
                  <Text className="text-base text-gray-700 leading-6">• With analytics and security providers under contractual safeguards</Text>
                  <Text className="text-base text-gray-700 leading-6">• With legal authorities when required by law or valid legal process</Text>
                  <Text className="text-base text-gray-700 leading-6">• With successors in the event of a merger, acquisition, or restructuring</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  We may share anonymized or aggregated data that cannot reasonably identify individuals.
                </Text>
                <Text className="text-base font-semibold text-gray-900">
                  IronEx does not sell or share personal data for cross-context behavioral advertising.
                </Text>
              </View>
            </View>

            {/* SECTION 6: Cookies */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Cookies and Similar Technologies
                </Text>
              </View>
              <View className="ml-11">
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">6.1 Cookie Categories</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Strictly Necessary:</Text> authentication and core functionality</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Performance / Analytics:</Text> usage analysis and service improvement</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Functionality:</Text> user preferences and settings</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Optional Cookies:</Text> subject to consent where required</Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">6.2 Cookie Choices</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    You may manage cookies through:
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Browser settings</Text>
                    <Text className="text-base text-gray-700 leading-6">• In-app or website cookie settings panel (where applicable)</Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">6.3 EU / UK Consent</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Non-essential cookies are only set after explicit consent from users in the EEA or UK.
                  </Text>
                </View>

                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">6.4 Global Privacy Control (GPC)</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    IronEx honors valid CPRA-compliant Global Privacy Control signals.
                  </Text>
                </View>
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
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  We retain personal data only as long as necessary to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Provide the Service</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforce our Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Resolve disputes</Text>
                  <Text className="text-base text-gray-700 leading-6">• Meet legal obligations</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Reported or flagged content may be retained for safety, audit, or compliance purposes even after account termination, as permitted by law.
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
                  IronEx is not intended for users under 18 years old.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We do not knowingly collect personal data from minors. If such data is discovered, it will be deleted promptly.
                </Text>
              </View>
            </View>

            {/* SECTION 9: International Data Transfers */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  International Data Transfers
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Data may be processed and stored in the United States.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  For users in the EEA, UK, or Switzerland, transfers rely on Standard Contractual Clauses or other lawful safeguards. Copies of applicable safeguards are available upon request.
                </Text>
              </View>
            </View>

            {/* SECTION 10: User Rights */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Rights
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Depending on your jurisdiction, you may have the right to:
                </Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Access your personal data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Correct inaccurate data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Request deletion</Text>
                  <Text className="text-base text-gray-700 leading-6">• Restrict or object to processing</Text>
                  <Text className="text-base text-gray-700 leading-6">• Withdraw consent</Text>
                  <Text className="text-base text-gray-700 leading-6">• Request data portability</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Requests may be submitted to:
                </Text>
                <Text 
                  className="text-base text-blue-600 underline mb-2"
                  onPress={() => Linking.openURL('mailto:ironexsafe@gmail.com')}
                >
                  ironexsafe@gmail.com
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We respond within the timeframes required by applicable law.
                </Text>
              </View>
            </View>

            {/* SECTION 11: GDPR Addendum */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  GDPR Addendum (EEA / UK / Switzerland)
                </Text>
              </View>
              <View className="ml-11">
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">Legal Bases for Processing</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Consent</Text>
                    <Text className="text-base text-gray-700 leading-6">• Contractual necessity</Text>
                    <Text className="text-base text-gray-700 leading-6">• Legitimate interests (platform safety and integrity)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Legal obligations</Text>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-base font-medium text-gray-900 mb-2">Rights</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Access</Text>
                    <Text className="text-base text-gray-700 leading-6">• Rectification</Text>
                    <Text className="text-base text-gray-700 leading-6">• Erasure</Text>
                    <Text className="text-base text-gray-700 leading-6">• Restriction</Text>
                    <Text className="text-base text-gray-700 leading-6">• Objection</Text>
                    <Text className="text-base text-gray-700 leading-6">• Portability</Text>
                    <Text className="text-base text-gray-700 leading-6">• Withdrawal of consent</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to lodge a complaint with a Data Protection Authority</Text>
                  </View>
                </View>

                <Text className="text-base text-gray-700 leading-6">
                  IronEx does not engage in automated decision-making that produces legal or similarly significant effects.
                </Text>
              </View>
            </View>

            {/* SECTION 12: CCPA/CPRA Addendum */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  CCPA / CPRA Addendum (California)
                </Text>
              </View>
              <View className="ml-11">
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-900 mb-2">Categories of Data Collected</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Identifiers</Text>
                    <Text className="text-base text-gray-700 leading-6">• Internet activity</Text>
                    <Text className="text-base text-gray-700 leading-6">• Device and usage data</Text>
                    <Text className="text-base text-gray-700 leading-6">• Approximate location</Text>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-base font-medium text-gray-900 mb-2">California Rights</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Right to know</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to delete</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to correct</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to opt out of sale or sharing (we do not sell or share)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to limit use of sensitive data</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to non-discrimination</Text>
                  </View>
                </View>

                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Requests may be submitted to:
                </Text>
                <Text 
                  className="text-base text-blue-600 underline"
                  onPress={() => Linking.openURL('mailto:ironexsafe@gmail.com')}
                >
                  ironexsafe@gmail.com
                </Text>
              </View>
            </View>

            {/* SECTION 13: Changes to This Policy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Changes to This Policy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  We may update this Privacy Policy from time to time. Continued use of IronEx after changes indicates acceptance of the updated policy.
                </Text>
              </View>
            </View>

            {/* SECTION 14: Contact */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-rose-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-rose-600 font-bold text-sm">14</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Contact
                </Text>
              </View>
              <View className="ml-11">
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text 
                    className="text-base text-blue-600 underline mb-2"
                    onPress={() => Linking.openURL('mailto:ironexsafe@gmail.com')}
                  >
                    📧 ironexsafe@gmail.com
                  </Text>
                  <Text className="text-base text-gray-700">
                    📍 Token Land, LLC{'\n'}7300 Biscayne Blvd, Suite 200{'\n'}Miami, FL 33138, USA
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
                We are committed to protecting your privacy and being transparent about how we collect and use your information. IronEx does not sell personal data or use it for targeted advertising.
              </Text>
            </View>

            <View className="bg-green-50 rounded-xl p-6 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="lock-closed" size={20} color="#059669" />
                <Text className="text-lg font-semibold text-green-800 ml-2">
                  AI & Data Processing
                </Text>
              </View>
              <Text className="text-base text-green-700 leading-6">
                IronEx uses AI-assisted systems for safety screening and content moderation. AI outputs are non-determinative and support, not replace, human oversight. We do not sell data for third-party AI training.
              </Text>
            </View>

            <View className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="people" size={20} color="#7C3AED" />
                <Text className="text-lg font-semibold text-purple-800 ml-2">
                  User Safety Tools
                </Text>
              </View>
              <Text className="text-base text-purple-700 leading-6">
                IronEx provides robust safety features including content flagging, user blocking, and automated moderation. We review and act on reports within 24 hours to maintain a safe platform.
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
