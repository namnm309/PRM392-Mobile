import { ProductCard } from '@/components/ProductCard';
import type { ProductCategorySection as ProductCategorySectionType } from '@/constants/homeProductData';
import { COLORS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

type ProductCategorySectionProps = {
  section: ProductCategorySectionType;
};

export function ProductCategorySection({ section }: ProductCategorySectionProps) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(180, (width - 16 * 2 - 12) / 2);
  const router = useRouter();

  const handleSeeAll = () => {
    router.push({
      pathname: '/category',
      params: { categoryId: section.id },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsWrap}
        style={styles.chipsScroll}
      >
        {section.subCategories.map((sub) => (
          <TouchableOpacity
            key={sub}
            style={[
              styles.chip,
              selectedSubCategory === sub && styles.chipSelected,
            ]}
            onPress={() =>
              setSelectedSubCategory(selectedSubCategory === sub ? null : sub)
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedSubCategory === sub && styles.chipTextSelected,
              ]}
            >
              {sub}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsWrap}
      >
        {section.products.map((product) => (
          <ProductCard key={product.id} product={product} width={cardWidth} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
  chipsScroll: {
    marginBottom: 12,
  },
  chipsWrap: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    paddingRight: 32,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.categoryLinkBlue,
    borderColor: COLORS.categoryLinkBlue,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  productsWrap: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
    paddingRight: 32,
  },
});
