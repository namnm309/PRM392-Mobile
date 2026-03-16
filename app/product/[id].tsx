import { AddToCartToast } from '@/components/AddToCartToast';
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
import { RelatedProductsSection } from '@/components/product-detail/RelatedProductsSection';
import { SaleCountdownBanner } from '@/components/product-detail/SaleCountdownBanner';
import { StoreBranchesSection } from '@/components/product-detail/StoreBranchesSection';
import { TechSpecsSection } from '@/components/product-detail/TechSpecsSection';
import { getProductDetail } from '@/constants/productDetailData';
import type { ProductDetail } from '@/constants/productDetailData';
import { useCart } from '@/contexts/CartContext';
import { COLORS } from '@/constants/theme';
import {
  fetchProductById,
  mapApiProductToProductDetail,
} from '@/lib/productsApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const BOTTOM_BAR_HEIGHT = 90;

const TOAST_DURATION_MS = 2000;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { addToCart, selectOnly } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddToCartToast, setShowAddToCartToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const productId = id ?? '';
    if (!productId) {
      setError('Không tìm thấy sản phẩm');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProductById(productId)
      .then((apiProduct) => {
        if (cancelled) return;
        if (apiProduct) {
          setProduct(mapApiProductToProductDetail(apiProduct));
        } else {
          setProduct(null);
          setError('Không tìm thấy sản phẩm');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Không thể tải sản phẩm');
        try {
          const fallback = getProductDetail(productId);
          setProduct(fallback);
        } catch {
          setProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const goToCart = () => {
    setShowAddToCartToast(false);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    router.replace('/(tabs)/cart');
  };

  const handleAddToCart = () => {
    if (!product) return;
    if ((product.stock ?? 0) <= 0) {
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      priceCurrent: product.priceCurrent,
      priceOriginal: product.priceOriginal,
      imageUri: product.imageUri,
    });
    setShowAddToCartToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(goToCart, TOAST_DURATION_MS);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if ((product.stock ?? 0) <= 0) {
      return;
    }
    // Add to cart first
    await addToCart({
      id: product.id,
      name: product.name,
      priceCurrent: product.priceCurrent,
      priceOriginal: product.priceOriginal,
      imageUri: product.imageUri,
    });
    // Select only this product for checkout
    selectOnly(product.id);

    // If chưa đăng nhập thì đưa sang màn login, đăng nhập xong quay lại checkout
    if (!isSignedIn) {
      router.push({
        pathname: '/(auth)/login',
        params: { redirect: '/checkout' },
      });
      return;
    }

    // Nếu đã đăng nhập thì đi thẳng sang checkout
    router.push('/checkout');
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.headerBlue} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ProductDetailHeader />
        <Text style={styles.errorText}>
          {error ?? 'Không tìm thấy sản phẩm'}
        </Text>
      </View>
    );
  }

  const stock = product.stock ?? 0;
  const inStock = stock > 0;
  const displayReviews =
    product.reviews.totalReviews > 0
      ? product.reviews
      : getProductDetail(product.id).reviews;
  const displayQuestions =
    product.questions.length > 0
      ? product.questions
      : getProductDetail(product.id).questions;

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
        <ProductTitleSection
          productId={product.id}
          name={product.name}
          rating={product.rating}
          inStock={inStock}
        />
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
        {displayReviews.totalReviews > 0 && (
          <ProductReviewsSection
            reviews={displayReviews}
            onSeeAll={() =>
              router.push({
                pathname: '/product/[id]/reviews',
                params: { id: product.id },
              })
            }
            onWriteReview={() =>
              router.push({
                pathname: '/product/[id]/reviews',
                params: { id: product.id },
              })
            }
          />
        )}
        <RelatedProductsSection
          categoryId={product.categoryId}
          currentProductId={product.id}
        />
        <RelatedNewsSection news={product.relatedNews} />
        <AskQuestionSection
          onAsk={() =>
            router.push({
              pathname: '/product/[id]/qa',
              params: { id: product.id },
            })
          }
        />
        <QASection
          questions={displayQuestions}
          onSeeAll={() =>
            router.push({
              pathname: '/product/[id]/qa',
              params: { id: product.id },
            })
          }
          onReply={(questionId) =>
            router.push({
              pathname: '/product/[id]/qa',
              params: { id: product.id, focusQuestionId: questionId },
            })
          }
        />
        <View style={{ height: BOTTOM_BAR_HEIGHT }} />
      </ScrollView>
      <AddToCartToast
        visible={showAddToCartToast}
        onDismiss={goToCart}
      />
      <View style={styles.bottomBar}>
        <ProductDetailBottomBar
          priceCurrent={product.priceCurrent}
          priceOriginal={product.priceOriginal}
          inStock={inStock}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    fontSize: 14,
    color: COLORS.categoryChipText,
    padding: 16,
  },
});
