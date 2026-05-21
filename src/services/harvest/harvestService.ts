import { axiosInstance } from '@/config/axios';
import { ApiResponse } from '@/types/auth';
import { PageableResponse } from '@/types/crop';
import {
  HarvestResponse,
  CreateHarvestRequest,
  UpdateHarvestRequest,
  HarvestFilterRequest,
  HarvestSummaryResponse,
  SeasonComparisonResponse,
  SeasonSummaryResponse,
  MaterialCostDetail,
  LaborCostDetail,
} from '@/types/harvest/harvest';

export const harvestService = {
  // ── Single harvest ──────────────────────────────────────────
  async getHarvestDetail(
    farmId: string,
    planId: string,
    harvestId: string
  ): Promise<ApiResponse<HarvestResponse>> {
    const response = await axiosInstance.get<ApiResponse<HarvestResponse>>(
      `/api/v1/farms/${farmId}/plans/${planId}/harvests/${harvestId}`
    );
    return response.data;
  },

  async createHarvest(
    farmId: string,
    planId: string,
    request: CreateHarvestRequest
  ): Promise<ApiResponse<HarvestResponse>> {
    const response = await axiosInstance.post<ApiResponse<HarvestResponse>>(
      `/api/v1/farms/${farmId}/plans/${planId}/harvests`,
      request
    );
    return response.data;
  },

  async updateHarvest(
    farmId: string,
    planId: string,
    harvestId: string,
    request: UpdateHarvestRequest
  ): Promise<ApiResponse<HarvestResponse>> {
    const response = await axiosInstance.put<ApiResponse<HarvestResponse>>(
      `/api/v1/farms/${farmId}/plans/${planId}/harvests/${harvestId}`,
      request
    );
    return response.data;
  },

  // ── Harvests by plan ────────────────────────────────────────
  async getHarvestsByPlan(
    farmId: string,
    planId: string,
    filter?: HarvestFilterRequest,
    pageable?: { page: number; size: number; sort: string[] }
  ): Promise<ApiResponse<PageableResponse<HarvestResponse>>> {
    const params: Record<string, unknown> = {};
    if (filter) Object.assign(params, filter);
    if (pageable) {
      params.page = pageable.page ?? 0;
      params.size = pageable.size ?? 10;
      if (pageable.sort?.length) params.sort = pageable.sort;
    }
    const response = await axiosInstance.get<ApiResponse<PageableResponse<HarvestResponse>>>(
      `/api/v1/farms/${farmId}/plans/${planId}/harvests`,
      { params }
    );
    return response.data;
  },

  async getHarvestSummaryByPlan(
    farmId: string,
    planId: string
  ): Promise<ApiResponse<HarvestSummaryResponse[]>> {
    const response = await axiosInstance.get<ApiResponse<HarvestSummaryResponse[]>>(
      `/api/v1/farms/${farmId}/plans/${planId}/harvests/summary`
    );
    return response.data;
  },

  // ── Harvests by stage ───────────────────────────────────────
  async getHarvestsByStage(
    farmId: string,
    planId: string,
    stageId: string,
    pageable?: { page: number; size: number; sort: string[] }
  ): Promise<ApiResponse<PageableResponse<HarvestResponse>>> {
    const params: Record<string, unknown> = {};
    if (pageable) {
      params.page = pageable.page ?? 0;
      params.size = pageable.size ?? 10;
      if (pageable.sort?.length) params.sort = pageable.sort;
    }
    const response = await axiosInstance.get<ApiResponse<PageableResponse<HarvestResponse>>>(
      `/api/v1/farms/${farmId}/plans/${planId}/stages/${stageId}/harvests`,
      { params }
    );
    return response.data;
  },

  async getHarvestSummaryByStage(
    farmId: string,
    planId: string,
    stageId: string
  ): Promise<ApiResponse<HarvestSummaryResponse[]>> {
    const response = await axiosInstance.get<ApiResponse<HarvestSummaryResponse[]>>(
      `/api/v1/farms/${farmId}/plans/${planId}/stages/${stageId}/harvests/summary`
    );
    return response.data;
  },

  // ── Harvests by plot ────────────────────────────────────────
  async getHarvestsByPlot(
    farmId: string,
    planId: string,
    plotId: string,
    pageable?: { page: number; size: number; sort: string[] }
  ): Promise<ApiResponse<PageableResponse<HarvestResponse>>> {
    const params: Record<string, unknown> = {};
    if (pageable) {
      params.page = pageable.page ?? 0;
      params.size = pageable.size ?? 10;
      if (pageable.sort?.length) params.sort = pageable.sort;
    }
    const response = await axiosInstance.get<ApiResponse<PageableResponse<HarvestResponse>>>(
      `/api/v1/farms/${farmId}/plans/${planId}/plots/${plotId}/harvests`,
      { params }
    );
    return response.data;
  },

  async getHarvestSummaryByPlot(
    farmId: string,
    planId: string,
    plotId: string
  ): Promise<ApiResponse<HarvestSummaryResponse[]>> {
    const response = await axiosInstance.get<ApiResponse<HarvestSummaryResponse[]>>(
      `/api/v1/farms/${farmId}/plans/${planId}/plots/${plotId}/harvests/summary`
    );
    return response.data;
  },

  // ── Harvests by farm ────────────────────────────────────────
  async getHarvestsByFarm(
    farmId: string,
    fromDate?: string,
    toDate?: string,
    pageable?: { page: number; size: number; sort: string[] }
  ): Promise<ApiResponse<PageableResponse<HarvestResponse>>> {
    const params: Record<string, unknown> = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate)   params.toDate   = toDate;
    if (pageable) {
      params.page = pageable.page ?? 0;
      params.size = pageable.size ?? 10;
      if (pageable.sort?.length) params.sort = pageable.sort;
    }
    const response = await axiosInstance.get<ApiResponse<PageableResponse<HarvestResponse>>>(
      `/api/v1/farms/${farmId}/harvests`,
      { params }
    );
    return response.data;
  },

  // ── Reports ─────────────────────────────────────────────────
  async getSeasonSummary(
    farmId: string,
    planId: string
  ): Promise<ApiResponse<SeasonSummaryResponse>> {
    const response = await axiosInstance.get<ApiResponse<SeasonSummaryResponse>>(
      `/api/v1/farms/${farmId}/plans/${planId}/reports/season-summary`
    );
    return response.data;
  },

  async getMaterialCost(
    farmId: string,
    planId: string
  ): Promise<ApiResponse<MaterialCostDetail>> {
    const response = await axiosInstance.get<ApiResponse<MaterialCostDetail>>(
      `/api/v1/farms/${farmId}/plans/${planId}/reports/material-cost`
    );
    return response.data;
  },

  async getLaborCost(
    farmId: string,
    planId: string
  ): Promise<ApiResponse<LaborCostDetail>> {
    const response = await axiosInstance.get<ApiResponse<LaborCostDetail>>(
      `/api/v1/farms/${farmId}/plans/${planId}/reports/labor-cost`
    );
    return response.data;
  },

  async compareSeasons(
    farmId: string,
    planIds: string[]
  ): Promise<ApiResponse<SeasonComparisonResponse>> {
    const response = await axiosInstance.post<ApiResponse<SeasonComparisonResponse>>(
      `/api/v1/farms/${farmId}/reports/seasons/compare`,
      planIds
    );
    return response.data;
  },
};