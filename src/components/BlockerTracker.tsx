import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Plus, Trash2, Calendar, Clock, AlertCircle, BookOpen, StickyNote } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

const TEAMS = ['Backend', 'Frontend', 'QA', 'DevOps', 'Design', 'Client', 'Management', 'Other'];
const IMPACTS = ['Low', 'Medium', 'High', 'Critical'] as const;

export const BlockerTracker = () => {
  const [team, setTeam] = useState(TEAMS[0]);
  const [reason, setReason] = useState('');
  const [impact, setImpact] = useState<typeof IMPACTS[number]>('Medium');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const now = new Date();
  const [startDate, setStartDate] = useState(now.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(now.toTimeString().slice(0, 5));
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState(now.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState('0h 0m');

  const blockers = useLiveQuery(() => db.blockers.orderBy('startTime').reverse().toArray());

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
    if (!reason.trim()) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffSec = Math.floor((end.getTime() - start.getTime()) / 1000);

    try {
      await db.blockers.add({
        team,
        reason,
        impact,
        description,
        notes,
        startTime: start,
        endTime: end,
        duration: diffSec,
      });

      // Reset form
      setReason('');
      setDescription('');
      setNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBlocker = async (id: number) => {
    if (confirm('Are you sure you want to delete this blocker?')) {
      await db.blockers.delete(id);
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
          <AlertCircle className="text-red-500" /> Report New Blocker
        </h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Reason / Title</label>
                <input
                  type="text"
                  placeholder="What is blocking you?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Team</label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                  >
                    {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Impact</label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(e.target.value as any)}
                    className="bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20"
                  >
                    {IMPACTS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
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
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold uppercase text-red-500/60">Blocked Duration</span>
                <span className="text-3xl font-mono font-bold text-red-500">{duration}</span>
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
                placeholder="Detailed description of the blocker..."
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
              className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Report Blocker
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Blocker History</h3>
          <div className="space-y-4">
            {blockers?.map(blocker => (
              <div key={blocker.id} className="group relative bg-secondary/20 rounded-2xl p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        blocker.impact === 'Critical' ? 'bg-red-100 text-red-600' :
                        blocker.impact === 'High' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {blocker.impact}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{blocker.team}</span>
                    </div>
                    <h4 className="font-bold text-lg">{blocker.reason}</h4>
                    {blocker.description && <p className="text-sm text-muted-foreground mt-1">{blocker.description}</p>}
                  </div>

                  <div className="flex flex-col md:items-end shrink-0 gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span>{formatDate(blocker.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={14} />
                      <span>{formatTime(blocker.startTime)} - {blocker.endTime ? formatTime(blocker.endTime) : '?'}</span>
                    </div>
                    <div className="text-xl font-mono font-bold text-red-500">
                      {formatDuration(blocker.duration || 0)}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteBlocker(blocker.id!)}
                    className="absolute top-4 right-4 md:static p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {(!blockers || blockers.length === 0) && (
              <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-2xl">
                No blockers reported. Great work!
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl">
               <span className="text-sm">Total Blockers</span>
               <span className="font-semibold">{blockers?.length || 0}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl">
               <span className="text-sm">Total Blocked Time</span>
               <span className="font-semibold text-red-600">
                 {formatDuration(blockers?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0)}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
