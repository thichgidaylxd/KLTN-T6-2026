import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';

import { QualityGrade } from '../../types/qualityGrade';

export const qualityGradeService = {
  async getQualityGrades(): Promise<ApiResponse<QualityGrade[]>> {
    const res = await axiosInstance.get('/api/v1/quality-grades');
    return res.data;
  },
};