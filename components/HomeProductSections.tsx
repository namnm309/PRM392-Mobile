import { ProductCategorySection } from '@/components/ProductCategorySection';
import { HOME_PRODUCT_SECTIONS } from '@/constants/homeProductData';
import { COLORS } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export function HomeProductSections() {
  return (
    <View style={styles.container}>
      {HOME_PRODUCT_SECTIONS.map((section) => (
        <ProductCategorySection key={section.id} section={section} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
});
