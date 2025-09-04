export interface ServiceType {
  id: string | number;
  serviceName: string;
  description: string;
  iconUrl: string | null;
  parentId: number;
  active: boolean;
}

export interface ServiceGroup {
  parentService: ServiceType;
  childServices: ServiceType[];
}

