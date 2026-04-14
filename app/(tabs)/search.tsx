import { db } from '@/FirebaseConfig';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, increment, onSnapshot, writeBatch } from 'firebase/firestore';
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

type FollowingUser = {
  userId: string;
  userEmail?: string;
  userName?: string;
  userNickName?: string;
  profilePicUrl?: string;
};

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
  loadingUserId: string | null;
};

const SearchItem: React.FC<SearchItemProps> = ({ user, onFollowPress, currentUserId, loadingUserId }) => {
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
          disabled={loadingUserId === user.id} // prevent double click
        >
          {loadingUserId === user.id ? (
            <ActivityIndicator size="small" color={user.isFollowing ? '#374151' : '#ffffff'} />
          ) : (
            <Text className={`text-sm font-medium ${user.isFollowing ? 'text-gray-700' : 'text-white'}`}>
              {user.isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
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
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const blockedUserIdsRef = useRef<string[]>([]);
  const deletedUserIdsRef = useRef<string[]>([]);

  const searchInputRef = useRef<TextInput>(null);
  const asArray = <T,>(value: unknown): T[] => {
    return Array.isArray(value) ? (value as T[]) : [];
    };

  // EXACT SAME PATTERN AS LANDING PAGE - Fetch user following
  // const fetchUserFollowing = useCallback(async () => {
  //   try {
  //     let fetchuserID = userId;
  //     if (!fetchuserID) {
  //       fetchuserID = (await AsyncStorage.getItem('userId')) || '';
  //       setUserId(fetchuserID);
  //     }

  //     if (fetchuserID) {
  //       console.log('👤 Fetching following list for user:', fetchuserID);

  //       const userDocRef = doc(db, 'IronExUsers', fetchuserID);

  //       const unsubscribeFollowing = onSnapshot(userDocRef, (docSnapshot) => {
  //         if (docSnapshot.exists()) {
  //           const data = docSnapshot.data();

  //           // 1. Get the Array of following objects
  //           // const followingList: any[] = data.Following || [];
  //           const followingList = asArray<FollowingUser>(data?.Following);
  //           const idOnlyList: string[] = followingList.map(item => item.userId);

  //           console.log(`✅ Displaying ${followingList.length} following`);
  //           setFollowingUserIds(idOnlyList);
  //           setFollowingUsers(followingList);
  //         }
  //       }, (error) => {
  //         console.error("❌ Real-time listener failed:", error);
  //         setFollowingUserIds([]);
  //         setFollowingUsers([]);
  //       });

  //       return unsubscribeFollowing;
  //     }
  //   } catch (error) {
  //     console.error('❌ Error fetching following list:', error);
  //     setFollowingUserIds([]);
  //   }
  // }, [userId]);

  const fetchDeletedUsers = useCallback(async () => {
    try {
      const deletionRef = collection(db, 'UserDeletionAudit');
      const unsubscribe = onSnapshot(deletionRef, (snapshot) => {
        const deletedIds = snapshot.docs.map(doc => doc.data().userName).filter(Boolean);
        deletedUserIdsRef.current = deletedIds; // ✅ Keep ref in sync
        setDeletedUserIds(deletedIds);
      });
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error fetching deleted users:', error);
      setDeletedUserIds([]);
    }
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      let fetchuserID = userId;
      if (!fetchuserID) {
        fetchuserID = (await AsyncStorage.getItem('userId')) || '';
        setUserId(fetchuserID);
      }
      if (!fetchuserID) return;

      const blockedDocRef = doc(db, 'UserBlocked', fetchuserID);
      const unsubscribe = onSnapshot(blockedDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const blockedIds: string[] = (data.blockedList || [])
            .map((item: any) => item.postauthoruserid)
            .filter(Boolean);
          console.log('🚫 Blocked user IDs:', blockedIds);
          blockedUserIdsRef.current = blockedIds; // ✅ Keep ref in sync
          setBlockedUserIds(blockedIds);
        } else {
          blockedUserIdsRef.current = [];
          setBlockedUserIds([]);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error fetching blocked users:', error);
      setBlockedUserIds([]);
    }
  }, [userId]);

  // ✅ FIX: Mount order — fetch blocked/deleted FIRST, then fetch users
  // useEffect(() => {
  //   const init = async () => {
  //     await fetchUserFollowing();
  //     await fetchDeletedUsers();
  //     await fetchBlockedUsers();
  //     // ✅ Now fetch users AFTER blocked/deleted IDs are loaded into refs
  //     fetchAllUsers();
  //   };
  //   init();
  // }, []);

  useEffect(() => {
    let unsubscribeFollowing = () => {};
  
    const setupListeners = async () => {
      // 1. Run your one-time fetches first
      await Promise.all([fetchDeletedUsers(), fetchBlockedUsers()]);
      
      // 2. Get the ID for the listener
      let fetchuserID = userId;
      if (!fetchuserID) {
        fetchuserID = (await AsyncStorage.getItem('userId')) || '';
        setUserId(fetchuserID);
      }
  
      if (fetchuserID) {
        const userDocRef = doc(db, 'IronExUsers', fetchuserID);
  
        // 3. Start the real-time listener
        unsubscribeFollowing = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const followingList = asArray<FollowingUser>(data?.Following) || [];
            const idOnlyList = followingList.map(item => item.userId);
  
            setFollowingUserIds(idOnlyList);
            setFollowingUsers(followingList);
            
            // 4. Re-fetch or filter all users whenever the following list changes
            fetchAllUsers(); 
          }
        }, (error) => {
          console.error("❌ Listener failed:", error);
        });
      }
    };
  
    setupListeners();
  
    // CLEANUP: This is crucial for real-time to work correctly
    return () => {
      unsubscribeFollowing();
    };
  }, [userId]);

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
                email: data.AuthorEmail || '',
                nickName: data.AuthorNickName || '',
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

      // Sort alphabetically
      // UPDATED
       const usersArray = Array.from(uniqueUsers.values())
        .filter(user => !deletedUserIdsRef.current.includes(user.id))
        .filter(user => !blockedUserIdsRef.current.includes(user.id))
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));


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
    useEffect(() => {
      if (deletedUserIds.length > 0) {
        setAllUsers(prev => prev.filter(user => !deletedUserIds.includes(user.id)));
        setFilteredUsers(prev => prev.filter(user => !deletedUserIds.includes(user.id)));
      }
    }, [deletedUserIds]);
    // ✅ Hide/show blocked users in real-time when block status changes
      useEffect(() => {
        setAllUsers(prev => prev.filter(user => !blockedUserIds.includes(user.id)));
        setFilteredUsers(prev => prev.filter(user => !blockedUserIds.includes(user.id)));
      }, [blockedUserIds]);


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

    setLoadingUserId(user.id);

    let fetchuserID = userId;
    if (!fetchuserID) {
      fetchuserID = (await AsyncStorage.getItem('userId')) || '';
      setUserId(fetchuserID);
    }

    const fetchUserEmail = (await AsyncStorage.getItem("userEmail")) || '';
    const fetchUserName = (await AsyncStorage.getItem("userName")) || '';
    const fetchUserNickName = (await AsyncStorage.getItem("userNickName")) || '';
    const fetchUserProfilePicURL = (await AsyncStorage.getItem("profilePicUrl")) || '';
    
    const batch = writeBatch(db);
    const userUsersDocRef = doc(db, 'IronExUsers', fetchuserID);
    const targetUserDocRef = doc(db, 'IronExUsers', user.id);

    // Data objects for the arrays
    const followingData = {
      userId: user.id,
      userEmail: user.email || '',
      userName: user.name || '',
      userNickName: user.nickName || '',
      profilePicUrl: user.avatar || ''
    };
  
    const followerData = {
      userId: fetchuserID,
      userEmail: fetchUserEmail || '',
      userName: fetchUserName || '',
      userNickName: fetchUserNickName || '',
      profilePicUrl: fetchUserProfilePicURL || ''
    };

    try {
      if (user.isFollowing) {
        // --- UNFOLLOW LOGIC ---
        // batch.update(userUsersDocRef, {
        //   Following: arrayRemove(followingData), // Atomic remove
        //   followingCount: increment(-1)
        // });
  
        // batch.update(targetUserDocRef, {
        //   Follower: arrayRemove(followerData), // Atomic remove
        //   followerCount: increment(-1)
        // });

        console.log('user.isFollowing:', user.isFollowing);
        try {
          const userDocRef = doc(db, "IronExUsers", user.id);
          const docSnapshot = await getDoc(userDocRef); // One-time request
      
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            
            // Use your helper to ensure they are arrays
            const followerList = asArray<FollowingUser>(data?.Follower) || [];
      
            const exactFollowingData = followingUsers.find(f => f.userId === user.id);
            console.log('exactFollowingData:', exactFollowingData);
  
            const exactFollowerData = followerList.find(f => f.userId === fetchuserID);
            console.log('exactFollowerData:', exactFollowerData);

            if (exactFollowingData) {
              batch.update(userUsersDocRef, {
                Following: arrayRemove(exactFollowingData),
                followingCount: increment(-1)
              });
            }

            if (exactFollowerData) {
              batch.update(targetUserDocRef, {
                Follower: arrayRemove(exactFollowerData),
                followerCount: increment(-1)
              });
            }
            
          } else {
            console.error("❌ Failed to fetch user follower");
          }
        } catch (error) {
          console.error("❌ Failed to fetch user stats:", error);
        }

        

      } else {
        // --- FOLLOW LOGIC ---
        batch.set(userUsersDocRef, {
          userID: fetchuserID,
          userEmail: fetchUserEmail || '',
          userName: fetchUserName || '',
          userNickName: fetchUserNickName || '',
          profilePicUrl: fetchUserProfilePicURL || '',
          Following: arrayUnion(followingData),
          followingCount: increment(1)
        }, { merge: true });
  
        batch.set(targetUserDocRef, {
          userID: user.id,
          userEmail: user.email || '',
          userName: user.name || '',
          userNickName: user.nickName || '',
          profilePicUrl: user.avatar || '',
          Follower: arrayUnion(followerData),
          followerCount: increment(1)
        }, { merge: true });
      }
      
      // Commit both updates at once
      await batch.commit();

      // onSnapshot will automatically update the UI
      console.log('⏳ Waiting for onSnapshot to update UI...\n');
    } catch (error) {
      console.error('❌ Error handling follow/unfollow:', error);
    } finally {
      setLoadingUserId(null);
    }
  }, [userId, followingUsers]);

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
  const goBack = useCallback(() => router.back(), [router]);

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
              onPress={goBack}
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
                loadingUserId={loadingUserId}
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
