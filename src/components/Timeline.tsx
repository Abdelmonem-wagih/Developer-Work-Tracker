import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, Tag } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  'Feature Development': 'bg-blue-500',
  'Bug Fix': 'bg-red-500',
  'Refactoring': 'bg-purple-500',
  'Testing': 'bg-yellow-500',
  'Meeting': 'bg-emerald-500',
  'Documentation': 'bg-cyan-500',
  'Research': 'bg-indigo-500',
  'Other': 'bg-slate-500'
};

export const Timeline = () => {
  const activities = useLiveQuery(() =>
    db.activities.orderBy('startTime').reverse().toArray()
  );

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="relative border-l-2 border-muted ml-4 pl-8 space-y-12">
        {activities?.map((activity, index) => (
          <div key={activity.id} className="relative">
            <div className={`absolute -left-[41px] w-6 h-6 rounded-full border-4 border-background flex items-center justify-center ${activity.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}>
              {activity.status === 'completed' ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={10} className="text-white fill-current" />}
            </div>

            <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[activity.type] || 'bg-slate-500'}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{activity.type}</span>
                  </div>
                  <h3 className="text-xl font-bold">{activity.taskName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-medium">
                    {format(new Date(activity.startTime), 'HH:mm')} - {activity.endTime ? format(new Date(activity.endTime), 'HH:mm') : 'Active'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                    <Clock size={12} />
                    {formatDuration(activity.duration)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center mt-6 pt-6 border-t">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                  <span className="text-muted-foreground">Project:</span>
                  <span>{activity.project}</span>
                </div>
                {activity.priority && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    activity.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                    activity.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.priority}
                  </div>
                )}
                {activity.tags?.map(tag => (
                  <div key={tag} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag size={12} />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {activities?.length === 0 && (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <p className="text-muted-foreground">No activities recorded yet. Time to get to work!</p>
          </div>
        )}
      </div>
    </div>
  );
};
