import type { ProductVariant } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getColorOptions,
  getConfigOptions,
  getDefaultVariant,
  resolveVariantId,
  type SelectedConfig,
} from '@/lib/variantsUtils';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

type ProductVariantsProps = {
  hasVariants?: boolean;
  variants?: ProductVariant[];
  tradeInPrice?: number;
  onVariantChange?: (selected: {
    variantId?: string;
    priceCurrent: number;
    priceOriginal: number;
    stock: number;
    isComplete: boolean;
  }) => void;
};

export function ProductVariants({
  hasVariants = false,
  variants,
  tradeInPrice,
  onVariantChange,
}: ProductVariantsProps) {
  const activeVariants = useMemo(
    () =>
      (variants ?? [])
        .filter((v) => v?.isActive)
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [variants],
  );

  const hasRealVariants = hasVariants && activeVariants.length > 0;

  const configOptions = useMemo(
    () => (hasRealVariants ? getConfigOptions(activeVariants) : []),
    [hasRealVariants, activeVariants],
  );

  const [selectedConfig, setSelectedConfig] = useState<SelectedConfig | null>(
    null,
  );
  const [selectedColorName, setSelectedColorName] = useState<string | null>(
    null,
  );
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  const colorOptions = useMemo(
    () =>
      hasRealVariants ? getColorOptions(activeVariants, selectedConfig) : [],
    [hasRealVariants, activeVariants, selectedConfig],
  );

  const resolved = useMemo(
    () =>
      hasRealVariants
        ? resolveVariantId(selectedConfig, selectedColorName, activeVariants)
        : null,
    [hasRealVariants, selectedConfig, selectedColorName, activeVariants],
  );

  // Auto-select default in-stock variant on load (per requirement)
  useEffect(() => {
    if (!hasRealVariants) return;
    const def = getDefaultVariant(activeVariants);
    if (!def) return;
    setSelectedConfig({
      ramGb: def.ramGb ?? null,
      storageGb: def.storageGb ?? null,
    });
    setSelectedColorName(def.colorName);
    setInlineMessage(null);
    onVariantChange?.({
      variantId: def.id,
      priceCurrent: def.discountPrice ?? def.price,
      priceOriginal: def.price,
      stock: def.stock ?? 0,
      isComplete: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealVariants]);

  // Emit selection changes
  useEffect(() => {
    if (!hasRealVariants) return;
    if (!selectedConfig || !selectedColorName) {
      onVariantChange?.({
        variantId: undefined,
        priceCurrent: 0,
        priceOriginal: 0,
        stock: 0,
        isComplete: false,
      });
      return;
    }
    if (!resolved) {
      // mapping not found → fallback default
      const def = getDefaultVariant(activeVariants);
      if (def) {
        setSelectedConfig({
          ramGb: def.ramGb ?? null,
          storageGb: def.storageGb ?? null,
        });
        setSelectedColorName(def.colorName);
        setInlineMessage(
          'Tuỳ chọn bạn chọn hiện không còn. Đã chuyển sang phiên bản gần nhất.',
        );
      }
      return;
    }
    if ((resolved.stock ?? 0) <= 0) {
      setInlineMessage('Phiên bản này đã hết hàng. Vui lòng chọn tuỳ chọn khác.');
      onVariantChange?.({
        variantId: undefined,
        priceCurrent: resolved.discountPrice ?? resolved.price,
        priceOriginal: resolved.price,
        stock: resolved.stock ?? 0,
        isComplete: false,
      });
      return;
    }
    setInlineMessage(null);
    onVariantChange?.({
      variantId: resolved.id,
      priceCurrent: resolved.discountPrice ?? resolved.price,
      priceOriginal: resolved.price,
      stock: resolved.stock ?? 0,
      isComplete: true,
    });
  }, [
    hasRealVariants,
    selectedConfig,
    selectedColorName,
    resolved,
    activeVariants,
    onVariantChange,
  ]);

  if (!hasRealVariants && tradeInPrice == null) return null;

  return (
    <View style={styles.container}>
      {hasRealVariants && configOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cấu hình</Text>
          <View style={styles.optionsRow}>
            {configOptions.map((opt) => {
              const isSelected =
                selectedConfig?.ramGb === opt.ramGb &&
                selectedConfig?.storageGb === opt.storageGb;
              const disabled = !opt.inStock;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.storageChip,
                    isSelected && styles.chipSelected,
                    disabled && styles.optionDisabled,
                  ]}
                  onPress={() => {
                    if (disabled) return;
                    setSelectedConfig({ ramGb: opt.ramGb, storageGb: opt.storageGb });
                    setInlineMessage(null);
                    // If current color not available under new config, auto-pick first available color
                    const colors = getColorOptions(activeVariants, {
                      ramGb: opt.ramGb,
                      storageGb: opt.storageGb,
                    });
                    if (
                      selectedColorName &&
                      colors.some((c) => c.colorName === selectedColorName && c.inStock)
                    ) {
                      return;
                    }
                    const firstInStock = colors.find((c) => c.inStock) ?? colors[0];
                    setSelectedColorName(firstInStock?.colorName ?? null);
                  }}
                  activeOpacity={0.7}
                  disabled={disabled}
                >
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color={COLORS.accentRed} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.storageText,
                      isSelected && styles.chipTextSelected,
                      disabled && styles.optionDisabledText,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {hasRealVariants && colorOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Màu sắc</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((opt) => {
              const isSelected = selectedColorName === opt.colorName;
              const disabled = !opt.inStock;
              return (
                <TouchableOpacity
                  key={opt.colorName}
                  style={[
                    styles.colorChip,
                    isSelected && styles.colorChipSelected,
                    disabled && styles.optionDisabled,
                  ]}
                  onPress={() => {
                    if (disabled) return;
                    setSelectedColorName(opt.colorName);
                    setInlineMessage(null);
                  }}
                  activeOpacity={0.7}
                  disabled={disabled}
                >
                  <View style={styles.colorChipRow}>
                    <View
                      style={[
                        styles.colorSwatch,
                        opt.colorHex ? { backgroundColor: opt.colorHex } : styles.colorSwatchFallback,
                      ]}
                    />
                    <Text
                      style={[
                        styles.colorChipText,
                        isSelected && styles.chipTextSelected,
                        disabled && styles.optionDisabledText,
                      ]}
                      numberOfLines={1}
                    >
                      {opt.colorName}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color={COLORS.accentRed} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {inlineMessage ? <Text style={styles.inlineMessage}>{inlineMessage}</Text> : null}

      {tradeInPrice != null && (
        <View style={styles.tradeIn}>
          <View style={styles.tradeInIcon}>
            <Ionicons name="arrow-up-circle" size={20} color={COLORS.accentRed} />
          </View>
          <Text style={styles.tradeInText}>
            Thu cũ lên đời chỉ từ {formatPrice(tradeInPrice)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  storageChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  chipSelected: {
    borderColor: COLORS.accentRed,
  },
  chipTextSelected: {
    color: COLORS.accentRed,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  storageText: {
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  colorChipSelected: {
    borderColor: COLORS.accentRed,
  },
  colorChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 18,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
  },
  colorSwatchFallback: {
    backgroundColor: COLORS.categoryContentBg,
  },
  colorChipText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    maxWidth: 160,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionDisabledText: {
    color: COLORS.cartTextSecondary,
  },
  inlineMessage: {
    fontSize: 13,
    color: COLORS.cartTextSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  tradeIn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  tradeInIcon: {},
  tradeInText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
});
