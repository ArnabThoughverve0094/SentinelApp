import { db } from "@/FirebaseConfig";
import { router } from "expo-router";
import { addDoc, collection } from "firebase/firestore";

const uploadFile = async (userName: any, postText: any, asset: { uri: any; type: string; }) => {
    const uri = asset.uri;
    const ext = uri.split('.').pop();
    const type = asset.type || 'image';

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: `upload.${ext}`,
      type: `${type}/${ext}`,
    }as any);
    
    const response = await fetch('https://8ufqzsm271.execute-api.us-east-2.amazonaws.com/dev/api/uploadFile', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  
    const json = await response.json();
    console.log('Upload response:', json);
    console.log('File Url:', json.fileUrl);

    handlePost (userName, postText, json.fileUrl);
  };

  const handlePost = async (userName: any, postText: any, uploadedUrl: any) => {
    // setLoading(true);
    try {
      console.log('Upload to firestore');
      await addDoc(collection(db, 'SentinelPosts'), {
        AuthorImageURL: "",
        AuthorName: userName,
        ContentDate: new Date(),
        ContentDesc: postText,
        ContentLikeCount: 0,
        ContentURL: uploadedUrl,
        isApproved: false
      });
      // setPostText('');
      // setSelectedMedia([]);
      // setSelectedMedia({ uri: '', name: '', type: '' });
      setTimeout(() => router.back(), 1000);
      // Alert.alert('Success', 'Post added to Firestore');
    } catch (error) {
      console.error(error);
      // Alert.alert('Error', error.message);
    } finally {
      // setLoading(false);
    }
  };
  
  export default uploadFile;
  