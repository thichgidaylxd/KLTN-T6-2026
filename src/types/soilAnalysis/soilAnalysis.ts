export type SoilAnalysisJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

export interface SoilAnalysisJob {
  id: string;
  soilRecordId?: string;

  status: SoilAnalysisJobStatus;

  error?: string;

  fileUrl: string;

  sampledAt: string;

  createdAt: string;
  updatedAt?: string;

  result?: string;

  plot?: {
    id: string;
    name?: string;
  };
}

export interface SubmitSoilAnalysisRequest {
  plotId: string;
  farmId: string;
  sampledAt: string;
  fileUrl: string;
}

export interface SubmitSoilAnalysisResponse {
  jobId: string;
  status: SoilAnalysisJobStatus;
  pollUrl: string;
}