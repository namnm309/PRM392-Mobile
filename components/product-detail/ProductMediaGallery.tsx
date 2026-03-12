import type { ProductMediaItem } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

type ProductMediaGalleryProps = {
  media: ProductMediaItem[];
  productName?: string;
  brand?: string;
};

export function ProductMediaGallery({
  media,
  productName,
  brand,
}: ProductMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const mainSize = width;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(nextIndex, media.length - 1));
    if (clamped === activeIndex) return;
    const direction = clamped > activeIndex ? 1 : -1;
    slideAnim.setValue(direction * 40);
    setActiveIndex(clamped);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const activeItem = media[activeIndex] ?? media[0];
  const isVideo = activeItem?.type === 'video';
  const hasImageUri = !isVideo && activeItem?.uri;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx > 40) {
          // swipe right -> previous
          goToIndex(activeIndex - 1);
        } else if (gestureState.dx < -40) {
          // swipe left -> next
          goToIndex(activeIndex + 1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View
        style={[styles.mainMedia, { width: mainSize, height: mainSize * 0.9 }]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={{
            width: mainSize,
            height: mainSize * 0.9,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateX: slideAnim }],
          }}
        >
          {hasImageUri ? (
            <Image
              source={{ uri: activeItem.uri }}
              style={[styles.mainImage, { width: mainSize, height: mainSize * 0.9 }]}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderEmoji}>{isVideo ? '▶️' : '📱'}</Text>
              {isVideo && (
                <View style={styles.playButton}>
                  <Ionicons name="play" size={48} color={COLORS.white} />
                </View>
              )}
            </View>
          )}
        </Animated.View>
        {isVideo && (
          <View style={styles.youtubeButton}>
            <Ionicons name="logo-youtube" size={20} color={COLORS.white} />
            <Text style={styles.youtubeText}>Watch on YouTube</Text>
          </View>
        )}
        {media.length > 1 && activeIndex > 0 && (
          <TouchableOpacity
            style={styles.prevArrow}
            onPress={() => goToIndex(activeIndex - 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
        {media.length > 1 && activeIndex < media.length - 1 && (
          <TouchableOpacity
            style={styles.nextArrow}
            onPress={() => goToIndex(activeIndex + 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnails}
        style={styles.thumbnailsScroll}
      >
        {media.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.thumb,
              activeIndex === index && styles.thumbActive,
            ]}
            onPress={() => goToIndex(index)}
            activeOpacity={0.7}
          >
            <View style={styles.thumbContent}>
              {item.type === 'video' ? (
                <Text style={styles.thumbLabel}>Video</Text>
              ) : item.uri ? (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />
              ) : item.label ? (
                <Text style={styles.thumbLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              ) : (
                <Text style={styles.thumbEmoji}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },
  mainMedia: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    backgroundColor: COLORS.white,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  brandLogo: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.accentRed,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  productInfo: {},
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  brand: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
    marginTop: 2,
  },
  youtubeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  youtubeText: {
    fontSize: 12,
    color: COLORS.white,
  },
  prevArrow: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailsScroll: {
    paddingVertical: 12,
  },
  thumbnails: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbActive: {
    borderColor: COLORS.accentRed,
  },
  thumbContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbLabel: {
    fontSize: 10,
    color: COLORS.cartTextSecondary,
    textAlign: 'center',
  },
  thumbEmoji: {
    fontSize: 24,
  },
});
