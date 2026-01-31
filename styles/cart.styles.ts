import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

const CARD_BG = '#F8F9FA';

export const cartStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cartBackground,
  },
  headerBack: {
    padding: 8,
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
    backgroundColor: COLORS.cartPrimary,
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
    backgroundColor: COLORS.cartPrimary,
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
