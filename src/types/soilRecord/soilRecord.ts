import { Plot } from '@/types/plot/plot';


export interface SoilRecord {
  id: string;
  plot: Plot;
  sampledAt: string; // LocalDate as ISO string "YYYY-MM-DD"
  ph?: number;
  nitrogenMgKg?: number;
  phosphorusMgKg?: number;
  potassiumMgKg?: number;
  moisturePercent?: number;
  notes?: string;
  sourceFileUrl?: string;
  lockedAt?: string;
  createdAt: string;
}

export interface CreateSoilRecordRequest {
  sampledAt: string;
  ph?: number;
  nitrogenMgKg?: number;
  phosphorusMgKg?: number;
  potassiumMgKg?: number;
  moisturePercent?: number;
  notes?: string;
  sourceFileUrl?: string;
  plotId: string;
}

export interface UpdateSoilRecordRequest {
  isLocked?: boolean;
  sampledAt: string;
  ph?: number;
  nitrogenMgKg?: number;
  phosphorusMgKg?: number;
  potassiumMgKg?: number;
  moisturePercent?: number;
  notes?: string;
  sourceFileUrl?: string;
}

export interface PresignedUploadRequest {
  fileName: string;
  contentType: string;
  folder: 'soil-records';
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}