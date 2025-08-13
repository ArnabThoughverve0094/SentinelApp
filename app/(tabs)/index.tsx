import React from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SentinelFeed(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Sentinel</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* First Post */}
        <View className="bg-white border-b border-gray-100 px-4 py-4">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 bg-black rounded-full mr-3 items-center justify-center">
              <Ionicons name="close" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">@username12</Text>
            </View>
            <Text className="text-gray-400 text-sm mr-2">21m</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-gray-900 mb-3 leading-5">
            Some text will come here some text will come here some text will come here.
          </Text>
          
          {/* Coffee Image Post */}
          <View className="relative mb-3">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop' }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black bg-opacity-20 rounded-lg items-center justify-center">
              <View className="w-12 h-12 bg-white bg-opacity-90 rounded-full items-center justify-center">
                <Ionicons name="play" size={20} color="#000" style={{ marginLeft: 2 }} />
              </View>
            </View>
            <View className="absolute bottom-2 left-2">
              <Text className="text-white text-xs font-medium">@username</Text>
            </View>
          </View>
          
          {/* Engagement Row */}
          <View className="flex-row items-center">
            <TouchableOpacity className="flex-row items-center mr-6">
              <Ionicons name="heart" size={20} color="red" />
              <Text className="text-gray-600 ml-1 text-sm">23</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-6">
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">12</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-auto">
              <Ionicons name="repeat-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">31</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Second Post */}
        <View className="bg-white border-b border-gray-100 px-4 py-4">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Tarun Thisu</Text>
            </View>
            <Text className="text-gray-400 text-sm mr-2">1hr</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-gray-900 mb-3 leading-5">
            Some text will come here some text will come here some text will come here.
          </Text>
          
          {/* Engagement Row */}
          <View className="flex-row items-center">
            <TouchableOpacity className="flex-row items-center mr-6">
              <Ionicons name="heart-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">23</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-6">
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">12</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-auto">
              <Ionicons name="repeat-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">31</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Third Post */}
        <View className="bg-white border-b border-gray-100 px-4 py-4">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full mr-3 overflow-hidden">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Rajesh Francis</Text>
            </View>
            <Text className="text-gray-400 text-sm mr-2">2hr</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-gray-900 mb-3 leading-5">
            Some text will come here some text will come here some text will come here some text will come here some text will come here. <Text className="text-purple-500">#hashtag</Text>
          </Text>
          
          {/* Abstract Image Post */}
          <View className="mb-3">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=200&fit=crop' }}
              className="w-full h-40 rounded-lg"
              resizeMode="cover"
            />
          </View>
          
          {/* Engagement Row */}
          <View className="flex-row items-center">
            <TouchableOpacity className="flex-row items-center mr-6">
              <Ionicons name="heart-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">23</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-6">
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">12</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-auto">
              <Ionicons name="repeat-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-1 text-sm">31</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}