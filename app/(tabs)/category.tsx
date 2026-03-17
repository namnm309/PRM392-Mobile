import { CategoryHeader } from "@/components/CategoryHeader";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import {
    CATEGORY_PRICE_SEGMENTS,
    DEFAULT_PRICE_SEGMENTS,
    type PriceSegment,
} from "@/constants/categoryData";
import { COLORS } from "@/constants/theme";
import { useTabBarBottomPadding } from "@/hooks/useTabBarBottomPadding";
import type { ApiCategory } from "@/lib/categoriesApi";
import { fetchCategories } from "@/lib/categoriesApi";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoryScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const router = useRouter();
  const { categoryId: paramCategoryId } = useLocalSearchParams<{
    categoryId?: string;
  }>();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  const sidebarWidth = useMemo(() => {
    // Sidebar nhỏ hơn để nhường chỗ cho Hãng/Phân khúc giá
    const w = Math.round(width * 0.25); // ~25% màn hình
    return Math.max(64, Math.min(120, w));
  }, [width]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryLabel = selectedCategory?.name ?? "Danh mục";

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
          const initialId =
            paramCategoryId && data.some((c) => c.id === paramCategoryId)
              ? paramCategoryId
              : (data[0]?.id ?? null);
          setSelectedCategoryId(initialId);
          setSelectedBrandId(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paramCategoryId]);

  const brands = selectedCategory?.brands ?? [];
  const priceSegments: PriceSegment[] = useMemo(() => {
    const name = selectedCategory?.name ?? "";
    return CATEGORY_PRICE_SEGMENTS[name] ?? DEFAULT_PRICE_SEGMENTS;
  }, [selectedCategory?.name]);
  const contentWidth = width - sidebarWidth;
  const brandGap = 8;
  const brandColumns = 3;
  const brandTileWidth =
    (contentWidth - brandGap * (brandColumns + 1)) / brandColumns;

  if (loading) {
    return (
      <TabScreenWrapper>
        <View style={[styles.screen, styles.centered]}>
          <ActivityIndicator size="small" color={COLORS.headerBlue} />
        </View>
      </TabScreenWrapper>
    );
  }

  if (categories.length === 0) {
    return (
      <TabScreenWrapper>
        <View style={[styles.screen, styles.centered]}>
          <Text style={styles.errorText}>Chưa có danh mục</Text>
        </View>
      </TabScreenWrapper>
    );
  }

  return (
    <TabScreenWrapper>
      <View style={styles.screen}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <CategoryHeader />
          <View style={styles.body}>
            <ScrollView
              style={[styles.sidebar, { width: sidebarWidth }]}
              contentContainerStyle={styles.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.sidebarItem,
                      isSelected && styles.sidebarItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedBrandId(null);
                    }}
                    activeOpacity={0.7}
                  >
                    {isSelected ? <View style={styles.sidebarRedBar} /> : null}
                    <View style={styles.sidebarIconWrap}>
                      {cat.imageUrl ? (
                        <Image
                          source={{ uri: cat.imageUrl }}
                          style={styles.sidebarIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="grid-outline"
                          size={40}
                          color={
                            isSelected
                              ? COLORS.accentRed
                              : COLORS.categoryChipTextSecondary
                          }
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.sidebarText,
                        isSelected && styles.sidebarTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
              </View>

              {selectedCategory && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hãng {categoryLabel}</Text>
                  {brands.length === 0 ? (
                    <Text style={styles.emptyText}>Chưa có thương hiệu</Text>
                  ) : (
                    <View style={[styles.brandRow, { width: contentWidth }]}>
                      {brands.map((brand) => (
                        <TouchableOpacity
                          key={brand.id}
                          style={[
                            styles.brandTile,
                            { width: brandTileWidth },
                            selectedBrandId === brand.id &&
                              styles.brandTileSelected,
                          ]}
                          onPress={() =>
                            router.push({
                              pathname: "/brand" as const,
                              params: {
                                brandId: brand.id,
                                brandName: brand.name,
                              },
                            })
                          }
                          activeOpacity={0.7}
                        >
                          {brand.imageUrl ? (
                            <Image
                              source={{ uri: brand.imageUrl }}
                              style={styles.brandLogo}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.brandName} numberOfLines={2}>
                              {brand.name}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {selectedCategory && priceSegments.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Phân khúc giá</Text>
                  <View style={styles.chipRow}>
                    {priceSegments.map((seg) => (
                      <TouchableOpacity
                        key={seg.label}
                        style={styles.priceChip}
                        activeOpacity={0.7}
                        onPress={() => {
                          const params: Record<string, string> = {
                            categoryId: selectedCategory.id,
                            categoryName: selectedCategory.name,
                            priceLabel: seg.label,
                          };
                          if (seg.minPrice != null)
                            params.minPrice = String(seg.minPrice);
                          if (seg.maxPrice != null)
                            params.maxPrice = String(seg.maxPrice);
                          router.push({
                            pathname: "/category-products" as never,
                            params,
                          });
                        }}
                      >
                        <Text style={styles.priceChipText}>{seg.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.white,
  },
  sidebar: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: COLORS.categoryContentBg,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.categoryChipBorder,
  },
  sidebarContent: {
    paddingBottom: 24,
  },
  sidebarItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
    position: "relative",
  },
  sidebarItemSelected: {
    backgroundColor: "#fff",
  },
  sidebarRedBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accentRed,
  },
  sidebarIconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sidebarIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  sidebarText: {
    fontSize: 13,
    color: COLORS.categoryChipTextSecondary,
    textAlign: "center",
    width: "100%",
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  sidebarTextSelected: {
    color: COLORS.accentRed,
    fontWeight: "600",
  },
  contentScroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentScrollContent: {
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.categoryChipText,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.categoryChipText,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.accentRed,
    borderColor: COLORS.accentRed,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  priceChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    backgroundColor: COLORS.white,
  },
  priceChipText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  brandRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  brandTile: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTileSelected: {
    borderColor: COLORS.accentRed,
  },
  brandLogo: {
    width: "60%",
    height: 18,
    resizeMode: "contain",
  },
  brandName: {
    fontSize: 12,
    color: COLORS.categoryChipText,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.categoryChipText,
  },
});
