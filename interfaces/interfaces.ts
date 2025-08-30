export interface ServiceType {
  id: string | number;
  serviceName: string;
  description: string;
  iconUrl: string | null;
  parentId: number;
  active: boolean;
}
