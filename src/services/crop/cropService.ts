import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import { 
  Crop, CropType, CreateCropRequest, CreateCropTypeRequest,
  CreateCropConditionRequest, CropConditionResponse,
  CreateCropStageRequest, CropStageResponse, UpdateCropStageRequest,
  CreateDiseaseRequest, DiseaseResponse, PageableResponse
} from '../../types/crop';

/**
 * Service Quản lý danh mục cây trồng (Admin - PB10)
 * Đồng bộ theo API Backend thực tế
 */
export const cropService = {

  // ──────────────────────────────────────────────
  // CROP TYPES
  // ──────────────────────────────────────────────

  /**
   * Lấy danh sách loại cây trồng
   * GET /api/v1/crop-types
   */
  async getCropTypes(): Promise<ApiResponse<CropType[]>> {
    const response = await axiosInstance.get<ApiResponse<CropType[]>>('/api/v1/crop-types');
    return response.data;
  },

  /**
   * Tạo loại cây trồng mới
   * POST /api/v1/crop-type
   * [ADMIN ONLY] - Yêu cầu quyền ROLE_ADMIN
   */
  async createCropType(data: CreateCropTypeRequest): Promise<ApiResponse<CropType>> {
    const response = await axiosInstance.post<ApiResponse<CropType>>('/api/v1/crop-type', data);
    return response.data;
  },

  /**
   * Xóa loại cây trồng
   * DELETE /api/v1/crop-type/{cropTypeId}
   * [ADMIN ONLY]
   */
  async deleteCropType(cropTypeId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(`/api/v1/crop-type/${cropTypeId}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // CROPS
  // ──────────────────────────────────────────────

  /**
   * Tạo cây trồng hệ thống mới (Scope SYSTEM)
   * POST /api/v1/crops
   * [ADMIN ONLY]
   * Hỗ trợ gửi dữ liệu JSON hoặc FormData (để upload ảnh trực tiếp)
   */
  async createCrop(data: CreateCropRequest | FormData): Promise<ApiResponse<Crop>> {
    const isFormData = data instanceof FormData;
    
    const response = await axiosInstance.post<ApiResponse<Crop>>('/api/v1/crops', data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });
    return response.data;
  },

  /**
   * Xóa cây trồng hệ thống
   * DELETE /api/v1/crops/{cropId}
   * [ADMIN ONLY]
   */
  async deleteCrop(cropId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(`/api/v1/crops/${cropId}`);
    return response.data;
  },

  /**
   * Lấy danh sách cây trồng hệ thống
   * GET /api/v1/crops (Scope SYSTEM)
   */
  async getCrops(): Promise<ApiResponse<Crop[]>> {
    const response = await axiosInstance.get<ApiResponse<Crop[]>>('/api/v1/crops');
    return response.data;
  },

  /**
   * Lấy chi tiết 1 cây trồng hệ thống
   * GET /api/v1/crops/{cropId}
   * [PUBLIC] — Yêu cầu quyền xem cây trồng
   */
  async getCropById(cropId: string): Promise<ApiResponse<Crop>> {
    const response = await axiosInstance.get<ApiResponse<Crop>>(`/api/v1/crops/${cropId}`);
    return response.data;
  },

  /**
   * Lấy chi tiết 1 loại cây trồng
   * GET /api/v1/crop-types/{cropTypeId}
   * [PUBLIC]
   */
  async getCropTypeById(cropTypeId: string): Promise<ApiResponse<CropType>> {
    const response = await axiosInstance.get<ApiResponse<CropType>>(`/api/v1/crop-types/${cropTypeId}`);
    return response.data;
  },

  /**
   * Lấy danh sách cây trồng của farm
   * GET /api/v1/farms/{farmId}/crops
   */
  async getFarmCrops(farmId: string): Promise<ApiResponse<Crop[]>> {
    const response = await axiosInstance.get<ApiResponse<Crop[]>>(`/api/v1/farms/${farmId}/crops`);
    return response.data;
  },

  /**
   * Lấy chi tiết 1 cây trồng của farm
   * GET /api/v1/farms/{farmId}/crops/{cropId}
   * [PUBLIC] — Yêu cầu quyền xem cây trồng trong farm
   */
  async getFarmCropById(farmId: string, cropId: string): Promise<ApiResponse<Crop>> {
    const response = await axiosInstance.get<ApiResponse<Crop>>(`/api/v1/farms/${farmId}/crops/${cropId}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // CROP CONDITIONS
  // ──────────────────────────────────────────────

  async getCropConditionByCrop(cropId: string): Promise<ApiResponse<CropConditionResponse>> {
    const response = await axiosInstance.get<ApiResponse<CropConditionResponse>>(`/api/v1/crops/${cropId}/condition`);
    return response.data;
  },

  async createCropConditionByCrop(cropId: string, request: CreateCropConditionRequest): Promise<ApiResponse<CropConditionResponse>> {
    const response = await axiosInstance.post<ApiResponse<CropConditionResponse>>(`/api/v1/crops/${cropId}/condition`, request);
    return response.data;
  },

  async deleteCropConditionByCrop(cropId: string, conditionId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/v1/crops/${cropId}/condition/${conditionId}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // CROP STAGES
  // ──────────────────────────────────────────────

  async getCropStageByCrop(cropId: string, page: number = 0, size: number = 100): Promise<ApiResponse<PageableResponse<CropStageResponse>>> {
    const response = await axiosInstance.get<ApiResponse<PageableResponse<CropStageResponse>>>(`/api/v1/crops/${cropId}/stages`, {
      params: { page, size }
    });
    return response.data;
  },

  async createCropStage(cropId: string, request: CreateCropStageRequest): Promise<ApiResponse<CropStageResponse>> {
    const response = await axiosInstance.post<ApiResponse<CropStageResponse>>(`/api/v1/crops/${cropId}/stages`, request);
    return response.data;
  },

  async updateCropStage(cropId: string, stageId: string, request: UpdateCropStageRequest): Promise<ApiResponse<CropStageResponse>> {
    const response = await axiosInstance.put<ApiResponse<CropStageResponse>>(`/api/v1/crops/${cropId}/stages/${stageId}`, request);
    return response.data;
  },

  async deleteCropStage(cropId: string, stageId: string): Promise<ApiResponse<void>> {
    // Note: User's backend API snippet shows @DeleteMapping("/{stageId}") which means /api/v1/crops/{cropId}/stages/{stageId}
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/v1/crops/${cropId}/stages/${stageId}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // DISEASES
  // ──────────────────────────────────────────────

  async getDiseasesByCrop(cropId: string): Promise<ApiResponse<DiseaseResponse[]>> {
    const response = await axiosInstance.get<ApiResponse<DiseaseResponse[]>>(`/api/v1/crops/${cropId}/diseases`);
    return response.data;
  },

  async getAllDiseases(page: number = 0, size: number = 100): Promise<ApiResponse<PageableResponse<DiseaseResponse>>> {
    const response = await axiosInstance.get<ApiResponse<PageableResponse<DiseaseResponse>>>('/api/v1/diseases', {
      params: { page, size }
    });
    return response.data;
  },

  async createDisease(request: CreateDiseaseRequest): Promise<ApiResponse<DiseaseResponse>> {
    const response = await axiosInstance.post<ApiResponse<DiseaseResponse>>('/api/v1/diseases', request);
    return response.data;
  },

  async updateDisease(diseaseId: string, request: CreateDiseaseRequest): Promise<ApiResponse<DiseaseResponse>> {
    const response = await axiosInstance.put<ApiResponse<DiseaseResponse>>(`/api/v1/diseases/${diseaseId}`, request);
    return response.data;
  },

  async deleteDisease(diseaseId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/v1/diseases/${diseaseId}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // CROP DISEASES (Assign/Remove)
  // ──────────────────────────────────────────────

  async assignDiseaseToCrop(cropId: string, diseaseId: string, isPrimary: boolean = false): Promise<ApiResponse<DiseaseResponse>> {
    const response = await axiosInstance.post<ApiResponse<DiseaseResponse>>(`/api/v1/crops/${cropId}/diseases/${diseaseId}`, null, {
      params: { isPrimary }
    });
    return response.data;
  },

  async removeDiseaseFromCrop(cropId: string, diseaseId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/v1/crops/${cropId}/diseases/${diseaseId}`);
    return response.data;
  }
};
