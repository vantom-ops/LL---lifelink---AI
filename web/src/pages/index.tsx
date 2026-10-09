import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar, MobileTabBar, TabType } from '../components/Sidebar';
import { DashboardView } from '../components/views/DashboardView';
import { SeniorManagementView } from '../components/views/SeniorManagementView';
import { SeniorProfileView } from '../components/views/SeniorProfileView';
import { CaregiverProfileView } from '../components/views/CaregiverProfileView';
import { PrescriptionUploadView } from '../components/views/PrescriptionUploadView';
import { MedicationManagementView } from '../components/views/MedicationManagementView';
import { DocumentManagementView } from '../components/views/DocumentManagementView';
import { ReportsView } from '../components/views/ReportsView';
import { NotificationsView } from '../components/views/NotificationsView';
import { SettingsView } from '../components/views/SettingsView';
import { SeniorPatientWebView } from '../components/views/SeniorPatientWebView';
import { CareCircleView } from '../components/views/CareCircleView';
import { AssistanceMonitoringView } from '../components/views/AssistanceMonitoringView';
import { ProfessionalCaregiverPortalView } from '../components/views/ProfessionalCaregiverPortalView';
import { AdminVerificationView } from '../components/views/AdminVerificationView';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [appMode, setAppMode] = useState<'monitor' | 'patient'>('monitor');
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [profileSubTab, setProfileSubTab] = useState<'senior' | 'caregiver'>('senior');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
        fontWeight: 700
      }}>
        Loading LL LifeLink Caregiver Workspace...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        appMode={appMode}
        onSetAppMode={setAppMode}
        onOpenPairingModal={() => {
          setAppMode('monitor');
          setCurrentTab('seniors');
        }}
        onOpenNotifications={() => {
          setAppMode('monitor');
          setCurrentTab('notifications');
        }}
      />

      {appMode === 'patient' ? (
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <SeniorPatientWebView onSwitchToMonitor={() => setAppMode('monitor')} />
        </main>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <MobileTabBar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

          <div style={{ display: 'flex', flex: 1 }}>
            <div className="desktop-sidebar">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => setCurrentTab(tab)}
              />
            </div>

            <main className="main-content-area" style={{ flex: 1, padding: '1.5rem', maxWidth: '1400px', width: '100%' }}>
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenSeniorProfile={() => setCurrentTab('profiles')}
              onNavigateToProfessionals={() => setCurrentTab('professionals')}
            />
          )}
          {currentTab === 'seniors' && <SeniorManagementView onOpenSeniorProfile={() => setCurrentTab('profiles')} />}
          
          {currentTab === 'profiles' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  className={`btn ${profileSubTab === 'senior' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setProfileSubTab('senior')}
                  style={{ fontWeight: 700 }}
                >
                  Grandmother / Grandfather Profile
                </button>
                <button
                  className={`btn ${profileSubTab === 'caregiver' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setProfileSubTab('caregiver')}
                  style={{ fontWeight: 700 }}
                >
                  Caregiver Profile (Son / Daughter)
                </button>
              </div>

              {profileSubTab === 'senior' ? (
                <SeniorProfileView onNavigateToTab={(t) => setCurrentTab(t as TabType)} />
              ) : (
                <CaregiverProfileView
                  onOpenSeniorProfile={() => setProfileSubTab('senior')}
                  onOpenPairingModal={() => setCurrentTab('seniors')}
                />
              )}
            </div>
          )}

          {currentTab === 'care_circle' && <CareCircleView />}
          {currentTab === 'assistance' && <AssistanceMonitoringView />}
          {currentTab === 'professionals' && <ProfessionalCaregiverPortalView />}
          {currentTab === 'admin_portal' && <AdminVerificationView />}

          {currentTab === 'medications' && <MedicationManagementView />}
          {currentTab === 'prescriptions' && <PrescriptionUploadView />}
          {currentTab === 'documents' && <DocumentManagementView />}
          {currentTab === 'history' && <SeniorProfileView initialTab="history" />}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'doctor_qr' && <SeniorProfileView initialTab="doctor_qr" />}
          {currentTab === 'privacy' && <SeniorProfileView initialTab="privacy" />}
          {currentTab === 'notifications' && <NotificationsView />}
          {currentTab === 'settings' && <SettingsView />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
