import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';

interface CustomPostLikeProps {
  initialLiked?: boolean;
  onLikeChange?: (liked: boolean) => void;
  size?: number;
  likedColor?: string;
  unlikedColor?: string;
}

const CustomPostLike: React.FC<CustomPostLikeProps> = ({
  initialLiked = false,
  onLikeChange,
  size = 25,
  likedColor = 'red',
  unlikedColor = 'gray'
}) => {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  
  const toggleLike = (): void => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    onLikeChange?.(newLikedState);
  };

  return (
    <TouchableOpacity onPress={toggleLike}>
      <MaterialCommunityIcons
        name={liked ? 'heart' : 'heart-outline'}
        size={size}
        color={liked ? likedColor : unlikedColor}
      />
    </TouchableOpacity>
  );
};

export default CustomPostLike;
