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

export const PRICE_SEGMENTS: string[] = [
  'Dưới 2 triệu',
  'Từ 2 - 4 triệu',
  'Từ 4 - 7 triệu',
  'Từ 13 - 20 triệu',
  'Trên 20 triệu',
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
