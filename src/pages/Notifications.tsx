import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Filter, AlertCircle, Calendar, FlaskConical, Syringe, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

const notificationIcons: Record<string, any> = {
  APPOINTMENT_REMINDER: Calendar,
  APPOINTMENT_CONFIRMED: Calendar,
  APPOINTMENT_CANCELLED: Calendar,
  EXAM_RESULT_READY: FlaskConical,
  EXAM_PENDING_EVALUATION: FlaskConical,
  VACCINE_DUE: Syringe,
  VACCINE_OVERDUE: Syringe,
  INDICATOR_CRITICAL: Activity,
  HOME_VISIT_SCHEDULED: Calendar,
  PATIENT_PRIORITY: AlertCircle,
};

const notificationColors: Record<string, string> = {
  APPOINTMENT_REMINDER: 'var(--primary)',
  APPOINTMENT_CONFIRMED: 'var(--success)',
  APPOINTMENT_CANCELLED: 'var(--danger)',
  EXAM_RESULT_READY: 'var(--accent)',
  EXAM_PENDING_EVALUATION: 'var(--accent)',
  VACCINE_DUE: 'var(--primary)',
  VACCINE_OVERDUE: 'var(--danger)',
  INDICATOR_CRITICAL: 'var(--danger)',
  HOME_VISIT_SCHEDULED: 'var(--primary)',
  PATIENT_PRIORITY: 'var(--accent)',
};

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const params = filter === 'unread' ? { unreadOnly: true } : {};
      const response = await api.get('/notifications', { params });
      // Backend retorna { success, data: { notifications, unreadCount } }
      return response.data.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Carregando notificações..." />;
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '600', 
            color: 'var(--text)',
            marginBottom: '0.5rem'
          }}>
            Notificações
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas as notificações lidas'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setFilter('all')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Filter size={16} />
              Todas
            </button>
            <button
              className={`btn ${filter === 'unread' ? 'btn-primary' : ''}`}
              onClick={() => setFilter('unread')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Bell size={16} />
              Não Lidas
            </button>
          </div>

          {/* Marcar todas como lidas */}
          {unreadCount > 0 && (
            <button
              className="btn"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckCheck size={16} />
              Marcar Todas como Lidas
            </button>
          )}
        </div>
      </div>

      {/* Lista de Notificações */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          description={filter === 'unread' ? 'Todas as suas notificações foram lidas' : 'Você não tem notificações ainda'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notification: Notification, index: number) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const color = notificationColors[notification.type] || 'var(--primary)';

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  backgroundColor: notification.read ? 'white' : 'var(--background)',
                  borderLeft: `4px solid ${color}`,
                  position: 'relative',
                }}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Ícone */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: `${color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} style={{ color }} />
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: notification.read ? '500' : '600',
                        color: 'var(--text)'
                      }}>
                        {notification.title}
                      </h3>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        marginLeft: '1rem'
                      }}>
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p style={{ 
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {notification.message}
                    </p>

                    {/* Badge de não lida */}
                    {!notification.read && (
                      <div style={{ 
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: color,
                        }} />
                        <span style={{ 
                          fontSize: '0.75rem',
                          color: color,
                          fontWeight: '500'
                        }}>
                          Não lida
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botão de marcar como lida */}
                  {!notification.read && (
                    <button
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      style={{
                        padding: '0.5rem',
                        minWidth: 'auto',
                        flexShrink: 0,
                      }}
                      title="Marcar como lida"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
