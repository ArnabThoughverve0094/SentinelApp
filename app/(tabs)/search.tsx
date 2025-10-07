import { db } from '@/FirebaseConfig';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

// User interface for search results
interface SearchUser {
  id: string;
  name: string;
  nickName?: string;
  email?: string;
  avatar: string;
  followers?: string;
  postCount?: number;
  isFollowing?: boolean;
}

// Enhanced Loading Component matching your landing page
const LoadingComponent: React.FC<{ visible?: boolean; size?: 'small' | 'medium' | 'large' }> = ({
  visible = true,
  size = 'medium'
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Enhanced entrance animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      );

      // Pulse animation for the logo
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, rotateAnim, scaleAnim, opacityAnim, pulseAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          logo: { width: 40, height: 40 },
        };
      case 'medium':
        return {
          logo: { width: 50, height: 50 },
        };
      default: // large
        return {
          logo: { width: 60, height: 60 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 20,
      }}
    >
      {/* Animated Logo Container */}
      <Animated.View
        style={{
          transform: [
            { rotate: rotateInterpolate },
            { scale: pulseAnim }
          ],
          zIndex: 10,
        }}
      >
        <View
          style={{
            width: sizeStyles.logo.width,
            height: sizeStyles.logo.height,
            borderRadius: sizeStyles.logo.width / 2,
            overflow: 'hidden',
            borderWidth: 4,
            borderColor: '#ffffff',
            backgroundColor: '#ffffff',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Image
            source={require('../../assets/images/sentinel_logo.png')}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Skeleton Loading Component for Search Results
const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={{ paddingHorizontal: 24 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={`skeleton-${index}`}
          style={{ 
            opacity: shimmerOpacity,
            marginBottom: 12,
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e7eb', marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ width: 120, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 6 }} />
              <View style={{ width: 80, height: 12, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
            </View>
            <View style={{ width: 60, height: 32, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Search Item Component
type SearchItemProps = {
  user: SearchUser;
  onFollowPress: (userId: string) => void;
  currentUserId: string;
};

// Follow FUNCTION
const handleFollow = useCallback(async (user: SearchUser, currentUserId: any) => {

}, []);

const SearchItem: React.FC<SearchItemProps> = ({ user, onFollowPress, currentUserId }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const dummyAvatar = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

  // Don't show current user in search results
  if (user.id === currentUserId) {
    return null;
  }

  return (
    <Animated.View 
      style={{ transform: [{ scale: scaleAnim }] }}
      className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 mb-3 shadow-sm border border-gray-100 mx-6"
    >
      {/* Left side - Avatar and Info */}
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-gray-100">
          <Image
            source={{ uri: user.avatar || dummyAvatar }}
            className="w-full h-full"
            resizeMode="cover"
            onError={(error) => {
              console.log("Avatar load error:", error.nativeEvent.error);
            }}
          />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {user.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            {user.nickName && (
              <Text className="text-sm text-gray-500 mr-2" numberOfLines={1}>
                @{user.nickName}
              </Text>
            )}
            {user.postCount !== undefined && (
              <Text className="text-xs text-gray-400">
                {user.postCount} posts
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Right side - Follow Button */}
      <TouchableOpacity 
        className={`px-4 py-2 rounded-lg ${user.isFollowing ? 'bg-gray-200' : 'bg-black'}`}
        onPress={() => onFollowPress(user.id)}
        activeOpacity={0.8}
      >
        <Text className={`text-sm font-medium ${user.isFollowing ? 'text-gray-700' : 'text-white'}`}>
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Load current user ID
  useEffect(() => {
    loadCurrentUserId();
  }, []);

  const loadCurrentUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error('Error loading current user ID:', error);
    }
  };

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Enhanced search function
  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      console.log('🔍 Searching for users with query:', query);
      
      const searchResults: SearchUser[] = [];
      const lowerQuery = query.toLowerCase();

      // Search in SentinelPosts collection for unique authors
      try {
        console.log('📊 Searching SentinelPosts collection...');
        const sentinelSnapshot = await getDocs(collection(db, 'SentinelPosts'));
        
        const uniqueAuthors = new Map<string, SearchUser>();
        
        sentinelSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const authorName = data.AuthorName?.toLowerCase() || '';
          
          // Check if author name contains the search query
          if (authorName.includes(lowerQuery)) {
            const authorKey = authorName;
            
            if (!uniqueAuthors.has(authorKey)) {
              uniqueAuthors.set(authorKey, {
                id: `sentinel-${doc.id}-${authorName}`, // Use a composite ID
                name: data.AuthorName || 'Unknown User',
                avatar: data.AuthorImageURL || '',
                postCount: 1,
                isFollowing: false, // This would be determined by your follow system
              });
            } else {
              // Increment post count
              const existing = uniqueAuthors.get(authorKey)!;
              existing.postCount = (existing.postCount || 0) + 1;
            }
          }
        });

        // Add to results
        uniqueAuthors.forEach(author => {
          searchResults.push(author);
        });
        
        console.log(`✅ Found ${uniqueAuthors.size} unique authors in SentinelPosts`);
      } catch (sentinelError) {
        console.warn('⚠️ Error searching SentinelPosts:', sentinelError);
      }

      // Search in X-Data collection for unique authors
      try {
        console.log('📊 Searching X-Data collection...');
        const xDataSnapshot = await getDocs(collection(db, 'X-Data'));
        
        const uniqueXAuthors = new Map<string, SearchUser>();
        
        xDataSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const authorName = data.AuthorName?.toLowerCase() || '';
          
          // Check if author name contains the search query
          if (authorName.includes(lowerQuery)) {
            const authorKey = authorName;
            
            if (!uniqueXAuthors.has(authorKey)) {
              uniqueXAuthors.set(authorKey, {
                id: `xdata-${doc.id}-${authorName}`, // Use a composite ID
                name: data.AuthorName || 'Unknown User',
                avatar: data.AuthorImageURL || '',
                postCount: 1,
                isFollowing: false,
              });
            } else {
              // Increment post count
              const existing = uniqueXAuthors.get(authorKey)!;
              existing.postCount = (existing.postCount || 0) + 1;
            }
          }
        });

        // Add to results, but avoid duplicates by name
        uniqueXAuthors.forEach(author => {
          const existingIndex = searchResults.findIndex(
            existing => existing.name.toLowerCase() === author.name.toLowerCase()
          );
          
          if (existingIndex >= 0) {
            // Merge post counts if same author found in both collections
            searchResults[existingIndex].postCount = 
              (searchResults[existingIndex].postCount || 0) + (author.postCount || 0);
            
            // Use the better avatar if available
            if (!searchResults[existingIndex].avatar && author.avatar) {
              searchResults[existingIndex].avatar = author.avatar;
            }
          } else {
            searchResults.push(author);
          }
        });
        
        console.log(`✅ Found ${uniqueXAuthors.size} unique authors in X-Data`);
      } catch (xDataError) {
        console.warn('⚠️ Error searching X-Data:', xDataError);
      }

      // Remove current user from results and sort by relevance
      const filteredResults = searchResults
        .filter(user => user.id !== currentUserId)
        .sort((a, b) => {
          // Sort by exact match first, then by post count
          const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
          const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
          
          if (aExact !== bExact) {
            return bExact - aExact; // Exact matches first
          }
          
          return (b.postCount || 0) - (a.postCount || 0); // Then by post count
        });

      setSearchResults(filteredResults);
      console.log(`🎉 Total search results: ${filteredResults.length}`);

    } catch (error) {
      console.error('❌ Error performing search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle follow/unfollow action
  const handleFollowPress = useCallback((userId: string) => {
    console.log('Follow/Unfollow pressed for user:', userId);
    
    // Update the local state optimistically
    setSearchResults(prevResults => 
      prevResults.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );

    // Here you would implement your actual follow/unfollow API call
    // Example:
    // await followUser(userId);
    
  }, []);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    Keyboard.dismiss();
  };

  // Focus search input when screen focuses
  useFocusEffect(
    useCallback(() => {
      // Optional: Auto-focus search input when screen loads
      // setTimeout(() => {
      //   searchInputRef.current?.focus();
      // }, 100);
    }, [])
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return <SkeletonLoader count={5} />;
    }

    if (!hasSearched) {
      return (
        <View className="items-center justify-center flex-1 px-8" style={{ marginTop: screenWidth * 0.3 }}>
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
            <MaterialCommunityIcons name="account-search" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Discover People
          </Text>
          <Text className="text-gray-500 text-center leading-6">
            Search for users by their name to connect with amazing people and discover new content.
          </Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length === 0 && !loading) {
      return (
        <View className="items-center justify-center flex-1 px-8" style={{ marginTop: screenWidth * 0.2 }}>
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="search-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No Users Found
          </Text>
          <Text className="text-gray-500 text-center leading-6">
            We couldn't find any users matching "{searchQuery}". Try searching with a different name.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-3">
        <View className="px-6 pt-8 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Search</Text>
            <TouchableOpacity 
              className="p-2 rounded-full bg-gray-100"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Search Bar */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border-2 border-gray-100 focus:border-blue-500">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              className="ml-3 flex-1 text-gray-900 text-base"
              placeholder="Search people..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={false}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  performSearch(searchQuery.trim());
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                className="ml-2 p-1"
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Search suggestion */}
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <Text className="text-xs text-gray-400 mt-2 px-1">
              Type at least 2 characters to search
            </Text>
          )}
        </View>
      </View>

      {/* Loading indicator at top */}
      {loading && searchResults.length > 0 && (
        <View className="py-2 px-6">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-2 text-sm text-gray-600">Updating results...</Text>
          </View>
        </View>
      )}

      {/* Results Count */}
      {hasSearched && !loading && searchResults.length > 0 && (
        <View className="px-6 py-2">
          <Text className="text-sm text-gray-600">
            Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </Text>
        </View>
      )}

      {/* Results List */}
      <View className="flex-1">
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SearchItem 
                user={item} 
                onFollowPress={handleFollowPress}
                currentUserId={currentUserId}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
            ListFooterComponent={() => {
              if (loading) {
                return (
                  <View className="py-4">
                    <LoadingComponent visible={true} size="small" />
                  </View>
                );
              }
              return null;
            }}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});