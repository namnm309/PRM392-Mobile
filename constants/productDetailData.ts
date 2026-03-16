import type { HomeProduct } from './homeProductData';
import { HOME_PRODUCT_SECTIONS } from './homeProductData';

export type ProductMediaItem = {
  type: 'image' | 'video';
  uri?: string;
  label?: string;
};

export type StorageOption = {
  value: string;
  price: number;
};

export type ColorOption = {
  name: string;
  imageUri?: string;
  price: number;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type StoreBranch = {
  address: string;
  phone: string;
  hasMap: boolean;
};

export type RelatedNewsItem = {
  id: string;
  title: string;
  imageUri?: string;
};

export type QuestionItem = {
  id: string;
  userName: string;
  avatar?: string;
  timeAgo: string;
  question: string;
  replyCount: number;
};

export type ExperienceRating = {
  label: string;
  rating: number;
  count: number;
};

export type ProductReviewItem = {
  id: string;
  userName: string;
  rating: number;
  content: string;
  tags: string[];
  createdAt: string;
};

export type ProductDetail = HomeProduct & {
  media: ProductMediaItem[];
  storageOptions?: StorageOption[];
  colorOptions?: ColorOption[];
  tradeInPrice?: number;
  specsList: ProductSpec[];
  features: string[];
  categoryId?: string | null;
  categoryName?: string | null;
  reviews: {
    rating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    experienceRatings?: ExperienceRating[];
  };
  reviewItems: ProductReviewItem[];
  relatedNews: RelatedNewsItem[];
  questions: QuestionItem[];
  storeBranches: StoreBranch[];
  saleEndCountdown?: { days: number; hours: number; mins: number; secs: number };
  stock?: number;
};

const DEFAULT_DETAIL: Omit<ProductDetail, keyof HomeProduct> = {
  media: [
    { type: 'video', label: 'Video' },
    { type: 'image', label: 'Tính năng nổi bật' },
    { type: 'image' },
    { type: 'image' },
  ],
  storageOptions: [
    { value: '512GB', price: 38990000 },
    { value: '256GB', price: 33290000 },
    { value: '1TB', price: 44990000 },
  ],
  colorOptions: [
    { name: 'Bạc', price: 34990000 },
    { name: 'Xanh Đậm', price: 33290000 },
    { name: 'Cam Vũ Trụ', price: 33290000 },
  ],
  tradeInPrice: 31290000,
  specsList: [
    { label: 'Kích thước màn hình', value: '6.3 inches' },
    { label: 'Công nghệ màn hình', value: 'Super Retina XDR' },
    {
      label: 'Camera sau',
      value:
        'Chính: 48MP khẩu độ f/1.6 OIS hỗ trợ chụp 24MP hoặc 48MP\nGóc Siêu Rộng: 48MP khẩu độ f/2.2 góc nhìn 120°\nTelephoto: 48MP khẩu độ f/2.8 OIS zoom quang học lên đến 8x',
    },
    { label: 'Camera trước', value: 'Camera 18MP Center Stage Khẩu độ f/1.9' },
    { label: 'Chipset', value: 'Chip A19 Pro' },
    { label: 'Công nghệ NFC', value: 'Có' },
    { label: 'Bộ nhớ trong', value: '256 GB' },
    { label: 'Thẻ SIM', value: 'Sim kép (nano-Sim và e-Sim) - Hỗ trợ 2 e-Sim' },
    { label: 'Hệ điều hành', value: 'iOS 26' },
    { label: 'Độ phân giải màn hình', value: '2622 × 1206 pixels' },
    {
      label: 'Tính năng màn hình',
      value:
        '120Hz, HDR, True Tone, Dải màu rộng (P3), Haptic Touch, Tỷ lệ tương phản 2.000.000:1, Độ sáng 1000 nit (tiêu chuẩn), 1600 nit (HDR), 3000 nit (ngoài trời)',
    },
    {
      label: 'Loại CPU',
      value: 'CPU 6 lõi với 2 lõi hiệu năng và 4 lõi tiết kiệm điện',
    },
  ],
  features: [
    'Thiết kế nguyên khối cho sức mạnh vượt trội nhôm rèn nhiệt tạo nên chiếc iphone mạnh mẽ nhất từng được chế tác',
    'Ceramic shield bền chắc mặt trước và sau bảo vệ chống nứt gấp 4 lần và chống trầy xước gấp 3 lần',
    'Hệ thống camera 48MP pro fusion và camera trước 18MP thu phóng quang học 8x cùng nhiều tính năng quay chụp thông minh',
    'Chip A19 Pro với tản nhiệt hơi nước hiệu năng mạnh mẽ nhất từ trước đến nay duy trì ổn định hơn đến 40%',
    'Thời lượng pin đột phá xem video liên tục đến 31 giờ và sạc nhanh 50% chỉ trong 20 phút',
  ],
  categoryId: null,
  categoryName: null,
  reviews: {
    rating: 5,
    totalReviews: 22,
    distribution: { 5: 22, 4: 0, 3: 0, 2: 0, 1: 0 },
    experienceRatings: [
      { label: 'Hiệu năng', rating: 5, count: 21 },
      { label: 'Thời lượng pin', rating: 5, count: 21 },
      { label: 'Chất lượng camera', rating: 5, count: 21 },
    ],
  },
  reviewItems: [
    {
      id: 'r1',
      userName: 'Tuyen',
      rating: 5,
      tags: [
        'Hiệu năng',
        'Siêu mạnh mẽ',
        'Thời lượng pin',
        'Cực khủng',
        'Chất lượng camera',
        'Chụp đẹp, chuyên nghiệp',
      ],
      content: 'hàng rất chi là tốt',
      createdAt: '13/03/2026 01:50',
    },
    {
      id: 'r2',
      userName: 'Tuyen',
      rating: 5,
      tags: [
        'Hiệu năng',
        'Siêu mạnh mẽ',
        'Thời lượng pin',
        'Cực khủng',
        'Chất lượng camera',
        'Chụp đẹp, chuyên nghiệp',
      ],
      content: 'rất tốt ạ, hàng xuất sắc',
      createdAt: '13/03/2026 01:41',
    },
  ],
  relatedNews: [
    {
      id: 'n1',
      title: 'Nên mua iPhone trước hay sau Tết 2026 để có...',
    },
    {
      id: 'n2',
      title: 'Nhìn lại tất cả các sản phẩm được Apple ra m...',
    },
    {
      id: 'n3',
      title: 'CES 2026: Sạc không dây làm mát chủ động...',
    },
    {
      id: 'n4',
      title: 'Điểm danh các sản phẩm thành công và chưa đạt...',
    },
  ],
  questions: [
    {
      id: 'q1',
      userName: 'Anh Phong',
      timeAgo: '2 ngày trước',
      question:
        'cho hỏi chương trình trả góp qua thẻ tín dụng hsbc thế nào ạ, và có ưu đãi gì không',
      replyCount: 2,
    },
    {
      id: 'q2',
      userName: 'Khách',
      timeAgo: '3 ngày trước',
      question: 'cho hỏi từ iphone X 64gb đổi lên 17 pro 256gb dc ko ạ',
      replyCount: 1,
    },
    {
      id: 'q3',
      userName: 'Khách',
      timeAgo: '2 tuần trước',
      question: 'iphone này còn không',
      replyCount: 0,
    },
  ],
  storeBranches: [
    {
      address: '334 Trần Hưng Đạo, Đại Phúc, TP. Bắc Ninh',
      phone: '02471010334',
      hasMap: true,
    },
    {
      address: '242 Trần Phú, TX. Từ Sơn, Bắc Ninh',
      phone: '02471080242',
      hasMap: true,
    },
  ],
  saleEndCountdown: { days: 21, hours: 20, mins: 55, secs: 43 },
  stock: undefined,
};

const DEFAULT_PRODUCT: HomeProduct = {
  id: 'iphone17pro',
  name: 'iPhone 17 Pro 256GB | Chính hãng',
  brand: 'CellphoneS',
  priceCurrent: 33290000,
  priceOriginal: 34990000,
  discountPercent: 5,
  studentPrice: 31625000,
  specs: '256GB, Chip A19 Pro',
  rating: 5,
  badgeSecondary: null,
};

function findProductById(id: string): HomeProduct | null {
  for (const section of HOME_PRODUCT_SECTIONS) {
    const product = section.products.find((p) => p.id === id);
    if (product) return product;
  }
  return null;
}

export function getProductDetail(id: string): ProductDetail {
  const base = findProductById(id) ?? DEFAULT_PRODUCT;
  return {
    ...base,
    ...DEFAULT_DETAIL,
  };
}
