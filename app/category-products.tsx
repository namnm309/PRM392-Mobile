import { ProductCard } from "@/components/ProductCard";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import type { HomeProduct } from "@/constants/homeProductData";
import { COLORS } from "@/constants/theme";
import { useTabBarBottomPadding } from "@/hooks/useTabBarBottomPadding";
import { fetchProducts, mapApiProductToHomeProduct } from "@/lib/productsApi";
import { fetchReviewSummaries } from "@/lib/reviewsApi";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Params = {
  categoryId?: string;
  categoryName?: string;
  priceLabel?: string;
  minPrice?: string;
  maxPrice?: string;
};

function formatPrice(v: number) {
  return new Intl.NumberFormat("vi-VN").format(v) + "₫";
}

export default function CategoryProductsScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const router = useRouter();
  const { categoryId, categoryName, priceLabel, minPrice, maxPrice } =
    useLocalSearchParams<Params>();

  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<
    "popular" | "promo" | "price-asc" | "price-desc"
  >("popular");
  const { width } = useWindowDimensions();

  const columns = 2;
  const gap = 12;
  const horizontalPadding = 16;
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  const minP = minPrice ? Number(minPrice) : undefined;
  const maxP = maxPrice ? Number(maxPrice) : undefined;

  const title =
    priceLabel && categoryName
      ? `${categoryName} - ${priceLabel}`
      : categoryName ?? "Sản phẩm";

  useEffect(() => {
    if (!categoryId) {
      setError("Thiếu thông tin danh mục");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProducts({ categoryId })
      .then(async (data) => {
        if (cancelled) return;
        const mapped = data.map(mapApiProductToHomeProduct);
        const filtered = mapped.filter((p) => {
          const price = p.priceCurrent;
          if (minP != null && price < minP) return false;
          if (maxP != null && price >= maxP) return false;
          return true;
        });
        const summaries = await fetchReviewSummaries(
          filtered.map((p) => p.id),
          { concurrency: 6 },
        );
        if (cancelled) return;
        setProducts(
          filtered.map((p) => {
            const s = summaries[p.id];
            return {
              ...p,
              rating:
                s && s.totalReviews > 0 && s.avgRating != null
                  ? s.avgRating
                  : undefined,
            };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải sản phẩm");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, minP, maxP]);

  const displayedProducts = useMemo(() => {
    const list = [...products];
    switch (activeSort) {
      case "promo":
        return list.filter((p) => (p.discountPercent ?? 0) > 0);
      case "price-asc":
        return list.sort((a, b) => a.priceCurrent - b.priceCurrent);
      case "price-desc":
        return list.sort((a, b) => b.priceCurrent - a.priceCurrent);
      default:
        return list;
    }
  }, [products, activeSort]);

  const priceRangeText =
    minP != null && maxP != null
      ? `${formatPrice(minP)} - ${formatPrice(maxP)}`
      : minP != null
        ? `Từ ${formatPrice(minP)}`
        : maxP != null
          ? `Dưới ${formatPrice(maxP)}`
          : null;

  return (
    <TabScreenWrapper>
      <View style={styles.screen}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.searchInputWrap}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={COLORS.categoryChipTextSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Bạn muốn mua gì hôm nay?"
                  placeholderTextColor={COLORS.categoryChipTextSecondary}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onFocus={() => router.push("/search" as const)}
                />
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[
              styles.contentScrollContent,
              { paddingBottom: tabBarBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{title}</Text>

            {priceRangeText && (
              <View style={styles.priceRangeBadge}>
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={COLORS.accentRed}
                />
                <Text style={styles.priceRangeText}>{priceRangeText}</Text>
              </View>
            )}

            <View style={styles.sortTabsRow}>
              {(
                [
                  { id: "popular", label: "Phổ biến" },
                  { id: "promo", label: "Khuyến mãi" },
                  { id: "price-asc", label: "Giá tăng" },
                  { id: "price-desc", label: "Giá giảm" },
                ] as const
              ).map((tab, index, arr) => {
                const isActive = activeSort === tab.id;
                return (
                  <React.Fragment key={tab.id}>
                    <TouchableOpacity
                      style={styles.sortTab}
                      activeOpacity={0.7}
                      onPress={() => setActiveSort(tab.id)}
                    >
                      <Text
                        style={[
                          styles.sortTabText,
                          isActive && styles.sortTabTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      {isActive && <View style={styles.sortTabUnderline} />}
                    </TouchableOpacity>
                    {index < arr.length - 1 && (
                      <View style={styles.sortTabDivider} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={COLORS.headerBlue} />
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons
                  name="bag-outline"
                  size={48}
                  color={COLORS.categoryChipBorder}
                />
                <Text style={styles.emptyText}>
                  Không có sản phẩm trong phân khúc giá này
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.resultCount}>
                  {displayedProducts.length} sản phẩm
                </Text>
                <View style={styles.productsGrid}>
                  {displayedProducts.map((product) => (
                    <View
                      key={product.id}
                      style={[styles.productItem, { width: cardWidth }]}
                    >
                      <ProductCard product={product} width={cardWidth} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
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
    backgroundColor: COLORS.accentRed,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: COLORS.accentRed,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  priceRangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFF3F3",
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  priceRangeText: {
    fontSize: 13,
    color: COLORS.accentRed,
    fontWeight: "600",
  },
  contentScroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sortTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sortTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  sortTabText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  sortTabTextActive: {
    color: COLORS.accentRed,
    fontWeight: "600",
  },
  sortTabUnderline: {
    marginTop: 2,
    height: 2,
    width: "100%",
    backgroundColor: COLORS.accentRed,
  },
  sortTabDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.categoryChipBorder,
  },
  centered: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.categoryChipTextSecondary,
    textAlign: "center",
  },
  resultCount: {
    fontSize: 13,
    color: COLORS.categoryChipTextSecondary,
    marginBottom: 8,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  productItem: {
    marginBottom: 8,
  },
});
