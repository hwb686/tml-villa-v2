import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, Package, XCircle, Star, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationApi, Notification } from '@/services/api';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

// 获取通知类型对应的图标
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'order_confirmed':
      return <Package className="h-4 w-4 text-green-500" />;
    case 'order_cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'review_reminder':
      return <Star className="h-4 w-4 text-yellow-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

// 格式化时间
function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取未读数量
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;
      
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  // 获取通知列表
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;
      
      const res = await notificationApi.getAll({ limit: 20 });
      setNotifications(res.data.list);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // 标记单条已读
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // 标记全部已读
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // 删除通知
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const notification = notifications.find(n => n.id === id);
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // 点击通知
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationApi.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    onNotificationClick?.(notification);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 定时刷新未读数量
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  // 打开下拉时获取列表
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const token = localStorage.getItem('userToken');
  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知铃铛按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h3 className="font-medium">消息通知</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500 hover:text-gray-700"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  全部已读
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 通知列表 */}
          <ScrollArea className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                加载中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm">暂无通知</span>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-3 cursor-pointer hover:bg-gray-50 transition-colors',
                      !notification.isRead && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex gap-3">
                      {/* 图标 */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            !notification.isRead && 'text-gray-900',
                            notification.isRead && 'text-gray-600'
                          )}>
                            {notification.title}
                          </p>
                          <span className="flex-shrink-0 text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              已读
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                            onClick={(e) => handleDelete(notification.id, e)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                      
                      {/* 未读标记 */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* 底部 */}
          {notifications.length > 0 && (
            <div className="p-2 border-t bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500"
                onClick={() => {
                  setIsOpen(false);
                  window.location.hash = '/user?tab=notifications';
                }}
              >
                查看全部通知
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
