import React, { useState } from 'react';
import { Smartphone, RefreshCw, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export const MobileSimulatorView: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="card" style={{
        maxWidth: '850px',
        width: '100%',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Smartphone size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Live Mobile Phone Simulation
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Test the real Flutter Mobile application (Role Selector, Monitor, and Patient Code Login) directly inside this browser window.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
            title="Reload Phone View"
          >
            <RefreshCw size={15} />
            <span>Reload Phone</span>
          </button>

          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
            title="Open in new window"
          >
            <ExternalLink size={15} />
            <span>Open Standalone</span>
          </a>
        </div>
      </div>

      {/* Realistic Smartphone Frame Mockup */}
      <div style={{
        position: 'relative',
        width: '400px',
        height: '820px',
        backgroundColor: '#1E293B',
        borderRadius: '52px',
        padding: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 4px #0F172A',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Dynamic Island / Speaker Notch */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '24px',
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1E293B' }} />
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#334155' }} />
        </div>

        {/* Screen Iframe */}
        <div style={{
          flex: 1,
          width: '100%',
          height: '100%',
          borderRadius: '40px',
          overflow: 'hidden',
          backgroundColor: '#FFF7ED',
          position: 'relative'
        }}>
          <iframe
            key={iframeKey}
            src="http://localhost:8080"
            title="LL LifeLink Mobile Simulator"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '40px'
            }}
          />
        </div>

        {/* Bottom Home Indicator Bar */}
        <div style={{
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '130px',
            height: '4px',
            backgroundColor: '#64748B',
            borderRadius: '2px'
          }} />
        </div>
      </div>
    </div>
  );
};
