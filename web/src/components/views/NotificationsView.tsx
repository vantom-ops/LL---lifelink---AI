import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { Bell, CheckCheck, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=50');
      if (res.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err: any) {
      console.error('[NotificationsView] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const socket = getSocket();
    const handleNotification = (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      // Ignored
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      // Ignored
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Care Alerts & Event Logs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time feed of doses taken, missed confirmations, emergency calls, and system alerts.
          </p>
        </div>
        <button onClick={handleMarkAllRead} className="btn btn-secondary">
          <CheckCheck size={16} />
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading notification history...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Bell size={42} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <div>No notifications yet. New events will appear here in real time.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(n => {
              let icon = <Info size={20} color="var(--primary)" />;
              if (n.type === 'PENDING_CONFIRMATION' || n.type === 'SENIOR_REQUESTED_CONTACT') {
                icon = <AlertTriangle size={20} color="var(--danger)" />;
              } else if (n.type === 'MEDICATION_TAKEN') {
                icon = <CheckCircle size={20} color="var(--success)" />;
              }

              return (
                <div
                  key={n._id}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: n.read ? '#FFFFFF' : 'var(--bg-warm)',
                    border: n.read ? '1px solid var(--border)' : '1.5px solid var(--primary-light)',
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: n.read ? 600 : 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.4 }}>
                      {n.body}
                    </p>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      marginTop: '6px'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
