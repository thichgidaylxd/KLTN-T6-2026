export interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedDays: number;
  category:
    | 'WATERING'
    | 'FERTILIZING'
    | 'PEST_CONTROL'
    | 'PRUNING'
    | 'HARVESTING'
    | 'SOIL'
    | 'OTHER';
}