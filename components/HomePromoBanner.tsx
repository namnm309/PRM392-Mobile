import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { COLORS } from '@/constants/theme';

const banners = [
  require('@/assets/images/home/homebanner1.jpg'),
  require('@/assets/images/home/homebanner2.jpg'),
  require('@/assets/images/home/homebanner3.jpg'),
  require('@/assets/images/home/homebanner4.jpg'),
] as const;

export function HomePromoBanner() {
  const { width } = useWindowDimensions();
  const horizontalPadding = 16;
  const bannerWidth = width - horizontalPadding * 2; // ảnh nhỏ hơn một chút so với màn hình
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const intervalId = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % banners.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [bannerWidth]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{
          alignItems: 'center',
        }}
      >
        {banners.map((source, index) => (
          <View key={index} style={{ width }}>
            <Image
              source={source}
              style={[styles.bannerImage, { width: bannerWidth, marginHorizontal: horizontalPadding }]}
              resizeMode="contain"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {banners.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={index}
              style={[styles.dot, isActive && styles.dotActive]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 12,
  },
  bannerImage: {
    height: 190,
    borderRadius: 16,
    alignSelf: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    width: 8,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.accentRed,
  },
});
