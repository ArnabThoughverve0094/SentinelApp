import { Image } from "react-native-compressor";

//Compress Image
const compressImage = async (localUri) => {
  try {
    const compressedUri = await Image.compress(
      localUri, 
      {
        compressionMethod: 'manual',
        quality: 0.6,    // 60% quality
        maxWidth: 1200,  // Max width of 1200 pixels
        maxHeight: 1200, // Max height of 1200 pixels
      }
    );
    console.log("Compressed URI:", compressedUri);
    return compressedUri;
  } catch (error) {
    console.error("Image Compression Error:", error);
    return localUri;
  }
};

export default compressImage;