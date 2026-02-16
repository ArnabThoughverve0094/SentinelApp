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
      
      {/* Header */}
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
                  Terms of Use / EULA
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
                  You must be at least 18 years old to use IronEx.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  By using the Service, you represent that:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• You are 18 years of age or older</Text>
                  <Text className="text-base text-gray-700 leading-6">• You have the legal capacity to enter into these Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• If acting on behalf of an organization, you are authorized to bind that organization</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx is not intended for minors.
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
                  IronEx is a sentiment-driven educational platform designed to enable structured engagement around antisemitism, antizionism, anti-Israel, and related subject matter.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Features may include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Educational content and modules</Text>
                  <Text className="text-base text-gray-700 leading-6">• Sentiment-selection engagement tools</Text>
                  <Text className="text-base text-gray-700 leading-6">• Live or scheduled digital events</Text>
                  <Text className="text-base text-gray-700 leading-6">• Aggregated and anonymized analytics</Text>
                  <Text className="text-base text-gray-700 leading-6">• AI-assisted screening and content classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• Third-party integrations</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  All outputs are contextual, non-determinative, and provided solely for educational and safety-oriented purposes.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We may modify, suspend, or discontinue any part of the Service at any time in our sole discretion.
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
                  Certain features require account registration.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  You agree to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Provide accurate and complete information</Text>
                  <Text className="text-base text-gray-700 leading-6">• Maintain confidentiality of login credentials</Text>
                  <Text className="text-base text-gray-700 leading-6">• Notify us immediately of unauthorized access</Text>
                  <Text className="text-base text-gray-700 leading-6">• Accept responsibility for all activity under your account</Text>
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
                  Zero Tolerance for Objectionable Content
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx maintains a zero-tolerance policy for objectionable content and abusive conduct.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Prohibited content includes:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Harassment, threats, intimidation</Text>
                  <Text className="text-base text-gray-700 leading-6">• Hate speech</Text>
                  <Text className="text-base text-gray-700 leading-6">• Incitement to violence</Text>
                  <Text className="text-base text-gray-700 leading-6">• Targeting individuals or protected groups</Text>
                  <Text className="text-base text-gray-700 leading-6">• Attempts to manipulate moderation systems</Text>
                </View>
                <Text className="text-base font-medium text-red-600 leading-6">
                  Violations may result in removal, suspension, or permanent termination without notice.
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
                  Content Moderation and Enforcement
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx uses automated systems and human review to detect and remove objectionable content.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Moderation measures include:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Automated risk classification</Text>
                  <Text className="text-base text-gray-700 leading-6">• User reporting ("flagging")</Text>
                  <Text className="text-base text-gray-700 leading-6">• Human review</Text>
                  <Text className="text-base text-gray-700 leading-6">• Account-level enforcement</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  IronEx reviews reported content within 24 hours.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx does not undertake a duty to monitor all user content and does not guarantee removal of all objectionable material. Moderation decisions are made in IronEx's sole discretion.
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
                  User Reporting and Blocking
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Users may:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Flag content for moderation review</Text>
                  <Text className="text-base text-gray-700 leading-6">• Block other users</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Blocking removes the blocked user's content from the reporting user's feed and prevents further interaction.
                </Text>
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
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  You agree not to:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Use the Service unlawfully</Text>
                  <Text className="text-base text-gray-700 leading-6">• Post defamatory or infringing content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Use bots or scraping tools</Text>
                  <Text className="text-base text-gray-700 leading-6">• Reverse engineer the Service</Text>
                  <Text className="text-base text-gray-700 leading-6">• Circumvent moderation mechanisms</Text>
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
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  All platform materials are owned by or licensed to Token Land, LLC.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  You may use IronEx content solely for personal, non-commercial purposes.
                </Text>
              </View>
            </View>

            {/* Section 9: User-Generated Content */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User-Generated Content; Section 230 Protection
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  IronEx is an "interactive computer service" under 47 U.S.C. § 230.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  You acknowledge:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• IronEx does not create user-generated content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Users are solely responsible for submitted content</Text>
                  <Text className="text-base text-gray-700 leading-6">• IronEx is not the publisher or speaker of user-generated content</Text>
                  <Text className="text-base text-gray-700 leading-6">• IronEx does not endorse user content</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  To the fullest extent permitted by law, IronEx shall not be liable for user-generated content, including claims of defamation, harassment, or unlawful speech.
                </Text>
              </View>
            </View>

            {/* Section 10: User Submissions License */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-amber-600 font-bold text-sm">10</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Submissions License
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  By submitting content (including sentiment selections), you grant IronEx a worldwide, royalty-free, sublicensable license to use, store, process, analyze, and display such content, including in anonymized or aggregated form.
                </Text>
              </View>
            </View>

            {/* Section 11: Third-Party Services */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-lime-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lime-600 font-bold text-sm">11</Text>
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

            {/* Section 12: No Professional Advice */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  No Professional Advice; No Reliance
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Content provided through IronEx is for informational and educational purposes only.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  IronEx does not provide legal, medical, political, or professional advice.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  You acknowledge that reliance on any content is at your own risk.
                </Text>
              </View>
            </View>

            {/* Section 13: Disclaimer of Warranties */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Disclaimer of Warranties
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  The Service is provided "AS IS" and "AS AVAILABLE."
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  We disclaim all warranties including accuracy, availability, security, and fitness for a particular purpose.
                </Text>
              </View>
            </View>

            {/* Section 14: Assumption of Risk */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-rose-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-rose-600 font-bold text-sm">14</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Assumption of Risk
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  You acknowledge that the Service may contain controversial or sensitive subject matter and agree to use the Service at your own discretion and risk.
                </Text>
              </View>
            </View>

            {/* Section 15: Limitation of Liability */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-sky-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-sky-600 font-bold text-sm">15</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Limitation of Liability
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  To the fullest extent permitted by law, Token Land, LLC shall not be liable for indirect, incidental, consequential, special, or punitive damages.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-1">
                  Maximum liability shall not exceed the greater of:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• $100 USD, or</Text>
                  <Text className="text-base text-gray-700 leading-6">• Amounts paid by you in the prior 12 months</Text>
                </View>
              </View>
            </View>

            {/* Section 16: Indemnification */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-fuchsia-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-fuchsia-600 font-bold text-sm">16</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Indemnification
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  You agree to defend, indemnify, and hold harmless Token Land, LLC and its officers, directors, managers, employees, contractors, affiliates, successors, and assigns from any claims, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Your user-generated content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violation of these Terms</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violation of law</Text>
                  <Text className="text-base text-gray-700 leading-6">• Infringement of third-party rights</Text>
                  <Text className="text-base text-gray-700 leading-6">• Disputes between you and other users</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx reserves the right to assume exclusive defense of any matter subject to indemnification.
                </Text>
              </View>
            </View>

            {/* Section 17: Binding Arbitration */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-yellow-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-yellow-600 font-bold text-sm">17</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Binding Arbitration; Class Action Waiver
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  All disputes shall be resolved exclusively through binding arbitration administered by the American Arbitration Association.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  Arbitration shall take place in Miami-Dade County, Florida.
                </Text>
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  You agree:
                </Text>
                <View className="space-y-2 mb-3">
                  <Text className="text-base text-gray-700 leading-6">• Disputes are resolved on an individual basis only</Text>
                  <Text className="text-base text-gray-700 leading-6">• No class actions</Text>
                  <Text className="text-base text-gray-700 leading-6">• Waiver of jury trial</Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  IronEx may seek injunctive relief in court for misuse or intellectual property violations.
                </Text>
              </View>
            </View>

            {/* Section 18: Governing Law */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">18</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Governing Law
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  These Terms are governed by the laws of the State of Florida.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  Venue shall lie in Miami-Dade County, Florida, where legally permissible.
                </Text>
              </View>
            </View>

            {/* Section 19: Survival */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">19</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Survival
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-2">
                  The following provisions survive termination:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Intellectual Property</Text>
                  <Text className="text-base text-gray-700 leading-6">• User-Generated Content</Text>
                  <Text className="text-base text-gray-700 leading-6">• Disclaimers</Text>
                  <Text className="text-base text-gray-700 leading-6">• Limitation of Liability</Text>
                  <Text className="text-base text-gray-700 leading-6">• Indemnification</Text>
                  <Text className="text-base text-gray-700 leading-6">• Arbitration</Text>
                  <Text className="text-base text-gray-700 leading-6">• Governing Law</Text>
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

            <View className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="warning" size={20} color="#D97706" />
                <Text className="text-lg font-semibold text-amber-800 ml-2">
                  Section 230 Protection
                </Text>
              </View>
              <Text className="text-base text-amber-700 leading-6">
                IronEx operates as an interactive computer service under federal law. Users are solely responsible for their content. IronEx does not endorse user-generated content.
              </Text>
            </View>

            {/* Contact Information */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Ionicons name="mail" size={20} color="#2563EB" />
                </View>
                <Text className="text-lg font-semibold text-gray-900">
                  Contact Information
                </Text>
              </View>
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

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
