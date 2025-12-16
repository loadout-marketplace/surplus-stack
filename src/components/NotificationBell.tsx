import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCelebrationModal } from './BadgeCelebrationModal';

const BADGE_NOTIFICATION_TYPES = [
  'badge_trusted_seller',
  'badge_power_seller',
  'badge_top_rated',
  'badge_verified_business',
];

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean;
    badgeType: string;
    link?: string;
  }>({ isOpen: false, badgeType: '' });

  const handleNotificationClick = (notification: any) => {
    // Check if this is a badge notification that hasn't been read yet
    if (BADGE_NOTIFICATION_TYPES.includes(notification.type) && !notification.is_read) {
      setCelebrationModal({
        isOpen: true,
        badgeType: notification.type,
        link: notification.link,
      });
    } else if (notification.link) {
      navigate(notification.link);
    }
    markAsRead(notification.id);
  };

  const handleCelebrationClose = () => {
    setCelebrationModal({ isOpen: false, badgeType: '' });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-1 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="relative">
                  <DropdownMenuItem
                    className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${
                      !notification.is_read ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex w-full justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <BadgeCelebrationModal
        isOpen={celebrationModal.isOpen}
        onClose={handleCelebrationClose}
        badgeType={celebrationModal.badgeType}
        link={celebrationModal.link}
      />
    </>
  );
};