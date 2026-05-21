# Harvest Pages Implementation Guide

Toàn bộ API Harvest đã được triển khai vào trang Harvest. Dưới đây là hướng dẫn chi tiết về cách sử dụng:

## 📁 Cấu trúc Thư mục

```
src/
├── pages/
│   └── Harvest/
│       ├── SeasonSummaryPage.tsx      # Tóm tắt mùa vụ
│       ├── HarvestListPage.tsx        # Danh sách thu hoạch
│       ├── SeasonComparisonPage.tsx   # So sánh mùa vụ
│       ├── HarvestByStagePage.tsx     # Thu hoạch theo giai đoạn
│       ├── HarvestByPlotPage.tsx      # Thu hoạch theo lô đất
│       ├── HarvestDashboard.tsx       # Dashboard chính
│       └── index.ts                   # Export tất cả pages
├── services/
│   └── harvest/
│       ├── harvestService.ts          # API calls
│       └── index.ts
├── hooks/
│   └── harvest/
│       ├── useHarvest.ts              # React Query hooks
│       └── index.ts
└── types/
    └── harvest/
        ├── harvest.ts                 # Type definitions
        └── index.ts
```

## 🎯 Các Pages Chính

### 1. **SeasonSummaryPage** - Tóm tắt Mùa vụ
Hiển thị thông tin tổng quát về một mùa vụ bao gồm:
- Tổng sản lượng thu hoạch
- Tổng doanh thu
- Tổng chi phí (vật tư + nhân công)
- Lợi nhuận ròng
- Chi tiết chi phí vật tư
- Chi tiết chi phí nhân công
- Thông tin kế hoạch và thu hoạch

**Props:**
```typescript
interface SeasonSummaryPageProps {
  planId: string; // ID của kế hoạch
}
```

**Cách sử dụng:**
```tsx
<SeasonSummaryPage planId="plan-id-here" />
```

### 2. **HarvestListPage** - Danh sách Thu hoạch
Hiển thị bảng danh sách tất cả lần thu hoạch trong kế hoạch với:
- Lô đất
- Ngày thu hoạch
- Số lượng
- Giá/Đơn vị
- Doanh thu
- Chất lượng
- Phân trang

**Props:**
```typescript
interface HarvestListPageProps {
  planId: string;      // ID của kế hoạch
  farmId: string;      // ID của trang trại
}
```

**Cách sử dụng:**
```tsx
<HarvestListPage planId="plan-id" farmId="farm-id" />
```

### 3. **SeasonComparisonPage** - So sánh Mùa vụ
So sánh dữ liệu giữa nhiều mùa vụ bao gồm:
- Doanh thu, chi phí, lợi nhuận
- Tỷ lệ lợi nhuận (Margin %)
- Tổng sản lượng
- Bảng so sánh chi tiết

**Props:**
```typescript
interface SeasonComparisonPageProps {
  farmId: string;              // ID của trang trại
  selectedPlanIds: string[];   // Danh sách ID kế hoạch để so sánh
}
```

**Cách sử dụng:**
```tsx
<SeasonComparisonPage 
  farmId="farm-id" 
  selectedPlanIds={["plan-1", "plan-2", "plan-3"]} 
/>
```

### 4. **HarvestByStagePage** - Thu hoạch theo Giai đoạn
Hiển thị danh sách thu hoạch của một giai đoạn cụ thể:
- Tóm tắt: Tổng lô, sản lượng, doanh thu
- Bảng danh sách chi tiết

**Props:**
```typescript
interface HarvestByStagePageProps {
  planId: string;    // ID của kế hoạch
  stageId: string;   // ID của giai đoạn
  stageName: string; // Tên giai đoạn (hiển thị)
}
```

**Cách sử dụng:**
```tsx
<HarvestByStagePage 
  planId="plan-id" 
  stageId="stage-id" 
  stageName="Giai đoạn 1" 
/>
```

### 5. **HarvestByPlotPage** - Thu hoạch theo Lô đất
Hiển thị danh sách thu hoạch của một lô đất cụ thể:
- Tóm tắt: Tổng lô, sản lượng, doanh thu
- Bảng danh sách chi tiết

**Props:**
```typescript
interface HarvestByPlotPageProps {
  planId: string;   // ID của kế hoạch
  plotId: string;   // ID của lô đất
  plotName: string; // Tên lô đất (hiển thị)
}
```

**Cách sử dụng:**
```tsx
<HarvestByPlotPage 
  planId="plan-id" 
  plotId="plot-id" 
  plotName="Lô A1" 
/>
```

### 6. **HarvestDashboard** - Dashboard Chính
Dashboard tổng hợp với các tab để điều hướng:
- Tóm tắt mùa vụ
- Danh sách thu hoạch
- So sánh mùa vụ
- Theo giai đoạn
- Theo lô đất

**Cách sử dụng:**
```tsx
<HarvestDashboard />
```

## 🪝 React Query Hooks

### Queries

```typescript
// Lấy chi tiết thu hoạch
const { data, isLoading, error } = useHarvestDetail(farmId, planId, harvestId);

// Lấy danh sách thu hoạch
const { harvests, pageData, loading, error } = useHarvestsByPlan(planId, page, size);

// Lấy tóm tắt thu hoạch
const { data: summary } = useHarvestSummary(planId);

// Lấy tóm tắt mùa vụ
const { data: seasonSummary } = useSeasonSummary(planId);

// Lấy thu hoạch theo giai đoạn
const { data: harvests } = useHarvestsByStage(planId, stageId);

// Lấy tóm tắt thu hoạch theo giai đoạn
const { data: summary } = useHarvestSummaryByStage(planId, stageId);

// Lấy thu hoạch theo lô đất
const { data: harvests } = useHarvestsByPlot(planId, plotId);

// Lấy tóm tắt thu hoạch theo lô đất
const { data: summary } = useHarvestSummaryByPlot(planId, plotId);

// Lấy thu hoạch của trang trại
const { data: harvests } = useHarvestsByFarm(farmId, fromDate, toDate);
```

### Mutations

```typescript
// So sánh mùa vụ
const compareSeasons = useCompareSeasons();
const result = await compareSeasons.mutateAsync({ 
  farmId, 
  planIds: ["plan-1", "plan-2"] 
});

// Từ useHarvestsByPlan
const { createHarvest, updateHarvest } = useHarvestsByPlan(planId);

// Tạo thu hoạch mới
await createHarvest({
  planId,
  planStageId,
  plotId,
  harvestDate: "2026-05-21",
  quantity: 100,
  unitId,
  qualityGradeId,
  unitPrice: 50000,
  harvestedBy: "user-id",
  earlyHarvest: false,
  partial: false
});

// Cập nhật thu hoạch
await updateHarvest(harvestId, {
  harvestDate: "2026-05-21",
  quantity: 120,
  qualityGradeId,
  unitPrice: 55000,
  harvestedBy: "user-id",
  earlyHarvest: false,
  partial: false
}, farmId);
```

## 📊 API Endpoints Được Sử Dụng

| Method | Endpoint | Hook |
|--------|----------|------|
| GET | `/api/v1/farms/{farmId}/plans/{planId}/harvests/{harvestId}` | `useHarvestDetail` |
| PUT | `/api/v1/farms/{farmId}/plans/{planId}/harvests/{harvestId}` | `useHarvestsByPlan` |
| POST | `/api/v1/farms/{farmId}/plans/{planId}/harvests` | `useHarvestsByPlan` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/harvests` | `useHarvestsByPlan` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/stages/{stageId}/harvests` | `useHarvestsByStage` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/stages/{stageId}/harvests/summary` | `useHarvestSummaryByStage` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/plots/{plotId}/harvests` | `useHarvestsByPlot` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/plots/{plotId}/harvests/summary` | `useHarvestSummaryByPlot` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/harvests/summary` | `useHarvestSummary` |
| GET | `/api/v1/farms/{farmId}/harvests` | `useHarvestsByFarm` |
| POST | `/api/v1/farms/{farmId}/reports/seasons/compare` | `useCompareSeasons` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/reports/season-summary` | `useSeasonSummary` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/reports/material-cost` | `harvestService.getMaterialCost` |
| GET | `/api/v1/farms/placeholder/plans/{planId}/reports/labor-cost` | `harvestService.getLaborCost` |

## 🔧 Cách Tích Hợp vào Routes

Thêm vào `src/routes/AppRoutes.tsx`:

```tsx
import { 
  HarvestDashboard,
  SeasonSummaryPage,
  HarvestListPage,
  SeasonComparisonPage,
  HarvestByStagePage,
  HarvestByPlotPage
} from '@/pages/Harvest';

// Trong routes array:
{
  path: '/harvest',
  element: <HarvestDashboard />,
  index: true
},
{
  path: '/harvest/season-summary/:planId',
  element: <SeasonSummaryPage />
},
{
  path: '/harvest/list/:planId',
  element: <HarvestListPage />
},
{
  path: '/harvest/comparison',
  element: <SeasonComparisonPage />
},
{
  path: '/harvest/by-stage/:planId/:stageId',
  element: <HarvestByStagePage />
},
{
  path: '/harvest/by-plot/:planId/:plotId',
  element: <HarvestByPlotPage />
}
```

## ✅ Đã Triển Khai

✅ SeasonSummaryPage - Tóm tắt mùa vụ với stats + chi tiết chi phí  
✅ HarvestListPage - Danh sách thu hoạch với phân trang  
✅ SeasonComparisonPage - So sánh mùa vụ  
✅ HarvestByStagePage - Thu hoạch theo giai đoạn  
✅ HarvestByPlotPage - Thu hoạch theo lô đất  
✅ HarvestDashboard - Dashboard chính  
✅ Tất cả hooks và services  
✅ TypeScript types  

## 📝 Chú ý

- Các endpoint chứa "placeholder" cần được thay thế bằng farmId thực tế
- Xử lý loading và error states đã có sẵn
- Phân trang được hỗ trợ đầy đủ
- Format tiền tệ sử dụng Vietnamese Dong (₫)

Bây giờ bạn có thể sử dụng toàn bộ tính năng Harvest! 🎉
