import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const { width: screenWidth } = Dimensions.get('window');

const CARD_PADDING = 12;
const ITEM_WIDTH = screenWidth - CARD_PADDING * 2;

export function InstagramMediaCarousel({ mediaUrls, onPressMedia }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const onScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    setActiveIndex(index);
  };

  const getMediaType = (url) => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/)) return "video";
    if (lower.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return "image";
    if (lower.includes('video')) return "video";
    return "image";
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ height: ITEM_WIDTH / (16/9) + 4, paddingLeft: CARD_PADDING }}
        contentContainerStyle={{ paddingRight: CARD_PADDING }}
      >
        {mediaUrls.map((url, idx) => {
          const type = getMediaType(url);
          return (
            <TouchableOpacity
              activeOpacity={0.93}
              key={idx}
              onPress={() => onPressMedia(url, type)}
              style={{
                width: ITEM_WIDTH,
                aspectRatio: 16/9,
                marginRight: idx < mediaUrls.length - 1 ? 0 : 0,
                borderRadius: 12,
                backgroundColor: "#1a1a1a",
                overflow: "hidden",
              }}
            >
              {type === "image" ? (
                <Image
                  source={{ uri: url }}
                  style={{
                    width: ITEM_WIDTH,
                    aspectRatio: 16/9,
                    borderRadius: 12,
                    resizeMode: "cover"
                  }}
                />
              ) : (
                <View style={{
                  width: ITEM_WIDTH,
                  aspectRatio: 16/9,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  <Ionicons name="play-circle" size={90} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {mediaUrls.length > 1 && (
        <View style={{
          position: "absolute",
          top: 14,
          right: CARD_PADDING + 6,
          backgroundColor: "#000a",
          borderRadius: 12,
          paddingVertical: 2,
          paddingHorizontal: 10,
        }}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
            {activeIndex + 1}/{mediaUrls.length}
          </Text>
        </View>
      )}
    </View>
  );
}
