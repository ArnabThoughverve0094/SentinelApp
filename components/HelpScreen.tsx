// components/HelpScreen.tsx
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type HelpSectionKey =
  | 'welcome' | 'home' | 'login' | 'signup' | 'forgot'
  | 'publish' | 'educational' | 'following' | 'bookmark'
  | 'create' | 'createEdu' | 'notification' | 'profile'
  | 'myPosts' | 'editProfile' | 'userProfile' | 'faq'
  | 'comment' | 'totalSentiments' | 'settings' | 'appInfo'
  | 'appGuide' | 'blockedUsers' | 'deleteAccount' | 'logout';

interface HelpSection {
  key: HelpSectionKey;
  title: string;
  icon: React.ReactNode;
  short: string;
  bullets: string[];
  group?: string;
  accentColor?: string;
}

const sections: HelpSection[] = [
  {
    key: 'welcome',
    title: 'Welcome',
    icon: <Ionicons name="planet" size={20} color="#ef4444" />,
    short: 'First screen after launch.',
    group: 'Onboarding',
    accentColor: '#ef4444',
    bullets: [
      'Use Google, Apple or Email to create or access your account.',
      'Read the one-line app promise so new users understand the goal (exposing antisemitism).',
      'From here you move directly to Login or Signup.',
    ],
  },
  {
    key: 'login',
    title: 'Login',
    icon: <Ionicons name="log-in-outline" size={20} color="#0ea5e9" />,
    short: 'Sign in with email or social providers.',
    group: 'Onboarding',
    accentColor: '#0ea5e9',
    bullets: [
      'Enter the email and password you used at signup, then tap Login.',
      'You can also continue with Google or Apple using the large buttons.',
      'Use "Forgot Password?" if you no longer remember your credentials.',
    ],
  },
  {
    key: 'signup',
    title: 'Signup',
    icon: <Ionicons name="person-add-outline" size={20} color="#10b981" />,
    short: 'Create a new IronEx account.',
    group: 'Onboarding',
    accentColor: '#10b981',
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
    group: 'Onboarding',
    accentColor: '#6366f1',
    bullets: [
      'Enter your registered email and tap "Send Verification Code".',
      'Check your inbox for the code and follow the instructions in the reset flow.',
      'Return to Login after successfully changing the password.',
    ],
  },
  {
    key: 'home',
    title: 'Home Feed',
    icon: <Ionicons name="home" size={20} color="#0f172a" />,
    short: 'Main timeline of all approved posts.',
    group: 'Feed',
    accentColor: '#0f172a',
    bullets: [
      'Top tabs let you switch between Published, Educational and Following feeds.',
      'Each card shows author, time, post type (My Thoughts / Found Online / Educational) and media carousel.',
      'Tap the three-dot menu on any post card to Report the post or Block the author.',
      'You can delete your own posts directly from the feed using the delete option in the three-dot menu.',
      'Admins see an additional "Delete User" option on any post card to remove a user from the platform.',
      'Bottom bar always shows Home, Bookmark, Create, Notifications and Profile for quick navigation.',
    ],
  },
  {
    key: 'publish',
    title: 'Published Posts',
    icon: <Ionicons name="newspaper-outline" size={20} color="#334155" />,
    short: 'Admin-style view of approved posts.',
    group: 'Feed',
    accentColor: '#334155',
    bullets: [
      'Shows all content that is live and visible to users.',
      'Each card has Approve / Reject buttons and a vote option selector when moderation is needed.',
      'Use this view mainly if the user role has moderation permissions.',
    ],
  },
  {
    key: 'educational',
    title: 'Educational Tab',
    icon: <Ionicons name="school-outline" size={20} color="#2563eb" />,
    short: 'Curated educational posts.',
    group: 'Feed',
    accentColor: '#2563eb',
    bullets: [
      'Switch to the Educational tab at the top of Home to see only learning-focused posts.',
      'Cards behave like normal posts: you can react, bookmark, share and open sentiment analytics.',
      'Moderators also see Approve / Reject and vote options on each educational card.',
    ],
  },
  {
    key: 'following',
    title: 'Following Feed',
    icon: <Ionicons name="people-outline" size={20} color="#f97316" />,
    short: 'Content only from people you follow.',
    group: 'Feed',
    accentColor: '#f97316',
    bullets: [
      'Open the Following tab on Home to see posts by accounts you follow.',
      'Use the search screen or tap any username to discover users.',
      'Tap Follow / Following on a user profile to manage the relationship.',
      'Your reposts and quote posts appear here for your followers.',
    ],
  },
  {
    key: 'create',
    title: 'Create Post',
    icon: <Ionicons name="add-circle-outline" size={20} color="#dc2626" />,
    short: 'Share text, images or video with the community.',
    group: 'Posts',
    accentColor: '#dc2626',
    bullets: [
      'Choose your post type: Text only, Text + Image (supports multiple images) or Text + Video.',
      'Select a tag line to describe your source: My Thoughts, Witnessed or Found Online.',
      'Toggle "Post Anonymously" to hide your identity, or post as your real username.',
      'Switch on "Educational Post" to submit learning-focused content under the Educational tab.',
      'Tap "Submit Now" — the AI moderator reviews your post immediately against community guidelines.',
      'If the post passes all AI checks it is Approved automatically and 4 sentiment vote options are generated.',
      'If the post fails any AI check it is flagged as Pending or Rejected with a notification explaining why.',
    ],
  },
  {
    key: 'createEdu',
    title: 'Create Educational',
    icon: <Ionicons name="book-outline" size={20} color="#0891b2" />,
    short: 'Share educational content only.',
    group: 'Posts',
    accentColor: '#0891b2',
    bullets: [
      'Toggle the Educational switch at the top of the Create screen.',
      'Describe the learning content and attach any supporting media.',
      'These posts appear under the Educational tab once approved.',
    ],
  },
  {
    key: 'bookmark',
    title: 'Bookmarks',
    icon: <Ionicons name="bookmark-outline" size={20} color="#1e293b" />,
    short: 'All posts saved for later.',
    group: 'Posts',
    accentColor: '#1e293b',
    bullets: [
      'Tap the bookmark icon on any post to add it to this list.',
      'This screen shows animated cards with your saved posts and their latest like, reply and repost counts.',
      'Use the bookmark button in each card to remove it or the share icon to send the post to other apps.',
    ],
  },
  {
    key: 'comment',
    title: 'Comments & Responses',
    icon: <Ionicons name="chatbubble-ellipses-outline" size={20} color="#f97316" />,
    short: 'Structured reactions to posts.',
    group: 'Posts',
    accentColor: '#f97316',
    bullets: [
      'Browse the pre-defined response options (e.g. Love it, Dislike, Agree, Hate) and tap the one you find most relevant.',
      'Your selected response appears as a colored chip in the comments thread for other users to see.',
      'You can edit your response at any time by opening the comments modal and selecting a different option.',
      'Admin or AI analytics aggregate all responses to compute the overall post sentiment score.',
    ],
  },
  {
    key: 'totalSentiments',
    title: 'Total Sentiments',
    icon: <Ionicons name="stats-chart-outline" size={20} color="#22c55e" />,
    short: 'Visual insight into community reactions.',
    group: 'Posts',
    accentColor: '#22c55e',
    bullets: [
      'The Total Sentiment screen shows AI-generated sentiment text plus a donut chart and bar breakdown of each reaction.',
      'Tap "Edit Response" to change your sentiment choice at any time.',
      'This view helps authors understand whether the community loves, agrees with, or rejects a post.',
    ],
  },
  {
    key: 'profile',
    title: 'My Profile',
    icon: <Ionicons name="person-circle-outline" size={20} color="#7c3aed" />,
    short: 'Your public profile and all your posts.',
    group: 'Profile',
    accentColor: '#7c3aed',
    bullets: [
      'Displays your Name, Nickname (handle), Profile Picture and Bio at the top.',
      'The "My Posts" section lists every post you have submitted along with its approval status label (Pending / Approved / Rejected).',
      'Use "Share Profile" to deep-link your public profile to other users.',
    ],
  },
  {
    key: 'myPosts',
    title: 'My Posts',
    icon: <Feather name="file-text" size={20} color="#b45309" />,
    short: 'Manage your submitted posts.',
    group: 'Profile',
    accentColor: '#b45309',
    bullets: [
      'Pending posts can be both Edited and Deleted — tap the three-dot menu on any pending card to see these options.',
      'Approved posts can only be Deleted — editing is disabled once a post is live to protect community integrity.',
      'When you edit a pending post it re-enters the validation pipeline from Stage 0 through to final approval or stays Pending if it fails.',
    ],
  },
  {
    key: 'editProfile',
    title: 'Edit Profile',
    icon: <Feather name="edit-3" size={20} color="#4b5563" />,
    short: 'Update personal details securely.',
    group: 'Profile',
    accentColor: '#4b5563',
    bullets: [
      'Tap "Edit Profile" on the Profile screen — you must first enter your current password to unlock the form.',
      'You can update your Name, Username (nickname), Country, Bio and Profile Picture. Email cannot be changed.',
      'Your Bio and Profile Picture are reviewed by the AI moderator: compliant content goes live immediately; non-compliant bio is hidden and a dummy avatar is shown until you upload an acceptable image.',
    ],
  },
  {
    key: 'userProfile',
    title: 'User Profile',
    icon: <Ionicons name="person-outline" size={20} color="#0891b2" />,
    short: "View any other user's public profile.",
    group: 'Profile',
    accentColor: '#0891b2',
    bullets: [
      "Tap any username or avatar anywhere in the app to open that user's public profile.",
      'The profile shows their Name, Username (@handle), Bio, Profile Picture, total Followers and Following counts.',
      'Scroll down to browse all of their approved public posts.',
      'Tap "Follow" to follow the user or "Following" to unfollow them — changes take effect immediately.',
      'Use the three-dot menu on this screen to Block the user, which hides their content from your feed and prevents interaction.',
    ],
  },
  {
    key: 'notification',
    title: 'Notifications',
    icon: <Ionicons name="notifications-outline" size={20} color="#16a34a" />,
    short: 'Every action that affects your account or posts.',
    group: 'Notifications',
    accentColor: '#16a34a',
    bullets: [
      'Post approved by AI — your post passed all automated checks and is now live.',
      'Post approved by Admin — an admin has manually reviewed and approved your post.',
      'Post rejected by Admin — includes the specific reason why your post was not approved.',
      'Post reported — someone has reported one of your posts; the reason for the report is shown.',
      'Post pending — your post is in the review queue; the notification explains what is being checked.',
      'Account blocked — you have been blocked by another user or an admin with the stated reason.',
      'Irrelevant post — your post was flagged as off-topic with the exact reason provided.',
      'Video post awaiting manual approval — video content is held for human review before going live.',
      'Profile update — confirmation that your edited profile (bio, picture or other fields) has been saved and reviewed.',
      'Small action alerts — likes, reposts, new followers and comment replies also appear here as compact cards.',
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    icon: <Ionicons name="settings-outline" size={20} color="#475569" />,
    short: 'All app-level configuration options.',
    group: 'Settings',
    accentColor: '#475569',
    bullets: [
      'Access Settings from the gear icon on the Profile screen or the top-right menu.',
      'Settings is organized into sections: App Info, App Guide, FAQ, Blocked Users, Delete Account and Logout.',
      'Each option opens a dedicated screen or triggers a confirmation dialog.',
    ],
  },
  {
    key: 'appInfo',
    title: 'App Info',
    icon: <Ionicons name="information-circle-outline" size={20} color="#0284c7" />,
    short: 'Version, legal and about details.',
    group: 'Settings',
    accentColor: '#0284c7',
    bullets: [
      'Displays the current app version, build number and release date.',
      'Includes links to Terms & Conditions, Privacy Policy and Open-Source Licenses.',
      "Contact details and the app's official mission statement are also shown here.",
    ],
  },
  {
    key: 'appGuide',
    title: 'App Guide',
    icon: <Ionicons name="map-outline" size={20} color="#7c3aed" />,
    short: 'Step-by-step guide for every screen.',
    group: 'Settings',
    accentColor: '#7c3aed',
    bullets: [
      'This is the screen you are reading right now — a full walkthrough of every feature in IronEx.',
      'Navigate sections using the left sidebar; each section shows a short summary and detailed bullet points.',
      'Open this guide any time from Settings → App Guide whenever you need a refresher.',
    ],
  },
  {
    key: 'faq',
    title: 'FAQ',
    icon: <MaterialIcons name="help-outline" size={20} color="#0f766e" />,
    short: 'Expandable list of common questions.',
    group: 'Settings',
    accentColor: '#0f766e',
    bullets: [
      'Each row expands to reveal an answer about topics like Project IronEx, anonymity or location tracking.',
      'Users can quickly scan the list and only expand the questions they care about.',
      'Linking to full policies or external resources is recommended where relevant.',
    ],
  },
  {
    key: 'blockedUsers',
    title: 'Blocked Users',
    icon: <Ionicons name="ban-outline" size={20} color="#dc2626" />,
    short: 'Manage accounts you have blocked.',
    group: 'Settings',
    accentColor: '#dc2626',
    bullets: [
      'Found in Settings → Blocked Users; shows the full list of accounts you have blocked.',
      'Blocked users cannot see your posts, comment on your content or follow you.',
      'Tap "Unblock" next to any user to restore normal visibility between your accounts.',
    ],
  },
  {
    key: 'deleteAccount',
    title: 'Delete Account',
    icon: <Ionicons name="trash-outline" size={20} color="#b91c1c" />,
    short: 'Permanently remove your account.',
    group: 'Settings',
    accentColor: '#b91c1c',
    bullets: [
      'Go to Settings → Delete Account; a confirmation dialog will ask you to enter your password before proceeding.',
      'Deleting your account permanently removes your profile, posts, comments and all associated data from IronEx.',
      'This action is irreversible — once confirmed, you cannot recover your account or its content.',
    ],
  },
  {
    key: 'logout',
    title: 'Logout',
    icon: <Ionicons name="log-out-outline" size={20} color="#64748b" />,
    short: 'Sign out from your current session.',
    group: 'Settings',
    accentColor: '#64748b',
    bullets: [
      'Go to Settings → Logout to sign out of your account on this device.',
      'A short confirmation prompt appears before the logout is processed.',
      'You will be taken back to the Welcome screen and must log in again to access IronEx.',
    ],
  },
];

const GROUP_ORDER = ['Onboarding', 'Feed', 'Posts', 'Profile', 'Notifications', 'Settings'];

const GROUP_COLORS: Record<string, string> = {
  Onboarding: '#6366f1',
  Feed: '#0f172a',
  Posts: '#dc2626',
  Profile: '#7c3aed',
  Notifications: '#16a34a',
  Settings: '#475569',
};

interface HelpScreenProps {
  onClose: () => void;
}

const NOTIFICATION_TYPES = [
  { label: 'Post Approved by AI', icon: 'checkmark-circle', color: '#16a34a', desc: 'Your post passed automated checks and is now live.' },
  { label: 'Post Approved by Admin', icon: 'shield-checkmark', color: '#0284c7', desc: 'An admin manually reviewed and approved your post.' },
  { label: 'Post Rejected by Admin', icon: 'close-circle', color: '#dc2626', desc: 'Includes the specific rejection reason from the admin.' },
  { label: 'Post Reported', icon: 'flag', color: '#f97316', desc: 'Someone reported your post with a stated reason.' },
  { label: 'Post Pending', icon: 'time', color: '#f59e0b', desc: 'Post is in review queue — reason for hold is shown.' },
  { label: 'Account Blocked', icon: 'ban', color: '#7c3aed', desc: 'You were blocked by a user or admin with a reason.' },
  { label: 'Irrelevant Post', icon: 'alert-circle', color: '#b45309', desc: 'Your post was flagged off-topic with a specific reason.' },
  { label: 'Video Awaiting Approval', icon: 'videocam', color: '#0891b2', desc: 'Video is held for manual human review before going live.' },
  { label: 'Profile Updated', icon: 'person-circle', color: '#4f46e5', desc: 'Confirmation your edited bio, picture or details were saved.' },
  { label: 'Small Action Alerts', icon: 'heart', color: '#e11d48', desc: 'Likes, reposts, new followers and comment replies.' },
];

const POST_TYPES = [
  { label: 'Text Post', icon: 'document-text-outline', color: '#334155', desc: 'Plain text message up to the character limit.' },
  { label: 'Text + Image', icon: 'images-outline', color: '#0284c7', desc: 'Text with one or multiple images attached.' },
  { label: 'Text + Video', icon: 'videocam-outline', color: '#7c3aed', desc: 'Text with a video — sent for manual approval before going live.' },
];

const POST_TAGS = [
  { label: 'My Thoughts', color: '#6366f1' },
  { label: 'Witnessed', color: '#f97316' },
  { label: 'Found Online', color: '#0891b2' },
];

// ── Reusable Info Card ──────────────────────────────────────────
const InfoCard = ({
  icon, label, desc, color,
}: { icon: string; label: string; desc: string; color: string }) => (
  <View
    className="flex-row items-start rounded-2xl p-3 mb-2.5 border"
    style={{ backgroundColor: color + '0C', borderColor: color + '28' }}
  >
    <View
      className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
      style={{ backgroundColor: color + '22' }}
    >
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-bold text-slate-800">{label}</Text>
      <Text className="text-xs text-slate-500 mt-0.5 leading-[18px]">{desc}</Text>
    </View>
  </View>
);

// ── Section Divider Label ───────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => (
  <View className="flex-row items-center mb-3 mt-1">
    <View className="flex-1 h-px bg-slate-200" />
    <Text className="mx-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {label}
    </Text>
    <View className="flex-1 h-px bg-slate-200" />
  </View>
);

const HelpScreen: React.FC<HelpScreenProps> = ({ onClose }) => {
  const [activeKey, setActiveKey] = useState<HelpSectionKey>('welcome');
  const active = sections.find(s => s.key === activeKey) ?? sections[0];
  const insets = useSafeAreaInsets();
  const accent = active.accentColor ?? '#0f172a';

  const grouped = GROUP_ORDER.map(group => ({
    group,
    items: sections.filter(s => s.group === group),
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: '#0f172a',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 10,
            }}>
              <Ionicons name="book-outline" size={18} color="#f9fafb" />
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 }}>
                App Guide
              </Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                IronEx — full feature walkthrough
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 34, height: 34,
              borderRadius: 17,
              backgroundColor: '#f1f5f9',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* ── Left Sidebar ── */}
        <View style={{
          width: 148,
          backgroundColor: '#ffffff',
          borderRightWidth: 1,
          borderRightColor: '#e2e8f0',
        }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 24 }}
          >
            {grouped.map(({ group, items }) => (
              <View key={group}>
                {/* Group label */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 14, paddingBottom: 4 }}>
                  <View style={{
                    width: 5, height: 5, borderRadius: 3,
                    backgroundColor: GROUP_COLORS[group] ?? '#94a3b8',
                    marginRight: 5,
                  }} />
                  <Text style={{
                    fontSize: 9, fontWeight: '700',
                    letterSpacing: 1.2, textTransform: 'uppercase',
                    color: GROUP_COLORS[group] ?? '#94a3b8',
                  }}>
                    {group}
                  </Text>
                </View>

                {items.map(item => {
                  const isActive = item.key === activeKey;
                  const itemAccent = item.accentColor ?? '#0f172a';
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setActiveKey(item.key)}
                      activeOpacity={0.8}
                      style={{
                        marginHorizontal: 6,
                        marginBottom: 2,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isActive ? '#0f172a' : 'transparent',
                      }}
                    >
                      {/* Active left accent bar */}
                      {isActive && (
                        <View style={{
                          position: 'absolute', left: 0, top: 6, bottom: 6,
                          width: 3, borderRadius: 2,
                          backgroundColor: itemAccent,
                        }} />
                      )}
                      <View style={{ marginRight: 7, marginLeft: isActive ? 4 : 0 }}>
                        {React.cloneElement(item.icon as React.ReactElement<any>, {
                          color: isActive ? '#f9fafb' : '#94a3b8',
                          size: 15,
                        })}
                      </View>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 11,
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? '#f9fafb' : '#64748b',
                          lineHeight: 15,
                          flex: 1,
                        }}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Right Detail Panel ── */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}
          >

            {/* ── Hero Section Card ── */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              marginBottom: 12,
            }}>
              {/* Accent top strip */}
              <View style={{ height: 4, backgroundColor: accent }} />

              <View style={{ padding: 14 }}>
                {/* Title row */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{
                    width: 42, height: 42, borderRadius: 13,
                    backgroundColor: accent + '18',
                    borderWidth: 1.5,
                    borderColor: accent + '35',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 11,
                  }}>
                    {React.cloneElement(active.icon as React.ReactElement<any>, {
                      color: accent,
                      size: 20,
                    })}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 }}>
                        {active.title}
                      </Text>
                      {active.group && (
                        <View style={{
                          backgroundColor: (GROUP_COLORS[active.group] ?? '#64748b') + '18',
                          borderRadius: 20,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderWidth: 1,
                          borderColor: (GROUP_COLORS[active.group] ?? '#64748b') + '30',
                        }}>
                          <Text style={{
                            fontSize: 9, fontWeight: '700',
                            textTransform: 'uppercase', letterSpacing: 0.8,
                            color: GROUP_COLORS[active.group] ?? '#64748b',
                          }}>
                            {active.group}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                      {active.short}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 }} />

                {/* Bullets */}
                {active.bullets.map((b, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: accent + '18',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 9, marginTop: 1,
                      flexShrink: 0,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: accent }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: '#334155', lineHeight: 20 }}>
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ════════════════════════════════════
                HOME — Post Card Actions
            ════════════════════════════════════ */}
            {active.key === 'home' && (
              <View>
                <SectionLabel label="Post Card Actions" />
                {[
                  { label: 'Block User', icon: 'ban-outline', color: '#dc2626', desc: 'Hide all content from this user across your feed.' },
                  { label: 'Report Post', icon: 'flag-outline', color: '#f97316', desc: 'Flag inappropriate content — you must select a reason.' },
                  { label: 'Delete Own Post', icon: 'trash-outline', color: '#64748b', desc: 'Remove one of your own posts directly from the feed.' },
                  { label: 'Delete User (Admin)', icon: 'person-remove-outline', color: '#b91c1c', desc: 'Admins can permanently remove a user from the platform.' },
                ].map(({ label, icon, color, desc }) => (
                  <InfoCard key={label} icon={icon} label={label} desc={desc} color={color} />
                ))}
              </View>
            )}

            {/* ════════════════════════════════════
                CREATE — Types + Tags + AI Pipeline
            ════════════════════════════════════ */}
            {active.key === 'create' && (
              <View>
                <SectionLabel label="Post Types" />
                {POST_TYPES.map(({ label, icon, color, desc }) => (
                  <InfoCard key={label} icon={icon} label={label} desc={desc} color={color} />
                ))}

                <SectionLabel label="Tag Lines" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {POST_TAGS.map(({ label, color }) => (
                    <View
                      key={label}
                      style={{
                        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                        backgroundColor: color + '15',
                        borderWidth: 1.5, borderColor: color + '45',
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14, lineHeight: 16 }}>
                  All tag lines are available for both Anonymous and Real-name posts. Educational posts use the same tags.
                </Text>

                <SectionLabel label="AI Validation Pipeline" />
                <View style={{
                  backgroundColor: '#f0fdf4',
                  borderWidth: 1, borderColor: '#bbf7d0',
                  borderRadius: 16, padding: 14,
                }}>
                  {[
                    { stage: 'Stage 0', label: 'Post received & queued', color: '#64748b' },
                    { stage: 'Stage 1', label: 'AI keyword & hate-speech scan', color: '#0284c7' },
                    { stage: 'Stage 2', label: 'Community guideline parameter match', color: '#7c3aed' },
                    { stage: 'Stage 3', label: 'Admin manual review (videos & edge cases)', color: '#f97316' },
                    { stage: 'Approved ✓', label: '4 sentiment vote options generated for users', color: '#16a34a' },
                  ].map(({ stage, label, color }, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < 4 ? 0 : 0 }}>
                      <View style={{ alignItems: 'center', marginRight: 10, width: 18 }}>
                        <View style={{
                          width: 18, height: 18, borderRadius: 9,
                          backgroundColor: color,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                            {i < 4 ? i : '✓'}
                          </Text>
                        </View>
                        {i < 4 && (
                          <View style={{ width: 1.5, height: 14, backgroundColor: '#d1fae5', marginTop: 1 }} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingBottom: i < 4 ? 10 : 0 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color, marginBottom: 1 }}>{stage}</Text>
                        <Text style={{ fontSize: 12, color: '#166534', lineHeight: 17 }}>{label}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={{
                    marginTop: 12, backgroundColor: '#fef2f2',
                    borderRadius: 10, padding: 10,
                    borderWidth: 1, borderColor: '#fecaca',
                    flexDirection: 'row', alignItems: 'flex-start',
                  }}>
                    <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
                    <Text style={{ marginLeft: 6, fontSize: 11, color: '#991b1b', flex: 1, lineHeight: 16 }}>
                      If any stage fails → post is flagged Pending or Rejected and a push notification is sent with the exact reason.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════
                COMMENT — Response Options
            ════════════════════════════════════ */}
            {active.key === 'comment' && (
              <View>
                <SectionLabel label="Response Options" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Love it', color: '#e11d48', icon: 'heart' },
                    { label: 'Agree', color: '#16a34a', icon: 'thumbs-up' },
                    { label: 'Dislike', color: '#f97316', icon: 'thumbs-down' },
                    { label: 'Hate', color: '#dc2626', icon: 'close-circle' },
                  ].map(({ label, color, icon }) => (
                    <View
                      key={label}
                      style={{
                        flex: 1, minWidth: '44%',
                        borderRadius: 14, padding: 12,
                        backgroundColor: color + '10',
                        borderWidth: 1.5, borderColor: color + '30',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: color,
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                        <Ionicons name={icon as any} size={17} color="#fff" />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{label}</Text>
                      <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>
                        Tap to select
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{
                  backgroundColor: '#eff6ff', borderRadius: 14, padding: 12,
                  borderWidth: 1, borderColor: '#bfdbfe',
                  flexDirection: 'row', alignItems: 'flex-start',
                }}>
                  <Ionicons name="information-circle" size={16} color="#2563eb" />
                  <Text style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#1d4ed8', lineHeight: 18 }}>
                    You can change your response at any time. Your latest choice is what counts toward the sentiment score.
                  </Text>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════
                NOTIFICATIONS — Type Grid
            ════════════════════════════════════ */}
            {active.key === 'notification' && (
              <View>
                <SectionLabel label="Notification Types" />
                {NOTIFICATION_TYPES.map(({ label, icon, color, desc }) => (
                  <InfoCard key={label} icon={icon} label={label} desc={desc} color={color} />
                ))}
              </View>
            )}

            {/* ════════════════════════════════════
                MY PROFILE — At a Glance
            ════════════════════════════════════ */}
            {active.key === 'profile' && (
              <View>
                <SectionLabel label="Profile at a Glance" />
                {[
                  { label: 'Name', icon: 'person-outline', color: '#7c3aed', desc: 'Your full display name shown on all posts.' },
                  { label: 'Nickname', icon: 'at-outline', color: '#0891b2', desc: 'Unique @handle used across the app.' },
                  { label: 'Bio', icon: 'document-text-outline', color: '#16a34a', desc: 'Short description visible on your public profile.' },
                  { label: 'My Posts', icon: 'file-tray-full-outline', color: '#f97316', desc: 'All submitted posts with Pending / Approved / Rejected labels.' },
                  { label: 'Edit Profile', icon: 'create-outline', color: '#6366f1', desc: 'Update your details — password required for security.' },
                ].map(({ label, icon, color, desc }) => (
                  <InfoCard key={label} icon={icon} label={label} desc={desc} color={color} />
                ))}
              </View>
            )}

            {/* ════════════════════════════════════
                USER PROFILE — Public View
            ════════════════════════════════════ */}
            {active.key === 'userProfile' && (
              <View>
                <SectionLabel label="What You Can See & Do" />
                {[
                  { label: 'Name & Username', icon: 'person-outline', color: '#0891b2', desc: 'Full name and unique @handle of the user.' },
                  { label: 'Bio', icon: 'document-text-outline', color: '#7c3aed', desc: 'Short description the user wrote about themselves.' },
                  { label: 'Profile Picture', icon: 'image-outline', color: '#f97316', desc: 'Their avatar or a dummy image if AI rejected their upload.' },
                  { label: 'Followers & Following', icon: 'people-outline', color: '#16a34a', desc: 'Total counts shown under the profile header.' },
                  { label: 'Their Posts', icon: 'file-tray-full-outline', color: '#334155', desc: 'Scroll to browse all their approved public posts.' },
                  { label: 'Follow / Unfollow', icon: 'person-add-outline', color: '#2563eb', desc: 'Tap "Follow" to follow or "Following" to unfollow immediately.' },
                  { label: 'Block User', icon: 'ban-outline', color: '#dc2626', desc: 'Tap the three-dot menu → Block to hide their content from you.' },
                ].map(({ label, icon, color, desc }) => (
                  <InfoCard key={label} icon={icon} label={label} desc={desc} color={color} />
                ))}
                <View style={{
                  backgroundColor: '#eff6ff', borderRadius: 14, padding: 12,
                  borderWidth: 1, borderColor: '#bfdbfe',
                  flexDirection: 'row', alignItems: 'center', marginTop: 2,
                }}>
                  <Ionicons name="sync-outline" size={16} color="#2563eb" />
                  <Text style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#1d4ed8', lineHeight: 18 }}>
                    Follow and Unfollow actions update in real time — the follower count updates immediately after you tap.
                  </Text>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════
                MY POSTS — Rules Table + Pipeline
            ════════════════════════════════════ */}
            {active.key === 'myPosts' && (
              <View>
                <SectionLabel label="Post Action Rules" />
                {/* Table */}
                <View style={{
                  borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: '#e2e8f0',
                  marginBottom: 14,
                }}>
                  <View style={{ flexDirection: 'row', backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#e2e8f0' }}>Status</Text>
                    <Text style={{ width: 52, fontSize: 11, fontWeight: '700', color: '#e2e8f0', textAlign: 'center' }}>Edit</Text>
                    <Text style={{ width: 52, fontSize: 11, fontWeight: '700', color: '#e2e8f0', textAlign: 'center' }}>Delete</Text>
                  </View>
                  {[
                    { status: 'Pending', canEdit: true, canDelete: true, color: '#f59e0b' },
                    { status: 'Approved', canEdit: false, canDelete: true, color: '#16a34a' },
                    { status: 'Rejected', canEdit: false, canDelete: false, color: '#dc2626' },
                  ].map(({ status, canEdit, canDelete, color }, i) => (
                    <View
                      key={status}
                      style={{
                        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11,
                        alignItems: 'center',
                        backgroundColor: i % 2 === 1 ? '#f8fafc' : '#ffffff',
                        borderTopWidth: 1, borderTopColor: '#f1f5f9',
                      }}
                    >
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: color, marginRight: 8,
                        }} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>{status}</Text>
                      </View>
                      <View style={{ width: 52, alignItems: 'center' }}>
                        <Ionicons
                          name={canEdit ? 'checkmark-circle' : 'close-circle'}
                          size={20}
                          color={canEdit ? '#16a34a' : '#e2e8f0'}
                        />
                      </View>
                      <View style={{ width: 52, alignItems: 'center' }}>
                        <Ionicons
                          name={canDelete ? 'checkmark-circle' : 'close-circle'}
                          size={20}
                          color={canDelete ? '#16a34a' : '#e2e8f0'}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                <SectionLabel label="Re-validation Flow on Edit" />
                <View style={{
                  backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
                  borderRadius: 16, padding: 14,
                }}>
                  {[
                    { stage: 'Stage 0', label: 'Content received and queued', color: '#64748b' },
                    { stage: 'Stage 1', label: 'AI keyword & hate-speech scan', color: '#0284c7' },
                    { stage: 'Stage 2', label: 'Community parameter match', color: '#7c3aed' },
                    { stage: 'Stage 3', label: 'Admin final review (if needed)', color: '#f97316' },
                    { stage: 'Approved ✓', label: '4 sentiment vote options generated', color: '#16a34a' },
                  ].map(({ stage, label, color }, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ alignItems: 'center', marginRight: 10, width: 18 }}>
                        <View style={{
                          width: 18, height: 18, borderRadius: 9,
                          backgroundColor: color,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                            {i < 4 ? i : '✓'}
                          </Text>
                        </View>
                        {i < 4 && (
                          <View style={{ width: 1.5, height: 14, backgroundColor: '#fcd34d', marginTop: 1 }} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingBottom: i < 4 ? 10 : 0 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color, marginBottom: 1 }}>{stage}</Text>
                        <Text style={{ fontSize: 12, color: '#92400e', lineHeight: 17 }}>{label}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={{
                    marginTop: 10, backgroundColor: '#fef2f2',
                    borderRadius: 10, padding: 9,
                    borderWidth: 1, borderColor: '#fecaca',
                    flexDirection: 'row', alignItems: 'flex-start',
                  }}>
                    <Ionicons name="alert-circle-outline" size={13} color="#dc2626" />
                    <Text style={{ marginLeft: 6, fontSize: 11, color: '#991b1b', flex: 1, lineHeight: 16 }}>
                      If any stage fails the post stays Pending — edit again or wait for admin review.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════
                EDIT PROFILE — Fields + Security
            ════════════════════════════════════ */}
            {active.key === 'editProfile' && (
              <View>
                <SectionLabel label="What You Can Edit" />
                {[
                  { field: 'Name', editable: true, note: 'Displayed on posts and profile.', color: '#16a34a' },
                  { field: 'Username', editable: true, note: 'Unique @handle across the app.', color: '#0891b2' },
                  { field: 'Country', editable: true, note: 'Updates your location tag.', color: '#f97316' },
                  { field: 'Bio', editable: true, note: 'AI moderated — must follow community guidelines.', color: '#7c3aed' },
                  { field: 'Profile Picture', editable: true, note: 'AI moderated — non-compliant images replaced by a dummy avatar.', color: '#2563eb' },
                  { field: 'Email', editable: false, note: 'Fixed — cannot be changed after signup.', color: '#94a3b8' },
                  { field: 'Password', editable: false, note: 'Use Forgot Password flow to reset.', color: '#94a3b8' },
                ].map(({ field, editable, note, color }) => (
                  <View
                    key={field}
                    style={{
                      flexDirection: 'row', alignItems: 'flex-start',
                      borderRadius: 14, padding: 12, marginBottom: 8,
                      backgroundColor: editable ? color + '0C' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: editable ? color + '28' : '#e2e8f0',
                    }}
                  >
                    <View style={{
                      width: 34, height: 34, borderRadius: 10,
                      backgroundColor: editable ? color + '20' : '#f1f5f9',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 10, marginTop: 1,
                    }}>
                      <Ionicons
                        name={editable ? 'pencil-outline' : 'lock-closed-outline'}
                        size={16}
                        color={editable ? color : '#94a3b8'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{field}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 16 }}>{note}</Text>
                    </View>
                    <View style={{
                      borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
                      backgroundColor: editable ? color + '18' : '#f1f5f9',
                      alignSelf: 'flex-start', marginLeft: 6,
                    }}>
                      <Text style={{
                        fontSize: 10, fontWeight: '700',
                        color: editable ? color : '#94a3b8',
                      }}>
                        {editable ? 'Editable' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                ))}
                <View style={{
                  backgroundColor: '#eef2ff', borderRadius: 14, padding: 12,
                  borderWidth: 1, borderColor: '#c7d2fe',
                  flexDirection: 'row', alignItems: 'flex-start', marginTop: 2,
                }}>
                  <Ionicons name="shield-checkmark" size={18} color="#4f46e5" />
                  <Text style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#3730a3', lineHeight: 18 }}>
                    You must enter your current password before any changes are saved — this protects your account from unauthorised edits.
                  </Text>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════
                SETTINGS — Sub-items Menu
            ════════════════════════════════════ */}
            {active.key === 'settings' && (
              <View>
                <SectionLabel label="Settings Menu" />
                {[
                  { label: 'App Info', icon: 'information-circle-outline', desc: 'Version, legal links and mission statement.', color: '#0284c7' },
                  { label: 'App Guide', icon: 'map-outline', desc: 'Full walkthrough of every screen.', color: '#7c3aed' },
                  { label: 'FAQ', icon: 'help-circle-outline', desc: 'Expandable answers to common questions.', color: '#0f766e' },
                  { label: 'Blocked Users', icon: 'ban-outline', desc: 'View and unblock previously blocked accounts.', color: '#dc2626' },
                  { label: 'Delete Account', icon: 'trash-outline', desc: 'Permanently remove your account and data.', color: '#b91c1c' },
                  { label: 'Logout', icon: 'log-out-outline', desc: 'Sign out from your current session.', color: '#64748b' },
                ].map(({ label, icon, desc, color }) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#ffffff',
                      borderRadius: 16, padding: 12, marginBottom: 8,
                      borderWidth: 1, borderColor: '#f1f5f9',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
                    }}
                  >
                    <View style={{
                      width: 38, height: 38, borderRadius: 12,
                      backgroundColor: color + '15',
                      borderWidth: 1, borderColor: color + '25',
                      alignItems: 'center', justifyContent: 'center', marginRight: 11,
                    }}>
                      <Ionicons name={icon as any} size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{label}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 16 }}>{desc}</Text>
                    </View>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: '#f8fafc',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                    </View>
                  </View>
                ))}
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HelpScreen;
