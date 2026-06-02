"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  HelpCircle, 
  HandHeart, 
  User, 
  Loader2,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  stats: {
    totalRegistrations: number;
    totalRevenue: number;
    pendingApprovals: number;
    activeSegments: number;
  };
  additionalInfo: {
    totalUsers: number;
    unpaidRegistrations: number;
    totalSponsors: number;
    totalFAQ: number;
  };
  registrationTrends: Array<{ name: string; registrations: number }>;
  recentActivities: Array<{
    id: number;
    title: string;
    desc: string;
    time: string;
    icon: string;
    color: string;
  }>;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  CalendarIcon,
  HelpCircle,
  HandHeart,
  User,
};

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function AdminDashboardPage() {
  const { isDark, mounted } = useResolvedTheme();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please check your database connection or try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const cardBg = isDark ? 'bg-[#111116] border-white/[0.07]' : 'bg-white border-black/[0.08]';
  const textColor = isDark ? 'text-[#F5F5F0]' : 'text-[#1a1a14]';
  const mutedText = isDark ? 'text-[#9A9A8E]' : 'text-[#4a4a40]';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#588157]" />
        <p className={mutedText}>Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 max-w-md mx-auto text-center px-4">
        <div className={`p-4 rounded-full ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-500/10 text-red-600'}`}>
          <AlertCircle className="w-12 h-12" />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${textColor} mb-2`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Error Loading Dashboard
          </h3>
          <p className={`${mutedText} text-sm`}>
            {error || 'Failed to fetch dashboard data.'}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2.5 rounded-lg font-semibold bg-[#3a5a40] text-white hover:bg-[#344e41] transition-all shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, additionalInfo, registrationTrends, recentActivities } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-full px-4 sm:px-0">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${textColor} mb-2`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Overview</h1>
          <p className={`${mutedText} text-sm sm:text-base`}>Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <button className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-semibold transition-all shadow-[0_2px_12px_rgba(0,0,0,0.15)] text-center ${
          isDark ? 'bg-[#3a5a40] text-[#F5F5F0] hover:bg-[#344e41]' : 'bg-[#3a5a40] text-white hover:bg-[#344e41]'
        }`}>
          Download Report
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'total-reg', label: 'Total Registrations', value: stats.totalRegistrations.toLocaleString(), icon: Users, color: 'text-blue-500' },
          { id: 'total-rev', label: 'Total Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-[#588157]' },
          { id: 'pending-app', label: 'Pending Approvals', value: stats.pendingApprovals.toLocaleString(), icon: AlertCircle, color: 'text-amber-500' },
          { id: 'active-seg', label: 'Active Segments', value: stats.activeSegments.toLocaleString(), icon: CheckCircle, color: 'text-purple-500' },
        ].map((stat) => (
          <div key={stat.id} className={`p-6 rounded-2xl border ${cardBg} transition-all hover:-translate-y-1`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className={`${mutedText} text-sm font-medium mb-1`}>{stat.label}</p>
              <h3 className={`text-2xl sm:text-3xl font-bold ${textColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Platform Info Grid */}
      <div className="space-y-4">
        <h2 className={`text-lg font-bold ${textColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Platform Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'total-users', label: 'Total Users', value: additionalInfo.totalUsers.toLocaleString(), icon: User, color: 'text-indigo-400' },
            { id: 'unpaid-reg', label: 'Unpaid Registrations', value: additionalInfo.unpaidRegistrations.toLocaleString(), icon: Clock, color: 'text-rose-400' },
            { id: 'total-sponsors', label: 'Sponsors & Partners', value: additionalInfo.totalSponsors.toLocaleString(), icon: HandHeart, color: 'text-emerald-400' },
            { id: 'faq-articles', label: 'FAQ Articles', value: additionalInfo.totalFAQ.toLocaleString(), icon: HelpCircle, color: 'text-teal-400' },
          ].map((info) => (
            <div key={info.id} className={`p-5 rounded-xl border ${cardBg} flex items-center gap-4`}>
              <div className={`p-2.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'} ${info.color} shrink-0`}>
                <info.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`${mutedText} text-xs font-medium`}>{info.label}</p>
                <h4 className={`text-lg sm:text-xl font-bold ${textColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{info.value}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart & Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0">
        {/* Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBg} min-w-0`}>
          <div className="mb-6">
            <h3 className={`text-xl font-bold ${textColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Registration Trends</h3>
            <p className={`${mutedText} text-sm`}>New user signups over the past 7 days</p>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrends} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
                  <XAxis dataKey="name" stroke={isDark ? "#888" : "#666"} tick={{ fill: isDark ? "#888" : "#666" }} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? "#888" : "#666"} tick={{ fill: isDark ? "#888" : "#666" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0A0A0F' : '#fff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: '8px',
                      color: isDark ? '#fff' : '#000'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke={isDark ? "#588157" : "#3a5a40"}
                    strokeWidth={3}
                    dot={{ r: 4, fill: isDark ? "#0A0A0F" : "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: isDark ? "#588157" : "#3a5a40" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
          <div className="mb-6 flex justify-between items-center">
            <h3 className={`text-xl font-bold ${textColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent Activity</h3>
            <button className="text-[#588157] hover:text-[#a3b18a] text-sm font-medium">View all</button>
          </div>
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-1">
            {recentActivities.map((activity) => {
              const ActivityIcon = ICON_MAP[activity.icon] || AlertCircle;
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 ${activity.color}`}>
                    <ActivityIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${textColor} text-sm truncate`}>{activity.title}</p>
                    <p className={`${mutedText} text-xs mt-0.5 break-words`}>{activity.desc}</p>
                    <p className={`${mutedText} text-[10px] mt-1 opacity-75`}>{formatRelativeTime(activity.time)}</p>
                  </div>
                </div>
              );
            })}
            {recentActivities.length === 0 && (
              <p className={`text-center ${mutedText} text-sm py-12`}>No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}