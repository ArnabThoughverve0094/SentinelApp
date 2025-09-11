import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TermsAndConditions(): React.JSX.Element {
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
          {/* Hero section with gradient background */}
          <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  Welcome to Sentinel
                </Text>
                <Text className="text-sm text-gray-600">
                   Effective Updated: September 10, 2025 Last Updated: September 10, 2025
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6">
              By creating an account, accessing, or using the Sentinel platform ("Platform"), you agree to these Terms of Use ("Terms"). If you do not agree, you may not use Sentinel. By signing up to become a User you agree to these Terms of Use.
            </Text>
          </View>

          {/* Terms sections with enhanced styling */}
          <View className="space-y-4">
            {/* Section 1 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-blue-600 font-bold text-sm">1</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Eligibility and Account Registration
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • Only registered users ("Users") may publish content on Sentinel.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Registration requires accurate, current information. You are responsible for safeguarding your account credentials.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Sentinel may suspend or terminate accounts for violations of these Terms.
                </Text>
              </View>
            </View>

            {/* Section 2 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-red-600 font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Responsibilities
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  By using Sentinel, you agree not to submit or publish any content that:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Is defamatory, libelous, harassing, threatening, or invasive of privacy.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Promotes hate, violence, or discrimination.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violates or infringes upon any trademark, copyright, patent, trade secret, or other intellectual property rights.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Contains false or misleading information intended to deceive.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Contains viruses, malware, or harmful code.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violates any applicable law or regulation.</Text>
                </View>
              </View>
            </View>

            {/* Section 3 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Publishing and Moderation
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Publishing:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Users may publish incidents of antisemitism, anti-Zionism, or anti-Israel hate they have witnessed or experienced — online, in physical spaces, or personally.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Moderation:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    All submissions are subject to review by a Sentinel moderator. Moderators may approve or decline submissions. They will not edit, redact, or rewrite content.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">Timeline:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Approved content is published in real time to the public-facing timeline, visible to all visitors.
                  </Text>
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
                  Identity Options
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • Users may publish incidents either with their username/identity visible or anonymously.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Sentinel does not disclose user identities publicly unless the user chooses to include it.
                </Text>
              </View>
            </View>

            {/* Section 5 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Polling and Engagement
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • Every published incident includes a poll with curated, pre-set response options.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Users may engage with content only by selecting from these poll responses.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Free-form comments, replies, or user-generated text discussions are not permitted.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Poll results may be aggregated and shared publicly to provide insights into community sentiment.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Aggregated poll data may also be made available to third-party organizations (e.g., synagogues, NGOs, advocacy groups) for research, education, or response planning.
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
                  Intellectual Property
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • By submitting or publishing content, you grant Sentinel a worldwide, non-exclusive, royalty-free license to use, display, and distribute that content on the Platform.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • You represent that you own or have rights to any content you publish.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Sentinel respects intellectual property rights. To request removal of allegedly infringing material, contact us at support@sentinel.app.
                </Text>
              </View>
            </View>

            {/* Section 7 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-teal-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-teal-600 font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Legal Protections and Disclaimers
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">United States</Text>
                  <View className="space-y-2">
                    <Text className="text-base text-gray-700 leading-6">
                      • Under Section 230 of the Communications Decency Act (47 U.S.C. § 230), Sentinel is not the publisher or speaker of user-submitted content.
                    </Text>
                    <Text className="text-base text-gray-700 leading-6">
                      • Sentinel is not liable for statements or representations made by Users.
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">European Union / United Kingdom</Text>
                  <View className="space-y-2">
                    <Text className="text-base text-gray-700 leading-6">
                      • Sentinel qualifies as a "hosting service." We are not liable for unlawful content unless we have actual knowledge and fail to act.
                    </Text>
                    <Text className="text-base text-gray-700 leading-6">
                      • Users may flag unlawful content. Sentinel will review and, if necessary, remove such content in line with the EU Digital Services Act and UK Online Safety Act.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 8 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-pink-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-pink-600 font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Termination
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Sentinel may suspend or terminate your account if you:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Violate these Terms;</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violate applicable law; or</Text>
                  <Text className="text-base text-gray-700 leading-6">• Engage in conduct that undermines the safety or integrity of the Platform.</Text>
                </View>
              </View>
            </View>

            {/* Section 9 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-cyan-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-cyan-600 font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Limitation of Liability
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • The Platform is provided "as is." We disclaim all warranties, express or implied.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Sentinel is not liable for damages arising from your use of the Platform, except as required by law.
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
                  Indemnification
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  You agree to indemnify and hold harmless Sentinel, its directors, officers, employees, and partners (including Digital Iron Dome, Inc.) from claims, damages, or expenses arising from your use of the Platform or violation of these Terms.
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
                  Changes to Terms
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  Sentinel may update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance.
                </Text>
              </View>
            </View>

            {/* Section 12 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-emerald-600 font-bold text-sm">12</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Governing Law
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  These Terms are governed by the laws of the State of Delaware (for U.S. users) and by applicable law in your jurisdiction for international users.
                </Text>
              </View>
            </View>

            {/* Section 13 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-violet-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-violet-600 font-bold text-sm">13</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Contact Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-4">
                  For questions, concerns, or legal notices, contact us at:
                </Text>
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-base text-gray-900 font-medium mb-2">
                    📧 Email: support@sentinel.app
                  </Text>
                  <Text className="text-base text-gray-700">
                    📍 Address: Digital Iron Dome, Inc., 1234 Main Street, Suite 100, Anytown, ST 12345
                  </Text>
                </View>
              </View>
            </View>

            {/* Important Notice */}
            <View className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="warning" size={20} color="#D97706" />
                <Text className="text-lg font-semibold text-yellow-800 ml-2">
                  Important Legal Information
                </Text>
              </View>
              <Text className="text-base text-yellow-700 leading-6">
                These terms are governed by Delaware state law for U.S. users and applicable local laws for international users. Continued use after changes constitutes acceptance.
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