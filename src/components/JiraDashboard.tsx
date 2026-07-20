import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  PlayCircle,
  LayoutGrid,
  List,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { useJira } from '../hooks/useJira';
import { JiraIssue } from '../types/jira';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { JiraIssueDetails } from './JiraIssueDetails';
import { ErrorBoundary } from './ErrorBoundary';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const JiraDashboard: React.FC = () => {
  const { issues, loading, error, syncIssues } = useJira();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    syncIssues();
    const interval = setInterval(() => {
      if (!document.hidden) syncIssues();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    return issues.filter(issue => {
      const matchesSearch =
        issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.project.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [issues, searchQuery, filterStatus]);

  const statuses = useMemo(() => {
    if (!issues) return [];
    return Array.from(new Set(issues.map(i => i.status)));
  }, [issues]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('closed') || s.includes('resolved')) return 'text-green-500 bg-green-500/10';
    if (s.includes('progress') || s.includes('dev') || s.includes('investigating')) return 'text-blue-500 bg-blue-500/10';
    if (s.includes('todo') || s.includes('open') || s.includes('backlog')) return 'text-gray-500 bg-gray-500/10';
    return 'text-orange-500 bg-orange-500/10';
  };

  const getPriorityIcon = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes('high') || p.includes('crit') || p.includes('blocker')) return <AlertCircle className="text-red-500" size={14} />;
    if (p.includes('medium')) return <PlayCircle className="text-orange-500" size={14} />;
    return <Circle className="text-blue-400" size={14} />;
  };

  if (selectedIssueKey) {
    return (
      <ErrorBoundary fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">Failed to load issue details</h2>
          <button onClick={() => setSelectedIssueKey(null)} className="px-4 py-2 bg-secondary rounded-lg">Back to Dashboard</button>
        </div>
      }>
        <JiraIssueDetails issueKey={selectedIssueKey} onBack={() => setSelectedIssueKey(null)} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jira Dashboard</h1>
          <p className="text-muted-foreground text-sm">Synchronized tasks and issue tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncIssues()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="h-8 w-[1px] bg-border mx-1" />
          <div className="flex bg-secondary/30 p-1 rounded-lg shadow-inner">
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search key, summary, or project..."
            className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <select
            className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle size={20} />
          <div className="flex-1">
            <p className="font-bold">Sync Error</p>
            <p className="opacity-90">{error}</p>
          </div>
          <button onClick={() => syncIssues()} className="px-3 py-1 bg-destructive/20 hover:bg-destructive/30 rounded-lg transition-colors font-medium">Retry</button>
        </div>
      )}

      {loading && !issues?.length ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-card/50 border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-card/30 border border-dashed rounded-2xl">
          <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-muted-foreground" size={32} />
          </div>
          <h3 className="text-lg font-bold">No issues found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your search or filters, or refresh to sync from Jira.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Key</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Summary</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.key}
                    className="hover:bg-secondary/20 cursor-pointer transition-colors group"
                    onClick={() => setSelectedIssueKey(issue.key)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-secondary px-2 py-1 rounded text-secondary-foreground">{issue.key}</span>
                        <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm line-clamp-1 font-bold">{issue.summary}</span>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{issue.project} • {issue.issueType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", getStatusColor(issue.status))}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold">
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
                      {formatDistanceToNow(new Date(issue.updated), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <motion.div
              layout
              key={issue.key}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedIssueKey(issue.key)}
              className="bg-card border rounded-3xl p-6 hover:border-primary/50 cursor-pointer transition-all shadow-sm hover:shadow-xl group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs font-bold bg-secondary px-2 py-1 rounded text-secondary-foreground">{issue.key}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(issue.status))}>
                  {issue.status}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-6 line-clamp-2 h-10 group-hover:text-primary transition-colors">{issue.summary}</h3>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-secondary/50">
                <div className="flex items-center gap-2">
                  {issue.assignee ? (
                    <img src={issue.assignee.avatarUrl} alt={issue.assignee.displayName} className="w-7 h-7 rounded-full border-2 border-background" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center border-2 border-background text-muted-foreground"><User size={14} /></div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold truncate max-w-[80px]">{issue.assignee?.displayName || 'Unassigned'}</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Assignee</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mb-1">
                    <Clock size={10} /> {formatDistanceToNow(new Date(issue.updated))}
                  </div>
                  <div className="flex items-center gap-1">
                    {getPriorityIcon(issue.priority)}
                    <span className="text-[9px] font-bold uppercase tracking-widest">{issue.priority}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
