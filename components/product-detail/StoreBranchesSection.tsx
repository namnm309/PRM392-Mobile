import type { StoreBranch } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type StoreBranchesSectionProps = {
  branches: StoreBranch[];
};

export function StoreBranchesSection({ branches }: StoreBranchesSectionProps) {
  if (!branches.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Xem chi nhánh có hàng</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {branches.map((branch, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.address} numberOfLines={2}>
              {branch.address}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.phoneButton} activeOpacity={0.7}>
                <Ionicons name="call" size={14} color={COLORS.white} />
                <Text style={styles.phoneText}>{branch.phone}</Text>
              </TouchableOpacity>
              {branch.hasMap && (
                <TouchableOpacity style={styles.mapButton} activeOpacity={0.7}>
                  <Ionicons name="location" size={14} color={COLORS.cartTextPrimary} />
                  <Text style={styles.mapText}>Bản đồ</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
    paddingRight: 32,
  },
  card: {
    width: 260,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    backgroundColor: COLORS.white,
  },
  address: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentRed,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  mapText: {
    fontSize: 12,
    color: COLORS.cartTextPrimary,
  },
});
