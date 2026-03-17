import type { ChipTag } from '@/components/CategoryChip';

export type CategoryItem = {
  id: string;
  label: string;
};

export const CATEGORIES: CategoryItem[] = [
  { id: 'dien-thoai', label: 'Điện thoại' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'am-thanh', label: 'Âm thanh' },
  { id: 'dong-ho', label: 'Đồng hồ' },
  { id: 'camera', label: 'Camera' },
  { id: 'gia-dung', label: 'Gia dụng' },
];

export const PHONE_BRANDS: string[] = [
  'Apple',
  'SAMSUNG',
  'xiaomi',
  'TECNO',
  'HONOR',
  'ZTE/nubia',
  'NOKIA',
  'Infinix',
  'itel',
  'vivo',
  'Điện thoại phổ thông',
];

export type PriceSegment = {
  label: string;
  minPrice?: number;
  maxPrice?: number;
};

export const CATEGORY_PRICE_SEGMENTS: Record<string, PriceSegment[]> = {
  'Điện thoại': [
    { label: 'Dưới 22 triệu', maxPrice: 22_000_000 },
    { label: 'Từ 22 - 26 triệu', minPrice: 22_000_000, maxPrice: 26_000_000 },
    { label: 'Từ 26 - 30 triệu', minPrice: 26_000_000, maxPrice: 30_000_000 },
    { label: 'Trên 30 triệu', minPrice: 30_000_000 },
  ],
  'Tablet': [
    { label: 'Dưới 10 triệu', maxPrice: 10_000_000 },
    { label: 'Từ 10 - 15 triệu', minPrice: 10_000_000, maxPrice: 15_000_000 },
    { label: 'Từ 15 - 20 triệu', minPrice: 15_000_000, maxPrice: 20_000_000 },
    { label: 'Trên 20 triệu', minPrice: 20_000_000 },
  ],
  'Laptop': [
    { label: 'Dưới 20 triệu', maxPrice: 20_000_000 },
    { label: 'Từ 20 - 30 triệu', minPrice: 20_000_000, maxPrice: 30_000_000 },
    { label: 'Từ 30 - 45 triệu', minPrice: 30_000_000, maxPrice: 45_000_000 },
    { label: 'Trên 45 triệu', minPrice: 45_000_000 },
  ],
  'Âm thanh': [
    { label: 'Dưới 5 triệu', maxPrice: 5_000_000 },
    { label: 'Từ 5 - 10 triệu', minPrice: 5_000_000, maxPrice: 10_000_000 },
    { label: 'Trên 10 triệu', minPrice: 10_000_000 },
  ],
  'Đồng hồ': [
    { label: 'Dưới 3 triệu', maxPrice: 3_000_000 },
    { label: 'Từ 3 - 5 triệu', minPrice: 3_000_000, maxPrice: 5_000_000 },
    { label: 'Từ 5 - 10 triệu', minPrice: 5_000_000, maxPrice: 10_000_000 },
    { label: 'Trên 10 triệu', minPrice: 10_000_000 },
  ],
  'Camera': [
    { label: 'Dưới 10 triệu', maxPrice: 10_000_000 },
    { label: 'Từ 10 - 20 triệu', minPrice: 10_000_000, maxPrice: 20_000_000 },
    { label: 'Từ 20 - 40 triệu', minPrice: 20_000_000, maxPrice: 40_000_000 },
    { label: 'Trên 40 triệu', minPrice: 40_000_000 },
  ],
  'Gia dụng': [
    { label: 'Dưới 3 triệu', maxPrice: 3_000_000 },
    { label: 'Từ 3 - 5 triệu', minPrice: 3_000_000, maxPrice: 5_000_000 },
    { label: 'Từ 5 - 10 triệu', minPrice: 5_000_000, maxPrice: 10_000_000 },
    { label: 'Trên 10 triệu', minPrice: 10_000_000 },
  ],
};

export const DEFAULT_PRICE_SEGMENTS: PriceSegment[] = [
  { label: 'Dưới 5 triệu', maxPrice: 5_000_000 },
  { label: 'Từ 5 - 10 triệu', minPrice: 5_000_000, maxPrice: 10_000_000 },
  { label: 'Từ 10 - 20 triệu', minPrice: 10_000_000, maxPrice: 20_000_000 },
  { label: 'Từ 20 - 30 triệu', minPrice: 20_000_000, maxPrice: 30_000_000 },
  { label: 'Trên 30 triệu', minPrice: 30_000_000 },
];

export type HotProductItem = {
  id: string;
  label: string;
  tag?: ChipTag;
};

export const HOT_PHONES: HotProductItem[] = [
  { id: 'iphone-17', label: 'iPhone 17', tag: 'HOT' },
  { id: 'iphone-air', label: 'iPhone Air', tag: 'HOT' },
  { id: 'iphone-16', label: 'iPhone 16' },
  { id: 'galaxy', label: 'Galaxy...' },
  { id: 's25-ultra', label: 'S25 Ultra' },
  { id: 'oppo-reno15', label: 'OPPO Reno15', tag: 'MỚI' },
  { id: 'samsung-galaxy-a', label: 'Samsung Galaxy A...' },
  { id: 'xiaomi-15t', label: 'Xiaomi 15T' },
  { id: 'redmi-note-15', label: 'Redmi Note 15', tag: 'MỚI' },
  { id: 'poco-f8', label: 'POCO F8 Pro 5G' },
  { id: 'oppo-find-x9', label: 'OPPO Find X9' },
  { id: 'honor-magic-v5', label: 'HONOR Magic v5' },
  { id: 'iphone-17-2', label: 'iPhone 17' },
  { id: 'sony-xperia', label: 'Sony Xperia 1 VII' },
];
