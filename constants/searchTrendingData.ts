export type TrendingSearchItem = {
  id: string;
  name: string;
  imageUri?: string | null;
};

export const TRENDING_SEARCH_PRODUCTS: TrendingSearchItem[] = [
  { id: 'iphone-17-series', name: 'iPhone 17 Series' },
  { id: 'galaxy-s26-ultra', name: 'Galaxy S26 Ultra' },
  { id: 'macbook-pro-m5-pro', name: 'MacBook Pro M5 Pro' },
  { id: 'macbook-neo', name: 'MacBook Neo' },
  { id: 'galaxy-buds4-pro', name: 'Galaxy Buds4 Pro' },
  { id: 'ipad-air-m4', name: 'iPad Air M4' },
  { id: 'galaxy-watch-8', name: 'Samsung Galaxy Watch8' },
  { id: 'macbook-air-m5', name: 'MacBook Air M5' },
  { id: 'iphone-17e', name: 'iPhone 17e' },
  { id: 'xiaomi-smart-glasses', name: 'Kính thông minh Xiaomi' },
];

