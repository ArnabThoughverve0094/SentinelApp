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
  subtitle = "Find answers to common questions about Project Sentinel",
  showHeader = true,
  maxHeight
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'What is Project Sentinel?',
      answer: 'Project Sentinel is a new initiative under IronDome.org that allows users to report, map, and monitor incidents of antisemitism, anti-Zionist hate, and anti-Israel harassment, both online and in-person. It aims to create real-time visibility and educational response to rising hate.',
    },
    {
      id: '2',
      question: 'Who can use the app?',
      answer: 'Anyone can view reported incidents. To submit a report, users must create an account with verified email and agree to our terms and conditions.',
    },
    {
      id: '3',
      question: 'Do I need to reveal my identity to submit a report?',
      answer: 'No. You may submit reports anonymously or choose to display your username. If you choose to go public, you must accept additional terms acknowledging responsibility for the accuracy of your report.',
    },
    {
      id: '4',
      question: 'What kinds of incidents can I report?',
      answer: 'You can report in-person incidents (e.g., verbal abuse, graffiti, protest slogans) or online incidents (e.g., disinformation posts, antisemitic memes, harassment). All reports must be accurate, good-faith submissions.',
    },
    {
      id: '5',
      question: 'How does Project Sentinel ensure reports are truthful?',
      answer: 'Reports are reviewed by moderators before being made public. Submissions go through structured intake, language screening, and human review. Repeated abuse of the system will result in account suspension.',
    },
    {
      id: '6',
      question: 'What happens after I submit a report?',
      answer: 'Your report will be reviewed for accuracy and safety. Once approved, it may appear on our interactive map. You may receive follow-up educational content or updates if similar incidents appear nearby.',
    },
    {
      id: '7',
      question: 'Can I view reports without registering?',
      answer: 'Yes. The platform is designed to provide public visibility. Registration is only required to submit a report or receive alerts.',
    },
    {
      id: '8',
      question: 'Will my location be tracked?',
      answer: 'No GPS or live tracking is used. If reporting an in-person incident, you provide the city, state/province, and country manually.',
    },
    {
      id: '9',
      question: 'Who can see my report?',
      answer: 'Once reviewed and approved, your report will appear on the public map with the anonymity level you selected. Moderators and trusted partners may see additional metadata (never shared publicly).',
    },
    {
      id: '10',
      question: 'What if I see something false or offensive on the map?',
      answer: 'You can flag any report for moderator review. We take false reporting and platform misuse seriously and respond quickly to disputes.',
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