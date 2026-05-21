# Harvest API Usage Prompt

Bạn đang làm việc với một hệ thống quản lý nông trại (Farming Management System) và cần tích hợp các tính năng liên quan đến Thu hoạch (Harvest).

## Tài Nguyên Có Sẵn

### 1. Types & Interfaces
- **Location:** `src/types/harvest/harvest.ts`
- Các types chính:
  - `HarvestResponse` - Chi tiết thông tin một lần thu hoạch
  - `CreateHarvestRequest` - Dữ liệu tạo mới thu hoạch
  - `UpdateHarvestRequest` - Dữ liệu cập nhật thu hoạch
  - `HarvestSummaryResponse` - Tóm tắt thông tin thu hoạch
  - `SeasonComparisonResponse` - So sánh dữ liệu giữa các mùa vụ
  - `SeasonSummaryResponse` - Tóm tắt thông tin mùa vụ
  - `MaterialCostDetail` - Chi tiết chi phí vật tư
  - `LaborCostDetail` - Chi tiết chi phí nhân công

### 2. Services
- **Location:** `src/services/harvest/harvestService.ts`
- **Các Method:**
  - `getHarvestDetail(farmId, planId, harvestId)` - Lấy chi tiết một lần thu hoạch
  - `updateHarvest(farmId, planId, harvestId, request)` - Cập nhật thu hoạch
  - `createHarvest(farmId, planId, request)` - Tạo mới thu hoạch
  - `getHarvests(planId, filter?, pageable?)` - Lấy danh sách thu hoạch
  - `getHarvestsByStage(planId, stageId, pageable?)` - Thu hoạch theo giai đoạn
  - `getHarvestSummaryByStage(planId, stageId)` - Tóm tắt thu hoạch theo giai đoạn
  - `getHarvestsByPlot(planId, plotId, pageable?)` - Thu hoạch theo lô đất
  - `getHarvestSummaryByPlot(planId, plotId)` - Tóm tắt thu hoạch theo lô đất
  - `getHarvestSummary(planId)` - Tóm tắt toàn bộ thu hoạch của kế hoạch
  - `getHarvestsByFarm(farmId, fromDate?, toDate?, pageable?)` - Thu hoạch của trang trại
  - `compareSeasons(farmId, planIds)` - So sánh dữ liệu giữa các mùa vụ
  - `getSeasonSummary(planId)` - Tóm tắt chi tiết mùa vụ
  - `getMaterialCost(planId)` - Chi phí vật tư
  - `getLaborCost(planId)` - Chi phí nhân công

### 3. React Query Hooks
- **Location:** `src/hooks/harvest/useHarvest.ts`
- **Các Hooks:**
  - `useHarvestDetail(farmId, planId, harvestId)` - Query chi tiết thu hoạch
  - `useHarvestsByPlan(planId, page, size, sort)` - Query + mutations tạo/cập nhật
    - Returns: `harvests`, `createHarvest()`, `updateHarvest()`, `loading`, `error`, `refetch`
  - `useHarvestSummary(planId)` - Query tóm tắt thu hoạch
  - `useSeasonSummary(planId)` - Query tóm tắt mùa vụ
  - `useCompareSeasons()` - Mutation so sánh mùa vụ
  - `useHarvestsByFarm(farmId, fromDate?, toDate?, page, size)` - Query thu hoạch farm
  - `useHarvestsByStage(planId, stageId, page, size)` - Query thu hoạch stage
  - `useHarvestSummaryByStage(planId, stageId)` - Query tóm tắt stage
  - `useHarvestsByPlot(planId, plotId, page, size)` - Query thu hoạch plot
  - `useHarvestSummaryByPlot(planId, plotId)` - Query tóm tắt plot

## Yêu Cầu

Hãy:
1. **Tạo UI Component** để hiển thị/quản lý thu hoạch theo yêu cầu
2. **Sử dụng Hooks** từ `useHarvest.ts` để lấy dữ liệu và thực hiện mutations
3. **Follow cấu trúc hiện tại** của project (components, hooks, services)
4. **Xử lý loading, error states** thích hợp
5. **Format dữ liệu** theo UI requirements
6. **Implement TypeScript** đầy đủ với proper types
7. **Sử dụng Tailwind CSS** để styling components

## Ghi Chú Quan Trọng

- **farmId placeholder:** Một số API endpoint chứa "placeholder" cho farmId, cần thay thế bằng farmId thực tế khi gọi
- **Query keys:** Sử dụng `HARVEST_KEYS` từ `useHarvest.ts` để quản lý cache
- **Error handling:** Implement proper error boundaries và toast notifications
- **Pagination:** Hỗ trợ phân trang với page, size, sort parameters
- **Filtering:** `getHarvests()` hỗ trợ filter theo planStageId, plotId, dateRange, qualityGrade, earlyHarvest, partial

## Ví Dụ Sử Dụng Cơ Bản

```typescript
import { useHarvestsByPlan } from '@/hooks/harvest';

export const HarvestList = ({ planId }: { planId: string }) => {
  const { harvests, loading, error, createHarvest } = useHarvestsByPlan(planId);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error.message}</div>;

  return (
    <div>
      {harvests.map(harvest => (
        <div key={harvest.id}>
          <p>{harvest.plotName} - {harvest.quantity} {harvest.unitCode}</p>
          <p>Ngày thu hoạch: {new Date(harvest.harvestDate).toLocaleDateString('vi-VN')}</p>
        </div>
      ))}
    </div>
  );
};
```

## Yêu Cầu Của Tôi

[HÃY ĐIỀN CHI TIẾT YÊU CẦU CỦA BẠN TẠI ĐÂY]
- Chức năng cần triển khai
- UI/UX requirements
- Các tính năng đặc biệt cần có
- Dữ liệu cần hiển thị
- Interactivity requirements
