export type DiseaseReportStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface DiseaseReportResponse {
  id: string;
  diagnosisId: string | null;
  status: DiseaseReportStatus | string;
  plot: {
    id: string;
    name: string;
    status: string;
  };
  crop: {
    id: string;
    name: string;
    version: number;
    cropType: {
      id: string;
      name: string;
      description: string;
    };
    scope: string;
    clonedFromId: string | null;
    imageUrl: string | null;
    description: string;
  };
  locationNotes: string;
  affectedPercent: number;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface CreateDiseaseReportRequest {
  plotId: string;
  cropId: string;
  locationNotes: string;
  description: string;
  imageUrl?: string;
}
