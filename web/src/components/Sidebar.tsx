import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Pill,
  FolderArchive,
  BarChart3,
  BellRing,
  Settings,
  UserCheck,
  History,
  QrCode,
  ShieldCheck,
  Heart,
  HeartHandshake,
  Activity,
  Award,
  ShieldAlert
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'care_circle'
  | 'assistance'
  | 'professionals'
  | 'seniors'
  | 'profiles'
  | 'medications'
  | 'prescriptions'
  | 'documents'
  | 'history'
  | 'reports'
  | 'doctor_qr'
  | 'privacy'
  | 'admin_portal'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const menuItems: Array<{ id: TabType; label: string; icon: any; badge?: string }> = [
  { id: 'dashboard', label: 'Live Dashboard', icon: LayoutDashboard },
  { id: 'care_circle', label: 'Care Circle', icon: HeartHandshake, badge: 'Phase 2' },
  { id: 'assistance', label: 'Disability Help', icon: ShieldAlert, badge: 'Live' },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'prescriptions', label: 'Prescriptions & OCR', icon: FileText },
  { id: 'documents', label: 'Medical Documents', icon: FolderArchive },
  { id: 'seniors', label: 'Senior Overview', icon: Users },
  { id: 'profiles', label: 'Profiles & Caregiver', icon: UserCheck },
  { id: 'professionals', label: 'Professional Network', icon: Award },
  { id: 'history', label: 'Medication History', icon: History },
  { id: 'reports', label: 'Adherence Reports', icon: BarChart3 },
  { id: 'doctor_qr', label: 'Doctor QR', icon: QrCode },
  { id: 'admin_portal', label: 'Admin Verifications', icon: Activity },
  { id: 'privacy', label: 'Privacy & Sharing', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const MobileTabBar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav
      className="mobile-tab-bar"
      style={{
        overflowX: 'auto',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        padding: '0.6rem 0.75rem',
        gap: '0.45rem',
        whiteSpace: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: isActive ? 'var(--primary-light)' : '#F9FAFB',
              color: isActive ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: isActive ? 800 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Icon size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--border)',
      minHeight: 'calc(100vh - 65px)',
      padding: '1.25rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      flexShrink: 0
    }}>
      <div style={{ padding: '0 0.75rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.05em' }}>
        CAREGIVER DASHBOARD
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                  backgroundColor: item.badge === 'Live' ? '#FEE2E2' : '#FFF0DE',
                  color: item.badge === 'Live' ? '#DC2626' : 'var(--primary)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', padding: '1rem 0.5rem 0', borderTop: '1px solid var(--border)' }}>
        <a
          href="/doctor-access"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--bg-warm)',
            border: '1px solid rgba(255,122,0,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            marginBottom: '0.75rem'
          }}
        >
          <QrCode size={16} />
          Doctor Access Portal ↗
        </a>

        <div style={{
          backgroundColor: 'var(--bg-warm)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4
        }}>
          <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
            Phase 1 Active
          </strong>
          Senior & Caregiver Profiles • Doctor QR Security Engine.
        </div>
      </div>
    </aside>
  );
};
