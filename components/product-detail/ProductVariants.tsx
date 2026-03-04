import type { ColorOption, StorageOption } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

type ProductVariantsProps = {
  storageOptions?: StorageOption[];
  colorOptions?: ColorOption[];
  tradeInPrice?: number;
};

export function ProductVariants({
  storageOptions,
  colorOptions,
  tradeInPrice,
}: ProductVariantsProps) {
  const [selectedStorage, setSelectedStorage] = useState<string | null>(
    storageOptions?.[1]?.value ?? null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colorOptions?.[1]?.name ?? null
  );

  if (!storageOptions?.length && !colorOptions?.length && !tradeInPrice) {
    return null;
  }

  return (
    <View style={styles.container}>
      {storageOptions && storageOptions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.optionsRow}>
            {storageOptions.map((opt) => {
              const isSelected = selectedStorage === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.storageChip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedStorage(opt.value)}
                  activeOpacity={0.7}
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
                    ]}
                  >
                    {opt.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {colorOptions && colorOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Màu sắc</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((opt) => {
              const isSelected = selectedColor === opt.name;
              return (
                <TouchableOpacity
                  key={opt.name}
                  style={[styles.colorCard, isSelected && styles.colorCardSelected]}
                  onPress={() => setSelectedColor(opt.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.colorImage}>
                    <Text style={styles.colorEmoji}>📱</Text>
                  </View>
                  <Text style={styles.colorName}>{opt.name}</Text>
                  <Text style={styles.colorPrice}>{formatPrice(opt.price)}</Text>
                  {isSelected && (
                    <View style={styles.colorCheckmark}>
                      <Ionicons name="checkmark" size={16} color={COLORS.accentRed} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

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
  colorCard: {
    width: '30%',
    minWidth: 100,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  colorCardSelected: {
    borderColor: COLORS.accentRed,
  },
  colorImage: {
    height: 60,
    backgroundColor: COLORS.categoryContentBg,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorEmoji: {
    fontSize: 28,
  },
  colorName: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 2,
  },
  colorPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  colorCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
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
