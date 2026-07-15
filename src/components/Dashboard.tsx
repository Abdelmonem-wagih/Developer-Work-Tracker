import React from 'react';
import { useStats } from '../hooks/useStats';
import {
  Clock,
  Target,
  AlertTriangle,
  Users,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const KPICard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </div>
);

export const Dashboard = () => {
  const stats = useStats();

  if (!stats) return <div>Loading...</div>;

  const chartData = [
    { name: 'Focus', value: stats.focusTime },
    { name: 'Meetings', value: stats.meetingTime },
    { name: 'Blocked', value: stats.blockedTime },
    { name: 'Other', value: stats.totalTime - stats.focusTime - stats.meetingTime }
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#94a3b8'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Work Time"
          value={formatDuration(stats.totalTime)}
          icon={Clock}
          color="bg-blue-500"
          trend="+12%"
        />
        <KPICard
          title="Focus Time"
          value={formatDuration(stats.focusTime)}
          icon={Target}
          color="bg-purple-500"
          trend="+5%"
        />
        <KPICard
          title="Blocked Time"
          value={formatDuration(stats.blockedTime)}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KPICard
          title="Completed"
          value={stats.completedActivities}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Activity Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatDuration(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-sm font-medium">{d.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">{formatDuration(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Weekly Progress</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{day: 'Mon', h: 6}, {day: 'Tue', h: 8}, {day: 'Wed', h: 7}, {day: 'Thu', h: 5}, {day: 'Fri', h: 8}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="h" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
