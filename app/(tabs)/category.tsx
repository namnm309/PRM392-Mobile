import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { CategoryHeader } from '@/components/CategoryHeader';
import { CategoryChip } from '@/components/CategoryChip';
import { COLORS } from '@/constants/theme';
import {
  CATEGORIES,
  PHONE_BRANDS,
  PRICE_SEGMENTS,
  HOT_PHONES,
} from '@/constants/categoryData';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';

const SIDEBAR_WIDTH = 88;

export default function CategoryScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    CATEGORIES[0].id
  );

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId);
  const categoryLabel = selectedCategory?.label ?? 'Điện thoại';

  return (
    <TabScreenWrapper>
      <View style={styles.screen}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CategoryHeader />
        <View style={styles.body}>
          <View style={styles.sidebar}>
            {CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.sidebarItem, isSelected && styles.sidebarItemSelected]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sidebarText,
                      isSelected && styles.sidebarTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                  {isSelected ? <View style={styles.sidebarUnderline} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[
              styles.contentScrollContent,
              { paddingBottom: tabBarBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleRow}>
              <Text style={styles.categoryTitle}>{categoryLabel}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllLink}>Xem tất cả &gt;</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hãng điện thoại</Text>
              <View style={styles.chipRow}>
                {PHONE_BRANDS.map((brand) => (
                  <CategoryChip
                    key={brand}
                    label={brand}
                    onPress={() => {}}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phân khúc giá</Text>
              <View style={styles.chipRow}>
                {PRICE_SEGMENTS.map((segment) => (
                  <CategoryChip
                    key={segment}
                    label={segment}
                    onPress={() => {}}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Điện thoại HOT</Text>
                <Text style={styles.fireIcon}>🔥</Text>
              </View>
              <View style={styles.chipRow}>
                {HOT_PHONES.map((item) => (
                  <CategoryChip
                    key={item.id}
                    label={item.label}
                    tag={item.tag}
                    onPress={() => {}}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
        </SafeAreaView>
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.white,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.categoryChipBorder,
  },
  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  sidebarItemSelected: {
    backgroundColor: COLORS.categoryLinkBlue,
  },
  sidebarText: {
    fontSize: 13,
    color: COLORS.categoryChipTextSecondary,
    textAlign: 'center',
  },
  sidebarTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },
  sidebarUnderline: {
    position: 'absolute',
    bottom: 4,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.categoryChipText,
  },
  viewAllLink: {
    fontSize: 14,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.categoryChipText,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  fireIcon: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
