import { useCallback, useEffect, useState, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ShoppingBag, CreditCard, Tag, Info, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EmptyState from '@/components/shared/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from '@/lib/customerOrders';
import type { Notification } from '@/types';

const typeConfig: Record<string, { icon: ElementType; bg: string; iconColor: string }> = {
  order_update: { icon: ShoppingBag, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
  quotation: { icon: ShoppingBag, bg: 'bg-violet-50', iconColor: 'text-violet-600' },
  payment: { icon: CreditCard, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  promotion: { icon: Tag, bg: 'bg-pink-50', iconColor: 'text-pink-600' },
  system: { icon: Info, bg: 'bg-neutral-100', iconColor: 'text-neutral-500' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rows = await fetchCustomerNotifications(user.id);
      setNotifications(rows);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      void loadNotifications();
    }
  }, [authLoading, loadNotifications]);

  useEffect(() => {
    const handleUpdated = () => {
      void loadNotifications();
    };

    window.addEventListener('shop2bhutan:notifications-updated', handleUpdated);
    window.addEventListener('focus', handleUpdated);

    return () => {
      window.removeEventListener('shop2bhutan:notifications-updated', handleUpdated);
      window.removeEventListener('focus', handleUpdated);
    };
  }, [loadNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;

    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );

      try {
        await markCustomerNotificationRead(notification.id, user.id);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    }

    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;

    setMarkingAll(true);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

    try {
      await markAllCustomerNotificationsRead(user.id);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      setError(err instanceof Error ? err.message : 'Unable to mark notifications as read.');
      void loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-8">
        <EmptyState
          icon={<Bell size={40} className="text-neutral-300" />}
          title="Sign in to view notifications"
          description="Quotation updates and payment alerts will appear here after you sign in."
          action={{ label: 'Sign In', onClick: () => navigate('/login') }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft size={22} className="text-neutral-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
              {unreadCount > 0 && <p className="text-xs text-amber-600">{unreadCount} unread</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadNotifications} className="p-2" aria-label="Refresh notifications">
              <RefreshCw size={18} className={`text-neutral-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-amber-600 font-medium disabled:opacity-60"
              >
                {markingAll ? 'Marking...' : 'Mark All Read'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 rounded-xl bg-white animate-pulse" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="divide-y divide-neutral-100 bg-white">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;
            const createdAt = notification.createdAt ? new Date(notification.createdAt) : new Date();

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors ${
                  !notification.isRead ? 'bg-amber-50/30 border-l-[3px] border-l-amber-500' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={config.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {Number.isNaN(createdAt.getTime())
                      ? 'Recently'
                      : formatDistanceToNow(createdAt, { addSuffix: true })}
                  </p>
                </div>
                {!notification.isRead && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={40} className="text-neutral-300" />}
          title="No notifications"
          description="Quotation updates, payment alerts, and order updates will appear here."
        />
      )}
    </div>
  );
}
