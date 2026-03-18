import { AddToCartToast } from '@/components/AddToCartToast';

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

import { TechSpecsSection } from '@/components/product-detail/TechSpecsSection';
import { getProductDetail } from '@/constants/productDetailData';
import type { ProductDetail } from '@/constants/productDetailData';
import { useCart } from '@/contexts/CartContext';
import { COLORS } from '@/constants/theme';
import {
  fetchProductById,
  mapApiProductToProductDetail,
} from '@/lib/productsApi';
import { fetchReviews, type ReviewResponseDto } from '@/lib/reviewsApi';
import { fetchComments, type ProductCommentResponseDto } from '@/lib/commentsApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [comments, setComments] = useState<ProductCommentResponseDto[]>([]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    undefined,
  );
  const [effectivePriceCurrent, setEffectivePriceCurrent] = useState<number>(0);
  const [effectivePriceOriginal, setEffectivePriceOriginal] = useState<number>(0);
  const [effectiveStock, setEffectiveStock] = useState<number>(0);
  const [variantSelectionComplete, setVariantSelectionComplete] =
    useState<boolean>(true);

  useEffect(() => {
    // Reset variant-related state when product changes
    if (!product) return;
    setSelectedVariantId(undefined);
    setEffectivePriceCurrent(product.priceCurrent);
    setEffectivePriceOriginal(product.priceOriginal);
    setEffectiveStock(product.stock ?? 0);
    const hasVariants =
      (product.hasVariants ?? false) &&
      (product.variants ?? []).some((v) => v.isActive);
    setVariantSelectionComplete(!hasVariants);
  }, [product]);

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

    const loadProduct = fetchProductById(productId)
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
      });

    const loadReviews = fetchReviews(productId)
      .then((data) => { if (!cancelled) setReviews(data); })
      .catch(() => { if (!cancelled) setReviews([]); });

    const loadComments = fetchComments(productId)
      .then((data) => { if (!cancelled) setComments(data); })
      .catch(() => { if (!cancelled) setComments([]); });

    Promise.all([loadProduct, loadReviews, loadComments]).finally(() => {
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
    const currentStock =
      (product.hasVariants && selectedVariantId ? effectiveStock : (product.stock ?? 0)) ?? 0;
    if (currentStock <= 0) {
      return;
    }
    const selectedVariant =
      selectedVariantId && product.variants
        ? product.variants.find((v) => v.id === selectedVariantId)
        : undefined;
    const variantLabel =
      selectedVariant &&
      [
        selectedVariant.ramGb != null ? `${selectedVariant.ramGb}GB` : null,
        selectedVariant.storageGb != null ? `${selectedVariant.storageGb}GB` : null,
        selectedVariant.colorName ?? null,
      ]
        .filter(Boolean)
        .join(' · ');

    addToCart(
      {
        id: product.id,
        name: product.name,
        priceCurrent:
          product.hasVariants && selectedVariantId
            ? effectivePriceCurrent
            : product.priceCurrent,
        priceOriginal:
          product.hasVariants && selectedVariantId
            ? effectivePriceOriginal
            : product.priceOriginal,
        imageUri: product.imageUri,
      },
      { variantId: selectedVariantId, variantLabel },
    );
    setShowAddToCartToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(goToCart, TOAST_DURATION_MS);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const currentStock =
      (product.hasVariants && selectedVariantId ? effectiveStock : (product.stock ?? 0)) ?? 0;
    if (currentStock <= 0) {
      return;
    }
    await addToCart({
      id: product.id,
      name: product.name,
      priceCurrent:
        product.hasVariants && selectedVariantId
          ? effectivePriceCurrent
          : product.priceCurrent,
      priceOriginal:
        product.hasVariants && selectedVariantId
          ? effectivePriceOriginal
          : product.priceOriginal,
      imageUri: product.imageUri,
    }, { variantId: selectedVariantId });
    selectOnly(product.id);

    if (!isSignedIn) {
      router.push({
        pathname: '/(auth)/login',
        params: { redirect: '/checkout' },
      });
      return;
    }

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
  const hasRealVariants =
    (product.hasVariants ?? false) &&
    (product.variants ?? []).some((v) => v.isActive);
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length) *
            10,
        ) / 10
      : undefined;

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
          rating={avgRating}
          inStock={inStock}
        />
        {product.saleEndCountdown && (
          <SaleCountdownBanner countdown={product.saleEndCountdown} />
        )}
        <ProductVariants
          hasVariants={product.hasVariants}
          variants={product.variants}
          tradeInPrice={product.tradeInPrice}
          onVariantChange={(sel) => {
            setSelectedVariantId(sel.variantId);
            if (sel.priceCurrent > 0) setEffectivePriceCurrent(sel.priceCurrent);
            if (sel.priceOriginal > 0) setEffectivePriceOriginal(sel.priceOriginal);
            setEffectiveStock(sel.stock);
            setVariantSelectionComplete(sel.isComplete);
            if (hasRealVariants && !sel.isComplete) {
              // user will see inline message in options; keep screen quiet
            }
          }}
        />

        <PromotionsSection />
        <ProductCommitments />
        <PaymentOffersSection />
        <TechSpecsSection specs={product.specsList} />
        <KeyFeaturesSection
          productName={product.name}
          features={product.features}
        />
        <ProductReviewsSection
          reviews={reviews}
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
        <RelatedProductsSection
          categoryId={product.categoryId}
          currentProductId={product.id}
        />
        <RelatedNewsSection news={product.relatedNews} />
        <QASection
          comments={comments}
          onAsk={() =>
            router.push({
              pathname: '/product/[id]/qa',
              params: { id: product.id },
            })
          }
          onSeeAll={() =>
            router.push({
              pathname: '/product/[id]/qa',
              params: { id: product.id },
            })
          }
          onReply={(commentId) =>
            router.push({
              pathname: '/product/[id]/qa',
              params: { id: product.id, focusQuestionId: commentId },
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
          priceCurrent={hasRealVariants ? effectivePriceCurrent : product.priceCurrent}
          priceOriginal={hasRealVariants ? effectivePriceOriginal : product.priceOriginal}
          inStock={hasRealVariants ? effectiveStock > 0 : inStock}
          disabled={hasRealVariants ? !variantSelectionComplete : false}
          onAddToCart={
            hasRealVariants && !variantSelectionComplete
              ? () => Alert.alert('Chọn phiên bản', 'Vui lòng chọn cấu hình và màu sắc.')
              : handleAddToCart
          }
          onBuyNow={
            hasRealVariants && !variantSelectionComplete
              ? () => Alert.alert('Chọn phiên bản', 'Vui lòng chọn cấu hình và màu sắc.')
              : handleBuyNow
          }
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
