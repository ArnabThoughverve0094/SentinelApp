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
            <Text className="text-lg font-semibold text-gray-900">Terms of Use / EULA</Text>
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
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  IronEx Terms of Use / EULA
                </Text>
                <Text className="text-sm text-gray-600">
                  Last Updated: February 10, 2026
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              These Terms of Use / End User License Agreement ("Terms") govern your access to and use of the IronEx mobile application, website, and related services (collectively, the "Service"). By creating an account, installing, accessing, or using IronEx, you agree to be bound by these Terms and any updates thereto. If you do not agree, do not use the Service.
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

          {/* Terms sections */}
          <View className="space-y-4">
            {/* Section 1: Eligibility */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-blue-600 font-bold text-sm">1</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Eligibility
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You must be at least 18 years old to use IronEx. By using the Service, you represent that:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• You are 18 years of age or older</Text>
                  <Text className="text-base text-gray-700 leading-6">• You have the legal capacity to enter into these Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• If acting on behalf of an organization, you are authorized to bind that organization</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx is not intended for use by minors.
                </Text>
              </View>
            </View>

            {/* Section 2: Description of Service */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Description of the Service
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx is a sentiment-driven educational platform designed to enable safe engagement around antisemitism, antizionism, anti-Israel, and related topics.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Features may include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Educational content and modules</Text>
                  <Text className="text-base text-gray-700 leading-6">• Sentiment-selection engagement tools</Text>
                  <Text className="text-base text-gray-700 leading-6">• Live or scheduled digital events</Text>
                  <Text className="text-base text-gray-700 leading-6">• Aggregated and anonymized analytics</Text>
                  <Text className="text-base text-gray-700 leading-6">• AI-assisted safety screening and content classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• Third-party integrations</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  All outputs are contextual, non-determinative, and provided solely for educational and safety-oriented purposes.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We may modify, suspend, or discontinue any part of the Service at any time, in our sole discretion.
                </Text>
              </View>
            </View>

            {/* Section 3: Account Registration and Security */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Account Registration and Security
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Certain features require an account. You agree to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Provide accurate and complete information</Text>
                  <Text className="text-base text-gray-700 leading-6">• Keep your login credentials confidential</Text>
                  <Text className="text-base text-gray-700 leading-6">• Notify us immediately of unauthorized account use</Text>
                  <Text className="text-base text-gray-700 leading-6">• Accept responsibility for all activity conducted under your account</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  We may suspend or terminate accounts that violate these Terms.
                </Text>
              </View>
            </View>

            {/* Section 4: Zero Tolerance Policy */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Zero Tolerance for Objectionable Content and Abusive Behavior
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx maintains a zero-tolerance policy for objectionable content and abusive conduct.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Prohibited content and behavior include, but are not limited to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Harassment, threats, or intimidation</Text>
                  <Text className="text-base text-gray-700 leading-6">• Hate speech or demeaning content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Incitement to violence or harm</Text>
                  <Text className="text-base text-gray-700 leading-6">• Targeting of individuals or groups</Text>
                  <Text className="text-base text-gray-700 leading-6">• Attempts to abuse, evade, or manipulate safety mechanisms</Text>
                </View>
                <Text className="text-base font-medium text-red-600 leading-6">
                  Users who submit objectionable content or engage in abusive behavior may have their content removed and their accounts suspended or permanently terminated, without notice.
                </Text>
              </View>
            </View>

            {/* Section 5: Content Moderation */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-purple-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Content Moderation, Filtering, and Enforcement
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx employs a combination of automated systems and human review to detect, limit, and remove objectionable content.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Moderation measures include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Automated pre-screening and risk classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• User reporting ("flagging") mechanisms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Human review of flagged content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Account-level enforcement actions</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx reviews and acts on reports of objectionable content within 24 hours, including removal of content and suspension or termination of offending users where appropriate.
                </Text>
              </View>
            </View>

            {/* Section 6: User Reporting and Blocking */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Reporting and Blocking Tools
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base font-medium text-gray-900 mb-2">6.1 Flagging Content</Text>
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Users may report objectionable content through in-context reporting tools available within the Service. Reported content is reviewed by IronEx moderation.
                </Text>
                
                <Text className="text-base font-medium text-gray-900 mb-2">6.2 Blocking Users</Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Users may block other users who engage in abusive or objectionable behavior. Blocking:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Immediately removes the blocked user's content from the reporting user's feed</Text>
                  <Text className="text-base text-gray-700 leading-6">• Prevents further interaction between the users</Text>
                  <Text className="text-base text-gray-700 leading-6">• Notifies IronEx moderation for review</Text>
                </View>
              </View>
            </View>

            {/* Section 7: Acceptable Use */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Acceptable Use
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You agree not to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Use IronEx unlawfully or to harm others</Text>
                  <Text className="text-base text-gray-700 leading-6">• Submit objectionable or abusive content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Attempt to bypass or manipulate safety or sentiment-based mechanisms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Use bots, scrapers, or automated tools without written consent</Text>
                  <Text className="text-base text-gray-700 leading-6">• Reverse engineer, modify, or interfere with the Service</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Violations may result in suspension or termination.
                </Text>
              </View>
            </View>

            {/* Section 8: Intellectual Property */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Intellectual Property
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base font-medium text-gray-900 mb-2">8.1 IronEx Content</Text>
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  All content, software, logos, designs, and platform materials are owned by or licensed to Token Land, LLC. You may use IronEx content solely for personal, non-commercial purposes. Scraping, harvesting, or compiling content for datasets or model training is prohibited.
                </Text>
                
                <Text className="text-base font-medium text-gray-900 mb-2">8.2 User Submissions</Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  By submitting content (including sentiment selections), you grant IronEx a worldwide, royalty-free, sublicensable license to use, store, process, and analyze such content, including in anonymized or aggregated form.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx does not publicly attribute submissions to users unless explicitly disclosed by the user.
                </Text>
              </View>
            </View>

            {/* Section 9: Third-Party Services */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Third-Party Services
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  IronEx may link to third-party services. We are not responsible for their content or privacy practices.
                </Text>
              </View>
            </View>

            {/* Section 10: No Professional Advice */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  No Professional Advice
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  Content provided through IronEx is for informational purposes only and does not constitute legal, medical, political, or professional advice.
                </Text>
              </View>
            </View>

            {/* Section 11: Disclaimer of Warranties */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Disclaimer of Warranties
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  The Service is provided "AS IS" and "AS AVAILABLE." We disclaim all warranties, including accuracy, availability, security, or fitness for a particular purpose.
                </Text>
              </View>
            </View>

            {/* Section 12: Limitation of Liability */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Limitation of Liability
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  To the fullest extent permitted by law, Token Land, LLC shall not be liable for indirect, incidental, or consequential damages.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Our maximum liability shall not exceed the greater of: amounts paid by you in the prior 12 months, or $100 USD.
                </Text>
              </View>
            </View>

            {/* Section 13: Indemnification */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Indemnification
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  You agree to indemnify and hold harmless Token Land, LLC from claims arising out of your use of the Service or violation of these Terms.
                </Text>
              </View>
            </View>

            {/* Section 14: Termination */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-rose-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-rose-600 font-bold text-sm">14</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Termination
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  We may suspend or terminate access to IronEx at any time for violations of these Terms.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Upon termination, all rights granted to you cease.
                </Text>
              </View>
            </View>

            {/* Section 15: Governing Law */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-sky-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-sky-600 font-bold text-sm">15</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Governing Law
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law principles, and venue shall lie in Miami-Dade County, Florida, where legally permissible.
                </Text>
              </View>
            </View>

            {/* Section 16: Contact */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-fuchsia-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-fuchsia-600 font-bold text-sm">16</Text>
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
                    📍 7300 Biscayne Blvd, Suite 200, Miami, FL 33138, USA
                  </Text>
                </View>
              </View>
            </View>

            {/* Notice Boxes */}
            <View className="bg-red-50 rounded-xl p-6 border border-red-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text className="text-lg font-semibold text-red-800 ml-2">
                  Zero Tolerance Policy
                </Text>
              </View>
              <Text className="text-base text-red-700 leading-6">
                IronEx maintains a strict zero-tolerance policy for objectionable content, harassment, hate speech, and abusive behavior. Violations may result in immediate account termination.
              </Text>
            </View>

            <View className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text className="text-lg font-semibold text-blue-800 ml-2">
                  Important Notice
                </Text>
              </View>
              <Text className="text-base text-blue-700 leading-6">
                By using IronEx, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use / End User License Agreement.
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
                IronEx is committed to providing a safe, educational environment for discussing sensitive topics with sentiment-based engagement and advanced content moderation.
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
