import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

function getToastVariant(type: string): 'success' | 'error' | 'warning' | 'info' {
  if (type === 'APPOINTMENT_CONFIRMED') return 'success';

  if (
    type === 'APPOINTMENT_CANCELLED' ||
    type === 'VACCINE_OVERDUE' ||
    type === 'INDICATOR_CRITICAL'
  ) {
    return 'error';
  }

  if (
    type === 'APPOINTMENT_REMINDER' ||
    type === 'VACCINE_DUE' ||
    type === 'EXAM_PENDING_EVALUATION' ||
    type === 'PATIENT_PRIORITY'
  ) {
    return 'warning';
  }

  return 'info';
}

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await api.get('/notifications', {
        params: { unreadOnly: true }
      });
      // Backend retorna { success, data: { notifications, unreadCount } }
      return response.data.data;
    },
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.unreadCount || 0;
}

export function useNotificationToasts() {
  const { data } = useNotifications();
  const initializedRef = useRef(false);
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unreadNotifications = data?.notifications || [];

    if (!initializedRef.current) {
      unreadNotifications.forEach((notification) => {
        shownNotificationIdsRef.current.add(notification.id);
      });
      initializedRef.current = true;
      return;
    }

    unreadNotifications.forEach((notification) => {
      if (shownNotificationIdsRef.current.has(notification.id)) {
        return;
      }

      const variant = getToastVariant(notification.type);
      const toastOptions = {
        toastId: `notification-${notification.id}`,
      };

      if (variant === 'success') {
        toast.success(notification.title, toastOptions);
      } else if (variant === 'error') {
        toast.error(notification.title, toastOptions);
      } else if (variant === 'warning') {
        toast.warning(notification.title, toastOptions);
      } else {
        toast.info(notification.title, toastOptions);
      }

      shownNotificationIdsRef.current.add(notification.id);
    });
  }, [data]);
}
