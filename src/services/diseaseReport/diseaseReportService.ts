import { axiosInstance } from "@/config/axios";
import { ApiResponse } from "@/types/auth";
import { PageableResponse } from "@/types/crop";
import { DiseaseReportResponse, CreateDiseaseReportRequest } from "@/types/diseaseReport/diseaseReport";

export const diseaseReportService = {
  async getDiseaseReports(
    page: number = 0,
    size: number = 10,
    sort: string[] = []
  ): Promise<ApiResponse<PageableResponse<DiseaseReportResponse>>> {
    const params: any = { page, size };
    if (sort && sort.length > 0) {
      params.sort = sort;
    }
    const response = await axiosInstance.get<ApiResponse<PageableResponse<DiseaseReportResponse>>>('/api/v1/disease-reports', {
      params
    });
    return response.data;
  },

  async createDiseaseReport(request: CreateDiseaseReportRequest): Promise<ApiResponse<DiseaseReportResponse>> {
    const response = await axiosInstance.post<ApiResponse<DiseaseReportResponse>>('/api/v1/disease-reports', request);
    return response.data;
  }
};
