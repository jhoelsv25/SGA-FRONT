export interface ClassroomFeedItem {
  id: string;
  type: 'post' | 'assignment' | 'material';
  title: string;
  content: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  metadata: {
    attachments?: { url: string; name: string }[];
    [key: string]: unknown;
  };
  commentsCount: number;
}

export interface ClassroomPost {
  id: string;
  content: string;
  date: string;
  authorId: string;
  sectionCourseId: string;
  attachments?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}
