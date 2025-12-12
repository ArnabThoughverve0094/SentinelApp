import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface SentinelFAQProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  maxHeight?: number;
}

const SentinelFAQ: React.FC<SentinelFAQProps> = ({ 
  title = "Frequently Asked Questions",
  subtitle = "Real-Time Reporting · Curated Sentiment · Safe Educational Space",
  showHeader = true,
  maxHeight
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'What is IronEx?',
      answer: 'IronEx is a real-time reporting and educational platform designed to document, analyze, and understand antisemitic, antizionist, and anti-Israel incidents across the digital and physical world. The platform combines moderated public posts, structured sentiment polling, and a curated educational library to help users interpret complex events without exposing them to harassment or hostile comment threads.',
    },
    {
      id: '2',
      question: 'Who can participate on IronEx?',
      answer: 'Only registered users can participate. Registration is required to: submit incident reports, select sentiment responses, access the Learning Hub, and apply to volunteer as a moderator. Registration ensures higher integrity, reduces spam and abuse, and improves safety for all users.',
    },
    {
      id: '3',
      question: "Why doesn't IronEx allow comments or open replies?",
      answer: 'IronEx is built to protect users, not expose them to hostile interactions. Open comment threads on other platforms often devolve into harassment, dog-piling, antisemitic or hateful responses, and distractive arguments. Instead of comments, IronEx uses 4–6 curated sentiment choices per post, allowing users to express their interpretation without enabling personal attacks.',
    },
    {
      id: '4',
      question: 'How does the sentiment system work?',
      answer: 'Each published report includes a set of curated, neutral response choices. Users tap one, and IronEx updates the Live Sentiment Barometer, showing how viewers interpret the event, shifts in community sentiment over time, and differences in perception across topics. This gives users insight without the toxicity of comments or debates.',
    },
    {
      id: '5',
      question: 'What kinds of incidents can be reported?',
      answer: 'Users can submit: online posts, videos, or comments containing antisemitism or anti-Israel rhetoric; in-person incidents (graffiti, harassment, threats, vandalism, demonstrations); first-person experiences; and examples from academic, political, cultural, or religious spaces. IronEx currently supports screenshots, links, text descriptions, and optional contextual information.',
    },
    {
      id: '6',
      question: 'Who reviews incident submissions?',
      answer: 'Every submission is reviewed before publication by IronEx moderators, cleared volunteers, and safety reviewers trained to verify authenticity and remove sensitive identifying details. This ensures accuracy, reduces false reporting, and protects individuals involved.',
    },
    {
      id: '7',
      question: 'What is the IronEx Learning Hub?',
      answer: 'The Learning Hub is a companion section of the platform featuring short explainers, historical context, scholar-vetted articles, "Quick Clips" video commentary, definitions of tropes, slogans, symbols, and myths, and guides for identifying misinformation and propaganda. The Learning Hub helps users understand why incidents matter and the history behind modern antisemitism and antizionism.',
    },
    {
      id: '8',
      question: 'How is educational content selected?',
      answer: 'IronEx sources and curates content from historians, journalists, scholars of antisemitism, experts in Middle East studies, and legal analysts. Every educational post undergoes editorial review to ensure accuracy, neutral tone, clear sourcing, and avoidance of inflammatory rhetoric.',
    },
    {
      id: '9',
      question: 'Can users submit educational material?',
      answer: 'Yes — registered users can suggest videos, articles, or context packs. All submissions are screened for accuracy, relevance, safety, potential harm, and compliance with IronEx editorial standards. Only vetted items appear in the public Learning Hub.',
    },
    {
      id: '10',
      question: 'How is user data protected?',
      answer: 'IronEx uses pseudonymous reporting options, minimal user data collection, secure evidence redaction workflows, no sharing of personal information with the public, and internal-only moderation logs. IronEx will never publish or sell personal data.',
    },
    {
      id: '11',
      question: 'Does IronEx allow political advocacy?',
      answer: 'IronEx allows documentation and analysis of incidents and rhetoric, not political campaigning. The platform restricts calls for violence, harassing content, coordinated political persuasion, and unverified conspiracy theories. Educational materials may touch on political topics, but only within a factual, scholarly framework.',
    },
    {
      id: '12',
      question: 'How do I become a volunteer moderator?',
      answer: 'Registered users may apply through the Volunteer Portal. Volunteers receive safety and verification training, guidance on identifying antisemitic tropes, review protocols for incident submissions, tools for redacting sensitive personal information. Access is granted only after screening and review.',
    },
    {
      id: '13',
      question: 'Is there a donor or supporter space?',
      answer: 'A dedicated Donor & Supporter Portal is under development. This section will allow verified donors to support IronEx mission, funding for educational content, outreach, and moderation expansion, and transparent reporting on impact metrics.',
    },
    {
      id: '14',
      question: 'Is IronEx affiliated with any political party or organization?',
      answer: 'No. IronEx is independent and does not endorse any political party, candidate, or organization. Its mission is informational, archival, and educational.',
    },
    {
      id: '15',
      question: 'Is IronEx free to use?',
      answer: 'Yes. Core features — reporting, sentiment participation, and access to educational materials — are free for all registered users. Future optional enhancements may include supporter tiers or institutional accounts.',
    },
  ];

  const toggleItem = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  const content = (
    <View className="w-full">
      {showHeader && (
        <View className="mb-6">
          <Text className="text-2xl font-bold text-black mb-2 leading-tight">
            {title}
          </Text>
          <Text className="text-sm text-black/70 leading-5">
            {subtitle}
          </Text>
        </View>
      )}

      <View className="gap-3">
        {faqData.map((item) => (
          <View
            key={item.id}
            className="bg-white/95 rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <TouchableOpacity
              className="flex-row items-center justify-between py-4 px-5"
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              <Text className="text-sm text-gray-700 font-medium flex-1 mr-3 leading-5">
                {item.question}
              </Text>
              <Ionicons
                name={expandedItems.has(item.id) ? "chevron-up" : "chevron-down"}
                size={18}
                color="#6b7280"
              />
            </TouchableOpacity>
            
            {expandedItems.has(item.id) && (
              <View className="px-5 pb-4 border-t border-gray-200/50">
                <Text className="text-xs text-gray-600 leading-5 mt-3">
                  {item.answer}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  if (maxHeight) {
    return (
      <ScrollView 
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

export default SentinelFAQ;
