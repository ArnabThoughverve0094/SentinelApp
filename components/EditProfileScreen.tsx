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

const EDIT_PROFILE_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/update-profile';
const UPLOAD_API = 'https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile';
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&name=User';

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

  useEffect(() => {
    async function loadProfileFromStorage() {
      console.log('🔍 [EditProfile] Loading profile from AsyncStorage...');

      if (visible) {
        setIsLoading(true);
        try {
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

          setFields({
            name: name[1] || '',
            nickname: nickname[1] || '',
            email: email[1] || '',
            country: country[1] || '',
            bio: bio[1] || '',
            profilePicUrl: profilePicUrl[1] || '',
          });

          console.log('✅ [EditProfile] Fields updated successfully');
        } catch (error) {
          console.error('❌ [EditProfile] Error loading from storage:', error);
          Alert.alert('Error', 'Could not load profile data');
        }
        setIsLoading(false);
      }
    }

    if (visible) {
      loadProfileFromStorage();
    }
  }, [visible]);

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
      Alert.alert('Upload failed', 'Could not upload profile picture.');
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
      const timestamp = Date.now();
      const uploadPath = await uploadImageToServer(result.assets[0].uri, timestamp);
      setIsLoading(false);

      if (uploadPath) {
        console.log('✅ [EditProfile] Profile pic updated:', uploadPath);
        setFields(f => ({ ...f, profilePicUrl: uploadPath }));
      } else {
        Alert.alert('Error', 'Failed to upload image.');
      }
    } else {
      console.log('⚠️ [EditProfile] Image picker canceled');
    }
  };

  const handleSaveProfile = async () => {
    console.log('💾 [EditProfile] Saving profile...');
    setIsLoading(true);
    const accessToken = await AsyncStorage.getItem('userToken');

    if (!accessToken) {
      console.error('❌ [EditProfile] No access token found');
      Alert.alert('Not logged in', 'Please login again.');
      setIsLoading(false);
      return;
    }

    if (!fields.name.trim() || !fields.nickname.trim() || !fields.country.trim()) {
      console.error('❌ [EditProfile] Required fields missing');
      Alert.alert('Error', 'Name, nickname, country are required.');
      setIsLoading(false);
      return;
    }

    const payload = {
      accessToken,
      name: fields.name,
      nickName: fields.nickname,
      country: fields.country,
      profilePicUrl: fields.profilePicUrl,
      bio: fields.bio,
      email: fields.email,
    };

    console.log(
      '📡 [EditProfile] Updating profile with payload:',
      JSON.stringify(payload, null, 2),
    );

    try {
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
        Alert.alert('Failed to update profile', data.message || 'Server error');
        setIsLoading(false);
        return;
      }

      console.log('✅ [EditProfile] Profile updated successfully');

      await AsyncStorage.multiSet([
        ['userName', fields.name],
        ['userNickName', fields.nickname],
        ['userCountry', fields.country],
        ['profilePicUrl', fields.profilePicUrl],
        ['userBio', fields.bio],
        ['userEmail', fields.email],
      ]);

      setIsLoading(false);
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (error) {
      console.error('❌ [EditProfile] Network error during save:', error);
      setIsLoading(false);
      Alert.alert('Failed to update profile', 'Server/network error. Please try again.');
    }
  };

  return (
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
              <Text>Bio</Text>
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
                onChangeText={t => setFields(f => ({ ...f, bio: t }))}
                maxLength={200}
                editable={!isLoading}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#888',
                  alignSelf: 'flex-end',
                  marginTop: 2,
                }}
              >
                {fields.bio.length}/200
              </Text>
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
  );
}
