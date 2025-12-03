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
          {/* Hero section with gradient background */}
          <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                IronExSafe Terms of Use
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
              Welcome to IronExSafe. By creating an account, accessing, or using the IronExSafe platform ("Platform"), you agree to these Terms of Use ("Terms"). If you do not agree, you may not use IronExSafe and should therefore not register.
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
                  • Only registered users ("Users" or "User") may submit incident reports and participate in the sentiment polls.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Registration requires accurate, current information. You are responsible for safeguarding your account credentials.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe reserves the right at its sole discretion to suspend or terminate accounts for violations of these Terms.
                </Text>
              </View>
            </View>

            {/* Section 2 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-green-600 font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  User Responsibilities
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  By using IronExSafe, you agree that you will not submit, upload, or transmit any content that:
                </Text>
                <View className="space-y-2">
                  <Text className="text-base text-gray-700 leading-6">• Is defamatory, libelous, harassing, threatening, or invasive of privacy.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Promotes hate, violence, or discrimination.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violates or infringes upon any trademark, copyright, patent, trade secret, or other intellectual property rights.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Contains false or misleading information intended to deceive.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Contains viruses, malware, or other harmful code.</Text>
                  <Text className="text-base text-gray-700 leading-6">• Violates any applicable laws or regulations.</Text>
                </View>
              </View>
            </View>

            {/* Section 3 */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-orange-600 font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  Reporting and Moderation
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  Users may submit reports of antisemitic, anti-Israel, or related incidents in three categories:
                </Text>
                <View className="space-y-2 mb-4">
                  <Text className="text-base text-gray-700 leading-6">• Digital incidents (online content).</Text>
                  <Text className="text-base text-gray-700 leading-6">• Physical incidents (events in real-world spaces).</Text>
                  <Text className="text-base text-gray-700 leading-6">• Personal experiences (first-hand accounts).</Text>
                </View>
                <View className="space-y-3">
                  <Text className="text-base text-gray-700 leading-6">
                    • All reports are reviewed by a IronExSafe moderator before being released to the public timeline. You agree that the Moderator has sole authority and discretion to release/publish to the IronExSafe platform.
                  </Text>
                  <Text className="text-base text-gray-700 leading-6">
                    • Moderators may approve or decline submissions but will not alter or redact content.
                  </Text>
                  <Text className="text-base text-gray-700 leading-6">
                    • Released reports may include structured polls or opinion-choice mechanisms for user engagement. Users cannot submit comments, replies, or free-form text.
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
                  Public Timeline and Content Disclaimer
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • Approved reports are published on the public-facing timeline, accessible to all (whether registered or not).
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe does not verify the truth of user submissions and makes no guarantees about accuracy.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • Reports are labeled as user-submitted content.
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
                  Intellectual Property
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe respects intellectual property rights. If you believe content infringes your rights, notify us at SentinelTerms@gmail.com.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • By submitting content, you grant IronExSafe a worldwide, non-exclusive, royalty-free license to use, display, and distribute that content on the Platform.
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
                  Legal Protections and Disclaimers
                </Text>
              </View>
              <View className="space-y-4 ml-11">
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">United States:</Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Under Section 230 of the Communications Decency Act (47 U.S.C. § 230), IronExSafe is not the publisher or speaker of user-submitted content. IronExSafe is not liable for statements or representations made by Users.
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900 mb-2">European Union / United Kingdom:</Text>
                  <Text className="text-base text-gray-700 leading-6 mb-2">
                  IronExSafe qualifies as a "hosting service." We are not liable for unlawful user content unless we have actual knowledge and fail to act.
                  </Text>
                  <Text className="text-base text-gray-700 leading-6">
                    Users may flag unlawful content. IronExSafe will review and may remove such content promptly in accordance with the EU Digital Services Act and UK Online Safety Act.
                  </Text>
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
                  Termination
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe, in its sole discretion, may suspend or terminate your account if you violate these Terms or applicable law.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe, in its sole discretion, may remove any content deemed unlawful, harmful, or violative of these Terms.
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
                  Limitation of Liability
                </Text>
              </View>
              <View className="space-y-3 ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe provides the Platform "as is." We disclaim all warranties, express or implied.
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  • IronExSafe is not liable for damages arising from your use of the Platform, except as required by law.
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
                  Indemnification
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  You agree to indemnify and hold harmless IronExSafe, its directors, officers, employees, and partners (including David J Hart PA and Digital Iron Dome, Inc.) from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.
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
                  Changes to Terms
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  IronExSafe may update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance.
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
                  Governing Law
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6">
                  These Terms are governed by the laws of the State of Delaware (for U.S. users) and by applicable law in your jurisdiction for international users.
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
                  Contact Information
                </Text>
              </View>
              <View className="ml-11">
                <Text className="text-base text-gray-700 leading-6 mb-4">
                  Questions about these Terms may be sent to:
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

            {/* Important Terms Notice */}
            <View className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="document-text" size={20} color="#2563EB" />
                <Text className="text-lg font-semibold text-blue-800 ml-2">
                  Terms Agreement
                </Text>
              </View>
              <Text className="text-base text-blue-700 leading-6">
                By using IronExSafe, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. Please review these terms carefully.
              </Text>
            </View>

            {/* User Responsibility Notice */}
            <View className="bg-green-50 rounded-xl p-6 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text className="text-lg font-semibold text-green-800 ml-2">
                  User Responsibility
                </Text>
              </View>
              <Text className="text-base text-green-700 leading-6">
                Users are responsible for ensuring their submissions comply with our community guidelines and applicable laws. Help us maintain a respectful and safe environment for all.
              </Text>
            </View>

            {/* Legal Compliance Notice */}
            <View className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="scale" size={20} color="#7C3AED" />
                <Text className="text-lg font-semibold text-purple-800 ml-2">
                  Legal Compliance
                </Text>
              </View>
              <Text className="text-base text-purple-700 leading-6">
                IronExSafe operates in compliance with applicable laws and regulations. We reserve the right to take appropriate action to ensure platform safety and legal compliance.
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
