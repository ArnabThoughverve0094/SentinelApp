// CustomSwitch.js 

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CustomSwitch = ({
  selectionMode = 1,      // default to "Approve"
  option1 = 'Approve',
  option2 = 'Reject',
  roundCorner = true,
  selectionColor = '#4CAF50',
  onSelectSwitch, // callback when selection changes
  postID = ''
}) => {
  const [current, setCurrent] = useState(selectionMode);

  const handleSelect = val => {
    setCurrent(val);
    onSelectSwitch && onSelectSwitch(val, postID);
  };

  return (
    <View style={[styles.container, { borderColor: selectionColor, borderRadius: roundCorner ? 25 : 0 }]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: current === 1 ? selectionColor : '#fff',
            borderRadius: roundCorner ? 25 : 0,
          }
        ]}
        onPress={() => handleSelect(1)}
      >
        <Text style={{ color: current === 1 ? '#fff' : selectionColor }}>{option1}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: current === 2 ? selectionColor : '#fff',
            borderRadius: roundCorner ? 25 : 0,
          }
        ]}
        onPress={() => handleSelect(2)}
      >
        <Text style={{ color: current === 2 ? '#fff' : selectionColor }}>{option2}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    width: 170,
    height: 24,
    padding: 2,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomSwitch;
