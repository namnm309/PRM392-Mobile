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

// Dữ liệu mẫu các chi nhánh trong cùng một khu vực để hiển thị trên bản đồ.
export const STORE_BRANCHES: StoreBranch[] = [
  {
    id: "branch-1",
    name: "Tech Store 218-220 Trần Quang Khải",
    addressLine1: "218-220 Trần Quang Khải, P. Tân Định",
    addressLine2: "Q.1, TP. Hồ Chí Minh",
    phone: "02871000001",
    openingHours: "8h00 - 22h00 (tất cả các ngày trong tuần)",
    latitude: 10.79265,
    longitude: 106.68827,
  },
  {
    id: "branch-2",
    name: "Tech Store 55B Trần Quang Khải",
    addressLine1: "55B Trần Quang Khải, P. Tân Định",
    addressLine2: "Q.1, TP. Hồ Chí Minh",
    phone: "02871000002",
    openingHours: "8h00 - 22h00 (tất cả các ngày trong tuần)",
    latitude: 10.79385,
    longitude: 106.6894,
  },
  {
    id: "branch-3",
    name: "Tech Store 114 Phan Đăng Lưu",
    addressLine1: "114 Phan Đăng Lưu, P.3",
    addressLine2: "Q. Phú Nhuận, TP. Hồ Chí Minh",
    phone: "02871000003",
    openingHours: "8h00 - 22h00 (tất cả các ngày trong tuần)",
    latitude: 10.8029,
    longitude: 106.6804,
  },
  {
    id: "branch-4",
    name: "Tech Store 567 Lê Quang Định",
    addressLine1: "567 Lê Quang Định, P.1",
    addressLine2: "Q. Gò Vấp, TP. Hồ Chí Minh",
    phone: "02871000004",
    openingHours: "8h00 - 22h00 (tất cả các ngày trong tuần)",
    latitude: 10.8222,
    longitude: 106.689,
  },
];

