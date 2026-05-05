# API REPORT - DANH SÁCH TẤT CẢ API TRONG DỰ ÁN

Tổng cộng có **99** API đã được tìm thấy trong thư mục `src/services/`.

## 1. Auth Service (`src/services/auth/authService.ts`)
1. `POST /api/v1/auth/register` - Đăng ký tài khoản
2. `POST /api/v1/auth/login` - Đăng nhập
3. `POST /api/v1/auth/verify` - Xác thực OTP/Email
4. `POST /api/v1/auth/register/resend-mail` - Gửi lại email xác thực
5. `POST /api/v1/auth/refresh` - Làm mới token

## 2. Farm Service (`src/services/farm/farmService.ts`)
6. `POST /api/v1/farms` - Tạo trang trại mới
7. `GET /api/v1/farms` - Lấy danh sách trang trại của tôi
8. `GET /api/v1/farms/summary` - Lấy thông tin tổng quan trang trại
9. `GET /api/v1/farms/{id}` - Lấy chi tiết trang trại
10. `POST /api/v1/farms/{farmId}/select` - Chọn trang trại đang làm việc
11. `PATCH /api/v1/farms/{farmId}` - Cập nhật thông tin trang trại
12. `DELETE /api/v1/farms/{farmId}` - Xóa trang trại

## 3. Member Service (`src/services/members/memberService.ts`)
13. `GET /api/v1/farms/{farmId}/members` - Lấy danh sách thành viên
14. `POST /api/v1/farms/{farmId}/members` - Mời thành viên mới
15. `PATCH /api/v1/farms/{farmId}/invitations/{invitationId}/cancel` - Hủy lời mời
16. `DELETE /api/v1/farms/{farmId}/members/{memberId}` - Xóa thành viên
17. `GET /api/v1/farms/{farmId}/invitations` - Lấy danh sách lời mời của trang trại
18. `GET /api/v1/farms/{farmId}/invitations/{invitationId}` - Lấy chi tiết lời mời
19. `GET /api/v1/farms/roles` - Lấy danh sách các vai trò trong trang trại
20. `GET /api/v1/invitations/{invitationId}/preview` - Xem trước lời mời
21. `POST /api/v1/invitations/{invitationId}/accept` - Chấp nhận lời mời
22. `GET /api/v1/invitations/me` - Lấy danh sách lời mời của tôi

## 4. Plot Service (`src/services/plots/plotService.ts`)
23. `GET /api/v1/plots` - Lấy danh sách lô đất
24. `POST /api/v1/plots` - Tạo lô đất mới
25. `PATCH /api/v1/plots/{plotId}` - Cập nhật lô đất
26. `DELETE /api/v1/plots/{plotId}` - Xóa lô đất

## 5. Warehouse Service (`src/services/warehouse/warehouseService.ts`)
27. `GET /api/v1/farms/{farmId}/warehouses` - Lấy danh sách kho hàng
28. `POST /api/v1/farms/{farmId}/warehouses` - Tạo kho hàng mới
29. `PATCH /api/v1/farms/{farmId}/warehouses/{warehouseId}` - Cập nhật kho hàng
30. `DELETE /api/v1/farms/{farmId}/warehouses/{warehouseId}` - Xóa kho hàng
31. `GET /api/v1/farms/{farmId}/warehouses/{warehouseId}/locations` - Lấy danh sách vị trí trong kho
32. `POST /api/v1/farms/{farmId}/warehouses/{warehouseId}/locations` - Tạo vị trí trong kho
33. `GET /api/v1/farms/{farmId}/warehouses/{warehouseId}/locations/{locationId}` - Lấy chi tiết vị trí

## 6. Warehouse Item Service (`src/services/warehouseItem/warehouseItemService.ts`)
34. `GET /api/v1/farms/{farmId}/warehouses/{warehouseId}/items` - Lấy vật tư trong kho cụ thể
35. `GET /api/v1/farms/{farmId}/warehouses/items` - Lấy tất cả vật tư của trang trại
36. `POST /api/v1/farms/{farmId}/warehouses/{warehouseId}/items` - Thêm vật tư vào kho
37. `PATCH /api/v1/farms/{farmId}/warehouses/{warehouseId}/items/{warehouseItemId}` - Cập nhật vật tư
38. `DELETE /api/v1/farms/{farmId}/warehouses/{warehouseId}/items/{warehouseItemId}` - Xóa vật tư khỏi kho
39. `DELETE /api/v1/farms/{farmId}/items/{warehouseItemId}` - Xóa vật tư khỏi trang trại

## 7. Season Plan Service (`src/services/seasonplan/seasonPlanService.ts`)
40. `GET /api/v1/plans` - Lấy danh sách kế hoạch mùa vụ
41. `GET /api/v1/plans/{planId}` - Lấy chi tiết kế hoạch
42. `POST /api/v1/plans` - Tạo kế hoạch mới
43. `GET /api/v1/plans/{planId}/plots` - Lấy danh sách lô đất trong kế hoạch
44. `POST /api/v1/plans/{planId}/plots` - Thêm lô đất vào kế hoạch
45. `PUT /api/v1/plans/{planId}/time` - Cập nhật thời gian kế hoạch
46. `DELETE /api/v1/plans/{planId}` - Xóa kế hoạch

## 8. Season Plan Phase Service (`src/services/seasonplan/seasonPlanPhaseService.ts`)
47. `GET /api/v1/plans/{planId}/stages` - Lấy danh sách giai đoạn
48. `GET /api/v1/plans/{planId}/stages/{stageId}` - Lấy chi tiết giai đoạn
49. `POST /api/v1/plans/{planId}/stages` - Tạo giai đoạn mới
50. `PATCH /api/v1/plans/{planId}/stages/{stageId}` - Cập nhật giai đoạn
51. `PUT /api/v1/plans/{planId}/stages/{stageId}/time` - Cập nhật thời gian giai đoạn
52. `DELETE /api/v1/plans/{planId}/stages/{stageId}` - Xóa giai đoạn

## 9. Season Plan Task Service (`src/services/seasonplan/seasonPlanTaskService.ts`)
53. `GET /api/v1/tasks/{taskId}/dependencies` - Lấy danh sách phụ thuộc của công việc
54. `DELETE /api/v1/tasks/{taskId}/dependencies/{dependsOnTaskId}` - Xóa phụ thuộc
55. `GET /api/v1/plans/{planId}/stages/{stageId}/tasks` - Lấy danh sách công việc trong giai đoạn
56. `GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}` - Lấy chi tiết công việc
57. `POST /api/v1/plans/{planId}/stages/{stageId}/tasks` - Tạo công việc mới
58. `PATCH /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}` - Cập nhật công việc
59. `PUT /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/time` - Cập nhật thời gian công việc
60. `DELETE /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}` - Xóa công việc
61. `POST /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/dependencies` - Thêm phụ thuộc cho công việc

## 10. Task Status Service (`src/services/seasonplan/taskStatusService.ts`)
62. `PUT /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/status/{statusId}` - Cập nhật trạng thái công việc
63. `GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/status-histories` - Lấy lịch sử trạng thái công việc
64. `GET /api/v1/task-statuses` - Lấy danh mục các trạng thái công việc
65. `GET /api/v1/task-status-transitions` - Lấy danh mục các bước chuyển trạng thái
66. `GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/available-statuses` - Lấy các trạng thái có thể chuyển đổi

## 11. Task Material Service (`src/services/seasonplan/taskMaterialService.ts`)
67. `GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials` - Lấy danh sách vật tư của công việc
68. `POST /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials` - Thêm vật tư cho công việc
69. `DELETE /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials/{materialId}` - Xóa vật tư khỏi công việc

## 12. Task Assignee Service (`src/services/taskAssignee/taskAssigneeService.ts`)
70. `GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/assignees` - Lấy danh sách người thực hiện
71. `POST /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/assignees` - Giao việc cho thành viên
72. `DELETE /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/assignees/{assigneeId}` - Hủy giao việc

## 13. Supplier Service (`src/services/supplier/supplierService.ts`)
73. `GET /api/v1/farms/{farmId}/suppliers` - Lấy danh sách nhà cung cấp
74. `POST /api/v1/farms/{farmId}/suppliers` - Tạo nhà cung cấp mới
75. `DELETE /api/v1/farms/{farmId}/suppliers/{supplierId}` - Xóa nhà cung cấp

## 14. SKU Service (`src/services/sku/skuService.ts`)
76. `GET /api/v1/farms/{farmId}/skus` - Lấy danh sách mã SKU
77. `POST /api/v1/farms/{farmId}/skus` - Tạo mã SKU mới
78. `DELETE /api/v1/farms/{farmId}/skus/{sku}` - Xóa mã SKU

## 15. Unit Service (`src/services/unit/unitService.ts`)
79. `GET /api/v1/units` - Lấy danh sách đơn vị tính

## 16. Subscription Service (`src/services/subscription/getSubscriptionPlanService.ts`)
80. `GET /api/v1/subscriptions` - Lấy danh sách gói đăng ký
81. `GET /api/v1/subscriptions/history` - Lấy lịch sử đăng ký
82. `GET /api/v1/subscriptions/current` - Lấy thông tin gói hiện tại

## 17. Payment Service (`src/services/payment/`)
83. `POST /api/v1/payment/create` - Tạo giao dịch thanh toán
84. `POST /api/v1/payment/ipn` - Xử lý thông báo thanh toán (IPN)
85. `GET /api/v1/payments/result` - Lấy kết quả thanh toán

## 18. Crop Service (`src/services/crop/cropService.ts`)
86. `GET /api/v1/crop-types` - Lấy danh sách loại cây trồng
87. `POST /api/v1/crop-type` - Tạo loại cây trồng mới
88. `DELETE /api/v1/crop-type/{cropTypeId}` - Xóa loại cây trồng
89. `POST /api/v1/crops` - Tạo cây trồng hệ thống
90. `GET /api/v1/crops` - Lấy danh sách cây trồng hệ thống
91. `GET /api/v1/crops/{cropId}` - Lấy chi tiết cây trồng hệ thống
92. `GET /api/v1/farms/{farmId}/crops` - Lấy danh sách cây trồng của trang trại
93. `GET /api/v1/farms/{farmId}/crops/{cropId}` - Lấy chi tiết cây trồng của trang trại
94. `GET /api/v1/crop-types/{cropTypeId}` - Lấy chi tiết loại cây trồng

## 19. Plan Stage Status Service (`src/services/seasonplan/planStageStatusService.ts`)
95. `PUT /api/v1/plans/{planId}/stages/{stageId}/status/{statusId}` - Cập nhật trạng thái giai đoạn
96. `GET /api/v1/plans/{planId}/stages/{stageId}/status-histories` - Lấy lịch sử trạng thái giai đoạn
97. `GET /api/v1/plan-stage-statuses` - Lấy danh mục trạng thái giai đoạn
98. `GET /api/v1/plan-stage-status-transitions` - Lấy danh mục bước chuyển giai đoạn

## 20. Weather Service (`src/services/weather/weatherService.ts`)
99. `GET https://api.openweathermap.org/data/2.5/weather` - Lấy thông tin thời tiết (External API)
