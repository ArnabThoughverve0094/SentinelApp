import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';

const CustomPostLike = () => {
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked(prev => !prev);
};


  return (
    <TouchableOpacity onPress={toggleLike}>
      <MaterialCommunityIcons
        name={liked ? 'heart' : 'heart-outline'}
        size={25}
        color={liked ? 'red' : 'gray'}
      />
    </TouchableOpacity>
  );
};

export default CustomPostLike;