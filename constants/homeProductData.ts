export type HomeProduct = {
  id: string;
  name: string;
  brand: string;
  priceCurrent: number;
  priceOriginal: number;
  discountPercent: number;
  studentPrice?: number;
  specs?: string;
  rating?: number;
  imageUri?: string | null;
  badgeSecondary?: 'Trả góp 0%' | null;
};

export type ProductCategorySection = {
  id: string;
  title: string;
  subCategories: string[];
  products: HomeProduct[];
};

export const HOME_PRODUCT_SECTIONS: ProductCategorySection[] = [
  {
    id: 'laptop',
    title: 'LAPTOP',
    subCategories: ['Macbook', 'ASUS', 'MSI', 'Lenovo', 'HP', 'Acer', 'Dell'],
    products: [
      {
        id: 'lp1',
        name: 'Laptop ASUS TUF Gaming F16 FX607VJ-RL034W',
        brand: 'ASUS',
        priceCurrent: 22490000,
        priceOriginal: 24490000,
        discountPercent: 8,
        studentPrice: 21990000,
        specs: 'CORE 5-210H RTX 3050, 16GB 512GB 16" WUXGA',
        rating: 4.8,
        badgeSecondary: null,
      },
      {
        id: 'lp2',
        name: 'Laptop ASUS Vivobook S 14 FLIP TP3402VA-LZ632W',
        brand: 'ASUS',
        priceCurrent: 19990000,
        priceOriginal: 21990000,
        discountPercent: 5,
        studentPrice: 19490000,
        specs: 'i5-13420H Intel UHD, 16GB 256GB 13.6" 2K',
        rating: 4.9,
        badgeSecondary: null,
      },
      {
        id: 'lp3',
        name: 'Apple MacBook Air M2 2024',
        brand: 'Apple',
        priceCurrent: 19690000,
        priceOriginal: 24990000,
        discountPercent: 21,
        studentPrice: 18990000,
        specs: 'Apple M2 8 nhân GPU, 16GB 256GB 13.6" 2K',
        rating: 5,
        badgeSecondary: null,
      },
      {
        id: 'lp4',
        name: 'MacBook Air M4 13 inch 2025',
        brand: 'Apple',
        priceCurrent: 23990000,
        priceOriginal: 27990000,
        discountPercent: 11,
        studentPrice: 22990000,
        specs: 'Apple M4 8 nhân GPU, 16GB 256GB 13.6"',
        badgeSecondary: 'Trả góp 0%',
      },
    ],
  },
  {
    id: 'man-hinh-pc',
    title: 'MÀN HÌNH, MÁY TÍNH ĐỂ BÀN',
    subCategories: ['Build PC', 'Máy tính bàn', 'PC Gaming', 'PC Đồ họa', 'Màn hình Gaming'],
    products: [
      {
        id: 'mh1',
        name: 'Màn hình Gaming ASUS TUF VG27AQ5A 27 inch',
        brand: 'ASUS',
        priceCurrent: 4990000,
        priceOriginal: 5290000,
        discountPercent: 6,
        studentPrice: 4740500,
        specs: 'AMD FreeSync Premium, 0.3ms, 27 inch 210 Hz 2K',
        badgeSecondary: 'Trả góp 0%',
      },
      {
        id: 'mh2',
        name: 'PC CPS Gaming G02 i3 12100F / 8GB - 256GB / RTX 3050',
        brand: 'CPS',
        priceCurrent: 12990000,
        priceOriginal: 18690000,
        discountPercent: 30,
        studentPrice: 12490000,
        specs: 'i3 12100F, RTX 3050, 8GB, 256GB, H610M-S',
        rating: 5,
        badgeSecondary: null,
      },
    ],
  },
  {
    id: 'may-tinh-bang',
    title: 'MÁY TÍNH BẢNG',
    subCategories: ['iPad Air M2 2024', 'iPad Pro M4 2024', 'Tab S10 Series', 'Xiaomi', 'Huawei'],
    products: [
      {
        id: 'tb1',
        name: 'iPad A16 Wifi 128GB 2025 | Chính hãng Apple Việt Nam',
        brand: 'Apple',
        priceCurrent: 8490000,
        priceOriginal: 9990000,
        discountPercent: 15,
        studentPrice: 8065500,
        specs: '128GB, WiFi',
        rating: 4.8,
        badgeSecondary: null,
      },
      {
        id: 'tb2',
        name: 'HONOR Pad 10 Wifi 8GB 256GB',
        brand: 'HONOR',
        priceCurrent: 10990000,
        priceOriginal: 11990000,
        discountPercent: 8,
        studentPrice: 10490000,
        specs: '8GB 256GB, Tặng bàn phím thông minh',
        badgeSecondary: 'Trả góp 0%',
      },
    ],
  },
  {
    id: 'am-thanh',
    title: 'ÂM THANH',
    subCategories: ['Tai nghe Bluetooth', 'Tai nghe không dây', 'Tai nghe Gaming', 'Loa Bluetooth'],
    products: [
      {
        id: 'at1',
        name: 'Tai nghe Bluetooth Apple AirPods 4 | Chính hãng Apple',
        brand: 'Apple',
        priceCurrent: 2990000,
        priceOriginal: 3790000,
        discountPercent: 21,
        studentPrice: 2975000,
        specs: 'Tai nghe 5h, Hộp sạc 30h, Bluetooth 5.3, Chip H2',
        rating: 5,
        badgeSecondary: 'Sale Tết',
      },
      {
        id: 'at2',
        name: 'Tai nghe không dây HUAWEI FreeClip 2',
        brand: 'HUAWEI',
        priceCurrent: 3990000,
        priceOriginal: 4490000,
        discountPercent: 11,
        studentPrice: 3890000,
        specs: 'Tai nghe 8h, Hộp sạc 36h, Bluetooth 5.3, IP54',
        badgeSecondary: 'Trả góp 0%',
      },
    ],
  },
  {
    id: 'dong-ho-thong-minh',
    title: 'ĐỒNG HỒ THÔNG MINH',
    subCategories: ['Apple Watch', 'Samsung', 'Huawei', 'Garmin', 'Xiaomi'],
    products: [
      {
        id: 'dh1',
        name: 'Đồng hồ thông minh Huawei Watch Fit 4',
        brand: 'HUAWEI',
        priceCurrent: 2540000,
        priceOriginal: 3090000,
        discountPercent: 18,
        studentPrice: 2413000,
        specs: '10 ngày pin, Nghe gọi, Nhịp tim',
        rating: 4.8,
        badgeSecondary: 'Sale Tết',
      },
      {
        id: 'dh2',
        name: 'Vòng đeo tay thông minh Huawei Band 10',
        brand: 'HUAWEI',
        priceCurrent: 690000,
        priceOriginal: 990000,
        discountPercent: 30,
        studentPrice: 655500,
        specs: '14 ngày pin, Nhịp tim, Thông báo cuộc gọi',
        badgeSecondary: null,
      },
    ],
  },
  {
    id: 'do-gia-dung',
    title: 'ĐỒ GIA DỤNG',
    subCategories: ['Quạt', 'Máy hút bụi', 'Máy massage', 'Chăm sóc răng', 'Máy lọc không khí'],
    products: [
      {
        id: 'gd1',
        name: 'Máy Massage cổ vai gáy Philips PPM3522',
        brand: 'PHILIPS',
        priceCurrent: 1590000,
        priceOriginal: 2490000,
        discountPercent: 36,
        studentPrice: 1510000,
        specs: '3 chế độ massage, 2 mức nhiệt 40-45°C',
        rating: 5,
      },
      {
        id: 'gd2',
        name: 'Máy lọc không khí Xiaomi Air Purifier 4 Compact',
        brand: 'XIAOMI',
        priceCurrent: 1690000,
        priceOriginal: 2590000,
        discountPercent: 35,
        studentPrice: 1605000,
        specs: '16-27m², Lọc bụi PM 0.3, Độ ồn 20-60 dB',
        rating: 4.8,
      },
    ],
  },
  {
    id: 'tivi',
    title: 'TIVI',
    subCategories: ['Samsung', 'Xiaomi', 'Coocaa', 'LG', 'TCL'],
    products: [
      {
        id: 'tv1',
        name: 'Tivi Xiaomi 43 inch 4K',
        brand: 'Xiaomi',
        priceCurrent: 6990000,
        priceOriginal: 7990000,
        discountPercent: 13,
        studentPrice: 6690000,
        specs: 'HDR10+, Dolby Audio, 43 inch 4K 60Hz',
        badgeSecondary: null,
      },
      {
        id: 'tv2',
        name: 'Tivi Xiaomi 32 inch HD',
        brand: 'Xiaomi',
        priceCurrent: 3990000,
        priceOriginal: 4790000,
        discountPercent: 16,
        studentPrice: 3790000,
        specs: 'Color Gamut, Dolby Audio, 32 inch HD 60Hz',
        badgeSecondary: null,
      },
    ],
  },
];
