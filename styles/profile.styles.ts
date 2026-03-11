import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  // User info (white header)
  userInfoSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.grey,
  },
  eyeButton: {
    padding: 4,
  },
  // Stats 2 columns
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statColumnDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    alignSelf: 'stretch',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.grey,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 11,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 2,
  },
  // Banner Techmember
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  bannerIcon: {
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.background,
    lineHeight: 20,
  },
  bannerCta: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  bannerCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  // Quick access row (4 items)
  quickAccessRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickAccessItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessIcon: {
    marginBottom: 8,
  },
  quickAccessLabel: {
    fontSize: 12,
    color: COLORS.background,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.background,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.grey,
  },
  // Guest (chưa đăng nhập)
  guestWelcomeSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  guestWelcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 8,
  },
  guestWelcomeSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 20,
    marginBottom: 16,
  },
  guestButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  guestPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.accentRed,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  guestSecondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  guestSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
});
