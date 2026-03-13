import { ProductCard } from "@/components/ProductCard";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import type { HomeProduct } from "@/constants/homeProductData";
import { COLORS } from "@/constants/theme";
import { useTabBarBottomPadding } from "@/hooks/useTabBarBottomPadding";
import { fetchProducts, mapApiProductToHomeProduct } from "@/lib/productsApi";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BrandScreenParams = {
  brandId?: string;
  brandName?: string;
};

export default function BrandScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const { brandId, brandName } = useLocalSearchParams<BrandScreenParams>();
  const router = useRouter();
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<
    "popular" | "promo" | "price" | "filter"
  >("popular");
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const { width } = useWindowDimensions();

  const columns = 2;
  const gap = 12;
  const horizontalPadding = 16;
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;
  const bannerImageUri = products[0]?.imageUri ?? null;

  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (activeSort === "promo") {
      list = list.filter((p) => (p.discountPercent ?? 0) > 0);
    } else if (activeSort === "price") {
      list = [...list].sort((a, b) => a.priceCurrent - b.priceCurrent);
    }

    // Hiện tại chưa áp dụng filter từ selectedCriteria,
    // nhưng vẫn giữ state để sẵn sàng mở rộng sau.

    return list;
  }, [products, activeSort, selectedCriteria]);

  const criteriaOptions = [
    { id: "instock", label: "Sẵn sàng", icon: "car-outline" as const },
    {
      id: "priceView",
      label: "Xem theo giá",
      icon: "pricetag-outline" as const,
    },
    { id: "new", label: "Hàng mới về", icon: "cart-outline" as const },
  ];

  const handleToggleCriterion = (id: string) => {
    setSelectedCriteria((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );
  };

  useEffect(() => {
    if (!brandId) {
      setError("Thiếu thông tin thương hiệu");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProducts({ brandId })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.map(mapApiProductToHomeProduct));
        }
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
  }, [brandId]);

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
                  onFocus={() => {
                    // Điều hướng sang màn search khi chạm vào thanh search
                    router.push("/search" as const);
                  }}
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
            {bannerImageUri && (
              <View style={styles.bannerContainer}>
                <Image
                  source={{ uri: bannerImageUri }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </View>
            )}

            <Text style={styles.title}>{brandName ?? "Thương hiệu"}</Text>

            <View style={styles.criteriaSection}>
              <Text style={styles.criteriaTitle}>Chọn theo tiêu chí</Text>
              <View style={styles.criteriaRow}>
                {criteriaOptions.map((option) => {
                  const selected = selectedCriteria.includes(option.id);
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.criteriaChip,
                        selected && styles.criteriaChipSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleToggleCriterion(option.id)}
                    >
                      <View style={styles.criteriaChipContent}>
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            selected
                              ? COLORS.accentRed
                              : COLORS.categoryChipText
                          }
                        />
                        <Text
                          style={[
                            styles.criteriaChipText,
                            selected && styles.criteriaChipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sortTabsRow}>
              {(
                [
                  { id: "popular", label: "Phổ biến" },
                  { id: "promo", label: "Khuyến mãi" },
                  { id: "price", label: "Giá" },
                  { id: "filter", label: "Bộ lọc" },
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
                <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
              </View>
            ) : (
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
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
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
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  bannerContainer: {
    marginBottom: 12,
  },
  bannerImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },
  criteriaSection: {
    marginBottom: 12,
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
  criteriaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  criteriaChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    backgroundColor: COLORS.categoryContentBg,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  criteriaChipSelected: {
    borderColor: COLORS.accentRed,
    backgroundColor: "#ffecec",
  },
  criteriaChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  criteriaChipText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  criteriaChipTextSelected: {
    color: COLORS.accentRed,
    fontWeight: "600",
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
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
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
