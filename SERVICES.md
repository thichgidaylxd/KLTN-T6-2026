# API Services Documentation

> Cập nhật: 2026-05-08

---

## 📁 Farm API

**File:** `src/services/farm/farmService.ts`

### Endpoints

#### 1. GET `/api/v1/farms`

**Mô tả:** Lấy danh sách toàn bộ farm mà user sở hữu.

**Params:** Không

**Response:** `ApiResponse<Farm[]>`

**Service:**
```typescript
farmService.getMyFarms(): Promise<ApiResponse<Farm[]>>
```

**Hook:** `useFarms.farmsQuery`

---

#### 2. POST `/api/v1/farms`

**Mô tả:** Tạo farm mới cho user hiện tại.

**Request Body:** `CreateFarmRequest`
```json
{
  "farmName": "string",
  "description": "string"
}
```

**Response:** `ApiResponse<Farm>`

**Service:**
```typescript
farmService.createFarm(data: CreateFarmRequest): Promise<ApiResponse<Farm>>
```

**Hook:** `useFarms.createFarmMutation`

**Component:** `CreateFarmModal`

---

#### 3. POST `/api/v1/farms/{farmId}/select`

**Mô tả:** Chọn farm để làm việc. Server trả về farm token (JWT scoped to farm).

**Flow:**
1. User login → nhận Hub Token
2. Gọi API này với `farmId`
3. Server trả về `{ farmToken: "jwt..." }`
4. Client lưu `currentFarmId` và đặt `accessToken = farmToken`
5. Các API sau dùng farm token qua Axios interceptor

**Params:** `farmId` (path, UUID)

**Response:** `ApiResponse<{ farmToken: string }>`

**Service:**
```typescript
farmService.selectFarm(farmId: string): Promise<ApiResponse<SelectFarmResponseData>>
```

**Used in:**
- `ManagementDashboardPage.handleSelectFarm()`
- `useFarms.updateFarmMutation()` (internal — lấy farm token trước khi PATCH)

---

#### 4. GET `/api/v1/farms/{farmId}`

**Mô tả:** Lấy chi tiết một farm (user phải là member).

**Params:** `farmId` (path, UUID)

**Response:** `ApiResponse<Farm>`

**Service:**
```typescript
farmService.getFarmDetail(id: string): Promise<ApiResponse<Farm>>
```

---

#### 5. DELETE `/api/v1/farms/{farmId}`

**Mô tả:** Xóa farm (chỉ owner mới được).

**Params:** `farmId` (path, UUID)

**Response:** `ApiResponse<string>` (data là message string)

**Service:**
```typescript
farmService.deleteFarm(farmId: string): Promise<ApiResponse<string>>
```

**Hook:** `useFarms.deleteFarmMutation`

**Component:** `FarmActionsPage` (Delete modal)

---

#### 6. PATCH `/api/v1/farms/{farmId}`

**Mô tả:** Cập nhật thông tin farm (chỉ owner). **Gửi `version` để optimistic locking.**

**Request Body:** `UpdateFarmRequest`
```json
{
  "name": "string",
  "description": "string",
  "version": 0  // optional
}
```

**Response:** `ApiResponse<Farm>`

**Service:**
```typescript
farmService.updateFarm(
  farmId: string,
  data: UpdateFarmRequest,
  config?: AxiosRequestConfig
): Promise<ApiResponse<Farm>>
```

**Note:** Tham số `config` dùng để truyền custom headers (ví dụ: Authorization với farm token).

**Hook:** `useFarms.updateFarmMutation()` — **tự động**:
1. Gọi `selectFarm(farmId)` để lấy farm token
2. Truyền `Authorization: Bearer <farmToken>` qua `config`

**Component:** `EditFarmModal` — gửi `version` nếu có.

---

#### 7. GET `/api/v1/farms/summary`

**Mô tả:** Lấy danh sách farm dạng summary (ít field, dùng cho dashboard).

**Params:** Không

**Response:** `ApiResponse<FarmSummary[]>`

**Service:**
```typescript
farmService.getFarmSummary(): Promise<ApiResponse<FarmSummary[]>>
```

**Hook:** `useFarms.farmSummaryQuery`

**Component:** `ManagementDashboardPage` (farm cards)

---

### Types (Farm)

```typescript
// Full farm entity
interface Farm {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;        // ISO8601
  updatedAt: string | null; // null nếu chưa bao giờ update
}

// Farm summary (dashboard)
interface FarmSummary {
  farmId: string;
  farmName: string;
  description: string;
  ownerId: string;
  ownerFullName: string;
  ownerAvatarUrl: string;
  myRole: string;   // "owner" | "manager" | "employee" | "admin" | "worker" | "user"
  owner: boolean;   // true nếu user là owner
}

// Requests
interface CreateFarmRequest {
  farmName: string;
  description: string;
}

interface UpdateFarmRequest {
  name: string;
  description: string;
  version?: number; // optional — optimistic locking
}

// Select farm response
interface SelectFarmResponseData {
  farmToken: string;
}
```

---

## 📁 Plan Stage Status API

**File:** `src/services/seasonPlan/seasonPlanService.ts`

### Endpoints

#### 1. PUT `/api/v1/plans/{planId}/stages/{stageId}/status/{statusId}`

**Mô tả:** Cập nhật trạng thái của một giai đoạn kế hoạch. Tạo record `PlanStageStatusHistory`.

**Params:**
- `planId` (path, UUID)
- `stageId` (path, UUID)
- `statusId` (path, UUID) — trạng thái đích

**Response:** `ApiResponse<PlanStageStatusHistory>`

**Service:**
```typescript
seasonPlanService.updateStageStatus(
  planId: string,
  stageId: string,
  statusId: string
): Promise<PlanStageStatusHistory>
```

**Hook:** `usePlanStageStatus.updateStageStatus(planId, stageId, statusId)`

**Cache Invalidation:**
- Invalidate `status-histories` query cho stage đó
- Invalidate `available-statuses` query cho stage đó

---

#### 2. GET `/api/v1/plans/{planId}/stages/{stageId}/status-histories`

**Mô tả:** Lấy toàn bộ lịch sử thay đổi trạng thái của một giai đoạn.

**Params:** `planId`, `stageId` (path, UUID)

**Response:** `ApiResponse<PlanStageStatusHistory[]>`

**Service:**
```typescript
seasonPlanService.getStageStatusHistories(
  planId: string,
  stageId: string
): Promise<PlanStageStatusHistory[]>
```

**Hook:** `usePlanStageStatus.getStageStatusHistories(planId, stageId)`

---

#### 3. GET `/api/v1/plans/{planId}/stages/{stageId}/available-statuses`

**Mô tả:** Lấy danh sách các trạng thái tiếp theo hợp lệ (theo business rules + user role).

**Params:** `planId`, `stageId` (path, UUID)

**Response:** `ApiResponse<StatusObject[]>`

**Service:**
```typescript
seasonPlanService.getAvailableStatuses(
  planId: string,
  stageId: string
): Promise<StatusObject[]>
```

**Hook:** `usePlanStageStatus.getAvailableStatuses(planId, stageId)`

---

#### 4. GET `/api/v1/plan-stage-statuses`

**Mô tả:** Lấy danh sách master tất cả trạng thái giai đoạn.

**Params:** Không

**Response:** `ApiResponse<StatusObject[]>`

**Service:**
```typescript
seasonPlanService.getAllPlanStageStatuses(): Promise<StatusObject[]>
```

**Hook:** `usePlanStageStatus.allPlanStageStatusesQuery` (cached, staleTime 10 phút)

---

#### 5. GET `/api/v1/plan-stage-status-transitions`

**Mô tả:** Lấy các transition trạng thái hợp lệ, lọc theo farm hiện tại (từ farm token). Mỗi transition có `farmRole` filter.

**Params:** Không

**Response:** `ApiResponse<PlanStageStatusTransition[]>`

**Service:**
```typescript
seasonPlanService.getPlanStageStatusTransitions(): Promise<PlanStageStatusTransition[]>
```

**Hook:** `usePlanStageStatus.transitionsQuery` (cached, staleTime 10 phút)

---

### Types (Plan Stage Status)

```typescript
// Base status object
interface StatusObject {
  id: string;
  code: string;
  name: string;
  color: string;
  isInitial?: boolean;   // optional
  isTerminal?: boolean;  // optional
}

// User info trong status history
interface UserObject {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;       // e.g., "PENDING", "ACTIVE"
  isLocked: boolean;
  createdAt: string;    // ISO8601
}

// Farm role filter
interface FarmRoleObject {
  id: string;
  name: string;
  description?: string;
}

// Plan Stage Status History (PUT response)
interface PlanStageStatusHistory {
  fromStatus: StatusObject;
  toStatus: StatusObject;
  changedBy: UserObject;
  changedAt: string;    // ISO8601
}

// Transition rule
interface PlanStageStatusTransition {
  id: string;
  fromStatus: StatusObject;
  toStatus: StatusObject;
  farmRole: FarmRoleObject;
  createdAt: string;    // ISO8601
}
```

---

## 📁 Warehouse Transaction API

**File:** `src/services/warehouseTransaction/warehouseTransactionService.ts`

### Endpoints

#### 1. GET `/api/v1/items/{warehouseItemId}/transactions`

**Mô tả:** Lấy danh sách giao dịch của một vật tư (warehouse item) trong kho, có phân trang.

**Params:**
- `warehouseItemId` (path, UUID)
- `pageable` (query): `{ page, size, sort[] }`

**Response:** `ApiResponse<PagedData<WarehouseTransaction>>`

**Service:**
```typescript
warehouseTransactionService.getTransactionsByItem(
  warehouseItemId: string,
  pageable: PageableParams
): Promise<PagedData<WarehouseTransaction>>
```

**Return structure:**
```typescript
{
  content: WarehouseTransaction[];  // Array of transactions
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
```

---

#### 2. GET `/api/v1/farms/{farmId}/warehouses/{warehouseId}/transactions`

**Mô tả:** Lấy danh sách giao dịch của một Warehouse cụ thể trong Farm.

**Params:**
- `farmId` (path, UUID)
- `warehouseId` (path, UUID)
- `pageable` (query): `{ page, size, sort[] }`

**Response:** `ApiResponse<PagedData<WarehouseTransaction>>`

**Service:**
```typescript
warehouseTransactionService.getTransactionsByWarehouse(
  farmId: string,
  warehouseId: string,
  pageable: PageableParams
): Promise<PagedData<WarehouseTransaction>>
```

---

#### 3. GET `/api/v1/farms/{farmId}/transactions`

**Mô tả:** Lấy danh sách giao dịch của toàn bộ Farm (cross-warehouse).

**Params:**
- `farmId` (path, UUID)
- `pageable` (query): `{ page, size, sort[] }`

**Response:** `ApiResponse<PagedData<WarehouseTransaction>>`

**Service:**
```typescript
warehouseTransactionService.getTransactionsByFarm(
  farmId: string,
  pageable: PageableParams
): Promise<PagedData<WarehouseTransaction>>
```

---

### Types (Warehouse Transaction)

```typescript
// Transaction type enum
export type TransactionType =
  | 'IMPORT_MANUAL'
  | 'EXPORT_MANUAL'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUST_INCREASE'
  | 'ADJUST_DECREASE'
  | 'HARVEST_IN'
  | 'WORKLOG_OUT';

// Warehouse item within transaction
export interface TransactionWarehouseItem {
  id: string;
  name: string;
  sku: {
    sku: string;
    description: string;
    createdAt: string;
  };
  unit: {
    id: string;
    code: string;
    name: string;
  };
}

// Location (from/to)
export interface TransactionLocation {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

// Performed by user
export interface TransactionPerformedBy {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  isLocked: boolean;
  createdAt: string;
}

// Full transaction record
export interface WarehouseTransaction {
  id: string;
  warehouseItem: TransactionWarehouseItem;
  fromLocation: TransactionLocation;
  toLocation: TransactionLocation;
  type: TransactionType;
  qtyChange: number;
  refTransferId: string | null;   // Reference to transfer (if type is TRANSFER_*)
  refWorkLogId: string | null;   // Reference to work log (if from work log)
  refTaskId: string | null;      // Reference to task (if from task)
  refHavestId: string | null;    // Reference to harvest (if from harvest)
  performedBy: TransactionPerformedBy;
  notes: string;
  createdAt: string;             // ISO8601
}
```

### Pagination

**Request params (`PageableParams`):**
```typescript
{
  page?: number;    // default 0
  size?: number;    // default 20
  sort?: string[];  // default ['createdAt,desc']
}
```

**Response (`PagedData<T>`):**
```typescript
{
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
```

### Notes

- **Transaction normalization:** Service tự động normalize `type` field (ví dụ: `'IMPORT_WAREHOUSE_ITEM_MANUAL'` → `'IMPORT_MANUAL'`).
- **Farm token required:** Các endpoint này cần farm token trong Authorization header (Axios interceptor tự động gửi).
- **Filtering:** Không có filter nâng cao — client gửi `pageable` với `sort` (ví dụ: `['createdAt,desc']`).
- **References:** Các `refXXXId` có thể `null` nếu giao dịch không liên quan đến transfer/worklog/task/harvest.

---

## 🗂️ File Locations (Summary)

```
src/
├── services/
│   ├── farm/
│   │   └── farmService.ts                     # 7 Farm endpoints
│   └── seasonPlan/
│       └── seasonPlanService.ts               # 5 Plan Stage Status endpoints
│   └── warehouseTransaction/
│       └── warehouseTransactionService.ts     # 3 Warehouse Transaction endpoints
├── types/
│   ├── farm/
│   │   └── farm.ts                            # Farm types
│   ├── seasonPlan/
│   │   └── seasonPlan.ts                      # Plan Stage Status types
│   └── warehouseTransaction/
│       └── warehouseTransaction.ts            # Warehouse Transaction types
├── schemas/
│   ├── farmSchemas.ts
│   ├── seasonPlanSchemas.ts
│   └── warehouseTransactionSchemas.ts         # (Future) Zod validation
├── hooks/
│   ├── farms/
│   │   └── useFarms.ts
│   └── seasonPlans/
│       └── usePlanStageStatus.ts
│   └── warehouseTransactions/
│       └── useWarehouseTransactions.ts        # (Future) Hook cho transactions
└── components/
    └── farm/
        ├── DashboardHeader.tsx
        ├── CreateFarmModal.tsx
        └── EditFarmModal.tsx
```

---

**Done.** Tổng cộng **15 endpoints** đã implement:
- Farm API: 7 endpoints
- Plan Stage Status API: 5 endpoints
- Warehouse Transaction API: 3 endpoints
