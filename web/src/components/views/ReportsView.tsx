import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { BarChart3, TrendingUp, CheckCircle, Clock, AlertOctagon, Download } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { activeSenior } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!activeSenior) return;
    try {
      setLoading(true);
      const res = await api.get(`/reports/adherence/${activeSenior._id}?period=${period}`);
      if (res.success) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error('[ReportsView] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [activeSenior?._id, period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Medication Adherence Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Comprehensive adherence metrics, response timeliness, and health compliance trends.
          </p>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '0.4rem', background: '#FFFFFF', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.8rem',
                backgroundColor: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? '#FFFFFF' : 'var(--text-main)',
                border: 'none',
                textTransform: 'capitalize'
              }}
            >
              {p === 'day' ? 'Today' : p === 'week' ? 'Past 7 Days' : 'Past 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Computing adherence stats...
        </div>
      ) : stats ? (
        <>
          {/* Key Metric Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Taken on Time</span>
                <CheckCircle size={20} color="var(--success)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                {stats.takenPercentage}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {stats.takenCount} of {stats.totalScheduled} doses
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Taken Late (&gt;30m)</span>
                <Clock size={20} color="var(--warning)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                {stats.latePercentage}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {stats.lateCount} delayed doses
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Missed / Not Taken</span>
                <AlertOctagon size={20} color="var(--danger)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                {stats.missedPercentage}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {stats.missedCount} unconfirmed doses
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Overall Adherence</span>
                <TrendingUp size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
                {stats.takenPercentage + stats.latePercentage}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Combined compliance score
              </div>
            </div>
          </div>

          {/* Daily Trend Visualization */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Adherence Distribution</h3>

            {stats.dailyBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No events recorded for this period yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.dailyBreakdown.map((day: any) => {
                  const dayTotal = day.taken + day.late + day.missed + day.pending;
                  const takenPct = dayTotal > 0 ? (day.taken / dayTotal) * 100 : 0;
                  const latePct = dayTotal > 0 ? (day.late / dayTotal) * 100 : 0;
                  const missedPct = dayTotal > 0 ? (day.missed / dayTotal) * 100 : 0;

                  return (
                    <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '100px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>

                      {/* Stacked Bar */}
                      <div style={{
                        flex: 1,
                        height: '24px',
                        backgroundColor: 'var(--bg-warm)',
                        borderRadius: '6px',
                        display: 'flex',
                        overflow: 'hidden'
                      }}>
                        {takenPct > 0 && (
                          <div
                            style={{ width: `${takenPct}%`, backgroundColor: 'var(--success)' }}
                            title={`Taken: ${day.taken}`}
                          />
                        )}
                        {latePct > 0 && (
                          <div
                            style={{ width: `${latePct}%`, backgroundColor: 'var(--warning)' }}
                            title={`Late: ${day.late}`}
                          />
                        )}
                        {missedPct > 0 && (
                          <div
                            style={{ width: `${missedPct}%`, backgroundColor: 'var(--danger)' }}
                            title={`Missed: ${day.missed}`}
                          />
                        )}
                      </div>

                      <div style={{ width: '120px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {day.taken} taken, {day.missed} missed
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
