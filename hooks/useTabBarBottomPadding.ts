const EXTRA_PADDING = 16;

/**
 * Padding bottom cho nội dung scroll. Tab bar nằm cùng layer (dưới content),
 * nên chỉ cần khoảng cách nhỏ để nội dung cuối không sát thanh tab.
 */
export function useTabBarBottomPadding(): number {
  return EXTRA_PADDING;
}
