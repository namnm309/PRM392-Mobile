import { ProductCard } from "@/components/ProductCard";
import type { HomeProduct } from "@/constants/homeProductData";
import { COLORS } from "@/constants/theme";
import type { ApiBrandSummary, ApiCategory } from "@/lib/categoriesApi";
import { fetchProducts, mapApiProductToHomeProduct } from "@/lib/productsApi";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

type ProductCategorySectionProps = {
  category: ApiCategory;
};

export function ProductCategorySection({
  category,
}: ProductCategorySectionProps) {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(180, (width - 16 * 2 - 12) / 2);
  const router = useRouter();

  const categoryIdToFetch = category.id;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProducts({ categoryId: categoryIdToFetch })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.map(mapApiProductToHomeProduct));
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryIdToFetch]);

  const handleSeeAll = () => {
    router.push({
      pathname: "/category" as const,
      params: { categoryId: category.id },
    });
  };

  const handleBrandPress = (brand: ApiBrandSummary) => {
    router.push({
      pathname: "/brand" as const,
      params: {
        brandId: brand.id,
        brandName: brand.name,
      },
    });
  };

  const brandChips = category.brands ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{category.name.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      {brandChips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsWrap}
          style={styles.chipsScroll}
        >
          {brandChips.map((brand) => (
            <TouchableOpacity
              key={brand.id}
              style={styles.chip}
              onPress={() => handleBrandPress(brand)}
              activeOpacity={0.7}
            >
              <Text
                style={styles.chipText}
              >
                {brand.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.headerBlue} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsWrap}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} width={cardWidth} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.accentRed,
    fontWeight: "500",
  },
  chipsScroll: {
    marginBottom: 12,
  },
  chipsWrap: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
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
    borderColor: COLORS.categoryChipBorder,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  chipTextSelected: {
    color: COLORS.categoryChipText,
    fontWeight: "600",
  },
  loadingWrap: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  productsWrap: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: "row",
    paddingRight: 32,
  },
});
