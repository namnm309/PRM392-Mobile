import { AskQuestionSection } from '@/components/product-detail/AskQuestionSection';
import { KeyFeaturesSection } from '@/components/product-detail/KeyFeaturesSection';
import { PaymentOffersSection } from '@/components/product-detail/PaymentOffersSection';
import { ProductCommitments } from '@/components/product-detail/ProductCommitments';
import { ProductDetailBottomBar } from '@/components/product-detail/ProductDetailBottomBar';
import { ProductDetailHeader } from '@/components/product-detail/ProductDetailHeader';
import { ProductMediaGallery } from '@/components/product-detail/ProductMediaGallery';
import { ProductReviewsSection } from '@/components/product-detail/ProductReviewsSection';
import { ProductTitleSection } from '@/components/product-detail/ProductTitleSection';
import { ProductVariants } from '@/components/product-detail/ProductVariants';
import { PromotionsSection } from '@/components/product-detail/PromotionsSection';
import { QASection } from '@/components/product-detail/QASection';
import { RelatedNewsSection } from '@/components/product-detail/RelatedNewsSection';
import { SaleCountdownBanner } from '@/components/product-detail/SaleCountdownBanner';
import { StoreBranchesSection } from '@/components/product-detail/StoreBranchesSection';
import { TechSpecsSection } from '@/components/product-detail/TechSpecsSection';
import { getProductDetail } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const BOTTOM_BAR_HEIGHT = 90;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProductDetail(id ?? 'lp1');

  return (
    <View style={styles.screen}>
      <ProductDetailHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProductMediaGallery
          media={product.media}
          productName={product.name}
          brand={product.brand}
        />
        <ProductTitleSection name={product.name} rating={product.rating} />
        {product.saleEndCountdown && (
          <SaleCountdownBanner countdown={product.saleEndCountdown} />
        )}
        <ProductVariants
          storageOptions={product.storageOptions}
          colorOptions={product.colorOptions}
          tradeInPrice={product.tradeInPrice}
        />
        <StoreBranchesSection branches={product.storeBranches} />
        <PromotionsSection />
        <ProductCommitments />
        <PaymentOffersSection />
        <TechSpecsSection specs={product.specsList} />
        <KeyFeaturesSection
          productName={product.name}
          features={product.features}
        />
        <ProductReviewsSection reviews={product.reviews} />
        <RelatedNewsSection news={product.relatedNews} />
        <AskQuestionSection />
        <QASection questions={product.questions} />
        <View style={{ height: BOTTOM_BAR_HEIGHT }} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <ProductDetailBottomBar
          priceCurrent={product.priceCurrent}
          priceOriginal={product.priceOriginal}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
  },
});
