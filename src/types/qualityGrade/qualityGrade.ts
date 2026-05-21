export interface QualityGrade {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  orderIndex?: number | null;
  createdAt: string;
}