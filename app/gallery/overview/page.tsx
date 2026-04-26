'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Image as ImageIcon, Target, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import TrendChart from '@/components/TrendChart';

interface Session {
  id: string;
  created_at: string;
  completion_time: number | null;
  neglect_ratio: number | null;
  tremor_index: number | null;
  ai_insight: string | null;
  quadrant_data: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  } | null;
}

interface StatsData {
  totalSessions: number;
  totalImages: number;
  averageNeglectRatio: number | null;
  averageTremorIndex: number | null;
  averageCompletionTime: number | null;
  sessions: Session[];
  trends: {
    neglectRatio: { date: string; value: number }[];
    tremorIndex: { date: string; value: number }[];
    activityByDate: { date: string; count: number }[];
    quadrantActivity?: {
      date: string;
      topLeft: number;
      topRight: number;
      bottomLeft: number;
      bottomRight: number;
    }[];
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentColor,
  paleBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
  paleBg: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all hover:shadow-md"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(35,27,19,0.06)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: paleBg }}
      >
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-light)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: accentColor, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</p>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, accentColor, children }: {
  title: string;
  icon: React.ElementType;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(35,27,19,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────── */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(250,248,245,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/gallery')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
              background: 'var(--cream-deep)',
              color: 'var(--ink-mid)',
              border: '1px solid var(--border)',
              fontSize: '14px',
              minHeight: '40px',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Gallery
          </button>

          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Overview
          </h1>

          <div className="w-24" />
        </div>
      </header>

      {/* ── Content ────────────────────────────── */}
      <main className="flex-1 px-5 py-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--cream-border)', borderTopColor: 'var(--sky)' }}
              />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading statistics…</p>
            </div>
          ) : (
            <>
              {/* ── Stat Cards ─────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={BarChart3}
                  label="Sessions"
                  value={String(stats?.totalSessions ?? 0)}
                  accentColor="var(--sky)"
                  paleBg="var(--sky-pale)"
                />
                <StatCard
                  icon={ImageIcon}
                  label="Artworks"
                  value={String(stats?.totalImages ?? 0)}
                  accentColor="var(--sage)"
                  paleBg="var(--sage-pale)"
                />
                <StatCard
                  icon={Target}
                  label="Avg Neglect"
                  value={stats?.averageNeglectRatio != null
                    ? stats.averageNeglectRatio.toFixed(2)
                    : '—'}
                  sub={stats?.averageNeglectRatio != null
                    ? (stats.averageNeglectRatio < 0.3
                        ? 'Left neglect detected'
                        : stats.averageNeglectRatio > 0.7
                          ? 'Right bias'
                          : 'Balanced')
                    : undefined}
                  accentColor="var(--terracotta)"
                  paleBg="var(--terracotta-pale)"
                />
                <StatCard
                  icon={Activity}
                  label="Avg Tremor"
                  value={stats?.averageTremorIndex != null
                    ? stats.averageTremorIndex.toFixed(2)
                    : '—'}
                  sub={stats?.averageTremorIndex != null
                    ? (stats.averageTremorIndex > 0.5 ? 'Higher tremor' : 'Stable')
                    : undefined}
                  accentColor="var(--rose)"
                  paleBg="var(--rose-pale)"
                />
              </div>

              {/* ── Charts ─────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard title="Neglect Ratio Trend" icon={Target} accentColor="var(--terracotta)">
                  <TrendChart
                    data={stats?.trends.neglectRatio ?? []}
                    color="var(--terracotta)"
                    label="Left-sided neglect (lower = more neglect)"
                    minValue={0}
                    maxValue={1}
                  />
                </SectionCard>

                <SectionCard title="Tremor Index Trend" icon={Activity} accentColor="var(--rose)">
                  <TrendChart
                    data={stats?.trends.tremorIndex ?? []}
                    color="var(--rose)"
                    label="Motor stability (lower = more stable)"
                  />
                </SectionCard>
              </div>

              {/* ── Quadrant Distribution ──────── */}
              {stats?.trends.quadrantActivity && stats.trends.quadrantActivity.length > 0 && (() => {
                const latest = stats.trends.quadrantActivity[stats.trends.quadrantActivity.length - 1];
                if (!latest) return null;
                return (
                  <SectionCard title="Quadrant Distribution" icon={BarChart3} accentColor="var(--sky)">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Top-Left', value: latest.topLeft, color: 'var(--terracotta)', pale: 'var(--terracotta-pale)' },
                        { label: 'Top-Right', value: latest.topRight, color: 'var(--sky)', pale: 'var(--sky-pale)' },
                        { label: 'Bottom-Left', value: latest.bottomLeft, color: 'var(--sage)', pale: 'var(--sage-pale)' },
                        { label: 'Bottom-Right', value: latest.bottomRight, color: 'var(--rose)', pale: 'var(--rose-pale)' },
                      ].map(q => (
                        <div
                          key={q.label}
                          className="rounded-xl p-4 text-center"
                          style={{ background: q.pale }}
                        >
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>{q.label}</p>
                          <p className="text-2xl font-bold" style={{ color: q.color, fontFamily: 'var(--font-display)' }}>
                            {q.value.toFixed(1)}%
                          </p>
                          {/* Progress bar */}
                          <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                            <div
                              className="h-1 rounded-full transition-all"
                              style={{ width: `${q.value}%`, background: q.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                );
              })()}

              {/* ── Activity Over Time ──────────── */}
              {stats?.trends.activityByDate && stats.trends.activityByDate.length > 0 && (
                <SectionCard title="Activity Over Time" icon={TrendingUp} accentColor="var(--sage)">
                  <TrendChart
                    data={stats.trends.activityByDate.map(d => ({ date: d.date, value: d.count }))}
                    color="var(--sage)"
                    label="Sessions per day"
                    minValue={0}
                  />
                </SectionCard>
              )}

              {/* ── Bottom Grid ─────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Recent Sessions */}
                <SectionCard title="Recent Sessions" icon={Clock} accentColor="var(--sky)">
                  <div className="space-y-3">
                    {stats?.sessions && stats.sessions.length > 0 ? (
                      stats.sessions.slice(0, 8).map((session) => (
                        <div
                          key={session.id}
                          className="rounded-xl p-3.5"
                          style={{
                            background: 'var(--cream-deep)',
                            border: '1px solid var(--cream-deeper)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                                {formatDate(session.created_at)}
                              </p>
                              {session.neglect_ratio !== null && (
                                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                  Neglect ratio: {Number(session.neglect_ratio).toFixed(3)}
                                </p>
                              )}
                              {session.quadrant_data && (
                                <div className="text-xs mt-1 grid grid-cols-4 gap-1" style={{ color: 'var(--muted-light)' }}>
                                  <span>TL {session.quadrant_data.topLeft.toFixed(0)}%</span>
                                  <span>TR {session.quadrant_data.topRight.toFixed(0)}%</span>
                                  <span>BL {session.quadrant_data.bottomLeft.toFixed(0)}%</span>
                                  <span>BR {session.quadrant_data.bottomRight.toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                            {session.completion_time !== null && (
                              <div className="text-right shrink-0">
                                <p className="text-xs" style={{ color: 'var(--muted-light)' }}>Duration</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--sky)' }}>
                                  {formatDuration(session.completion_time)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>No sessions recorded yet</p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Summary Statistics */}
                <SectionCard title="Summary" icon={BarChart3} accentColor="var(--sage)">
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Average Completion Time',
                        value: stats?.averageCompletionTime != null
                          ? formatDuration(stats.averageCompletionTime)
                          : 'N/A',
                        color: 'var(--sky)',
                      },
                      {
                        label: 'Total Sessions',
                        value: `${stats?.totalSessions ?? 0} sessions`,
                        color: 'var(--sage)',
                      },
                      {
                        label: 'Total Artworks',
                        value: `${stats?.totalImages ?? 0} images`,
                        color: 'var(--peach)',
                      },
                      {
                        label: 'Average Neglect Ratio',
                        value: stats?.averageNeglectRatio != null
                          ? stats.averageNeglectRatio.toFixed(3)
                          : 'N/A',
                        color: 'var(--terracotta)',
                      },
                      {
                        label: 'Average Tremor Index',
                        value: stats?.averageTremorIndex != null
                          ? stats.averageTremorIndex.toFixed(3)
                          : 'N/A',
                        color: 'var(--rose)',
                      },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: 'var(--cream-deep)', border: '1px solid var(--cream-deeper)' }}
                      >
                        <p className="text-sm font-medium" style={{ color: 'var(--ink-mid)' }}>{item.label}</p>
                        <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
