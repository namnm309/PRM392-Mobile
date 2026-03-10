import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

const CARD_BG = '#F8F9FA';

export const cartStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cartBackground,
  },
  // List container when has items
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  // Cart item card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
  },
  itemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.categoryChipBorder,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCheckboxChecked: {
    backgroundColor: COLORS.accentRed,
    borderColor: COLORS.accentRed,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.categoryContentBg,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholder: {
    fontSize: 32,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  itemPriceCurrent: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  itemPriceOriginal: {
    fontSize: 12,
    color: COLORS.grey,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  itemDiscount: {
    fontSize: 12,
    color: COLORS.accentRed,
    marginTop: 4,
  },
  itemQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  itemQuantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemQuantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  // Footer with select all
  footerSelectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  footerSelectAllCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.categoryChipBorder,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSelectAllCheckboxChecked: {
    backgroundColor: COLORS.accentRed,
    borderColor: COLORS.accentRed,
  },
  footerSelectAllLabel: {
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  footerSubtotalRed: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  // Empty state – container căn giữa
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  // Card empty state
  emptyCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyCardIconWrap: {
    marginBottom: 20,
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyCardSubtitle: {
    fontSize: 14,
    color: COLORS.cartTextSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyCardCta: {
    backgroundColor: COLORS.accentRed,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.cartBorder,
    backgroundColor: COLORS.cartBackground,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  footerSubtotalLabel: {
    fontSize: 14,
    color: COLORS.cartTextSecondary,
    marginRight: 4,
  },
  footerSubtotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartPrimary,
  },
  footerButton: {
    backgroundColor: COLORS.accentRed,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonDisabled: {
    opacity: 0.6,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});
