export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  clientName: string;
  clientId: string;
  groupId?: string;
  uploadDate: string;
  status: 'approved' | 'pending' | 'rejected';
  metadata?: {
    [key: string]: any;
  };
} 