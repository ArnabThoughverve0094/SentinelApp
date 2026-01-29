import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '@/FirebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';

const EDIT_PROFILE_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/update-profile';
const UPLOAD_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile';
const AI_MODERATION_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/ai-based-post-analysis';
const GET_PROFILE_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/get-profile'; // Add your GET profile API
const DEFAULT_AVATAR = 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg';

export default function EditProfileScreen({ visible, onClose, onSuccess }) {
  const [fields, setFields] = useState({
    name: '',
    nickname: '',
    country: '',
    profilePicUrl: '',
    bio: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imageValidated, setImageValidated] = useState(false);
  const [bioValidated, setBioValidated] = useState(false);
  
  // Custom Alert State
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    buttons: [],
    icon: 'checkmark-circle',
  });

  useEffect(() => {
  async function loadProfileFromStorage() {
    console.log('🔍 [EditProfile] Loading profile from AsyncStorage...');

    if (visible) {
      setIsLoading(true);
      try {
        // First, try to load from AsyncStorage
        const [name, nickname, email, country, bio, profilePicUrl] =
          await AsyncStorage.multiGet([
            'userName',
            'userNickName',
            'userEmail',
            'userCountry',
            'userBio',
            'profilePicUrl',
          ]);

        console.log('✅ [EditProfile] Profile loaded from storage');
        console.log('🔍 [EditProfile] Raw AsyncStorage values:');
        console.log('  Country key:', country);
        console.log('  Country value:', country[1]);
        console.log('  Bio value:', bio[1]);

        // If country is missing from AsyncStorage, try to fetch from API
        if (!country[1] || country[1] === '' || country[1] === 'null') {
          console.log('⚠️ [EditProfile] Country not found in storage, fetching from API...');
          await fetchProfileFromAPI();
        } else {
          // Set fields from AsyncStorage
          setFields({
            name: name[1] || '',
            nickname: nickname[1] || '',
            email: email[1] || '',
            country: country[1] || '',
            bio: bio[1] || '',
            profilePicUrl: profilePicUrl[1] || '',
          });

          console.log('✅ [EditProfile] Fields set:', {
            country: country[1] || '(empty)',
            bio: bio[1] || '(empty)',
          });

          // Mark existing data as validated (since it was already approved)
          if (profilePicUrl[1]) setImageValidated(true);
          if (bio[1]) setBioValidated(true);
        }

        console.log('✅ [EditProfile] Fields updated successfully');
      } catch (error) {
        console.error('❌ [EditProfile] Error loading from storage:', error);
        showCustomAlert('error', 'Error', 'Could not load profile data', [{ text: 'OK' }], 'alert-circle');
      }
      setIsLoading(false);
    }
  }
  if (visible) {
    loadProfileFromStorage();
  }
}, [visible]);


  // Fetch profile from API if data is missing from AsyncStorage
  const fetchProfileFromAPI = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('userToken');
    
    if (!accessToken) {
      console.error('❌ [EditProfile] No access token for API fetch');
      return;
    }

    console.log('📡 [EditProfile] Fetching profile from API...');
    
    const response = await fetch(GET_PROFILE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [EditProfile] Profile fetched from API:', data);

    // ✅ ENHANCED: Check multiple possible field names from API
    const profileData = {
      name: data.name || data.userName || data.userAttributes?.name || '',
      nickname: data.nickname || data.nickName || data.userAttributes?.nickname || '',
      email: data.email || data.userAttributes?.email || '',
      country: data.country || data.userAttributes?.country || '', // ✅ Check multiple locations
      bio: data.bio || data.userAttributes?.bio || '',
      profilePicUrl: data.profilePicUrl || data.profilePic || data.userAttributes?.profilePic || '',
    };

    console.log('🔍 [EditProfile] Parsed profile data:');
    console.log('  Country:', profileData.country || '(empty)');
    console.log('  Bio:', profileData.bio || '(empty)');

    setFields(profileData);

    // Save to AsyncStorage for future use
    await AsyncStorage.multiSet([
      ['userName', profileData.name],
      ['userNickName', profileData.nickname],
      ['userEmail', profileData.email],
      ['userCountry', profileData.country], // ✅ Save country
      ['userBio', profileData.bio],
      ['profilePicUrl', profileData.profilePicUrl],
    ]);

    console.log('✅ [EditProfile] Profile data saved to AsyncStorage');

    // Mark existing data as validated
    if (profileData.profilePicUrl) setImageValidated(true);
    if (profileData.bio) setBioValidated(true);

  } catch (error) {
    console.error('❌ [EditProfile] Error fetching profile from API:', error);
    
    // If API fails, still load whatever we have from AsyncStorage
    const [name, nickname, email, country, bio, profilePicUrl] =
      await AsyncStorage.multiGet([
        'userName',
        'userNickName',
        'userEmail',
        'userCountry', // ✅ Include country in fallback
        'userBio',
        'profilePicUrl',
      ]);

    setFields({
      name: name[1] || '',
      nickname: nickname[1] || '',
      email: email[1] || '',
      country: country[1] || '', // ✅ Use country from AsyncStorage
      bio: bio[1] || '',
      profilePicUrl: profilePicUrl[1] || '',
    });

    console.log('🔍 [EditProfile] Loaded from AsyncStorage fallback:');
    console.log('  Country:', country[1] || '(empty)');

    if (profilePicUrl[1]) setImageValidated(true);
    if (bio[1]) setBioValidated(true);
  }
};


  // Custom Alert Function (similar to your profile page)
  const showCustomAlert = (type, title, message, buttons = [], icon = 'information-circle') => {
    setAlertConfig({
      type,
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => setCustomAlertVisible(false) }],
      icon,
    });
    setCustomAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setCustomAlertVisible(false);
  };

  // Helper function to validate content with AI
  const validateContent = async (imageUrl: string | null, bioText: string | null) => {
    try {
      console.log('🤖 [EditProfile] Validating content with AI...');
      console.log('🖼️ Image URL:', imageUrl ? 'Present' : 'None');
      console.log('📝 Bio text:', bioText ? 'Present' : 'None');
      
      const response = await fetch(AI_MODERATION_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postText: bioText,
          imageUrl: imageUrl
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [EditProfile] Moderation check complete:', data);
      
      return {
        postStatus: data.postStatus,
        flagged: data.flagged,
        violations: data.violations || [],
        categories: data.categories || {}
      };
    } catch (error) {
      console.error('❌ [EditProfile] Error checking content:', error);
      // Fallback: flag for safety if API fails
      return {
        postStatus: 'inappropriate',
        flagged: true,
        violations: ['api_error'],
        categories: {}
      };
    }
  };

  async function uploadImageToServer(localUri, timestamp) {
    console.log('📤 [EditProfile] Uploading image:', localUri);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: `profilepic_${timestamp}.jpg`,
        type: 'image/jpeg',
      } as any);

      console.log('📡 [EditProfile] Uploading to:', UPLOAD_API);
      const res = await fetch(UPLOAD_API, { method: 'POST', body: formData });
      const data = await res.json();
      console.log('✅ [EditProfile] Upload response:', data);

      return data.path || data.fileUrl || '';
    } catch (error) {
      console.error('❌ [EditProfile] Upload failed:', error);
      showCustomAlert('error', 'Upload Failed', 'Could not upload profile picture.', [{ text: 'OK' }], 'cloud-upload-outline');
      return '';
    }
  }

  const handlePickImage = async () => {
    console.log('🖼️ [EditProfile] Opening image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('✅ [EditProfile] Image selected:', result.assets[0].uri);
      setIsLoading(true);
      setImageValidated(false);
      
      const timestamp = Date.now();
      const uploadPath = await uploadImageToServer(result.assets[0].uri, timestamp);

      if (uploadPath) {
        console.log('✅ [EditProfile] Image uploaded, validating with AI...');
        
        // Validate the uploaded image with AI
        const validationResult = await validateContent(uploadPath, null);
        
        if (validationResult.postStatus !== 'approved' || validationResult.flagged) {
          console.warn('⚠️ [EditProfile] Profile picture validation failed');
          setIsLoading(false);
          
          showCustomAlert(
            'error',
            'Profile Picture Not Acceptable',
            'The selected image does not meet our community guidelines. Please choose another image that:\n\n• Shows a clear profile picture\n• Contains no offensive content\n• Meets quality standards\n\nA default profile picture has been set instead.',
            [{ 
              text: 'Choose Another Image', 
              onPress: () => {
                hideCustomAlert();
                setTimeout(() => handlePickImage(), 300);
              } 
            },
            { 
              text: 'OK', 
              onPress: hideCustomAlert 
            }],
            'close-circle'
          );
          
          // Set to default avatar (dummy image)
          setFields(f => ({ ...f, profilePicUrl: DEFAULT_AVATAR }));
          setImageValidated(false);
          return;
        }
        
        // Image passed validation
        console.log('✅ [EditProfile] Profile picture validated successfully!');
        setFields(f => ({ ...f, profilePicUrl: uploadPath }));
        setImageValidated(true);
        
        showCustomAlert(
          'success',
          'Image Validated Successfully! ✓',
          'Your profile picture has been validated and meets our community guidelines.',
          [{ text: 'Great!', onPress: hideCustomAlert }],
          'checkmark-circle'
        );
      } else {
        showCustomAlert('error', 'Upload Error', 'Failed to upload image.', [{ text: 'OK' }], 'alert-circle');
      }
      
      setIsLoading(false);
    } else {
      console.log('⚠️ [EditProfile] Image picker canceled');
    }
  };

  const handleBioChange = (text: string) => {
    setFields(f => ({ ...f, bio: text }));
    // Reset bio validation when user changes bio
    if (text !== fields.bio) {
      setBioValidated(false);
    }
  };

  const validateBio = async () => {
    if (!fields.bio.trim()) {
      setBioValidated(true);
      return true;
    }

    console.log('🤖 [EditProfile] Validating bio with AI...');
    setIsLoading(true);
    
    const validationResult = await validateContent(null, fields.bio);
    setIsLoading(false);
    
    if (validationResult.postStatus !== 'approved' || validationResult.flagged) {
      console.warn('⚠️ [EditProfile] Bio validation failed');
      
      showCustomAlert(
        'error',
        'Bio Not Acceptable',
        'Your bio contains content that does not meet our community guidelines. Please modify it to:\n\n• Remove offensive language\n• Avoid inappropriate content\n• Keep it professional and respectful',
        [{ text: 'OK', onPress: hideCustomAlert }],
        'close-circle'
      );
      
      setBioValidated(false);
      return false;
    }
    
    console.log('✅ [EditProfile] Bio validated successfully!');
    setBioValidated(true);
    
    showCustomAlert(
      'success',
      'Bio Validated Successfully! ✓',
      'Your bio has been validated and meets our community guidelines.',
      [{ text: 'Great!', onPress: hideCustomAlert }],
      'checkmark-circle'
    );
    return true;
  };

  const handleSaveProfile = async () => {
  console.log('💾 [EditProfile] Saving profile...');
  
  const accessToken = await AsyncStorage.getItem('userToken');

  if (!accessToken) {
    console.error('❌ [EditProfile] No access token found');
    showCustomAlert('error', 'Not Logged In', 'Please login again.', [{ text: 'OK' }], 'log-in-outline');
    return;
  }

  if (!fields.name.trim() || !fields.nickname.trim() || !fields.country.trim()) {
    console.error('❌ [EditProfile] Required fields missing');
    showCustomAlert('error', 'Missing Information', 'Name, nickname, and country are required.', [{ text: 'OK' }], 'alert-circle');
    return;
  }

  if (fields.profilePicUrl && fields.profilePicUrl !== DEFAULT_AVATAR && !imageValidated) {
    showCustomAlert(
      'warning',
      'Validation Required',
      'Please wait for profile picture validation to complete or select a different image.',
      [{ text: 'OK' }],
      'warning'
    );
    return;
  }

  if (fields.bio.trim() && !bioValidated) {
    const bioIsValid = await validateBio();
    if (!bioIsValid) {
      return;
    }
  }

  setIsLoading(true);

  const payload = {
    accessToken,
    name: fields.name,
    nickName: fields.nickname,
    country: fields.country,
    profilePicUrl: fields.profilePicUrl,
    bio: fields.bio,
    email: fields.email,
  };

  console.log('📡 [EditProfile] Updating profile with payload:', JSON.stringify(payload, null, 2));

  try {
    // STEP 1: Save to Backend API
    const res = await fetch(EDIT_PROFILE_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📥 [EditProfile] Update response status:', res.status);
    const data = await res.json();
    console.log('📥 [EditProfile] Update response data:', data);

    if (!res.ok) {
      console.error('❌ [EditProfile] Update failed:', data.message || 'Server error');
      showCustomAlert('error', 'Update Failed', data.message || 'Server error', [{ text: 'OK' }], 'close-circle');
      setIsLoading(false);
      return;
    }

    console.log('✅ [EditProfile] Profile updated to backend successfully');

    // STEP 2: Sync to Firebase
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('🔥 [EditProfile] Starting Firebase sync for userId:', userId);

      if (userId) {
        const usersRef = collection(db, 'SentinelUsers');
        const q = query(usersRef, where('userID', '==', userId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Update existing document
          const userDocRef = doc(db, 'SentinelUsers', snapshot.docs[0].id);
          console.log('📝 [EditProfile] Updating existing Firebase document:', snapshot.docs[0].id);
          
          await updateDoc(userDocRef, {
            bio: fields.bio,
            userBio: fields.bio,
            name: fields.name,
            userName: fields.name,
            nickName: fields.nickname,
            userNickName: fields.nickname,
            country: fields.country,
            profilePicUrl: fields.profilePicUrl,
            email: fields.email,
          });
          
          console.log('✅ [EditProfile] Firebase document updated successfully');
        } else {
          // Create new document
          console.log('📝 [EditProfile] Creating new Firebase document');
          
          const newDocRef = doc(collection(db, 'SentinelUsers'));
          await setDoc(newDocRef, {
            userID: userId,
            bio: fields.bio,
            userBio: fields.bio,
            name: fields.name,
            userName: fields.name,
            nickName: fields.nickname,
            userNickName: fields.nickname,
            country: fields.country,
            profilePicUrl: fields.profilePicUrl,
            email: fields.email,
            Following: [],
            FollowersCount: 0,
            PostsCount: 0,
          });
          
          console.log('✅ [EditProfile] New Firebase document created');
        }
      } else {
        console.warn('⚠️ [EditProfile] No userId found for Firebase sync');
      }
    } catch (firebaseError) {
      console.error('❌ [EditProfile] Firebase sync error:', firebaseError);
      console.error('Firebase error details:', JSON.stringify(firebaseError, null, 2));
      // Don't fail the whole operation - backend is already updated
    }

    // STEP 3: Save to AsyncStorage
    await AsyncStorage.multiSet([
      ['userName', fields.name],
      ['userNickName', fields.nickname],
      ['userCountry', fields.country],
      ['profilePicUrl', fields.profilePicUrl],
      ['userBio', fields.bio],
      ['userEmail', fields.email],
    ]);
    
    console.log('✅ [EditProfile] Saved to AsyncStorage');
    
    setIsLoading(false);
    
    showCustomAlert(
      'success',
      'Profile Updated Successfully! ✓',
      'Your profile has been updated with validated content!',
      [{
        text: 'Done',
        onPress: () => {
          hideCustomAlert();
          if (onSuccess) onSuccess(data);
          onClose();
        }
      }],
      'checkmark-circle'
    );
    
  } catch (error) {
    console.error('❌ [EditProfile] Network error during save:', error);
    setIsLoading(false);
    showCustomAlert('error', 'Network Error', 'Server/network error. Please try again.', [{ text: 'OK' }], 'cloud-offline-outline');
  }
};


  // Get icon emoji based on icon name
  const getIconEmoji = (iconName) => {
    const iconMap = {
      'checkmark-circle': '✅',
      'close-circle': '❌',
      'warning': '⚠️',
      'alert-circle': '⚠️',
      'information-circle': 'ℹ️',
      'cloud-upload-outline': '☁️',
      'log-in-outline': '🔐',
      'cloud-offline-outline': '📡',
    };
    return iconMap[iconName] || 'ℹ️';
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                width: '92%',
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                position: 'relative',
              }}
            >
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, top: 15, zIndex: 10 }}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#666' }}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', marginBottom: 18 }}
                onPress={handlePickImage}
                disabled={isLoading}
              >
                <View style={{ position: 'relative' }}>
                  <Image
                    key={fields.profilePicUrl}
                    source={
                      fields.profilePicUrl
                        ? { uri: `${fields.profilePicUrl}?t=${Date.now()}` }
                        : { uri: DEFAULT_AVATAR }
                    }
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      backgroundColor: '#eee',
                    }}
                  />
                  {/* Green checkmark indicator for validated image */}
                  {imageValidated && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: '#4CAF50',
                        borderRadius: 20,
                        width: 32,
                        height: 32,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#fff',
                      }}
                    >
                      <Text style={{ fontSize: 18, color: '#fff' }}>✓</Text>
                    </View>
                  )}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      backgroundColor: '#fff',
                      padding: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#ccc',
                    }}
                  >
                    <Text style={{ fontSize: 17 }}>📷</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                  Tap to change profile picture
                </Text>
                {imageValidated && (
                  <Text style={{ fontSize: 11, color: '#4CAF50', marginTop: 4 }}>
                    ✓ Image validated
                  </Text>
                )}
              </TouchableOpacity>

              <View style={{ marginBottom: 11 }}>
                <Text>
                  Name <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 4,
                  }}
                  placeholder="Enter your full name"
                  value={fields.name}
                  onChangeText={t => setFields(f => ({ ...f, name: t }))}
                  editable={!isLoading}
                />
              </View>

              <View style={{ marginBottom: 11 }}>
                <Text>
                  Nickname <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 4,
                  }}
                  placeholder="Choose a nickname"
                  value={fields.nickname}
                  onChangeText={t => setFields(f => ({ ...f, nickname: t }))}
                  editable={!isLoading}
                />
              </View>

              <View style={{ marginBottom: 11 }}>
                <Text>Email</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 4,
                  }}
                  value={fields.email}
                  editable={false}
                />
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  Email cannot be changed
                </Text>
              </View>

              <View style={{ marginBottom: 11 }}>
                <Text>
                  Country <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 4,
                  }}
                  placeholder="Enter your country"
                  value={fields.country}
                  onChangeText={t => setFields(f => ({ ...f, country: t }))}
                  editable={!isLoading}
                />
              </View>

              <View style={{ marginBottom: 11 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Bio</Text>
                  {bioValidated && (
                    <Text style={{ fontSize: 12, color: '#4CAF50' }}>✓ Validated</Text>
                  )}
                </View>
                <TextInput
                  style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 4,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  multiline
                  placeholder="Tell us about yourself…"
                  value={fields.bio}
                  onChangeText={handleBioChange}
                  maxLength={200}
                  editable={!isLoading}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <TouchableOpacity
                    onPress={validateBio}
                    disabled={isLoading || !fields.bio.trim() || bioValidated}
                    style={{
                      backgroundColor: bioValidated ? '#4CAF50' : '#007AFF',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      opacity: (isLoading || !fields.bio.trim() || bioValidated) ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>
                      {bioValidated ? '✓ Validated' : 'Validate Bio'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    {fields.bio.length}/200
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 14,
                  marginBottom: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#eee',
                    padding: 14,
                    borderRadius: 8,
                    marginRight: 6,
                  }}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text
                    style={{
                      color: '#222',
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#333',
                    padding: 14,
                    borderRadius: 8,
                    marginLeft: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: '#fff',
                        textAlign: 'center',
                        fontWeight: '600',
                      }}
                    >
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={customAlertVisible}
        transparent
        animationType="fade"
        onRequestClose={hideCustomAlert}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              width: '85%',
              maxWidth: 400,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 50, marginBottom: 10 }}>
                {getIconEmoji(alertConfig.icon)}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 10,
                }}
              >
                {alertConfig.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {alertConfig.message}
              </Text>
            </View>

            <View style={{ flexDirection: alertConfig.buttons.length > 1 ? 'row' : 'column', gap: 10 }}>
              {alertConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    flex: alertConfig.buttons.length > 1 ? 1 : undefined,
                    backgroundColor: index === 0 && alertConfig.buttons.length > 1 ? '#f0f0f0' : '#007AFF',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (button.onPress) {
                      button.onPress();
                    } else {
                      hideCustomAlert();
                    }
                  }}
                >
                  <Text
                    style={{
                      color: index === 0 && alertConfig.buttons.length > 1 ? '#000' : '#fff',
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
