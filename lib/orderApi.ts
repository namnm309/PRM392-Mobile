import { fetchWithAuth } from './authApi';

export interface ProductInOrder {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isOnSale: boolean;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  product: ProductInOrder | null;
  quantity: number;
  unitPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInOrder {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  ward: string;
  district: string;
  city: string;
  isPrimary: boolean;
}

export interface VoucherInOrder {
  id: string;
  code: string;
  discountType: string;
  value: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  addressId: string;
  address: AddressInOrder | null;
  status: string;
  subtotal: number;
  discountAmount: number;
  voucherId: string | null;
  voucher: VoucherInOrder | null;
  totalAmount: number;
  notes: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  orderItems: OrderItemDto[];
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getMyOrders(
  getToken: () => Promise<string | null>,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<PagedResponse<OrderDto>> {
  const response = await fetchWithAuth(
    `/api/Orders?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    getToken
  );
  const result: ApiResponse<PagedResponse<OrderDto>> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getOrderById(
  getToken: () => Promise<string | null>,
  orderId: string
): Promise<OrderDto | null> {
  const response = await fetchWithAuth(`/api/Orders/${orderId}`, getToken);
  if (response.status === 404) return null;
  const result: ApiResponse<OrderDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function cancelOrder(
  getToken: () => Promise<string | null>,
  orderId: string,
  reason?: string
): Promise<boolean> {
  const response = await fetchWithAuth(
    `/api/Orders/${orderId}/cancel`,
    getToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelReason: reason }),
    }
  );
  const result: ApiResponse<object> = await response.json();
  return result.success;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Pending':
      return '#F59E0B';
    case 'Processing':
      return '#3B82F6';
    case 'Shipped':
      return '#8B5CF6';
    case 'Delivered':
      return '#10B981';
    case 'Cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'Pending':
      return 'Chờ xác nhận';
    case 'Processing':
      return 'Đang xử lý';
    case 'Shipped':
      return 'Đang giao';
    case 'Delivered':
      return 'Đã giao';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}
