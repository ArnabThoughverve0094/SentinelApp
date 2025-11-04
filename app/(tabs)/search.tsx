import { db } from '@/FirebaseConfig';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDocs, onSnapshot, updateDoc, query, where } from 'firebase/firestore';
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
  docID: string;
  id: string;
  name: string;
  nickName?: string;
  email?: string;
  avatar: string;
  followers?: string[];
  postCount?: number;
  isFollowing?: boolean;
}

// Enhanced Loading Component
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

      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      );

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
    }
  }, [visible]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { logo: { width: 40, height: 40 } };
      case 'medium':
        return { logo: { width: 50, height: 50 } };
      default:
        return { logo: { width: 60, height: 60 } };
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
      <Animated.View
        style={{
          transform: [{ rotate: rotateInterpolate }, { scale: pulseAnim }],
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
            source={require('../../assets/images/new_logo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Skeleton Loading Component
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
  onFollowPress: (user: SearchUser) => void;
  currentUserId: string;
};

const SearchItem: React.FC<SearchItemProps> = ({ user, onFollowPress, currentUserId }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const isCurrentUser = user.id === currentUserId;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const dummyAvatar = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

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
            onError={(error) => console.log("Avatar load error:", error.nativeEvent.error)}
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

      {/* Right side - "You" Badge or Follow Button */}
      {isCurrentUser ? (
        <View className="px-4 py-2 rounded-lg bg-blue-50">
          <Text className="text-sm font-semibold text-blue-600">You</Text>
        </View>
      ) : (
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${user.isFollowing ? 'bg-gray-200' : 'bg-black'}`}
          onPress={() => onFollowPress(user)}
          activeOpacity={0.8}
        >
          <Text className={`text-sm font-medium ${user.isFollowing ? 'text-gray-700' : 'text-white'}`}>
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<SearchUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [currentUserDocId, setCurrentUserDocId] = useState('');

  const searchInputRef = useRef<TextInput>(null);

  // EXACT SAME PATTERN AS LANDING PAGE - Fetch user following
  const fetchUserFollowing = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if (!fetchuserID) {
        fetchuserID = (await AsyncStorage.getItem('userId')) || '';
        setUserId(fetchuserID);
      }

      if (fetchuserID) {
        console.log('👤 Fetching following list for user:', fetchuserID);
        const sentinelUsersRef = collection(db, 'SentinelUsers');
        const q = query(sentinelUsersRef, where('userID', '==', fetchuserID));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            setCurrentUserDocId(userDoc.id);
            const following = userData.Following || [];
            setFollowingUserIds(following);
            console.log('✅ Following list updated:', following);
          } else {
            console.log('📝 No user document found');
            setFollowingUserIds([]);
            setCurrentUserDocId('');
          }
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error('❌ Error fetching following list:', error);
      setFollowingUserIds([]);
    }
  }, [userId]);

  // Initialize on mount - SAME AS LANDING PAGE
  useEffect(() => {
    fetchUserFollowing();
    fetchAllUsers();
  }, []);

  // Fetch ALL users from database
  const fetchAllUsers = async () => {
    try {
      setInitialLoading(true);
      console.log('🔄 Fetching all users from database...');

      const uniqueUsers = new Map<string, SearchUser>();

      // Fetch from SentinelPosts
      try {
        const sentinelSnapshot = await getDocs(collection(db, 'SentinelPosts'));
        sentinelSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const authorId = data.AuthorUserID;

          if (authorId) {
            if (!uniqueUsers.has(authorId)) {
              uniqueUsers.set(authorId, {
                docID: "",
                id: authorId,
                name: data.AuthorName || 'Unknown User',
                avatar: data.AuthorImageURL || '',
                postCount: 1,
                isFollowing: false,
              });
            } else {
              const existing = uniqueUsers.get(authorId)!;
              existing.postCount = (existing.postCount || 0) + 1;
            }
          }
        });
        console.log(`✅ Fetched ${uniqueUsers.size} users from SentinelPosts`);
      } catch (error) {
        console.warn('⚠️ Error fetching from SentinelPosts:', error);
      }

      // Fetch from X-Data
      try {
        const xDataSnapshot = await getDocs(collection(db, 'X-Data'));
        xDataSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const authorId = data.AuthorUserID;

          if (authorId) {
            if (!uniqueUsers.has(authorId)) {
              uniqueUsers.set(authorId, {
                docID: "",
                id: authorId,
                name: data.AuthorName || 'Unknown User',
                avatar: data.AuthorImageURL || '',
                postCount: 1,
                isFollowing: false,
              });
            } else {
              const existing = uniqueUsers.get(authorId)!;
              existing.postCount = (existing.postCount || 0) + 1;
              if (!existing.avatar && data.AuthorImageURL) {
                existing.avatar = data.AuthorImageURL;
              }
            }
          }
        });
        console.log(`✅ Total unique users: ${uniqueUsers.size}`);
      } catch (error) {
        console.warn('⚠️ Error fetching from X-Data:', error);
      }

      // Sort alphabetically
      const usersArray = Array.from(uniqueUsers.values()).sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );

      console.log(`🎉 Loaded ${usersArray.length} users alphabetically`);
      setAllUsers(usersArray);
      setInitialLoading(false);
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      setInitialLoading(false);
    }
  };

  // Update following status - TRIGGERED BY followingUserIds changes
  useEffect(() => {
    if (allUsers.length > 0) {
      console.log('\n🔄 Updating following status for all users...');
      console.log('Current followingUserIds:', followingUserIds);

      const updatedUsers = allUsers.map(user => {
        const isFollowing = followingUserIds.includes(user.id);
        if (isFollowing) {
          console.log(`✅ ${user.name} (${user.id}): Following`);
        }
        return {
          ...user,
          isFollowing: isFollowing
        };
      });

      setAllUsers(updatedUsers);

      // Update filtered users
      if (searchQuery.trim().length > 0) {
        const filtered = updatedUsers.filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(updatedUsers);
      }

      console.log('✅ Following status synced\n');
    }
  }, [followingUserIds, allUsers.length]); // Trigger when following list changes

  // Search filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim());
      } else {
        setFilteredUsers(allUsers);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Perform search
  const performSearch = (query: string) => {
    setLoading(true);

    const lowerQuery = query.toLowerCase();
    const results = allUsers.filter(user =>
      user.name.toLowerCase().includes(lowerQuery)
    );

    // Sort: exact matches first, then alphabetically
    const sortedResults = results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
      const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;

      if (aExact !== bExact) {
        return bExact - aExact;
      }

      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    setFilteredUsers(sortedResults);
    setLoading(false);
    console.log(`🔍 Found ${sortedResults.length} users matching "${query}"`);
  };

  // Handle follow/unfollow - SAME PATTERN AS LANDING PAGE
  const handleFollowPress = useCallback(async (user: SearchUser) => {
    console.log(`\n🔄 ${user.isFollowing ? 'Unfollowing' : 'Following'} ${user.name}`);
    console.log('User ID:', user.id);

    try {
      if (user.isFollowing) {
        // Unfollow
        if (currentUserDocId) {
          const userRef = doc(db, "SentinelUsers", currentUserDocId);
          await updateDoc(userRef, {
            Following: arrayRemove(user.id),
          });
          console.log(`✅ Successfully unfollowed: ${user.name}`);
        }
      } else {
        // Follow
        if (currentUserDocId) {
          const userRef = doc(db, "SentinelUsers", currentUserDocId);
          await updateDoc(userRef, {
            Following: arrayUnion(user.id),
          });
          console.log(`✅ Successfully followed: ${user.name}`);
        } else {
          // Create new document
          console.log('📝 Creating new user document...');
          const newDocRef = await addDoc(collection(db, 'SentinelUsers'), {
            userID: userId,
            Following: [user.id],
          });
          setCurrentUserDocId(newDocRef.id);
          console.log(`✅ Created document and followed: ${user.name}`);
        }
      }

      // onSnapshot will automatically update the UI
      console.log('⏳ Waiting for onSnapshot to update UI...\n');
    } catch (error) {
      console.error('❌ Error handling follow/unfollow:', error);
    }
  }, [currentUserDocId, userId]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredUsers(allUsers);
    Keyboard.dismiss();
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading || initialLoading) {
      return <SkeletonLoader count={8} />;
    }

    if (searchQuery.trim().length > 0 && filteredUsers.length === 0) {
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

    if (allUsers.length === 0 && !initialLoading) {
      return (
        <View className="items-center justify-center flex-1 px-8" style={{ marginTop: screenWidth * 0.3 }}>
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
            <MaterialCommunityIcons name="account-search" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No Users Available
          </Text>
          <Text className="text-gray-500 text-center leading-6">
            There are no users to display at the moment. Check back later!
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

        {/* Search Bar */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border-2 border-gray-100">
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
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} className="ml-2 p-1">
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && filteredUsers.length > 0 && (
        <View className="py-2 px-6">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-2 text-sm text-gray-600">Updating results...</Text>
          </View>
        </View>
      )}

      {/* Results Count */}
      {filteredUsers.length > 0 && !initialLoading && (
        <View className="px-6 py-2">
          <Text className="text-sm text-gray-600">
            {searchQuery.trim().length > 0
              ? `Found ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} matching "${searchQuery}"`
              : `Showing all ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      {/* Results List */}
      <View className="flex-1">
        {filteredUsers.length > 0 ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => `user-${item.id}`}
            renderItem={({ item }) => (
              <SearchItem
                user={item}
                onFollowPress={handleFollowPress}
                currentUserId={userId}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
            ListFooterComponent={() => {
              if (loading || initialLoading) {
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
