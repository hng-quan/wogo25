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
