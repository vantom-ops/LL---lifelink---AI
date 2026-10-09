import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { getSocket } from '../utils/socket';
import { 
  Heart, 
  Bell, 
  Phone, 
  Zap, 
  QrCode, 
  User, 
  LogOut, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenPairingModal: () => void;
  onOpenNotifications: () => void;
  appMode?: 'monitor' | 'patient';
  onSetAppMode?: (mode: 'monitor' | 'patient') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenPairingModal, 
  onOpenNotifications,
  appMode = 'monitor',
  onSetAppMode
}) => {
  const { user, seniors, activeSenior, setActiveSenior, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchUnread();
    const socket = getSocket();

    const handleNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);

  const handleSimulateTimeout = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post('/demo/simulate-timeout', {
        patientId: activeSenior?._id
      });
      setSimulationToast(`Escalation Check: ${res.data.escalatedCount} overdue alert(s) dispatched to caregivers!`);
      setTimeout(() => setSimulationToast(null), 4000);
      fetchUnread();
    } catch (err: any) {
      alert('Escalation watchdog error: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 4px 10px rgba(255, 122, 0, 0.35)'
        }}>
          <Heart size={24} fill="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              LL LifeLink
            </span>
            <span style={{ 
              fontSize: '0.68rem', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              padding: '2px 8px', 
              borderRadius: '999px',
              fontWeight: 700 
            }}>
              CARE DASHBOARD
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Senior Medication & Health Protection
          </div>
        </div>
      </div>

      {/* Dual Mode Switcher Pill */}
      {onSetAppMode && (
        <div style={{
          display: 'flex',
          backgroundColor: '#F3F4F6',
          padding: '4px',
          borderRadius: '999px',
          border: '1.5px solid var(--border)',
          gap: '4px'
        }}>
          <button
            onClick={() => onSetAppMode('monitor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: appMode === 'monitor' ? 'var(--primary)' : 'transparent',
              color: appMode === 'monitor' ? '#FFFFFF' : 'var(--text-muted)',
              boxShadow: appMode === 'monitor' ? '0 2px 8px rgba(255, 122, 0, 0.35)' : 'none'
            }}
          >
            <span>🛡️</span>
            <span>1. Monitor</span>
          </button>
          <button
            onClick={() => onSetAppMode('patient')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: appMode === 'patient' ? '#16A34A' : 'transparent',
              color: appMode === 'patient' ? '#FFFFFF' : 'var(--text-muted)',
              boxShadow: appMode === 'patient' ? '0 2px 8px rgba(22, 163, 74, 0.35)' : 'none'
            }}
          >
            <span>👵</span>
            <span>2. Patient</span>
          </button>
        </div>
      )}

      {/* Senior Switcher & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Active Senior Selector */}
        {seniors.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-warm)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Senior:</span>
            <select
              value={activeSenior?._id || ''}
              onChange={(e) => {
                const found = seniors.find(s => s._id === e.target.value);
                if (found) setActiveSenior(found);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {seniors.map(s => (
                <option key={s._id} value={s._id}>
                  {s.preferredName || s.fullName} ({s.age} yrs)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pair Phone Button */}
        <button
          onClick={onOpenPairingModal}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          title="Pair Senior Device"
        >
          <QrCode size={16} color="var(--primary)" />
          <span>Pair Phone</span>
        </button>

        {/* Watchdog Trigger Button */}
        <button
          onClick={handleSimulateTimeout}
          disabled={isSimulating}
          className="btn"
          style={{
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FCD34D',
            fontSize: '0.85rem',
            padding: '0.5rem 0.9rem',
            fontWeight: 700
          }}
          title="Run instantaneous timeout watchdog check on unconfirmed medication events"
        >
          <Zap size={16} />
          <span>{isSimulating ? 'Processing...' : 'Run Escalation Check'}</span>
        </button>

        {/* Call Senior Direct Button */}
        {activeSenior?.emergencyContactPhone && (
          <a
            href={`tel:${activeSenior.emergencyContactPhone}`}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <Phone size={16} />
            <span>Call Senior</span>
          </a>
        )}

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)'
          }}
          title="Notifications"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'var(--danger)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '0.7rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.4rem'
            }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Simulation Feedback Toast */}
      {simulationToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1E293B',
          color: '#FFFFFF',
          padding: '0.9rem 1.4rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.92rem',
          fontWeight: 600
        }}>
          <AlertTriangle color="var(--warning)" size={20} />
          <span>{simulationToast}</span>
        </div>
      )}
    </header>
  );
};
