// app/help.tsx  (or screens/HelpScreen.tsx if you use a custom navigator)
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HelpSectionKey =
  | 'welcome'
  | 'home'
  | 'login'
  | 'signup'
  | 'forgot'
  | 'publish'
  | 'educational'
  | 'following'
  | 'bookmark'
  | 'create'
  | 'createEdu'
  | 'notification'
  | 'profile'
  | 'editProfile'
  | 'faq'
  | 'comment'
  | 'totalSentiments';

interface HelpSection {
  key: HelpSectionKey;
  title: string;
  icon: React.ReactNode;
  short: string;
  bullets: string[];
}

const sections: HelpSection[] = [
  {
    key: 'welcome',
    title: 'Welcome',
    icon: <Ionicons name="planet" size={20} color="#ef4444" />,
    short: 'First screen after launch.',
    bullets: [
      'Use Google, Apple or Email to create or access your account.',
      'Read the one‑line app promise so new users understand the goal (exposing antisemitism).',
      'From here you move directly to Login or Signup.',
    ],
  },
  {
    key: 'home',
    title: 'Home Feed',
    icon: <Ionicons name="home" size={20} color="#0f172a" />,
    short: 'Main timeline of all approved posts.',
    bullets: [
      'Top tabs let you switch between Published, Educational and Following feeds.',
      'Each card shows author, time, post type (My Thoughts / Found Online / Educational) and media carousel.',
      'Bottom bar always shows Home, Bookmark, Create, Notifications and Profile for quick navigation.',
    ],
  },
  {
    key: 'login',
    title: 'Login',
    icon: <Ionicons name="log-in-outline" size={20} color="#0ea5e9" />,
    short: 'Sign in with email or social providers.',
    bullets: [
      'Enter the email and password you used at signup, then tap Login.',
      'You can also continue with Google or Apple using the large buttons.',
      'Use “Forgot Password?” if you no longer remember your credentials.',
    ],
  },
  {
    key: 'signup',
    title: 'Signup',
    icon: <Ionicons name="person-add-outline" size={20} color="#10b981" />,
    short: 'Create a new Sentinel account.',
    bullets: [
      'Fill Name, Email, Password, Nickname and Country, then confirm you are 18+.',
      'Accept Terms & Conditions and Privacy Policy before tapping Sign Up.',
      'You will be redirected to the Home feed once registration succeeds.',
    ],
  },
  {
    key: 'forgot',
    title: 'Forgot Password',
    icon: <Ionicons name="key-outline" size={20} color="#6366f1" />,
    short: 'Reset a lost password.',
    bullets: [
      'Enter your registered email and tap “Send Verification Code”.',
      'Check your inbox for the code and follow the instructions you provide in the reset flow.',
      'Return to Login after successfully changing the password.',
    ],
  },
  {
    key: 'publish',
    title: 'Published Posts',
    icon: <Ionicons name="newspaper-outline" size={20} color="#334155" />,
    short: 'Admin‑style view of approved posts.',
    bullets: [
      'Shows all content that is live and visible to users.',
      'Each card has Approve / Reject buttons and a vote option selector when moderation is needed.',
      'Use this view mainly if the user role has moderation permissions in Firestore.',
    ],
  },
  {
    key: 'educational',
    title: 'Educational Tab',
    icon: <Ionicons name="school-outline" size={20} color="#2563eb" />,
    short: 'Curated educational posts.',
    bullets: [
      'Switch to the Educational tab at the top of Home to see only learning‑focused posts.',
      'Cards behave like normal posts: you can react, bookmark, share and open sentiment analytics.',
      'Moderators also see Approve / Reject and vote options on each educational card.',
    ],
  },
  {
    key: 'following',
    title: 'Following Feed',
    icon: <Ionicons name="people-outline" size={20} color="#f97316" />,
    short: 'Content only from people you follow.',
    bullets: [
      'Open the Following tab on Home to see posts by accounts you follow.',
      'Use the search screen to discover users and tap Follow / Following to manage relationships.',
      'Your reposts and quote posts appear here for your followers.',
    ],
  },
  {
    key: 'bookmark',
    title: 'Bookmarks',
    icon: <Ionicons name="bookmark-outline" size={20} color="#000000" />,
    short: 'All posts saved for later.',
    bullets: [
      'Tap the bookmark icon on any post to add it to this list.',
      'This screen shows animated cards with your saved posts and their latest like, reply and repost counts (powered by Firestore listeners).',
      'Use the bookmark button in each card to remove it or the share icon to send the post to other apps.',
    ],
  },
  {
    key: 'create',
    title: 'Create Post',
    icon: <Ionicons name="add-circle-outline" size={20} color="#dc2626" />,
    short: 'Post anything to the community.',
    bullets: [
      'Type your message, add image or video, and choose whether to post anonymously.',
      'Select the source type at the bottom: My Thoughts, Witnessed or Found Online.',
      'Tap “Submit Now” to send the post for admin approval; you will be notified when it is approved.',
    ],
  },
  {
    key: 'createEdu',
    title: 'Create Educational Post',
    icon: <Ionicons name="book-outline" size={20} color="#0891b2" />,
    short: 'Share educational content only.',
    bullets: [
      'Toggle the Educational switch at the top of the Create screen.',
      'Describe the learning content and attach any supporting media.',
      'These posts appear under the Educational tab once they are approved.',
    ],
  },
  {
    key: 'notification',
    title: 'Notifications',
    icon: <Ionicons name="notifications-outline" size={20} color="#16a34a" />,
    short: 'Track what happens to your posts.',
    bullets: [
      'You see messages when a post is submitted, under review, approved or rejected.',
      'Admin approval notifications explicitly state that the post is now live.',
      'Tap any notification card to jump straight to the related post if you implement deep‑links.',
    ],
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: <Ionicons name="person-circle-outline" size={20} color="#7c3aed" />,
    short: 'Public profile and your posts.',
    bullets: [
      'Shows your name, nickname (handle), profile picture and bio.',
      'The “My Posts” list includes all posts you have submitted together with their approval status labels.',
      'Use “Share Profile” to deep‑link your public profile to others.',
    ],
  },
  {
    key: 'editProfile',
    title: 'Edit Profile',
    icon: <Feather name="edit-3" size={20} color="#4b5563" />,
    short: 'Update personal details safely.',
    bullets: [
      'Tap Edit Profile on the Profile screen to open this modal‑style page.',
      'Change name, nickname, country and bio; email is fixed and cannot be edited.',
      'Tap on the avatar to upload a new profile picture, then save changes.',
    ],
  },
  {
    key: 'faq',
    title: 'FAQ',
    icon: <MaterialIcons name="help-outline" size={20} color="#0f766e" />,
    short: 'Expandable list of common questions.',
    bullets: [
      'Each row expands to reveal an answer about topics like Project Sentinel, anonymity or location tracking.',
      'Users can quickly scan the list and only expand the questions they care about.',
      'Consider linking to full policies or external resources where necessary.',
    ],
  },
  {
    key: 'comment',
    title: 'Comments & Responses',
    icon: <Ionicons name="chatbubble-ellipses-outline" size={20} color="#f97316" />,
    short: 'Structured reactions to posts.',
    bullets: [
      'Users react with templates such as Love it, Dislike, Agree or Hate; these appear as colored chips in the comments thread.',
      'The comments modal lets users add or edit their response to a post.',
      'Admin or AI analytics use this data later to compute sentiment.',
    ],
  },
  {
    key: 'totalSentiments',
    title: 'Total Sentiments',
    icon: <Ionicons name="stats-chart-outline" size={20} color="#22c55e" />,
    short: 'Visual insight into community reactions.',
    bullets: [
      'The Total Sentiment screen shows AI sentiment text plus a donut chart and bar breakdown of each reaction.',
      'From here users can tap “Edit Response” to change their sentiment choice.',
      'This view helps authors understand whether the community loves, agrees with, or rejects a post.',
    ],
  },
];

const HelpScreen: React.FC = () => {
  const [activeKey, setActiveKey] = useState<HelpSectionKey>('welcome');

  const active = sections.find(s => s.key === activeKey) ?? sections[0];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Platform.OS === 'android' ? '#f8fafc' : 'transparent'}
      />

      {/* Header */}
      <View className="bg-white border-b border-slate-200">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View>
            <Text className="text-2xl font-extrabold text-slate-900">
              App Guide
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              Learn how to use every screen in Sentinel.
            </Text>
          </View>
          <View className="flex-row items-center">
            {/* <Ionicons name="help-circle" size={26} color="#ef4444" /> */}
            {/* Right: Close Button */}
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ 
                width: 32, 
                height: 32, 
                alignItems: "center", 
                justifyContent: "center" 
              }}
              >
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Left: Sections list */}
        <View className="w-40 bg-white border-r border-slate-200">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {sections.map(item => {
              const isActive = item.key === activeKey;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setActiveKey(item.key)}
                  activeOpacity={0.9}
                  className={`px-3 py-2.5 flex-row items-center rounded-r-2xl mb-1 ${
                    isActive ? 'bg-slate-900' : 'bg-transparent'
                  }`}
                >
                  <View className="mr-2">
                    {React.cloneElement(item.icon as any, {
                      color: isActive ? '#f9fafb' : '#64748b',
                      size: 18,
                    })}
                  </View>
                  <Text
                    className={`text-xs font-semibold ${
                      isActive ? 'text-slate-50' : 'text-slate-700'
                    }`}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right: Details */}
        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16 }}
          >
            <View className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-full bg-slate-900 items-center justify-center mr-2">
                  {React.cloneElement(active.icon as any, {
                    color: '#f9fafb',
                    size: 18,
                  })}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">
                    {active.title}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    {active.short}
                  </Text>
                </View>
              </View>

              {active.bullets.map((b, idx) => (
                <View key={idx} className="flex-row items-start mt-2">
                  <View className="w-5 pt-1">
                    <View className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1" />
                  </View>
                  <Text className="flex-1 text-sm text-slate-700 leading-5">
                    {b}
                  </Text>
                </View>
              ))}

              <View className="mt-4 flex-row items-center">
                <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
                <Text className="ml-2 text-[11px] text-slate-400">
                  Use the bottom navigation bar at any time to move between
                  Home, Bookmarks, Create, Notifications and Profile.
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-[11px] text-center text-slate-400">
                This help page is static UI only. Link it from your menu or
                settings so users can open it whenever they need guidance.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HelpScreen;