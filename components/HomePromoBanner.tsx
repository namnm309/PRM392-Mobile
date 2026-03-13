import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '@/constants/theme';

const banners = [
  require('@/assets/images/home/banner1.png'),
  require('@/assets/images/home/banner2.png'),
  require('@/assets/images/home/banner3.png'),
  require('@/assets/images/home/banner4.png'),
  require('@/assets/images/home/banner5.png'),
  require('@/assets/images/home/banner7.png'),
  require('@/assets/images/home/banner8.png'),
  require('@/assets/images/home/banner9.png'),
] as const;

export function HomePromoBanner() {
  const { width } = useWindowDimensions();
  const horizontalPadding = 8;
  const bannerWidth = width - horizontalPadding * 2; // ảnh gần sát 2 cạnh màn hình
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
  }, [bannerWidth, width]);

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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((source, index) => (
          <View key={index} style={[styles.page, { width }]}>
            <Image
              source={source}
              style={[
                styles.bannerImage,
                { width: bannerWidth, marginHorizontal: horizontalPadding },
              ]}
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
    backgroundColor: COLORS.white,
  },
  scrollView: {
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    alignItems: 'center',
  },
  page: {
    backgroundColor: COLORS.white,
  },
  bannerImage: {
    height: 190,
    borderRadius: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
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
