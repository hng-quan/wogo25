import { User } from "./modal/user";

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

export interface FileItem  {
  id: number | string;
  fileName: string;
  fileType: string;
  fileUrl: string;
};

export interface JobRequest  {
  id: number | string;
  jobRequestCode: string;
  bookingDate: string; // ISO date string,
  latitude: number;
  longitude: number;
  distance: number;
  description: string;
  bookingAddress: string;
  estimatedPriceLower: number;
  estimatedPriceHigher: number;
  estimatedDurationMinutes: number;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED';
  files: FileItem[];
  user: User;
  workerQuotes: any[];
  service: ServiceType;
  acceptedBy?: any;
};