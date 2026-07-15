import React, { useState, useEffect } from 'react';
import { db, ActivityType, Priority } from '../db';
import { Plus, Trash2, Calendar, Clock, BookOpen, StickyNote } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

const ACTIVITY_TYPES: ActivityType[] = [
  'Feature Development', 'Bug Fix', 'Refactoring', 'Testing',
  'Code Review', 'Documentation', 'Deployment', 'Research',
  'Meeting', 'Waiting', 'Break', 'Other'
];


const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const ActivityTracker = () => {
  const [taskName, setTaskName] = useState('');
  const [project, setProject] = useState('');
  const [type, setType] = useState<ActivityType>('Feature Development');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const now = new Date();
  const [startDate, setStartDate] = useState(now.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(now.toTimeString().slice(0, 5));
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState(now.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState('0h 0m');

  const activities = useLiveQuery(
    () => db.activities.orderBy('startTime').reverse().toArray()
  );

  useEffect(() => {
    calculateDuration();
  }, [startDate, startTime, endDate, endTime]);

  const calculateDuration = () => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) {
      setDuration('Invalid Range');
      return;
    }

    const diffSec = Math.floor(diffMs / 1000);
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    setDuration(`${h}h ${m}m`);
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffSec = Math.floor((end.getTime() - start.getTime()) / 1000);

    try {
      await db.activities.add({
        taskName,
        project: project || 'General',
        type,
        priority,
        description,
        notes,
        status: 'completed',
        startTime: start,
        endTime: end,
        duration: diffSec,
        tags: [],
      });

      // Reset form
      setTaskName('');
      setProject('');
      setDescription('');
      setNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteActivity = async (id: number) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      await db.activities.delete(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-2xl p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Plus className="text-primary" /> Log New Activity
        </h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Task Name</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Project</label>
                  <input
                    type="text"
                    placeholder="Project name"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                  >
                    {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} /> Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} /> End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold uppercase text-primary/60">Calculated Duration</span>
                <span className="text-3xl font-mono font-bold text-primary">{duration}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <BookOpen size={12} /> Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the task..."
                rows={3}
                className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <StickyNote size={12} /> Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or links..."
                rows={3}
                className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus size={20} /> Save Activity
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Activity History</h3>
          <div className="space-y-4">
            {activities?.map(activity => (
              <div key={activity.id} className="group relative bg-secondary/20 rounded-2xl p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                        {activity.type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        activity.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                        activity.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {activity.priority}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{activity.project}</span>
                    </div>
                    <h4 className="font-bold text-lg">{activity.taskName}</h4>
                    {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                  </div>

                  <div className="flex flex-col md:items-end shrink-0 gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span>{formatDate(activity.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={14} />
                      <span>{formatTime(activity.startTime)} - {activity.endTime ? formatTime(activity.endTime) : '?'}</span>
                    </div>
                    <div className="text-xl font-mono font-bold text-primary">
                      {formatDuration(activity.duration || 0)}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteActivity(activity.id!)}
                    className="absolute top-4 right-4 md:static p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-2xl">
                No activities logged yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
               <span className="text-sm">Total Tasks</span>
               <span className="font-semibold">{activities?.length || 0}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
               <span className="text-sm">Total Time</span>
               <span className="font-semibold">
                 {formatDuration(activities?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0)}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
