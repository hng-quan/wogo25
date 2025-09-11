export interface ServiceType {
  id: string | number;
  serviceName: string;
  description: string;
  iconUrl: string | null;
  parentId: number | null;
  active: boolean;
}

export interface ServiceGroup {
  parentService: ServiceType;
  childServices: ServiceType[];
}

export interface QuestionOption {
  id: number;
  optionText: string;
  orderIndex: number;
  questionId: number;
}

export interface Question {
  id: number;
  questionText: string;
  questionType: string; // 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  explanation: string;
  imageUrl: string | null;
  questionCategory: any;
  questionOptions: QuestionOption[];
}

export interface Professional {
  id: number;
  totalOrders: number;
  totalRevenue: number;
  worker: {
    id: number;
    description: string;
    totalJobs: number;
    totalReviews: number;
    averageRating: number;
  };
  service: {
    parentService: ServiceType;
    childServices: ServiceType[];
  };
  active: boolean;
}