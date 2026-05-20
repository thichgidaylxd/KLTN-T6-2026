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
  diagnosisDetails?: DiagnosisResponse;
}

export interface CreateDiseaseReportRequest {
  plotId: string;
  cropId: string;
  locationNotes: string;
  description: string;
  imageUrl?: string;
}

export type DiagnosisSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DiagnosisStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface DiagnosisResponse {
  id: string;
  farmId: string;
  plotId: string;
  requestedById: string;
  diseaseName: string;
  severity: DiagnosisSeverity;
  confidence: number;
  treatment: string;
  alternatives: string;
  needsExpert: boolean;
  aiModel: string;
  status: DiagnosisStatus;
  createdAt: string;
  completedAt: string | null;
  deletedAt: string | null;
}
