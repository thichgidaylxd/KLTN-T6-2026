export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Geometry {
  type: string;
  coordinates: number[][][]; // GeoJSON format: [[[lng, lat], ...]]
}

export type PlotStatus = 'ACTIVE' | 'INACTIVE';

export interface Plot {
  id: string;
  version: number;
  name: string;
  areaHa: number;
  status: PlotStatus;
  description?: string;
  geometry?: Geometry;
  boundaries?: GeoPoint[]; // Keep for legacy/UI compatibility if needed
}

export interface CreatePlotRequest {
  plotName: string;
  geometry?: Geometry;
  description?: string;
}

export interface UpdatePlotRequest {
  version: number;
  name?: string;
  status?: PlotStatus;
  geometry?: Geometry;
  description?: string;
  isClearDescription?: boolean;
  isClearGeometry?: boolean;
}
