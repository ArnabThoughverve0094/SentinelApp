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
                  Last Updated: December 9, 2025
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6">
              IronEx is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect information when you use the IronEx platform.
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
                  <Text className="text-base font-medium text-gray-900 mb-2">1.1 You Provide</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Account details (name, email, password)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Sentiment selections, reports, and inputs</Text>
                    <Text className="text-base text-gray-700 leading-6">• Communications with IronEx support</Text>
                    <Text className="text-base text-gray-700 leading-6">• Optional profile information</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.2 Automatically Collected</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Device data</Text>
                    <Text className="text-base text-gray-700 leading-6">• IP address</Text>
                    <Text className="text-base text-gray-700 leading-6">• Browser type</Text>
                    <Text className="text-base text-gray-700 leading-6">• Log files (pages visited, timestamps, error reports)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Cookies</Text>
                    <Text className="text-base text-gray-700 leading-6">• Approximate location (via IP)</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1.3 Third Parties</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">We may receive limited data from:</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Authentication services</Text>
                    <Text className="text-base text-gray-700 leading-6">• Analytics tools</Text>
                    <Text className="text-base text-gray-700 leading-6">• Service providers</Text>
                    <Text className="text-base text-gray-700 leading-6">• Partner integrations</Text>
                  </View>
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
                <Text className="text-base text-gray-700 leading-6 mb-3">We use data for:</Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Providing, maintaining, and improving IronEx</Text>
                  <Text className="text-base text-gray-700 leading-6">• Safety, moderation, and security</Text>
                  <Text className="text-base text-gray-700 leading-6">• Analytics (including anonymized aggregates)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Enforcing Terms of Use</Text>
                  <Text className="text-base text-gray-700 leading-6">• Legal compliance</Text>
                </View>
                <Text className="text-base text-gray-900 font-semibold">
                  We do not sell personal data.
                </Text>
              </View>
            </View>

            {/* SECTION 3: Sharing Information */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Sharing Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">We may share information with:</Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Trusted service providers</Text>
                  <Text className="text-base text-gray-700 leading-6">• Analytics providers</Text>
                  <Text className="text-base text-gray-700 leading-6">• Legal authorities (if required)</Text>
                  <Text className="text-base text-gray-700 leading-6">• Successors in the event of merger or acquisition</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Data may be shared in anonymized or aggregated form.
                </Text>
              </View>
            </View>

            {/* SECTION 4: Cookies Policy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Cookies Policy
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Cookie Categories</Text>
                  <View className="space-y-2">
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Strictly Necessary</Text> – authentication, platform operations</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Performance/Analytics</Text> – understand usage, improve service</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Functionality</Text> – remember settings, preferences</Text>
                    <Text className="text-base text-gray-700 leading-6">• <Text className="font-medium">Optional Cookies</Text> – require user consent (EEA/UK)</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Your Cookie Choices</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    You may manage cookies via browser settings or the on-site Cookie Settings panel.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">EU/UK Consent Requirement</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Non-essential cookies are only set when you provide explicit consent.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">GPC Signals</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    We honor CPRA-compliant Global Privacy Control signals.
                  </Text>
                </View>
                <View className="bg-gray-50 rounded-lg p-4 mt-2">
                  <Text className="text-sm font-medium text-gray-900 mb-2">Cookies & Consent Banner Text</Text>
                  <Text className="text-sm text-gray-700 leading-5 mb-3">
                    <Text className="font-medium">GDPR-Compliant Banner:</Text> IronEx uses cookies to improve your experience and analyze usage. Click "Accept" to allow all cookies, or "Customize" to choose preferences. See our Privacy Policy for details.
                  </Text>
                  <Text className="text-xs text-gray-600 mb-3">
                    Buttons: Accept All | Customize Settings | Reject Non-Essential
                  </Text>
                  <Text className="text-sm text-gray-700 leading-5">
                    <Text className="font-medium">U.S. Banner:</Text> IronEx uses cookies to operate and improve the Service. By continuing, you agree to our use of cookies.
                  </Text>
                  <Text className="text-xs text-gray-600 mt-1">
                    Buttons: OK | Learn More
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 5: AI-Specific Disclosures */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  AI-Specific Disclosures
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">1. Use of AI Systems</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    IronEx uses artificial intelligence ("AI"), including machine learning and automated models, for:
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Safety screening</Text>
                    <Text className="text-base text-gray-700 leading-6">• Content classification</Text>
                    <Text className="text-base text-gray-700 leading-6">• Sentiment aggregation</Text>
                    <Text className="text-base text-gray-700 leading-6">• Platform analytics</Text>
                    <Text className="text-base text-gray-700 leading-6">• Enhancing user experience</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 mt-2">
                    IronEx does not use AI to make decisions with legal or significant personal effects without human oversight.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">2. AI Processing of Personal Data</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">AI Systems may process:</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Sentiment selections</Text>
                    <Text className="text-base text-gray-700 leading-6">• Platform interactions</Text>
                    <Text className="text-base text-gray-700 leading-6">• Usage patterns</Text>
                    <Text className="text-base text-gray-700 leading-6">• Anonymized or pseudonymized data</Text>
                  </View>
                  <Text className="text-base text-gray-700 leading-6 mt-2">
                    We minimize identifiable data processed by AI wherever possible.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">3. No Sale of Data for AI Training</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    IronEx does NOT sell personal data for third-party AI training.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">4. Automated Monitoring</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    AI Systems may flag unsafe or abusive content for human review. This improves safety and protects users.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">5. AI User Rights (GDPR Users)</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                    EEA/UK users may request:
                  </Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Information about AI processing</Text>
                    <Text className="text-base text-gray-700 leading-6">• Objection to certain automated processes</Text>
                    <Text className="text-base text-gray-700 leading-6">• Human review</Text>
                  </View>
                  <Text 
                    className="text-base text-blue-600 underline"
                    onPress={() => Linking.openURL('mailto:IronExSafe@gmail.com')}
                  >
                    Contact: IronExSafe@gmail.com
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 6: Children's Privacy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Children's Privacy
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  IronEx is not intended for users under 18 years old.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We do not knowingly collect data from minors under 18. If such data is discovered, it will be deleted.
                </Text>
              </View>
            </View>

            {/* SECTION 7: International Transfers */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  International Transfers
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  Data may be processed in the United States. For EU/UK users, transfers rely on Standard Contractual Clauses or other lawful mechanisms.
                </Text>
              </View>
            </View>

            {/* SECTION 8: User Rights */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Rights
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Depending on your jurisdiction, you may have rights to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Access your data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Correct your data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Delete your data</Text>
                  <Text className="text-base text-gray-700 leading-6">• Restrict or object to processing</Text>
                  <Text className="text-base text-gray-700 leading-6">• Withdraw consent</Text>
                  <Text className="text-base text-gray-700 leading-6">• Request portability</Text>
                </View>
                <Text 
                  className="text-base text-blue-600 underline"
                  onPress={() => Linking.openURL('mailto:IronExSafe@gmail.com')}
                >
                  Submit requests to: IronExSafe@gmail.com
                </Text>
              </View>
            </View>

            {/* SECTION 9: GDPR Addendum */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  GDPR Addendum (EU/UK Users)
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  This Addendum applies to individuals in the EEA, UK, and Switzerland.
                </Text>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Legal Bases</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">Processing is based on:</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Consent</Text>
                    <Text className="text-base text-gray-700 leading-6">• Contractual necessity</Text>
                    <Text className="text-base text-gray-700 leading-6">• Legitimate interests</Text>
                    <Text className="text-base text-gray-700 leading-6">• Legal obligations</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Your GDPR Rights</Text>
                  <View className="space-y-1">
                    <Text className="text-base text-gray-700 leading-6">• Access</Text>
                    <Text className="text-base text-gray-700 leading-6">• Rectification</Text>
                    <Text className="text-base text-gray-700 leading-6">• Erasure</Text>
                    <Text className="text-base text-gray-700 leading-6">• Restriction</Text>
                    <Text className="text-base text-gray-700 leading-6">• Objection</Text>
                    <Text className="text-base text-gray-700 leading-6">• Portability</Text>
                    <Text className="text-base text-gray-700 leading-6">• Withdrawal of consent</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to complain to your Data Protection Authority</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Automated Decision-Making</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    IronEx does not employ automated decisions with legal effects.
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 10: CCPA/CPRA Addendum */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  CCPA / CPRA Addendum (California Users)
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Categories of Data Collected</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Identifiers, IP address, usage data, approximate geolocation, analytics.
                  </Text>
                  <Text className="text-base text-gray-900 font-semibold mt-2">
                    We do not sell personal data.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">California Rights</Text>
                  <View className="space-y-1 mb-2">
                    <Text className="text-base text-gray-700 leading-6">• Right to know</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to delete</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to correct</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to opt out of sale/sharing (we do not sell/share)</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to limit sensitive data use</Text>
                    <Text className="text-base text-gray-700 leading-6">• Right to non-discrimination</Text>
                  </View>
                  <Text 
                    className="text-base text-blue-600 underline"
                    onPress={() => Linking.openURL('mailto:IronExSafe@gmail.com')}
                  >
                    Requests: IronExSafe@gmail.com
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Section */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
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
                <Ionicons name="analytics" size={20} color="#7C3AED" />
                <Text className="text-lg font-semibold text-purple-800 ml-2">
                  AI Transparency
                </Text>
              </View>
              <Text className="text-base text-purple-700 leading-6">
                IronEx uses AI to enhance safety and user experience. We do not sell your data for AI training and maintain human oversight for important decisions.
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
