export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  user: string;
  createdAt: string;
  [key: string]: any;
}
