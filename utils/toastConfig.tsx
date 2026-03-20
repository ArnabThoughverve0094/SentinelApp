import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <View
      style={{
        width: '92%',
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Green Checkmark Circle */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#4CAF50',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#1B5E20',
              marginBottom: 2,
            }}
          >
            {props.text1}
          </Text>
          {props.text2 && (
            <Text
              style={{
                fontSize: 13,
                color: '#388E3C',
                lineHeight: 18,
              }}
            >
              {props.text2}
            </Text>
          )}
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => props.onPress?.()}
        style={{
          padding: 4,
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={20} color="#388E3C" />
      </TouchableOpacity>
    </View>
  ),

  error: (props: any) => (
    <View
      style={{
        width: '92%',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Red Error Circle */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#F44336',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#B71C1C',
              marginBottom: 2,
            }}
          >
            {props.text1}
          </Text>
          {props.text2 && (
            <Text
              style={{
                fontSize: 13,
                color: '#C62828',
                lineHeight: 18,
              }}
            >
              {props.text2}
            </Text>
          )}
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => props.onPress?.()}
        style={{
          padding: 4,
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={20} color="#C62828" />
      </TouchableOpacity>
    </View>
  ),

  info: (props: any) => (
    <View
      style={{
        width: '92%',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Blue Info Circle */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#2196F3',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="information" size={20} color="#fff" />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#0D47A1',
              marginBottom: 2,
            }}
          >
            {props.text1}
          </Text>
          {props.text2 && (
            <Text
              style={{
                fontSize: 13,
                color: '#1565C0',
                lineHeight: 18,
              }}
            >
              {props.text2}
            </Text>
          )}
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => props.onPress?.()}
        style={{
          padding: 4,
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={20} color="#1565C0" />
      </TouchableOpacity>
    </View>
  ),

  warning: (props: any) => (
    <View
      style={{
        width: '92%',
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Orange Warning Circle */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#FF9800',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="warning" size={20} color="#fff" />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#E65100',
              marginBottom: 2,
            }}
          >
            {props.text1}
          </Text>
          {props.text2 && (
            <Text
              style={{
                fontSize: 13,
                color: '#F57C00',
                lineHeight: 18,
              }}
            >
              {props.text2}
            </Text>
          )}
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => props.onPress?.()}
        style={{
          padding: 4,
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={20} color="#F57C00" />
      </TouchableOpacity>
    </View>
  ),
};
