# 📋 Hệ thống API Dự án - Báo cáo Trạng thái Đồng bộ 100%

Tài liệu này tổng hợp toàn bộ các điểm cuối API (Endpoints) trong dự án, được đối chiếu và đồng bộ chính xác 100% theo tài liệu Swagger backend.

---

## 1. Auth API (Xác thực)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Xác thực tài khoản | `POST` | `/api/v1/auth/verify` | ✅ Synced | Xác thực qua token email |
| Đăng ký tài khoản | `POST` | `/api/v1/auth/register` | ✅ Synced | `email`, `password`, `fullName` |
| Làm mới Token | `POST` | `/api/v1/auth/refresh` | ✅ Synced | `refreshToken` |
| Đăng nhập | `POST` | `/api/v1/auth/login` | ✅ Synced | Trả về `accessToken` & `refreshToken` |

---

## 2. Farm API (Quản lý Trang trại)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách Farm | `GET` | `/api/v1/farms` | ✅ Synced | |
| Tạo Farm mới | `POST` | `/api/v1/farms` | ✅ Synced | |
| Chọn Farm | `POST` | `/api/v1/farms/{id}/select` | ✅ Synced | Trả về `farmToken` |
| Cập nhật Farm | `PATCH` | `/api/v1/farms/{id}` | ✅ Synced | |
| Tổng quan Farm | `GET` | `/api/v1/farms/summary` | ✅ Synced | Dashboard |

---

## 3. Plan API (Kế hoạch sản xuất)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách kế hoạch | `GET` | `/api/v1/plans` | ✅ Synced | |
| Tạo kế hoạch mới | `POST` | `/api/v1/plans` | ✅ Synced | `cropId`, `name`, `startDate`, `endDate`, `note` |
| Lấy Plot của kế hoạch | `GET` | `/api/v1/plans/{id}/plots` | ✅ Synced | |
| Thêm Plot vào kế hoạch | `POST` | `/api/v1/plans/{id}/plots` | ✅ Synced | `plotIds: []` |
| Cập nhật thời gian | `PUT` | `/api/v1/plans/{id}/time` | ✅ Synced | `startDate`, `endDate` |
| Xóa kế hoạch | `DELETE` | `/api/v1/plans/{id}` | ✅ Synced | |

---

## 4. PlanStage API (Giai đoạn kế hoạch)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách giai đoạn | `GET` | `/api/v1/plans/{id}/stages` | ✅ Synced | |
| Tạo giai đoạn mới | `POST` | `/api/v1/plans/{id}/stages` | ✅ Synced | `name`, `startDate`, `endDate` |
| Cập nhật giai đoạn | `PATCH` | `/api/v1/plans/{id}/stages/{sid}` | ✅ Synced | `name`, `startDate`, `endDate` |
| Cập nhật TG giai đoạn| `PUT` | `/api/v1/plans/{id}/stages/{sid}/time` | ✅ Synced | `startDate`, `endDate` |
| Xóa giai đoạn | `DELETE` | `/api/v1/plans/{id}/stages/{sid}` | ✅ Synced | |

---

## 5. Task API (Công việc)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách công việc | `GET` | `/api/v1/plans/{id}/stages/{sid}/tasks` | ✅ Synced | |
| Tạo công việc mới | `POST` | `/api/v1/plans/{id}/stages/{sid}/tasks` | ✅ Synced | |
| Cập nhật công việc | `PATCH` | `/api/v1/plans/{id}/stages/{sid}/tasks/{tid}` | ✅ Synced | |
| Xóa công việc | `DELETE` | `/api/v1/plans/{id}/stages/{sid}/tasks/{tid}` | ✅ Synced | |

---

## 6. Plot API (Lô đất)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách lô đất | `GET` | `/api/v1/plots` | ✅ Synced | |
| Tạo lô đất mới | `POST` | `/api/v1/plots` | ✅ Synced | `plotName`, `geometry`, `description` |
| Cập nhật lô đất | `PATCH` | `/api/v1/plots/{id}` | ✅ Synced | Hỗ trợ `isClearDescription`, `isClearGeometry` |
| Xóa lô đất | `DELETE` | `/api/v1/plots/{id}` | ✅ Synced | |

---

## 7. Payment API (Thanh toán)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Tạo link thanh toán | `POST` | `/api/v1/payment/create` | ✅ Synced | Redirect sang SePay. **Yêu cầu Farm Token** |
| IPN Callback | `POST` | `/api/v1/payment/ipn` | ✅ Synced | Server-to-server |

---

## 8. Crop API (Cây trồng)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách cây trồng | `GET` | `/api/v1/crops` | ✅ Synced | SYSTEM scope |
| Tạo cây trồng | `POST` | `/api/v1/crops` | ✅ Synced | ADMIN |
| Danh sách loại cây | `GET` | `/api/v1/crop-types` | ✅ Synced | |
| Tạo loại cây | `POST` | `/api/v1/crop-type` | ✅ Synced | ADMIN |
| Xóa loại cây | `DELETE` | `/api/v1/crop-type/{id}` | ✅ Synced | ADMIN |

---

## 9. Subscription API (Gói đăng ký)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách gói | `GET` | `/api/v1/subscriptions` | ✅ Synced | |
| Lịch sử đăng ký | `GET` | `/api/v1/subscriptions/history` | ✅ Synced | |
| Gói hiện tại | `GET` | `/api/v1/subscriptions/current` | ✅ Synced | |

---

## 10. Member API (Quản lý Thành viên & Lời mời)
| Chức năng | Phương pháp | Endpoint | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| Danh sách thành viên | `GET` | `/api/v1/farms/{id}/members` | ✅ Synced | Trả về thông tin & vai trò |
| Xóa thành viên | `DELETE` | `/api/v1/farms/{id}/members/{uid}` | ✅ Synced | |
| Gửi lời mời | `POST` | `/api/v1/farms/{id}/members` | ✅ Synced | `email`, `roleId` |
| Danh sách lời mời | `GET` | `/api/v1/farms/{id}/invitations` | ✅ Synced | |
| Hủy lời mời | `PATCH` | `/api/v1/farms/{id}/invitations/{iid}/cancel` | ✅ Synced | |

---

**Cập nhật lần cuối:** 2026-04-20
**Tiêu chuẩn:** Khớp 100% với Backend Swagger Documentation.
**Người phụ trách:** Antigravity (AI Assistant)
