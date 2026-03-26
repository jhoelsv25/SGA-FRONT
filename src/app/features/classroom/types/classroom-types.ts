export interface ClassroomFeedAuthor {
  id?: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface ClassroomFeedComment {
  id: string;
  content: string;
  date: string;
  author: ClassroomFeedAuthor;
}

export interface ClassroomFeedItem {
  id: string;
  type: 'post' | 'assignment' | 'material';
  title?: string;
  content: string;
  date: string;
  author: ClassroomFeedAuthor;
  metadata: {
    attachments?: { url: string; name: string }[];
    [key: string]: unknown;
  };
  commentsCount: number;
  comments?: ClassroomFeedComment[];
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
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}
