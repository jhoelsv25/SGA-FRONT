export type CommunicationType = 'email' | 'sms' | 'notification' | 'announcement' | 'other';
export type CommunicationStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export type Communication = {
  id: string;
  subject: string;
  body?: string;
  type: CommunicationType;
  status: CommunicationStatus;
  sentAt?: string;
  recipientCount?: number;
  createdAt?: string;
  createdBy?: string;
};

export type CommunicationCreate = {
  subject: string;
  body?: string;
  type: CommunicationType;
  recipientIds?: string[];
  scheduledAt?: string;
};

export type CommunicationUpdate = Partial<CommunicationCreate>;

export type CommunicationResponse = {
  data: Communication;
  message: string;
};

export type CommunicationsListResponse = {
  data: Communication[];
  message?: string;
};
