import type { ProductMediaItem } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
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

  const activeItem = media[activeIndex] ?? media[0];
  const isVideo = activeItem?.type === 'video';
  const hasImageUri = !isVideo && activeItem?.uri;

  return (
    <View style={styles.container}>
      <View style={[styles.mainMedia, { width: mainSize, height: mainSize * 0.9 }]}>
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
        {isVideo && (
          <View style={styles.youtubeButton}>
            <Ionicons name="logo-youtube" size={20} color={COLORS.white} />
            <Text style={styles.youtubeText}>Watch on YouTube</Text>
          </View>
        )}
        {media.length > 1 && (
          <TouchableOpacity
            style={styles.nextArrow}
            onPress={() => setActiveIndex((i) => Math.min(i + 1, media.length - 1))}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
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
            onPress={() => setActiveIndex(index)}
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
  nextArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
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
