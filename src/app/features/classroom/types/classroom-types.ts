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

export interface ChatCursorResponse {
  data: ChatMessage[];
  nextCursor: { date: string; id: string } | null;
  hasNext: boolean;
}

export interface FeedCursorResponse {
  data: ClassroomFeedItem[];
  nextCursor: { date: string; id: string } | null;
  hasNext: boolean;
}

export interface ChatInboxItem {
  id: string;
  roomId: string;
  sectionCourseId: string;
  name: string;
  avatar?: string | null;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount: number;
  online: boolean;
  route: string;
  type: string;
}

export interface ChatInboxCursorResponse {
  data: ChatInboxItem[];
  nextCursor: { date: string; id: string } | null;
  hasNext: boolean;
}
