export type StoreBranch = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  openingHours: string;
  latitude: number;
  longitude: number;
};

// Cửa hàng duy nhất: TechStore Nhà Văn Hóa Sinh Viên TP.HCM
export const STORE_BRANCHES: StoreBranch[] = [
  {
    id: "techstore-nvhsv-hcm",
    name: "TechStore Nhà Văn Hóa Sinh Viên TP.HCM",
    addressLine1: "Số 1 Lưu Hữu Phước, Đông Hoà, Dĩ An",
    addressLine2: "Thành phố Hồ Chí Minh",
    phone: "02838351118",
    openingHours: "8h00 - 22h00 (tất cả các ngày trong tuần)",
    latitude: 10.875926,
    longitude: 106.800705,
  },
];

