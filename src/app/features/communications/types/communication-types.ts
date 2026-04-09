export type CommunicationType = 'email' | 'sms' | 'notification' | 'announcement' | 'other';
export type CommunicationStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'read' | 'unread';
export type CommunicationAudience = 'students' | 'teachers' | 'guardians' | 'all';

export type Communication = {
  id: string;
  subject: string;
  body?: string;
  type: CommunicationType;
  status: CommunicationStatus;
  audience?: CommunicationAudience;
  sectionId?: string | null;
  sectionName?: string | null;
  sentAt?: string;
  recipientCount?: number;
  createdAt?: string;
  createdBy?: string;
};

export type CommunicationCreate = {
  subject: string;
  body?: string;
  type: CommunicationType;
  audience: CommunicationAudience;
  status: 'draft' | 'published';
  sectionId?: string | null;
  recipientIds?: string[];
  scheduledAt?: string;
  attachmentUrl?: string;
  priority?: 'low' | 'medium' | 'high';
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
